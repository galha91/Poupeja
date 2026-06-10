import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, X, Check, Search, ChevronLeft, Minus } from "lucide-react";

const LS_KEY = "poupeja_lista_compras";

const CATS = {
  "Frutas": {
    emoji: "🍎", cor: "#ef4444", bg: "#fef2f2",
    items: [
      { nome: "Maçãs", emoji: "🍎" }, { nome: "Bananas", emoji: "🍌" },
      { nome: "Laranjas", emoji: "🍊" }, { nome: "Morangos", emoji: "🍓" },
      { nome: "Uvas", emoji: "🍇" }, { nome: "Pêras", emoji: "🍐" },
      { nome: "Melão", emoji: "🍈" }, { nome: "Limões", emoji: "🍋" },
      { nome: "Kiwi", emoji: "🥝" }, { nome: "Ananás", emoji: "🍍" },
      { nome: "Manga", emoji: "🥭" }, { nome: "Cerejas", emoji: "🍒" },
      { nome: "Pêssegos", emoji: "🍑" }, { nome: "Ameixas", emoji: "🍑" },
      { nome: "Melancia", emoji: "🍉" }, { nome: "Figos", emoji: "🫐" },
      { nome: "Framboesas", emoji: "🫐" }, { nome: "Mirtilos", emoji: "🫐" },
      { nome: "Tangerinas", emoji: "🍊" }, { nome: "Amoras", emoji: "🫐" },
      { nome: "Toranja", emoji: "🍊" }, { nome: "Papaia", emoji: "🍈" },
      { nome: "Coco", emoji: "🥥" }, { nome: "Abacate", emoji: "🥑" },
    ],
  },
  "Legumes": {
    emoji: "🥦", cor: "#16a34a", bg: "#f0fdf4",
    items: [
      { nome: "Tomates", emoji: "🍅" }, { nome: "Alface", emoji: "🥬" },
      { nome: "Cenouras", emoji: "🥕" }, { nome: "Cebolas", emoji: "🧅" },
      { nome: "Alho", emoji: "🧄" }, { nome: "Batatas", emoji: "🥔" },
      { nome: "Bróculos", emoji: "🥦" }, { nome: "Pepinos", emoji: "🥒" },
      { nome: "Pimentos", emoji: "🫑" }, { nome: "Couve", emoji: "🥬" },
      { nome: "Espinafres", emoji: "🥬" }, { nome: "Cogumelos", emoji: "🍄" },
      { nome: "Beringela", emoji: "🍆" }, { nome: "Abobrinha", emoji: "🥒" },
      { nome: "Beterraba", emoji: "🫛" }, { nome: "Nabo", emoji: "🥔" },
      { nome: "Ervilhas", emoji: "🫛" }, { nome: "Feijão verde", emoji: "🫛" },
      { nome: "Milho", emoji: "🌽" }, { nome: "Courgette", emoji: "🥒" },
      { nome: "Salsa", emoji: "🌿" }, { nome: "Coentros", emoji: "🌿" },
      { nome: "Hortelã", emoji: "🌿" }, { nome: "Louro", emoji: "🌿" },
      { nome: "Cebola roxa", emoji: "🧅" }, { nome: "Alho francês", emoji: "🥬" },
      { nome: "Nabo", emoji: "🥔" }, { nome: "Rabanete", emoji: "🫛" },
    ],
  },
  "Laticínios & Ovos": {
    emoji: "🥛", cor: "#3b82f6", bg: "#eff6ff",
    items: [
      { nome: "Leite meio-gordo", emoji: "🥛" }, { nome: "Leite gordo", emoji: "🥛" },
      { nome: "Iogurte natural", emoji: "🫙" }, { nome: "Iogurte grego", emoji: "🫙" },
      { nome: "Iogurte de fruta", emoji: "🫙" }, { nome: "Queijo flamengo", emoji: "🧀" },
      { nome: "Queijo fresco", emoji: "🧀" }, { nome: "Queijo parmesão", emoji: "🧀" },
      { nome: "Manteiga", emoji: "🧈" }, { nome: "Natas", emoji: "🥛" },
      { nome: "Ovos", emoji: "🥚" }, { nome: "Requeijão", emoji: "🧀" },
      { nome: "Mozzarella", emoji: "🧀" }, { nome: "Queijo para barrar", emoji: "🧀" },
      { nome: "Creme fraîche", emoji: "🥛" }, { nome: "Kefir", emoji: "🥛" },
      { nome: "Queijo da Serra", emoji: "🧀" }, { nome: "Queijo azul", emoji: "🧀" },
    ],
  },
  "Padaria": {
    emoji: "🍞", cor: "#d97706", bg: "#fffbeb",
    items: [
      { nome: "Pão de trigo", emoji: "🍞" }, { nome: "Pão de forma", emoji: "🍞" },
      { nome: "Pão integral", emoji: "🍞" }, { nome: "Baguete", emoji: "🥖" },
      { nome: "Croissant", emoji: "🥐" }, { nome: "Tostas", emoji: "🍞" },
      { nome: "Bolacha Maria", emoji: "🍪" }, { nome: "Bolacha torrada", emoji: "🍪" },
      { nome: "Bolos", emoji: "🧁" }, { nome: "Pão de leite", emoji: "🍞" },
      { nome: "Tarte", emoji: "🥧" }, { nome: "Pastel de nata", emoji: "🥧" },
      { nome: "Broa", emoji: "🍞" }, { nome: "Papo-seco", emoji: "🥖" },
      { nome: "Pão de centeio", emoji: "🍞" }, { nome: "Muffins", emoji: "🧁" },
      { nome: "Granola", emoji: "🌾" },
    ],
  },
  "Carnes": {
    emoji: "🥩", cor: "#dc2626", bg: "#fff1f2",
    items: [
      { nome: "Frango inteiro", emoji: "🍗" }, { nome: "Peito de frango", emoji: "🍗" },
      { nome: "Coxa de frango", emoji: "🍗" }, { nome: "Carne picada", emoji: "🥩" },
      { nome: "Bifes de vaca", emoji: "🥩" }, { nome: "Costeletas de porco", emoji: "🥩" },
      { nome: "Lombo de porco", emoji: "🥩" }, { nome: "Entrecosto", emoji: "🥩" },
      { nome: "Cordeiro", emoji: "🍖" }, { nome: "Vitel", emoji: "🥩" },
      { nome: "Presunto", emoji: "🥓" }, { nome: "Fiambre", emoji: "🍖" },
      { nome: "Chouriço", emoji: "🌭" }, { nome: "Salpicão", emoji: "🌭" },
      { nome: "Alheira", emoji: "🌭" }, { nome: "Salsichas", emoji: "🌭" },
      { nome: "Bacon", emoji: "🥓" }, { nome: "Mortadela", emoji: "🍖" },
      { nome: "Paio", emoji: "🌭" }, { nome: "Linguiça", emoji: "🌭" },
      { nome: "Morcela", emoji: "🌭" }, { nome: "Peru fatiado", emoji: "🍗" },
    ],
  },
  "Peixe & Marisco": {
    emoji: "🐟", cor: "#0284c7", bg: "#f0f9ff",
    items: [
      { nome: "Atum (lata)", emoji: "🐟" }, { nome: "Sardinha (lata)", emoji: "🐟" },
      { nome: "Cavala (lata)", emoji: "🐟" }, { nome: "Bacalhau", emoji: "🐠" },
      { nome: "Salmão", emoji: "🐟" }, { nome: "Pescada", emoji: "🐠" },
      { nome: "Dourada", emoji: "🐠" }, { nome: "Robalo", emoji: "🐠" },
      { nome: "Camarão", emoji: "🦐" }, { nome: "Lulas", emoji: "🦑" },
      { nome: "Mexilhão", emoji: "🦪" }, { nome: "Polvo", emoji: "🐙" },
      { nome: "Truta", emoji: "🐟" }, { nome: "Filetes", emoji: "🐠" },
      { nome: "Peixe espada", emoji: "🐠" }, { nome: "Choco", emoji: "🦑" },
      { nome: "Amêijoas", emoji: "🦪" }, { nome: "Berbigão", emoji: "🦪" },
    ],
  },
  "Mercearia": {
    emoji: "🛒", cor: "#92400e", bg: "#fef3c7",
    items: [
      { nome: "Arroz", emoji: "🍚" }, { nome: "Massa esparguete", emoji: "🍝" },
      { nome: "Massa penne", emoji: "🍝" }, { nome: "Massa laços", emoji: "🍝" },
      { nome: "Farinha", emoji: "🌾" }, { nome: "Açúcar", emoji: "🍬" },
      { nome: "Sal", emoji: "🧂" }, { nome: "Azeite", emoji: "🫒" },
      { nome: "Óleo vegetal", emoji: "🫙" }, { nome: "Vinagre", emoji: "🫙" },
      { nome: "Molho de tomate", emoji: "🍅" }, { nome: "Polpa de tomate", emoji: "🍅" },
      { nome: "Feijão (lata)", emoji: "🫘" }, { nome: "Grão (lata)", emoji: "🫘" },
      { nome: "Lentilhas", emoji: "🫘" }, { nome: "Caldo de galinha", emoji: "🫙" },
      { nome: "Maionese", emoji: "🫙" }, { nome: "Ketchup", emoji: "🍅" },
      { nome: "Mostarda", emoji: "🫙" }, { nome: "Mel", emoji: "🍯" },
      { nome: "Compotas", emoji: "🍓" }, { nome: "Cereais", emoji: "🌾" },
      { nome: "Aveia", emoji: "🌾" }, { nome: "Flocos milho", emoji: "🌾" },
      { nome: "Pimenta", emoji: "🫙" }, { nome: "Canela", emoji: "🫙" },
      { nome: "Bicarbonato", emoji: "🫙" }, { nome: "Fermento", emoji: "🫙" },
      { nome: "Levedura", emoji: "🫙" }, { nome: "Amido milho", emoji: "🌽" },
      { nome: "Frango (lata)", emoji: "🍗" }, { nome: "Pepino (lata)", emoji: "🥒" },
    ],
  },
  "Bebidas": {
    emoji: "🧃", cor: "#7c3aed", bg: "#f5f3ff",
    items: [
      { nome: "Água natural", emoji: "💧" }, { nome: "Água com gás", emoji: "💧" },
      { nome: "Sumo de laranja", emoji: "🍊" }, { nome: "Sumo de fruta", emoji: "🧃" },
      { nome: "Refrigerante cola", emoji: "🥤" }, { nome: "Refrigerante limão", emoji: "🥤" },
      { nome: "Cerveja", emoji: "🍺" }, { nome: "Vinho tinto", emoji: "🍷" },
      { nome: "Vinho branco", emoji: "🍾" }, { nome: "Vinho verde", emoji: "🍶" },
      { nome: "Café", emoji: "☕" }, { nome: "Cápsulas café", emoji: "☕" },
      { nome: "Chá", emoji: "🍵" }, { nome: "Leite vegetal", emoji: "🥛" },
      { nome: "Chocolate quente", emoji: "🍫" }, { nome: "Bebida energética", emoji: "⚡" },
      { nome: "Tónica", emoji: "🥤" }, { nome: "Cidra", emoji: "🍺" },
      { nome: "Sangria", emoji: "🍷" }, { nome: "Água com sabor", emoji: "💧" },
    ],
  },
  "Congelados": {
    emoji: "🧊", cor: "#0369a1", bg: "#f0f9ff",
    items: [
      { nome: "Batata frita (cong.)", emoji: "🍟" }, { nome: "Pizza congelada", emoji: "🍕" },
      { nome: "Lasanha congelada", emoji: "🍝" }, { nome: "Legumes cong.", emoji: "🥦" },
      { nome: "Peixe cong.", emoji: "🐟" }, { nome: "Camarão cong.", emoji: "🦐" },
      { nome: "Hambúrgueres", emoji: "🍔" }, { nome: "Nuggets", emoji: "🍗" },
      { nome: "Gelados", emoji: "🍦" }, { nome: "Fruta cong.", emoji: "🍓" },
      { nome: "Pão cong.", emoji: "🍞" }, { nome: "Waffles cong.", emoji: "🧇" },
      { nome: "Ervilhas cong.", emoji: "🫛" }, { nome: "Espinafres cong.", emoji: "🥬" },
    ],
  },
  "Snacks": {
    emoji: "🍫", cor: "#b45309", bg: "#fef9ee",
    items: [
      { nome: "Chocolate", emoji: "🍫" }, { nome: "Batatas fritas", emoji: "🥔" },
      { nome: "Pipocas", emoji: "🍿" }, { nome: "Gomas", emoji: "🍬" },
      { nome: "Amendoins", emoji: "🥜" }, { nome: "Frutos secos", emoji: "🥜" },
      { nome: "Barras de cereais", emoji: "🌾" }, { nome: "Rebuçados", emoji: "🍬" },
      { nome: "Chupa-chupas", emoji: "🍭" }, { nome: "Chips", emoji: "🥔" },
      { nome: "Bolachas doces", emoji: "🍪" }, { nome: "Croissant embal.", emoji: "🥐" },
      { nome: "Panquecas", emoji: "🥞" }, { nome: "Trigo alvo", emoji: "🌾" },
      { nome: "Rissóis", emoji: "🫓" }, { nome: "Croquetes", emoji: "🫓" },
    ],
  },
  "Limpeza": {
    emoji: "🧹", cor: "#0891b2", bg: "#ecfeff",
    items: [
      { nome: "Detergente loiça", emoji: "🧴" }, { nome: "Detergente máq.", emoji: "🧺" },
      { nome: "Amaciador roupa", emoji: "🧺" }, { nome: "Limpeza WC", emoji: "🚿" },
      { nome: "Limpeza casa banho", emoji: "🫧" }, { nome: "Limpeza cozinha", emoji: "🫧" },
      { nome: "Papel higiénico", emoji: "🧻" }, { nome: "Papel de cozinha", emoji: "🧻" },
      { nome: "Guardanapos", emoji: "🧻" }, { nome: "Sacos do lixo", emoji: "🗑️" },
      { nome: "Sacos congelar", emoji: "🛍️" }, { nome: "Esfregão", emoji: "🧹" },
      { nome: "Vassoura", emoji: "🧹" }, { nome: "Desinfetante", emoji: "💧" },
      { nome: "Lixívia", emoji: "💧" }, { nome: "Esponjas", emoji: "🧽" },
      { nome: "Pano de cozinha", emoji: "🧻" }, { nome: "Film plástico", emoji: "🫙" },
      { nome: "Papel de alumínio", emoji: "🫙" }, { nome: "Ambientador", emoji: "🌸" },
      { nome: "Spray limpeza", emoji: "💧" }, { nome: "Pastilhas máq. loiça", emoji: "🧴" },
    ],
  },
  "Higiene": {
    emoji: "🧼", cor: "#db2777", bg: "#fdf4ff",
    items: [
      { nome: "Champô", emoji: "🧴" }, { nome: "Condicionador", emoji: "🧴" },
      { nome: "Gel de banho", emoji: "🚿" }, { nome: "Sabonete", emoji: "🧼" },
      { nome: "Pasta dentes", emoji: "🪥" }, { nome: "Escova dentes", emoji: "🪥" },
      { nome: "Fio dentário", emoji: "🦷" }, { nome: "Elixir bucal", emoji: "🦷" },
      { nome: "Desodorizante", emoji: "🧴" }, { nome: "Creme rosto", emoji: "🧴" },
      { nome: "Creme corpo", emoji: "🧴" }, { nome: "Protetor solar", emoji: "☀️" },
      { nome: "Maquilhagem", emoji: "💄" }, { nome: "Máscara facial", emoji: "🧖" },
      { nome: "Pensos higiénicos", emoji: "🩸" }, { nome: "Fraldas", emoji: "👶" },
      { nome: "Algodão", emoji: "🌱" }, { nome: "Lâminas barbear", emoji: "🪒" },
      { nome: "Espuma de barbear", emoji: "🪒" }, { nome: "Perfume", emoji: "🌺" },
      { nome: "Cotonetes", emoji: "🌱" }, { nome: "Papel higiénico húmido", emoji: "🧻" },
      { nome: "Shampoo seco", emoji: "🧴" }, { nome: "Creme de mãos", emoji: "🧴" },
    ],
  },
  "Bebé & Criança": {
    emoji: "👶", cor: "#ec4899", bg: "#fdf2f8",
    items: [
      { nome: "Fraldas", emoji: "👶" }, { nome: "Lenços húmidos", emoji: "🧻" },
      { nome: "Leite em pó", emoji: "🥛" }, { nome: "Papas bebé", emoji: "🍼" },
      { nome: "Iogurte bebé", emoji: "🫙" }, { nome: "Sumo bebé", emoji: "🧃" },
      { nome: "Creme bumbum", emoji: "🧴" }, { nome: "Champô bebé", emoji: "🧴" },
      { nome: "Chupeta", emoji: "🍼" }, { nome: "Biberão", emoji: "🍼" },
    ],
  },
  "Farmácia": {
    emoji: "💊", cor: "#6366f1", bg: "#eef2ff",
    items: [
      { nome: "Paracetamol", emoji: "💊" }, { nome: "Ibuprofeno", emoji: "💊" },
      { nome: "Vitamina C", emoji: "🍊" }, { nome: "Vitamina D", emoji: "☀️" },
      { nome: "Multivitaminas", emoji: "💊" }, { nome: "Magnésio", emoji: "💊" },
      { nome: "Probióticos", emoji: "🫙" }, { nome: "Ómega 3", emoji: "🐟" },
      { nome: "Protetor solar", emoji: "☀️" }, { nome: "Pensos rápidos", emoji: "🩹" },
      { nome: "Álcool etílico", emoji: "💧" }, { nome: "Água oxigenada", emoji: "💧" },
    ],
  },
};

