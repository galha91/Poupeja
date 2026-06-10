import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imagem } = req.body;
  if (!imagem) return res.status(400).json({ erro: "Imagem em falta" });

  // imagem vem como "data:image/jpeg;base64,..."
  const match = imagem.match(/^data:(.+);base64,(.+)$/);
  if (!match) return res.status(400).json({ erro: "Formato de imagem inválido" });

  const mediaType = match[1];
  const base64 = match[2];

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 64,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Olha para este talão de supermercado português. Encontra o valor total poupado — aparece normalmente como "POUPOU X,XX€", "TOTAL POUPADO X,XX€", "TOTAL DESCONTO X,XX€" ou similar, geralmente no final do talão.
Responde APENAS com o número (ex: 3.45). Usa ponto como separador decimal. Se não encontrares o valor, responde exatamente com: null`,
            },
          ],
        },
      ],
    });

    const texto = msg.content[0]?.text?.trim();
    if (!texto || texto === "null") {
      return res.status(200).json({ valor: null });
    }

    const valor = parseFloat(texto.replace(",", "."));
    if (isNaN(valor)) return res.status(200).json({ valor: null });

    return res.status(200).json({ valor });
  } catch (err) {
    console.error("ler-talao error:", err);
    return res.status(500).json({ erro: "Erro ao processar imagem" });
  }
}
