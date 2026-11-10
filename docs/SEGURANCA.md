# Auditoria de segurança — 10 de novembro de 2026

Âmbito: código do repositório (site Next.js, rotas `/api`, app Capacitor) e
a base de dados Supabase de produção (RLS, permissões, funções).

## Estado geral

| Regra | Estado |
|---|---|
| 1. Chaves fora do frontend | ✅ Só `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (pública por desenho), `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (pública por desenho) e `NEXT_PUBLIC_URL`. Anthropic, Resend, service role, VAPID privada e `CRON_SECRET` só no servidor. `.env*` no `.gitignore`. Nenhuma chave encontrada no código nem no histórico disponível. |
| 2. Validação de inputs | ✅ com correções (ver abaixo) |
| 2. Row Level Security | ✅ Todas as 33 tabelas com RLS. Só `dados_utilizador` e `push_subscriptions` têm políticas, ambas `auth.uid() = user_id`. As outras não têm políticas = ninguém lhes chega pela anon key; só o servidor (service role). Funções `security definer` sem `EXECUTE` para `anon`/`authenticated`. |
| 3. Autenticação | ✅ Supabase Auth. Nada de passwords ou sessões feitas à mão. Rotas com conta (`apagar-conta`, `push-subscribe`, `admin-*`) validam o token no servidor com `auth.getUser`. Crons com `CRON_SECRET` em tempo constante. |
| 4. Rate limiting | ✅ em todas as rotas que escrevem ou custam dinheiro; teto diário novo na IA |

## Corrigido

1. **`/api/email-semanal` era um relé de email aberto.** Sem login, aceitava
   qualquer email e qualquer "nome" no corpo e mandava um email do nosso
   domínio. Agora exige sessão e envia só para o email da conta (limite por
   IP e por conta).
2. **HTML injetado nos emails.** O nome da pessoa e os nomes das garantias
   entravam em cru no HTML do resumo dos folhetos. Agora são escapados
   (`lib/escapar.js`).
3. **JSON-LD podia fechar o `<script>`.** 45 páginas punham
   `JSON.stringify(...)` dentro de `<script type="application/ld+json">`;
   um nome de produto vindo de um supermercado com `</script>` corria código
   no site. Agora `jsonLdSeguro()` escapa `<`, `>` e `&` (o JSON lido pelo
   Google é igual).
4. **Curingas nos `ilike("email", …)`.** `%` e `_` são curingas no LIKE:
   com um email como `ana_silva@…` ou `%@gmail.com` dava para atualizar o
   alerta ou o lembrete de outra pessoa e receber o token dele. Agora a
   pesquisa é literal (`padraoEmail`) e a validação recusa `% * , ( ) ; : < > [ ] \ "`.
5. **Teto de gastos na IA (talões).** Além do limite por IP (agora 5/min e
   30/hora), um teto global por dia lido de `metricas_dia`
   (`lib/limiteIA.js`, `ANTHROPIC_LIMITE_DIARIO_USD`, 2 USD por omissão).
   Passado o teto, a leitura automática pára até à meia-noite e a pessoa
   escreve o valor à mão, como já acontecia quando a leitura falhava.
   Tamanho máximo da imagem: 10 MB → 6 MB.
6. **`/api/admin-push`** usava um email de admin próprio em vez do
   `lib/adminAuth.js`, e aceitava título, texto e link sem limites. Agora usa
   `exigirAdmin` e o link só pode ser uma página do próprio site.
7. **Base de dados:** a view `produtos_embalagem_mudancas` corria com os
   poderes do dono, por cima do RLS. Agora `security_invoker = on`.

## A fazer à mão

- **Anthropic → Settings → Limits:** pôr um limite mensal de gastos
  (ex.: 10 USD). É a única defesa que não depende do código.
- **Supabase → Authentication → Settings:** ativar *Leaked password
  protection* (recusa passwords que já apareceram em fugas). Ver também
  *Rate Limits* (login, registo, emails de confirmação): é o Supabase Auth
  que limita essas rotas, não o nosso código.
- **GitHub → Settings → Code security:** ativar *Secret scanning* e *Push
  protection* (grátis em repositórios públicos). O clone desta auditoria era
  parcial, por isso o histórico antigo não foi todo verificado.
- **Vercel (opcional):** definir `ANTHROPIC_LIMITE_DIARIO_USD` se 2 USD/dia
  não for o valor certo.
- Se alguma vez uma chave tiver sido colada num commit, issue ou chat:
  revogar e criar nova (Anthropic, Resend, service role do Supabase,
  `CRON_SECRET`, VAPID).

## Decisões em aberto (não mudei sem perguntar)

- **Leitura de talões sem conta.** Hoje qualquer visitante pode usar a IA.
  Exigir login fecha a porta de vez, mas muda o que o convidado vê.
- **Rate limit em memória.** Cada instância da Vercel tem o seu contador.
  Um limite partilhado (tabela no Supabase) custa uma chamada à base de
  dados por pedido; o teto diário da IA já cobre o caso que custa dinheiro.
- **Listas partilhadas** leem-se e escrevem-se só com o link (12 caracteres
  aleatórios + 40 pedidos/min). É o comportamento pretendido.
- **`pg_net` no schema `public`** (aviso do Supabase). Movê-lo pode partir
  o `chamar_planeador_github`; fica como está.
