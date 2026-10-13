/*
 * As secções da app, com o atalho que abre cada uma (/?atalho=…, os mesmos
 * do manifest e das notificações). Tudo funciona como convidado, sem conta.
 * Usado pela página 404 e pelo rodapé das páginas públicas, para quem chega
 * por uma página de SEO ter caminho para o resto da app.
 */
export const SECOES_APP = [
  { atalho: "mobilidade", titulo: "Combustíveis", curto: "Combustíveis", desc: "Gasóleo e gasolina mais baratos perto de ti" },
  { atalho: "mercados",   titulo: "Comparar preços e folhetos", curto: "Comparar preços", desc: "Onde está mais barato, folhetos da semana e ementas" },
  { atalho: "lista",      titulo: "Lista de compras", curto: "Lista de compras", desc: "Diz-te em que supermercado fica mais barata" },
  { atalho: "taloes",     titulo: "Talões e garantias", curto: "Talões e garantias", desc: "Guarda as compras e recebe aviso antes de a garantia acabar" },
  { atalho: "contas",     titulo: "Contas da casa", curto: "Contas da casa", desc: "Despesas fixas, renovações e crédito habitação" },
  { atalho: "apoios",     titulo: "Apoios do Estado", curto: "Apoios e prazos", desc: "Benefícios e prazos a não perder" },
  { atalho: "poupanca",   titulo: "A tua poupança", curto: "A tua poupança", desc: "Quanto já poupaste, mês a mês" },
  { atalho: "lojas",      titulo: "Descontos em lojas", curto: "Descontos em lojas", desc: "Moda, eletrónica e desporto" },
];
