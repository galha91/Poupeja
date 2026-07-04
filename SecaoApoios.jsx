import { useState, useMemo } from "react";
import {
  Landmark, ExternalLink, ChevronDown, ChevronUp,
  Zap, Bus, Home, Users, GraduationCap, Heart, Briefcase, Search,
} from "lucide-react";
import dadosRaw from "./public/apoios.json";

const ICONES_CAT = {
  energia:     Zap,
  transportes: Bus,
  habitacao:   Home,
  familia:     Users,
  jovens:      GraduationCap,
  saude:       Heart,
  emprego:     Briefcase,
};

// --- Editorial flat design tokens (matches app-wide rebrand) ---
const C = {
  text:   "#14231c",
  muted:  "#5c6b62",
  faint:  "#8a978e",
  green:  "#0b6b4f",
  chip:   "#eeece4",
  border: "#e4e2d8",
  card:   "#fbfaf6",
  divRow: "#eeece4",
};
const LBL = { fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", color: C.faint, textTransform: "uppercase" };
const LBL_SM = { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: C.faint, textTransform: "uppercase" };

export default function SecaoApoios() {
  const [catAtiva, setCatAtiva] = useState("todos");
  const [pesquisa, setPesquisa] = useState("");
  const [aberto, setAberto] = useState(null);

  const categorias = dadosRaw.categorias;
  const apoios     = dadosRaw.apoios;

  const filtrados = useMemo(() => {
    let lista = apoios;
    if (catAtiva !== "todos") lista = lista.filter(a => a.categoria === catAtiva);
    if (pesquisa.trim()) {
      const q = pesquisa.toLowerCase();
      lista = lista.filter(a =>
        a.titulo.toLowerCase().includes(q) ||
        a.descricao.toLowerCase().includes(q) ||
        a.quemPode.some(t => t.toLowerCase().includes(q))
      );
    }
    return lista;
  }, [catAtiva, pesquisa, apoios]);

  function getCat(id) { return categorias.find(c => c.id === id); }

  return (
    <div className="pb-28">

      {/* Cabeçalho */}
      <div className="px-4 pt-4 pb-2 anim-up">
        <div className="flex items-center gap-2 flex-wrap">
          <span style={LBL}>Estado Português</span>
          {dadosRaw.apoios.some(a => a.novo) && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: C.chip, color: C.green }}>
              Novidades
            </span>
          )}
        </div>
        <h1 className="font-display mt-1" style={{ fontSize: 24, fontWeight: 600, color: C.text, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
          Apoios a que tens direito
        </h1>
        <p className="text-[12px] mt-2 leading-relaxed" style={{ color: C.muted }}>
          {apoios.length} apoios e benefícios oficiais, todos com link direto para o Estado.
        </p>
        <p className="text-[10px] mt-1" style={{ color: C.faint }}>Atualizado em {dadosRaw.atualizado}</p>
      </div>

      {/* Pesquisa */}
      <div className="px-4 mt-3 anim-up anim-up-1">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.faint }} />
          <input
            type="text"
            placeholder="Pesquisar apoio…"
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
          />
        </div>
      </div>

      {/* Filtros por categoria */}
      <div className="mt-3 anim-up anim-up-2">
        <div className="flex gap-2 px-4 overflow-x-auto pb-1 scrollbar-none">
          {categorias.map(cat => {
            const ativa = catAtiva === cat.id;
            const Ico = ICONES_CAT[cat.id];
            return (
              <button
                key={cat.id}
                onClick={() => { setCatAtiva(cat.id); setAberto(null); }}
                className="pj-tap press flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold transition-all duration-150"
                style={ativa
                  ? { background: C.green, color: "#fff" }
                  : { background: C.chip, color: C.muted }
                }
              >
                {Ico && <Ico size={11} />}
                {cat.nome}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de apoios */}
      <div className="px-4 mt-4 flex flex-col gap-3 anim-up anim-up-3">
        {filtrados.length === 0 ? (
          <div className="card p-8 flex flex-col items-center text-center mt-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: C.chip }}>
              <Landmark size={26} style={{ color: C.faint }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: C.muted }}>Nenhum apoio encontrado</p>
            <p className="text-[12px] mt-1" style={{ color: C.faint }}>Tenta outra pesquisa ou categoria.</p>
          </div>
        ) : (
          filtrados.map(apoio => {
            const cat = getCat(apoio.categoria);
            const expandido = aberto === apoio.id;
            const Ico = ICONES_CAT[apoio.categoria] || Landmark;
            return (
              <div
                key={apoio.id}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                {/* Cabeçalho do card */}
                <button
                  className="pj-tap press w-full text-left px-4 py-4 flex items-start gap-3"
                  onClick={() => setAberto(expandido ? null : apoio.id)}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: C.chip }}
                    aria-label={cat?.nome}
                  >
                    <Ico size={17} style={{ color: C.green }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold leading-snug" style={{ color: C.text }}>{apoio.titulo}</p>
                      {apoio.novo && (
                        <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: C.chip, color: C.green }}>NOVO</span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold mt-0.5" style={{ color: C.green }}>{apoio.valor}</p>
                    <p className="text-[11px] mt-1 leading-relaxed line-clamp-2" style={{ color: C.muted }}>{apoio.descricao}</p>
                  </div>
                  <div className="flex-shrink-0 mt-1 ml-1">
                    {expandido
                      ? <ChevronUp size={16} style={{ color: C.faint }} />
                      : <ChevronDown size={16} style={{ color: C.faint }} />
                    }
                  </div>
                </button>

                {/* Detalhe expandido */}
                {expandido && (
                  <div className="px-4 pb-4 pt-0" style={{ borderTop: `1px solid ${C.divRow}` }}>
                    <div className="mt-3">
                      <p className="mb-2" style={LBL_SM}>Quem pode requerer</p>
                      <ul className="flex flex-col gap-1.5">
                        {apoio.quemPode.map((req, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span
                              className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                              style={{ background: C.green }}
                            />
                            <span className="text-[12px] leading-relaxed" style={{ color: C.muted }}>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3">
                      <p className="mb-1.5" style={LBL_SM}>Como requerer</p>
                      <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>{apoio.comoRequerer}</p>
                    </div>

                    <a
                      href={apoio.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pj-tap press mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold"
                      style={{ background: C.green, color: "#fff" }}
                      onClick={e => e.stopPropagation()}
                    >
                      Ver no site oficial <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Rodapé */}
      <div className="px-4 mt-6 mb-4">
        <p className="text-center text-[10px] leading-relaxed" style={{ color: C.faint }}>
          Informação baseada em fontes oficiais (ePortugal.gov.pt, Segurança Social, ERSE).<br />
          Para detalhes e valores atualizados, consulta sempre o site oficial.
        </p>
      </div>
    </div>
  );
}
