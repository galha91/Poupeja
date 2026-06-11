import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imagem } = req.body;
  if (!imagem) return res.status(400).json({ erro: "Imagem em falta" });

  const match = imagem.match(/^data:(.+);base64,(.+)$/);
  if (!match) return res.status(400).json({ erro: "Formato de imagem inválido" });

  const [, mediaType, base64] = match;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: `Analisa este talão de supermercado português e extrai a informação. Responde APENAS com JSON válido, sem texto adicional, neste formato:
{
  "loja": "nome do supermercado (ex: Continente, Pingo Doce, Lidl, Aldi, Intermarché, Auchan)",
  "data": "YYYY-MM-DD ou null",
  "total": 0.00,
  "produtos": [
    { "nome": "nome do produto", "qtd": 1, "preco": 0.00, "total": 0.00 }
  ]
}
Regras: inclui todos os produtos; se a qtd não constar usa 1; preço é unitário; se não conseguires ler um campo usa null. Responde APENAS com JSON, sem markdown.`,
          },
        ],
      }],
    });

    const texto = msg.content[0]?.text?.trim() ?? "";
    const jsonStr = texto.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

    let dados;
    try { dados = JSON.parse(jsonStr); } catch {
      return res.status(200).json({ erro: "Não foi possível ler o talão. Tenta com uma foto mais nítida e bem iluminada." });
    }

    if (!Array.isArray(dados.produtos) || dados.produtos.length === 0) {
      return res.status(200).json({ erro: "Não detetei produtos no talão. Certifica-te que a foto mostra a lista de artigos." });
    }

    return res.status(200).json(dados);
  } catch (err) {
    console.error("ler-talao:", err);
    return res.status(500).json({ erro: "Erro ao processar imagem. Tenta de novo." });
  }
}
