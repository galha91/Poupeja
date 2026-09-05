import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, X, Check, Search, ChevronLeft, Minus, Share2, Link } from "lucide-react";

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
      { nome: "Pêssegos", emoji: "🍑" }, { nome: "Ameixas", emoji: "" },
      { nome: "Melancia", emoji: "🍉" }, { nome: "Figos", emoji: "" },
      { nome: "Framboesas", emoji: "" }, { nome: "Mirtilos", emoji: "🫐" },
      { nome: "Tangerinas", emoji: "🍊" }, { nome: "Amoras", emoji: "" },
      { nome: "Toranja", emoji: "🍊" }, { nome: "Papaia", emoji: "" },
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
      { nome: "Beringela", emoji: "🍆" }, { nome: "Malagueta", emoji: "🌶️" },
      { nome: "Beterraba", emoji: "" }, { nome: "Nabo", emoji: "" },
      { nome: "Ervilhas", emoji: "🫛" }, { nome: "Feijão verde", emoji: "🫛" },
      { nome: "Milho", emoji: "🌽" }, { nome: "Courgette", emoji: "🥒" },
      { nome: "Salsa", emoji: "🌿" }, { nome: "Coentros", emoji: "🌿" },
      { nome: "Hortelã", emoji: "🌿" }, { nome: "Louro", emoji: "🌿" },
      { nome: "Cebola roxa", emoji: "🧅" }, { nome: "Alho francês", emoji: "🥬" },
      { nome: "Aipo", emoji: "🥬" }, { nome: "Grelos", emoji: "🥬" },
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
      { nome: "Mozarela", emoji: "🧀" }, { nome: "Queijo para barrar", emoji: "🧀" },
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
      { nome: "Cordeiro", emoji: "🍖" }, { nome: "Vitela", emoji: "🥩" },
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
      { nome: "Milho (lata)", emoji: "🌽" }, { nome: "Pickles", emoji: "🥒" },
    ],
  },
  "Bebidas": {
    emoji: "🧃", cor: "#7c3aed", bg: "#f5f3ff",
    items: [
      { nome: "Água natural", emoji: "💧" }, { nome: "Água com gás", emoji: "💧" },
      { nome: "Sumo de laranja", emoji: "🍊" }, { nome: "Sumo de fruta", emoji: "🧃" },
      { nome: "Refrigerante cola", emoji: "🥤" }, { nome: "Refrigerante limão", emoji: "🥤" },
      { nome: "Cerveja", emoji: "🍺" }, { nome: "Vinho tinto", emoji: "🍷" },
      { nome: "Vinho branco", emoji: "🥂" }, { nome: "Vinho verde", emoji: "🍷" },
      { nome: "Espumante", emoji: "🍾" }, { nome: "Sumo de maçã", emoji: "🍎" },
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
      { nome: "Panquecas", emoji: "🥞" }, { nome: "Tortilhas", emoji: "🫓" },
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
      { nome: "Pensos higiénicos", emoji: "🩸" }, { nome: "Tampões", emoji: "🩸" },
      { nome: "Algodão", emoji: "🌱" }, { nome: "Lâminas barbear", emoji: "🪒" },
      { nome: "Espuma de barbear", emoji: "🪒" }, { nome: "Perfume", emoji: "🌺" },
      { nome: "Cotonetes", emoji: "🌱" }, { nome: "Papel higiénico húmido", emoji: "🧻" },
      { nome: "Champô seco", emoji: "🧴" }, { nome: "Creme de mãos", emoji: "🧴" },
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
      { nome: "Pensos rápidos", emoji: "🩹" }, { nome: "Termómetro", emoji: "🌡️" },
      { nome: "Álcool etílico", emoji: "💧" }, { nome: "Água oxigenada", emoji: "💧" },
    ],
  },
};

