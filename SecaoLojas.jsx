import { useState } from "react";
import { Shirt, Smartphone, Dumbbell, Tag, Store, Sparkles, Heart } from "lucide-react";
import { getUrlLoja } from "./afiliados";
import { PROMOCOES } from "./lib/lojas-data";

const FAV_KEY = "poupeja_favoritos_lojas";
function lerFavs() { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); } catch { return new Set(); } }
function guardarFavs(s) { try { localStorage.setItem(FAV_KEY, JSON.stringify([...s])); } catch {} }

const LOJAS = {
  moda: [
    { nome: "Zara",          dominio: "zara.com",           cor: "#000000", url: "https://www.zara.com/pt/" },
    { nome: "H&M",           dominio: "hm.com",             cor: "#e50010", url: "https://www2.hm.com/pt_pt/index.html" },
    { nome: "Mango",         dominio: "mango.com",          cor: "#000000", url: "https://shop.mango.com/pt/pt" },
    { nome: "Bershka",       dominio: "bershka.com",        cor: "#000000", url: "https://www.bershka.com/pt/" },
    { nome: "Pull&Bear",     dominio: "pullandbear.com",    cor: "#000000", url: "https://www.pullandbear.com/pt/" },
    { nome: "Stradivarius",  dominio: "stradivarius.com",   cor: "#e84b7c", url: "https://www.stradivarius.com/pt/" },
    { nome: "Lefties",       dominio: "lefties.com",        cor: "#000000", url: "https://www.lefties.com/pt/" },
    { nome: "Primark",       dominio: "primark.com",        cor: "#0066b3", url: "https://www.primark.com/pt-pt" },
    { nome: "Massimo Dutti", dominio: "massimodutti.com",   cor: "#7a6a55", url: "https://www.massimodutti.com/pt/" },
    { nome: "Springfield",   dominio: "myspringfield.com",  cor: "#1d4f3f", url: "https://www.myspringfield.com/pt/" },
    { nome: "Parfois",       dominio: "parfois.com",        cor: "#d4a05a", url: "https://www.parfois.com/pt/" },
    { nome: "Salsa",         dominio: "salsajeans.com",     cor: "#003da5", url: "https://www.salsajeans.com/pt" },
    { nome: "Tiffosi",       dominio: "tiffosi.com",        cor: "#1a3c8c", url: "https://www.tiffosi.com/pt/" },
    { nome: "MO",            dominio: "mo-online.com",      cor: "#e2001a", url: "https://www.mo-online.com/pt/" },
    { nome: "Lanidor",       dominio: "lanidor.com",        cor: "#b8312f", url: "https://www.lanidor.com/" },
    { nome: "Sacoor",        dominio: "sacoorbrothers.com", cor: "#16243f", url: "https://www.sacoorbrothers.com/pt/" },
    { nome: "C&A",           dominio: "c-and-a.com",        cor: "#003a78", url: "https://www.c-and-a.com/pt/pt/shop" },
    { nome: "Benetton",      dominio: "benetton.com",       cor: "#00a04a", url: "https://pt.benetton.com/" },
    { nome: "Quebramar",     dominio: "quebramar.com",      cor: "#00427a", url: "https://www.quebramar.com/" },
    { nome: "Calzedonia",    dominio: "calzedonia.com",     cor: "#c8102e", url: "https://www.calzedonia.com/pt/" },
    { nome: "Women'secret",  dominio: "womensecret.com",    cor: "#e6447f", url: "https://womensecret.com/pt/pt" },
    { nome: "Calvin Klein",  dominio: "calvinklein.pt",     cor: "#000000", url: "https://www.calvinklein.pt/" },
    { nome: "Tommy Hilfiger",dominio: "pt.tommy.com",       cor: "#002d72", url: "https://pt.tommy.com/" },
    { nome: "Levi's",        dominio: "levi.com",           cor: "#d6001c", url: "https://www.levi.com/PT/pt_PT/" },
    { nome: "Zippy",         dominio: "zippyonline.com",    cor: "#ffb200", url: "https://www.zippyonline.com/pt/" },
  ],
  eletronica: [
    { nome: "Amazon",         dominio: "amazon.es",         cor: "#ff9900", url: "https://www.amazon.es/" },
    { nome: "Worten",         dominio: "worten.pt",         cor: "#e30613", url: "https://www.worten.pt/" },
    { nome: "Fnac",           dominio: "fnac.pt",           cor: "#e1a300", url: "https://www.fnac.pt/" },
    { nome: "Darty",           dominio: "darty.pt",          cor: "#e2001a", url: "https://www.darty.pt/" },
    { nome: "Radio Popular",  dominio: "radiopopular.pt",   cor: "#e2001a", url: "https://www.radiopopular.pt/" },
    { nome: "PC Diga",        dominio: "pcdiga.com",        cor: "#0066b3", url: "https://www.pcdiga.com/" },
    { nome: "PCComponentes",  dominio: "pccomponentes.pt",  cor: "#ff6000", url: "https://www.pccomponentes.pt/" },
    { nome: "El Corte Inglés",dominio: "elcorteingles.pt",  cor: "#00803e", url: "https://www.elcorteingles.pt/" },
    { nome: "Apple",          dominio: "apple.com",         cor: "#555555", url: "https://www.apple.com/pt/shop" },
    { nome: "Samsung",        dominio: "samsung.com",       cor: "#1428a0", url: "https://www.samsung.com/pt/" },
    { nome: "Xiaomi",         dominio: "mi.com",            cor: "#ff6700", url: "https://www.mi.com/pt/" },
    { nome: "Techinn",        dominio: "tradeinn.com",      cor: "#3b7dc4", url: "https://www.tradeinn.com/techinn/pt" },
    { nome: "Auchan",         dominio: "auchan.pt",         cor: "#e2001a", url: "https://www.auchan.pt/" },
    { nome: "Globaldata",     dominio: "globaldata.pt",     cor: "#0a4ea2", url: "https://www.globaldata.pt/" },
  ],
  desporto: [
    { nome: "Decathlon",    dominio: "decathlon.pt",    cor: "#0082c3", url: "https://www.decathlon.pt/" },
    { nome: "Sport Zone",   dominio: "sportzone.pt",    cor: "#e2001a", url: "https://www.sportzone.pt/" },
    { nome: "Nike",         dominio: "nike.com",        cor: "#000000", url: "https://www.nike.com/pt/" },
    { nome: "Adidas",       dominio: "adidas.pt",       cor: "#000000", url: "https://www.adidas.pt/" },
    { nome: "JD Sports",    dominio: "jdsports.pt",     cor: "#000000", url: "https://www.jdsports.pt/" },
    { nome: "Puma",         dominio: "pt.puma.com",     cor: "#000000", url: "https://pt.puma.com/" },
    { nome: "Foot Locker",  dominio: "footlocker.pt",   cor: "#000000", url: "https://www.footlocker.pt/" },
    { nome: "New Balance",  dominio: "newbalance.pt",   cor: "#cf0a2c", url: "https://www.newbalance.pt/" },
    { nome: "Reebok",       dominio: "reebok.com",      cor: "#e21836", url: "https://www.reebok.pt/" },
    { nome: "Sportsdirect", dominio: "sportsdirect.com",cor: "#003f87", url: "https://pt.sportsdirect.com/" },
    { nome: "Tradeinn",     dominio: "tradeinn.com",    cor: "#3b7dc4", url: "https://www.tradeinn.com/" },
  ],
};


