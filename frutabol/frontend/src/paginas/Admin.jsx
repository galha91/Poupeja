// Painel de administração: dashboard, personagens (CRUD + upload),
// leilões, packs de moedas e bónus configuráveis.
import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useSessao } from "../sessao.jsx";
import { Moedas, Erro } from "../componentes.jsx";

export default function Admin() {
  const { user } = useSessao();
  const [aba, setAba] = useState("dashboard");
  if (!user || user.papel !== "ADMIN") return <p className="text-center py-24 opacity-60">Sem permissões.</p>;

  const abas = [["dashboard", "📊 Dashboard"], ["personagens", "🍇 Personagens"], ["leiloes", "🔨 Leilões"], ["packs", "🧺 Packs"], ["config", "⚙️ Bónus"]];
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-aparecer">
      <h1 className="font-display font-bold text-3xl mb-6">Admin</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {abas.map(([id, rotulo]) => (
          <button key={id} onClick={() => setAba(id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold ${aba === id ? "bg-amber-400 text-stone-900" : "border border-stone-300 dark:border-white/15"}`}>
            {rotulo}
          </button>
        ))}
      </div>
      {aba === "dashboard" && <Dashboard />}
      {aba === "personagens" && <Personagens />}
      {aba === "leiloes" && <Leiloes />}
      {aba === "packs" && <Packs />}
      {aba === "config" && <Config />}
    </div>
  );
}

function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api("/admin/dashboard").then(setD).catch(() => {}); }, []);
  if (!d) return null;
  const cartoes = [
    ["Utilizadores", d.utilizadores], ["Moedas em circulação", `${d.moedasEmCirculacao} 🪙`],
    ["Leilões ativos", d.leiloesAtivos], ["Itens vendidos", d.itensVendidos],
    ["Moedas gastas em itens", `${d.moedasGastasEmItens} 🪙`],
    ["Receita (fase 2)", `${(d.receitaCents / 100).toFixed(2)} €`],
  ];
  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cartoes.map(([r, v]) => (
          <div key={r} className="carta p-4">
            <div className="text-xs uppercase opacity-60">{r}</div>
            <div className="text-2xl font-display font-extrabold">{v}</div>
          </div>
        ))}
      </div>
      <h3 className="font-bold mt-6 mb-2">Top compradores</h3>
      <div className="carta divide-y divide-stone-200 dark:divide-white/5">
        {d.topCompradores.map((c) => (
          <div key={c.nome} className="flex justify-between px-4 py-2 text-sm">
            <span>{c.nome}</span><Moedas n={c.moedasGastas} />
          </div>
        ))}
        {d.topCompradores.length === 0 && <p className="px-4 py-3 text-sm opacity-50">Sem compras ainda.</p>}
      </div>
    </div>
  );
}

function Personagens() {
  const [lista, setLista] = useState([]);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({ nome: "", clube: "", descricao: "", estilo: "", raridade: "COMUM", tiragem: 50 });
  const [ficheiro, setFicheiro] = useState(null);

  const carregar = () => api("/admin/personagens").then((r) => setLista(r.personagens)).catch(() => {});
  useEffect(() => { carregar(); }, []);

  async function criar(e) {
    e.preventDefault();
    setErro("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (ficheiro) fd.append("imagem", ficheiro);
      await api("/admin/personagens", { method: "POST", body: fd });
      setForm({ nome: "", clube: "", descricao: "", estilo: "", raridade: "COMUM", tiragem: 50 });
      setFicheiro(null);
      carregar();
    } catch (e2) {
      setErro(e2.message + (e2.detalhes ? ` — ${e2.detalhes.join("; ")}` : ""));
    }
  }

  const campo = (k) => ({ value: form[k], onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={criar} className="carta p-5 space-y-3">
        <h3 className="font-bold">Nova personagem (100% fictícia!)</h3>
        <input {...campo("nome")} placeholder="Nome inventado (ex.: Figueirôncio)" className="campo" required />
        <input {...campo("clube")} placeholder="Clube fictício (ex.: FC Pomar)" className="campo" required />
        <textarea {...campo("descricao")} placeholder="Descrição" className="campo" rows={3} required />
        <input {...campo("estilo")} placeholder="Estilo de jogo" className="campo" required />
        <div className="flex gap-2">
          <select {...campo("raridade")} className="campo">
            {["COMUM", "RARO", "EPICO", "LENDARIO"].map((r) => <option key={r}>{r}</option>)}
          </select>
          <input {...campo("tiragem")} type="number" min="1" className="campo" title="Tiragem (edições)" />
        </div>
        <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={(e) => setFicheiro(e.target.files[0])} className="campo" required />
        <Erro mensagem={erro} />
        <button className="botao-primario w-full">Criar</button>
      </form>
      <div className="space-y-2">
        {lista.map((p) => (
          <div key={p.id} className="carta px-4 py-2 flex justify-between items-center text-sm">
            <span><b>{p.nome}</b> · {p.clube} · {p.raridade}</span>
            <span className="opacity-60">{p._count.edicoes}/{p.tiragem} ed.</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Leiloes() {
  const [personagens, setPersonagens] = useState([]);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [form, setForm] = useState({ characterId: "", precoInicial: 100, incrementoMinimo: 5, compraImediata: "", duracaoMin: 1440, inicio: "" });

  useEffect(() => { api("/admin/personagens").then((r) => setPersonagens(r.personagens)).catch(() => {}); }, []);

  async function criar(e) {
    e.preventDefault();
    setErro(""); setOk("");
    try {
      await api("/admin/leiloes", {
        method: "POST",
        body: {
          characterId: form.characterId,
          precoInicial: Number(form.precoInicial),
          incrementoMinimo: Number(form.incrementoMinimo),
          compraImediata: form.compraImediata ? Number(form.compraImediata) : null,
          duracaoMin: Number(form.duracaoMin),
          ...(form.inicio && { inicio: new Date(form.inicio).toISOString() }),
        },
      });
      setOk("Leilão criado! 🔨");
    } catch (e2) {
      setErro(e2.message + (e2.detalhes ? ` — ${e2.detalhes.join("; ")}` : ""));
    }
  }

  const campo = (k) => ({ value: form[k], onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  return (
    <form onSubmit={criar} className="carta p-5 space-y-3 max-w-lg">
      <h3 className="font-bold">Criar / agendar leilão</h3>
      <select {...campo("characterId")} className="campo" required>
        <option value="">— personagem —</option>
        {personagens.map((p) => <option key={p.id} value={p.id}>{p.nome} ({p._count.edicoes}/{p.tiragem})</option>)}
      </select>
      <label className="block text-xs opacity-60">Preço inicial / incremento mínimo / compra imediata (opcional)</label>
      <div className="flex gap-2">
        <input {...campo("precoInicial")} type="number" min="1" className="campo" required />
        <input {...campo("incrementoMinimo")} type="number" min="1" className="campo" required />
        <input {...campo("compraImediata")} type="number" min="1" className="campo" placeholder="—" />
      </div>
      <label className="block text-xs opacity-60">Duração (minutos) e início (vazio = já)</label>
      <div className="flex gap-2">
        <input {...campo("duracaoMin")} type="number" min="1" className="campo" required />
        <input {...campo("inicio")} type="datetime-local" className="campo" />
      </div>
      <Erro mensagem={erro} />
      {ok && <p className="text-emerald-400 font-bold text-sm">{ok}</p>}
      <button className="botao-primario w-full">Criar leilão</button>
    </form>
  );
}

function Packs() {
  const [packs, setPacks] = useState([]);
  const [form, setForm] = useState({ nome: "", moedas: 100, precoCents: 499, lsVariantId: "" });
  const [erro, setErro] = useState("");
  const carregar = () => api("/admin/packs").then((r) => setPacks(r.packs)).catch(() => {});
  useEffect(() => { carregar(); }, []);

  async function criar(e) {
    e.preventDefault();
    setErro("");
    try {
      await api("/admin/packs", {
        method: "POST",
        body: { nome: form.nome, moedas: Number(form.moedas), precoCents: Number(form.precoCents), lsVariantId: form.lsVariantId || null },
      });
      carregar();
    } catch (e2) { setErro(e2.message); }
  }
  const campo = (k) => ({ value: form[k], onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={criar} className="carta p-5 space-y-3">
        <h3 className="font-bold">Novo pack (fase 2)</h3>
        <input {...campo("nome")} placeholder="Nome" className="campo" required />
        <div className="flex gap-2">
          <input {...campo("moedas")} type="number" min="1" className="campo" title="Moedas" />
          <input {...campo("precoCents")} type="number" min="1" className="campo" title="Preço em cêntimos (499 = 4,99€)" />
        </div>
        <input {...campo("lsVariantId")} placeholder="Lemon Squeezy variant ID" className="campo" />
        <Erro mensagem={erro} />
        <button className="botao-primario w-full">Criar pack</button>
      </form>
      <div className="space-y-2">
        {packs.map((p) => (
          <div key={p.id} className="carta px-4 py-2 flex justify-between text-sm">
            <span><b>{p.nome}</b> · {p.moedas} 🪙 · {(p.precoCents / 100).toFixed(2)} €</span>
            <span className="opacity-60">{p.ativo ? "ativo" : "inativo"} {p.lsVariantId ? "· LS ✓" : "· sem LS"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Config() {
  const [config, setConfig] = useState({ BONUS_REGISTO: 500, BONUS_DIARIO: 50, BONUS_REFERRAL: 200 });
  const [ok, setOk] = useState("");
  useEffect(() => {
    api("/admin/config").then((r) => setConfig((c) => ({ ...c, ...r.config }))).catch(() => {});
  }, []);

  async function guardar(e) {
    e.preventDefault();
    await api("/admin/config", {
      method: "PUT",
      body: Object.fromEntries(Object.entries(config).map(([k, v]) => [k, Number(v)])),
    });
    setOk("Guardado ✓");
  }

  return (
    <form onSubmit={guardar} className="carta p-5 space-y-3 max-w-sm">
      <h3 className="font-bold">Bónus de moedas</h3>
      {Object.keys(config).map((k) => (
        <label key={k} className="block text-sm">
          <span className="opacity-60 text-xs">{k}</span>
          <input type="number" min="0" value={config[k]}
            onChange={(e) => setConfig((c) => ({ ...c, [k]: e.target.value }))} className="campo" />
        </label>
      ))}
      {ok && <p className="text-emerald-400 text-sm font-bold">{ok}</p>}
      <button className="botao-primario w-full">Guardar</button>
    </form>
  );
}
