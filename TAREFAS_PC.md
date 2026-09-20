# Tarefas a fazer no PC

## Vercel — Environment Variables
Ir a: vercel.com → projeto Poupeja → Settings → Environment Variables

Adicionar as seguintes variáveis (em todos os ambientes: Production, Preview, Development):

| Variável              | Valor                                      | Para quê                          |
|-----------------------|--------------------------------------------|-----------------------------------|
| `ANTHROPIC_API_KEY`   | (obter em console.anthropic.com → API Keys) | OCR automático dos talões         |
| `TOMTOM_API_KEY`      | `3LD64AGEktzWtwL9H8HCrfbwraLpgFRV`         | Mapa de postos de combustível/EV  |
| `RESEND_API_KEY`      | (obter em resend.com → API Keys)            | Email de confirmação no registo   |

---

## Anthropic Console — Limite de gastos
Ir a: console.anthropic.com → Settings → Limits

- Definir um **spending limit mensal** (sugestão: $10 para começar)
- Assim nunca há surpresas na fatura do OCR dos talões

---

## Resend — Criar conta (se ainda não tens)
- Ir a resend.com e criar conta gratuita
- Criar uma API Key e adicionar ao Vercel (ver tabela acima)
- Confirmar o domínio poupejá.com (xn--poupej-uta.com) nas definições do Resend

## Supabase — Tabela dos preços da DGEG (necessário para os combustíveis)
- Dashboard → SQL Editor → New query → colar o bloco `precos_dgeg` do
  ficheiro `supabase/setup.sql` → Run
- Confirmar que a `SUPABASE_SERVICE_ROLE_KEY` está nas env vars do Vercel
  (é a mesma que o admin-stats já usa)
- Confirmar que a `CRON_SECRET` está lá (é a mesma dos outros crons)

Sem esta tabela o site **não parte**: as páginas passam a ir directamente à
DGEG, como faziam antes. O que se perde é a rede de segurança — uma
instância fria com a DGEG em baixo fica sem preços para mostrar.

Nota: o cron dos preços corre **uma vez por dia** (`0 6 * * *`, 06:00 UTC).

Ficou horário à primeira, e esta nota dizia "deves estar em Pro" — era um
palpite e estava errado. A conta está no plano Hobby, que só aceita crons
diários, e o Vercel recusa a configuração inteira antes sequer de construir:
entre 6 e 20 de setembro **nenhum deploy passou**, e sete PRs ficaram na
`main` sem nunca chegar a produção. Daí a passagem a diário.

O site continua a mostrar preços verdadeiros entre actualizações: quando o
snapshot passa das 3h (`IDADE_MAXIMA_CACHE_LIVE`), o `/api/combustiveis` vai
à DGEG ao vivo. O que fica mais velha é a data mostrada nas páginas SEO, que
pode ter até 24h — e é a data real dos preços, não uma inventada.

Se um dia passares a Pro, basta pôr `0 * * * *` de volta no `vercel.json` e
descer o `IDADE_PREOCUPANTE` (em `lib/precosSnapshot.js`) para as 6h.

### Como confirmar que está a funcionar
- Vercel → Logs, filtrar por `cron-precos`: deve dizer `OK — N preços`
- Ou abrir `/combustiveis` e ver o rótulo por baixo do título: deve dizer
  "Preços de hoje" ou "Consultado hoje às HH:MM"
- Se falhar horas seguidas, recebes email em poupeja.portugal@gmail.com

## Correr o projeto localmente (mudou — leitura obrigatória)

O código deixou de ter um fallback para o projeto Supabase de **produção**.
Antes, correr sem configuração ligava-se à base de dados real e escrevia lá.
Agora falha com uma mensagem clara, de propósito.

Cria um `.env.local` na raiz (o `.gitignore` já o cobre):

```
NEXT_PUBLIC_SUPABASE_URL=https://<o-teu-projeto-de-dev>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<a-anon-key-desse-projeto>
NEXT_PUBLIC_URL=http://localhost:3000
```

O ideal é criares um segundo projeto no Supabase só para desenvolvimento
(o plano gratuito chega) e correres lá o `supabase/setup.sql`. Se preferires
apontar à produção pontualmente, põe aí as chaves de produção — mas fica
consciente de que estás a mexer em dados de gente a sério.

### CSP — passar de aviso a bloqueio
O `next.config.js` tem um Content-Security-Policy em **report-only**: o
browser não bloqueia nada, só escreve na consola o que teria bloqueado.
Quando quiseres ligá-lo a sério:
1. Abre o site com a consola aberta e percorre Início, Mercado, Mobilidade
   (com o mapa), Lojas e Poupança.
2. Se não aparecer nenhuma queixa de CSP, muda a chave no `next.config.js`
   de `Content-Security-Policy-Report-Only` para `Content-Security-Policy`.
3. Se aparecer alguma, acrescenta o domínio em falta à diretiva certa antes
   de ligar.
