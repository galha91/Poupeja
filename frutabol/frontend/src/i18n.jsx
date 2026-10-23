// i18n mínimo e sem dependências: PT-PT por defeito, EN incluído.
import { createContext, useContext, useState } from "react";

const TEXTOS = {
  pt: {
    slogan: "Frutas futebolistas 100% fictícias. Coleciona, licita, ganha.",
    catalogo: "Catálogo", colecao: "A minha coleção", moedas: "Moedas", admin: "Admin",
    entrar: "Entrar", sair: "Sair", registar: "Criar conta",
    pesquisar: "Pesquisar por nome, descrição ou estilo…",
    todas: "Todas", raridade: "Raridade",
    comum: "Comum", raro: "Raro", epico: "Épico", lendario: "Lendário",
    leilaoAtivo: "Leilão a decorrer", leilaoAgendado: "Leilão agendado", semLeilao: "Sem leilão ativo",
    licitacaoAtual: "Licitação atual", precoInicial: "Preço inicial",
    licitar: "Licitar", compraImediata: "Compra imediata",
    termina: "Termina em", comeca: "Começa em", terminado: "Terminado", cancelado: "Cancelado",
    historico: "Histórico de licitações", semLicitacoes: "Ainda sem licitações — sê o primeiro!",
    vencedor: "Vencedor", edicao: "Edição",
    saldo: "Saldo", bonusDiario: "Bónus diário", reclamar: "Reclamar",
    convida: "Convida amigos", codigoConvite: "O teu código de convite",
    email: "Email", password: "Password", nomeUtilizador: "Nome de utilizador",
    codigoReferralOpc: "Código de convite (opcional)",
    entrarGoogle: "Entrar com Google",
    verificaEmail: "Confirma o teu email — vê a tua caixa de entrada.",
    reenviar: "Reenviar email",
    download: "Download PNG", certificado: "Certificado PDF",
    compradoPor: "Comprado por", de: "de",
    packs: "Packs de moedas", brevemente: "Brevemente! Para já, as moedas são 100% grátis: bónus diário, registo e convites.",
    comprar: "Comprar",
    avisoLegal: "Todas as personagens, clubes e equipamentos são fictícios e originais. Qualquer semelhança com pessoas ou entidades reais é mera coincidência.",
    termos: "Termos de Serviço", privacidade: "Privacidade", conteudos: "Política de Conteúdos",
    destaque: "Leilões em destaque", verTudo: "Ver catálogo completo",
    comoFunciona: "Como funciona",
    passo1: "Cria conta e recebe moedas grátis", passo1txt: "Bónus de registo, bónus diário e moedas por cada amigo convidado.",
    passo2: "Licita nas tuas frutas favoritas", passo2txt: "Leilões ao vivo com anti-sniping: licitações no último minuto estendem o relógio.",
    passo3: "Recebe a obra e o certificado", passo3txt: "Download em alta resolução e certificado de autenticidade com edição numerada.",
    minimo: "mínimo", cativas: "As tuas moedas ficam cativas enquanto fores o maior licitador.",
    vazio: "Nada por aqui ainda.", colecaoVazia: "Ainda não tens colecionáveis. Vai ao catálogo e licita!",
    movimentos: "Movimentos de moedas",
    convidados: "amigos convidados",
    aComecar: "brevemente",
  },
  en: {
    slogan: "100% fictional football fruits. Collect, bid, win.",
    catalogo: "Catalog", colecao: "My collection", moedas: "Coins", admin: "Admin",
    entrar: "Sign in", sair: "Sign out", registar: "Create account",
    pesquisar: "Search by name, description or style…",
    todas: "All", raridade: "Rarity",
    comum: "Common", raro: "Rare", epico: "Epic", lendario: "Legendary",
    leilaoAtivo: "Live auction", leilaoAgendado: "Scheduled auction", semLeilao: "No live auction",
    licitacaoAtual: "Current bid", precoInicial: "Starting price",
    licitar: "Bid", compraImediata: "Buy now",
    termina: "Ends in", comeca: "Starts in", terminado: "Ended", cancelado: "Cancelled",
    historico: "Bid history", semLicitacoes: "No bids yet — be the first!",
    vencedor: "Winner", edicao: "Edition",
    saldo: "Balance", bonusDiario: "Daily bonus", reclamar: "Claim",
    convida: "Invite friends", codigoConvite: "Your invite code",
    email: "Email", password: "Password", nomeUtilizador: "Username",
    codigoReferralOpc: "Invite code (optional)",
    entrarGoogle: "Sign in with Google",
    verificaEmail: "Please confirm your email — check your inbox.",
    reenviar: "Resend email",
    download: "Download PNG", certificado: "Certificate PDF",
    compradoPor: "Bought for", de: "of",
    packs: "Coin packs", brevemente: "Coming soon! For now coins are 100% free: daily bonus, sign-up and referrals.",
    comprar: "Buy",
    avisoLegal: "All characters, clubs and kits are fictional and original. Any resemblance to real people or entities is purely coincidental.",
    termos: "Terms of Service", privacidade: "Privacy", conteudos: "Content Policy",
    destaque: "Featured auctions", verTudo: "Browse full catalog",
    comoFunciona: "How it works",
    passo1: "Sign up and get free coins", passo1txt: "Sign-up bonus, daily bonus and coins for every friend you invite.",
    passo2: "Bid on your favourite fruits", passo2txt: "Live auctions with anti-sniping: last-minute bids extend the clock.",
    passo3: "Get the artwork and certificate", passo3txt: "High-resolution download and a numbered certificate of authenticity.",
    minimo: "minimum", cativas: "Your coins are held while you are the highest bidder.",
    vazio: "Nothing here yet.", colecaoVazia: "No collectibles yet. Browse the catalog and start bidding!",
    movimentos: "Coin history",
    convidados: "friends invited",
    aComecar: "soon",
  },
};

const CtxIdioma = createContext(null);

export function ProvedorIdioma({ children }) {
  const [idioma, setIdioma] = useState(() => localStorage.getItem("frutabol_idioma") || "pt");
  const mudar = (novo) => {
    setIdioma(novo);
    localStorage.setItem("frutabol_idioma", novo);
  };
  const t = (chave) => TEXTOS[idioma]?.[chave] ?? TEXTOS.pt[chave] ?? chave;
  return <CtxIdioma.Provider value={{ idioma, mudar, t }}>{children}</CtxIdioma.Provider>;
}

export const useIdioma = () => useContext(CtxIdioma);
