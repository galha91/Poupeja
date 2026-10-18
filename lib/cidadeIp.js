/*
 * A cidade que a Vercel deduz do IP vem em inglês e sem acentos ("Lisbon",
 * "Setubal"). No Início aparece "perto de <cidade>", por isso corrige-se
 * para o nome português. Cidades fora da lista passam como vêm.
 */
const NOMES = {
  lisbon: "Lisboa", oporto: "Porto",
  setubal: "Setúbal", evora: "Évora", santarem: "Santarém", braganca: "Bragança",
  guimaraes: "Guimarães", portimao: "Portimão", covilha: "Covilhã", olhao: "Olhão",
  loule: "Loulé", "vila nova de famalicao": "Vila Nova de Famalicão",
  "povoa de varzim": "Póvoa de Varzim", "sao joao da madeira": "São João da Madeira",
  "pacos de ferreira": "Paços de Ferreira", "vila real de santo antonio": "Vila Real de Santo António",
  agueda: "Águeda", ilhavo: "Ílhavo", obidos: "Óbidos", alcobaca: "Alcobaça", lousa: "Lousã",
};

export function cidadePortuguesa(cidade) {
  if (!cidade) return null;
  const limpo = String(cidade).trim();
  return NOMES[limpo.toLowerCase()] || limpo;
}
