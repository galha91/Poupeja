# Campanha de 16 nov a 13 dez 2026: kit de arranque

Plano completo: PDF "Campanha de marketing PoupeJá" (14 nov 2026). Este
ficheiro é a parte prática: o que já está feito, o que cada link leva de
etiqueta, e os textos prontos a colar. Regras e limites: `docs/CRESCIMENTO.md`.

## Estado a 14 nov 2026

| Passo ("Por onde começar") | Estado |
|---|---|
| 1. Botão "Partilhar no WhatsApp" em cada comparação | Já existia: `PartilharPagina` em todas as páginas públicas, "Partilhar este resultado" na lista comparada (PR #219) |
| 2. Páginas de combustível por concelho | Já existiam: `/combustiveis/<concelho>` e `/combustiveis/distrito/<distrito>` |
| 3. Canal de WhatsApp com o cabaz semanal | Por abrir (Ricardo). Texto da 1.ª mensagem abaixo |
| 4. Barómetro PoupeJá, enviado a jornalistas | Página `/barometro` e `/imprensa` feitas neste ramo. Email abaixo, a enviar pelo Ricardo |
| 5. Um texto por segmento nos grupos de Facebook | Textos abaixo, a publicar pelo Ricardo |

O que não mudou: os reels do Instagram continuam a sair pelas tarefas
"PoupeJá IG". O calendário do PDF (G1 a G6) é uma proposta para essas
tarefas, ainda por aplicar. Cada vídeo do TikTok continua a precisar da
confirmação do Ricardo no formulário.

## Base de comparação (7 a 13 nov 2026, tabelas do site)

O PDF pede os valores de 9 a 15 nov no GA4. Estes são os do contador do
próprio site, para a última semana completa antes da campanha.

| Medida | Valor |
|---|---|
| Visitantes únicos (soma dos 7 dias) | 573 |
| Visitas de primeira vez / recorrentes | 522 / 51 (8,9% recorrentes) |
| Entradas: Google | 370 |
| Entradas: direto | 288 |
| Entradas: Facebook | 9 |
| Entradas: Instagram | 3 |
| Entradas: TikTok, WhatsApp, Reddit | 0 |
| Listas comparadas | 65 |
| Partilhas (botão do WhatsApp) | 1 |

Rever todos os domingos em `/admin` (Crescimento). A campanha funciona se
as entradas das redes subirem e os recorrentes passarem dos 8,9%.

## Etiquetas dos links

Cada link publicado leva `?o=<etiqueta>`. O site conta a entrada no canal
certo e mostra-a por etiqueta em `/admin` (as apps do Facebook, Instagram
e WhatsApp quase nunca dizem de onde vem a visita). Usar sempre o endereço
sem acento, que é o que sobrevive ao copiar e colar.

| Canal | Prefixo | Exemplo |
|---|---|---|
| Instagram | `ig-` | `https://xn--poupej-uta.com/?o=ig-bio` |
| TikTok | `tt-` | `https://xn--poupej-uta.com/?o=tt-bio` |
| Facebook | `fb-` | `https://xn--poupej-uta.com/?o=fb-poupanca-s1` |
| WhatsApp (canal) | `wa-` | `https://xn--poupej-uta.com/barometro?o=wa-canal-s1` |
| Reddit | `rd-` | `https://xn--poupej-uta.com/barometro?o=rd-cabaz-s2` |
| Telegram | `tg-` | `https://xn--poupej-uta.com/?o=tg-canal-s1` |
| YouTube Shorts | `yt-` | `https://xn--poupej-uta.com/?o=yt-g1` |
| LinkedIn | `li-` | `https://xn--poupej-uta.com/?o=li-historia` |
| Email a jornalistas | `email-` | `https://xn--poupej-uta.com/barometro?o=email-imprensa-s2` |

Regra do nome: canal, o quê, semana (`s1` a `s4`). Só letras minúsculas,
números e hífens, até 40 caracteres. Reddit, Telegram, YouTube e LinkedIn
só passam a ser contados depois do deploy deste ramo.

## Regras de todos os textos

- Números só de comparações feitas no dia, com a data. O valor do cabaz
  tira-se de `/barometro` no dia em que se publica. Nada de "poupa X € por
  mês".
- "Combustível", nunca só "gasóleo".
- Onde aparece a comparação, dizer que cobre as cadeias com preços online.
- Se o barómetro disser que não há uma cadeia claramente mais barata, o
  texto não declara vencedor: fala da diferença entre extremos.

## Semana 1 (16 a 22 nov): o cabaz

| Dia | Ação do Ricardo | Texto |
|---|---|---|
| Seg 16 | Publicar V1 na página de Facebook; abrir o canal de WhatsApp | A, B |
| Ter 17 | Publicar em 2 grupos de Facebook de poupança | C |
| Qua 18 | Story com sondagem | D |
| Qui 19 | Responder a todos os comentários POUPAR | E |
| Sex 20 | Mensagem a 5 criadoras de conteúdo | F |
| Sáb 21 | Publicar em 2 grupos de Facebook locais | G |
| Dom 22 | Balanço: `/admin`, entradas por etiqueta e reel com mais partilhas | |

**A. Facebook, V1 (seg 16)**

> O mesmo cabaz, preços diferentes.
> Antes de ires às compras, vê quanto custa a tua lista em vários supermercados. Grátis, sem registo, direto no telemóvel. Compara as cadeias com preços online.
> https://xn--poupej-uta.com/?atalho=lista&o=fb-pagina-s1

**B. Canal de WhatsApp, 1.ª mensagem (seg 16)**

Nome do canal: "PoupeJá: o cabaz da semana". Descrição: "Uma mensagem por
semana com o custo do cabaz básico e o combustível. Grátis."

> 🐷 Cabaz básico desta semana, cadeia a cadeia (preços online, com data):
> https://xn--poupej-uta.com/barometro?o=wa-canal-s1
> À segunda mando o cabaz, à quinta o combustível. Envia a quem faz as compras lá em casa.

**C. Grupos de Facebook de poupança (ter 17)**

> Olá a todos. Fiz um site gratuito para comparar preços de supermercado, ver folhetos e encontrar o combustível mais barato por zona. Não tem registo nem publicidade a pedir dados. A comparação ainda só cobre as cadeias com preços online. Se experimentarem, digam-me o que falta. Agradeço críticas honestas.
> https://xn--poupej-uta.com/?o=fb-poupanca-s1

Ler as regras de cada grupo antes: muitos só deixam publicar links num dia
da semana ou com autorização do administrador. Um grupo de cada vez, com
`fb-poupanca-s1` num e `fb-poupanca2-s1` no outro, para saber qual trouxe
gente.

**D. Story com sondagem (qua 18)**

Pergunta: "Onde fazes as compras?" Opções: Continente / Pingo Doce /
Lidl / Outro. Autocolante de link: `https://xn--poupej-uta.com/?o=ig-story-s1`

**E. Resposta aos comentários POUPAR (qui 19)**

> Aqui tens 🐷 https://xn--poupej-uta.com/?atalho=lista&o=ig-poupar-s1 Escreve a tua lista e vê em que supermercado fica mais barata. Grátis e sem conta.

Por mensagem privada, não no comentário público (o Instagram esconde
comentários com links).

**F. Mensagem a criadoras de conteúdo (sex 20)**

> Olá, [nome]. Sigo o teu trabalho sobre poupança. Fiz o PoupeJá, um site gratuito e sem registo que compara preços de supermercado. Todas as semanas calculo o custo do mesmo cabaz básico em cada cadeia com preços online. Se te for útil para um vídeo, mando-te os números da semana antes de os publicar; só peço que digas de onde vêm. Os desta semana estão aqui: https://xn--poupej-uta.com/barometro?o=ig-criadoras-s1
> Obrigado, Ricardo

**G. Grupos de Facebook locais (sáb 21)**

Trocar `<concelho>` pelo do grupo (ex.: `sintra`, `braga`).

> Para quem abastece em [concelho]: fiz uma página que ordena os postos do concelho pelo preço do combustível, com os dados oficiais da DGEG atualizados todos os dias. É gratuita e não pede registo.
> https://xn--poupej-uta.com/combustiveis/<concelho>?o=fb-<concelho>-s1

## Para as semanas seguintes

**Reddit, r/literaciafinanceira (ter 24 nov), flair "Auto-promoção"**

Título: "Comparei o mesmo cabaz em vários supermercados esta semana (dados e método)"

> Fiz uma lista de produtos básicos e comparei os preços online das cadeias que os publicam. Deixo a tabela e o método nos comentários. Usei uma ferramenta que estou a construir (PoupeJá, gratuita e sem conta); as limitações estão descritas no fim.

Primeiro comentário: a tabela por cadeia copiada de `/barometro`, a
secção "Como é calculado", as limitações, e o link
`https://xn--poupej-uta.com/barometro?o=rd-cabaz-s2`.

**Email a jornalistas de consumo (dom 29 nov)**

Assunto: "Cabaz básico: [x,xx] € de diferença entre cadeias esta semana"

> Bom dia, [nome].
> Todas as semanas calculo quanto custa o mesmo cabaz básico nas cadeias de supermercado com preços online. Esta semana vai de [x,xx] € ([cadeia]) a [x,xx] € ([cadeia]), preços recolhidos a [data].
> A tabela, o método e as limitações estão em https://xn--poupej-uta.com/barometro?o=email-imprensa-s2 e os números podem ser usados com indicação da fonte. Se lhe for útil, preparo os dados de outro cabaz (Natal: bacalhau, azeite, batata, couve) ou de um concelho.
> Sou enfermeiro e fiz o PoupeJá sozinho, fora do horário de trabalho. É gratuito e não pede registo. Mais informação em https://xn--poupej-uta.com/imprensa
> Com os melhores cumprimentos,
> Ricardo

Um email por jornalista, com o nome, nunca em cópia para vários. Enviar a
quem já escreveu sobre preços de supermercado nos últimos meses.

## O que só o Ricardo pode fazer

- Juntar este ramo à `main` (um só deploy; o barómetro fica com dados na
  madrugada seguinte, depois do `cron-paginas-marca`).
- Abrir o canal de WhatsApp e pôr o link na bio (Linktree).
- Publicar nos grupos, no Reddit e enviar os emails e mensagens.
- Decidir se as tarefas "PoupeJá IG" passam a seguir os guiões G1 a G6.
- Decidir se o nome e a história ("o enfermeiro que construiu o PoupeJá")
  entram na página `/imprensa`. Hoje a página não nomeia ninguém.