function lerItens() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function guardarItens(itens) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(itens)); } catch {}
}

export default function SecaoListaCompras() {
  const [itens, setItens]       = useState(lerItens);
  const [modo, setModo]         = useState("lista"); // "lista" | "adicionar"
  const [catAtiva, setCatAtiva] = useState("Frutas");
  const [busca, setBusca]       = useState("");
  const [inputCustom, setInputCustom] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { guardarItens(itens); }, [itens]);

  const pendentes = itens.filter(i => !i.feito);
  const feitos    = itens.filter(i => i.feito);
  const progresso = itens.length ? (feitos.length / itens.length) * 100 : 0;

  function adicionarItem(nome, emoji = "🛒", cat = "") {
    setItens(prev => {
      const existe = prev.find(i => i.nome.toLowerCase() === nome.toLowerCase() && !i.feito);
      if (existe) {
        return prev.map(i => i.id === existe.id ? { ...i, qty: (i.qty || 1) + 1 } : i);
      }
      return [{ id: Date.now() + Math.random(), nome, emoji, categoria: cat, qty: 1, feito: false }, ...prev];
    });
  }

  function adicionarCustom() {
    const nome = inputCustom.trim();
    if (!nome) return;
    adicionarItem(nome);
    setInputCustom("");
    inputRef.current?.focus();
  }

  function marcar(id) {
    setItens(prev => prev.map(i => i.id === id ? { ...i, feito: !i.feito } : i));
  }

  function remover(id) {
    setItens(prev => prev.filter(i => i.id !== id));
  }

  function alterarQty(id, delta) {
    setItens(prev => prev.map(i => {
      if (i.id !== id) return i;
      const nova = Math.max(1, (i.qty || 1) + delta);
      return { ...i, qty: nova };
    }));
  }

  function limparFeitos() {
    setItens(prev => prev.filter(i => !i.feito));
  }

  // Busca cross-category
  const todasItems = Object.entries(CATS).flatMap(([cat, c]) =>
    c.items.map(it => ({ ...it, cat }))
  );
  const resultadosBusca = busca.length > 1
    ? todasItems.filter(it => it.nome.toLowerCase().includes(busca.toLowerCase()))
    : [];

  if (modo === "adicionar") {
    const catCfg = CATS[catAtiva];
    return (
      <div className="pb-28 no-scrollbar">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 mb-3">
          <button onClick={() => { setModo("lista"); setBusca(""); }} className="press w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <ChevronLeft size={18} className="text-slate-500" />
          </button>
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Pesquisar artigo…"
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400"
            />
          </div>
        </div>

        {/* ── Mini-lista: sempre visível enquanto adiciona ── */}
        {pendentes.length > 0 && (
          <div className="px-4 mb-3">
            <div className="rounded-2xl border border-violet-100 overflow-hidden" style={{ background: "#f5f3ff" }}>
              <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-1.5">
                  <ShoppingCart size={10} /> Na lista ({pendentes.length})
                </p>
                <button onClick={() => setModo("lista")} className="press text-[10px] font-black text-violet-500">
                  Ver tudo →
                </button>
              </div>
              <div className="flex gap-2 px-3 pb-3 overflow-x-auto no-scrollbar">
                {pendentes.map(it => {
                  const catC = it.categoria ? CATS[it.categoria] : null;
                  return (
                    <div
                      key={it.id}
                      className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border"
                      style={{
                        background: catC ? catC.bg : "#fff",
                        borderColor: catC ? catC.cor + "44" : "#e2e8f0",
                      }}
                    >
                      <span className="text-base leading-none">{it.emoji || "🛒"}</span>
                      <span className="text-[11px] font-black text-slate-700 max-w-[64px] truncate">{it.nome}</span>
                      {it.qty > 1 && (
                        <span className="text-[9px] font-black text-white px-1 py-0.5 rounded-full" style={{ background: catC?.cor || "#7c3aed" }}>
                          ×{it.qty}
                        </span>
                      )}
                      <button onClick={() => remover(it.id)} className="press w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <X size={8} className="text-slate-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Custom input */}
        <div className="px-4 mb-4 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputCustom}
            onChange={e => setInputCustom(e.target.value)}
            onKeyDown={e => e.key === "Enter" && adicionarCustom()}
            placeholder="Outro artigo (escrever)…"
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-violet-400"
          />
          <button onClick={adicionarCustom} className="press w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Resultados de busca */}
        {busca.length > 1 ? (
          <div className="px-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{resultadosBusca.length} resultado{resultadosBusca.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-3 gap-2.5">
              {resultadosBusca.map(it => {
                const na = itens.find(i => i.nome === it.nome && !i.feito);
                const cfg = CATS[it.cat];
                return (
                  <button key={it.nome + it.cat} onClick={() => adicionarItem(it.nome, it.emoji, it.cat)}
                    className="press card p-3 flex flex-col items-center gap-1.5 relative"
                    style={{ borderColor: na ? cfg.cor + "66" : undefined, background: na ? cfg.bg : undefined }}
                  >
                    <span className="text-2xl leading-none">{it.emoji}</span>
                    <p className="text-[10px] font-black text-slate-700 text-center leading-tight">{it.nome}</p>
                    {na && <span className="text-[9px] font-black text-white px-1.5 py-0.5 rounded-full" style={{ background: cfg.cor }}>{na.qty}×</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Category pills */}
            <div className="px-4 mb-3 flex gap-2 overflow-x-auto no-scrollbar">
              {Object.entries(CATS).map(([nome, cfg]) => (
                <button
                  key={nome}
                  onClick={() => setCatAtiva(nome)}
                  className={`press flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${catAtiva === nome ? "text-white" : "bg-white text-slate-500 border border-slate-100"}`}
                  style={catAtiva === nome ? { background: cfg.cor } : {}}
                >
                  {cfg.emoji} {nome}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="px-4 grid grid-cols-3 gap-2.5">
              {catCfg.items.map(it => {
                const naLista = itens.find(i => i.nome === it.nome && !i.feito);
                return (
                  <button
                    key={it.nome}
                    onClick={() => adicionarItem(it.nome, it.emoji, catAtiva)}
                    className="press card p-3.5 flex flex-col items-center gap-1.5 relative"
                    style={{
                      borderColor: naLista ? catCfg.cor + "66" : undefined,
                      background: naLista ? catCfg.bg : undefined,
                    }}
                  >
                    <span className="text-3xl leading-none">{it.emoji}</span>
                    <p className="text-[11px] font-black text-slate-700 text-center leading-tight">{it.nome}</p>
                    {naLista && (
                      <span className="text-[9px] font-black text-white px-1.5 py-0.5 rounded-full" style={{ background: catCfg.cor }}>
                        {naLista.qty}×
                      </span>
                    )}
                    {!naLista && (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center">
                        <Plus size={10} className="text-slate-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── MODO LISTA ──
  return (
    <div className="pb-28 no-scrollbar">

      {/* Hero */}
      <div className="mx-4 mb-4 rounded-3xl p-5 relative overflow-hidden anim-up"
        style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed,#a855f7)", boxShadow: "0 20px 50px -15px rgba(124,58,237,0.45)" }}>
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1.5 mb-2">
          <ShoppingCart size={11} /> Lista de compras
        </p>
        <div className="flex items-end gap-3 mb-3">
          <span className="text-5xl font-black text-white leading-none">{pendentes.length}</span>
          <p className="text-white/70 text-sm font-bold pb-1">{pendentes.length === 1 ? "artigo por comprar" : "artigos por comprar"}</p>
        </div>
        {itens.length > 0 && (
          <>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
            </div>
            <p className="text-[10px] text-white/50 mt-1.5">{feitos.length} de {itens.length} comprados</p>
          </>
        )}
      </div>

      {/* Botão adicionar */}
      <div className="px-4 mb-4 anim-up anim-up-1">
        <button
          onClick={() => setModo("adicionar")}
          className="press w-full py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 8px 20px -8px rgba(124,58,237,0.4)" }}
        >
          <Plus size={18} /> Adicionar artigos
        </button>
      </div>

      {/* Empty state */}
      {itens.length === 0 && (
        <div className="mx-4 card p-10 flex flex-col items-center text-center anim-up anim-up-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg,#ede9fe,#f3e8ff)" }}>
            <ShoppingCart size={28} className="text-violet-300" />
          </div>
          <p className="text-sm font-black text-slate-600 mb-1">Lista vazia</p>
          <p className="text-[12px] text-slate-400">Toca em "Adicionar artigos" para começar</p>
        </div>
      )}

      {/* Pendentes — grelha */}
      {pendentes.length > 0 && (
        <div className="px-4 mb-4 anim-up anim-up-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Por comprar ({pendentes.length})</p>
          <div className="grid grid-cols-3 gap-2.5">
            {pendentes.map(it => {
              const catCfg = it.categoria ? CATS[it.categoria] : null;
              return (
                <div key={it.id} className="relative">
                  <button
                    onClick={() => marcar(it.id)}
                    className="press card w-full p-3.5 flex flex-col items-center gap-1.5"
                    style={catCfg ? { background: catCfg.bg, borderColor: catCfg.cor + "33" } : {}}
                  >
                    <span className="text-3xl leading-none">{it.emoji || "🛒"}</span>
                    <p className="text-[11px] font-black text-slate-800 text-center leading-tight">{it.nome}</p>
                    {it.qty > 1 && (
                      <span className="text-[9px] font-black text-white px-1.5 py-0.5 rounded-full"
                        style={{ background: catCfg?.cor || "#7c3aed" }}>
                        {it.qty}×
                      </span>
                    )}
                  </button>
                  {/* Controles de quantidade */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white rounded-full shadow-md border border-slate-100 px-1 py-0.5 opacity-0 group-hover:opacity-100">
                    <button onClick={() => alterarQty(it.id, -1)} className="press w-5 h-5 rounded-full flex items-center justify-center text-slate-500">
                      <Minus size={9} />
                    </button>
                    <span className="text-[10px] font-black text-slate-600 w-4 text-center">{it.qty || 1}</span>
                    <button onClick={() => alterarQty(it.id, 1)} className="press w-5 h-5 rounded-full flex items-center justify-center text-slate-500">
                      <Plus size={9} />
                    </button>
                  </div>
                  <button
                    onClick={() => remover(it.id)}
                    className="press absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-400 flex items-center justify-center shadow-sm"
                  >
                    <X size={9} className="text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feitos */}
      {feitos.length > 0 && (
        <div className="px-4 anim-up anim-up-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comprados ({feitos.length})</p>
            <button onClick={limparFeitos} className="press text-[11px] font-bold text-red-400">Limpar tudo</button>
          </div>
          <div className="grid grid-cols-3 gap-2.5 opacity-40">
            {feitos.map(it => (
              <button key={it.id} onClick={() => marcar(it.id)}
                className="press card p-3.5 flex flex-col items-center gap-1.5 relative">
                <span className="text-3xl leading-none grayscale">{it.emoji || "🛒"}</span>
                <p className="text-[11px] font-black text-slate-500 text-center leading-tight line-through">{it.nome}</p>
                <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check size={11} className="text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
