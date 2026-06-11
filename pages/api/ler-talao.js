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
            text: `Lê este talão de supermercado português. Devolve APENAS o seguinte JSON (sem texto antes nem depois, sem markdown):
{"loja":"Continente","data":"2026-06-06","total":23.17,"produtos":[{"nome":"Spaghetti Picante Milaneza 500g","qtd":1,"preco":2.63,"total":2.63}]}

Regras:
- loja: nome do supermercado
- data: formato YYYY-MM-DD
- total: valor "TOTAL A PAGAR" ou "TOTAL"
- produtos: lista de artigos comprados (ignora linhas de IVA, descontos globais, poupanças)
- se qtd não constar usa 1; se um valor for ilegível usa null
Responde APENAS com JSON válido.`,
          },
        ],
      }],
    });

    const texto = msg.content[0]?.text?.trim() ?? "";

    // Extrai o bloco JSON mesmo que o modelo adicione texto à volta
    const jsonMatch = texto.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("ler-talao: sem JSON na resposta:", texto.slice(0, 300));
      return res.status(200).json({ erro: "Não foi possível ler o talão. Tenta com uma foto mais nítida e bem iluminada." });
    }

    let dados;
    try { dados = JSON.parse(jsonMatch[0]); } catch (e) {
      console.error("ler-talao: JSON inválido:", jsonMatch[0].slice(0, 300));
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
