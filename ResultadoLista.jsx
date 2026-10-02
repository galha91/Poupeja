import { useState, useEffect, useMemo } from "react";
import { ChevronDown, RefreshCw, Bell, BellRing, Check } from "lucide-react";
import LogoLoja from "./LogoLoja";
import { Preco } from "./Preco";
import { NotaCobertura } from "./Cobertura";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { melhoresPorLoja } from "./lib/comparacao";
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
const COMPLETAS = COMPARADAS.filter((c) => c.estado === "incluida").map((c) => c.id);
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

export default function ResultadoLista({ linhas, nota = true, onAtualizar }) {
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
  const total = linhas.length;
  const guardados = linhas.filter((l) => l.guardado);
  const maisAntigo = guardados.map((l) => l.dados?.obtidoEm).filter(Boolean).sort()[0];
  const mostrarDivisao = divisao && divisao.poupancaExtra >= 0.1;
  const parcialDe = Object.fromEntries(parciais.map((p) => [p.id, p.lojas]));
  // Lojas que não responderam a nenhum artigo (e não por falta de rede).
  const caladas = LOJAS.filter((s) => linhas.some((l) => l.dados?.lojas) &&
    linhas.every((l) => !l.dados?.lojas || l.dados.lojas.some((x) => x.id === s && !x.ok)));

  // Aviso dentro da app: artigos vigiados que desceram ou entraram em promoção.
  const desceram = linhas.filter((l) => {
    const a = alertas.find((x) => x.q === l.q && x.tipo === "vigiar");
    const atual = a && atualDe(l.dados);
    return atual && atual.unidade === a.unidade && avaliarVigia(a, atual).motivo;
  });

  function escolher(plano) {
    const valor = poupancaDaEscolha(r, plano);
    const lojasEscolha = plano === "divisao" ? divisao.lojas : [unica.loja];
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

  const linha = { padding: "10px 16px", borderTop: "1px solid var(--pj-subtle)" };
  const pequeno = { fontSize: 11.5, color: "var(--pj-text-faint)", lineHeight: 1.5 };

  return (
    <div style={{ borderRadius: 18, background: "var(--pj-card)", border: "1px solid var(--pj-border)", overflow: "hidden" }}>
      {unica ? (
        <>
          <div style={{ background: "var(--pj-brand)", color: "#fff", padding: "12px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>{maiuscula(TEXTO_COBERTURA.maisBarato)}</p>
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>{nomeCadeia(unica.loja)}</p>
              <Preco valor={unica.total} casas={2} tamanho={20} cor="#fff" />
            </div>
          </div>

          <div style={{ padding: "12px 16px 4px" }}>
            {grupo.length > 1 ? (
              <p style={{ fontSize: 13.5, color: "var(--pj-text)", lineHeight: 1.5 }}>
                Poupas <strong className="pj-num">{eur(r.poupancaUnica, 2)} €</strong> face ao {nomeCadeia(maisCara.loja)}, a opção mais cara.
              </p>
            ) : (
              <p style={{ fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>Só este supermercado tem estes artigos todos.</p>
            )}
          </div>

          {mostrarDivisao && (
            <div style={{ margin: "8px 16px 4px", padding: "10px 12px", borderRadius: 12, background: "var(--pj-brand-wash)" }}>
              <p style={{ fontSize: 13.5, color: "var(--pj-text)", lineHeight: 1.5 }}>
                Dividindo por <strong>{juntarNomes(divisao.lojas)}</strong>: <strong className="pj-num">{eur(divisao.total, 2)} €</strong>,
                poupas mais <strong className="pj-num" style={{ color: "var(--pj-brand-ink)" }}>{eur(divisao.poupancaExtra, 2)} €</strong>
                {" "}({eur(maisCara.total - divisao.total, 2)} € face à mais cara).
              </p>
              <button onClick={() => setVerDivisao((v) => !v)} aria-expanded={verDivisao} className="pj-tap"
                style={{ background: "transparent", border: 0, padding: "6px 0 0", fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
                {verDivisao ? "Esconder" : "O que comprar em cada"}
              </button>
              {verDivisao && divisao.lojas.map((s) => (
                <p key={s} style={{ fontSize: 12.5, color: "var(--pj-text-muted)", marginTop: 6, lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--pj-text)" }}>{nomeCadeia(s)}:</strong>{" "}
                  {divisao.atribuicao[s].map((id) => linhas.find((l) => String(l.item.id) === id)?.item.nome).filter(Boolean).join(", ")}
                </p>
              ))}
            </div>
          )}

          <div style={{ padding: "4px 0" }}>
            {porLoja.map((t, i) => (
              <div key={t.loja} className="flex items-center gap-3" style={{ padding: "9px 16px", borderTop: i ? "1px solid var(--pj-subtle)" : "none" }}>
                <LogoLoja loja={nomeCadeia(t.loja)} size={30} radius={8} />
                <span className="flex-1 min-w-0">
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{nomeCadeia(t.loja)}</span>
                  {t.emFalta.length > 0 && (
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--pj-text-faint)" }}>
                      Não tem {t.emFalta.length === 1 ? "1 artigo" : `${t.emFalta.length} artigos`} da lista
                    </span>
                  )}
                </span>
                <span className="text-right">
                  <Preco valor={t.total} casas={2} tamanho={17} cor={i === 0 ? "var(--pj-brand-ink)" : "var(--pj-text)"} />
                  {i > 0 && <span className="pj-num" style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--pj-text-faint)" }}>+{eur(t.total - unica.total, 2)} €</span>}
                </span>
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 16px 14px", borderTop: "1px solid var(--pj-subtle)" }}>
            {!escolha ? (
              <>
                <button onClick={() => escolher("unica")} className="pj-tap press w-full"
                  style={{ background: "var(--pj-brand)", color: "#fff", border: 0, borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 600 }}>
                  Vou comprar no {nomeCadeia(unica.loja)}
                </button>
                {mostrarDivisao && (
                  <button onClick={() => escolher("divisao")} className="pj-tap w-full"
                    style={{ background: "transparent", border: 0, padding: "10px 0 2px", fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
                    Vou dividir por {juntarNomes(divisao.lojas)}
                  </button>
                )}
              </>
            ) : (
              <p role="status" className="flex items-start gap-2" style={{ fontSize: 13, color: "var(--pj-text)", lineHeight: 1.5 }}>
                <Check size={16} style={{ color: "var(--pj-brand-ink)", flexShrink: 0, marginTop: 2 }} />
                <span>
                  Registámos uma poupança estimada de <strong className="pj-num">{eur(escolha.valor, 2)} €</strong>.
                  {" "}Esta semana já vais em <strong className="pj-num">{eur(escolha.semana, 2)} €</strong> — vê o total em Poupança.
                </span>
              </p>
            )}
            <p style={{ ...pequeno, marginTop: 8 }}>
              Total dos {comparaveis.length} artigos que estas lojas têm, na mesma quantidade em todas.
              {comparaveis.length < total - semPreco.length && ` ${total - semPreco.length - comparaveis.length} ficaram de fora da soma por não estarem em todas.`}
            </p>
          </div>
        </>
      ) : (
        <p style={{ padding: 16, fontSize: 13.5, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
          Não encontrámos preços para estes artigos. Experimenta nomes mais simples (ex.: «arroz», «leite»).
        </p>
      )}

      {semPreco.length > 0 && (
        <p style={{ ...linha, fontSize: 12.5, color: "var(--pj-text-muted)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--pj-text)" }}>Sem preço disponível:</strong> {semPreco.map((l) => l.nome).join(", ")}.
        </p>
      )}

      {guardados.length > 0 && (
        <p style={{ ...linha, ...pequeno }}>
          Sem ligação: {guardados.length === total ? "todos os preços são" : `${guardados.length} preços são`} os últimos que guardámos{maisAntigo ? ` (de ${quando(maisAntigo)})` : ""}.
        </p>
      )}
      {caladas.length > 0 && (
        <p style={{ ...linha, ...pequeno }}>{juntarNomes(caladas)} {caladas.length > 1 ? "não responderam agora e ficaram" : "não respondeu agora e ficou"} de fora desta comparação.</p>
      )}

      {desceram.length > 0 && (
        <p style={{ ...linha, fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
          {desceram.length === 1 ? `«${desceram[0].item.nome}», que vigias, desceu de preço ou está em promoção.` : `${desceram.length} artigos que vigias desceram de preço ou estão em promoção.`}
        </p>
      )}

      <button onClick={() => setVerDetalhe((v) => !v)} aria-expanded={verDetalhe} className="pj-tap press w-full flex items-center justify-center gap-1"
        style={{ padding: "12px 0", fontSize: 12.5, fontWeight: 600, color: "var(--pj-text-muted)", background: "var(--pj-surface)", border: 0, borderTop: "1px solid var(--pj-subtle)" }}>
        {verDetalhe ? "Esconder" : "Ver"} artigo a artigo
        <ChevronDown size={14} style={{ transform: verDetalhe ? "rotate(180deg)" : "none" }} />
      </button>
      {verDetalhe && (
        <div>
          {avisoVigiar && <p role="status" style={{ ...linha, fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>{avisoVigiar}</p>}
          {linhas.map((l, i) => {
            const opcoes = Object.entries(l.custos).map(([s, v]) => ({ loja: s, ...v })).sort((a, b) => a.custo - b.custo);
            const top = opcoes[0];
            const alerta = alertas.find((a) => a.q === l.q);
            const atual = alerta?.tipo === "vigiar" ? atualDe(l.dados) : null;
            const aviso = atual && atual.unidade === alerta.unidade ? avaliarVigia(alerta, atual) : null;
            const lojasCom = parcialDe[String(l.item.id)];
            const so = lojasCom && COMPLETAS.some((s) => !lojasCom.includes(s)) ? lojasCom : null;
            return (
              <div key={l.item.id || i} className="flex items-center gap-3" style={linha}>
                <span className="flex-1 min-w-0">
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--pj-text)" }}>
                    {l.item.nome}{l.item.qty > 1 ? ` ×${l.item.qty}` : ""}
                  </span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--pj-text-faint)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {top ? `${nomeCadeia(top.loja)} · ${top.produto.nome}${l.referencia ? ` · ${String(l.referencia.qtd).replace(".", ",")} ${l.referencia.unidade}` : ""}`
                      : l.erro ? "Sem ligação e sem preços guardados" : "Sem preço disponível"}
                  </span>
                  {top && so && <span style={{ display: "block", fontSize: 11.5, color: "var(--pj-text-faint)" }}>Só no {juntarNomes(so)}</span>}
                  {aviso && (aviso.motivo === "desceu" || aviso.motivo === "promo") && (
                    <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
                      {aviso.motivo === "desceu" ? `Desceu desde que vigias (era ${eur(alerta.referencia, 2)} €)` : "Entrou em promoção"}
                    </span>
                  )}
                </span>
                {top && <span className="pj-num" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--pj-text)" }}>{eur(top.custo, 2)} €</span>}
                {top && l.dados && (
                  <button onClick={() => alternarVigia(l)} aria-pressed={!!alerta} aria-label={alerta ? `Deixar de vigiar ${l.item.nome}` : `Vigiar o preço de ${l.item.nome}`}
                    className="pj-tap flex items-center justify-center flex-none"
                    style={{ width: 36, height: 36, borderRadius: 10, border: 0, background: alerta ? "var(--pj-brand-wash)" : "var(--pj-subtle)", color: alerta ? "var(--pj-brand-ink)" : "var(--pj-text-muted)" }}>
                    {alerta ? <BellRing size={15} /> : <Bell size={15} />}
                  </button>
                )}
              </div>
            );
          })}
          <p style={{ ...linha, ...pequeno }}>
            O sino vigia o preço: avisamos quando descer ou entrar em promoção. Os artigos vigiados ficam guardados neste dispositivo (e na tua conta, se tiveres sessão iniciada).
          </p>
        </div>
      )}
      <div className="flex items-center justify-between gap-2" style={{ padding: "0 16px", borderTop: "1px solid var(--pj-subtle)" }}>
        {nota ? <NotaCobertura /> : <span />}
        <button onClick={onAtualizar} className="pj-tap flex items-center gap-1.5 flex-none"
          style={{ padding: "10px 0", fontSize: 12.5, fontWeight: 600, color: "var(--pj-brand-ink)", background: "transparent", border: 0 }}>
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>
    </div>
  );
}
