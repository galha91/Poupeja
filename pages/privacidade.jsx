import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useRouter } from "next/router";

const SECOES = [
  {
    titulo: "1. Quem somos (Responsável pelo tratamento)",
    texto: "O PoupeJá é uma aplicação web de gestão de poupança pessoal disponível em poupejá.com, criada para ajudar pessoas em Portugal a poupar no dia a dia. O responsável pelo tratamento dos dados é o titular do projeto PoupeJá, contactável através de poupeja.portugal@gmail.com. Esta política explica, de forma transparente, que dados recolhemos, porquê, onde ficam e que direitos tens.",
  },
  {
    titulo: "2. Que dados recolhemos",
    texto: "• Dados de conta: nome e endereço de email (a password é guardada de forma encriptada pelo nosso fornecedor de autenticação e nunca é acessível a nós).\n• Dados que tu introduzes: talões, poupanças, listas de compras, contas fixas, garantias e preferências.\n• Dados técnicos: tipo de dispositivo (iOS, Android ou computador) e se instalaste a aplicação no ecrã principal.\n• Subscrição de notificações: caso ative as notificações push.\nNão recolhemos dados que não precises de nos dar para usar o serviço, e não fazemos qualquer rastreamento publicitário.",
  },
  {
    titulo: "3. Onde ficam os dados",
    texto: "Os teus dados ficam guardados de duas formas: (1) no teu dispositivo, através do armazenamento local do browser; e (2) na nossa base de dados, alojada na infraestrutura da Supabase, em servidores localizados na União Europeia (Irlanda). A sincronização na cloud permite-te aceder à tua conta a partir de qualquer dispositivo. Todas as comunicações são encriptadas (HTTPS).",
  },
  {
    titulo: "4. Para que usamos os dados e com que base legal",
    texto: "• Para te fornecer o serviço e sincronizar a tua conta entre dispositivos — base legal: execução do serviço que pediste.\n• Para te enviar o resumo semanal de folhetos por email — base legal: o teu consentimento (podes cancelar a qualquer momento).\n• Para te enviar notificações push — base legal: o teu consentimento (só se as ativares).\nNão usamos os teus dados para publicidade, perfilagem comercial ou venda a terceiros.",
  },
  {
    titulo: "5. Com quem partilhamos (subprocessadores)",
    texto: "Não vendemos nem cedemos dados pessoais. Para funcionar, o PoupeJá recorre a fornecedores que tratam dados em nosso nome, sob contrato e em conformidade com o RGPD:\n• Supabase — base de dados e autenticação (servidores na UE).\n• Vercel — alojamento da aplicação.\n• Resend — envio dos emails.\n• Serviços de notificações push dos browsers (Apple, Google, Mozilla) — entrega das notificações, se as ativares.",
  },
  {
    titulo: "6. Lista de compras partilhada",
    texto: "Se usares a função de partilhar uma lista de compras, é gerado um link único. Qualquer pessoa com esse link pode ver e editar essa lista, sem necessidade de conta. Por isso, não incluas informação pessoal ou sensível numa lista partilhada e partilha o link apenas com quem confias.",
  },
  {
    titulo: "7. Email semanal e notificações",
    texto: "O resumo semanal por email e as notificações push são opcionais e baseados no teu consentimento. Podes desativar o email a qualquer momento em Definições → Resumo automático semanal, ou através da ligação \"cancelar subscrição\" presente em cada email. As notificações podem ser desativadas em Definições ou nas definições do teu dispositivo.",
  },
  {
    titulo: "8. Os teus direitos (RGPD)",
    texto: "Ao abrigo do Regulamento Geral sobre a Proteção de Dados (RGPD), tens direito a:\n• Aceder aos teus dados pessoais\n• Corrigir dados incorretos\n• Apagar a tua conta e todos os dados associados\n• Receber os teus dados num formato portável\n• Opor-te ao tratamento e retirar o consentimento\nPara exercer qualquer destes direitos, contacta-nos por poupeja.portugal@gmail.com. Tens também o direito de apresentar reclamação à autoridade de controlo nacional (CNPD — Comissão Nacional de Proteção de Dados).",
  },
  {
    titulo: "9. Durante quanto tempo guardamos os dados",
    texto: "Guardamos os teus dados enquanto a tua conta estiver ativa. Se pedires a eliminação da conta, os dados associados são apagados. Os dados guardados localmente no dispositivo podem ser removidos por ti a qualquer momento, limpando os dados do site no browser.",
  },
  {
    titulo: "10. Cookies e tecnologias semelhantes",
    texto: "O PoupeJá não utiliza cookies de publicidade nem de rastreamento. Usamos apenas armazenamento local e um token de sessão para te manter com sessão iniciada e guardar as tuas preferências.",
  },
  {
    titulo: "11. Segurança",
    texto: "Protegemos os teus dados com ligações encriptadas (HTTPS) e com regras de acesso na base de dados que garantem que cada utilizador só acede aos seus próprios dados. Ainda assim, recomendamos que uses uma password forte e que não partilhes o teu dispositivo sem o bloquear.",
  },
  {
    titulo: "12. Menores",
    texto: "O PoupeJá não se destina a menores de 16 anos. Se és menor, utiliza a aplicação apenas com o conhecimento e a supervisão de um responsável legal.",
  },
  {
    titulo: "13. Alterações a esta política",
    texto: "Podemos atualizar esta Política de Privacidade ocasionalmente. Quando o fizermos, revemos a data de última atualização no topo desta página. Recomendamos que a consultes periodicamente.",
  },
  {
    titulo: "14. Contacto",
    texto: "Para qualquer questão sobre privacidade ou proteção de dados, contacta-nos através de poupeja.portugal@gmail.com.",
  },
];

export default function Privacidade() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,var(--pj-brand),var(--pj-brand-ink))" }}
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
        <p className="text-white/60 text-[12px] mt-2">Última atualização: 27 de junho de 2026</p>
      </div>

      {/* Content */}
      <div className="px-5 py-6 pb-16 max-w-lg mx-auto flex flex-col gap-5">
        {/* Intro */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3">
          <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-emerald-800 leading-relaxed font-medium">
            Recolhemos o mínimo de dados, guardamo-los em servidores na União Europeia e nunca os vendemos nem usamos para publicidade. Tu controlas — podes aceder, corrigir ou apagar tudo quando quiseres.
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
