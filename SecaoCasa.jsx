import { useState, useEffect, useId } from "react";
import { Building2, Plus, Pencil, Home } from "lucide-react";
import { eur } from "./lib/formato";
import { falta } from "./lib/datas";
import { prestacao as calcPrestacao, taxaAnual, simular } from "./lib/credito";
import FonteOficial from "./FonteOficial";
import { Campo, BotaoPrincipal, BotaoSecundario, Chip, Nota, Erro, Folha, Cartao, ROTULO, useDesfazer } from "./UiSimples";

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
  return calcPrestacao(capital, taxaAnual(euriborPct, spreadPct), prazoAnos * 12);
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

/* ─── Simulador "E se…?" ─── */
const SIM_PADRAO = { capital: 150000, spread: 1, anos: 30 };

/** "22 anos", "21 anos e 4 meses", "8 meses" */
function prazoTexto(meses) {
  const a = Math.floor(meses / 12), m = meses % 12;
  const pa = a ? `${a} ${a === 1 ? "ano" : "anos"}` : "";
  const pm = m ? `${m} ${m === 1 ? "mês" : "meses"}` : "";
  return [pa, pm].filter(Boolean).join(" e ") || "0 meses";
}

function Deslizador({ label, texto, valor, min, max, step, onChange, extremos, children }) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} style={ROTULO}>{label}</label>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{texto}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={valor} aria-valuetext={texto}
        onChange={e => onChange(Number(e.target.value))} style={{ marginTop: 12, accentColor: "var(--pj-brand)" }} />
      <div className="flex justify-between" style={{ fontSize: 11, color: "var(--pj-text-faint)", marginTop: 4 }}>
        <span>{extremos[0]}</span>{children}<span>{extremos[1]}</span>
      </div>
    </div>
  );
}

function Simulador({ credito, euribor }) {
  const idx = credito?.indexante || "6M";
  const euriborHoje = euribor?.[idx]?.valor ?? null;
  const base = credito || SIM_PADRAO;

  const [capital, setCapital] = useState(String(base.capital));
  const [spread, setSpread] = useState(base.spread);
  const [anos, setAnos] = useState(base.anos ?? base.prazo);
  const [eurSim, setEurSim] = useState(euriborHoje ?? 2.5);
  const [amortizar, setAmortizar] = useState(false);
  const [amort, setAmort] = useState("");
  const [modo, setModo] = useState("prestacao");

  // A Euribor chega depois do primeiro desenho: entra como ponto de partida.
  useEffect(() => { if (euriborHoje != null) setEurSim(euriborHoje); }, [euriborHoje]);

  const cap = numero(capital);
  const valido = cap > 0;
  const r = valido ? simular({ capital: cap, spread, euribor: eurSim, anos, amortizacao: amortizar ? numero(amort) : 0, modo }) : null;
  const hoje = credito && euriborHoje != null ? calcPMT(credito.capital, credito.spread, euriborHoje, credito.prazo) : null;
  const delta = r && hoje != null ? r.prestacao - hoje : null;
  const mexido = credito
    ? cap !== credito.capital || spread !== credito.spread || anos !== credito.prazo || (euriborHoje != null && Math.abs(eurSim - euriborHoje) > 1e-9) || amortizar
    : false;

  function repor() {
    setCapital(String(base.capital)); setSpread(base.spread); setAnos(base.anos ?? base.prazo);
    if (euriborHoje != null) setEurSim(euriborHoje);
    setAmortizar(false); setAmort("");
  }

  return (
    <Cartao className="p-4">
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{credito ? "E se…?" : "Simular um crédito"}</p>
      <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 2 }}>
        {credito ? "Mexe nos valores e vê a prestação mudar." : "Para quem vai comprar casa: mexe nos valores e vê a prestação."}
      </p>

      {/* Resultado — fica em cima, à vista enquanto se mexe */}
      <div className="mt-4 p-4" style={{ borderRadius: 14, background: "var(--pj-subtle)" }} aria-live="polite">
        {r ? (
          <>
            <p className="font-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.1 }}>
              {euros(r.prestacao)}<span style={{ fontSize: 15, color: "var(--pj-text-muted)", fontWeight: 500 }}> /mês</span>
            </p>
            {delta != null && mexido && Math.abs(delta) >= 1 && (
              <p style={{ fontSize: 14, marginTop: 4 }}>
                <strong style={{ color: delta > 0 ? "var(--pj-danger)" : "var(--pj-brand-ink)" }}>
                  {delta > 0 ? "+" : "−"}{euros(Math.abs(delta))}/mês
                </strong>
                <span style={{ color: "var(--pj-text-muted)" }}> do que pagas hoje</span>
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 mt-3" style={{ fontSize: 12, color: "var(--pj-text-muted)" }}>
              <div>Taxa (TAN)<span className="block" style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{eur(r.taxa, 2)}%</span></div>
              <div>Juros até ao fim<span className="block" style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)" }}>{euros(r.juros)}</span></div>
            </div>
            {amortizar && numero(amort) > 0 && (
              <p style={{ fontSize: 13, color: "var(--pj-text)", marginTop: 10, lineHeight: 1.5 }}>
                {modo === "prazo"
                  ? <>Acabas <strong>{prazoTexto(Math.max(Math.round(anos * 12) - r.meses, 0))}</strong> mais cedo</>
                  : <>Mesmo prazo, prestação mais baixa</>}
                {" "}e poupas <strong style={{ color: "var(--pj-brand-ink)" }}>{euros(r.poupancaJuros)}</strong> em juros.
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: 14, color: "var(--pj-text-muted)" }}>Indica o capital para simular.</p>
        )}
      </div>

      <div className="flex flex-col gap-5 mt-5">
        <Deslizador label={`Euribor ${INDEXANTES[idx]}`} texto={`${eur(eurSim, 2)}%`} valor={eurSim} min={-0.5} max={5} step={0.05}
          onChange={setEurSim} extremos={["−0,5%", "5%"]}>
          {euriborHoje != null && Math.abs(eurSim - euriborHoje) > 1e-9 && (
            <button type="button" onClick={() => setEurSim(euriborHoje)} className="pj-tap"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--pj-brand-ink)", background: "none", border: 0, padding: "0 8px", minHeight: 28 }}>
              Voltar à de hoje ({eur(euriborHoje, 3)}%)
            </button>
          )}
        </Deslizador>
        <Deslizador label="Spread" texto={`${eur(spread, 2)}%`} valor={spread} min={0.3} max={3} step={0.05}
          onChange={setSpread} extremos={["0,3%", "3%"]} />
        <Deslizador label="Anos que faltam" texto={`${anos} anos`} valor={anos} min={5} max={40} step={1}
          onChange={setAnos} extremos={["5", "40"]} />
        <Campo label="Capital em dívida" type="text" inputMode="decimal" value={capital} onChange={e => setCapital(e.target.value)} />

        <label className="flex items-center gap-3" style={{ minHeight: 44, fontSize: 14, color: "var(--pj-text)" }}>
          <input type="checkbox" checked={amortizar} onChange={e => setAmortizar(e.target.checked)} style={{ width: 22, height: 22, accentColor: "var(--pj-brand)" }} />
          Amortizar parte do crédito
        </label>
        {amortizar && (
          <div className="flex flex-col gap-3" style={{ marginTop: -8 }}>
            <Campo label="Quanto amortizas" type="text" inputMode="decimal" placeholder="ex: 10 000 €" value={amort}
              onChange={e => setAmort(e.target.value)}
              ajuda="Em taxa variável o banco pode cobrar até 0,5% do valor amortizado (2% em taxa fixa)." />
            <div className="flex gap-2 flex-wrap">
              <Chip ativo={modo === "prestacao"} onClick={() => setModo("prestacao")}>Baixar a prestação</Chip>
              <Chip ativo={modo === "prazo"} onClick={() => setModo("prazo")}>Acabar mais cedo</Chip>
            </div>
          </div>
        )}

        {mexido && <BotaoSecundario onClick={repor} className="w-full">Repor os meus valores</BotaoSecundario>}
      </div>
    </Cartao>
  );
}

