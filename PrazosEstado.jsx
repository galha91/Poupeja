import { useState, useEffect, useMemo } from "react";
import { Bell, BellRing, CalendarPlus, ChevronDown, ChevronUp, ExternalLink, CalendarClock } from "lucide-react";
import { PERFIS, filtrarPorPerfil, ordenarPrazos } from "./lib/prazosEstado";
import { ANTECEDENCIA_PRAZOS } from "./lib/lembretes";
import {
  prazosDoFicheiro, prazosAtualizado, lerPerfilPrazos, guardarPerfilPrazos,
  lerLembretesPrazos, guardarLembretesPrazos, exportarIcs,
} from "./lib/dadosLocais";
import { hojeIso, diasEntre, dataExtenso, dataCurta, falta } from "./lib/datas";
import { evento } from "./lib/analytics";
import { Chip, Nota, Cartao, BotaoPrincipal, EstadoVazio } from "./UiSimples";

/*
 * Calendário de prazos do Estado. Os dados vêm de data/prazos-estado.json
 * (editável sem mexer no código). O perfil e os lembretes ficam só no
 * dispositivo. Nada aqui é aconselhamento fiscal ou jurídico.
 */

function quando(p, hoje) {
  if (!p.proximo) return { texto: "Sem prazo", cor: "var(--pj-text-muted)" };
  const { inicio, fim, aberto } = p.proximo;
  const dias = diasEntre(hoje, fim);
  const cor = dias <= 30 ? "var(--pj-warn)" : "var(--pj-brand-ink)";
  if (!inicio) return { texto: `Até ${dataExtenso(fim, { ano: false })} · ${falta(dias)}`, cor, dias };
  if (aberto) return { texto: `A decorrer · acaba ${falta(dias)}`, cor, dias };
  return { texto: `Abre a ${dataExtenso(inicio, { ano: false })} · ${falta(diasEntre(hoje, inicio))}`, cor: "var(--pj-text-muted)", dias };
}

