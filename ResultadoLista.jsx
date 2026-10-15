import { useState, useEffect, useMemo } from "react";
import { ChevronDown, RefreshCw, Bell, BellRing, Check } from "lucide-react";
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
  const [verDetalhe, setVerDetalhe] = useState(false);
  const [verDivisao, setVerDivisao] = useState(false);
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

  // Com o combustível ligado, a ordem e o vencedor passam a ser os do total com carro.
  const lojasVistas = d.ligado
    ? [...porLoja].sort((a, b) => (d.porCadeia[a.loja]?.total ?? Infinity) - (d.porCadeia[b.loja]?.total ?? Infinity))
    : porLoja;
  const vencedora = lojasVistas[0];
  const totalDe = (t) => (d.ligado && d.porCadeia[t.loja] ? d.porCadeia[t.loja].total : t.total);
  const totalVencedora = vencedora ? totalDe(vencedora) : null;
  const segunda = lojasVistas[1];
  const poupancaTopo = segunda ? Math.max(0, totalDe(lojasVistas[lojasVistas.length - 1]) - totalVencedora) : 0;

  // Uma linha só de notas, em vez de quatro parágrafos.
  const notas = [
    comparaveis.length < total - semPreco.length && `${total - semPreco.length - comparaveis.length} fora da soma (não há em todas)`,
    semPreco.length > 0 && `sem preço: ${semPreco.map((l) => l.nome).join(", ")}`,
    guardados.length > 0 && `${guardados.length === total ? "preços" : `${guardados.length} preços`} guardados${maisAntigo ? ` de ${quando(maisAntigo)}` : ""}`,
    caladas.length > 0 && `${juntarNomes(caladas)} não ${caladas.length > 1 ? "responderam" : "respondeu"}`,
  ].filter(Boolean);

  return (
    <div style={moldura ? { borderRadius: 18, background: "var(--pj-card)", border: "1px solid var(--pj-border)", overflow: "hidden" } : { background: "var(--pj-card)" }}>
      {unica && vencedora ? (
        <>
          {/* 1. A resposta: onde comprar e quanto custa. */}
          <div style={{ padding: "16px 16px 14px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--pj-text-muted)" }}>
              {d.ligado ? "Mais barato, já com o combustível" : "Mais barato"}
            </p>
            <div className="flex items-center gap-3" style={{ marginTop: 6 }}>
              <LogoLoja loja={nomeCadeia(vencedora.loja)} size={44} radius={12} />
              <p className="font-display flex-1 min-w-0" style={{ fontSize: 24, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.1 }}>{nomeCadeia(vencedora.loja)}</p>
              <Preco valor={totalVencedora} casas={2} tamanho={26} />
            </div>
            {d.ligado && d.porCadeia[vencedora.loja] && (
              <p className="pj-num" style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 4 }}>
                {eur(vencedora.total, 2)} € de compras + {eur(d.porCadeia[vencedora.loja].combustivel, 2)} € de carro · {eur(d.porCadeia[vencedora.loja].km, 1)} km
              </p>
            )}
            {grupo.length > 1 && poupancaTopo >= 0.01 && (
              <span className="pj-num" style={{ display: "inline-block", marginTop: 10, padding: "4px 10px", borderRadius: 999, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)", fontSize: 12.5, fontWeight: 700 }}>
                Poupas {eur(poupancaTopo, 2)} €
              </span>
            )}
          </div>

          {/* 2. As outras lojas, uma linha cada. */}
          {lojasVistas.length > 1 && (
            <div style={{ borderTop: "1px solid var(--pj-subtle)", padding: "4px 0" }}>
              {lojasVistas.slice(1).map((t) => {
                const c = d.ligado ? d.porCadeia[t.loja] : null;
                return (
                  <div key={t.loja} className="flex items-center gap-3" style={{ padding: "8px 16px", opacity: d.ligado && !c ? 0.5 : 1 }}>
                    <LogoLoja loja={nomeCadeia(t.loja)} size={24} radius={6} />
                    <span className="flex-1 min-w-0">
                      <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: "var(--pj-text)" }}>{nomeCadeia(t.loja)}</span>
                      {(c || t.emFalta.length > 0 || (d.ligado && !c)) && (
                        <span className="pj-num" style={{ display: "block", fontSize: 11, color: "var(--pj-text-faint)" }}>
                          {c ? `${eur(t.total, 2)} € + ${eur(c.combustivel, 2)} € de carro · ${eur(c.km, 1)} km`
                            : d.ligado ? "Nenhuma a menos de 15 km"
                            : `Falta${t.emFalta.length > 1 ? `m ${t.emFalta.length} artigos` : " 1 artigo"}`}
                        </span>
                      )}
                    </span>
                    <span className="pj-num text-right" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--pj-text-muted)" }}>
                      +{eur(totalDe(t) - totalVencedora, 2)} €
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {comparaveisLoja.length > 0 && <BotaoCombustivel d={d} />}

          {/* 3. Dividir por 2 lojas, só quando vale a pena. */}
          {mostrarDivisao && (
            <div style={{ margin: "0 16px 12px", padding: "10px 12px", borderRadius: 12, background: "var(--pj-surface)", border: "1px solid var(--pj-border)" }}>
              <div className="flex items-center justify-between gap-2">
                <p style={{ fontSize: 13, color: "var(--pj-text)", lineHeight: 1.4 }}>
                  Ou divide por <strong>{juntarNomes(divisao.lojas)}</strong>
                </p>
                <span className="pj-num" style={{ fontSize: 13, fontWeight: 700, color: d.divisaoCarro && !d.divisaoCarro.faltam && !d.divisaoCarro.compensa ? "var(--pj-text-faint)" : "var(--pj-brand-ink)", textDecoration: d.divisaoCarro && !d.divisaoCarro.faltam && !d.divisaoCarro.compensa ? "line-through" : "none" }}>
                  −{eur(divisao.poupancaExtra, 2)} €
                </span>
              </div>
              {d.divisaoCarro && !d.divisaoCarro.faltam && (
                <p className="pj-num" style={{ fontSize: 11.5, marginTop: 2, color: d.divisaoCarro.compensa ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
                  {d.divisaoCarro.compensa
                    ? `Com o carro ainda poupas ${eur(d.divisaoCarro.saldo, 2)} € (+${d.divisaoCarro.minutosExtra} min)`
                    : `Com o carro não compensa: gastas ${eur(d.divisaoCarro.combustivelExtra, 2)} € a mais`}
                </p>
              )}
              <button onClick={() => setVerDivisao((v) => !v)} aria-expanded={verDivisao} className="pj-tap"
                style={{ background: "transparent", border: 0, padding: "4px 0 0", fontSize: 12, fontWeight: 600, color: "var(--pj-text-muted)" }}>
                {verDivisao ? "Esconder" : "O que comprar em cada"}
              </button>
              {verDivisao && divisao.lojas.map((s) => (
                <p key={s} style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 4, lineHeight: 1.45 }}>
                  <strong style={{ color: "var(--pj-text)" }}>{nomeCadeia(s)}:</strong>{" "}
                  {divisao.atribuicao[s].map((id) => linhas.find((l) => String(l.item.id) === id)?.item.nome).filter(Boolean).join(", ")}
                </p>
              ))}
            </div>
          )}

          {/* 4. A ação. */}
          <div style={{ padding: "0 16px 14px" }}>
            {!escolha ? (
              <>
                <button onClick={() => escolher("unica", vencedora.loja)} className="pj-tap press w-full"
                  style={{ background: "var(--pj-brand)", color: "#fff", border: 0, borderRadius: 12, padding: "13px 0", fontSize: 14.5, fontWeight: 600 }}>
                  Vou comprar no {nomeCadeia(vencedora.loja)}
                </button>
                {mostrarDivisao && (!d.divisaoCarro || d.divisaoCarro.faltam || d.divisaoCarro.compensa) && (
                  <button onClick={() => escolher("divisao")} className="pj-tap w-full"
                    style={{ background: "transparent", border: 0, padding: "10px 0 0", fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
                    Vou dividir por {juntarNomes(divisao.lojas)}
                  </button>
                )}
              </>
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

      {desceram.length > 0 && (
        <p style={{ padding: "0 16px 10px", fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
          {desceram.length === 1 ? `«${desceram[0].item.nome}» desceu de preço ou está em promoção.` : `${desceram.length} artigos que vigias desceram ou estão em promoção.`}
        </p>
      )}

      {/* 5. Artigo a artigo: fechado por omissão. */}
      <button onClick={() => setVerDetalhe((v) => !v)} aria-expanded={verDetalhe} className="pj-tap press w-full flex items-center justify-between"
        style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--pj-text)", background: "var(--pj-surface)", border: 0, borderTop: "1px solid var(--pj-subtle)" }}>
        <span>Artigos <span style={{ color: "var(--pj-text-faint)", fontWeight: 500 }}>· escolher marca, vigiar preço</span></span>
        <ChevronDown size={16} style={{ color: "var(--pj-text-muted)", transform: verDetalhe ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {verDetalhe && (
        <div>
          {avisoVigiar && <p role="status" style={{ padding: "8px 16px", fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{avisoVigiar}</p>}
          {linhas.map((l, i) => {
            const opcoes = Object.entries(l.custos).map(([s, v]) => ({ loja: s, ...v })).sort((a, b) => a.custo - b.custo);
            const top = opcoes[0];
            const escolhida = opcoes.find((o) => o.escolhido);
            const mostrado = escolhida || top;
            const alerta = alertas.find((a) => a.q === l.q);
            const atual = alerta?.tipo === "vigiar" ? atualDe(l.dados) : null;
            const aviso = atual && atual.unidade === alerta.unidade ? avaliarVigia(alerta, atual) : null;
            const desceu = aviso && (aviso.motivo === "desceu" || aviso.motivo === "promo");
            const aberto = aEscolher === l.item.id;
            return (
              <div key={l.item.id || i} style={{ padding: "10px 16px", borderTop: "1px solid var(--pj-subtle)" }}>
                <div className="flex items-center gap-2">
                  <span className="flex-1 min-w-0">
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" }}>
                      {l.item.nome}{l.item.qty > 1 ? <span style={{ color: "var(--pj-text-faint)", fontWeight: 500 }}> ×{l.item.qty}</span> : null}
                      {escolhida && <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 999, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)", fontSize: 10.5, fontWeight: 700 }}>a tua escolha</span>}
                      {desceu && <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 999, background: "var(--pj-brand-wash)", color: "var(--pj-brand-ink)", fontSize: 10.5, fontWeight: 700 }}>{aviso.motivo === "desceu" ? "desceu" : "promoção"}</span>}
                    </span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {mostrado ? `${nomeCadeia(mostrado.loja)} · ${mostrado.produto.nome}` : l.erro ? "Sem ligação" : "Sem preço"}
                    </span>
                  </span>
                  {mostrado && <span className="pj-num" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--pj-text)" }}>{eur(mostrado.custo, 2)} €</span>}
                  {l.dados && mostrado && (
                    <button onClick={() => setAEscolher(aberto ? null : l.item.id)} aria-expanded={aberto} aria-label={`Trocar o produto de ${l.item.nome}`}
                      className="pj-tap flex items-center justify-center flex-none"
                      style={{ height: 32, padding: "0 10px", borderRadius: 999, border: 0, fontSize: 12, fontWeight: 600, background: aberto ? "var(--pj-text)" : "var(--pj-subtle)", color: aberto ? "var(--pj-card)" : "var(--pj-text)" }}>
                      Trocar
                    </button>
                  )}
                  {mostrado && l.dados && (
                    <button onClick={() => alternarVigia(l)} aria-pressed={!!alerta} aria-label={alerta ? `Deixar de vigiar ${l.item.nome}` : `Avisar quando ${l.item.nome} descer de preço`}
                      className="pj-tap flex items-center justify-center flex-none"
                      style={{ width: 32, height: 32, borderRadius: 999, border: 0, background: alerta ? "var(--pj-brand-wash)" : "transparent", color: alerta ? "var(--pj-brand-ink)" : "var(--pj-text-faint)" }}>
                      {alerta ? <BellRing size={15} /> : <Bell size={15} />}
                    </button>
                  )}
                </div>
                {aberto && <EscolherProduto dados={l.dados} escolha={escolhas[String(l.item.id)]} onEscolher={(p) => escolherProduto(l, p)} />}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-2" style={{ padding: "0 16px", borderTop: "1px solid var(--pj-subtle)" }}>
        <span style={{ ...pequeno, padding: "10px 0" }}>
          {comparaveis.length} {comparaveis.length === 1 ? "artigo" : "artigos"}, mesma quantidade em todas{notas.length ? ` · ${notas.join(" · ")}` : ""}
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

/*
 * Lista de produtos para um artigo: os que são mesmo o artigo, ordenados
 * pelo preço ao kg / L / unidade. Tocar num fixa-o para essa loja.
 */
function EscolherProduto({ dados, escolha, onEscolher }) {
  const lista = alternativas(dados);
  const modo = dados.modo || "unidade";
  if (!lista.length) return <p style={{ fontSize: 12, color: "var(--pj-text-faint)", marginTop: 8 }}>Sem outros produtos para escolher.</p>;
  return (
    <div style={{ marginTop: 8, borderRadius: 12, border: "1px solid var(--pj-border)", overflow: "hidden" }}>
      <button onClick={() => onEscolher(null)} className="pj-tap w-full text-left"
        style={{ display: "block", padding: "9px 12px", background: !escolha ? "var(--pj-brand-wash)" : "transparent", border: 0, fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
        {!escolha ? "✓ " : ""}O mais barato de cada loja
      </button>
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {lista.map((p) => {
          const ativo = escolha && escolha.loja === p.loja && String(escolha.id) === String(p.id);
          return (
            <button key={`${p.loja}-${p.id}`} onClick={() => onEscolher(p)} aria-pressed={!!ativo} className="pj-tap w-full text-left flex items-center gap-2"
              style={{ padding: "8px 12px", borderTop: "1px solid var(--pj-subtle)", background: ativo ? "var(--pj-brand-wash)" : "transparent", border: 0 }}>
              <span className="flex-1 min-w-0">
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ativo ? "✓ " : ""}{p.nome}
                </span>
                <span style={{ display: "block", fontSize: 11, color: "var(--pj-text-faint)" }}>
                  {[nomeCadeia(p.loja), p.marca, p.aoPeso ? "ao peso" : p.quantidade].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="pj-num text-right flex-none" style={{ fontSize: 12, fontWeight: 600, color: "var(--pj-text)" }}>
                {modo === "embalagem" ? `${eur(p.preco, 2)} €` : `${eur(p.precoUnidade, 2)} €/${p.nomeUnidade || p.unidade}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
