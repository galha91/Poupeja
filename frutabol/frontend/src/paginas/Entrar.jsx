import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { useIdioma } from "../i18n.jsx";
import { useSessao } from "../sessao.jsx";
import { Erro } from "../componentes.jsx";

export default function Entrar() {
  const { t } = useIdioma();
  const { setUser } = useSessao();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const [modo, setModo] = useState("entrar");
  const [form, setForm] = useState({
    email: "", password: "", nome: "", codigoReferral: params.get("convite") || "",
  });
  const [erro, setErro] = useState("");
  const [detalhes, setDetalhes] = useState([]);
  const [aEnviar, setAEnviar] = useState(false);

  const campo = (chave) => ({
    value: form[chave],
    onChange: (e) => setForm((f) => ({ ...f, [chave]: e.target.value })),
  });

  async function submeter(e) {
    e.preventDefault();
    setErro(""); setDetalhes([]); setAEnviar(true);
    try {
      const corpo = modo === "entrar"
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, nome: form.nome, ...(form.codigoReferral && { codigoReferral: form.codigoReferral }) };
      const r = await api(`/auth/${modo === "entrar" ? "entrar" : "registo"}`, { method: "POST", body: corpo });
      setUser(r.user);
      navegar("/catalogo");
    } catch (e2) {
      setErro(e2.message);
      setDetalhes(e2.detalhes || []);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-aparecer">
      <div className="carta p-6">
        <div className="flex gap-2 mb-6">
          {["entrar", "registar"].map((m) => (
            <button key={m} onClick={() => setModo(m)}
              className={`flex-1 py-2 rounded-xl font-bold text-sm ${modo === m ? "bg-amber-400 text-stone-900" : "border border-stone-300 dark:border-white/15"}`}>
              {m === "entrar" ? t("entrar") : t("registar")}
            </button>
          ))}
        </div>

        <form onSubmit={submeter} className="space-y-3">
          {modo === "registar" && (
            <input {...campo("nome")} placeholder={t("nomeUtilizador")} className="campo" required minLength={3} />
          )}
          <input {...campo("email")} type="email" placeholder={t("email")} className="campo" required />
          <input {...campo("password")} type="password" placeholder={t("password")} className="campo" required minLength={modo === "registar" ? 8 : 1} />
          {modo === "registar" && (
            <input {...campo("codigoReferral")} placeholder={t("codigoReferralOpc")} className="campo" />
          )}
          <Erro mensagem={erro} />
          {detalhes.map((d) => <p key={d} className="text-xs text-red-400">{d}</p>)}
          <button disabled={aEnviar} className="botao-primario w-full">
            {modo === "entrar" ? t("entrar") : `${t("registar")} 🍌 +500`}
          </button>
        </form>

        <div className="mt-4">
          <a href={`${import.meta.env.VITE_API_URL || ""}/api/auth/google`} className="botao-fantasma w-full">
            {t("entrarGoogle")}
          </a>
        </div>
      </div>
    </div>
  );
}
