// Validação com zod em todas as rotas: `validar(schema)` valida o body e
// devolve 400 com mensagens claras — nunca deixamos dados por validar
// chegar aos serviços.
export function validar(schema, origem = "body") {
  return (req, res, next) => {
    const resultado = schema.safeParse(req[origem]);
    if (!resultado.success) {
      const mensagens = resultado.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return res.status(400).json({ erro: "Dados inválidos.", detalhes: mensagens });
    }
    req[origem === "body" ? "dados" : `dados_${origem}`] = resultado.data;
    next();
  };
}