export default function PrazosEstado() {
  const [perfis, setPerfis] = useState([]);
  const [lembretes, setLembretes] = useState([]);
  const [aberto, setAberto] = useState(null);

  useEffect(() => {
    setPerfis(lerPerfilPrazos());
    setLembretes(lerLembretesPrazos());
  }, []);

  const hoje = hojeIso();
  const lista = useMemo(() => ordenarPrazos(filtrarPorPerfil(prazosDoFicheiro(), perfis), hoje), [perfis, hoje]);

  function alternarPerfil(id) {
    const novo = perfis.includes(id) ? perfis.filter(x => x !== id) : [...perfis, id];
    setPerfis(novo);
    guardarPerfilPrazos(novo);
    evento("prazos_filtro", { perfis: novo.length });
  }

  function alternarLembrete(id) {
    const ativo = lembretes.includes(id);
    const novo = ativo ? lembretes.filter(x => x !== id) : [...lembretes, id];
    setLembretes(novo);
    guardarLembretesPrazos(novo);
    window.dispatchEvent(new CustomEvent("poupeja:avisos"));
    if (!ativo) evento("lembrete_ativado", { tipo: "prazo", prazo: id });
  }

  // Calendário: os prazos com lembrete; sem nenhum escolhido, os que estão à vista.
  const comData = lista.filter(p => p.proximo);
  const paraCalendario = comData.some(p => lembretes.includes(p.id)) ? comData.filter(p => lembretes.includes(p.id)) : comData;

  function calendario() {
    exportarIcs("poupeja-prazos.ics", paraCalendario.map(p => ({
      uid: `prazo-${p.id}-${p.proximo.fim}`,
      titulo: p.titulo,
      descricao: `${p.prazoTexto}. ${p.descricao} Confirma em: ${p.link}`,
      data: p.proximo.fim,
      alarmes: ANTECEDENCIA_PRAZOS,
      url: p.link,
    })));
    evento("calendario_exportado", { tipo: "prazo", n: paraCalendario.length });
  }

  return (
    <div className="pb-28 pt-3">
      <div className="anim-up">
        <p className="px-4" style={{ fontSize: 14, lineHeight: 1.6, color: "var(--pj-text-muted)" }}>
          Prazos do IRS, impostos e apoios. Mostra só o que se aplica a ti:
        </p>
        <div className="flex gap-2 mt-3 px-4 overflow-x-auto no-scrollbar" role="group" aria-label="O meu perfil">
          {PERFIS.map(p => (
            <span key={p.id} className="flex-shrink-0" style={{ whiteSpace: "nowrap" }}>
              <Chip ativo={perfis.includes(p.id)} onClick={() => alternarPerfil(p.id)}>{p.label}</Chip>
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 mt-5 flex flex-col gap-2 anim-up anim-up-1">
        {lista.length === 0 && (
          <Cartao><EstadoVazio Icone={CalendarClock} titulo="Nada para mostrar" texto="Tira um dos filtros para ver mais prazos." /></Cartao>
        )}
        {lista.map(p => {
          const q = quando(p, hoje);
          const exp = aberto === p.id;
          const comLembrete = lembretes.includes(p.id);
          return (
            <Cartao key={p.id} className="overflow-hidden">
              <div className="flex items-start">
                <button onClick={() => setAberto(exp ? null : p.id)} aria-expanded={exp}
                  className="pj-tap flex-1 min-w-0 text-left flex items-start gap-2" style={{ padding: "14px 4px 12px 16px", minHeight: 64, background: "none", border: 0 }}>
                  <span className="flex-1 min-w-0">
                    <span className="block" style={{ fontSize: 15, fontWeight: 600, color: "var(--pj-text)", lineHeight: 1.35 }}>{p.titulo}</span>
                    <span className="block mt-1" style={{ fontSize: 12, fontWeight: 600, color: q.cor }}>{q.texto}</span>
                    <span className="block mt-0.5" style={{ fontSize: 12, color: "var(--pj-text-muted)" }}>{p.prazoTexto}</span>
                  </span>
                  {exp ? <ChevronUp size={16} style={{ color: "var(--pj-text-faint)", marginTop: 3 }} aria-hidden="true" />
                       : <ChevronDown size={16} style={{ color: "var(--pj-text-faint)", marginTop: 3 }} aria-hidden="true" />}
                </button>
                {p.proximo && (
                  <button onClick={() => alternarLembrete(p.id)} aria-pressed={comLembrete}
                    aria-label={comLembrete ? `Tirar lembrete: ${p.titulo}` : `Lembrar-me: ${p.titulo}`}
                    className="pj-tap flex items-center justify-center flex-shrink-0"
                    style={{ width: 48, height: 48, margin: "8px 8px 0 0", borderRadius: 14, border: 0, background: comLembrete ? "var(--pj-brand-wash)" : "transparent" }}>
                    {comLembrete ? <BellRing size={18} style={{ color: "var(--pj-brand-ink)" }} /> : <Bell size={18} style={{ color: "var(--pj-text-faint)" }} />}
                  </button>
                )}
              </div>
              {exp && (
                <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--pj-subtle)" }}>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--pj-text)", marginTop: 12 }}>{p.descricao}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--pj-text-muted)", marginTop: 12 }}>Quem pode ter direito</p>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--pj-text-muted)", marginTop: 2 }}>{p.quemPode}</p>
                  {comLembrete && p.proximo && (
                    <p style={{ fontSize: 12, color: "var(--pj-brand-ink)", marginTop: 10 }}>
                      Avisamos {ANTECEDENCIA_PRAZOS[0]} e {ANTECEDENCIA_PRAZOS[1]} dias antes de {dataExtenso(p.proximo.fim)}.
                    </p>
                  )}
                </div>
              )}
              <p className="px-4 pb-3" style={{ fontSize: 11, color: "var(--pj-text-faint)" }}>
                <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pj-brand-ink)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
                  {p.fonte || "Fonte oficial"}<ExternalLink size={10} style={{ display: "inline", marginLeft: 3 }} aria-hidden="true" />
                </a>
                {" "}· verificado a {dataCurta(p.verificado)}
              </p>
            </Cartao>
          );
        })}
      </div>

      {paraCalendario.length > 0 && (
        <div className="px-4 mt-5">
          <BotaoPrincipal onClick={calendario}>
            <CalendarPlus size={18} /> Pôr {paraCalendario.length === 1 ? "este prazo" : `${paraCalendario.length} prazos`} no calendário
          </BotaoPrincipal>
        </div>
      )}

      <Nota className="px-4 mt-6 text-center">
        Informação indicativa, verificada a {dataCurta(prazosAtualizado)}. Os prazos podem mudar —
        confirma sempre na fonte oficial. Não é aconselhamento fiscal nem jurídico.
        O teu perfil e os lembretes ficam só neste dispositivo.
      </Nota>
    </div>
  );
}