const CAT_CONFIG = {
  moda:      { label: "Moda",      icon: Shirt,      grad: "from-violet-600 to-purple-500",   css: "linear-gradient(135deg,#7c3aed,#a855f7)", shadow: "rgba(124,58,237,0.35)",  count: LOJAS.moda.length },
  eletronica:{ label: "Eletrónica",icon: Smartphone, grad: "from-blue-600 to-blue-500",       css: "linear-gradient(135deg,#1d4ed8,#3b82f6)", shadow: "rgba(37,99,235,0.35)",   count: LOJAS.eletronica.length },
  desporto:  { label: "Desporto",  icon: Dumbbell,   grad: "from-emerald-600 to-teal-500",    css: "linear-gradient(135deg,#059669,#14b8a6)", shadow: "rgba(5,150,105,0.35)",   count: LOJAS.desporto.length },
};

function LogoLoja({ loja, size = 44 }) {
  const s = size;
  const cor = loja.cor === "#000000" ? "#334155" : (loja.cor || "#888");
  const [nivel, setNivel] = useState(0);
  const iniciais = loja.nome.slice(0, 2).toUpperCase();
  const fontes = [
    `https://www.google.com/s2/favicons?domain=${loja.dominio}&sz=128`,
    `https://logo.clearbit.com/${loja.dominio}`,
  ];
  return (
    <div
      className="rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 bg-white"
      style={{ width: s, height: s, padding: s * 0.14, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
    >
      {nivel < fontes.length ? (
        <img
          src={fontes[nivel]} alt={loja.nome}
          onError={() => setNivel(n => n + 1)}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <span style={{ fontSize: s * 0.28, fontWeight: 900, color: cor }}>{iniciais}</span>
      )}
    </div>
  );
}

function GrelhaLojas({ lista, promo, favs, onToggleFav }) {
  return (
    <div className="px-4 grid grid-cols-3 lg:grid-cols-5 gap-3">
      {lista.map(loja => {
        const cor = loja.cor === "#000000" ? "#334155" : (loja.cor || "#888");
        const isFav = favs?.has(loja.nome);
        return (
          <div key={loja.nome} className="relative">
            <button
              onClick={() => window.open(getUrlLoja(loja), "_blank", "noopener,noreferrer")}
              className="press card p-3.5 flex flex-col items-center gap-2.5 w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[18px]" style={{ background: cor }} />
              <LogoLoja loja={loja} size={52} />
              <div className="text-center w-full">
                <p className="text-[11px] font-black text-slate-800 leading-tight truncate">{loja.nome}</p>
                <div className="mt-1 flex items-center justify-center gap-0.5">
                  {promo ? (
                    <span className="text-[9px] font-black text-orange-500 flex items-center gap-0.5">
                      <Tag size={8} /> Saldos
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
            {onToggleFav && (
              <button
                onClick={e => { e.stopPropagation(); onToggleFav(loja.nome); }}
                className="press absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: isFav ? "#fef2f2" : "rgba(255,255,255,0.9)" }}
              >
                <Heart size={11} className={isFav ? "text-red-400 fill-red-400" : "text-slate-300"} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SecaoLojas() {
  const [topo, setTopo] = useState("lojas");
  const [cat, setCat]   = useState("moda");
  const [favs, setFavs] = useState(() => lerFavs());
  const cfg = CAT_CONFIG[cat];

  function toggleFav(nome) {
    const nova = new Set(favs);
    nova.has(nome) ? nova.delete(nome) : nova.add(nome);
    setFavs(nova);
    guardarFavs(nova);
  }

  const favoritasAtuais = LOJAS[cat]?.filter(l => favs.has(l.nome)) || [];

  return (
    <div className="pb-28 pt-4">

      {/* Tab principal */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mx-4 mb-4">
        {[
          { id: "lojas",    icon: Store, label: "Lojas" },
          { id: "promocoes",icon: Tag,   label: "Promoções" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTopo(t.id)}
            className={`press flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              topo === t.id
                ? topo === "promocoes" ? "bg-white shadow-sm text-orange-600" : "bg-white shadow-sm text-slate-900"
                : "text-slate-400"
            }`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── ABA LOJAS ── */}
      {topo === "lojas" && (
        <div className="anim-up">
          {/* Tabs categoria */}
          <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scrollbar">
            {Object.entries(CAT_CONFIG).map(([id, c]) => {
              const ativo = cat === id;
              return (
                <button
                  key={id}
                  onClick={() => setCat(id)}
                  className={`press flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    ativo ? "text-white shadow-md" : "bg-white text-slate-500 border border-slate-100"
                  }`}
                  style={ativo ? { background: c.css } : {}}
                >
                  <c.icon size={13} /> {c.label}
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${ativo ? "bg-white/25 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Hero */}
          <div
            className={`mx-4 mb-5 rounded-3xl p-5 relative overflow-hidden bg-gradient-to-br ${cfg.grad}`}
            style={{ boxShadow: `0 20px 50px -15px ${cfg.shadow}` }}
          >
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <cfg.icon size={24} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{cfg.count} lojas</p>
                <p className="text-xl font-black text-white">{cfg.label}</p>
                <p className="text-[11px] text-white/70 mt-0.5">Toca numa loja para abrir o site oficial</p>
              </div>
            </div>
          </div>

          {favoritasAtuais.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-3 flex items-center gap-1.5">
                <Heart size={10} className="text-red-400 fill-red-400" /> Favoritas
              </p>
              <GrelhaLojas lista={favoritasAtuais} promo={false} favs={favs} onToggleFav={toggleFav} />
              <div className="mx-4 mt-4 mb-1 border-t border-slate-100" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mt-3 mb-3">Todas</p>
            </div>
          )}

          <GrelhaLojas lista={LOJAS[cat]} promo={false} favs={favs} onToggleFav={toggleFav} />

          <p className="text-[10px] text-slate-400 text-center mt-5 px-4">
            Toca no ❤ para guardar favoritas. As lojas abrem no site oficial.
          </p>
        </div>
      )}

      {/* ── ABA PROMOÇÕES ── */}
      {topo === "promocoes" && (
        <div className="anim-up">
          {/* Hero */}
          <div
            className="mx-4 mb-5 rounded-3xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#c2410c,#f97316)", boxShadow: "0 20px 50px -15px rgba(234,88,12,0.45)" }}
          >
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Sparkles size={22} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{PROMOCOES.length} marcas</p>
                <p className="text-xl font-black text-white">Promoções e saldos</p>
                <p className="text-[11px] text-white/70 mt-0.5">Link direto para outlet e saldos</p>
              </div>
            </div>
          </div>

          {/* Lista horizontal de destaques */}
          <div className="px-4 mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Destaques</p>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {PROMOCOES.slice(0, 5).map(loja => (
                <button
                  key={loja.nome}
                  onClick={() => window.open(getUrlLoja(loja), "_blank", "noopener,noreferrer")}
                  className="press flex-shrink-0 card p-3.5 flex flex-col items-center gap-2 w-24"
                >
                  <LogoLoja loja={loja} size={40} />
                  <p className="text-[10px] font-black text-slate-700 text-center leading-tight">{loja.nome}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-3">Todas as lojas</p>
          <GrelhaLojas lista={PROMOCOES} promo={true} favs={favs} onToggleFav={toggleFav} />

          <p className="text-[10px] text-slate-400 text-center mt-5 px-4">
            Estas lojas abrem diretamente na página de promoções ou outlet.
          </p>
        </div>
      )}

    </div>
  );
}
