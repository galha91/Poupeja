import { useState, useEffect, useMemo } from "react";
import { RefreshCw, Bell, BellRing, Check } from "lucide-react";
import LogoLoja from "./LogoLoja";
import { useDeslocacao, BotaoCombustivel } from "./DeslocacaoLista";
import { Preco } from "./Preco";
import { NotaCobertura } from "./Cobertura";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { melhoresPorLoja, custoPorLoja, alternativas } from "./lib/comparacao";
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

export default function ResultadoLista({ linhas: linhasOrig, nota = true, onAtualizar, onResumo, onEscolher, moldura = true }) {
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
  const { unica, maisCara, porLoja, divisao, semPreco, parciais, comparaveis, grupo } = r;

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

  function escolher(plano, loja = unica.loja) {
    // Outra loja que não a mais barata (ganhou com o combustível): poupança face à mais cara.
    const valor = plano === "unica" && loja !== unica.loja
      ? Math.max(0, Math.round((maisCara.total - (porLoja.find((t) => t.loja === loja)?.total ?? maisCara.total)) * 100) / 100)
      : poupancaDaEscolha(r, plano);
    const lojasEscolha = plano === "divisao" ? divisao.lojas : [loja];
    registarEscolha({ plano, lojas: lojasEscolha, valor, artigos: comparaveis.length, lista: chaveLista(linhas.map((l) => l.item.nome)) });
    evento("lista_escolha", { plano, lojas: lojasEscolha.join("+"), poupanca: valor });
    setEscolha({ plano, valor, semana: somarPeriodos(lerRegistos()).semana });
  }

  async function alternarVigia(l) {
    const ativo = alertas.find((a) => a.q === l.q);
    if (ativo) {
      deixarDeVigiar(l.q);
      setAvisoVigiar("");
    } else {
      const atual = atualDe(l.dados);
      if (!atual) return;
      const novo = vigiar({ q: l.q, valor: atual.valor, unidade: atual.unidade, modo: atual.modo, promo: atual.promo });
      if (!novo) { setAvisoVigiar("Já tens 20 artigos a vigiar. Deixa de vigiar algum para juntar este."); return; }
      // Notificações só com conta (o aviso é personalizado). Pede-se a
      // autorização aqui, no momento em que faz sentido — nunca à entrada.
      let push = "sem-conta";
      if (await temConta()) {
        push = await estadoPush();
        if (push === "inativo") push = await ativarPush().catch(() => "inativo");
      }
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
  const d = useDeslocacao({ unica, divisao: mostrarDivisao ? divisao : null, porLoja: comparaveisLoja });

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
  const atual = plano && (plano === "divisao" ? mostrarDivisao : porLoja.some((t) => t.loja === plano)) ? plano : maisBarata;
  const eDivisao = atual === "divisao";
  const totalAtual = eDivisao
    ? divisao.total + (d.divisaoCarro && !d.divisaoCarro.faltam ? d.divisaoCarro.combustivelExtra + (d.porCadeia[unica.loja]?.combustivel || 0) : 0)
    : totalDe(atual);
  const totalMaisBarata = maisBarata ? totalDe(maisBarata) : null;
  const poupanca = maisCaraVista && totalAtual != null ? Math.max(0, totalDe(maisCaraVista) - totalAtual) : 0;
  const aMais = !eDivisao && totalAtual != null && totalMaisBarata != null ? totalAtual - totalMaisBarata : 0;

  // A lista de compras do plano: em cada loja, o produto e o preço a pegar.
  const gruposLista = eDivisao
    ? divisao.lojas.map((s) => ({ loja: s, ids: new Set(divisao.atribuicao[s]) }))
    : [{ loja: atual, ids: null }];
  const naoHa = eDivisao
    ? linhas.filter((l) => !divisao.lojas.some((s) => divisao.atribuicao[s].includes(String(l.item.id))))
    : linhas.filter((l) => !l.custos[atual]);

  const notas = [
    semPreco.length > 0 && `sem preço: ${semPreco.map((l) => l.nome).join(", ")}`,
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
          {l.dados && (
            <button onClick={() => alternarVigia(l)} aria-pressed={!!alerta} aria-label={alerta ? `Deixar de vigiar ${l.item.nome}` : `Avisar quando ${l.item.nome} descer de preço`}
              className="pj-tap flex items-center justify-center flex-none"
              style={{ width: 30, height: 30, borderRadius: 999, border: 0, background: alerta ? "var(--pj-brand-wash)" : "transparent", color: alerta ? "var(--pj-brand-ink)" : "var(--pj-text-faint)" }}>
              {alerta ? <BellRing size={15} /> : <Bell size={15} />}
            </button>
          )}
        </div>
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
            {mostrarDivisao && (
              <button role="tab" aria-selected={eDivisao} onClick={() => setPlano("divisao")} className="pj-tap press" style={chip(eDivisao)}>
                <span className="flex" style={{ marginLeft: 2 }}>
                  {divisao.lojas.map((s, i) => <span key={s} style={{ marginLeft: i ? -10 : 0 }}><LogoLoja loja={nomeCadeia(s)} size={24} radius={7} /></span>)}
                </span>
                <span>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text)", whiteSpace: "nowrap" }}>Dividir</span>
                  <span className="pj-num" style={{ display: "block", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", color: d.divisaoCarro && !d.divisaoCarro.faltam && !d.divisaoCarro.compensa ? "var(--pj-text-faint)" : "var(--pj-brand-ink)" }}>
                    {d.divisaoCarro && !d.divisaoCarro.faltam
                      ? (d.divisaoCarro.compensa ? `−${eur(d.divisaoCarro.saldo, 2)} €` : "não compensa")
                      : `−${eur(divisao.poupancaExtra, 2)} €`}
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
                  {eDivisao ? juntarNomes(divisao.lojas) : nomeCadeia(atual)}
                </p>
                <p style={{ fontSize: 12.5, fontWeight: 600, marginTop: 3, color: aMais > 0.005 ? "var(--pj-text-muted)" : "var(--pj-brand-ink)" }}>
                  {aMais > 0.005 ? `+${eur(aMais, 2)} € que no ${nomeCadeia(maisBarata)}`
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
            {eDivisao && d.divisaoCarro && !d.divisaoCarro.faltam && (
              <p className="pj-num" style={{ fontSize: 11.5, color: d.divisaoCarro.compensa ? "var(--pj-text-faint)" : "var(--pj-text-muted)", marginTop: 2 }}>
                {d.divisaoCarro.compensa
                  ? `Com o carro: +${eur(d.divisaoCarro.kmExtra, 1)} km e cerca de ${d.divisaoCarro.minutosExtra} min a mais`
                  : `Não compensa: o carro gasta ${eur(d.divisaoCarro.combustivelExtra, 2)} € a mais do que poupas`}
              </p>
            )}

            {avisoVigiar && <p role="status" style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{avisoVigiar}</p>}
            {desceram.length > 0 && (
              <p style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
                {desceram.length === 1 ? `«${desceram[0].item.nome}» desceu de preço ou está em promoção.` : `${desceram.length} artigos que vigias desceram ou estão em promoção.`}
              </p>
            )}

            <div style={{ marginTop: 10 }}>
              {gruposLista.map((g) => {
                const daLoja = linhas.filter((l) => l.custos[g.loja] && (!g.ids || g.ids.has(String(l.item.id))));
                return (
                  <div key={g.loja} style={{ marginBottom: eDivisao ? 8 : 0 }}>
                    {eDivisao && (
                      <p className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 700, color: "var(--pj-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "8px 0 4px" }}>
                        <LogoLoja loja={nomeCadeia(g.loja)} size={18} radius={5} /> {nomeCadeia(g.loja)}
                      </p>
                    )}
                    {daLoja.map((l) => <LinhaArtigo key={l.item.id} l={l} loja={g.loja} />)}
                  </div>
                );
              })}
              {naoHa.length > 0 && (
                <p style={{ fontSize: 12, color: "var(--pj-text-faint)", padding: "10px 0", borderTop: "1px solid var(--pj-subtle)" }}>
                  Não há {eDivisao ? "aqui" : `no ${nomeCadeia(atual)}`}: {naoHa.map((l) => l.item.nome).join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* 3. A ação. */}
          <div style={{ padding: "12px 16px 14px" }}>
            {!escolha ? (
              <button onClick={() => (eDivisao ? escolher("divisao") : escolher("unica", atual))} className="pj-tap press w-full"
                style={{ background: "var(--pj-brand)", color: "#fff", border: 0, borderRadius: 12, padding: "13px 0", fontSize: 14.5, fontWeight: 600 }}>
                {eDivisao ? `Vou dividir por ${juntarNomes(divisao.lojas)}` : `Vou comprar no ${nomeCadeia(atual)}`}
              </button>
            ) : (
              <p role="status" className="flex items-start gap-2" style={{ fontSize: 13, color: "var(--pj-text)", lineHeight: 1.5 }}>
                <Check size={16} style={{ color: "var(--pj-brand-ink)", flexShrink: 0, marginTop: 2 }} />
                <span>
                  Poupança de <strong className="pj-num">{eur(escolha.valor, 2)} €</strong> registada. Esta semana: <strong className="pj-num">{eur(escolha.semana, 2)} €</strong>.
                </span>
              </p>
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
