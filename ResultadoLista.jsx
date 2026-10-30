import { useState, useEffect, useMemo } from "react";
import { RefreshCw, Bell, BellRing, Check } from "lucide-react";
import LogoLoja from "./LogoLoja";
import { useDeslocacao, BotaoCombustivel } from "./DeslocacaoLista";
import { Preco } from "./Preco";
import { NotaCobertura } from "./Cobertura";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { registarMarcoConvidado } from "./lib/convidado";
import { melhoresPorLoja, custoPorLoja, alternativas, exemplosGenerico } from "./lib/comparacao";
import { otimizarCabaz, poupancaDaEscolha } from "./lib/cabaz";
import { COMPARADAS, nomeCadeia, juntarNomes, TEXTO_COBERTURA } from "./lib/cobertura";
import { resumoAtual, avaliarVigia } from "./lib/alertas";
import { registarEscolha, chaveLista, lerRegistos, somarPeriodos } from "./lib/poupancaListas";
import { lerAlertas, vigiar, deixarDeVigiar } from "./AlertasPreco";
import { estadoPush, ativarPush, temConta } from "./lib/push";

/*
 * Resultado da lista otimizada — carregado só quando se compara.
 *
 * As contas são de lib/cabaz: a loja única mais barata, a melhor divisão
 * por 2 lojas, o que não tem preço. Escolher onde comprar regista a
 * poupança estimada (lib/poupancaListas); o sino vigia o preço do artigo.
 */

const LOJAS = COMPARADAS.map((c) => c.id);
// Com sortido completo: faltar numa destas é notícia; faltar no Lidl (só promoções) não.
const MAX_ARTIGOS = 25;
const EM_PARALELO = 3;

