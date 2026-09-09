---
name: rever-apoios
description: Rever e atualizar os valores dos apoios do Estado em public/apoios.json contra as fontes oficiais. Usar em janeiro, depois do Orçamento do Estado e da portaria do IAS, ou sempre que houver dúvidas sobre se um valor ainda está certo.
---

# Rever os apoios do Estado

O `public/apoios.json` alimenta a página `/apoios` e a secção Apoios da app.
Diz às pessoas a que apoios têm direito e quanto valem. Um valor errado aqui
não é um detalhe: manda alguém apanhar um autocarro a contar que é grátis, ou
faz desistir de um apoio a que tinha direito.

Quase tudo muda em janeiro, com o Orçamento do Estado e a portaria do IAS.

## Começa pelo IAS

O IAS (Indexante dos Apoios Sociais) é a raiz de metade destes valores. É
fixado por portaria no fim de dezembro. **Descobre o IAS do ano primeiro** —
com ele confirmas vários apoios por aritmética, sem procurar cada um:

| Apoio | Fórmula | Confere com o ficheiro |
|---|---|---|
| RSI (titular) | 46,09% do IAS | `rsi` |
| RSI (adulto adicional) | 70% do valor do titular | `rsi` |
| RSI (por criança) | 50% do valor do titular | `rsi` |
| Teto do IRS Jovem | 55 × IAS | `irs-jovem` |
| Subsídio de desemprego (mín.) | 1 × IAS | `subsidio-desemprego` |
| Subsídio de desemprego (máx.) | 2,5 × IAS | `subsidio-desemprego` |
| Subsídio de doença (mín. diário) | 30% do IAS ÷ 30 | `subsidio-doenca` |
| Bolsa de incentivo (ensino superior) | 2 × IAS | `bolsa-acao-social` |
| Medida +Emprego | 12 × IAS | `apoios-emprego-jovem` |
| Emprego +Talento (com majoração) | 18 × IAS × 1,35 | `apoios-emprego-jovem` |
| Isenção de taxas moderadoras (desemprego) | 1,5 × IAS | `isencao-taxas-moderadoras` |

Se a conta não bater, ou o IAS que encontraste está errado ou a regra mudou —
procura a portaria antes de escrever o valor novo.

## Os que não derivam do IAS

Estes têm de ser procurados um a um:

- **Tarifa social de eletricidade** — percentagem fixada por despacho anual.
  Fonte: ERSE. A ERSE publica também o valor em €/mês.
- **Tarifa social de gás natural** — percentagem própria, diferente da
  eletricidade. Cuidado: o "ano gás" vai de outubro a setembro, não coincide
  com o ano civil.
- **CSI** — valor de referência anual, por portaria.
- **IMT Jovem** — os escalões sobem com o OE. Confirma os dois limites (isenção
  total e fim da isenção parcial).
- **Abono de família** — tabela por escalão e idade.
- **Porta 65** — o apoio médio e as regras de acesso mudaram em 2026; confirma
  se houve nova alteração.
- **Bolsa de estudo do ensino superior** — o sistema novo só fica completo em
  2027/2028. Confirma a bolsa mínima, a média e o teto.
- **Passes** — o navegante metropolitano e os passes municipais são fixados
  pelas autoridades de transporte, não pelo Estado central.

## Armadilhas que já custaram caro aqui

- **Nada é nacional só porque parece.** O passe sénior esteve descrito como
  gratuito "em todo o território nacional" quando só o é em Lisboa, no Porto e
  nalgumas CIM. Antes de escrever "nacional", confirma que é mesmo.
- **Apoios extintos continuam a parecer vivos.** O "Estímulo 2025" esteve no
  ficheiro anos depois de a medida ter sido revogada. Se uma medida tem um ano
  no nome, desconfia. Confirma no IEFP o que está mesmo aberto.
- **Apoios anunciados não são apoios abertos.** O E-Lar fechou candidaturas e a
  linha do Banco de Fomento nunca chegou a abrir. Se não há aviso publicado,
  diz isso no `valor` em vez de prometer.
- **Coisas abolidas continuam descritas como isenções.** As taxas moderadoras
  acabaram em 2022 em tudo menos na urgência sem referenciação.
- **Percentagens têm tetos.** O subsídio de doença esteve descrito como "até
  100%"; o máximo legal é 75%.

## Como pesquisar

O proxy de rede bloqueia acesso direto a quase todos os sites do Estado
(`seg-social.pt`, `iefp.pt`, …), por isso o `WebFetch` falha. Usa a
`firecrawl_search` — as descrições dos resultados costumam trazer os valores
sem ser preciso abrir a página.

Escreve sempre "Portugal" ou o nome da lei na pesquisa: sem isso vêm resultados
brasileiros sobre "Estatuto do Idoso" e "Carteira da Pessoa Idosa", que não têm
nada que ver. Se acontecer, repete com `excludeDomains: ["gov.br", ...]`.

Prefere, por esta ordem: Diário da República > site do regulador ou do
organismo (ERSE, DGEG, IEFP, DGES, Segurança Social) > portugal.gov.pt >
imprensa e bancos. Os simuladores dos bancos são úteis para confirmar, não para
servir de fonte única.

## Ao atualizar

- Mexe só no `public/apoios.json`. A página e a app leem daí, não é preciso
  tocar em código.
- Mantém os `id` como estão: são âncoras de URL (`/apoios#rsi`) que já podem
  andar em links e no índice do Google.
- Põe o ano no campo `valor` quando o valor muda todos os anos
  ("33,8% de desconto (2026)") — assim quem lê vê logo a que ano se refere.
- Se um apoio deixar de existir, não o apagues em silêncio: diz no `valor` e na
  `descricao` que acabou e o que o substituiu. Alguém vai procurá-lo à mesma.
- Atualiza o campo `atualizado` no topo do ficheiro para a data de hoje.
- Corre `npm run build` no fim (precisa de um `.env.local` com
  `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com valores
  quaisquer, só para compilar) e apaga-o a seguir.
- Diz ao utilizador quais mudaram e porquê. Se algo não foi possível confirmar,
  diz isso em vez de deixar o valor antigo a passar por verificado.

## A ter debaixo de olho

A **Prestação Social Única** começa a ser paga em janeiro de 2027 e absorve 13
apoios não contributivos, o RSI incluído. Quando isso acontecer, os apoios que
ela substituiu não devem desaparecer do ficheiro sem explicação — passam a
descrever o que lhes aconteceu e remetem para a PSU.
