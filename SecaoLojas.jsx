import { useState } from "react";
import { Shirt, Smartphone, Dumbbell, Tag, Store, Sparkles, Heart } from "lucide-react";
import { getUrlLoja } from "./afiliados";
import { PROMOCOES } from "./lib/lojas-data";

const FAV_KEY = "poupeja_favoritos_lojas";
function lerFavs() { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); } catch { return new Set(); } }
function guardarFavs(s) { try { localStorage.setItem(FAV_KEY, JSON.stringify([...s])); } catch {} }

const LOJAS = {
  moda: [
    { nome: "Benetton",      dominio: "benetton.com",       cor: "#00a04a", url: "https://pt.benetton.com/" },
    { nome: "Bershka",       dominio: "bershka.com",        cor: "#000000", url: "https://www.bershka.com/pt/" },
    { nome: "C&A",           dominio: "c-and-a.com",        cor: "#003a78", url: "https://www.c-and-a.com/pt/pt/shop" },
    { nome: "Calvin Klein",  dominio: "calvinklein.pt",     cor: "#000000", url: "https://www.calvinklein.pt/" },
    { nome: "Calzedonia",    dominio: "calzedonia.com",     cor: "#c8102e", url: "https://www.calzedonia.com/pt/" },
    { nome: "H&M",           dominio: "hm.com",             cor: "#e50010", url: "https://www2.hm.com/pt_pt/index.html" },
    { nome: "Lanidor",       dominio: "lanidor.com",        cor: "#b8312f", url: "https://www.lanidor.com/" },
    { nome: "Lefties",       dominio: "lefties.com",        cor: "#000000", url: "https://www.lefties.com/pt/" },
    { nome: "Levi's",        dominio: "levi.com",           cor: "#d6001c", url: "https://www.levi.com/PT/pt_PT/" },
    { nome: "Mango",         dominio: "mango.com",          cor: "#000000", url: "https://shop.mango.com/pt/pt" },
    { nome: "Massimo Dutti", dominio: "massimodutti.com",   cor: "#7a6a55", url: "https://www.massimodutti.com/pt/" },
    { nome: "MO",            dominio: "mo-online.com",      cor: "#e2001a", url: "https://www.mo-online.com/pt/" },
    { nome: "Parfois",       dominio: "parfois.com",        cor: "#d4a05a", url: "https://www.parfois.com/pt/" },
    { nome: "Primark",       dominio: "primark.com",        cor: "#0066b3", url: "https://www.primark.com/pt-pt" },
    { nome: "Pull&Bear",     dominio: "pullandbear.com",    cor: "#000000", url: "https://www.pullandbear.com/pt/" },
    { nome: "Quebramar",     dominio: "quebramar.com",      cor: "#00427a", url: "https://www.quebramar.com/" },
    { nome: "Sacoor",        dominio: "sacoorbrothers.com", cor: "#16243f", url: "https://www.sacoorbrothers.com/pt/" },
    { nome: "Salsa",         dominio: "salsajeans.com",     cor: "#003da5", url: "https://www.salsajeans.com/pt" },
    { nome: "Springfield",   dominio: "myspringfield.com",  cor: "#1d4f3f", url: "https://www.myspringfield.com/pt/" },
    { nome: "Stradivarius",  dominio: "stradivarius.com",   cor: "#e84b7c", url: "https://www.stradivarius.com/pt/" },
    { nome: "Tiffosi",       dominio: "tiffosi.com",        cor: "#1a3c8c", url: "https://www.tiffosi.com/pt/" },
    { nome: "Tommy Hilfiger",dominio: "pt.tommy.com",       cor: "#002d72", url: "https://pt.tommy.com/" },
    { nome: "Women'secret",  dominio: "womensecret.com",    cor: "#e6447f", url: "https://womensecret.com/pt/pt" },
    { nome: "Zara",          dominio: "zara.com",           cor: "#000000", url: "https://www.zara.com/pt/" },
    { nome: "Zippy",         dominio: "zippyonline.com",    cor: "#ffb200", url: "https://www.zippyonline.com/pt/" },
  ],
  eletronica: [
    { nome: "Amazon",         dominio: "amazon.es",         cor: "#ff9900", url: "https://www.amazon.es/" },
    { nome: "Apple",          dominio: "apple.com",         cor: "#555555", url: "https://www.apple.com/pt/shop" },
    { nome: "Auchan",         dominio: "auchan.pt",         cor: "#e2001a", url: "https://www.auchan.pt/" },
    { nome: "Darty",          dominio: "darty.pt",          cor: "#e2001a", url: "https://www.darty.pt/" },
    { nome: "El Corte Inglés",dominio: "elcorteingles.pt",  cor: "#00803e", url: "https://www.elcorteingles.pt/" },
    { nome: "Fnac",           dominio: "fnac.pt",           cor: "#e1a300", url: "https://www.fnac.pt/" },
    { nome: "Globaldata",     dominio: "globaldata.pt",     cor: "#0a4ea2", url: "https://www.globaldata.pt/" },
    { nome: "PC Diga",        dominio: "pcdiga.com",        cor: "#0066b3", url: "https://www.pcdiga.com/" },
    { nome: "PCComponentes",  dominio: "pccomponentes.pt",  cor: "#ff6000", url: "https://www.pccomponentes.pt/" },
    { nome: "Radio Popular",  dominio: "radiopopular.pt",   cor: "#e2001a", url: "https://www.radiopopular.pt/" },
    { nome: "Samsung",        dominio: "samsung.com",       cor: "#1428a0", url: "https://www.samsung.com/pt/" },
    { nome: "Techinn",        dominio: "tradeinn.com",      cor: "#3b7dc4", url: "https://www.tradeinn.com/techinn/pt" },
    { nome: "Worten",         dominio: "worten.pt",         cor: "#e30613", url: "https://www.worten.pt/" },
    { nome: "Xiaomi",         dominio: "mi.com",            cor: "#ff6700", url: "https://www.mi.com/pt/" },
  ],
  desporto: [
    { nome: "Adidas",       dominio: "adidas.pt",       cor: "#000000", url: "https://www.adidas.pt/" },
    { nome: "Decathlon",    dominio: "decathlon.pt",    cor: "#0082c3", url: "https://www.decathlon.pt/" },
    { nome: "Foot Locker",  dominio: "footlocker.pt",   cor: "#000000", url: "https://www.footlocker.pt/" },
    { nome: "JD Sports",    dominio: "jdsports.pt",     cor: "#000000", url: "https://www.jdsports.pt/" },
    { nome: "New Balance",  dominio: "newbalance.pt",   cor: "#cf0a2c", url: "https://www.newbalance.pt/" },
    { nome: "Nike",         dominio: "nike.com",        cor: "#000000", url: "https://www.nike.com/pt/" },
    { nome: "Puma",         dominio: "pt.puma.com",     cor: "#000000", url: "https://pt.puma.com/" },
    { nome: "Reebok",       dominio: "reebok.com",      cor: "#e21836", url: "https://www.reebok.pt/" },
    { nome: "Sport Zone",   dominio: "sportzone.pt",    cor: "#e2001a", url: "https://www.sportzone.pt/" },
    { nome: "Sportsdirect", dominio: "sportsdirect.com",cor: "#003f87", url: "https://pt.sportsdirect.com/" },
    { nome: "Tradeinn",     dominio: "tradeinn.com",    cor: "#3b7dc4", url: "https://www.tradeinn.com/" },
  ],
};


