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

Nota: o cron horário (`0 * * * *`) precisa do plano **Pro** do Vercel; no
Hobby os crons só correm uma vez por dia. Como já tens 4 crons configurados,
deves estar em Pro — mas convém confirmar depois do deploy que o
`/api/cron-precos` aparece em Vercel → Settings → Cron Jobs e que corre.

### Como confirmar que está a funcionar
- Vercel → Logs, filtrar por `cron-precos`: deve dizer `OK — N preços`
- Ou abrir `/combustiveis` e ver o rótulo por baixo do título: deve dizer
  "Preços de hoje" ou "Consultado hoje às HH:MM"
- Se falhar horas seguidas, recebes email em poupeja.portugal@gmail.com