/* ─── Formulários ─── */
function FormCredito({ inicial, euribor, onGuardar, onRemover }) {
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
      {(() => {
        const e = euribor?.[f.indexante]?.valor;
        const cap = numero(f.capital), sp = numero(f.spread), pz = numero(f.prazo);
        if (e == null || !(cap > 0) || !(pz > 0) || f.spread === "" || !(sp >= 0)) return null;
        return (
          <p style={{ fontSize: 15, color: "var(--pj-text)" }} aria-live="polite">
            Prestação estimada: <strong style={{ color: "var(--pj-brand-ink)" }}>{euros(calcPMT(cap, sp, e, pz))}/mês</strong>
          </p>
        );
      })()}
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
  const [avisoDesfazer, oferecerDesfazer] = useDesfazer();

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
    const antes = dados[chave];
    salvar({ [chave]: null });
    oferecerDesfazer(chave === "credito" ? "Crédito removido" : "Renda removida", () => setDados(d => { const n = { ...d, [chave]: antes }; guardarLocal(n); return n; }));
  }

  const c = dados.credito;
  const prestacaoAtual = c && euribor?.[c.indexante || "6M"]
    ? calcPMT(c.capital, c.spread, euribor[c.indexante || "6M"].valor, c.prazo)
    : null;
  const totalCasa = (prestacaoAtual || 0) + (dados.renda?.valor || 0);
  const ambos = prestacaoAtual != null && dados.renda?.valor > 0;

  return (
    <div className="pb-28 pt-3 px-4">
      {avisoDesfazer}
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
        <Simulador key={c ? `${c.capital}-${c.spread}-${c.prazo}-${c.indexante}` : "novo"} credito={c} euribor={euribor} />
        <BlocoRenda renda={dados.renda} onEditar={() => setFolha("renda")} />
        <BlocoEuribor euribor={euribor} carregando={loadEuribor} />
      </div>

      <Nota className="mt-6 text-center">
        Valores estimados a partir do que indicas. Confirma sempre com o teu banco ou senhorio.
      </Nota>

      {folha === "credito" && (
        <Folha titulo={c ? "Editar crédito" : "Crédito habitação"} onFechar={() => setFolha(null)}>
          <FormCredito inicial={c} euribor={euribor} onGuardar={v => salvar({ credito: v })} onRemover={c ? () => remover("credito") : null} />
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
