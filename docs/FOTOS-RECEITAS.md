# Fotografias das receitas

## O que a PlanMyMeals faz (22 nov 2026)

- Uma fotografia por receita, gerada por IA, em WebP.
- Por baixo, um aviso comprido: "The photograph is AI-generated and illustrates
  the dish. It is not a record of a cook we carried out."
- Cada fotografia tem um cenário diferente (mesa azul numa, madeira noutra) e
  empratamento de restaurante. Nada diz quanto custa o prato.

## O que o PoupeJá faz melhor

1. **Um estilo só.** O mesmo prato branco, a mesma mesa de carvalho claro, o
   mesmo guardanapo de linho com risca azul, a luz de uma janela à esquerda,
   a 45 graus. A lista de receitas parece um livro, e uma partilha reconhece-se
   como PoupeJá. O estilo está em `lib/receitas/fotoPrompt.js` (`ESTILO`).
2. **Uma dose, caseira.** O prato de uma pessoa, como sai do tacho. Bate certo
   com o "1,85 €/pessoa" que vai por cima da fotografia.
3. **O preço na fotografia.** Na página da receita e na imagem de partilha do
   WhatsApp (`/api/og?v=receita&foto=<id>`): nome, preço por pessoa e tempo.
4. **Aviso curto e honesto:** "Imagem ilustrativa, criada com IA."
5. **Leve e barato.** Ficheiros já no tamanho certo, sem a otimização de
   imagens da Vercel (limitada no plano Hobby), e um mês de cache no browser
   (`next.config.js`). Nas listas, miniaturas de 480 px com `loading="lazy"`.
6. **Google:** a mesma fotografia em 1:1, 4:3 e 16:9 no JSON-LD da receita,
   como o Google pede para os cartões de receita.

Próximo passo, mais tarde: fotografias reais de quem fez a receita ("Fiz
esta receita") passam à frente das da IA.

## Gerar de graça, automaticamente (Cloudflare Workers AI)

O caminho principal. O Cloudflare dá a cada conta grátis 10 000 "neurons"
por dia no Workers AI; uma imagem do modelo FLUX.1 [schnell] (licença
Apache 2.0, uso comercial permitido) gasta cerca de 77. São ~130 imagens por
dia, sem pagar nada: as 153 receitas ficam feitas em dois dias.

Preparar uma vez:

1. Criar uma conta grátis em dash.cloudflare.com (não pede cartão).
2. Copiar o **Account ID** (no painel, em Workers & Pages, coluna da direita).
3. Criar um **API token**: My Profile → API Tokens → Create Token → modelo
   "Workers AI" → Create. Copiar o token (só aparece uma vez).
4. No GitHub do PoupeJá: Settings → Secrets and variables → Actions → New
   repository secret: `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN`.

Gerar:

- GitHub → Actions → "Fotografias das receitas" → Run workflow, com o número
  de receitas (30 por omissão; o Natal vem primeiro). O workflow gera as
  imagens com o estilo único (`lib/receitas/fotoPrompt.js`), prepara os 5
  tamanhos e abre um **pull request em rascunho**. Nada vai para o site sem
  revisão.
- Rever as imagens no PR. Uma que não sirva: apagar os 5 ficheiros dela e a
  linha em `data/fotos-receitas.json`; voltar a gerar com outro pedido mais
  tarde.
- Juntar várias levas antes do merge: cada merge é um deploy.

À mão, no computador: `CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… node
scripts/fotos-receitas/gerar.mjs --quantas 10` (ou `--ids rabanadas,aletria`).

## Fotografias reais com licença livre (Wikimedia Commons)

Alternativa às imagens de IA, sem custos: fotografias reais com licença
CC0, domínio público, CC BY ou CC BY-SA. Só servem com o crédito do autor e
da licença por baixo da fotografia ("Fotografia: Adriao, CC BY-SA 3.0
(Wikimedia Commons)", com ligação à página de origem). O site faz isso
sozinho a partir do `creditos.json` (ver o passo 3 abaixo). Licenças "NC"
(não comercial) e "ND" ficam de fora: o site tem links de afiliados.

Cobertura vista a 22 nov 2026: boa nos clássicos (Bacalhau à Brás, Gomes de
Sá, caldo verde), fraca nos pratos do dia a dia (massa com atum: nenhuma) e
nos doces portugueses (rabanadas e arroz-doce só aparecem em versões de
outros países). Na prática: Commons para os clássicos, IA ou fotografias
próprias para o resto.

Nunca usar fotografias de sites de receitas, blogs, supermercados ou
Instagram: têm direitos de autor, mesmo quando aparecem no Google Imagens.

## Como acrescentar fotografias

1. Gerar os pedidos de imagem das receitas que ainda não têm fotografia:

   ```
   node scripts/fotos-receitas/prompts.mjs
   ```

   Ficam em `scripts/fotos-receitas/prompts.json` (id, nome e pedido em
   inglês). Usar cada pedido tal como está, em formato 4:3, para o estilo
   ficar igual em todas.
2. Guardar cada imagem com o id da receita como nome, numa pasta qualquer:
   `bacalhau-bras.png`, `rabanadas.jpg`… (o id é o do URL `/receitas/<id>`).
3. Preparar os ficheiros para o site:

   ```
   node scripts/fotos-receitas/processar.mjs <pasta>
   ```

   Escreve 5 ficheiros por receita em `public/receitas/fotos` e acrescenta a
   receita a `data/fotos-receitas.json`. Ids que não existem são ignorados,
   com aviso. Para fotografias reais, pôr na mesma pasta um `creditos.json`:

   ```json
   { "bacalhau-gomes-sa": { "fonte": "commons", "autor": "Adriao",
     "licenca": "CC BY-SA 3.0",
     "pagina": "https://commons.wikimedia.org/wiki/File:Bacalhau_à_Gomes_de_Sá.jpg" } }
   ```

   Sem entrada no `creditos.json`, a fotografia conta como gerada por IA. Uma
   fotografia real sem licença livre, autor ou página é recusada.
4. Rever as imagens. Recusar as que mostram ingredientes que a receita não
   leva, texto, mãos ou embalagens.
5. Fazer commit de tudo junto. É um deploy (regra 5 do CLAUDE.md): juntar
   muitas fotografias de cada vez.

Ordem sugerida: as receitas de Natal (bacalhau-gomes-sa, bacalhau-bras,
rabanadas, arroz-doce, aletria), depois as mais vistas em `/admin`.

Custos de referência: no Higgsfield (gpt_image_2_6, 4:3), 0,75 créditos por
imagem, cerca de 115 créditos para as 153 receitas.
