# Crescimento do PoupeJá: mapa, regras e registo

Este ficheiro é a memória do motor de crescimento. Uma tarefa agendada
("PoupeJá: motor de crescimento") abre-o todas as semanas, mede, escolhe
uma experiência, executa-a e escreve aqui o que fez e o que aprendeu. Quem
trabalhar no crescimento (pessoa ou agente) começa por ler isto.

## Objetivo

Mais pessoas a usar o PoupeJá **e a voltar**. O número que manda é o de
**visitantes recorrentes por semana** (tabela `visitas_perfil`, dimensão
`recorrencia`). Visitas novas sem regresso não contam como progresso.

Números de apoio, por esta ordem:

1. Canais de regresso ativos: lembretes de compras, alertas por email,
   subscritores de folhetos e de combustível, subscrições push.
2. Ativação: `comparar_lista`, `comparar_pesquisa`, `lista_escolha`.
3. Aquisição: visitantes únicos por dia e origem (`visitas_dia`).
4. Partilhas: `share`, `lista_partilhada_aberta`.

## Ponto de partida (13 nov 2026, 14 dias)

| Medida | Valor |
|---|---|
| Visitantes únicos por dia | 60 a 100 |
| Visitas de primeira vez | 92% |
| Convidados que voltam noutro dia | 3 a 6% |
| Entradas por origem | direto 1460, Google 724, Facebook 14, Instagram 10 |
| Listas comparadas | 144 |
| Lembretes de compras | 0 |
| Alertas por email | 0 |
| Subscritores (folhetos / combustível) | 1 / 1 |
| Subscrições push | 30 |
| Partilhas | 2 |

Leitura: o Google é o único canal que traz gente a sério. O Instagram
publica todos os dias (reel, 2 stories, carrosséis) e trouxe 10 visitas em
14 dias. O produto ativa (144 listas comparadas) mas não retém.

## Mapa de canais

| Canal | Estado | Quem opera |
|---|---|---|
| Google (páginas `/precos`, `/marca`, `/produto`, `/comparar`, `/combustiveis`, calculadoras) | A funcionar, principal | Motor (código) |
| Bing, DuckDuckGo, pesquisa das IAs (IndexNow, `cron-indexnow`) | Ligado, pouco tráfego | Motor (código) |
| Instagram @poupeja.oficial | Automático, quase sem visitas | Tarefas "PoupeJá IG" |
| Email (folhetos à quinta, combustível à segunda, lembrete de compras, alertas) | Montado, quase sem subscritores | Motor (captação no site) |
| Notificações push | 30 subscrições | Motor (convite na app) |
| Partilha entre pessoas (listas, resultado, cartão de poupança) | Quase nula | Motor (código) |
| App Android (TWA) | Guia em `TWA_PLAY_STORE.md`, por publicar | Ricardo |
| TikTok, grupos de Facebook, imprensa local | Por abrir | Ricardo (o motor prepara o material) |

## Ciclo semanal do motor

1. **Medir.** Os números acima, última semana completa contra a anterior.
   Ler também as pesquisas sem resultado (`metricas_dia`, tipo
   `pesquisa_vazia`) e as páginas mais vistas por origem Google.
   Ler ainda o Google Search Console (Windsor, conector `searchconsole`,
   conta `https://xn--poupej-uta.com/`, `mcp__Windsor_ai__get_data` com os
   campos `query`, `clicks`, `impressions`, `position`, últimos 28 dias):
   pesquisas com muitas impressões e poucos cliques são páginas a melhorar
   ou a criar.
2. **Avaliar a experiência anterior.** Resultado no registo abaixo:
   funcionou, não funcionou ou ainda sem dados.
3. **Escolher uma experiência.** A primeira da fila que ataque o passo
   mais fraco do funil. Uma por semana, pequena, com medida definida antes.
4. **Executar.** Código, testes, PR, merge, confirmar o deploy.
5. **Registar.** Uma entrada no registo, com a medida e a data de revisão.
6. **Resumir ao Ricardo.** Três linhas: o que mudou nos números, o que foi
   feito, o que só ele pode fazer.

## Limites (o motor decide sozinho dentro disto)

Pode, sem perguntar:

- Alterar código do site e da app, abrir PR, juntar à `main` e deixar a
  Vercel publicar, com os testes todos a passar.
- Criar páginas públicas novas com dados que já existem.
- Mexer em textos, posição e desenho dos convites (email, push, instalar,
  partilhar).
- Criar tabelas ou colunas pequenas no Supabase quando a experiência
  precisa (migração no repositório).

Não pode, nunca:

