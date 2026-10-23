import { useState, useEffect } from "react";
import { Check, ChevronRight } from "lucide-react";
import { eur } from "./lib/formato";
import { evento } from "./lib/analytics";
import { MESES, mesChave, quandoVence, resumoMes, lerContas, lerPagamentos, marcarPagamento } from "./lib/contasMes";
import { useDesfazer } from "./UiSimples";

/*
 * "Próxima conta" no Início: a conta fixa mais urgente do mês (Contas →
 * Mensais), com o círculo para a marcar como paga ali mesmo, e quanto
 * falta pagar. Sem contas registadas não aparece.
 */

const euros = v => `${eur(v, 2)} €`;

export default function CartaoProximaConta({ onAbrir }) {
  const [estado, setEstado] = useState(null); // { contas, pagos, agora }
  const [avisoDesfazer, oferecerDesfazer] = useDesfazer();

  // Lê ao abrir e sempre que a app volta ao ecrã: aberta de um dia para o
  // outro (ou de um mês para o outro), o "hoje" e o mês têm de acompanhar.
  useEffect(() => {
    const ler = () => setEstado({ contas: lerContas(), pagos: lerPagamentos(), agora: new Date() });
    ler();
    const aoVoltar = () => { if (document.visibilityState === "visible") ler(); };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, []);

  const resumo = estado ? resumoMes(estado.contas, estado.pagos, estado.agora) : null;
  if (!resumo) return avisoDesfazer;

  const { agora } = estado;
  const mes = mesChave(agora);
  const mesNome = MESES[agora.getMonth()];

  // `noMes` fica preso ao mês em que se marcou: um "Desfazer" depois da
  // meia-noite do último dia ainda desfaz no mês certo.
  function gravarPago(noMes, id, pago) {
    const pagos = marcarPagamento(noMes, id, pago);
    setEstado(e => ({ ...e, pagos }));
  }

  function marcarPaga(conta) {
    gravarPago(mes, conta.id, true);
    evento("inicio_proxima_conta", { acao: "paga" });
    oferecerDesfazer(`${conta.nome} paga`, () => gravarPago(mes, conta.id, false));
  }

  function abrir() {
    evento("inicio_proxima_conta", { acao: "abrir" });
    onAbrir();
  }

  const { proxima, porPagar, falta } = resumo;
  const vence = proxima ? quandoVence(proxima, { pago: false, esMesAtual: true, hoje: agora.getDate(), data: agora }) : null;
  const corVence = vence?.tom === "danger" ? "var(--pj-danger)" : vence?.tom === "warn" ? "var(--pj-warn)" : "var(--pj-text-muted)";

  return (
    <div className="anim-up anim-up-1" style={{ marginTop: 18 }}>
      {avisoDesfazer}
      <div style={{ fontSize: 11, color: "var(--pj-text-faint)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>
        Contas de {mesNome}
      </div>

      {!proxima ? (
        <button onClick={abrir} className="pj-tap press w-full text-left flex items-center"
          style={{ gap: 12, marginTop: 10, minHeight: 56, padding: "0 14px", borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          <span className="flex items-center justify-center flex-shrink-0" style={{ width: 24, height: 24, borderRadius: 99, background: "var(--pj-brand)" }}>
            <Check size={14} strokeWidth={3} color="#fff" aria-hidden="true" />
          </span>
          <span className="flex-1" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>Tudo pago este mês</span>
          <ChevronRight size={16} aria-hidden="true" style={{ color: "var(--pj-text-faint)" }} />
        </button>
      ) : (
        <div style={{ marginTop: 10, borderRadius: 16, background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          <div className="flex items-center" style={{ minHeight: 64 }}>
            <button type="button" onClick={() => marcarPaga(proxima)} aria-label={`${proxima.nome}: marcar como paga`}
              className="pj-tap press flex items-center justify-center flex-shrink-0"
              style={{ width: 52, alignSelf: "stretch", background: "none", border: 0 }}>
              <span style={{ width: 24, height: 24, borderRadius: 99, border: "2px solid var(--pj-text-faint)" }} />
            </button>
            <button type="button" onClick={abrir} className="pj-tap press flex-1 min-w-0 flex items-center text-left"
              style={{ gap: 12, alignSelf: "stretch", padding: "10px 14px 10px 0", background: "none", border: 0 }}>
              <span className="flex-1 min-w-0">
                <span className="block truncate" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)" }}>{proxima.nome}</span>
                <span className="block truncate" style={{ fontSize: 12, fontWeight: vence.tom ? 600 : 400, color: corVence }}>{vence.texto}</span>
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)", whiteSpace: "nowrap" }}>{euros(proxima.valor)}</span>
            </button>
          </div>
          <button onClick={abrir} className="pj-tap w-full flex items-center justify-between text-left"
            style={{ gap: 8, minHeight: 40, padding: "0 14px", borderTop: "1px solid var(--pj-subtle)", background: "none", fontSize: 12, color: "var(--pj-text-muted)" }}>
            <span>
              Falta pagar <strong style={{ color: "var(--pj-text)" }}>{euros(falta)}</strong>
              {porPagar > 1 ? ` · ${porPagar} contas` : ""}
            </span>
            <span className="inline-flex items-center" style={{ gap: 2, fontWeight: 600, color: "var(--pj-brand-ink)" }}>
              Ver todas <ChevronRight size={14} aria-hidden="true" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
