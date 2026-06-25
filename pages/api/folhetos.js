import dadosBase from "../../public/folhetos.json";

function semanaAtual() {
  const hoje = new Date();
  const dia = hoje.getDay();
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() - (dia === 0 ? 6 : dia - 1));
  const dom = new Date(seg);
  dom.setDate(seg.getDate() + 6);
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return {
    validade: `${seg.getDate()} ${meses[seg.getMonth()]}–${dom.getDate()} ${meses[dom.getMonth()]}`,
    atualizadoEm: hoje.toISOString().split("T")[0],
  };
}

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
