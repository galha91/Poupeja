# Notas — tarefas para fazer no PC

## Compilar a app para as lojas (Android/iOS)
Ver guia completo em `GUIA-APPS.md`. Resumo dos comandos (correr no computador
com Android Studio / Xcode instalados):

```bash
git clone https://github.com/galha91/Poupeja.git
cd Poupeja
npm install
npm run icons:generate    # gera todos os ícones automaticamente
npm run cap:add:android   # cria projeto Android
npm run cap:sync
npm run cap:android       # abre Android Studio → Build → .aab
```

- Google Play: $25 (uma vez) → carregar o .aab
- Apple: $99/ano (precisa de Mac com Xcode)
- Recomendação: começar pelo Android primeiro.

## Outras pendências

### Vercel — Environment Variables
Ir a vercel.com → PoupeJá → Settings → Environment Variables

| Nome | Valor |
|------|-------|
| `CRON_SECRET` | `poupeja-cron-2026-secret` | ✅ já adicionado |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BAftcbRKMAysEbxLXcMnPajkyHziZKHK8g0o-en_l0TlHi8bMvIZZLb05MHxF4OLgBSk9iv7vpRKY2DXOF7zkfk` |
| `VAPID_PRIVATE_KEY` | `7zphNchunc6AlZiKz5tfji7V4jMa4moAf1LppPzEXzA` |
| `VAPID_EMAIL` | `mailto:poupeja.portugal@gmail.com` |
| `RESEND_API_KEY` | (a tua chave do resend.com) |

### GitHub — Secrets (Actions)
Ir a github.com/galha91/Poupeja/settings/secrets/actions

| Nome | Valor |
|------|-------|
| `RESEND_API_KEY` | (a tua chave do resend.com) — para alertas de links quebrados |

### cron-job.org — 2.º cron (notificação push de quinta-feira)
Criar novo cron em console.cron-job.org com:
- URL: `https://www.xn--poupej-uta.com/api/push-enviar`
- Método: POST
- Horário: quinta-feira 09:00 UTC (`0 9 * * 4`)
- Timezone: Europe/Lisbon
- Header: `Authorization: Bearer poupeja-cron-2026-secret`
- Body (JSON):
```json
{ "title": "💰 Já aproveitaste as promoções desta semana?",
  "body": "Os folhetos dos supermercados estão à tua espera. Poupa antes do fim de semana!",
  "url": "/" }
```

### Supabase — Tabelas a criar
Ir ao projeto Supabase → SQL Editor → correr cada bloco:

**1. Lista de compras partilhada:**
```sql
create table listas_partilhadas (
  id text primary key,
  itens jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table listas_partilhadas enable row level security;
create policy "public_select" on listas_partilhadas for select using (true);
create policy "public_insert" on listas_partilhadas for insert with check (true);
create policy "public_update" on listas_partilhadas for update using (true);
```

**2. Notificações push:**
```sql
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  subscription jsonb not null,
  criado_em timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table push_subscriptions enable row level security;
create policy "owner_all" on push_subscriptions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```
