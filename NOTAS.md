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
- Adicionar secrets no GitHub (Settings → Secrets → Actions):
  github.com/galha91/Poupeja/settings/secrets/actions
  - RESEND_API_KEY → para alertas de links quebrados
  - CRON_SECRET   → valor: poupeja-cron-2026-secret  (para notificações push automáticas)

- Configurar notificações push no Vercel (Settings → Environment Variables):
  - NEXT_PUBLIC_VAPID_PUBLIC_KEY  → BAftcbRKMAysEbxLXcMnPajkyHziZKHK8g0o-en_l0TlHi8bMvIZZLb05MHxF4OLgBSk9iv7vpRKY2DXOF7zkfk
  - VAPID_PRIVATE_KEY             → 7zphNchunc6AlZiKz5tfji7V4jMa4moAf1LppPzEXzA
  - VAPID_EMAIL                   → mailto:poupeja.portugal@gmail.com

- Adicionar 2.º cron no cron-job.org para notificação de quinta-feira (lembrete semanal):
  URL: https://xn--poupej-uta.com/api/push-enviar
  Método: POST
  Horário: quinta-feira 09:00 UTC
  Header: Authorization: Bearer poupeja-cron-2026-secret
  Body (JSON):
    { "title": "💰 Já aproveitaste as promoções desta semana?",
      "body": "Os folhetos dos supermercados estão à tua espera. Poupa antes do fim de semana!",
      "url": "/" }

- Criar tabela no Supabase para a partilha de lista de compras:
  Ir ao projeto Supabase → SQL Editor → correr:

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
