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

   Escreve 5 ficheiros por receita em `public/receitas/fotos` e acrescenta o id
   a `data/fotos-receitas.json`. Ids que não existem são ignorados, com aviso.
4. Rever as imagens. Recusar as que mostram ingredientes que a receita não
   leva, texto, mãos ou embalagens.
5. Fazer commit de tudo junto. É um deploy (regra 5 do CLAUDE.md): juntar
   muitas fotografias de cada vez.

Ordem sugerida: as receitas de Natal (bacalhau-gomes-sa, bacalhau-bras,
rabanadas, arroz-doce, aletria), depois as mais vistas em `/admin`.

Custos de referência: no Higgsfield (gpt_image_2_6, 4:3), 0,75 créditos por
imagem, cerca de 115 créditos para as 153 receitas.
