import { useState } from "react";
import { Shirt, Smartphone, Dumbbell, ExternalLink, Tag, Store } from "lucide-react";

const LOJAS = {
  moda: [
    { nome:"Zara", dominio:"zara.com", cor:"#000000", url:"https://www.zara.com/pt/" },
    { nome:"H&M", dominio:"hm.com", cor:"#e50010", url:"https://www2.hm.com/pt_pt/index.html" },
    { nome:"Mango", dominio:"mango.com", cor:"#000000", url:"https://shop.mango.com/pt/pt" },
    { nome:"Bershka", dominio:"bershka.com", cor:"#000000", url:"https://www.bershka.com/pt/" },
    { nome:"Pull&Bear", dominio:"pullandbear.com", cor:"#000000", url:"https://www.pullandbear.com/pt/" },
    { nome:"Stradivarius", dominio:"stradivarius.com", cor:"#e84b7c", url:"https://www.stradivarius.com/pt/" },
    { nome:"Lefties", dominio:"lefties.com", cor:"#000000", url:"https://www.lefties.com/pt/" },
    { nome:"Primark", dominio:"primark.com", cor:"#0066b3", url:"https://www.primark.com/pt-pt" },
    { nome:"Massimo Dutti", dominio:"massimodutti.com", cor:"#7a6a55", url:"https://www.massimodutti.com/pt/" },
    { nome:"Springfield", dominio:"myspringfield.com", cor:"#1d4f3f", url:"https://www.myspringfield.com/pt/" },
    { nome:"Parfois", dominio:"parfois.com", cor:"#d4a05a", url:"https://www.parfois.com/pt/" },
    { nome:"Salsa", dominio:"salsajeans.com", cor:"#003da5", url:"https://www.salsajeans.com/pt" },
    { nome:"Tiffosi", dominio:"tiffosi.com", cor:"#1a3c8c", url:"https://www.tiffosi.com/pt/" },
    { nome:"MO", dominio:"mo-online.com", cor:"#e2001a", url:"https://www.mo-online.com/pt/" },
    { nome:"Lanidor", dominio:"lanidor.com", cor:"#b8312f", url:"https://www.lanidor.com/" },
    { nome:"Sacoor", dominio:"sacoorbrothers.com", cor:"#16243f", url:"https://www.sacoorbrothers.com/pt/" },
    { nome:"C&A", dominio:"c-and-a.com", cor:"#003a78", url:"https://www.c-and-a.com/pt/pt/shop" },
    { nome:"Quebramar", dominio:"quebramar.com", cor:"#00427a", url:"https://www.quebramar.com/" },
    { nome:"Calzedonia", dominio:"calzedonia.com", cor:"#c8102e", url:"https://www.calzedonia.com/pt/" },
    { nome:"Women'secret", dominio:"womensecret.com", cor:"#e6447f", url:"https://womensecret.com/pt/pt" },
    { nome:"Calvin Klein", dominio:"calvinklein.pt", cor:"#000000", url:"https://www.calvinklein.pt/" },
    { nome:"Tommy Hilfiger", dominio:"pt.tommy.com", cor:"#002d72", url:"https://pt.tommy.com/" },
    { nome:"Levi's", dominio:"levi.com", cor:"#d6001c", url:"https://www.levi.com/PT/pt_PT/" },
    { nome:"Zippy", dominio:"zippyonline.com", cor:"#ffb200", url:"https://www.zippyonline.com/pt/" },
  ],
  eletronica: [
    { nome:"Worten", dominio:"worten.pt", cor:"#e30613", url:"https://www.worten.pt/" },
    { nome:"Fnac", dominio:"fnac.pt", cor:"#e1a300", url:"https://www.fnac.pt/" },
    { nome:"MediaMarkt", dominio:"mediamarkt.pt", cor:"#df0000", url:"https://www.mediamarkt.pt/" },
    { nome:"Radio Popular", dominio:"radiopopular.pt", cor:"#e2001a", url:"https://www.radiopopular.pt/" },
    { nome:"PC Diga", dominio:"pcdiga.com", cor:"#0066b3", url:"https://www.pcdiga.com/" },
    { nome:"PCComponentes", dominio:"pccomponentes.pt", cor:"#ff6000", url:"https://www.pccomponentes.pt/" },
    { nome:"El Corte Inglés", dominio:"elcorteingles.pt", cor:"#00803e", url:"https://www.elcorteingles.pt/" },
    { nome:"Apple", dominio:"apple.com", cor:"#555555", url:"https://www.apple.com/pt/shop" },
    { nome:"Samsung", dominio:"samsung.com", cor:"#1428a0", url:"https://www.samsung.com/pt/" },
    { nome:"Xiaomi", dominio:"mi.com", cor:"#ff6700", url:"https://www.mi.com/pt/" },
    { nome:"Wells", dominio:"wells.pt", cor:"#0a9e8e", url:"https://www.wells.pt/" },
    { nome:"Techinn", dominio:"tradeinn.com", cor:"#3b7dc4", url:"https://www.tradeinn.com/techinn/pt" },
    { nome:"Auchan", dominio:"auchan.pt", cor:"#e2001a", url:"https://www.auchan.pt/" },
    { nome:"Globaldata", dominio:"globaldata.pt", cor:"#0a4ea2", url:"https://www.globaldata.pt/" },
  ],
  desporto: [
    { nome:"Decathlon", dominio:"decathlon.pt", cor:"#0082c3", url:"https://www.decathlon.pt/" },
    { nome:"Sport Zone", dominio:"sportzone.pt", cor:"#e2001a", url:"https://www.sportzone.pt/" },
    { nome:"Nike", dominio:"nike.com", cor:"#000000", url:"https://www.nike.com/pt/" },
    { nome:"Adidas", dominio:"adidas.pt", cor:"#000000", url:"https://www.adidas.pt/" },
    { nome:"JD Sports", dominio:"jdsports.pt", cor:"#000000", url:"https://www.jdsports.pt/" },
    { nome:"Puma", dominio:"pt.puma.com", cor:"#000000", url:"https://pt.puma.com/" },
    { nome:"Foot Locker", dominio:"footlocker.pt", cor:"#000000", url:"https://www.footlocker.pt/" },
    { nome:"New Balance", dominio:"newbalance.pt", cor:"#cf0a2c", url:"https://www.newbalance.pt/" },
    { nome:"Sportsdirect", dominio:"sportsdirect.com", cor:"#003f87", url:"https://pt.sportsdirect.com/" },
    { nome:"Tradeinn", dominio:"tradeinn.com", cor:"#3b7dc4", url:"https://www.tradeinn.com/" },
  ],
};

