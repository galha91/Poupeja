# 🍌⚽ FrutaBol — Marketplace de Colecionáveis Digitais

Frutas futebolistas **100% fictícias e originais**, vendidas em leilão ao vivo
com moedas virtuais. Frontend React + Vite + Tailwind, backend Node + Express
+ Prisma + PostgreSQL, tempo real com socket.io.

> Todas as personagens, clubes e equipamentos são fictícios e originais.
> Qualquer semelhança com pessoas ou entidades reais é mera coincidência.

---

## O que está incluído

| | |
|---|---|
| **Fase 1 (ativa)** | Moedas 100% grátis: bónus de registo (500), bónus diário (50), convites (200 para os dois). Leilões ao vivo com anti-sniping, compra imediata, coleção com download PNG por link assinado + certificado de autenticidade PDF, favoritos, pesquisa, i18n PT/EN, dark mode, admin completo. |
| **Fase 2 (desligada)** | Compra de packs de moedas via **Lemon Squeezy** (Merchant of Record — eles tratam do IVA mundial, faturas e reembolsos). Fica dormante até pores `PAYMENTS_ENABLED=true`. Ver checklist no fim. |
| **Segurança** | Validação zod em todas as rotas, rate limiting (auth/licitações/webhooks), helmet + CORS restrito, JWT em cookie httpOnly, transações **serializáveis** nas moedas e licitações (sem saldo negativo, sem double-spend), ledger imutável, webhooks assinados e idempotentes. |
| **Testes** | `npm test` no backend: licitações concorrentes, conservação de saldo no ledger, anti-sniping, compra imediata, assinatura e idempotência do webhook. |

## Setup local (10 minutos)

