import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { PiggyBank, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { guardarAuth } from "../EcraAuth";

function lerUtilizadores() {
  try { return JSON.parse(localStorage.getItem("poupeja_users") || "[]"); } catch { return []; }
}
function guardarUtilizadores(lista) {
  try { localStorage.setItem("poupeja_users", JSON.stringify(lista)); } catch (_) {}
}

export default function Confirmar() {
  const router = useRouter();
  const [estado, setEstado] = useState("loading"); // loading | sucesso | erro
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    const { token } = router.query;
    if (!token) { setEstado("erro"); setMensagem("Link inválido."); return; }

    fetch(`/api/verificar-token?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.erro) { setEstado("erro"); setMensagem(data.erro); return; }

        const users = lerUtilizadores();
        if (!users.find(u => u.email === data.user.email)) {
          guardarUtilizadores([...users, data.user]);
        }
        guardarAuth({ nome: data.user.nome, email: data.user.email, criado: data.user.criado });
        setEstado("sucesso");
        setTimeout(() => router.replace("/"), 2500);
      })
      .catch(() => { setEstado("erro"); setMensagem("Erro de ligação. Tenta novamente."); });
  }, [router.isReady]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6"
         style={{ background: "linear-gradient(160deg,#064e3b 0%,#059669 55%,#34d399 100%)" }}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">

        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
             style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}>
          <PiggyBank size={30} className="text-white" />
        </div>

        {estado === "loading" && (
          <>
            <Loader size={36} className="text-emerald-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-black text-slate-800 mb-2">A verificar...</h2>
            <p className="text-sm text-slate-400">Aguarda um momento.</p>
          </>
        )}

        {estado === "sucesso" && (
          <>
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-800 mb-2">Conta confirmada!</h2>
            <p className="text-sm text-slate-400">A entrar na tua conta...</p>
          </>
        )}

        {estado === "erro" && (
          <>
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-800 mb-2">Link inválido</h2>
            <p className="text-sm text-slate-500 mb-6">{mensagem}</p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm"
              style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}
            >
              Voltar ao início
            </button>
          </>
        )}
      </div>
    </div>
  );
}