const PROMOCOES = [
  { nome:"Worten", dominio:"worten.pt", cor:"#e30613", url:"https://www.worten.pt/promocoes" },
  { nome:"Parfois", dominio:"parfois.com", cor:"#d4a05a", url:"https://www.parfois.com/pt/sale/" },
  { nome:"Mango", dominio:"mango.com", cor:"#000000", url:"https://shop.mango.com/pt/pt/l/mulher/promocoes" },
  { nome:"Nike", dominio:"nike.com", cor:"#000000", url:"https://www.nike.com/pt/" },
  { nome:"Adidas", dominio:"adidas.pt", cor:"#000000", url:"https://www.adidas.pt/outlet" },
  { nome:"Decathlon", dominio:"decathlon.pt", cor:"#0082c3", url:"https://www.decathlon.pt/browse/c0-todos-os-desportos/_/N-1mb0eha" },
  { nome:"MediaMarkt", dominio:"mediamarkt.pt", cor:"#df0000", url:"https://www.mediamarkt.pt/pt/campaign/outlet" },
  { nome:"Puma", dominio:"pt.puma.com", cor:"#000000", url:"https://pt.puma.com/pt/pt/sale" },
  { nome:"Tommy Hilfiger", dominio:"pt.tommy.com", cor:"#002d72", url:"https://pt.tommy.com/" },
  { nome:"Calvin Klein", dominio:"calvinklein.pt", cor:"#000000", url:"https://www.calvinklein.pt/sale" },
  { nome:"Levi's", dominio:"levi.com", cor:"#d6001c", url:"https://www.levi.com/PT/pt_PT/clothing/c/levi_clothing_sale" },
  { nome:"JD Sports", dominio:"jdsports.pt", cor:"#000000", url:"https://www.jdsports.pt/promocoes/" },
];