const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const quando = (iso) => {
  try { return new Date(iso).toLocaleString("pt-PT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
};

/* O melhor de hoje para um artigo, no formato dos alertas. */
function atualDe(dados) {
  if (!dados?.produtos?.length) return null;
  const { modo, ranking } = melhoresPorLoja(dados);
  const p = ranking[0];
  if (!p) return null;
  return { ...resumoAtual(p, modo), modo, unidade: modo === "embalagem" ? "embalagem" : p.nomeUnidade || p.unidade };
}

export default function ResultadoLista({ linhas: linhasOrig, nota = true, onAtualizar, onResumo, onEscolher, onCriarConta = null, moldura = true }) {
  // Produto escolhido à mão por artigo (id do artigo → { loja, id, nome }).
  // Começa no que vem guardado na lista e muda aqui sem voltar a pesquisar.
  const [escolhas, setEscolhas] = useState(() => Object.fromEntries(
    linhasOrig.filter((l) => l.item.escolha).map((l) => [String(l.item.id), l.item.escolha])));
  const [aEscolher, setAEscolher] = useState(null);
  useEffect(() => {
    setEscolhas(Object.fromEntries(linhasOrig.filter((l) => l.item.escolha).map((l) => [String(l.item.id), l.item.escolha])));
  }, [linhasOrig]);
  const linhas = useMemo(() => linhasOrig.map((l) => {
    const esc = escolhas[String(l.item.id)] || null;
    if (!l.dados || (esc || null) === (l.item.escolha || null)) return l;
    return { ...l, ...custoPorLoja(l.dados, l.item.qty || 1, esc), item: { ...l.item, escolha: esc || undefined } };
  }), [linhasOrig, escolhas]);
  function escolherProduto(l, p) {
    const esc = p ? { loja: p.loja, id: String(p.id), nome: p.nome } : null;
    setEscolhas((e) => { const n = { ...e }; if (esc) n[String(l.item.id)] = esc; else delete n[String(l.item.id)]; return n; });
    setAEscolher(null);
    onEscolher?.(l.item.id, esc);
    evento("lista_escolher_produto", { loja: p?.loja || "mais-barato" });
  }
  const [escolha, setEscolha] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [avisoVigiar, setAvisoVigiar] = useState("");
  const [pedirContaVigia, setPedirContaVigia] = useState(false);
  useEffect(() => { setAlertas(lerAlertas()); }, []);
  // Ao atualizar chegam linhas novas: a escolha anterior deixa de valer.
  useEffect(() => { setEscolha(null); }, [linhas]);

  const r = useMemo(() => otimizarCabaz(
    linhas.map((l) => ({
      id: String(l.item.id),
      nome: l.item.nome,
      custos: Object.fromEntries(Object.entries(l.custos).map(([loja, v]) => [loja, v.custo])),
    })),
    LOJAS,
  ), [linhas]);

  // ── Resultado ──
  const { unica, maisCara, porLoja, divisao, parciais, comparaveis, grupo } = r;

  // O resumo vai para o bloco de baixo da lista e para o cartão do Início.
  useEffect(() => {
    onResumo?.(unica ? {
      loja: unica.loja, nome: nomeCadeia(unica.loja), total: unica.total,
      poupanca: grupo.length > 1 ? r.poupancaUnica : 0, artigos: comparaveis.length,
    } : null);
  }, [r]);
  const total = linhas.length;
  const guardados = linhas.filter((l) => l.guardado);
  const maisAntigo = guardados.map((l) => l.dados?.obtidoEm).filter(Boolean).sort()[0];
  const mostrarDivisao = divisao && divisao.poupancaExtra >= 0.1;
  // Lojas que não responderam a nenhum artigo (e não por falta de rede).
  const caladas = LOJAS.filter((s) => linhas.some((l) => l.dados?.lojas) &&
    linhas.every((l) => !l.dados?.lojas || l.dados.lojas.some((x) => x.id === s && !x.ok)));

  // Aviso dentro da app: artigos vigiados que desceram ou entraram em promoção.
  const desceram = linhas.filter((l) => {
    const a = alertas.find((x) => x.q === l.q && x.tipo === "vigiar");
    const atual = a && atualDe(l.dados);
    return atual && atual.unidade === a.unidade && avaliarVigia(a, atual).motivo;
  });

  function escolher(plano, loja = unica.loja, divisaoFeita = null) {
    // Outra loja que não a mais barata (ganhou com o combustível): poupança face à mais cara.
    // Divisão à medida: a poupança dela face a tudo na loja mais barata.
    const valor = divisaoFeita ? Math.max(0, divisaoFeita.poupanca)
      : plano === "unica" && loja !== unica.loja
      ? Math.max(0, Math.round((maisCara.total - (porLoja.find((t) => t.loja === loja)?.total ?? maisCara.total)) * 100) / 100)
      : poupancaDaEscolha(r, plano);
    const lojasEscolha = divisaoFeita ? divisaoFeita.lojas : plano === "divisao" ? divisao.lojas : [loja];
    registarEscolha({ plano, lojas: lojasEscolha, valor, artigos: comparaveis.length, lista: chaveLista(linhas.map((l) => l.item.nome)) });
    registarMarcoConvidado("escolheu");
    evento("lista_escolha", { plano, lojas: lojasEscolha.join("+"), poupanca: valor });
    setEscolha({ plano, valor, semana: somarPeriodos(lerRegistos()).semana });
  }

  async function alternarVigia(l) {
    const ativo = alertas.find((a) => a.q === l.q);
    if (ativo) {
      deixarDeVigiar(l.q);
      setAvisoVigiar("");
      setPedirContaVigia(false);
    } else {
      const atual = atualDe(l.dados);
      if (!atual) return;
      registarMarcoConvidado("alerta");
      const novo = vigiar({ q: l.q, valor: atual.valor, unidade: atual.unidade, modo: atual.modo, promo: atual.promo });
      if (!novo) { setAvisoVigiar("Já tens 20 artigos a vigiar. Deixa de vigiar algum para juntar este."); return; }
      // Notificações só com conta (o aviso é personalizado). Pede-se a
      // autorização aqui, no momento em que faz sentido — nunca à entrada.
      let push = "sem-conta";
      if (await temConta()) {
        push = await estadoPush();
        if (push === "inativo") push = await ativarPush().catch(() => "inativo");
      }
      setPedirContaVigia(push === "sem-conta" && !!onCriarConta);
      setAvisoVigiar(push === "ativo"
        ? `A vigiar «${l.item.nome}». Mandamos uma notificação quando descer ou entrar em promoção.`
        : push === "sem-conta"
          ? `A vigiar «${l.item.nome}». Mostramos aqui quando descer; com conta, também te avisamos por notificação.`
          : `A vigiar «${l.item.nome}». Sem notificações ativas, mostramos aqui quando o preço descer.`);
    }
    setAlertas(lerAlertas());
  }

  const pequeno = { fontSize: 11.5, color: "var(--pj-text-faint)", lineHeight: 1.5 };
  const comparaveisLoja = porLoja.filter((t) => !t.emFalta.length);

  /*
   * Dividir à medida: cada artigo numa loja. Começa na melhor divisão (ou,
   * sem ela, no mais barato de cada artigo) e um toque muda um artigo de
   * loja. Compara-se com levar tudo na loja mais barata (o que lá faltar
   * conta pelo preço da divisão, para a conta ser justa).
   */
  const [atribManual, setAtribManual] = useState({});
  useEffect(() => { setAtribManual({}); }, [linhasOrig]);
  const dv = useMemo(() => {
    if (!unica || porLoja.length < 2) return null;
    const atrib = {};
    for (const l of linhas) {
      const id = String(l.item.id);
      const lojasCom = Object.keys(l.custos);
      if (!lojasCom.length) continue;
      const manual = atribManual[id];
      const auto = null;
      // Em empate (ou quase), fica na loja principal: não vale ir a outra por nada.
      const barata = lojasCom.sort((a, b) => (Math.abs(l.custos[a].custo - l.custos[b].custo) < 0.005
        ? (a === unica.loja ? -1 : b === unica.loja ? 1 : 0)
        : l.custos[a].custo - l.custos[b].custo))[0];
      atrib[id] = [manual, auto, barata].find((s) => s && l.custos[s]);
    }
    // Uma loja extra só vale a viagem se poupar pelo menos 0,50 € face à
    // principal; senão, os artigos dela (não escolhidos à mão) voltam.
    const ganho = {};
    for (const l of linhas) {
      const id = String(l.item.id), s = atrib[id];
      if (!s || s === unica.loja || atribManual[id] || !l.custos[unica.loja]) continue;
      ganho[s] = (ganho[s] || 0) + l.custos[unica.loja].custo - l.custos[s].custo;
    }
    for (const l of linhas) {
      const id = String(l.item.id), s = atrib[id];
      if (s && s !== unica.loja && !atribManual[id] && l.custos[unica.loja] && (ganho[s] || 0) < 0.5) atrib[id] = unica.loja;
    }
    // Todas as lojas onde ficou algum artigo, incluindo as que não têm a
    // lista toda (o Pingo Doce sem maracujá também conta para dividir).
    const usadas = new Set(Object.values(atrib));
    const ordem = [...porLoja.map((t) => t.loja), ...LOJAS.filter((s) => !porLoja.some((t) => t.loja === s))];
    const lojas = ordem.filter((s) => usadas.has(s));
    const cent = (n) => Math.round(n * 100);
    let total = 0, ref = 0;
    for (const l of linhas) {
      const s = atrib[String(l.item.id)];
      if (!s) continue;
      total += cent(l.custos[s].custo);
      ref += cent((l.custos[unica.loja] || l.custos[s]).custo);
    }
    // Quanto se pouparia levando cada artigo à loja mais barata dele (sem regra dos 0,50 €).
    let maximo = 0;
    for (const l of linhas) {
      const v = Object.values(l.custos).map((c) => c.custo);
      if (v.length && l.custos[unica.loja]) maximo += cent(l.custos[unica.loja].custo) - cent(Math.min(...v));
    }
    return { atrib, lojas, total: total / 100, ref: ref / 100, poupanca: (ref - total) / 100, maximo: maximo / 100 };
  }, [linhas, atribManual, unica, porLoja, mostrarDivisao, divisao]);
  const dividido = dv && dv.lojas.length > 1;

  const d = useDeslocacao({
    unica: dv ? { loja: unica.loja, total: dv.ref } : unica,
    divisao: dividido ? { lojas: dv.lojas, total: dv.total } : null,
    porLoja: comparaveisLoja,
  });

  // Com o combustível ligado, a ordem e o mais barato passam a ser os do total com carro.
  const lojasVistas = d.ligado
    ? [...porLoja].sort((a, b) => (d.porCadeia[a.loja]?.total ?? Infinity) - (d.porCadeia[b.loja]?.total ?? Infinity))
    : porLoja;
  const totalDe = (loja) => {
    const t = porLoja.find((x) => x.loja === loja);
    if (!t) return null;
    return d.ligado && d.porCadeia[loja] ? d.porCadeia[loja].total : t.total;
  };
  const maisBarata = lojasVistas[0]?.loja;
  const maisCaraVista = lojasVistas[lojasVistas.length - 1]?.loja;

  // O plano à vista: uma loja (a mais barata, por omissão) ou "divisao".
  // Tocar noutra loja mostra a lista nessa loja — a mais perto, a do costume.
  const [plano, setPlano] = useState(null);
  useEffect(() => { setPlano(null); }, [linhasOrig]);
  const atual = plano && (plano === "divisao" ? !!dv : porLoja.some((t) => t.loja === plano)) ? plano : maisBarata;
  const eDivisao = atual === "divisao";
  const carroDivisao = d.divisaoCarro && !d.divisaoCarro.faltam ? d.divisaoCarro : null;
  const totalAtual = eDivisao
    ? dv.total + (d.ligado ? (carroDivisao ? carroDivisao.combustivelExtra + (d.porCadeia[unica.loja]?.combustivel || 0) : (d.porCadeia[dv.lojas[0]]?.combustivel || 0)) : 0)
    : totalDe(atual);
  const totalMaisBarata = maisBarata ? totalDe(maisBarata) : null;
  // Na divisão, a poupança conta-se face a tudo na loja mais barata (com carro, se ligado).
  const poupanca = eDivisao
    ? (carroDivisao ? carroDivisao.saldo : dv.poupanca)
    : maisCaraVista && totalAtual != null ? Math.max(0, totalDe(maisCaraVista) - totalAtual) : 0;
  const aMais = !eDivisao && totalAtual != null && totalMaisBarata != null ? totalAtual - totalMaisBarata : 0;

  // A lista de compras do plano: em cada loja, o produto e o preço a pegar.
  const daDivisao = (l) => dv?.atrib[String(l.item.id)];
  const naoHa = eDivisao ? linhas.filter((l) => !daDivisao(l)) : linhas.filter((l) => !l.custos[atual]);
  const porLojaDivisao = eDivisao ? dv.lojas.map((s) => {
    const its = linhas.filter((l) => daDivisao(l) === s);
    return { loja: s, n: its.length, total: its.reduce((a, l) => a + l.custos[s].custo, 0) };
  }) : [];

  const notas = [
    guardados.length > 0 && `${guardados.length === total ? "preços" : `${guardados.length} preços`} guardados${maisAntigo ? ` de ${quando(maisAntigo)}` : ""}`,
    caladas.length > 0 && `${juntarNomes(caladas)} não ${caladas.length > 1 ? "responderam" : "respondeu"}`,
  ].filter(Boolean);

  const chip = (ativo) => ({
    flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px 8px 8px", borderRadius: 14,
    border: ativo ? "2px solid var(--pj-brand)" : "1px solid var(--pj-border)", margin: ativo ? 0 : 1,
    background: ativo ? "var(--pj-brand-wash)" : "var(--pj-card)", textAlign: "left",
  });

  function LinhaArtigo({ l, loja }) {
    const c = l.custos[loja];
    const alerta = alertas.find((a) => a.q === l.q);
    const atualV = alerta?.tipo === "vigiar" ? atualDe(l.dados) : null;
    const aviso = atualV && atualV.unidade === alerta.unidade ? avaliarVigia(alerta, atualV) : null;
    const desceu = aviso && (aviso.motivo === "desceu" || aviso.motivo === "promo");
    const aberto = aEscolher === `${l.item.id}|${loja}`;
    return (
      <div style={{ padding: "10px 0", borderTop: "1px solid var(--pj-subtle)" }}>
        <div className="flex items-center gap-2">
          <span className="flex-1 min-w-0">
            <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>
              {l.item.nome}{l.item.qty > 1 ? <span style={{ color: "var(--pj-text-faint)", fontWeight: 500 }}> ×{l.item.qty}</span> : null}
              {c?.escolhido && <span style={etiqueta}>a tua escolha</span>}
              {desceu && <span style={etiqueta}>{aviso.motivo === "desceu" ? "desceu" : "promoção"}</span>}
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.produto.nome}{c.produto.quantidade && !c.produto.aoPeso ? ` · ${c.produto.quantidade}` : c.produto.aoPeso ? " · ao peso" : ""}
            </span>
          </span>
          <span className="pj-num" style={{ fontSize: 14, fontWeight: 700, color: "var(--pj-text)" }}>{eur(c.custo, 2)} €</span>
          {l.dados && (
            <button onClick={() => setAEscolher(aberto ? null : `${l.item.id}|${loja}`)} aria-expanded={aberto} aria-label={`Trocar ${l.item.nome} por outro produto do ${nomeCadeia(loja)}`}
              className="pj-tap flex items-center justify-center flex-none"
              style={{ height: 30, padding: "0 10px", borderRadius: 999, border: 0, fontSize: 12, fontWeight: 600, background: aberto ? "var(--pj-text)" : "var(--pj-subtle)", color: aberto ? "var(--pj-card)" : "var(--pj-text)" }}>
              Trocar
            </button>
          )}
          {l.dados && !eDivisao && (
            <button onClick={() => alternarVigia(l)} aria-pressed={!!alerta} aria-label={alerta ? `Deixar de vigiar ${l.item.nome}` : `Avisar quando ${l.item.nome} descer de preço`}
              className="pj-tap flex items-center justify-center flex-none"
              style={{ width: 30, height: 30, borderRadius: 999, border: 0, background: alerta ? "var(--pj-brand-wash)" : "transparent", color: alerta ? "var(--pj-brand-ink)" : "var(--pj-text-faint)" }}>
              {alerta ? <BellRing size={15} /> : <Bell size={15} />}
            </button>
          )}
        </div>
        {eDivisao && Object.keys(l.custos).length > 1 && (
          // Em que loja comprar este artigo: um toque muda-o de lado.
          <div className="flex gap-1.5 flex-wrap" style={{ marginTop: 6 }} role="radiogroup" aria-label={`Onde comprar ${l.item.nome}`}>
            {[...porLoja.map((t) => t.loja), ...LOJAS.filter((s) => !porLoja.some((t) => t.loja === s))].filter((s) => l.custos[s]).map((s) => {
              const sel = s === loja;
              return (
                <button key={s} role="radio" aria-checked={sel} onClick={() => setAtribManual((m) => ({ ...m, [String(l.item.id)]: s }))}
                  className="pj-tap flex items-center gap-1.5"
                  style={{ padding: "4px 9px 4px 4px", borderRadius: 999, fontSize: 11.5, fontWeight: sel ? 700 : 500,
                    border: sel ? "1.5px solid var(--pj-brand)" : "1px solid var(--pj-border)", background: sel ? "var(--pj-brand-wash)" : "var(--pj-card)",
                    color: sel ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
                  <LogoLoja loja={nomeCadeia(s)} size={18} radius={5} />
                  <span className="pj-num">{eur(l.custos[s].custo, 2)} €</span>
                </button>
              );
            })}
          </div>
        )}
        {aberto && <EscolherProduto dados={l.dados} loja={loja} atualId={c.produto.id} onEscolher={(p) => escolherProduto(l, p)} />}
      </div>
    );
  }

  return (
    <div style={moldura ? { borderRadius: 18, background: "var(--pj-card)", border: "1px solid var(--pj-border)", overflow: "hidden" } : { background: "var(--pj-card)" }}>
      {unica && maisBarata ? (
        <>
          {/* 1. As lojas, lado a lado. Toca numa para ver a lista lá. */}
          <div className="flex gap-2" style={{ overflowX: "auto", padding: "14px 16px 4px", scrollbarWidth: "none" }} role="tablist" aria-label="Onde comprar">
            {lojasVistas.map((t) => {
              const ativo = atual === t.loja;
              const tot = totalDe(t.loja);
              return (
                <button key={t.loja} role="tab" aria-selected={ativo} onClick={() => setPlano(t.loja)} className="pj-tap press" style={chip(ativo)}>
                  <LogoLoja loja={nomeCadeia(t.loja)} size={28} radius={8} />
                  <span>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text)", whiteSpace: "nowrap" }}>{nomeCadeia(t.loja)}</span>
                    <span className="pj-num" style={{ display: "block", fontSize: 12, fontWeight: 700, color: t.loja === maisBarata ? "var(--pj-brand-ink)" : "var(--pj-text-muted)", whiteSpace: "nowrap" }}>
                      {t.loja === maisBarata ? `${eur(tot, 2)} €` : `+${eur(tot - totalMaisBarata, 2)} €`}
                    </span>
                  </span>
                </button>
              );
            })}
            {dv && (
              <button role="tab" aria-selected={eDivisao} onClick={() => setPlano("divisao")} className="pj-tap press" style={chip(eDivisao)}>
                <span className="flex" style={{ marginLeft: 2 }}>
                  {(dividido ? dv.lojas : porLoja.slice(0, 2).map((t) => t.loja)).slice(0, 3).map((s, i) => <span key={s} style={{ marginLeft: i ? -10 : 0 }}><LogoLoja loja={nomeCadeia(s)} size={24} radius={7} /></span>)}
                </span>
                <span>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text)", whiteSpace: "nowrap" }}>Dividir</span>
                  <span className="pj-num" style={{ display: "block", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", color: dividido && (carroDivisao ? carroDivisao.compensa : dv.poupanca >= 0.01) ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
                    {!dividido ? "à tua medida"
                      : carroDivisao ? (carroDivisao.compensa ? `−${eur(carroDivisao.saldo, 2)} €` : "não compensa")
                      : dv.poupanca >= 0.01 ? `−${eur(dv.poupanca, 2)} €` : "à tua medida"}
                  </span>
                </span>
              </button>
            )}
          </div>

          {comparaveisLoja.length > 0 && <BotaoCombustivel d={d} />}

          {/* 2. O plano escolhido: onde, quanto, e a lista para levar. */}
          <div style={{ padding: "6px 16px 0" }}>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display" style={{ fontSize: 22, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.15 }}>
                  {eDivisao ? (dividido ? juntarNomes(dv.lojas) : "Divide à tua medida") : nomeCadeia(atual)}
                </p>
                <p style={{ fontSize: 12.5, fontWeight: 600, marginTop: 3, color: aMais > 0.005 || (eDivisao && poupanca < 0.01) ? "var(--pj-text-muted)" : "var(--pj-brand-ink)" }}>
                  {eDivisao
                    ? (!dividido ? (dv.maximo >= 0.01
                        ? `Dividir só poupava ${eur(dv.maximo, 2)} €, por isso fica tudo no ${nomeCadeia(unica.loja)}. Toca noutra loja para mudar um artigo.`
                        : `Fica tudo mais barato no ${nomeCadeia(unica.loja)}. Toca noutra loja para mudar um artigo.`)
                      : poupanca >= 0.01 ? `Poupas ${eur(poupanca, 2)} € face a tudo no ${nomeCadeia(unica.loja)}${carroDivisao ? ", já com o carro" : ""}`
                      : `Fica ${eur(-poupanca, 2)} € mais caro que tudo no ${nomeCadeia(unica.loja)}`)
                    : aMais > 0.005 ? `+${eur(aMais, 2)} € que no ${nomeCadeia(maisBarata)}`
                    : poupanca >= 0.01 ? `Poupas ${eur(poupanca, 2)} €${d.ligado ? ", já com o carro" : ""}` : "O mais barato"}
                </p>
              </div>
              <Preco valor={totalAtual} casas={2} tamanho={28} />
            </div>
            {d.ligado && !eDivisao && d.porCadeia[atual] && (
              <p className="pj-num" style={{ fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 2 }}>
                {eur(totalDe(atual) - d.porCadeia[atual].combustivel, 2)} € de compras + {eur(d.porCadeia[atual].combustivel, 2)} € de carro ({eur(d.porCadeia[atual].km, 1)} km)
              </p>
            )}
            {eDivisao && dividido && (
              <p className="pj-num" style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 4 }}>
                {porLojaDivisao.map((g) => `${nomeCadeia(g.loja)}: ${g.n}\u00a0${g.n === 1 ? "artigo" : "artigos"} ·\u00a0${eur(g.total, 2)}\u00a0€`).join("  ·  ")}
              </p>
            )}
            {eDivisao && carroDivisao && (
              <p className="pj-num" style={{ fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 2 }}>
                {carroDivisao.compensa
                  ? `Com o carro: +${eur(carroDivisao.kmExtra, 1)} km e cerca de ${carroDivisao.minutosExtra} min a mais`
                  : `O carro gasta ${eur(carroDivisao.combustivelExtra, 2)} € a mais do que poupas`}
              </p>
            )}

            {avisoVigiar && (
              <p role="status" style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
                {avisoVigiar}
                {pedirContaVigia && (
                  <button onClick={() => { evento("pedir_conta", { onde: "sino" }); registarMarcoConvidado("pediu_conta"); onCriarConta(); }} className="pj-tap press"
                    style={{ display: "block", marginTop: 6, padding: "7px 14px", borderRadius: 999, border: 0, background: "var(--pj-brand)", color: "#fff", fontSize: 12.5, fontWeight: 700 }}>
                    Criar conta grátis · 10 segundos
                  </button>
                )}
              </p>
            )}
            {desceram.length > 0 && (
              <p style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
                {desceram.length === 1 ? `«${desceram[0].item.nome}» desceu de preço ou está em promoção.` : `${desceram.length} artigos que vigias desceram ou estão em promoção.`}
              </p>
            )}

            <div style={{ marginTop: 10 }}>
              {eDivisao
                ? linhas.filter(daDivisao).map((l) => <LinhaArtigo key={l.item.id} l={l} loja={daDivisao(l)} />)
                : linhas.filter((l) => l.custos[atual]).map((l) => <LinhaArtigo key={l.item.id} l={l} loja={atual} />)}
              {/* Há noutra loja, não nesta */}
              {naoHa.some((l) => Object.keys(l.custos).length) && (
                <p style={{ fontSize: 12, color: "var(--pj-text-faint)", padding: "10px 0", borderTop: "1px solid var(--pj-subtle)" }}>
                  Não há {eDivisao ? "aqui" : `no ${nomeCadeia(atual)}`}: {naoHa.filter((l) => Object.keys(l.custos).length).map((l) => l.item.nome).join(", ")}
                </p>
              )}
              {/* Não entram na conta: gerais demais, ou sem produto que seja mesmo o artigo */}
              {linhas.some((l) => !Object.keys(l.custos).length) && (
                <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 12, background: "var(--pj-subtle)" }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-text)" }}>Fora da conta</p>
                  {linhas.filter((l) => l.generico).map((l) => (
                    <p key={l.item.id} style={{ fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.45, marginTop: 4 }}>
                      «{l.item.nome}» é muito geral. Escreve qual: {exemplosGenerico(l.item.nome)}.
                    </p>
                  ))}
                  {linhas.filter((l) => !l.generico && !Object.keys(l.custos).length).length > 0 && (
                    <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.45, marginTop: 4 }}>
                      Sem produto que seja mesmo {linhas.filter((l) => !l.generico && !Object.keys(l.custos).length).map((l) => `«${l.item.nome}»`).join(", ")}. Experimenta um nome mais simples (ex.: «arroz», «leite»).
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. A ação. */}
          <div style={{ padding: "12px 16px 14px" }}>
            {!escolha ? (
              <button onClick={() => (eDivisao && dividido ? escolher("divisao", null, dv) : escolher("unica", eDivisao ? unica.loja : atual))} className="pj-tap press w-full"
                style={{ background: "var(--pj-brand)", color: "#fff", border: 0, borderRadius: 12, padding: "13px 0", fontSize: 14.5, fontWeight: 600 }}>
                {eDivisao ? (dividido ? `Vou dividir por ${juntarNomes(dv.lojas)}` : `Vou comprar tudo no ${nomeCadeia(unica.loja)}`) : `Vou comprar no ${nomeCadeia(atual)}`}
              </button>
            ) : (
              <p role="status" className="flex items-start gap-2" style={{ fontSize: 13, color: "var(--pj-text)", lineHeight: 1.5 }}>
                <Check size={16} style={{ color: "var(--pj-brand-ink)", flexShrink: 0, marginTop: 2 }} />
                <span>
                  Poupança de <strong className="pj-num">{eur(escolha.valor, 2)} €</strong> registada. Esta semana: <strong className="pj-num">{eur(escolha.semana, 2)} €</strong>.
                </span>
              </p>
            )}
            {escolha && onCriarConta && (
              // O momento certo: acabou de poupar. Guardar isto é o que a conta dá.
              <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 14, background: "var(--pj-brand-wash)" }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--pj-text)", lineHeight: 1.35 }}>
                  Não percas esta poupança
                </p>
                <p style={{ fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.4, marginTop: 2 }}>
                  Com conta guardamos a tua lista, o histórico do que poupas e avisamos-te no telemóvel quando algo baixar de preço. Grátis, sem cartão.
                </p>
                <button onClick={() => { evento("pedir_conta", { onde: "poupanca", valor: escolha.valor }); registarMarcoConvidado("pediu_conta"); onCriarConta(); }} className="pj-tap press"
                  style={{ marginTop: 10, padding: "10px 16px", borderRadius: 12, border: 0, background: "var(--pj-brand)", color: "#fff", fontSize: 13.5, fontWeight: 700 }}>
                  Criar conta grátis
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <p style={{ padding: 16, fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
          Não encontrámos preços para estes artigos. Experimenta nomes mais simples (ex.: «arroz», «leite»).
        </p>
      )}

      <div className="flex items-center justify-between gap-2" style={{ padding: "0 16px", borderTop: "1px solid var(--pj-subtle)" }}>
        <span style={{ ...pequeno, padding: "10px 0" }}>
          Mesma quantidade em todas as lojas{notas.length ? ` · ${notas.join(" · ")}` : ""}
        </span>
        <button onClick={onAtualizar} aria-label="Atualizar preços" className="pj-tap flex items-center justify-center flex-none"
          style={{ width: 36, height: 36, color: "var(--pj-brand-ink)", background: "transparent", border: 0 }}>
          <RefreshCw size={15} />
        </button>
      </div>
      {nota && <div style={{ padding: "0 16px 10px" }}><NotaCobertura /></div>}
    </div>
  );
}

const etiqueta = { marginLeft: 6, padding: "1px 6px", borderRadius: 999, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)", fontSize: 10.5, fontWeight: 700, verticalAlign: "1px" };

/*
 * Lista de produtos para um artigo: os que são mesmo o artigo, ordenados
 * pelo preço ao kg / L / unidade. Tocar num fixa-o para essa loja.
 */
function EscolherProduto({ dados, loja, atualId, onEscolher }) {
  const modo = dados.modo || "unidade";
  const valor = (p) => (modo === "embalagem" ? p.preco : p.precoUnidade);
  const lista = alternativas(dados).filter((p) => !loja || p.loja === loja).sort((a, b) => valor(a) - valor(b));
  if (lista.length < 2) return <p style={{ fontSize: 12, color: "var(--pj-text-faint)", padding: "8px 0 0" }}>Não há outro produto destes no {nomeCadeia(loja)}.</p>;
  return (
    <div style={{ marginTop: 8, borderRadius: 12, border: "1px solid var(--pj-border)", overflow: "hidden", maxHeight: 300, overflowY: "auto" }}>
      {lista.map((p, i) => {
        const ativo = String(p.id) === String(atualId);
        return (
          // O primeiro é o mais barato: escolhê-lo é voltar ao normal.
          <button key={`${p.loja}-${p.id}`} onClick={() => onEscolher(i === 0 ? null : p)} aria-pressed={ativo} className="pj-tap w-full text-left flex items-center gap-2"
            style={{ padding: "9px 12px", borderTop: i ? "1px solid var(--pj-subtle)" : 0, borderLeft: 0, borderRight: 0, borderBottom: 0, background: ativo ? "var(--pj-brand-wash)" : "transparent" }}>
            <span className="flex items-center justify-center flex-none" style={{ width: 16, color: "var(--pj-brand-ink)" }}>{ativo ? <Check size={15} /> : null}</span>
            <span className="flex-1 min-w-0">
              <span style={{ display: "block", fontSize: 13, fontWeight: ativo ? 700 : 500, color: "var(--pj-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--pj-text-faint)" }}>
                {[i === 0 ? "o mais barato" : null, p.marca, p.aoPeso ? "ao peso" : p.quantidade].filter(Boolean).join(" · ")}
              </span>
            </span>
            <span className="pj-num text-right flex-none" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-text)" }}>
              {modo === "embalagem" ? `${eur(p.preco, 2)} €` : `${eur(p.precoUnidade, 2)} €/${p.nomeUnidade || p.unidade}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
