import { useState, useEffect } from "react";
import { Building2, Plus, Pencil, Home } from "lucide-react";
import { eur } from "./lib/formato";
import { falta } from "./lib/datas";
import FonteOficial from "./FonteOficial";
import { Campo, BotaoPrincipal, Chip, Nota, Erro, Folha, Cartao, ROTULO } from "./UiSimples";

const EURIBOR_REF = { "3M": -0.568, "6M": -0.543, "12M": -0.477 };

/*
 * Coeficiente de actualização das rendas (NRAU), em %, por ano em que se
 * aplica. Publicado pelo INE em Setembro do ano anterior.
 *
 * A tabela estava desalinhada: tinha 2,16 em 2024 (é o de 2025) e 2,77 em
 * 2025 (não corresponde a ano nenhum), e acabava em 2025 — em 2026 a app
 * aplicava 2,77% a toda a gente.
 *
 *   2023: 2,00 — o INE calculou 5,43, mas a Lei 19/2022 limitou-o a 2%
 *   2024: 6,94 · 2025: 2,16 · 2026: 2,24 (Aviso INE 23174/2025/2)
 *   2027: 2,56 — apurado pelo INE a 10/09/2026; o aviso no DR sai até 30/10
 *
 * Acrescentar o ano seguinte todos os Setembros.
 */
const COEF_RENDAS = { 2023: 2.00, 2024: 6.94, 2025: 2.16, 2026: 2.24, 2027: 2.56 };
const ANOS_COEF = Object.keys(COEF_RENDAS).map(Number).sort((a, b) => a - b);

/** Coeficiente para o ano em que a revisão acontece — não o ano de hoje. */
function coefRendaPara(ano) {
  if (COEF_RENDAS[ano] != null) return { coef: COEF_RENDAS[ano], ano, estimado: false };
  // Ano ainda sem coeficiente publicado: usa o último conhecido e di-lo.
  const ultimo = ANOS_COEF[ANOS_COEF.length - 1];
  return { coef: COEF_RENDAS[ultimo], ano: ultimo, estimado: true };
}
const CHAVE = "poupeja_casa";

const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const INDEXANTES = { "3M": "3 meses", "6M": "6 meses", "12M": "12 meses" };

function lerLocal() {
  try { return JSON.parse(localStorage.getItem(CHAVE) || "{}"); } catch { return {}; }
}
function guardarLocal(d) {
  try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch {}
}

function calcPMT(capital, spreadPct, euriborPct, prazoAnos) {
  const r = (spreadPct + Math.max(euriborPct, 0)) / 100 / 12;
  const n = Math.round(prazoAnos * 12);
  if (n <= 0) return 0;
  if (r <= 0) return capital / n;
  return capital * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

const euros = v => `${Math.round(v).toLocaleString("pt-PT")} €`;
/** Aceita "1,2", "120 000 €", "1.2%". */
const numero = s => Number(String(s ?? "").replace(/[\s€%]/g, "").replace(",", "."));
const paraCampo = v => (v == null || v === "" ? "" : String(v).replace(".", ","));

function diasAte(anoMes) {
  if (!anoMes) return null;
  const [a, m] = anoMes.split("-").map(Number);
  return Math.round((new Date(a, m - 1, 1) - new Date()) / 86400000);
}

function mesLabel(anoMes) {
  if (!anoMes) return "—";
  const [a, m] = anoMes.split("-").map(Number);
  return `${MESES[m - 1]} de ${a}`;
}

function proximoMesRevisaoRenda(mesRevisao) {
  const hoje = new Date();
  let ano = hoje.getFullYear();
  if (hoje.getMonth() + 1 >= mesRevisao) ano++;
  return `${ano}-${String(mesRevisao).padStart(2, "0")}`;
}

/* Linha "rótulo ........ valor" dos cartões. */
function Facto({ rotulo, children, tom }) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ minHeight: 40, borderTop: "1px solid var(--pj-subtle)", fontSize: 14 }}>
      <span style={{ color: "var(--pj-text-muted)", whiteSpace: "nowrap" }}>{rotulo}</span>
      <span className="text-right" style={{ fontWeight: 600, color: tom || "var(--pj-text)" }}>{children}</span>
    </div>
  );
}

