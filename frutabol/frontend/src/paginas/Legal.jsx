// Páginas legais completas em PT e EN (mudam com o seletor de idioma).
import { useIdioma } from "../i18n.jsx";

const CONTEUDO = {
  termos: {
    pt: {
      titulo: "Termos de Serviço",
      seccoes: [
        ["1. O serviço", "A FrutaBol é um marketplace de colecionáveis digitais: ilustrações de personagens de fruta antropomórficas com temática de futebol, vendidas em leilão ou compra imediata com moedas virtuais. Ao criar conta aceitas estes termos."],
        ["2. Conteúdos fictícios", "Todas as personagens, clubes e equipamentos são fictícios e originais. Qualquer semelhança com pessoas ou entidades reais é mera coincidência. Nenhum conteúdo representa jogadores, clubes, ligas ou marcas reais, nem tem qualquer associação com eles."],
        ["3. Moedas virtuais", "As moedas da FrutaBol não têm valor monetário, não são reembolsáveis, não são convertíveis em euros nem em qualquer outra moeda, e não são transferíveis entre contas. Podem ser obtidas gratuitamente (bónus de registo, bónus diário, convites) e, quando a loja estiver ativa, compradas em packs. A compra de moedas é um consumo digital imediato."],
        ["4. Leilões", "As licitações são vinculativas enquanto o leilão decorre: as moedas do maior licitador ficam cativas e são devolvidas automaticamente se este for ultrapassado. O relógio do leilão é controlado pelo servidor; licitações no último minuto prolongam o leilão (anti-sniping). Ganha a licitação mais alta no momento do fecho."],
        ["5. O que compras", "Ao ganhar um leilão recebes uma licença pessoal e não comercial sobre a edição numerada da ilustração: podes descarregá-la, exibi-la e guardá-la. A propriedade intelectual das obras permanece da FrutaBol. Não é um NFT nem um instrumento financeiro, e não deve ser adquirido como investimento."],
        ["6. Conta e conduta", "És responsável pela tua conta. É proibido usar bots, explorar bugs, manipular leilões (ex.: conluio) ou criar múltiplas contas para acumular bónus. Podemos suspender contas que violem estas regras, devolvendo as moedas cativas em leilões a decorrer."],
        ["7. Alterações e fim do serviço", "Podemos alterar estes termos (avisamos com antecedência razoável) e podemos encerrar o serviço; nesse caso manterás acesso aos downloads das tuas edições durante 90 dias."],
        ["8. Lei aplicável", "Estes termos regem-se pela lei portuguesa. Foro: comarca de Lisboa. Contacto: legal@frutabol.example."],
      ],
    },
    en: {
      titulo: "Terms of Service",
      seccoes: [
        ["1. The service", "FrutaBol is a digital collectibles marketplace: illustrations of anthropomorphic fruit characters with a football theme, sold via auction or buy-now using virtual coins. By creating an account you accept these terms."],
        ["2. Fictional content", "All characters, clubs and kits are fictional and original. Any resemblance to real people or entities is purely coincidental. No content represents or is associated with real players, clubs, leagues or brands."],
        ["3. Virtual coins", "FrutaBol coins have no monetary value, are non-refundable, cannot be converted to euros or any other currency, and are not transferable between accounts. They can be earned for free (sign-up bonus, daily bonus, referrals) and, once the store is enabled, purchased in packs. Coin purchases are an immediate digital consumption."],
        ["4. Auctions", "Bids are binding while an auction is running: the highest bidder's coins are held and automatically returned if outbid. The auction clock is server-controlled; last-minute bids extend the auction (anti-sniping). The highest bid at closing time wins."],
        ["5. What you buy", "Winning an auction grants you a personal, non-commercial licence over the numbered edition of the artwork: you may download, display and keep it. Intellectual property remains with FrutaBol. This is not an NFT nor a financial instrument, and should not be acquired as an investment."],
        ["6. Account and conduct", "You are responsible for your account. Bots, bug exploitation, auction manipulation (e.g. collusion) and multiple accounts to farm bonuses are forbidden. We may suspend violating accounts, returning coins held in running auctions."],
        ["7. Changes and termination", "We may update these terms (with reasonable notice) and may discontinue the service; in that case you keep access to your edition downloads for 90 days."],
        ["8. Governing law", "These terms are governed by Portuguese law. Venue: Lisbon. Contact: legal@frutabol.example."],
      ],
    },
  },
  privacidade: {
    pt: {
      titulo: "Política de Privacidade (RGPD)",
      seccoes: [
        ["Responsável pelo tratamento", "FrutaBol (operador estabelecido em Portugal/UE). Contacto para questões de privacidade: privacidade@frutabol.example."],
        ["Dados que tratamos", "Conta: email, nome de utilizador, password (guardada com hash bcrypt — nunca em claro) ou identificador Google se usares OAuth. Atividade: licitações, compras, movimentos de moedas, favoritos, convites. Técnicos: cookies de sessão (httpOnly) e registos de segurança (IP, momento do acesso) para rate limiting e prevenção de fraude."],
        ["Finalidades e fundamentos", "Prestar o serviço (execução de contrato): conta, leilões, coleção, emails transacionais. Segurança e prevenção de fraude (interesse legítimo). Obrigações legais (ex.: faturação na fase paga, tratada pelo nosso parceiro Lemon Squeezy como Merchant of Record)."],
        ["Cookies", "Usamos apenas cookies essenciais de sessão. Não usamos cookies de publicidade nem de rastreio de terceiros."],
        ["Partilha", "Não vendemos dados. Partilhamos apenas com subcontratantes necessários ao serviço (alojamento, envio de email e, na fase paga, o processador de pagamentos Lemon Squeezy — que trata os dados de pagamento diretamente; nunca vemos o número do teu cartão)."],
        ["Prazos de conservação", "Conta e ledger de moedas: enquanto a conta existir. Registos de segurança: até 12 meses. Dados de faturação (fase paga): prazos legais aplicáveis."],
        ["Os teus direitos", "Acesso, retificação, apagamento, limitação, portabilidade e oposição — escreve para privacidade@frutabol.example. Tens ainda o direito de apresentar reclamação à CNPD (cnpd.pt)."],
        ["Transferências internacionais", "Se algum subcontratante estiver fora da UE, exigimos garantias adequadas (cláusulas contratuais-tipo da UE)."],
      ],
    },
    en: {
      titulo: "Privacy Policy (GDPR)",
      seccoes: [
        ["Data controller", "FrutaBol (operator established in Portugal/EU). Privacy contact: privacidade@frutabol.example."],
        ["Data we process", "Account: email, username, password (stored as a bcrypt hash — never in plain text) or Google identifier if you use OAuth. Activity: bids, purchases, coin movements, favourites, referrals. Technical: session cookies (httpOnly) and security logs (IP, access time) for rate limiting and fraud prevention."],
        ["Purposes and legal bases", "Providing the service (contract performance): account, auctions, collection, transactional emails. Security and fraud prevention (legitimate interest). Legal obligations (e.g. invoicing in the paid phase, handled by our partner Lemon Squeezy as Merchant of Record)."],
        ["Cookies", "We only use essential session cookies. No advertising or third-party tracking cookies."],
        ["Sharing", "We do not sell data. We share only with processors needed to run the service (hosting, email delivery and, in the paid phase, the payment processor Lemon Squeezy — which handles payment data directly; we never see your card number)."],
        ["Retention", "Account and coin ledger: while the account exists. Security logs: up to 12 months. Billing data (paid phase): applicable legal periods."],
        ["Your rights", "Access, rectification, erasure, restriction, portability and objection — write to privacidade@frutabol.example. You may also lodge a complaint with the Portuguese DPA, CNPD (cnpd.pt)."],
        ["International transfers", "If any processor is outside the EU, we require adequate safeguards (EU standard contractual clauses)."],
      ],
    },
  },
  conteudos: {
    pt: {
      titulo: "Política de Conteúdos",
      seccoes: [
        ["Originalidade obrigatória", "Todo o conteúdo publicado na FrutaBol é criado de raiz. É proibido publicar personagens que usem nomes reais de jogadores ou variações/paródias reconhecíveis desses nomes, emblemas ou nomes de clubes reais, combinações de cores que imitem equipamentos oficiais, ou caras e traços de pessoas reais."],
        ["Processo de revisão", "Cada personagem é revista antes de publicação quanto a semelhanças com pessoas, clubes e marcas reais. Se, apesar disso, considerares que algum conteúdo infringe direitos, contacta-nos: conteudos@frutabol.example — analisamos e, se procedente, removemos."],
        ["Conteúdo do utilizador", "Os nomes de utilizador não podem ser ofensivos, enganadores nem imitar terceiros. Reservamo-nos o direito de renomear contas que violem esta regra."],
        ["Aviso permanente", "Todas as personagens, clubes e equipamentos são fictícios e originais. Qualquer semelhança com pessoas ou entidades reais é mera coincidência."],
      ],
    },
    en: {
      titulo: "Content Policy",
      seccoes: [
        ["Originality required", "All content published on FrutaBol is created from scratch. It is forbidden to publish characters using real players' names or recognisable variations/parodies of them, real club crests or names, colour combinations imitating official kits, or faces and features of real people."],
        ["Review process", "Every character is reviewed before publication for similarities with real people, clubs and brands. If you nevertheless believe content infringes rights, contact us at conteudos@frutabol.example — we will review and remove it if justified."],
        ["User content", "Usernames may not be offensive, misleading or impersonate third parties. We reserve the right to rename violating accounts."],
        ["Permanent notice", "All characters, clubs and kits are fictional and original. Any resemblance to real people or entities is purely coincidental."],
      ],
    },
  },
};

export default function Legal({ pagina }) {
  const { idioma } = useIdioma();
  const doc = CONTEUDO[pagina][idioma] || CONTEUDO[pagina].pt;
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-aparecer">
      <h1 className="font-display font-bold text-3xl mb-8">{doc.titulo}</h1>
      <div className="space-y-6">
        {doc.seccoes.map(([titulo, texto]) => (
          <section key={titulo}>
            <h2 className="font-bold mb-1">{titulo}</h2>
            <p className="opacity-75 text-sm leading-relaxed">{texto}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-xs opacity-50">
        {idioma === "en" ? "Last updated" : "Última atualização"}: 2026-07-05
      </p>
    </div>
  );
}