// Mostra o emoji quando existe; caso contrário, um círculo com a inicial
// e a cor da categoria (evita emojis enganadores em produtos sem emoji próprio).
function IconeArtigo({ emoji, nome, cor = "#0b6b4f", size = 30, className = "" }) {
  if (emoji) return <span className={`leading-none ${className}`} style={{ fontSize: size }}>{emoji}</span>;
  const inicial = (nome || "?").trim().charAt(0).toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-display font-semibold ${className}`}
      style={{ width: size, height: size, background: "var(--pj-subtle)", color: "var(--pj-brand-ink)", fontSize: Math.round(size * 0.46) }}
    >
      {inicial}
    </span>
  );
}

function lerItens() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function guardarItens(itens) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(itens)); } catch {}
}

const LS_SHARE_KEY = "poupeja_lista_partilhada_id";

function gerarShareId() { return Math.random().toString(36).slice(2, 10); }

export default function SecaoListaCompras() {
  const [itens, setItens]       = useState(lerItens);
  const [modo, setModo]         = useState("lista"); // "lista" | "adicionar"
  const [catAtiva, setCatAtiva] = useState("Frutas");
  const [busca, setBusca]       = useState("");
  const [inputCustom, setInputCustom] = useState("");
  const [listaId, setListaId]   = useState(() => {
    try { return localStorage.getItem(LS_SHARE_KEY) || null; } catch { return null; }
  });
  const [copiado, setCopiado]   = useState(false);
  const [criandoLink, setCriandoLink] = useState(false);
  const inputRef       = useRef(null);
  const ultimoPull     = useRef(null);   // JSON do último estado vindo do servidor
  const primeiraRender = useRef(true);
  const pushTimer      = useRef(null);

  function push(novosItens, id) {
    if (!id) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/lista-partilhada/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itens: novosItens }),
        });
      } catch {}
    }, 800);
  }

  async function pull(id) {
    if (!id) return;
    try {
      const r = await fetch(`/api/lista-partilhada/${id}`);
      if (!r.ok) return;
      const data = await r.json();
      if (Array.isArray(data.itens)) {
        ultimoPull.current = JSON.stringify(data.itens);
        setItens(data.itens);
      }
    } catch {}
  }

  // Pull inicial quando há lista partilhada
  useEffect(() => { if (listaId) pull(listaId); }, []);

  // Poll a cada 15s para apanhar mudanças de outros membros
  useEffect(() => {
    if (!listaId) return;
    const t = setInterval(() => pull(listaId), 15000);
    return () => clearInterval(t);
  }, [listaId]);

  useEffect(() => {
    guardarItens(itens);
    // Não enviar no primeiro render (evita sobrepor o servidor com o estado
    // local antigo antes do pull inicial). Depois, só envia se for uma edição
    // real — ou seja, se o estado diferir do último recebido do servidor.
    if (primeiraRender.current) { primeiraRender.current = false; return; }
    if (listaId && JSON.stringify(itens) !== ultimoPull.current) push(itens, listaId);
  }, [itens]);

  // Abre o menu de partilha nativo do telemóvel (WhatsApp, Mensagens…).
  // Se não houver partilha nativa (ex: desktop), copia o link.
  async function abrirPartilha(url) {
    // O url é passado em separado; não o repetir no texto (senão aparece duplicado).
    const texto = "🛒 A nossa lista de compras no PoupeJá — abre e edita comigo:";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Lista de compras — PoupeJá", text: texto, url });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return; // utilizador fechou o menu
      }
    }
    try { await navigator.clipboard.writeText(url); } catch {}
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  }

  async function partilhar() {
    setCriandoLink(true);
    const id = listaId || gerarShareId();
    try {
      const r = await fetch(`/api/lista-partilhada/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens }),
      });
      if (!r.ok) throw new Error();
      localStorage.setItem(LS_SHARE_KEY, id);
      setListaId(id);
      await abrirPartilha(`${window.location.origin}/lista/${id}`);
    } catch { alert("Erro ao criar link. Tenta novamente."); }
    finally { setCriandoLink(false); }
  }

  function pararPartilha() {
    localStorage.removeItem(LS_SHARE_KEY);
    setListaId(null);
  }

  async function copiarLink() {
    await abrirPartilha(`${window.location.origin}/lista/${listaId}`);
  }

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
        <div className="flex items-center gap-3 px-4 mb-4 pt-1">
          <button onClick={() => { setModo("lista"); setBusca(""); }} className="pj-tap press w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }}>
            <ChevronLeft size={18} style={{ color: "var(--pj-text-muted)" }} />
          </button>
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--pj-text-faint)" }} />
            <input
              autoFocus
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Pesquisar artigo…"
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-sm font-medium focus:outline-none"
              style={{ border: "1px solid var(--pj-border)", background: "var(--pj-card)", color: "var(--pj-text)" }}
            />
          </div>
        </div>

        {/* ── Mini-lista: sempre visível enquanto adiciona ── */}
        {pendentes.length > 0 && (
          <div className="px-4 mb-4">
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
              <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                <p className="flex items-center gap-1.5" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>
                  <ShoppingCart size={11} style={{ color: "var(--pj-brand-ink)" }} /> Na lista ({pendentes.length})
                </p>
                <button onClick={() => setModo("lista")} className="pj-tap press" style={{ fontSize: "11px", fontWeight: 600, color: "var(--pj-brand-ink)" }}>
                  Ver tudo →
                </button>
              </div>
              <div className="flex gap-2 px-3 pb-3 overflow-x-auto no-scrollbar">
                {pendentes.map(it => {
                  const catC = it.categoria ? CATS[it.categoria] : null;
                  return (
                    <div
                      key={it.id}
                      className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                      style={{ background: "var(--pj-surface)", border: "1px solid var(--pj-border)" }}
                    >
                      <IconeArtigo emoji={it.emoji} nome={it.nome} cor={catC?.cor} size={16} />
                      <span className="text-[11px] font-semibold max-w-[64px] truncate" style={{ color: "var(--pj-text)" }}>{it.nome}</span>
                      {it.qty > 1 && (
                        <span className="text-[9px] font-semibold px-1 py-0.5 rounded-full" style={{ background: "var(--pj-subtle)", color: "var(--pj-brand-ink)" }}>
                          ×{it.qty}
                        </span>
                      )}
                      <button onClick={() => remover(it.id)} className="pj-tap press w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--pj-subtle)" }}>
                        <X size={8} style={{ color: "var(--pj-text-muted)" }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Custom input */}
        <div className="px-4 mb-5 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputCustom}
            onChange={e => setInputCustom(e.target.value)}
            onKeyDown={e => e.key === "Enter" && adicionarCustom()}
            placeholder="Outro artigo (escrever)…"
            className="flex-1 px-4 py-3 rounded-2xl text-sm font-medium focus:outline-none"
            style={{ border: "1px solid var(--pj-border)", background: "var(--pj-card)", color: "var(--pj-text)" }}
          />
          <button onClick={adicionarCustom} className="pj-tap press w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center" style={{ background: "var(--pj-brand)" }}>
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Resultados de busca */}
        {busca.length > 1 ? (
          <div className="px-4">
            <p className="mb-3" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>{resultadosBusca.length} resultado{resultadosBusca.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5">
              {resultadosBusca.map(it => {
                const na = itens.find(i => i.nome === it.nome && !i.feito);
                const cfg = CATS[it.cat];
                return (
                  <button key={it.nome + it.cat} onClick={() => adicionarItem(it.nome, it.emoji, it.cat)}
                    className="pj-tap press p-3 flex flex-col items-center gap-1.5 relative rounded-2xl"
                    style={{ border: "1px solid var(--pj-border)", background: na ? "var(--pj-subtle)" : "var(--pj-card)" }}
                  >
                    <IconeArtigo emoji={it.emoji} nome={it.nome} cor={CATS[it.cat]?.cor} size={24} />
                    <p className="text-[10px] font-semibold text-center leading-tight" style={{ color: "var(--pj-text)" }}>{it.nome}</p>
                    {na && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--pj-brand)", color: "#fff" }}>{na.qty}×</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Category pills */}
            <div className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
              {Object.entries(CATS).map(([nome, cfg]) => (
                <button
                  key={nome}
                  onClick={() => setCatAtiva(nome)}
                  className="pj-tap press flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={catAtiva === nome
                    ? { background: "var(--pj-brand)", color: "#fff" }
                    : { background: "var(--pj-card)", color: "var(--pj-text-muted)", border: "1px solid var(--pj-border)" }}
                >
                  {cfg.emoji} {nome}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="px-4 grid grid-cols-3 lg:grid-cols-6 gap-2.5">
              {catCfg.items.map(it => {
                const naLista = itens.find(i => i.nome === it.nome && !i.feito);
                return (
                  <button
                    key={it.nome}
                    onClick={() => adicionarItem(it.nome, it.emoji, catAtiva)}
                    className="pj-tap press p-3.5 flex flex-col items-center gap-1.5 relative rounded-2xl"
                    style={{ border: "1px solid var(--pj-border)", background: naLista ? "var(--pj-subtle)" : "var(--pj-card)" }}
                  >
                    <IconeArtigo emoji={it.emoji} nome={it.nome} cor={catCfg.cor} size={30} />
                    <p className="text-[11px] font-semibold text-center leading-tight" style={{ color: "var(--pj-text)" }}>{it.nome}</p>
                    {naLista && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--pj-brand)", color: "#fff" }}>
                        {naLista.qty}×
                      </span>
                    )}
                    {!naLista && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ border: "2px solid var(--pj-border)" }}>
                        <Plus size={10} style={{ color: "var(--pj-text-faint)" }} />
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

      {/* Header */}
      <div className="mx-4 mb-5 pt-2 anim-up">
        <p className="flex items-center gap-1.5 mb-2" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>
          <ShoppingCart size={11} style={{ color: "var(--pj-brand-ink)" }} /> Lista de compras
        </p>
        <div className="flex items-end gap-3 mb-4">
          <span className="font-display leading-none" style={{ fontSize: "48px", fontWeight: 600, color: "var(--pj-text)" }}>{pendentes.length}</span>
          <p className="text-sm font-medium pb-1.5" style={{ color: "var(--pj-text-muted)" }}>{pendentes.length === 1 ? "artigo por comprar" : "artigos por comprar"}</p>
        </div>
        {itens.length > 0 && (
          <>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--pj-subtle)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progresso}%`, background: "var(--pj-brand)" }} />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "var(--pj-text-faint)" }}>{feitos.length} de {itens.length} comprados</p>
          </>
        )}

        {/* Partilha */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {!listaId ? (
            <button
              onClick={partilhar}
              disabled={criandoLink}
              className="pj-tap press inline-flex items-center gap-1.5 text-[11px] font-semibold px-3.5 py-2 rounded-xl"
              style={{ background: "var(--pj-brand)", color: "#fff" }}
            >
              <Share2 size={13} /> {criandoLink ? "A criar…" : "Partilhar com a família"}
            </button>
          ) : (
            <>
              <button
                onClick={copiarLink}
                className="pj-tap press inline-flex items-center gap-1.5 text-[11px] font-semibold px-3.5 py-2 rounded-xl"
                style={{ background: "var(--pj-brand)", color: "#fff" }}
              >
                <Share2 size={13} /> {copiado ? "Copiado ✓" : "Partilhar"}
              </button>
              <button
                onClick={pararPartilha}
                className="pj-tap press inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-xl"
                style={{ background: "var(--pj-subtle)", color: "var(--pj-text-muted)", border: "1px solid var(--pj-border)" }}
              >
                <X size={12} /> Parar partilha
              </button>
            </>
          )}
        </div>
        {listaId && (
          <p className="text-[10px] mt-2 flex items-center gap-1.5" style={{ color: "var(--pj-text-faint)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: "var(--pj-brand)" }} />
            Lista partilhada — sincroniza automaticamente
          </p>
        )}
      </div>
      <div className="mx-4 mb-5" style={{ borderTop: "1px solid var(--pj-border)" }} />

      {/* Botão adicionar */}
      <div className="px-4 mb-5 anim-up anim-up-1">
        <button
          onClick={() => setModo("adicionar")}
          className="pj-tap press w-full py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
          style={{ background: "var(--pj-brand)" }}
        >
          <Plus size={18} /> Adicionar artigos
        </button>
      </div>

      {/* Empty state */}
      {itens.length === 0 && (
        <div className="mx-4 p-10 flex flex-col items-center text-center anim-up anim-up-2 rounded-2xl" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--pj-subtle)" }}>
            <ShoppingCart size={28} style={{ color: "var(--pj-brand-ink)" }} />
          </div>
          <p className="font-display text-sm font-semibold mb-1" style={{ color: "var(--pj-text)" }}>Lista vazia</p>
          <p className="text-[12px]" style={{ color: "var(--pj-text-faint)" }}>Toca em "Adicionar artigos" para começar</p>
        </div>
      )}

      {/* Pendentes — grelha */}
      {pendentes.length > 0 && (
        <div className="px-4 mb-5 anim-up anim-up-2">
          <p className="mb-3" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Por comprar ({pendentes.length})</p>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5">
            {pendentes.map(it => {
              const catCfg = it.categoria ? CATS[it.categoria] : null;
              return (
                <div key={it.id} className="relative">
                  <button
                    onClick={() => marcar(it.id)}
                    className="pj-tap press w-full p-3.5 flex flex-col items-center gap-1.5 rounded-2xl"
                    style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)" }}
                  >
                    <IconeArtigo emoji={it.emoji} nome={it.nome} cor={catCfg?.cor} size={30} />
                    <p className="text-[11px] font-semibold text-center leading-tight" style={{ color: "var(--pj-text)" }}>{it.nome}</p>
                    {it.qty > 1 && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--pj-subtle)", color: "var(--pj-brand-ink)" }}>
                        {it.qty}×
                      </span>
                    )}
                  </button>
                  {/* Controles de quantidade */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full px-1 py-0.5 opacity-0 group-hover:opacity-100" style={{ background: "var(--pj-card)", border: "1px solid var(--pj-border)", boxShadow: "0 2px 8px -4px rgba(20,35,28,0.25)" }}>
                    <button onClick={() => alterarQty(it.id, -1)} className="pj-tap press w-5 h-5 rounded-full flex items-center justify-center" style={{ color: "var(--pj-text-muted)" }}>
                      <Minus size={9} />
                    </button>
                    <span className="text-[10px] font-semibold w-4 text-center" style={{ color: "var(--pj-text)" }}>{it.qty || 1}</span>
                    <button onClick={() => alterarQty(it.id, 1)} className="pj-tap press w-5 h-5 rounded-full flex items-center justify-center" style={{ color: "var(--pj-text-muted)" }}>
                      <Plus size={9} />
                    </button>
                  </div>
                  <button
                    onClick={() => remover(it.id)}
                    className="pj-tap press absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--pj-subtle)", border: "1px solid var(--pj-border)" }}
                  >
                    <X size={9} style={{ color: "var(--pj-text-muted)" }} />
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
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--pj-text-faint)" }}>Comprados ({feitos.length})</p>
            <button onClick={limparFeitos} className="pj-tap press text-[11px] font-semibold" style={{ color: "var(--pj-text-muted)" }}>Limpar tudo</button>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5" style={{ opacity: 0.55 }}>
            {feitos.map(it => (
              <button key={it.id} onClick={() => marcar(it.id)}
                className="pj-tap press p-3.5 flex flex-col items-center gap-1.5 relative rounded-2xl"
                style={{ background: "var(--pj-surface)", border: "1px solid var(--pj-subtle)" }}>
                <IconeArtigo emoji={it.emoji} nome={it.nome} cor={CATS[it.categoria]?.cor} size={30} className="grayscale" />
                <p className="text-[11px] font-medium text-center leading-tight line-through" style={{ color: "var(--pj-text-faint)" }}>{it.nome}</p>
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--pj-brand)" }}>
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