/* Ainda por configurar: mesma linha que as contas nas Renovações. */
function LinhaConfigurar({ Icone, titulo, texto, onClick }) {
  return (
    <button onClick={onClick} className="press pj-tap w-full text-left flex items-center gap-3"
      style={{ minHeight: 64, padding: "12px 14px", borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
      <Icone size={20} style={{ color: "var(--pj-brand-ink)", flexShrink: 0 }} aria-hidden="true" />
      <span className="flex-1 min-w-0">
        <span className="block" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{titulo}</span>
        <span className="block" style={{ fontSize: 12, color: "var(--pj-text-muted)" }}>{texto}</span>
      </span>
      <Plus size={18} style={{ color: "var(--pj-text-faint)", flexShrink: 0 }} aria-hidden="true" />
    </button>
  );
}

function CabecalhoCartao({ titulo, onEditar }) {
  return (
    <div className="flex items-center justify-between">
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{titulo}</p>
      <button onClick={onEditar} aria-label={`Editar ${titulo.toLowerCase()}`} className="press pj-tap flex items-center justify-center"
        style={{ width: 44, height: 44, marginRight: -10, marginTop: -10, background: "none", border: 0 }}>
        <Pencil size={16} style={{ color: "var(--pj-text-muted)" }} />
      </button>
    </div>
  );
}

function BlocoCredito({ credito: c, euribor, carregando, onEditar }) {
  if (!c) return (
    <LinhaConfigurar Icone={Home} titulo="Crédito habitação" texto="Vê a prestação com a Euribor deste mês" onClick={onEditar} />
  );

  const idx = c.indexante || "6M";
  const eurVal = euribor?.[idx]?.valor;
  const prestacao = eurVal != null ? calcPMT(c.capital, c.spread, eurVal, c.prazo) : null;
  const diferenca = prestacao != null ? prestacao - calcPMT(c.capital, c.spread, EURIBOR_REF[idx], c.prazo) : null;
  const dias = diasAte(c.dataRevisao);

  return (
    <Cartao className="p-4">
      <CabecalhoCartao titulo="Crédito habitação" onEditar={onEditar} />
      {prestacao != null ? (
        <>
          <p className="font-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.1 }}>
            {euros(prestacao)}<span style={{ fontSize: 15, color: "var(--pj-text-muted)", fontWeight: 500 }}> /mês</span>
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--pj-text-muted)", marginTop: 4 }}>
            Prestação estimada com a Euribor a {INDEXANTES[idx]} ({eur(eurVal, 3)}%) + spread de {eur(c.spread, 2)}%.
          </p>
          {diferenca != null && Math.abs(diferenca) >= 1 && (
            <p style={{ fontSize: 14, color: "var(--pj-text)", marginTop: 8 }}>
              <strong style={{ color: diferenca > 0 ? "var(--pj-danger)" : "var(--pj-brand-ink)" }}>
                {diferenca > 0 ? "Mais" : "Menos"} {euros(Math.abs(diferenca))}/mês
              </strong>{" "}do que em janeiro de 2022.
            </p>
          )}
        </>
      ) : (
        <p style={{ fontSize: 14, color: "var(--pj-text-muted)", padding: "8px 0" }}>
          {carregando ? "A carregar a Euribor…" : "Não foi possível obter a Euribor agora. Tenta mais tarde."}
        </p>
      )}
      <div className="mt-3">
        <Facto rotulo="Capital em dívida">{euros(c.capital)}</Facto>
        <Facto rotulo="Prazo restante">{c.prazo} anos</Facto>
        {dias != null && (
          <Facto rotulo="Próxima revisão" tom={dias < 0 ? "var(--pj-danger)" : dias <= 30 ? "var(--pj-warn)" : null}>
            {dias < 0 ? "já passou — confirma com o banco" : <>{mesLabel(c.dataRevisao)}<span className="block" style={{ fontSize: 12, fontWeight: 400, color: "var(--pj-text-faint)" }}>{falta(dias)}</span></>}
          </Facto>
        )}
      </div>
    </Cartao>
  );
}

function BlocoRenda({ renda: r, onEditar }) {
  if (!r) return (
    <LinhaConfigurar Icone={Building2} titulo="Renda" texto="Vê quanto pode subir na próxima revisão" onClick={onEditar} />
  );

  const proxRevisao = proximoMesRevisaoRenda(r.mesRevisao || 1);
  const dias = diasAte(proxRevisao);
  // Uma renda revista em Fevereiro, vista em Setembro, sobe em Fevereiro do
  // ano seguinte — com o coeficiente desse ano, não o de agora.
  const { coef, ano: anoCoef, estimado } = coefRendaPara(Number(proxRevisao.slice(0, 4)));
  const aumentoMensal = r.valor * coef / 100;

  return (
    <Cartao className="p-4">
      <CabecalhoCartao titulo="Renda" onEditar={onEditar} />
      <p className="font-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.1 }}>
        {euros(r.valor)}<span style={{ fontSize: 15, color: "var(--pj-text-muted)", fontWeight: 500 }}> /mês</span>
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--pj-text)", marginTop: 8 }}>
        Em {mesLabel(proxRevisao)} pode subir até <strong>{euros(aumentoMensal)}</strong> e passar
        a <strong>{euros(r.valor + aumentoMensal)}/mês</strong>
        {dias != null && dias >= 0 && <span style={{ color: "var(--pj-text-muted)" }}> ({falta(dias)})</span>}.
      </p>
      <p style={{ fontSize: 12, color: "var(--pj-text-muted)", marginTop: 4 }}>
        Coeficiente de {eur(coef, 2)}%{estimado ? ` — ainda sem valor para ${proxRevisao.slice(0, 4)}, usamos o de ${anoCoef}` : ` para ${anoCoef}`}.
        O senhorio tem de avisar por escrito com 30 dias de antecedência.
      </p>
      <FonteOficial fontes={["rendas", "ine"]} prefixo="Coeficiente" className="mt-3" />
    </Cartao>
  );
}

