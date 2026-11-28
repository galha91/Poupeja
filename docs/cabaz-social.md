# Cabaz da semana (Instagram e TikTok)

Vídeo vertical de 10 artigos comparados em 4 supermercados, às segundas, quartas e sextas.

## Como se faz

1. **Tema.** O que há mais tempo não saiu, segundo `cabazes_social` (Supabase). Os temas e artigos estão em `data/cabazes-social.json`.
2. **Preços.** Linhas de `precos_supermercado_historico` (dia mais recente de cada `q` e loja, só das lojas do ficheiro de config), guardadas num JSON `[{ q, loja, valor, dia }]`.
3. **Cálculo.** `node scripts/cabaz/calcular.mjs <tema> linhas.json cabaz.json [usados.json]`
   - `usados.json` = `{ "<q>": "<dia em que saiu pela última vez>" }`, tirado de `cabazes_social`.
   - Escolhe 10 artigos comparáveis (os que saíram há mais tempo primeiro) e escreve `cabaz.json` e `cabaz-legenda.txt`.
4. **Vídeo.** `node scripts/cabaz/video.mjs cabaz.json cabaz.mp4` (1080x1920, 30 fps, cerca de 17 s, sem áudio, 40 s a gerar).
5. **Registo.** Inserir uma linha em `cabazes_social` (dia, tema, artigos, totais).
6. **Entrega.** Vídeo e legenda enviados à pessoa que publica, que escolhe o som em alta na própria app.

## Regras de honestidade

- O preço de cada artigo é o **mais baixo por kg, litro ou unidade** que cada loja tem, multiplicado pela quantidade do cabaz.
- Um artigo cujo preço mais alto seja mais de 3 vezes o mais baixo sai do cabaz (a pesquisa apanhou produtos diferentes).
- Entre 2 e 3 vezes o artigo é "suspeito": só entra se não houver artigos de preço consistente que cheguem a 10.
- Se o vencedor muda ao tirar qualquer artigo, ou ganha por menos de 3%, o vídeo e a legenda não declaram vencedor: dizem que as lojas do topo quase empatam e quanto a mais custa a mais cara (`empate`, `extraMaisCaraPct`).
- Um artigo que falte numa das lojas também sai.
- A legenda e o vídeo mostram a data dos preços.

## Legenda

Gerada por `legenda()` em `scripts/cabaz/calcular.mjs`; `tests/cabaz.test.mjs` garante a regra em todos os temas.

- PT-PT simples, na 1.ª pessoa.
- **1.ª linha:** gancho de curiosidade, até 125 caracteres e no máximo 1 emoji. Não revela a loja vencedora.
- **Tema** com 2-3 palavras-chave ditas com naturalidade ("preços do supermercado", "cabaz", "mais barato").
- **1-2 frases com os números desta execução**, a data dos preços e "os preços podem variar". Em empate, não há vencedor.
- **Um só apelo** (guardar ou enviar a alguém, ver `social.apelo` de cada tema), seguido de "Compara grátis: link na bio."
- **Exatamente 5 hashtags específicas**: `#precosdosupermercado #compararprecos #cabazdasemana`, a do tema (`social.hashtag`) e a da loja mais barata (`hashtagsLojas`). Nunca genéricas (`#portugal`, `#poupar`, `#fyp`…).

Cada tema em `data/cabazes-social.json` tem `social: { contexto, hashtag, apelo }`.

