#!/usr/bin/env python3
"""
Tarifas dos postos de carregamento da rede MOBI.E, para o PoupeJá.

Corre num GitHub Action (ver .github/workflows/tarifas-ev.yml), não no
Vercel: os dois feeds DATEX II do MOBI.E são grandes (~180 MB o inventário,
~40 MB o estado) e não cabem nos 60 s de uma função do Vercel.

Fontes (NAP Portugal / IMT, conjuntos 148 e 149, "Livre acesso"; citar
"MOBI.E / NAP Portugal"):
  - evChargingInfra  → postos, coordenadas, operador, potência dos pontos
  - evActualStatus   → estado e tarifas (rates) de cada ponto

O que sai daqui é só o que a app precisa para estimar o custo de um
carregamento: por posto, as coordenadas, o operador e, por ponto, a
potência, o tipo de corrente e a tarifa do operador (OPC):
€/kWh, €/min e €/sessão. Fica numa única linha da tabela tarifas_ev do
Supabase; a rota /api/ev lê-a e junta-a aos postos da TomTom pela
proximidade.

Atenção ao significado da tarifa: no MOBI.E a tarifa OPC é a taxa de
utilização do posto, NÃO o preço da energia. O comercializador (CEME) de
quem carrega soma a energia, as redes e as taxas. A app trata isto à parte.

Só usa a biblioteca padrão do Python (corre num runner limpo sem pip).

Uso:
  python3 scripts/tarifas_ev.py                    # descarrega e envia
  python3 scripts/tarifas_ev.py --infra a.xml --status b.xml --saida x.json
                                                   # ficheiros locais, sem envio
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

INFRA_URLS = [
    "https://pgm.mobie.pt/integration/nap/evChargingInfra",
    "https://ev-nap.mobie.pt/integration/nap/evChargingInfra",
]
STATUS_URLS = [
    "https://pgm.mobie.pt/integration/nap/evActualStatus",
    "https://ev-nap.mobie.pt/integration/nap/evActualStatus",
]
USER_AGENT = "PoupeJa/1.0 (tarifas EV; dados abertos MOBI.E / NAP Portugal)"

# Políticas de preço do DATEX II → campo do ponto
POLITICAS = {
    "pricePerDeliveryUnit": "kwh",   # €/kWh
    "pricePerChargingTime": "min",   # €/min
    "flatRate": "sessao",            # €/carregamento
}

# Limites de sanidade. Há pontos com 3,00 €/min no feed — quase de certeza
# €/h publicado como €/min. Um preço destes estragava a comparação inteira,
# por isso fica de fora em vez de ser mostrado.
LIMITES = {"kwh": 2.0, "min": 1.0, "sessao": 20.0}

# Estados que querem dizer "este ponto já não existe" — a tarifa não interessa.
ESTADOS_IGNORADOS = {"removed"}


# ─── auxiliares de XML (independentes do namespace) ─────────────────────────

def ln(tag) -> str:
    return tag.rsplit("}", 1)[-1] if isinstance(tag, str) else ""


def filho(el, nome):
    if el is None:
        return None
    for c in el:
        if ln(c.tag) == nome:
            return c
    return None


def desc(el, nome):
    if el is None:
        return None
    for d in el.iter():
        if d is not el and ln(d.tag) == nome:
            return d
    return None


def texto(el):
    if el is None or el.text is None:
        return None
    return el.text.strip() or None


def valor(el):
    """Texto multilingue (values/value) ou texto simples."""
    if el is None:
        return None
    v = desc(el, "value")
    return texto(v) if v is not None else texto(el)


def numero(s):
    try:
        return float(s) if s is not None else None
    except ValueError:
        return None


# ─── leitura em streaming ───────────────────────────────────────────────────

def abrir(urls_ou_ficheiro):
    """Devolve um objeto com .read(n): ficheiro local ou resposta HTTP."""
    if isinstance(urls_ou_ficheiro, str):
        return open(urls_ou_ficheiro, "rb")
    ultimo = None
    for url in urls_ou_ficheiro:
        for tentativa in range(3):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/xml"})
                return urllib.request.urlopen(req, timeout=180)
            except (urllib.error.URLError, TimeoutError, OSError) as e:
                ultimo = e
                print(f"  {url}: falhou ({e}), tentativa {tentativa + 1}/3", flush=True)
                time.sleep(5 * (tentativa + 1))
    raise RuntimeError(f"não foi possível descarregar o feed: {ultimo}")


def percorrer(fonte, tratar, rotulo):
    """Lê o XML aos bocados e chama tratar(el) em cada elemento fechado.

    tratar devolve True quando consumiu o elemento, que é então limpo para
    a memória não crescer com o ficheiro.
    """
    parser = ET.XMLPullParser(events=("end",))
    publicado = None
    lidos, t0 = 0, time.time()
    with abrir(fonte) as f:
        while True:
            bloco = f.read(1 << 16)
            if not bloco:
                break
            parser.feed(bloco)
            lidos += len(bloco)
            for _, el in parser.read_events():
                if publicado is None and ln(el.tag) == "publicationTime":
                    publicado = texto(el)
                elif tratar(el):
                    el.clear()
            if lidos % (20 << 20) < (1 << 16):
                print(f"  {rotulo}: {lidos >> 20} MB ({time.time() - t0:.0f}s)", flush=True)
    parser.close()
    for _, el in parser.read_events():
        if tratar(el):
            el.clear()
    print(f"  {rotulo}: {lidos >> 20} MB lidos em {time.time() - t0:.0f}s", flush=True)
    return publicado


# ─── inventário ─────────────────────────────────────────────────────────────

def ler_inventario(fonte):
    """{site_id: {lat, lon, op, pontos: {point_id: (kw, corrente)}}}"""
    sites = {}

    def tratar(el):
        if ln(el.tag) != "energyInfrastructureSite":
            return False
        lat = numero(texto(desc(el, "latitude")))
        lon = numero(texto(desc(el, "longitude")))
        if lat is None or lon is None:
            return True
        op = filho(el, "operator")
        pontos = {}
        for rp in (d for d in el.iter() if ln(d.tag) == "refillPoint"):
            kw, dc = 0.0, False
            for c in rp:
                if ln(c.tag) != "connector":
                    continue
                w = numero(texto(filho(c, "maxPowerAtSocket")))
                if w:
                    kw = max(kw, w / 1000)
                modo = texto(filho(c, "chargingMode")) or ""
                tipo = texto(filho(c, "connectorType")) or ""
                if "DC" in modo or "COMBO" in tipo.upper() or tipo.lower() == "chademo":
                    dc = True
            pid = rp.get("id")
            if pid:
                pontos[pid] = (round(kw, 1), "DC" if dc else "AC")
        sites[el.get("id")] = {
            "lat": round(lat, 5),
            "lon": round(lon, 5),
            "op": ((valor(filho(op, "name")) or "").strip() or None) if op is not None else None,
            "pontos": pontos,
        }
        return True

    publicado = percorrer(fonte, tratar, "inventário")
    return sites, publicado


# ─── estado + tarifas ───────────────────────────────────────────────────────

def tarifa_do_ponto(rp, agora_iso):
    """{kwh, min, sessao} em vigor agora, a partir dos electricEnergyMixOverride.

    No feed real há um <rates> por cada override; na dúvida procuramos os
    campos por descendência, o que serve as duas formas.
    """
    t = {}
    inicio_de = {}
    for mix in rp:
        if ln(mix.tag) != "electricEnergyMixOverride":
            continue
        pol = texto(desc(mix, "pricingPolicy"))
        campo = POLITICAS.get(pol or "")
        if not campo:
            continue
        moeda = texto(desc(mix, "applicableCurrency"))
        if moeda and moeda.upper() != "EUR":
            continue
        inicio = texto(desc(mix, "overallStartTime")) or ""
        fim = texto(desc(mix, "overallEndTime")) or ""
        if inicio and inicio[:19] > agora_iso[:19]:
            continue
        if fim and fim[:19] <= agora_iso[:19]:
            continue
        v = numero(texto(desc(mix, "minimumDeliveryFee")))
        if v is None or v < 0 or v > LIMITES[campo]:
            continue
        # Várias linhas para a mesma política: fica a que começou mais tarde.
        if campo not in t or inicio >= inicio_de[campo]:
            t[campo] = round(v, 4)
            inicio_de[campo] = inicio
    return t


def ler_estado(fonte, agora_iso):
    """{"site|ponto": {kwh, min, sessao}} — só pontos com tarifa."""
    tarifas = {}
    site = [None]

    def tratar(el):
        nome = ln(el.tag)
        if nome == "reference" and site[0] is None:
            # O primeiro <reference> de cada energyInfrastructureSiteStatus é o
            # site; os ids de ponto só são únicos dentro do site.
            site[0] = el.get("id")
            return False
        if nome == "energyInfrastructureSiteStatus":
            site[0] = None
            return True
        if nome != "refillPointStatus":
            return False
        ref = filho(el, "reference")
        pid = ref.get("id") if ref is not None else el.get("id")
        estado = texto(filho(el, "status"))
        if pid and site[0] and estado not in ESTADOS_IGNORADOS:
            t = tarifa_do_ponto(el, agora_iso)
            if t:
                tarifas[f"{site[0]}|{pid}"] = t
        return True

    publicado = percorrer(fonte, tratar, "estado")
    return tarifas, publicado


# ─── junção ─────────────────────────────────────────────────────────────────

def juntar(sites, tarifas):
    """Lista compacta: [lat, lon, operador, [[kw, corrente, kwh, min, sessao], ...]].

    Pontos iguais (mesma potência, corrente e tarifa) no mesmo posto
    aparecem uma vez só — é o que a comparação precisa e corta o tamanho.
    """
    saida = []
    for sid, s in sites.items():
        vistos = set()
        pontos = []
        for pid, (kw, corrente) in s["pontos"].items():
            t = tarifas.get(f"{sid}|{pid}")
            if not t:
                continue
            linha = (kw, corrente, t.get("kwh", 0), t.get("min", 0), t.get("sessao", 0))
            if linha in vistos:
                continue
            vistos.add(linha)
            pontos.append(list(linha))
        if pontos:
            pontos.sort(key=lambda p: (p[1], p[0]))
            saida.append([s["lat"], s["lon"], s["op"], pontos])
    return saida


# ─── envio para o Supabase ──────────────────────────────────────────────────

def enviar(linha):
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    chave = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not chave:
        raise RuntimeError("faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY")
    corpo = json.dumps(linha, separators=(",", ":")).encode()
    req = urllib.request.Request(
        url.rstrip("/") + "/rest/v1/tarifas_ev?on_conflict=id",
        data=corpo,
        method="POST",
        headers={
            "apikey": chave,
            "Authorization": f"Bearer {chave}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        print(f"  Supabase: HTTP {r.status}, {len(corpo) >> 10} KB", flush=True)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--infra", help="ficheiro local do inventário (em vez de descarregar)")
    ap.add_argument("--status", help="ficheiro local do estado (em vez de descarregar)")
    ap.add_argument("--saida", help="escrever o JSON neste ficheiro em vez de enviar")
    ap.add_argument("--agora", help="instante ISO para escolher tarifas (testes)")
    args = ap.parse_args(argv)

    agora = args.agora or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    print("A ler o inventário…", flush=True)
    sites, pub_infra = ler_inventario(args.infra or INFRA_URLS)
    print(f"  {len(sites)} postos", flush=True)

    print("A ler estado e tarifas…", flush=True)
    tarifas, pub_estado = ler_estado(args.status or STATUS_URLS, agora)
    print(f"  {len(tarifas)} pontos com tarifa", flush=True)

    postos = juntar(sites, tarifas)
    print(f"  {len(postos)} postos com tarifa depois da junção", flush=True)

    # Uma falha a meio (feed truncado, formato mudado) não pode apagar o
    # que está bom no Supabase. Abaixo disto não substituímos nada.
    minimo = 1 if args.saida else 500
    if len(postos) < minimo:
        print(f"ERRO: só {len(postos)} postos com tarifa — não substituo os dados atuais.", file=sys.stderr)
        return 1

    linha = {
        "id": "mobie",
        "postos": postos,
        "n_postos": len(postos),
        "publicado_em": pub_estado or pub_infra,
        "obtido_em": agora,
    }
    if args.saida:
        with open(args.saida, "w", encoding="utf-8") as f:
            json.dump(linha, f, ensure_ascii=False, separators=(",", ":"))
        print(f"  escrito {args.saida}", flush=True)
    else:
        enviar(linha)
    return 0


if __name__ == "__main__":
    sys.exit(main())