function BlocoEuribor({ euribor, carregando }) {
  if (carregando) return <div className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--pj-subtle)" }} />;
  if (!euribor) return null;
  // A série é a média mensal ("2026-08"), não o valor do dia.
  const periodo = Object.values(euribor).find(d => d?.periodo)?.periodo;
  const mesRef = /^\d{4}-\d{2}$/.test(periodo || "") ? mesLabel(periodo) : null;
  return (
    <Cartao className="p-4">
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>Euribor</p>
      {mesRef && <p style={{ fontSize: 12, color: "var(--pj-text-muted)" }}>Média de {mesRef}</p>}
      <div className="grid grid-cols-3 mt-3">
        {["3M", "6M", "12M"].map((p, i) => (
          <div key={p} className="text-center" style={i > 0 ? { borderLeft: "1px solid var(--pj-subtle)" } : undefined}>
            <p style={{ fontSize: 12, color: "var(--pj-text-muted)" }}>{INDEXANTES[p]}</p>
            <p className="font-display" style={{ fontSize: 19, fontWeight: 600, color: "var(--pj-text)", marginTop: 2 }}>
              {euribor[p] ? `${eur(euribor[p].valor, 3)}%` : "—"}
            </p>
          </div>
        ))}
      </div>
      <FonteOficial fontes="euribor" className="mt-3" />
    </Cartao>
  );
}

/* ─── Formulários ─── */
function FormCredito({ inicial, onGuardar, onRemover }) {
  const [f, setF] = useState({
    capital: paraCampo(inicial?.capital), spread: paraCampo(inicial?.spread), prazo: paraCampo(inicial?.prazo),
    indexante: inicial?.indexante || "6M", dataRevisao: inicial?.dataRevisao || "",
  });
  const [erro, setErro] = useState("");
  const muda = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  function submeter(e) {
    e.preventDefault();
    const capital = numero(f.capital), spread = numero(f.spread), prazo = numero(f.prazo);
    if (!(capital > 0)) { setErro("Indica o capital em dívida."); return; }
    if (!(spread >= 0) || f.spread === "" || spread > 10) { setErro("Indica o spread (ex: 1,2)."); return; }
    if (!(prazo > 0) || prazo > 50) { setErro("Indica os anos que faltam pagar."); return; }
    setErro("");
    onGuardar({ capital, spread, prazo, indexante: f.indexante, dataRevisao: f.dataRevisao });
  }

  return (
    <form onSubmit={submeter} className="flex flex-col gap-4 pb-2" noValidate>
      <Campo label="Capital em dívida" type="text" inputMode="decimal" placeholder="ex: 120 000 €" value={f.capital} onChange={muda("capital")}
        ajuda="Está no extrato do crédito ou na app do banco." />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Spread (%)" type="text" inputMode="decimal" placeholder="ex: 1,2" value={f.spread} onChange={muda("spread")} />
        <Campo label="Anos que faltam" type="text" inputMode="numeric" placeholder="ex: 22" value={f.prazo} onChange={muda("prazo")} />
      </div>
      <div>
        <p style={{ ...ROTULO, marginBottom: 8 }}>Euribor do contrato</p>
        <div className="flex gap-2">
          {Object.entries(INDEXANTES).map(([id, l]) => (
            <Chip key={id} ativo={f.indexante === id} onClick={() => setF(p => ({ ...p, indexante: id }))}>{l}</Chip>
          ))}
        </div>
      </div>
      <Campo label="Próxima revisão da taxa" opcional type="month" value={f.dataRevisao} onChange={muda("dataRevisao")} />
      <Erro>{erro}</Erro>
      <BotaoPrincipal type="submit">Guardar</BotaoPrincipal>
      {onRemover && (
        <button type="button" onClick={onRemover} className="pj-tap" style={{ minHeight: 44, fontSize: 14, fontWeight: 600, color: "var(--pj-danger)", background: "none", border: 0 }}>
          Remover crédito
        </button>
      )}
    </form>
  );
}

