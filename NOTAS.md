# Notas — tarefas para fazer no PC

## ⚠️ PENDENTE — Segurança (fazer assim que possível)

### 1. Rodar o CRON_SECRET (já estava pendente)
O `CRON_SECRET` antigo esteve exposto no repositório público. Foi gerado um novo
(valor guardado no chat com o assistente — NÃO escrever aqui). Falta aplicá-lo:
1. Vercel → Settings → Environment Variables → editar `CRON_SECRET` com o valor novo
2. cron-job.org → nos 2 crons (email + push) → header `Authorization: Bearer <novo>`
3. Test Run em ambos → confirmar 200

### 2. Fechar o acesso anónimo às listas partilhadas (Supabase → SQL Editor)
A API já passou a usar a service role. Falta remover as políticas públicas para
que ninguém consiga ler/despejar a tabela diretamente com a chave anónima:
```sql
drop policy if exists "public_select" on listas_partilhadas;
drop policy if exists "public_insert" on listas_partilhadas;
drop policy if exists "public_update" on listas_partilhadas;
-- RLS continua ativo; sem políticas, a chave anónima deixa de aceder.
-- A API (service role) continua a funcionar normalmente.
```

### 3. (Recomendado) Segredo dedicado para os tokens de cancelamento
No Vercel, adicionar `UNSUBSCRIBE_SECRET` com um valor aleatório próprio. Assim,
rodar o `CRON_SECRET` no futuro não invalida os links de cancelamento já enviados.
Se não for definido, o código usa o `CRON_SECRET` (já não há fallback público).

## ✅ Política de Privacidade — FEITO
A página `/privacidade` foi reescrita para refletir a realidade (Supabase na UE,
emails via Resend, notificações push, listas partilhadas) e está conforme o RGPD.

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

| Nome | Onde obter o valor |
|------|--------------------|
| `CRON_SECRET` | segredo privado — ver no painel do Vercel (NÃO guardar aqui) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | chave pública VAPID — ver no painel do Vercel |
| `VAPID_PRIVATE_KEY` | segredo privado — ver no painel do Vercel (NÃO guardar aqui) |
| `VAPID_EMAIL` | mailto:poupeja.portugal@gmail.com |
| `RESEND_API_KEY` | segredo privado — ver no painel do Vercel / resend.com |

> ⚠️ Nunca colocar segredos (CRON_SECRET, VAPID_PRIVATE_KEY, RESEND_API_KEY) neste
> ficheiro — o repositório é público. Os valores vivem só no Vercel/cron-job.org.

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
- Header: `Authorization: Bearer <CRON_SECRET>` (valor igual ao do Vercel)
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
