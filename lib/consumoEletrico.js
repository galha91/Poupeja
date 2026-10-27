/*
 * Página pública /consumo-eletrodomesticos — quanto custa ter um aparelho
 * ligado. As contas e os valores de referência, sem I/O.
 *
 * Preço do kWh: tarifa regulada (comercializador de último recurso),
 * Baixa Tensão Normal, a partir de 1 de outubro de 2026 (Diretiva ERSE
 * n.º 4/2026, que atualiza a Diretiva n.º 1/2026). Preços sem impostos;
 * a calculadora junta o IVA a 23%.
 */

export const VERIFICADO_CONSUMO = "2026-10-27";

export const FONTE_ERSE = { href: "https://www.erse.pt/atividade/regulacao/tarifas-e-precos-eletricidade/", texto: "ERSE — tarifas e preços da eletricidade" };

export const IVA = 0.23;
/* €/kWh sem impostos, tarifa regulada desde 1 out 2026. */
export const TARIFA_REGULADA = {
  simples: 0.1711, // potência acima de 2,3 kVA
  foraVazio: 0.2045, // bi-horária
  vazio: 0.1143,
};
const cent = (v, casas = 2) => Math.round(v * 10 ** casas) / 10 ** casas;
/* O preço por omissão: o simples com IVA, arredondado a 4 casas (como nas faturas). */
export const PRECO_KWH = cent(TARIFA_REGULADA.simples * (1 + IVA), 4);

/*
 * watts × horas por dia × dias por mês → kWh e euros.
 * Devolve null se faltar alguma coisa ou se os números não fizerem sentido
 * para uma casa (mais de 10 kW, mais de 24 h, mais de 31 dias).
 */
export function custoAparelho({ watts, horasDia, diasMes = 30, precoKwh = PRECO_KWH }) {
  const w = Number(watts), h = Number(horasDia), d = Number(diasMes), p = Number(precoKwh);
  if (!(w > 0 && w <= 10000) || !(h > 0 && h <= 24) || !(d > 0 && d <= 31) || !(p > 0 && p < 2)) return null;
  const kwhMes = (w / 1000) * h * d;
  return {
    porHora: cent((w / 1000) * p, 3),
    kwhMes: cent(kwhMes, 1),
    mes: cent(kwhMes * p),
    ano: cent(kwhMes * p * 12),
  };
}

/*
 * Valores típicos: a potência média enquanto trabalha e um uso habitual.
 * Aparelhos com termóstato (aquecedores, forno, frigorífico) não estão
 * sempre no máximo — a "potência" aqui já é a média, não a da chapa.
 */
export const APARELHOS = [
  { id: "desumidificador", nome: "Desumidificador", watts: 200, horasDia: 8, diasMes: 30, nota: "Compressor de 10 a 12 litros por dia" },
  { id: "aquecedor-oleo", nome: "Aquecedor a óleo", watts: 1000, horasDia: 5, diasMes: 30, nota: "2000 W no máximo; com termóstato fica pela metade" },
  { id: "termoventilador", nome: "Termoventilador", watts: 2000, horasDia: 2, diasMes: 30, nota: "Aquece depressa mas gasta muito" },
  { id: "termoacumulador", nome: "Termoacumulador (cilindro)", watts: 1500, horasDia: 3, diasMes: 30, nota: "80 litros, banhos de uma família de 3" },
  { id: "frigorifico", nome: "Frigorífico combinado", watts: 30, horasDia: 24, diasMes: 30, nota: "Cerca de 260 kWh por ano, classe E" },
  { id: "maquina-roupa", nome: "Máquina de lavar roupa", watts: 900, horasDia: 1, diasMes: 12, nota: "Cerca de 0,9 kWh por lavagem a 40 °C" },
  { id: "maquina-secar", nome: "Máquina de secar (condensação)", watts: 1250, horasDia: 2, diasMes: 10, nota: "Cerca de 2,5 kWh por secagem; com bomba de calor, metade" },
  { id: "maquina-loica", nome: "Máquina de lavar loiça", watts: 900, horasDia: 1, diasMes: 20, nota: "Programa normal; o eco gasta menos" },
  { id: "forno", nome: "Forno elétrico", watts: 1000, horasDia: 1, diasMes: 10, nota: "Cerca de 1 kWh por hora a 200 °C" },
  { id: "televisao", nome: "Televisão 55\"", watts: 100, horasDia: 4, diasMes: 30, nota: "LED; o modo standby gasta menos de 1 W" },
  { id: "computador", nome: "Computador portátil", watts: 50, horasDia: 8, diasMes: 22, nota: "Dia de teletrabalho" },
  { id: "arca", nome: "Arca congeladora", watts: 25, horasDia: 24, diasMes: 30, nota: "Cerca de 220 kWh por ano" },
];
export const aparelhoPorId = (id) => APARELHOS.find((a) => a.id === id) || null;

