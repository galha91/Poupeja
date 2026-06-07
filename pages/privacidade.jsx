import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useRouter } from "next/router";

const SECOES = [
  {
    titulo: "1. Quem somos",
    texto: "O PoupeJá é uma aplicação web de gestão financeira pessoal disponível em poupejá.com, desenvolvida para ajudar utilizadores em Portugal a controlar as suas despesas e poupar dinheiro.",
  },
  {
    titulo: "2. Que dados recolhemos",
    texto: "Quando crias uma conta, guardamos localmente no teu dispositivo:\n• Nome\n• Endereço de email\n• Password",
  },
  {
    titulo: "3. Onde ficam os dados",
    texto: "Todos os dados ficam guardados exclusivamente no teu dispositivo, através da tecnologia localStorage do browser. Nenhum dado é transmitido ou guardado em servidores externos. O PoupeJá não tem acesso aos teus dados.",
  },
  {
    titulo: "4. Como usamos os dados",
    texto: "Os dados são utilizados apenas para identificar a tua conta no teu dispositivo e personalizar a tua experiência na aplicação. Não são utilizados para fins comerciais, publicitários ou de análise.",
  },
  {
    titulo: "5. Partilha de dados",
    texto: "Não partilhamos, vendemos nem transmitimos nenhum dado pessoal a terceiros, uma vez que os dados nunca saem do teu dispositivo.",
  },
  {
    titulo: "6. Os teus direitos (RGPD)",
    texto: "Ao abrigo do Regulamento Geral sobre a Proteção de Dados (RGPD), tens direito a:\n• Aceder aos teus dados pessoais\n• Corrigir dados incorretos\n• Apagar todos os teus dados\n\nPara apagar a tua conta e todos os dados associados, vai a Definições → Sair da conta e, em seguida, limpa os dados do site nas definições do teu browser. Podes também limpar o localStorage diretamente.",
  },
  {
    titulo: "7. Segurança",
    texto: "Os teus dados ficam protegidos pelo próprio browser e pelo teu dispositivo. Recomendamos que não partilhes o teu dispositivo com terceiros sem bloquear o acesso.",
  },
  {
    titulo: "8. Cookies",
    texto: "O PoupeJá não utiliza cookies de rastreamento ou publicidade. Utilizamos apenas localStorage para guardar os dados da tua conta no teu dispositivo.",
  },
  {
    titulo: "9. Contacto",
    texto: "Para qualquer questão relacionada com a privacidade dos teus dados, podes contactar-nos através do email disponível na página principal da aplicação.",
  },
  {
    titulo: "10. Alterações a esta política",
    texto: "Podemos atualizar esta Política de Privacidade ocasionalmente. Quando o fizermos, a data de última atualização será revista. Recomendamos que consultes esta página periodicamente.",
  },
];

export default function Privacidade() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/70 text-sm font-bold mb-4"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Legalidade</p>
            <h1 className="text-2xl font-black text-white">Política de Privacidade</h1>
          </div>
        </div>
        <p className="text-white/60 text-[12px] mt-2">Última atualização: junho de 2026</p>
      </div>

      {/* Content */}
      <div className="px-5 py-6 pb-16 max-w-lg mx-auto flex flex-col gap-5">
        {/* Intro */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3">
          <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-emerald-800 leading-relaxed font-medium">
            Os teus dados nunca saem do teu dispositivo. O PoupeJá não tem servidores e não recolhe informação pessoal remotamente.
          </p>
        </div>

        {/* Sections */}
        {SECOES.map((s, i) => (
          <div key={i} className="card p-4">
            <p className="font-black text-slate-800 text-[14px] mb-2">{s.titulo}</p>
            <p className="text-[13px] text-slate-500 leading-relaxed whitespace-pre-line">{s.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