function LogoLoja({ loja, size }) {
  const s = size || 64;
  const cor = loja.cor || "#888";
  const [nivel, setNivel] = useState(0);
  const iniciais = loja.nome.slice(0, 2).toUpperCase();
  const fontes = [
    "https://www.google.com/s2/favicons?domain=" + loja.dominio + "&sz=128",
    "https://logo.clearbit.com/" + loja.dominio,
  ];
  return (
    <div className="rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 bg-white"
      style={{ width: s, height: s, padding: s*0.16, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
      {nivel < fontes.length ? (
        <img src={fontes[nivel]} alt={loja.nome}
          onError={function(){ setNivel(function(n){ return n+1; }); }}
          style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
      ) : (
        <span style={{ fontSize: s*0.28, fontWeight:900, color:cor }}>{iniciais}</span>
      )}
    </div>
  );
}

function GrelhaLojas({ lista, modoPromo }) {
  function abrir(url) { window.open(url, "_blank"); }
  return (
    <div className="px-4 grid grid-cols-3 gap-2.5">
      {lista.map(function(loja){
        return (
          <button key={loja.nome}
            onClick={function(){ abrir(loja.url); }}
            className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm active:scale-95 transition-all flex flex-col items-center gap-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: loja.cor === "#000000" ? "#334155" : loja.cor }}/>
            <LogoLoja loja={loja} size={44} />
            <div className="text-center w-full">
              <p className="text-[11px] font-black text-slate-800 leading-tight truncate">{loja.nome}</p>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {modoPromo ? (
                  <>
                    <Tag size={9} className="text-orange-500 flex-shrink-0" />
                    <span className="text-[9px] font-black text-orange-500">Promoções</span>
                  </>
                ) : (
                  <ExternalLink size={11} className="text-slate-400" />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function SecaoLojas() {
  const [topo, setTopo] = useState("lojas");
  const [cat, setCat] = useState("moda");

  const cores = {
    moda: "linear-gradient(135deg,#7c3aed,#a855f7)",
    eletronica: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
    desporto: "linear-gradient(135deg,#059669,#10b981)",
  };
  const titulos = {
    moda: "Lojas de moda",
    eletronica: "Eletrónica e tecnologia",
    desporto: "Desporto e sapatilhas",
  };

  return (
    <div className="pb-28 pt-4">

      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mx-4 mb-3">
        <button onClick={function(){ setTopo("lojas"); }}
          className={"flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 " + (topo === "lojas" ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
          <Store size={14} /> Lojas
        </button>
        <button onClick={function(){ setTopo("promocoes"); }}
          className={"flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 " + (topo === "promocoes" ? "bg-white shadow-sm text-orange-600" : "text-slate-500")}>
          <Tag size={14} /> Promoções
        </button>
      </div>

      {topo === "lojas" ? (
        <div>
          <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mx-4 mb-4">
            <button onClick={function(){ setCat("moda"); }}
              className={"flex-1 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 " + (cat === "moda" ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
              <Shirt size={13} /> Moda
            </button>
            <button onClick={function(){ setCat("eletronica"); }}
              className={"flex-1 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 " + (cat === "eletronica" ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
              <Smartphone size={13} /> Eletrónica
            </button>
            <button onClick={function(){ setCat("desporto"); }}
              className={"flex-1 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 " + (cat === "desporto" ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
              <Dumbbell size={13} /> Desporto
            </button>
          </div>

          <div className="mx-4 mb-5 rounded-3xl overflow-hidden relative" style={{ background: cores[cat], boxShadow:"0 12px 30px -10px rgba(99,102,241,0.4)" }}>
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10"/>
            <div className="px-5 pt-5 pb-5 text-white relative z-10">
              <p className="text-2xl font-black">{titulos[cat]}</p>
              <p className="text-xs opacity-80 mt-1">Toca numa loja para abrir o site oficial</p>
            </div>
          </div>

          <GrelhaLojas lista={LOJAS[cat]} modoPromo={false} />

          <div className="mx-4 mt-5">
            <p className="text-[10px] text-slate-400 text-center">
              As lojas abrem no site oficial, com as promoções sempre atualizadas.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="mx-4 mb-5 rounded-3xl overflow-hidden relative" style={{ background:"linear-gradient(135deg,#ea580c,#f97316)", boxShadow:"0 12px 30px -10px rgba(234,88,12,0.4)" }}>
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10"/>
            <div className="px-5 pt-5 pb-5 text-white relative z-10">
              <p className="text-2xl font-black">Promoções diretas</p>
              <p className="text-xs opacity-80 mt-1">Lojas com link direto para os saldos e outlet</p>
            </div>
          </div>

          <GrelhaLojas lista={PROMOCOES} modoPromo={true} />

          <div className="mx-4 mt-5">
            <p className="text-[10px] text-slate-400 text-center">
              Estas lojas abrem diretamente na página de promoções ou outlet.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
