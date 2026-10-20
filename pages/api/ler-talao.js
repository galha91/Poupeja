import Anthropic from "@anthropic-ai/sdk";
import { origemValida, excedeuLimite } from "../../lib/protecao-api";
import { getSupabaseAdmin } from "../../lib/supabaseAdmin";
import { linhasTalao } from "../../lib/precosTalao";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  if (!origemValida(req)) {
    return res.status(403).json({ erro: "Origem não autorizada." });
  }
  if (excedeuLimite(req, "ler-talao", 10)) {
    return res.status(429).json({ erro: "Demasiados pedidos. Aguarda um minuto e tenta de novo." });
  }

  const { imagem } = req.body;
  if (!imagem) return res.status(400).json({ erro: "Imagem em falta" });
  if (typeof imagem !== "string") return res.status(400).json({ erro: "Formato de imagem inválido" });

  /*
   * O regex era /^data:(.+);base64,(.+)$/ — o `.+` aceita QUALQUER coisa
   * como tipo, e esse valor seguia em cru para a API da Anthropic, que é
   * paga. Lista fechada: só os formatos que ela aceita e que uma câmara
   * produz. Nada mais entra.
   */
  const match = imagem.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return res.status(400).json({ erro: "Formato de imagem inválido. Usa JPEG, PNG, WebP ou GIF." });
  }

  const [, tipoBruto, base64] = match;
  // A Anthropic espera image/jpeg — "image/jpg" é comum mas não é válido.
  const mediaType = tipoBruto === "image/jpg" ? "image/jpeg" : tipoBruto;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096, // talões longos: cada artigo vem com o nome impresso e por extenso
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
{"loja":"Continente","data":"2026-06-06","total":23.17,"poupanca":7.51,"produtos":[{"nome":"SPAG PICANTE MILANEZA 500G","nomeLegivel":"Spaghetti Picante Milaneza 500 g","qtd":1,"preco":2.63,"total":2.63},{"nome":"BANANA","nomeLegivel":"Banana","kg":0.835,"precoKg":1.29,"qtd":1,"preco":1.08,"total":1.08}]}

Regras:
- loja: nome do supermercado
- data: formato YYYY-MM-DD
- total: valor "TOTAL A PAGAR" ou "TOTAL"
- poupanca: valor de "Total de descontos e poupanças", "POUPOU", "TOTAL POUPADO", "TOTAL DESCONTO" ou similar (null se não existir)
- produtos: lista de artigos comprados (ignora linhas de IVA, tabelas de descontos, totais)
- nome: tal como está impresso; nomeLegivel: o mesmo artigo por extenso, sem abreviaturas (ex.: "LEITE M/G 1L" → "Leite meio-gordo 1 L"), mantendo marca e embalagem; não inventes o que não está lá
- preco: preço de UMA unidade; total: valor da linha
- artigos vendidos ao peso (ex.: "0,835 kg x 1,29 €/kg"): kg = peso e precoKg = preço por kg; nos outros não incluas kg nem precoKg
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

    await guardarPrecos(dados);
    return res.status(200).json(dados);
  } catch (err) {
    console.error("ler-talao:", err);
    return res.status(500).json({ erro: "Erro ao processar imagem. Tenta de novo." });
  }
}

/*
 * Guarda as linhas de artigos (loja, artigo, preço, data) para a pesquisa
 * de preços — é assim que se conhecem os preços do sortido fixo do Lidl e
 * do Mercadona, que não estão online. Sem a foto, sem quem a tirou e sem o
 * cabeçalho do talão. Nunca atrasa nem estraga a leitura: falhas ficam no log.
 */
async function guardarPrecos(dados) {
  try {
    const linhas = linhasTalao(dados);
    const admin = linhas.length ? getSupabaseAdmin() : null;
    if (!admin) return;
    const { error } = await admin.from("precos_talao")
      .upsert(linhas, { onConflict: "loja,nome_busca,data,preco", ignoreDuplicates: true });
    if (error) console.error("ler-talao: erro a guardar preços:", error.message);
  } catch (e) {
    console.error("ler-talao: erro a guardar preços:", e?.message);
  }
}
