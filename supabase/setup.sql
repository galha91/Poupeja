-- Tabela de sincronização de dados do utilizador (talões, lista, prefs…)
-- Correr uma vez no Supabase: Dashboard → SQL Editor → New query → colar → Run

create table if not exists public.dados_utilizador (
  user_id       uuid not null references auth.users (id) on delete cascade,
  chave         text not null,
  valor         jsonb,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, chave)
);

alter table public.dados_utilizador enable row level security;

-- Cada utilizador só vê e altera os seus próprios dados
create policy "proprios dados - select"
  on public.dados_utilizador for select
  using (auth.uid() = user_id);

create policy "proprios dados - insert"
  on public.dados_utilizador for insert
  with check (auth.uid() = user_id);

create policy "proprios dados - update"
  on public.dados_utilizador for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "proprios dados - delete"
  on public.dados_utilizador for delete
  using (auth.uid() = user_id);

-- ── Push Notifications ──────────────────────────────────────────────────────
-- Correr no Supabase: Dashboard → SQL Editor → New query → colar → Run

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  endpoint    text not null,
  subscription jsonb not null,
  criado_em   timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

-- O utilizador gere as suas próprias subscrições
create policy "push - select"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "push - insert"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "push - delete"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- ── Preços dos combustíveis (snapshot da DGEG) ──────────────────────────────
-- Correr no Supabase: Dashboard → SQL Editor → New query → colar → Run
--
-- Uma linha só, reescrita de hora a hora pelo /api/cron-precos.
--
-- Existe para que a frescura NÃO dependa do tráfego nem de qual instância
-- serverless apanhou o pedido: cada instância tinha a sua própria cache em
-- memória, e uma instância fria com a DGEG em baixo não tinha nada para
-- mostrar, mesmo que os dados estivessem bons cinco minutos antes.
--
-- Guarda também a data que a própria DGEG dá aos preços, quando a dá, para
-- as páginas poderem dizer a que dia os preços se referem em vez de só
-- dizerem quando é que nós fomos buscá-los.

create table if not exists public.precos_dgeg (
  id          text primary key default 'dgeg',
  postos      jsonb       not null,
  n_postos    integer     not null default 0,
  obtido_em   timestamptz not null,
  data_preco  timestamptz,
  atualizado_em timestamptz not null default now(),
  constraint precos_dgeg_linha_unica check (id = 'dgeg')
);

alter table public.precos_dgeg enable row level security;

-- Sem policies de propósito: só a service role (server-side) lê e escreve.
-- Os preços chegam ao utilizador pelas páginas, nunca por acesso directo.
