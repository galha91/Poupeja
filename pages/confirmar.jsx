import { useEffect } from "react";
import { useRouter } from "next/router";
import { PiggyBank, Loader } from "lucide-react";

/*
 * Página legada de confirmação de conta.
 * A confirmação de email é agora feita pelo Supabase, cujo link
 * aponta directamente para a página inicial. Esta rota existe apenas
 * para emails antigos que ainda apontem para /confirmar.
 */
export default function Confirmar() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/"), 1500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6"
         style={{ background: "linear-gradient(160deg,var(--pj-brand) 0%,var(--pj-brand-ink) 55%,#7ec9ab 100%)" }}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
             style={{ background: "linear-gradient(135deg,var(--pj-brand),var(--pj-brand-ink))" }}>
          <PiggyBank size={30} className="text-white" />
        </div>
        <Loader size={28} className="text-emerald-500 animate-spin mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-600">A reencaminhar para o PoupeJá...</p>
      </div>
    </div>
  );
}
