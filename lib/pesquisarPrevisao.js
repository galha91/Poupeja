import Anthropic from "@anthropic-ai/sdk";
import { extrairJson } from "./previsaoCombustivel";

/*
 * Pergunta à pesquisa web da Anthropic quanto vão mexer os combustíveis na
 * semana que começa em `semana` (AAAA-MM-DD). O Diário da República e os
 * agregadores de notícias recusam leitores automáticos; a pesquisa web corre
 * do lado da Anthropic e lê as notícias de sexta (ECO, ACP, CNN, portaria do
 * ISP). Devolve o objeto JSON que o modelo escreveu, por validar.
 *
 * Requer ANTHROPIC_API_KEY.
 */

const PEDIDO = (hoje, semana) => `Hoje é ${hoje}. Pesquisa notícias portuguesas dos últimos 3 dias sobre a variação prevista dos preços dos combustíveis em Portugal continental para a semana que começa na segunda-feira ${semana}.

Fontes úteis: ECO, Observador, Expresso, Público, Jornal de Negócios, CNN Portugal, SIC Notícias, RTP, DN, ACP, e a portaria semanal do Governo sobre o desconto do ISP (Diário da República).

Responde apenas com um objeto JSON, sem mais texto:
{"semana":"${semana}","encontrado":true,"gasoleo_cent":4.0,"gasolina_cent":-1.5,"fontes":[{"titulo":"…","url":"https://…"}],"resumo":"uma frase"}

Regras:
- gasoleo_cent e gasolina_cent: variação prevista do preço de venda por litro, em cêntimos, já com o efeito do desconto do ISP quando a notícia o indicar. Positivo = sobe, negativo = desce, null se nenhuma fonte o disser.
- Se as fontes divergirem, usa o valor mais citado ou o da fonte de mercado mais recente.
- fontes: até 3 artigos que leste, com o URL exato.
- Se não houver notícias sobre essa semana, responde {"semana":"${semana}","encontrado":false}.
- Não inventes valores.`;

export async function pesquisarPrevisao({ hoje, semana }) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 50_000, maxRetries: 1 });
  const messages = [{ role: "user", content: PEDIDO(hoje, semana) }];
  let resposta;
  // pause_turn: a pesquisa web pode parar a meio; continua-se com o que já veio.
  for (let volta = 0; volta < 3; volta++) {
    resposta = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      tools: [{
        type: "web_search_20260209",
        name: "web_search",
        max_uses: 4,
        user_location: { type: "approximate", country: "PT", timezone: "Europe/Lisbon" },
      }],
      messages,
    });
    if (resposta.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: resposta.content });
  }
  if (resposta.stop_reason === "refusal") return null;
  const texto = resposta.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  return extrairJson(texto);
}
