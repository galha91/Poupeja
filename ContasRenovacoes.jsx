import { useState, useEffect, useMemo } from "react";
import { Zap, Flame, Wifi, ShieldCheck, Plus, CalendarPlus, ExternalLink, Bell, BellOff, Trash2, Pencil, RefreshCw } from "lucide-react";
import {
  TIPOS, PERIODICIDADES, POTENCIAS_KVA, OPCOES_HORARIAS, FONTE_ERSE,
  anualizar, proximoMarco, poupancaPossivel, normalizarConta,
} from "./lib/renovacoes";
import { ANTECEDENCIA_CONTAS } from "./lib/lembretes";
import { lerRenovacoes, guardarRenovacoes, novoId, exportarIcs } from "./lib/dadosLocais";
import { hojeIso, diasEntre, dataExtenso, falta } from "./lib/datas";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { Campo, BotaoPrincipal, BotaoSecundario, Chip, Nota, Erro, Folha, EstadoVazio, Cartao, LinkExterno, ROTULO } from "./UiSimples";

/*
 * Contas que renovam (eletricidade, gás, telecomunicações, seguros).
 * Fluxo curto: tipo → quanto pagas e quando renova → "pagas X €/ano" e
 * lembrete 60 e 30 dias antes. Na energia, a comparação é feita no
 * simulador oficial da ERSE (ver lib/renovacoes) e a app guarda o resultado.
 * Sem NIF, moradas, CPE ou números de contrato. Só neste dispositivo.
 */

const ICONES = { eletricidade: Zap, gas: Flame, telecom: Wifi, seguro: ShieldCheck };
const ENERGIA = new Set(["eletricidade", "gas"]);

const euros = v => `${eur(v, 2)} €`;

/* Contas fixas (separador ao lado) que já dizem o tipo: sugestão no estado vazio. */
function sugestoesDasContasFixas() {
  try {
    const contas = JSON.parse(localStorage.getItem("poupeja_contas") || "[]");
    const tipoDe = c => {
      const n = (c.nome || "").toLowerCase();
      if (c.categoria === "seguro") return "seguro";
      if (c.categoria === "internet") return "telecom";
      if (c.categoria === "energia" && /g[aá]s/.test(n)) return "gas";
      if (c.categoria === "energia" && /(luz|eletric|electric|energia)/.test(n)) return "eletricidade";
      return null;
    };
    return contas
      .map(c => ({ tipo: tipoDe(c), nome: c.nome, valor: c.valor }))
      .filter(c => c.tipo && c.valor > 0)
      .slice(0, 4);
  } catch { return []; }
}

