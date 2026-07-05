import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { useSessao } from "../sessao.jsx";

export default function Verificar() {
  const [params] = useSearchParams();
  const { atualizar } = useSessao();
  const [estado, setEstado] = useState("a verificar…");

  useEffect(() => {
    const token = params.get("token");
    if (!token) return setEstado("Token em falta.");
    api("/auth/verificar", { method: "POST", body: { token } })
      .then(() => { setEstado("✅ Email confirmado! Boa colheita. 🍇"); atualizar(); })
      .catch((e) => setEstado(`❌ ${e.message}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center animate-aparecer">
      <p className="text-xl font-bold">{estado}</p>
      <Link to="/catalogo" className="botao-primario mt-6">Ir para o catálogo</Link>
    </div>
  );
}