/* Quanto se poupa a passar um uso para as horas de vazio (bi-horária). */
export function poupancaVazio({ watts, horasDia, diasMes = 30 }) {
  const kwhMes = (Number(watts) / 1000) * Number(horasDia) * Number(diasMes);
  if (!(kwhMes > 0)) return null;
  const dif = (TARIFA_REGULADA.foraVazio - TARIFA_REGULADA.vazio) * (1 + IVA);
  return { mes: cent(kwhMes * dif), ano: cent(kwhMes * dif * 12) };
}

export const PERGUNTAS_CONSUMO = [
  {
    p: "Como calculo quanto gasta um eletrodoméstico?",
    r: "Multiplica a potência em kW pelas horas de uso e pelo preço do kWh. Um desumidificador de 200 W (0,2 kW) ligado 8 horas gasta 1,6 kWh por dia. Com o kWh a 0,21 €, são cerca de 0,34 € por dia e 10 € por mês.",
  },
  {
    p: "Onde vejo a potência de um aparelho?",
    r: "Na chapa de características (atrás ou por baixo do aparelho), no manual ou na etiqueta energética. Nos frigoríficos e máquinas, a etiqueta dá o consumo por ano ou por 100 ciclos, que é mais rigoroso do que a potência máxima.",
  },
  {
    p: "Quanto custa o kWh em 2026?",
    r: "Na tarifa regulada, desde 1 de outubro de 2026, o kWh na opção simples custa 0,1711 € sem impostos (potências acima de 2,3 kVA), cerca de 0,21 € com IVA a 23%. No mercado livre depende do contrato: o preço está na tua fatura, na linha da energia.",
  },
  {
    p: "Compensa ter tarifa bi-horária?",
    r: "Compensa se consegues pôr pelo menos um terço do consumo nas horas de vazio (à noite e ao fim de semana, conforme o ciclo). Na tarifa regulada, o kWh em vazio custa 0,1143 € e fora de vazio 0,2045 €, sem impostos. Máquinas de lavar, termoacumulador e carregamento de carro elétrico são os que mais facilmente mudam de hora.",
  },
  {
    p: "O que gasta mais numa casa?",
    r: "O que aquece: aquecedores elétricos, termoacumulador, máquina de secar e forno. Um aquecedor de 2000 W ligado 4 horas por dia gasta num mês (240 kWh) quase tanto como um frigorífico num ano inteiro. Os aparelhos em standby gastam pouco cada um, mas somados contam: desliga a régua quando não usas.",
  },
  {
    p: "Desumidificador ou aquecedor: qual gasta mais?",
    r: "O aquecedor, de longe. Um desumidificador de compressor usa 150 a 250 W; um aquecedor a óleo ou um termoventilador usa 1000 a 2000 W. Numa casa húmida, secar o ar também ajuda a sentir menos frio.",
  },
];

export function perguntasConsumoLd(perguntas = PERGUNTAS_CONSUMO) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: perguntas.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
  };
}