- Gastar dinheiro, criar contas, mudar de plano ou depender do Pro.
- Quebrar as regras do `CLAUDE.md`: nada pesado por pedido, trabalho
  pesado no GitHub, ISR longo, **no máximo um deploy de produção por
  semana** vindo do motor.
- Tirar ou esconder o consentimento explícito dos emails, enviar email a
  quem não pediu, ou mexer na página de privacidade sem o Ricardo.
- Publicar um preço que não venha dos dados do dia, ou comparar artigos
  que não sejam equivalentes.
- Bloquear motores de pesquisa ou bots de pesquisa das IAs.
- Apagar dados, tocar em segredos, ou escrever a terceiros (imprensa,
  parceiros, outras contas) em nome do Ricardo.
- Alterar as tarefas do Instagram: só propõe ajustes no resumo.

Se uma experiência precisar de algo desta lista, o motor prepara tudo o
que puder e deixa o pedido no resumo.

## Prioridade do Ricardo (14 nov 2026): subir de posição no Google

O objetivo principal é subir as páginas de preços dos lugares 7 a 10 para
o top 3. Os cliques vêm depois. As experiências que mexem na posição passam
à frente das que só mexem no texto do resultado.

O que faz subir, por esta ordem:

1. **Responder exatamente à pesquisa.** A pesquisa é "artigo + loja". A
   página do artigo tem de ter uma secção por cadeia, com título próprio
   ("Bacalhau no Continente"), o preço de hoje, o produto, o preço por kg
   e o histórico dessa cadeia. Dados reais, nunca texto de enchimento.