Precisas de: [Node 20+](https://nodejs.org) e [Docker](https://docker.com) (para a base de dados).

```bash
# 1. base de dados
cd frutabol
docker compose up -d

# 2. backend
cd backend
cp .env.example .env          # edita ADMIN_EMAIL e os segredos
npm install
npm run db:push               # cria as tabelas
npm run db:seed               # 6 personagens + leilões + packs
npm run dev                   # http://localhost:4000

# 3. frontend (noutro terminal)
cd ../frontend
npm install
npm run dev                   # http://localhost:5173
```

Regista-te com o email que puseste em `ADMIN_EMAIL` → essa conta fica admin
e vês o menu **Admin**. Sem SMTP configurado, os emails (verificação, leilões)
aparecem na consola do backend.

### Correr os testes

```bash
cd backend
# cria uma BD de teste (uma vez): docker exec -it <container> createdb -U frutabol frutabol_test
DATABASE_URL="postgresql://frutabol:frutabol@localhost:5432/frutabol_test" npx prisma db push
DATABASE_URL="postgresql://frutabol:frutabol@localhost:5432/frutabol_test" \
  PAYMENTS_ENABLED=true LEMONSQUEEZY_WEBHOOK_SECRET=segredo-teste npm test
```

---

## Deploy passo a passo (pouca experiência? segue pela ordem)

### 1. Base de dados — Neon (grátis)

1. Cria conta em [neon.tech](https://neon.tech) → **New Project** (região EU).
2. Copia a **connection string** (começa por `postgresql://`).

### 2. Backend — Railway (ou Render)

1. Cria conta em [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** e escolhe este repositório.
2. Em **Settings → Root Directory** mete `frutabol/backend`.
3. Em **Variables** adiciona (ver `.env.example`):
   - `DATABASE_URL` = a string do Neon
   - `JWT_SECRET` e `DOWNLOAD_SECRET` = valores longos aleatórios (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `ADMIN_EMAIL` = o teu email
   - `FRONTEND_URL` = (preenches no passo 3)
   - `BACKEND_URL` = o domínio que o Railway te der (ex.: `https://frutabol.up.railway.app`)
   - `NODE_ENV` = `production`
4. Primeira vez: corre localmente `DATABASE_URL="<string do Neon>" npx prisma db push && npm run db:seed` para criar tabelas e seed.
5. **Nota:** os uploads vão para o disco do serviço. No Railway adiciona um **Volume** montado em `/app/uploads` para os ficheiros sobreviverem a deploys.

### 3. Frontend — Vercel

1. Cria conta em [vercel.com](https://vercel.com) → **Add New Project** → este repositório.
2. **Root Directory:** `frutabol/frontend` (framework: Vite).
3. Em **Environment Variables:** `VITE_API_URL` = o URL do backend (passo 2).
4. Deploy → copia o domínio (ex.: `https://frutabol.vercel.app`) e volta ao Railway a preencher `FRONTEND_URL` com ele.

### 4. Email (opcional mas recomendado)

Cria conta num serviço SMTP (ex.: [Resend](https://resend.com), [Brevo](https://brevo.com)) e preenche `SMTP_HOST/PORT/USER/PASS` e `EMAIL_FROM` no backend.

### 5. OAuth Google (opcional)

[console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → **OAuth client ID** (Web):
- Authorized redirect URI: `https://<backend>/api/auth/google/callback`
- Copia `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` para o backend.

---

## ✅ Checklist ANTES de ativar a fase 2 (`PAYMENTS_ENABLED=true`)

1. **Conta Lemon Squeezy** ([lemonsqueezy.com](https://lemonsqueezy.com)) com a loja aprovada para venda. Eles são *Merchant of Record*: tratam do IVA mundial, faturas e reembolsos ao cliente final.
2. **Produtos:** cria um produto por pack de moedas; copia o *variant ID* de cada um para o campo correspondente no **Admin → Packs**.
3. **Webhook:** em *Settings → Webhooks* cria um webhook para `https://<backend>/api/webhooks/lemonsqueezy` com o evento `order_created`; define um *signing secret* e copia-o para `LEMONSQUEEZY_WEBHOOK_SECRET`.
4. **Termos revistos:** confirma que os Termos publicados dizem que as moedas não são reembolsáveis nem convertíveis (já está no texto incluído — revê com um advogado se possível).
5. **Impostos em Portugal:** mesmo com o Lemon Squeezy a tratar do IVA, o que recebes deles é rendimento teu — **tens de o declarar** (atividade aberta nas Finanças, categoria B, ou através da tua empresa). Fala com um contabilista antes de ligar o botão.
6. Define `PAYMENTS_ENABLED=true` no backend e redeploy. A loja de moedas aparece automaticamente no site.

### Fase 3 (estrutura pronta, desativada)

O ledger e o modelo de dados já suportam revenda entre utilizadores com comissão
(basta criar leilões cujo `vendedor` é um utilizador e creditar a diferença);
não há UI nem rota pública para isso nesta versão — decisão deliberada até a
fase 2 estar validada.

---

## Estrutura

```
frutabol/
├── docker-compose.yml        # Postgres de desenvolvimento
├── backend/
│   ├── prisma/schema.prisma  # User, Character, Edition, Auction, Bid, Purchase,
│   │                         # CoinPack, CoinTransaction, Certificate, Favorite,
│   │                         # Referral, WebhookEvent, Config
│   ├── prisma/seed.js        # 6 personagens originais + leilões + packs
│   ├── src/
│   │   ├── app.js / index.js # Express + socket.io + relógio dos leilões
│   │   ├── middleware/       # auth (JWT cookie), validação zod, rate limits
│   │   ├── servicos/         # moedas (ledger), leilões, certificados PDF,
│   │   │                     # links assinados, email, Lemon Squeezy
│   │   └── rotas/            # auth, catálogo, leilões, moedas, coleção,
│   │                         # admin, webhooks
│   └── testes/               # vitest + supertest (corridas, ledger, webhook)
└── frontend/
    └── src/
        ├── i18n.jsx          # PT-PT por defeito + EN
        ├── sessao.jsx        # sessão + saldo
        ├── componentes.jsx   # nav, cartões, contador, raridades
        └── paginas/          # início, catálogo, personagem (leilão ao vivo),
                              # entrar, coleção, moedas, admin, legais (PT/EN)
```
