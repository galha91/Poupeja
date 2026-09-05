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
