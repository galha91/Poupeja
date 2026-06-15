import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import { Users, ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2, Clock } from "lucide-react";

export default function Admin() {
  const router = useRouter();
  const [estado, setEstado] = useState("a-carregar"); // a-carregar | negado | ok | erro
  const [stats, setStats] = useState(null);
  const [erro, setErro] = useState("");

  async function carregar() {
    setEstado("a-carregar");
    setErro("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setEstado("negado");
      return;
    }
    try {
      const r = await fetch("/api/admin-stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (r.status === 403 || r.status === 401) {
        setEstado("negado");
        return;
      }
      const data = await r.json();
      if (!r.ok) {
        setErro(data.erro || "Erro a obter dados.");
        setEstado("erro");
        return;
      }
      setStats(data);
      setEstado("ok");
    } catch {
      setErro("Falha de ligação.");
      setEstado("erro");
    }
  }

  useEffect(() => { carregar(); }, []);

  const fmtData = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("pt-PT", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Head>
        <title>PoupeJá · Administração</title>
      </Head>
      <div className="max-w-2xl mx-auto px-4 py-6">

        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-500 mb-5"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <ShieldCheck size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight">PoupeJá · Administração</h1>
            <p className="text-xs text-slate-400 font-medium">Painel privado · só tu vês isto</p>
          </div>
        </div>

        {estado === "a-carregar" && (
          <div className="text-center py-20 text-slate-400 text-sm font-semibold">
            A carregar…
          </div>
        )}

        {estado === "negado" && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={24} className="text-rose-500" />
            </div>
            <p className="font-black text-slate-800">Acesso restrito</p>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Esta página é só para o administrador. Inicia sessão com a conta de administração.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm"
            >
              Ir para a app
            </button>
          </div>
        )}

        {estado === "erro" && (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="font-bold text-rose-500">{erro}</p>
            <button
              onClick={carregar}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-sm"
            >
              <RefreshCw size={14} /> Tentar de novo
            </button>
          </div>
        )}

        {estado === "ok" && stats && (
          <>
            {/* Destaque: total de utilizadores */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg mb-4">
              <div className="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-wide">
                <Users size={14} /> Utilizadores registados
              </div>
              <div className="text-5xl font-black mt-2">{stats.total}</div>
              <div className="text-emerald-100 text-sm font-medium mt-1">
                {stats.confirmados} com email confirmado
              </div>
            </div>

            {/* Cartões de períodos */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <Cartao rotulo="Hoje" valor={stats.hoje} />
              <Cartao rotulo="7 dias" valor={stats.ultimos7} />
              <Cartao rotulo="30 dias" valor={stats.ultimos30} />
            </div>

            {/* Botão atualizar */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black text-slate-700">Registos recentes</h2>
              <button
                onClick={carregar}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600"
              >
                <RefreshCw size={13} /> Atualizar
              </button>
            </div>

            {/* Lista de recentes */}
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
              {stats.recentes.map((u, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-slate-500">
                      {(u.email || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{u.email}</p>
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock size={10} /> {fmtData(u.criado)}
                    </p>
                  </div>
                  {u.confirmado && (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  )}
                </div>
              ))}
              {stats.recentes.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400 font-medium">
                  Ainda não há registos.
                </div>
              )}
            </div>

            <p className="text-center text-[11px] text-slate-300 font-medium mt-4">
              Atualizado às {fmtData(stats.atualizadoEm)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Cartao({ rotulo, valor }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
      <div className="text-2xl font-black text-slate-800">{valor}</div>
      <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{rotulo}</div>
    </div>
  );
}
