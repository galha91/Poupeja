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
- Adicionar RESEND_API_KEY como secret no GitHub (para alertas de links quebrados):
  github.com/galha91/Poupeja/settings/secrets/actions

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