function FormRenda({ inicial, onGuardar, onRemover }) {
  const [valor, setValor] = useState(paraCampo(inicial?.valor));
  const [mes, setMes] = useState(String(inicial?.mesRevisao || 1));
  const [erro, setErro] = useState("");

  function submeter(e) {
    e.preventDefault();
    const v = numero(valor);
    if (!(v > 0)) { setErro("Indica o valor da renda."); return; }
    setErro("");
    onGuardar({ valor: v, mesRevisao: Number(mes) });
  }

  return (
    <form onSubmit={submeter} className="flex flex-col gap-4 pb-2" noValidate>
      <Campo label="Renda por mês" type="text" inputMode="decimal" placeholder="ex: 800 €" value={valor} onChange={e => setValor(e.target.value)} />
      <Campo label="Mês em que a renda é atualizada" as="select" value={mes} onChange={e => setMes(e.target.value)}
        ajuda="Normalmente o mês em que o contrato fez anos.">
        {MESES.map((m, i) => <option key={m} value={i + 1}>{m[0].toUpperCase() + m.slice(1)}</option>)}
      </Campo>
      <Erro>{erro}</Erro>
      <BotaoPrincipal type="submit">Guardar</BotaoPrincipal>
      {onRemover && (
        <button type="button" onClick={onRemover} className="pj-tap" style={{ minHeight: 44, fontSize: 14, fontWeight: 600, color: "var(--pj-danger)", background: "none", border: 0 }}>
          Remover renda
        </button>
      )}
    </form>
  );
}

export default function SecaoCasa() {
  const [dados, setDados] = useState({});
  const [euribor, setEuribor] = useState(null);
  const [loadEuribor, setLoadEuribor] = useState(true);
  const [folha, setFolha] = useState(null); // "credito" | "renda"

  useEffect(() => { setDados(lerLocal()); }, []);

  useEffect(() => {
    fetch("/api/euribor")
      .then(r => r.json())
      .then(d => { if (d.euribor) setEuribor(d.euribor); })
      .catch(() => {})
      .finally(() => setLoadEuribor(false));
  }, []);

  function salvar(patch) {
    const novo = { ...dados, ...patch };
    setDados(novo);
    guardarLocal(novo);
    setFolha(null);
  }

  function remover(chave) {
    if (!window.confirm(chave === "credito" ? "Remover o crédito?" : "Remover a renda?")) return;
    salvar({ [chave]: null });
  }

  const c = dados.credito;
  const prestacaoAtual = c && euribor?.[c.indexante || "6M"]
    ? calcPMT(c.capital, c.spread, euribor[c.indexante || "6M"].valor, c.prazo)
    : null;
  const totalCasa = (prestacaoAtual || 0) + (dados.renda?.valor || 0);
  const ambos = prestacaoAtual != null && dados.renda?.valor > 0;

  return (
    <div className="pb-28 pt-3 px-4">
      {ambos && (
        <div className="mb-5 anim-up">
          <p style={{ fontSize: 13, color: "var(--pj-text-muted)" }}>Com a casa pagas</p>
          <p className="font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.1 }}>
            {euros(totalCasa)}<span style={{ fontSize: 15, color: "var(--pj-text-muted)", fontWeight: 500 }}> /mês</span>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 anim-up anim-up-1">
        <BlocoCredito credito={c} euribor={euribor} carregando={loadEuribor} onEditar={() => setFolha("credito")} />
        <BlocoRenda renda={dados.renda} onEditar={() => setFolha("renda")} />
        <BlocoEuribor euribor={euribor} carregando={loadEuribor} />
      </div>

      <Nota className="mt-6 text-center">
        Valores estimados a partir do que indicas. Confirma sempre com o teu banco ou senhorio.
      </Nota>

      {folha === "credito" && (
        <Folha titulo={c ? "Editar crédito" : "Crédito habitação"} onFechar={() => setFolha(null)}>
          <FormCredito inicial={c} onGuardar={v => salvar({ credito: v })} onRemover={c ? () => remover("credito") : null} />
        </Folha>
      )}
      {folha === "renda" && (
        <Folha titulo={dados.renda ? "Editar renda" : "Renda"} onFechar={() => setFolha(null)}>
          <FormRenda inicial={dados.renda} onGuardar={v => salvar({ renda: v })} onRemover={dados.renda ? () => remover("renda") : null} />
        </Folha>
      )}
    </div>
  );
}