/* ─── Formulário ─── */
function FormConta({ inicial, onGuardar }) {
  const [tipo, setTipo] = useState(inicial?.tipo || "");
  const [nome, setNome] = useState(inicial?.nome || "");
  const [valor, setValor] = useState(inicial?.valor != null ? String(inicial.valor).replace(".", ",") : "");
  const [periodicidade, setPeriodicidade] = useState(inicial?.periodicidade || "mensal");
  const [dataRenovacao, setDataRenovacao] = useState(inicial?.dataRenovacao || "");
  const [fimFidelizacao, setFimFidelizacao] = useState(inicial?.fimFidelizacao || "");
  const [potencia, setPotencia] = useState(inicial?.potencia || "");
  const [opcaoHoraria, setOpcaoHoraria] = useState(inicial?.opcaoHoraria || "");
  const [lembrete, setLembrete] = useState(inicial ? inicial.lembrete !== false : true);
  const [erro, setErro] = useState("");
  const edicao = !!inicial && !inicial._novo;

  const anual = anualizar(String(valor).replace(",", "."), periodicidade);

  function submeter(e) {
    e.preventDefault();
    const r = normalizarConta({ tipo, nome, valor, periodicidade, dataRenovacao, fimFidelizacao, potencia, opcaoHoraria });
    if (!r.ok) { setErro(r.erro); return; }
    setErro("");
    onGuardar({ ...r.conta, lembrete });
  }

  if (!tipo) {
    return (
      <div className="flex flex-col gap-2 pb-2">
        <p style={{ fontSize: 14, color: "var(--pj-text-muted)", marginBottom: 6 }}>Que conta queres acompanhar?</p>
        {Object.entries(TIPOS).map(([id, t]) => {
          const Ico = ICONES[id];
          return (
            <button key={id} type="button" onClick={() => setTipo(id)} className="press pj-tap flex items-center gap-3 text-left"
              style={{ minHeight: 56, padding: "0 16px", borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)", fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>
              <Ico size={20} style={{ color: "var(--pj-brand-ink)" }} aria-hidden="true" /> {t.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <form onSubmit={submeter} className="flex flex-col gap-4 pb-2" noValidate>
      {!edicao && (
        <button type="button" onClick={() => setTipo("")} className="self-start" style={{ fontSize: 13, fontWeight: 600, color: "var(--pj-brand-ink)", minHeight: 32, background: "none", border: 0, padding: 0 }}>
          {TIPOS[tipo].label} · mudar
        </button>
      )}

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr auto" }}>
        <Campo label="Quanto pagas" type="text" inputMode="decimal" placeholder="0,00" value={valor}
          onChange={e => setValor(e.target.value)} autoFocus={!edicao} />
        <div>
          <label style={ROTULO} htmlFor="pj-period">A cada</label>
          <select id="pj-period" value={periodicidade} onChange={e => setPeriodicidade(e.target.value)}
            style={{ marginTop: 6, minHeight: 48, borderRadius: 14, padding: "0 10px", fontSize: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }}>
            {Object.entries(PERIODICIDADES).map(([id, p]) => <option key={id} value={id}>{p.label.replace("por ", "")}</option>)}
          </select>
        </div>
      </div>

      {anual > 0 && (
        <p style={{ fontSize: 15, color: "var(--pj-text)" }}>
          Pagas <strong style={{ color: "var(--pj-brand-ink)" }}>{euros(anual)}</strong> por ano
        </p>
      )}

      <Campo label="Data de renovação" type="date" value={dataRenovacao} onChange={e => setDataRenovacao(e.target.value)}
        ajuda="Está no contrato ou na apólice. Se já passou, contamos a do próximo ano." />
      <Campo label="Fim da fidelização" opcional type="date" value={fimFidelizacao} onChange={e => setFimFidelizacao(e.target.value)} />
      <Campo label="Nome para te lembrares" opcional type="text" maxLength={40} placeholder={TIPOS[tipo].label}
        value={nome} onChange={e => setNome(e.target.value)} />

      {tipo === "eletricidade" && (
        <details>
          <summary style={{ ...ROTULO, cursor: "pointer", minHeight: 32 }}>Dados para comparar na ERSE (opcional)</summary>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label style={ROTULO} htmlFor="pj-kva">Potência (kVA)</label>
              <select id="pj-kva" value={potencia} onChange={e => setPotencia(e.target.value)}
                style={{ marginTop: 6, width: "100%", minHeight: 48, borderRadius: 14, padding: "0 10px", fontSize: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }}>
                <option value="">—</option>
                {POTENCIAS_KVA.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={ROTULO} htmlFor="pj-horaria">Opção horária</label>
              <select id="pj-horaria" value={opcaoHoraria} onChange={e => setOpcaoHoraria(e.target.value)}
                style={{ marginTop: 6, width: "100%", minHeight: 48, borderRadius: 14, padding: "0 10px", fontSize: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)", color: "var(--pj-text)" }}>
                <option value="">—</option>
                {Object.entries(OPCOES_HORARIAS).map(([id, l]) => <option key={id} value={id}>{l}</option>)}
              </select>
            </div>
          </div>
        </details>
      )}

      <label className="flex items-center gap-3" style={{ minHeight: 44, fontSize: 14, color: "var(--pj-text)" }}>
        <input type="checkbox" checked={lembrete} onChange={e => setLembrete(e.target.checked)} style={{ width: 22, height: 22, accentColor: "var(--pj-brand)" }} />
        Lembrar-me 60 e 30 dias antes
      </label>

      <Erro>{erro}</Erro>
      <BotaoPrincipal type="submit">{edicao ? "Guardar alterações" : "Guardar"}</BotaoPrincipal>
    </form>
  );
}

/* ─── Detalhe ─── */
function Detalhe({ conta, onAtualizar, onApagar, onEditar }) {
  const [resultado, setResultado] = useState(conta.resultadoErse?.valorAnual ? String(conta.resultadoErse.valorAnual).replace(".", ",") : "");
  const [erro, setErro] = useState("");
  const anual = anualizar(conta.valor, conta.periodicidade);
  const marco = proximoMarco(conta);
  const poupanca = poupancaPossivel(conta);
  const t = TIPOS[conta.tipo];
  const titulo = conta.nome || t.label;

  function guardarResultado() {
    const v = Number(resultado.replace(",", "."));
    if (!Number.isFinite(v) || v <= 0) { setErro("Indica o valor anual que o simulador mostrou."); return; }
    setErro("");
    onAtualizar({ ...conta, resultadoErse: { valorAnual: Math.round(v * 100) / 100, data: hojeIso() } });
    evento("erse_resultado_guardado", { tipo: conta.tipo });
  }

  function calendario() {
    if (!marco) return;
    const motivo = marco.motivo === "fidelizacao" ? "Fim da fidelização" : "Renovação";
    exportarIcs(`poupeja-${conta.tipo}.ics`, [{
      uid: `conta-${conta.id}-${marco.data}`,
      titulo: `${motivo}: ${titulo}`,
      descricao: `Pagas ${euros(anual)}/ano. Boa altura para comparar ou renegociar. (Lembrete do PoupeJá)`,
      data: marco.data,
      alarmes: ANTECEDENCIA_CONTAS,
      url: ENERGIA.has(conta.tipo) ? t.erse : undefined,
    }]);
    evento("calendario_exportado", { tipo: "conta" });
  }

  function alternarLembrete() {
    onAtualizar({ ...conta, lembrete: !conta.lembrete });
    if (!conta.lembrete) evento("lembrete_ativado", { tipo: "conta", conta: conta.tipo });
  }

  return (
    <div className="flex flex-col gap-5 pb-2">
      <div>
        <p className="font-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.1 }}>
          {euros(anual)}<span style={{ fontSize: 15, color: "var(--pj-text-muted)", fontWeight: 500 }}> /ano</span>
        </p>
        <p style={{ fontSize: 13, color: "var(--pj-text-muted)", marginTop: 4 }}>
          {euros(conta.valor)} {PERIODICIDADES[conta.periodicidade].label}
        </p>
        {marco && (
          <p style={{ fontSize: 14, color: "var(--pj-text)", marginTop: 10 }}>
            {marco.motivo === "fidelizacao" ? "Fidelização acaba" : "Renova"} a {dataExtenso(marco.data)}{" "}
            <span style={{ color: "var(--pj-text-muted)" }}>({falta(diasEntre(hojeIso(), marco.data))})</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <BotaoSecundario onClick={alternarLembrete} aria-pressed={!!conta.lembrete}>
          {conta.lembrete ? <Bell size={15} /> : <BellOff size={15} />} {conta.lembrete ? "Lembrete ativo" : "Ativar lembrete"}
        </BotaoSecundario>
        {marco && (
          <BotaoSecundario onClick={calendario}><CalendarPlus size={15} /> Adicionar ao calendário</BotaoSecundario>
        )}
      </div>

      {ENERGIA.has(conta.tipo) ? (
        <Cartao className="p-4 flex flex-col gap-3">
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>Comparar no simulador oficial</p>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--pj-text-muted)" }}>
            O simulador da ERSE compara todas as ofertas do mercado. Tem à mão a última fatura:
          </p>
          <ul style={{ fontSize: 13, lineHeight: 1.7, color: "var(--pj-text-muted)", paddingLeft: 18, listStyle: "disc" }}>
            {conta.tipo === "eletricidade" ? (
              <>
                <li>Potência contratada: <strong style={{ color: "var(--pj-text)" }}>{conta.potencia ? `${conta.potencia} kVA` : "vem na fatura"}</strong></li>
                <li>Opção horária: <strong style={{ color: "var(--pj-text)" }}>{conta.opcaoHoraria ? OPCOES_HORARIAS[conta.opcaoHoraria] : "vem na fatura"}</strong></li>
                <li>Consumo em kWh e número de dias da fatura</li>
              </>
            ) : (
              <li>Consumo em kWh (ou m³) e número de dias da fatura</li>
            )}
            <li>Ou só o valor da fatura: {euros(conta.valor)} {PERIODICIDADES[conta.periodicidade].label}</li>
          </ul>
          <a href={t.erse} target="_blank" rel="noopener noreferrer" onClick={() => evento("erse_aberto", { tipo: conta.tipo })}
            className="press pj-tap flex items-center justify-center gap-2"
            style={{ minHeight: 48, borderRadius: 14, background: "var(--pj-brand)", color: "#fff", fontSize: 14, fontWeight: 600 }}>
            Abrir simulador da ERSE <ExternalLink size={14} aria-hidden="true" />
          </a>
          <Campo label="Melhor valor anual que encontraste" opcional type="text" inputMode="decimal" placeholder="0,00 €"
            value={resultado} onChange={e => setResultado(e.target.value)} erro={erro} />
          <Erro>{erro}</Erro>
          <BotaoSecundario onClick={guardarResultado}>Guardar resultado</BotaoSecundario>
          {poupanca != null && (
            <p style={{ fontSize: 14, color: "var(--pj-text)" }}>
              {poupanca > 0
                ? <>Podes poupar cerca de <strong style={{ color: "var(--pj-brand-ink)" }}>{euros(poupanca)}/ano</strong> (segundo o simulador, a {dataExtenso(conta.resultadoErse.data)}).</>
                : <>O teu contrato já está entre os mais baratos que encontraste.</>}
            </p>
          )}
        </Cartao>
      ) : (
        <Cartao className="p-4">
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--pj-text-muted)" }}>
            Antes de {marco?.motivo === "fidelizacao" ? "a fidelização acabar" : "renovar"}, pede propostas a outros
            {conta.tipo === "seguro" ? " seguradores" : " operadores"} e mostra-as ao atual — muitas vezes baixa o preço para não te perder.
            {conta.tipo === "seguro" && " Compara sempre as mesmas coberturas e franquias."}
          </p>
        </Cartao>
      )}

      <div className="flex gap-2">
        <BotaoSecundario onClick={onEditar} className="flex-1"><Pencil size={14} /> Editar</BotaoSecundario>
        <BotaoSecundario onClick={onApagar} aria-label="Apagar" style={{ color: "var(--pj-danger)", background: "var(--pj-danger-wash)" }}><Trash2 size={15} /></BotaoSecundario>
      </div>
    </div>
  );
}

/* ─── Ecrã ─── */
export default function ContasRenovacoes() {
  const [contas, setContas] = useState([]);
  const [folha, setFolha] = useState(null); // { modo: "nova" | "ver" | "editar", id?, pre? }

  useEffect(() => { setContas(lerRenovacoes()); }, []);

  function gravar(lista) {
    setContas(lista);
    guardarRenovacoes(lista);
    window.dispatchEvent(new CustomEvent("poupeja:avisos"));
  }

  const hoje = hojeIso();
  const ordenadas = useMemo(() => contas
    .map(c => ({ c, m: proximoMarco(c, hoje) }))
    .sort((a, b) => (a.m ? diasEntre(hoje, a.m.data) : 1e9) - (b.m ? diasEntre(hoje, b.m.data) : 1e9)), [contas, hoje]);
  const totalAnual = contas.reduce((s, c) => s + (anualizar(c.valor, c.periodicidade) || 0), 0);
  const sugestoes = useMemo(() => (contas.length ? [] : sugestoesDasContasFixas()), [contas.length]);
  const atual = folha?.id ? contas.find(c => c.id === folha.id) : null;

  function adicionar(dados) {
    const nova = { id: novoId("r"), ...dados, criadoEm: new Date().toISOString() };
    gravar([...contas, nova]);
    evento("conta_renovacao_registada", { tipo: dados.tipo });
    if (dados.lembrete) evento("lembrete_ativado", { tipo: "conta", conta: dados.tipo });
    setFolha({ modo: "ver", id: nova.id });
  }

  return (
    <div className="pb-28 pt-3 px-4">
      {contas.length > 0 && (
        <div className="mb-5 anim-up">
          <p style={{ fontSize: 13, color: "var(--pj-text-muted)" }}>Nestas contas pagas</p>
          <p className="font-display" style={{ fontSize: 34, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.1 }}>
            {euros(totalAnual)}<span style={{ fontSize: 15, color: "var(--pj-text-muted)", fontWeight: 500 }}> /ano</span>
          </p>
        </div>
      )}

      {contas.length === 0 ? (
        <Cartao className="anim-up">
          <EstadoVazio Icone={RefreshCw} titulo="Paga menos na renovação"
            texto="Regista a luz, o gás, a internet ou um seguro. Vês quanto pagas por ano e lembramos-te 60 e 30 dias antes de renovar — a altura certa para comparar ou renegociar.">
            {sugestoes.length > 0 && (
              <div className="mt-5 w-full">
                <p style={{ ...ROTULO, marginBottom: 8 }}>Das tuas contas fixas</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {sugestoes.map((s, i) => (
                    <Chip key={i} onClick={() => setFolha({ modo: "nova", pre: { tipo: s.tipo, nome: s.nome, valor: s.valor, periodicidade: "mensal" } })}>
                      {s.nome}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </EstadoVazio>
        </Cartao>
      ) : (
        <div className="flex flex-col gap-2 anim-up anim-up-1">
          {ordenadas.map(({ c, m }) => {
            const Ico = ICONES[c.tipo];
            const dias = m ? diasEntre(hoje, m.data) : null;
            const perto = dias != null && dias <= 60;
            return (
              <button key={c.id} onClick={() => setFolha({ modo: "ver", id: c.id })} className="press pj-tap w-full text-left flex items-center gap-3"
                style={{ minHeight: 64, padding: "12px 14px", borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
                <Ico size={20} style={{ color: "var(--pj-brand-ink)", flexShrink: 0 }} aria-hidden="true" />
                <span className="flex-1 min-w-0">
                  <span className="block truncate" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{c.nome || TIPOS[c.tipo].label}</span>
                  <span className="block" style={{ fontSize: 12, color: perto ? "var(--pj-warn)" : "var(--pj-text-muted)", fontWeight: perto ? 600 : 400 }}>
                    {m ? `${m.motivo === "fidelizacao" ? "Fidelização acaba" : "Renova"} ${falta(dias)}` : "Sem data"}
                    {!c.lembrete && " · sem lembrete"}
                  </span>
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--pj-text)", whiteSpace: "nowrap" }}>
                  {euros(anualizar(c.valor, c.periodicidade))}<span style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 400 }}>/ano</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <BotaoPrincipal className="mt-5" onClick={() => setFolha({ modo: "nova" })}>
        <Plus size={18} /> Adicionar conta
      </BotaoPrincipal>

      <Nota className="mt-6 text-center">
        Valores estimados a partir do que indicas — confirma sempre no{" "}
        <LinkExterno href={FONTE_ERSE.pagina}>site da ERSE</LinkExterno> ou do teu operador.
        Fica guardado só neste dispositivo e não pedimos NIF, morada nem número de contrato.
      </Nota>

      {folha?.modo === "nova" && (
        <Folha titulo="Nova conta" onFechar={() => setFolha(null)}>
          <FormConta inicial={folha.pre ? { ...folha.pre, lembrete: true, _novo: true } : null} onGuardar={adicionar} />
        </Folha>
      )}
      {folha?.modo === "ver" && atual && (
        <Folha titulo={atual.nome || TIPOS[atual.tipo].label} onFechar={() => setFolha(null)}>
          <Detalhe
            conta={atual}
            onAtualizar={c => gravar(contas.map(x => x.id === c.id ? c : x))}
            onEditar={() => setFolha({ modo: "editar", id: atual.id })}
            onApagar={() => {
              if (!window.confirm("Apagar esta conta?")) return;
              gravar(contas.filter(x => x.id !== atual.id));
              setFolha(null);
            }}
          />
        </Folha>
      )}
      {folha?.modo === "editar" && atual && (
        <Folha titulo="Editar conta" onFechar={() => setFolha({ modo: "ver", id: atual.id })}>
          <FormConta inicial={atual} onGuardar={d => { gravar(contas.map(x => x.id === atual.id ? { ...x, ...d } : x)); setFolha({ modo: "ver", id: atual.id }); }} />
        </Folha>
      )}
    </div>
  );
}
