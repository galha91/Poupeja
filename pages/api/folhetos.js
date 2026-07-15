import dadosBase from "../../public/folhetos.json";
import { semanaAtual } from "../../lib/semana-atual";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

  const { validade, atualizadoEm } = semanaAtual();
  const resposta = {
    ...dadosBase,
    atualizadoEm,
    folhetos: dadosBase.folhetos.map(f => ({ ...f, validade })),
  };

  res.status(200).json(resposta);
}