2. **Perguntas frequentes reais** no fim de cada página ("Onde está o
   bacalhau mais barato hoje?", "Quanto custa o kg de bacalhau no
   Continente?"), com a resposta tirada dos dados do dia e marcadas com
   `FAQPage` só se o Google ainda as mostrar para este tipo de site.
3. **Ligações internas.** Cada loja, categoria e receita liga às páginas de
   artigo com o texto da pesquisa ("preço do bacalhau no Continente").
4. **Frescura visível.** Data dos preços no topo, `dateModified` no JSON-LD,
   `lastmod` real no sitemap.
5. **Velocidade.** Core Web Vitals das páginas de preços no verde
   (`metricas_dia`, tipo `vital`).
6. **Ligações de fora (backlinks).** É o que mais pesa e não é automático:
   o motor prepara material (dados do cabaz, comparações) e pede ao
   Ricardo que o envie a jornalistas, blogs de poupança e fóruns.

Expectativa: semanas a meses. A página da própria loja (continente.pt)
fica quase sempre em 1.º para "artigo + loja"; o alvo realista é o top 3.
Medir a posição média por pesquisa no Search Console, semana a semana.

## Fila de experiências

Por ordem. O motor pode reordenar com base nos dados, e acrescenta ideias
novas no fim.

0. **Secção por cadeia nas páginas de artigo (para subir de posição).**
   Ver "Prioridade do Ricardo" acima, pontos 1 a 3. Inclui a descrição com
   o preço de cada cadeia (0c). Medir a posição média de "preço do
   bacalhau no continente", "castanhas preço kg pingo doce", "castanhas
   aldi", "preço banana continente" antes e 2 e 4 semanas depois.
0a. **Preço de um artigo numa loja.** O Google mostra o PoupeJá em
   pesquisas como "preço do bacalhau no continente" (250 impressões, 2
   cliques, posição 9,8), "castanhas preço kg pingo doce" (131, 3, 9,6),
   "preço banana continente", "ovos aldi preço", "óleo fula pingo doce
   preço": sempre artigo mais loja, sempre no fundo da primeira página. As
   páginas `/precos/<artigo>` respondem ao artigo, não à loja. Testar
   primeiro o mais barato: título, descrição e um subtítulo por loja nas
   páginas que já existem ("Bacalhau no Continente: x,xx €/kg"). Só depois,
   se resultar, páginas próprias artigo e loja, pré-calculadas no GitHub.
0b. **Carrossel de receitas do Google.** As receitas aparecem no carrossel
   de receitas (`RECIPE_FEATURE`) em 1.º lugar: 888 impressões em 28 dias e
   2 cliques. Ex.: "bifanas" (165 impressões, posição 1,06, 1 clique),
   "receitas com bifanas de porco" (58, posição 1, 0 cliques). No cartão
   aparecem imagem, título, tempo e estrelas. A nossa imagem é um cartão de
   texto gerado (`/api/og`) e não há avaliações. Testar: título do cartão
   mais apelativo (o `name` do JSON-LD Recipe) e uma imagem do prato.
   Nunca inventar avaliações (`aggregateRating`) sem avaliações reais de
   utilizadores. Imagem gerada por IA só com o acordo do Ricardo.
0c. **Descrição com todas as lojas.** Nas páginas de preços a descrição
   só nomeia a loja mais barata; a pesquisa é quase sempre "artigo + loja"
   (Continente, Pingo Doce, Aldi). Pôr o preço de cada cadeia na descrição
   ("Continente 2,49 € · Pingo Doce 2,29 € · Aldi 1,99 €") para o resultado
   responder à loja que a pessoa escreveu.
1. Alerta de preço por email também em `/produto/<slug>` e `/marca/<slug>`
   (o mesmo componente de `/precos/<artigo>`).
2. Páginas de preços sazonais antes da procura: Natal (bacalhau, bolo-rei,
   peru, polvo, frutos secos). `/precos/castanhas` foi a página mais vista
   em novembro.
3. Artigos novos em `ARTIGOS_SEO` a partir das pesquisas mais feitas e das
   pesquisas sem resultado.
4. Início para quem volta: "desde a tua última visita" (preços da lista
   que mudaram, folhetos novos).
5. Lembrete de compras com o total da lista por loja, pré-calculado no
   GitHub (hoje só leva os nomes dos artigos).
6. Página `/lista/<id>` partilhada com imagem de pré-visualização própria
   (total e loja mais barata).
7. Convite às notificações: só 8 em 104 ativam. Testar o momento (depois
   de "Vou comprar no…") e o texto.
8. Captação de email nas páginas de combustível por cidade e nos folhetos,
   mais perto do topo.
9. `llms.txt` e dados estruturados revistos, para as pesquisas das IAs.
10. Página de entrada própria para o Instagram (`/ig`) com o cabaz do dia
    e um só botão.

## Google Search Console (28 dias até 13 nov 2026)

33 078 impressões, 566 cliques (1,7%).

| Secção | Cliques | Impressões | Posição média |
|---|---|---|---|
| `/precos` | 313 | 13 193 | 7,1 |
| `/produto` | 114 | 10 882 | 9,0 |
| `/marca` | 68 | 3 636 | 10,0 |
| `/comparar` | 20 | 1 226 | 6,0 |
| `/receitas` | 12 | 1 762 | 6,5 |
| `/abono-de-familia` | 0 | 811 | 11,2 |
| `/combustiveis` | 0 | 244 | 18,1 |

Por tipo de resultado: fichas de produto (`PRODUCT_SNIPPETS`) 17 650
impressões, 350 cliques, posição 8,7; carrossel de receitas
(`RECIPE_FEATURE`) 888 impressões, 2 cliques, posição 1,4; receitas em
resultado normal (`RECIPE_RICH_SNIPPET`) 837 impressões, 9 cliques,
posição 12,1.

O site aparece muito e é pouco clicado: está quase sempre entre a 7.ª e a
10.ª posição. Subir duas ou três posições nas páginas de preços vale mais
do que qualquer canal novo.

## TikTok

Conta ligada a 13 nov 2026 (Higgsfield). Cada publicação tem de ser
confirmada pelo Ricardo num formulário (privacidade, comentários,
declaração de conteúdo promocional): não dá para publicar sem ele. O
vídeo tem de estar alojado no Higgsfield (`media_import_url` a partir do
`media_url` do reel no Instagram, lido pelo Windsor).

## O que só o Ricardo pode fazer

- Publicar a app Android na Play Store (`TWA_PLAY_STORE.md`).
- Bing Webmaster Tools: confirmar o domínio e enviar o sitemap.
- Marcar os eventos-chave no GA4 (`docs/GA4-FUNIL.md`).
- Grupos de Facebook de poupança e de cada concelho: partilhar a página de
  combustíveis da cidade ou o cabaz da semana.
- TikTok: confirmar no formulário cada vídeo que o motor preparar.

## Registo

### 13 nov 2026: captação nos momentos de valor (PR #219)

- **O quê:** alerta de preço por email em `/precos/<artigo>`; botão
  "Partilhar este resultado" na lista comparada; lembrete do dia das
  compras logo abaixo de "Vou comprar no…".
- **Porquê:** 144 listas comparadas, 0 lembretes, 0 alertas, 2 partilhas.
- **Medida:** `alerta_email_criado` (origem `seo`), `share`
  (`resultado_lista`), `lembrete_compras_abrir`, `lembrete_compras_criado`.
- **Rever em:** 27 nov 2026.
- **Resultado:** por medir.
