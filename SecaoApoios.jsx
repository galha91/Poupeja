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

      {/* Intro banner */}
      <div className="px-4 pt-4 pb-2 anim-up">
        <div
          className="rounded-3xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 60%,#60a5fa 100%)", boxShadow: "0 8px 32px -8px rgba(29,78,216,0.30)" }}
        >
          <div className="px-6 pt-6 pb-5 relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Landmark size={15} className="text-white" />
              </div>
              <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">Estado Português</span>
              {dadosRaw.apoios.some(a => a.novo) && (
                <span className="text-[9px] font-black bg-blue-400 text-white px-2 py-0.5 rounded-full">NOVIDADE</span>
              )}
            </div>
            <p className="text-2xl font-black text-white leading-snug" style={{ fontFamily: "'Sora', system-ui" }}>
              Apoios a que<br />tens direito
            </p>
            <p className="text-[12px] text-white/70 mt-2 leading-relaxed">
              {apoios.length} apoios e benefícios oficiais, todos com link direto para o Estado.
            </p>
            <p className="text-[10px] text-white/40 mt-2">Atualizado em {dadosRaw.atualizado}</p>
          </div>
        </div>
      </div>

      {/* Pesquisa */}
      <div className="px-4 mt-3 anim-up anim-up-1">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar apoio…"
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white border border-slate-100 text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
            style={{ boxShadow: "0 1px 8px rgba(15,23,42,0.06)" }}
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
                className="press flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black transition-all duration-150 border"
                style={ativa && cat.cor
                  ? { background: cat.cor, color: "#fff", borderColor: cat.cor, boxShadow: `0 4px 14px -4px ${cat.cor}66` }
                  : ativa
                  ? { background: "#1d4ed8", color: "#fff", borderColor: "#1d4ed8" }
                  : { background: cat.corBg || "#f8fafc", color: cat.cor || "#475569", borderColor: cat.corBorda || "#e2e8f0" }
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
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
              <Landmark size={26} className="text-slate-300" />
            </div>
            <p className="text-sm font-black text-slate-600">Nenhum apoio encontrado</p>
            <p className="text-[12px] text-slate-400 mt-1">Tenta outra pesquisa ou categoria.</p>
          </div>
        ) : (
          filtrados.map(apoio => {
            const cat = getCat(apoio.categoria);
            const expandido = aberto === apoio.id;
            const Ico = ICONES_CAT[apoio.categoria] || Landmark;
            return (
              <div
                key={apoio.id}
                className="card overflow-hidden transition-all duration-200"
                style={{ borderLeft: `3px solid ${cat?.cor || "#e2e8f0"}` }}
              >
                {/* Cabeçalho do card */}
                <button
                  className="press w-full text-left px-4 py-4 flex items-start gap-3"
                  onClick={() => setAberto(expandido ? null : apoio.id)}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: cat?.corBg || "#f8fafc", border: `1px solid ${cat?.corBorda || "#e2e8f0"}` }}
                  >
                    <Ico size={17} style={{ color: cat?.cor || "#475569" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-black text-slate-800 leading-snug">{apoio.titulo}</p>
                      {apoio.novo && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: cat?.cor || "#475569" }}>NOVO</span>
                      )}
                    </div>
                    <p className="text-[11px] font-black mt-0.5" style={{ color: cat?.cor || "#475569" }}>{apoio.valor}</p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{apoio.descricao}</p>
                  </div>
                  <div className="flex-shrink-0 mt-1 ml-1">
                    {expandido
                      ? <ChevronUp size={16} className="text-slate-300" />
                      : <ChevronDown size={16} className="text-slate-300" />
                    }
                  </div>
                </button>

                {/* Detalhe expandido */}
                {expandido && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-50">
                    <div className="mt-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quem pode requerer</p>
                      <ul className="flex flex-col gap-1.5">
                        {apoio.quemPode.map((req, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span
                              className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                              style={{ background: cat?.cor || "#475569" }}
                            />
                            <span className="text-[12px] text-slate-600 leading-relaxed">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Como requerer</p>
                      <p className="text-[12px] text-slate-600 leading-relaxed">{apoio.comoRequerer}</p>
                    </div>

                    <a
                      href={apoio.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="press mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[12px] font-black"
                      style={{ background: cat?.cor || "#475569", boxShadow: `0 4px 14px -4px ${cat?.cor || "#475569"}66` }}
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
        <p className="text-center text-[10px] text-slate-300 leading-relaxed">
          Informação baseada em fontes oficiais (ePortugal.gov.pt, Segurança Social, ERSE).<br />
          Para detalhes e valores atualizados, consulta sempre o site oficial.
        </p>
      </div>
    </div>
  );
}