const CAT_CONFIG = {
  moda:      { label: "Moda",      icon: Shirt,      count: LOJAS.moda.length },
  eletronica:{ label: "Eletrónica",icon: Smartphone, count: LOJAS.eletronica.length },
  desporto:  { label: "Desporto",  icon: Dumbbell,   count: LOJAS.desporto.length },
};

// ── Tokens do sistema editorial ──
const TXT = "#14231c";
const MUTED = "#5c6b62";
const FAINT = "#8a978e";
const ACCENT      = "var(--pj-brand-ink)";  // verde como texto
const ACCENT_FILL = "var(--pj-brand)";      // verde como preenchimento
const CHIP = "#eeece4";
const DIV_ROW = "#eeece4";
const DIV_SEC = "#e4e2d8";
const CARD_BG = "#fbfaf6";

const labelStyle = {
  textTransform: "uppercase",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.09em",
  color: FAINT,
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
      className="flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ width: s, height: s, padding: s * 0.16, borderRadius: 12, background: CHIP }}
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
    <div className="px-4 grid grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-5">
      {lista.map(loja => {
        const isFav = favs?.has(loja.nome);
        return (
          <div key={loja.nome} className="relative">
            <button
              onClick={() => window.open(getUrlLoja(loja), "_blank", "noopener,noreferrer")}
              className="pj-tap flex flex-col items-center gap-2.5 w-full relative"
            >
              <LogoLoja loja={loja} size={52} />
              <div className="text-center w-full">
                <p className="text-[11px] leading-tight truncate" style={{ color: TXT, fontWeight: 600 }}>{loja.nome}</p>
                <div className="mt-1 flex items-center justify-center gap-0.5">
                  {promo ? (
                    <span className="text-[9px] flex items-center gap-0.5" style={{ color: ACCENT, fontWeight: 600, letterSpacing: "0.04em" }}>
                      <Tag size={8} /> Saldos
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
            {onToggleFav && (
              <button
                onClick={e => { e.stopPropagation(); onToggleFav(loja.nome); }}
                className="pj-tap absolute top-0 right-0 w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: isFav ? "#fbeaea" : CHIP }}
              >
                <Heart size={11} className={isFav ? "text-red-400 fill-red-400" : ""} style={isFav ? {} : { color: FAINT }} />
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
    <div className="pb-28 pt-4" style={{ background: "var(--pj-surface)", color: TXT }}>

      {/* Tab principal */}
      <div className="flex gap-1 p-1 rounded-2xl mx-4 mb-5" style={{ background: CHIP }}>
        {[
          { id: "lojas",    icon: Store, label: "Lojas" },
          { id: "promocoes",icon: Tag,   label: "Promoções" },
        ].map(t => {
          const ativo = topo === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTopo(t.id)}
              className="pj-tap flex-1 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
              style={{
                background: ativo ? CARD_BG : "transparent",
                color: ativo ? TXT : FAINT,
                fontWeight: 600,
                boxShadow: ativo ? "0 1px 3px rgba(20,35,28,0.06)" : "none",
              }}
            >
              <t.icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── ABA LOJAS ── */}
      {topo === "lojas" && (
        <div className="anim-up">
          {/* Tabs categoria */}
          <div className="flex gap-2 px-4 mb-6 overflow-x-auto no-scrollbar">
            {Object.entries(CAT_CONFIG).map(([id, c]) => {
              const ativo = cat === id;
              return (
                <button
                  key={id}
                  onClick={() => setCat(id)}
                  className="pj-tap flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs transition-all"
                  style={ativo
                    ? { background: ACCENT_FILL, color: "#f6f5f0", fontWeight: 600 }
                    : { background: CHIP, color: MUTED, fontWeight: 600 }}
                >
                  <c.icon size={13} /> {c.label}
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={ativo
                      ? { background: "rgba(246,245,240,0.22)", color: "#f6f5f0", fontWeight: 600 }
                      : { background: "rgba(20,35,28,0.06)", color: FAINT, fontWeight: 600 }}
                  >
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cabeçalho editorial */}
          <div className="mx-4 mb-6">
            <p className="mb-2 flex items-center gap-1.5" style={labelStyle}>
              <cfg.icon size={12} style={{ color: FAINT }} /> {cfg.count} lojas
            </p>
            <h2 className="font-display" style={{ fontSize: 19, fontWeight: 600, color: TXT, letterSpacing: "-0.01em" }}>
              {cfg.label}
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: MUTED }}>Toca numa loja para abrir o site oficial</p>
          </div>

          <div className="mx-4 mb-6" style={{ borderTop: `1px solid ${DIV_SEC}` }} />

          {favoritasAtuais.length > 0 && (
            <div className="mb-6">
              <p className="px-4 mb-4 flex items-center gap-1.5" style={labelStyle}>
                <Heart size={10} className="text-red-400 fill-red-400" /> Favoritas
              </p>
              <GrelhaLojas lista={favoritasAtuais} promo={false} favs={favs} onToggleFav={toggleFav} />
              <div className="mx-4 mt-6 mb-1" style={{ borderTop: `1px solid ${DIV_ROW}` }} />
              <p className="px-4 mt-5 mb-4" style={labelStyle}>Todas</p>
            </div>
          )}

          <GrelhaLojas lista={LOJAS[cat]} promo={false} favs={favs} onToggleFav={toggleFav} />

          <p className="text-[11px] text-center mt-8 px-4" style={{ color: FAINT }}>
            Toca no ❤ para guardar favoritas. As lojas abrem no site oficial.
          </p>
        </div>
      )}

      {/* ── ABA PROMOÇÕES ── */}
      {topo === "promocoes" && (
        <div className="anim-up">
          {/* Cabeçalho editorial */}
          <div className="mx-4 mb-6">
            <p className="mb-2 flex items-center gap-1.5" style={labelStyle}>
              <Sparkles size={12} style={{ color: FAINT }} /> {PROMOCOES.length} marcas
            </p>
            <h2 className="font-display" style={{ fontSize: 19, fontWeight: 600, color: TXT, letterSpacing: "-0.01em" }}>
              Promoções e saldos
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: MUTED }}>Link direto para outlet e saldos</p>
          </div>

          <div className="mx-4 mb-6" style={{ borderTop: `1px solid ${DIV_SEC}` }} />

          {/* Lista horizontal de destaques */}
          <div className="px-4 mb-6">
            <p className="mb-4" style={labelStyle}>Destaques</p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {PROMOCOES.slice(0, 5).map(loja => (
                <button
                  key={loja.nome}
                  onClick={() => window.open(getUrlLoja(loja), "_blank", "noopener,noreferrer")}
                  className="pj-tap flex-shrink-0 flex flex-col items-center gap-2 w-24"
                >
                  <LogoLoja loja={loja} size={44} />
                  <p className="text-[10px] text-center leading-tight" style={{ color: TXT, fontWeight: 600 }}>{loja.nome}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mx-4 mb-6" style={{ borderTop: `1px solid ${DIV_ROW}` }} />

          <p className="px-4 mb-4" style={labelStyle}>Todas as lojas</p>
          <GrelhaLojas lista={PROMOCOES} promo={true} favs={favs} onToggleFav={toggleFav} />

          <p className="text-[11px] text-center mt-8 px-4" style={{ color: FAINT }}>
            Estas lojas abrem diretamente na página de promoções ou outlet.
          </p>
        </div>
      )}

    </div>
  );
}
