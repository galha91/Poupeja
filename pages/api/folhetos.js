import dadosBase from "../../public/folhetos.json";
import { semanaAtual } from "../../lib/semana-atual";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

  // Sem `validade` por loja: não temos essa informação. O que se sabe é a
  // semana em que estamos e quando verificámos os links — e é só isso que sai.
  const { semana, atualizadoEm } = semanaAtual();
  const resposta = {
    ...dadosBase,
    semana,
    atualizadoEm,
    folhetos: dadosBase.folhetos.map(({ validade, ...f }) => f),
  };

  res.status(200).json(resposta);
}
