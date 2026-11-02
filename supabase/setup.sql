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

-- Convidados (sem conta) também ativam notificações: user_id fica null e só
-- recebem os avisos gerais. Um registo por browser sem conta.
alter table public.push_subscriptions alter column user_id drop not null;
create unique index if not exists push_subscriptions_sem_conta_uq
  on public.push_subscriptions (endpoint) where user_id is null;

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
-- Uma linha só, reescrita uma vez por dia pelo /api/cron-precos.
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

-- ─────────────────────────────────────────────────────────────
-- Histórico do "Comparar preços": melhor preço por pesquisa, loja e dia.
-- Só o servidor escreve e lê (service role); sem políticas públicas.
-- (Aplicada em produção como migração criar_precos_supermercado_historico.)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.precos_supermercado_historico (
  q        text        not null,
  dia      date        not null,
  loja     text        not null,
  modo     text        not null default 'unidade',
  unidade  text,
  valor    numeric(10,2) not null,
  preco    numeric(10,2),
  produto  text,
  atualizado_em timestamptz not null default now(),
  primary key (q, dia, loja)
);
alter table public.precos_supermercado_historico enable row level security;
create index if not exists precos_supermercado_historico_q_dia on public.precos_supermercado_historico (q, dia desc);

-- ─────────────────────────────────────────────────────────────
-- Resumo diário dos combustíveis (DGEG): média e mínimo por combustível,
-- para o país, cada marca, cada distrito e cada concelho. Serve a página
-- "Combustíveis esta semana" e o gráfico de 30 dias de distritos/concelhos.
-- escopo: 'pais' | 'marca' | 'distrito' | 'concelho'; chave: '*' para o
-- país, a marca em minúsculas, ou o slug do distrito/concelho.
-- Só o servidor escreve e lê (service role); sem políticas públicas.
-- (Migração criar_precos_dgeg_diario.)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.precos_dgeg_diario (
  dia     date          not null,
  tipo    text          not null,
  escopo  text          not null check (escopo in ('pais','marca','distrito','concelho')),
  chave   text          not null,
  nome    text          not null,
  media   numeric(6,3)  not null,
  minimo  numeric(6,3)  not null,
  n       integer       not null,
  atualizado_em timestamptz not null default now(),
  primary key (dia, tipo, escopo, chave)
);
alter table public.precos_dgeg_diario enable row level security;
create index if not exists precos_dgeg_diario_serie on public.precos_dgeg_diario (escopo, chave, tipo, dia desc);
create index if not exists precos_dgeg_diario_dia on public.precos_dgeg_diario (dia desc);

-- ── Convidados do site ──────────────────────────────────────────────────────
-- Uma linha por browser que entrou no modo convidado (id aleatório guardado
-- no localStorage). Só a API (service role) escreve/lê — sem policies.
create table if not exists public.convidados_site (
  id           uuid primary key,
  primeira_em  timestamptz not null default now(),
  ultima_em    timestamptz not null default now(),
  aberturas    integer not null default 1,
  converteu_em timestamptz
);

alter table public.convidados_site enable row level security;

create or replace function public.registar_convidado(p_id uuid, p_converteu boolean default false)
returns void language sql security definer set search_path = public as $$
  insert into public.convidados_site (id, converteu_em)
  values (p_id, case when p_converteu then now() end)
  on conflict (id) do update set
    ultima_em    = now(),
    aberturas    = convidados_site.aberturas + case when p_converteu then 0 else 1 end,
    converteu_em = coalesce(convidados_site.converteu_em, case when p_converteu then now() end);
$$;

revoke all on function public.registar_convidado(uuid, boolean) from public, anon, authenticated;

-- ── Subscritores do resumo de folhetos (sem conta) ──────────────────────────
-- Quem deixa o email nas páginas públicas para receber os folhetos de
-- segunda-feira, sem criar conta. Só a API (service role) lê/escreve.
create table if not exists public.subscritores_folhetos (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  origem       text,
  criado_em    timestamptz not null default now(),
  cancelado_em timestamptz
);

create unique index if not exists subscritores_folhetos_email_uq
  on public.subscritores_folhetos (lower(email));

alter table public.subscritores_folhetos enable row level security;

-- ── Subscritores do email de combustível (sem conta) ────────────────────────
-- Um email por semana (segundas) com o combustível mais barato do concelho
-- escolhido. Guarda os últimos preços enviados para o email dizer se subiu
-- ou desceu. Só a API (service role) lê/escreve — sem policies.
create table if not exists public.subscritores_combustivel (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  concelho        text not null,
  criado_em       timestamptz not null default now(),
  cancelado_em    timestamptz,
  ultimo_envio    timestamptz,
  ultimo_gasoleo  numeric,
  ultima_gasolina numeric
);

create unique index if not exists subscritores_combustivel_uq
  on public.subscritores_combustivel (lower(email), concelho);

alter table public.subscritores_combustivel enable row level security;

-- Alerta de subida (sexta-feira): segundo consentimento, opcional.
alter table public.subscritores_combustivel
  add column if not exists alerta_subidas boolean not null default false;

-- ── Previsão semanal dos combustíveis ───────────────────────────────────────
-- Uma linha por semana já tratada pelo /api/cron-previsao-combustiveis
-- (impede um segundo alerta na mesma semana). semana = a segunda-feira.
create table if not exists public.previsoes_combustivel (
  semana         date primary key,
  gasoleo_cent   numeric,
  gasolina_cent  numeric,
  fontes         jsonb not null default '[]',
  resumo         text,
  alerta_enviado boolean not null default false,
  enviados       integer not null default 0,
  push_enviados  integer not null default 0,
  criado_em      timestamptz not null default now()
);

alter table public.previsoes_combustivel enable row level security;

-- ── Contador de visitas sem cookies ─────────────────────────────────────────
-- Páginas vistas por dia/página/origem + visitantes diários. O hash do
-- visitante muda todos os dias e é apagado no fim do dia; só fica a contagem.
-- Só a API (service role) lê/escreve — sem policies.
create table if not exists public.visitas_dia (
  dia     date not null,
  caminho text not null,
  origem  text not null,
  n       integer not null default 0,
  primary key (dia, caminho, origem)
);
create table if not exists public.visitas_unicos (
  dia date primary key,
  n   integer not null default 0
);
create table if not exists public.visitas_hash (
  dia date not null,
  h   text not null,
  primary key (dia, h)
);
alter table public.visitas_dia enable row level security;
alter table public.visitas_unicos enable row level security;
alter table public.visitas_hash enable row level security;

create or replace function public.registar_visita(p_caminho text, p_origem text, p_hash text)
returns void language sql security definer set search_path = public as $fn$
  delete from public.visitas_hash where dia < (now() at time zone 'Europe/Lisbon')::date;
  insert into public.visitas_dia (dia, caminho, origem, n)
  values ((now() at time zone 'Europe/Lisbon')::date, p_caminho, p_origem, 1)
  on conflict (dia, caminho, origem) do update set n = visitas_dia.n + 1;
  with novo as (
    insert into public.visitas_hash (dia, h)
    values ((now() at time zone 'Europe/Lisbon')::date, p_hash)
    on conflict do nothing returning dia
  )
  insert into public.visitas_unicos (dia, n)
  select dia, 1 from novo
  on conflict (dia) do update set n = visitas_unicos.n + 1;
$fn$;

revoke all on function public.registar_visita(text, text, text) from public, anon, authenticated;

-- Perfil anónimo por dia: distrito, tipo de aparelho, modo (browser/PWA/app) e
-- novo/recorrente. Conta-se uma vez por visitante-dia (só quando o hash é novo)
-- e não fica ligado ao hash nem à página.
create table if not exists public.visitas_perfil (
  dia      date not null,
  dimensao text not null,
  valor    text not null,
  n        integer not null default 0,
  primary key (dia, dimensao, valor)
);
alter table public.visitas_perfil enable row level security;

create or replace function public.registar_visita(
  p_caminho text, p_origem text, p_hash text,
  p_regiao text, p_dispositivo text,
  p_modo text, p_recorrencia text
)
returns void language sql security definer set search_path = public as $fn$
  delete from public.visitas_hash where dia < (now() at time zone 'Europe/Lisbon')::date;
  insert into public.visitas_dia (dia, caminho, origem, n)
  values ((now() at time zone 'Europe/Lisbon')::date, p_caminho, p_origem, 1)
  on conflict (dia, caminho, origem) do update set n = visitas_dia.n + 1;
  with novo as (
    insert into public.visitas_hash (dia, h)
    values ((now() at time zone 'Europe/Lisbon')::date, p_hash)
    on conflict do nothing returning dia
  ), perfil as (
    insert into public.visitas_perfil (dia, dimensao, valor, n)
    select novo.dia, t.d, t.v, 1
    from novo, (values ('regiao', p_regiao), ('dispositivo', p_dispositivo),
                       ('modo', p_modo), ('recorrencia', p_recorrencia)) as t(d, v)
    where t.v is not null
    on conflict (dia, dimensao, valor) do update set n = visitas_perfil.n + 1
  )
  insert into public.visitas_unicos (dia, n)
  select dia, 1 from novo
  on conflict (dia) do update set n = visitas_unicos.n + 1;
$fn$;

revoke all on function public.registar_visita(text, text, text, text, text, text, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Reduflação: cada tamanho de embalagem visto por produto (loja + id).
-- Quando o mesmo produto aparece com menos quantidade e o preço ao kg
-- sobe, o "Comparar preços" avisa (lib/reduflacao). primeiro_dia entra
-- pelo default e o upsert nunca o envia, por isso não muda.
-- Só o servidor escreve e lê (service role); sem políticas públicas.
-- (Migração criar_produtos_embalagem.)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.produtos_embalagem (
  loja         text          not null,
  produto_id   text          not null,
  qtd          numeric(10,3) not null,
  unidade      text          not null,
  preco        numeric(10,2) not null,
  nome         text,
  primeiro_dia date          not null default (now() at time zone 'Europe/Lisbon')::date,
  ultimo_dia   date          not null,
  primary key (loja, produto_id, qtd)
);
alter table public.produtos_embalagem enable row level security;
create index if not exists produtos_embalagem_produto on public.produtos_embalagem (produto_id);

-- Só os produtos com mais de um tamanho, para a página /reduflacao.
-- security_invoker + sem grants: só o service role a lê.
-- (Migração vista_embalagem_mudancas.)
create or replace view public.produtos_embalagem_mudancas
with (security_invoker = true) as
select e.*
from public.produtos_embalagem e
where exists (
  select 1 from public.produtos_embalagem o
  where o.loja = e.loja and o.produto_id = e.produto_id and o.qtd <> e.qtd
);
revoke all on public.produtos_embalagem_mudancas from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Percurso do convidado: o que fez antes de criar conta (ou de sair).
-- Cada marco guarda a primeira vez que aconteceu, para o funil do /admin:
-- entrou → comparou a lista → escolheu onde comprar → ligou o sino →
-- tocou em "criar conta" → criou conta. Sem dados pessoais, só datas.
-- (Migração percurso_convidado.)
-- ─────────────────────────────────────────────────────────────
alter table public.convidados_site
  add column if not exists comparou_em    timestamptz,
  add column if not exists escolheu_em    timestamptz,
  add column if not exists alerta_em      timestamptz,
  add column if not exists pediu_conta_em timestamptz;

create or replace function public.marcar_convidado(p_id uuid, p_marco text)
returns void language sql security definer set search_path = public as $$
  update public.convidados_site set
    comparou_em    = case when p_marco = 'comparou'    then coalesce(comparou_em, now())    else comparou_em end,
    escolheu_em    = case when p_marco = 'escolheu'    then coalesce(escolheu_em, now())    else escolheu_em end,
    alerta_em      = case when p_marco = 'alerta'      then coalesce(alerta_em, now())      else alerta_em end,
    pediu_conta_em = case when p_marco = 'pediu_conta' then coalesce(pediu_conta_em, now()) else pediu_conta_em end
  where id = p_id;
$$;

revoke all on function public.marcar_convidado(uuid, text) from public, anon, authenticated;

-- ── Preços lidos nos talões (2026-10-20) ────────────────────────────────────
-- Linhas de artigos dos talões fotografados (loja, artigo, preço, data), sem
-- a foto, sem quem a tirou e sem o cabeçalho. Dão os preços de loja que não
-- estão online (sortido fixo do Lidl, Mercadona). Só a API (service role).
create table if not exists public.precos_talao (
  id            bigserial primary key,
  loja          text not null,
  nome          text not null,
  nome_busca    text not null,
  preco         numeric not null,
  preco_unidade numeric,
  unidade       text,
  ao_peso       boolean not null default false,
  data          date not null,
  criado_em     timestamptz not null default now(),
  unique (loja, nome_busca, data, preco)
);
create index if not exists precos_talao_loja_data on public.precos_talao (loja, data desc);
alter table public.precos_talao enable row level security;

-- ── Catálogos lidos de noite (2026-10-20) ───────────────────────────────────
-- Cópia dos preços das lojas cuja pesquisa não se pode usar no momento mas
-- cujas páginas de categoria se podem ler (hoje, o El Corte Inglés; ver
-- /api/cron-catalogo-eci). O cursor guarda onde a leitura da noite vai.
-- Só a API (service role).
create table if not exists public.catalogo_precos (
  loja          text not null,
  id            text not null,
  nome          text not null,
  nome_busca    text not null,
  preco         numeric not null,
  preco_antigo  numeric,
  preco_unidade numeric,
  unidade       text,
  quantidade    text,
  ao_peso       boolean not null default false,
  url           text,
  imagem        text,
  visto_em      date not null,
  primary key (loja, id)
);
create index if not exists catalogo_precos_loja_visto on public.catalogo_precos (loja, visto_em);
alter table public.catalogo_precos enable row level security;

create table if not exists public.catalogo_cursor (
  loja           text primary key,
  dia            date not null,
  seccao         int not null default 0,
  pagina         int not null default 1,
  total_paginas  int,
  concluido      boolean not null default false,
  produtos       int not null default 0,
  erro           text,
  atualizado_em  timestamptz not null default now()
);
alter table public.catalogo_cursor enable row level security;

-- ── Produtos de marca (páginas /produto e /marca, ver lib/seoMarcas) ──
-- Cada pesquisa (app ou cron) guarda os produtos de marcas nacionais com
-- tamanho conhecido. Só a service role lê e escreve (RLS sem políticas).
create table if not exists public.produtos_marca (
  loja         text          not null,
  produto_id   text          not null,
  q            text          not null,
  nome         text          not null,
  marca        text          not null,
  marca_slug   text          not null,
  qtd          numeric(10,3),
  unidade      text,
  preco        numeric(10,2) not null,
  valor        numeric(10,2),
  imagem       text,
  url          text,
  primeiro_dia date          not null default (now() at time zone 'Europe/Lisbon')::date,
  ultimo_dia   date          not null,
  primary key (loja, produto_id)
);
alter table public.produtos_marca enable row level security;
create index if not exists produtos_marca_marca on public.produtos_marca (marca_slug);
create index if not exists produtos_marca_ultimo on public.produtos_marca (ultimo_dia);

create table if not exists public.produtos_marca_dia (
  loja       text          not null,
  produto_id text          not null,
  dia        date          not null,
  preco      numeric(10,2) not null,
  valor      numeric(10,2),
  primary key (loja, produto_id, dia)
);
alter table public.produtos_marca_dia enable row level security;
create index if not exists produtos_marca_dia_dia on public.produtos_marca_dia (dia);

-- ── Métricas de produto sem cookies (2026-11-02) ────────────────────────────
-- Para o /admin: que funcionalidades se usam, o que se pesquisa (e não se
-- encontra), erros no browser e velocidade das páginas (Core Web Vitals).
-- Só contagens por dia — nunca um id de pessoa, IP ou URL completo.
-- Validação em lib/metricas.js; escrita só pela API (service role).
-- (Migração metricas_dia.)
create table if not exists public.metricas_dia (
  dia     date    not null,
  tipo    text    not null,               -- evento | pesquisa | pesquisa_vazia | erro | vital
  chave   text    not null,               -- nome do evento, termo, página ou métrica
  detalhe text    not null default '',    -- variante, mensagem de erro ou página
  n       integer not null default 0,
  soma    double precision not null default 0, -- só vitais: soma dos valores (média = soma / n)
  bons    integer not null default 0,     -- só vitais: quantos ficaram dentro do limite "bom"
  primary key (dia, tipo, chave, detalhe)
);
alter table public.metricas_dia enable row level security;
create index if not exists metricas_dia_tipo on public.metricas_dia (tipo, dia);

create or replace function public.registar_metricas(p_itens jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.metricas_dia (dia, tipo, chave, detalhe, n, soma, bons)
  select (now() at time zone 'Europe/Lisbon')::date, i.tipo, i.chave, coalesce(i.detalhe, ''),
         count(*), coalesce(sum(i.valor), 0), count(*) filter (where i.bom)
  from jsonb_to_recordset(p_itens) as i(tipo text, chave text, detalhe text, valor double precision, bom boolean)
  group by i.tipo, i.chave, coalesce(i.detalhe, '')
  on conflict (dia, tipo, chave, detalhe) do update set
    n    = metricas_dia.n + excluded.n,
    soma = metricas_dia.soma + excluded.soma,
    bons = metricas_dia.bons + excluded.bons;
$$;

revoke all on function public.registar_metricas(jsonb) from public, anon, authenticated;

-- Último resultado da verificação diária de "Comparar preços", por loja
-- (pages/api/cron-saude-precos.js). O /admin mostra-o sem ir aos sites.
create table if not exists public.saude_precos (
  loja            text primary key,
  nome            text not null,
  ok              boolean not null,
  erro            text,
  detalhes        jsonb,
  verificado_em   timestamptz not null default now(),
  ultimo_ok_em    timestamptz,
  falhas_seguidas integer not null default 0
);
alter table public.saude_precos enable row level security;

-- ── Admin: origem dos convidados, notas e metas (2026-11-02) ────────────────
-- Origem e campanha do primeiro toque de cada convidado (de onde veio da
-- primeira vez: google, instagram, "ig-reel-azeite"…), para medir a retenção
-- por canal e por publicação. Só se grava quando o convidado é novo.
-- (Migração admin_crescimento.)
alter table public.convidados_site
  add column if not exists origem   text,
  add column if not exists campanha text;

-- Versão com origem e campanha. Os 4 argumentos são obrigatórios para não
-- colidir com registar_convidado(uuid, boolean), que continua a existir.
create or replace function public.registar_convidado(
  p_id uuid, p_converteu boolean, p_origem text, p_campanha text
)
returns void language sql security definer set search_path = public as $$
  insert into public.convidados_site (id, converteu_em, origem, campanha)
  values (p_id, case when p_converteu then now() end, p_origem, p_campanha)
  on conflict (id) do update set
    ultima_em    = now(),
    aberturas    = convidados_site.aberturas + case when p_converteu then 0 else 1 end,
    converteu_em = coalesce(convidados_site.converteu_em, case when p_converteu then now() end);
$$;
revoke all on function public.registar_convidado(uuid, boolean, text, text) from public, anon, authenticated;

-- Notas do /admin: publicações e mudanças, marcadas nos gráficos.
create table if not exists public.admin_notas (
  id        uuid primary key default gen_random_uuid(),
  dia       date not null,
  texto     text not null,
  campanha  text,
  criado_em timestamptz not null default now()
);
alter table public.admin_notas enable row level security;

-- Configuração do /admin (para já: metas semanais).
create table if not exists public.admin_config (
  chave         text primary key,
  valor         jsonb not null,
  atualizado_em timestamptz not null default now()
);
alter table public.admin_config enable row level security;

-- ── Alertas de preço por email, sem conta (2026-11-02) ──────────────────────
-- O convidado escreve o email no alerta do "Comparar preços" (consentimento
-- explícito); o cron-alertas-email verifica uma vez por dia. Cada email traz
-- link para cancelar. convidado_id liga o email ao convidado do site, para o
-- /admin ver de onde veio e o que fez (o email é dado por ele, com consentimento).
-- (Migração alertas_email.)
create table if not exists public.alertas_email (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,
  q                text not null,
  tipo             text not null default 'alvo',   -- alvo | vigiar
  alvo             numeric,
  referencia       numeric not null,
  unidade          text not null,
  modo             text not null default 'unidade',
  promo_na_criacao boolean not null default false,
  convidado_id     uuid,
  criado_em        timestamptz not null default now(),
  cancelado_em     timestamptz,
  ultimo_aviso     jsonb,
  avisos           integer not null default 0
);
create unique index if not exists alertas_email_ativo_uq
  on public.alertas_email (lower(email), q) where cancelado_em is null;
create index if not exists alertas_email_convidado on public.alertas_email (convidado_id);
alter table public.alertas_email enable row level security;

-- O mesmo elo nos emails de folhetos e de combustível sem conta.
alter table public.subscritores_folhetos    add column if not exists convidado_id uuid;
alter table public.subscritores_combustivel add column if not exists convidado_id uuid;

-- Marco "deixou email" no percurso do convidado.
alter table public.convidados_site add column if not exists email_em timestamptz;

-- ── Lembrete do dia das compras, por email, sem conta (2026-11-02) ─────────
-- A pessoa escolhe o dia (1 = segunda … 7 = domingo); nessa manhã recebe a
-- lista e um botão para comparar. Um lembrete ativo por email.
-- (Migração lembretes_compras.)
create table if not exists public.lembretes_compras (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  dia          smallint not null check (dia between 1 and 7),
  itens        jsonb not null default '[]'::jsonb,
  convidado_id uuid,
  criado_em    timestamptz not null default now(),
  cancelado_em timestamptz,
  ultimo_envio date,
  envios       integer not null default 0
);
create unique index if not exists lembretes_compras_ativo_uq
  on public.lembretes_compras (lower(email)) where cancelado_em is null;
create index if not exists lembretes_compras_dia on public.lembretes_compras (dia) where cancelado_em is null;
alter table public.lembretes_compras enable row level security;

-- ── Tarefas automáticas e opinião (2026-11-02) ──────────────────────────────
-- Última execução de cada cron (lib/cronRegisto.js), para o /admin mostrar
-- o que correu, quando, e o que falhou. (Migração tarefas_feedback.)
create table if not exists public.cron_execucoes (
  nome            text primary key,
  ultima_em       timestamptz not null default now(),
  ok              boolean not null,
  duracao_ms      integer,
  resumo          text,
  erro            text,
  ultimo_ok_em    timestamptz,
  falhas_seguidas integer not null default 0,
  execucoes       integer not null default 0
);
alter table public.cron_execucoes enable row level security;

create or replace function public.registar_cron(p_nome text, p_ok boolean, p_duracao integer, p_resumo text, p_erro text)
returns void language sql security definer set search_path = public as $$
  insert into public.cron_execucoes (nome, ultima_em, ok, duracao_ms, resumo, erro, ultimo_ok_em, falhas_seguidas, execucoes)
  values (p_nome, now(), p_ok, p_duracao, p_resumo, p_erro, case when p_ok then now() end, case when p_ok then 0 else 1 end, 1)
  on conflict (nome) do update set
    ultima_em       = now(),
    ok              = p_ok,
    duracao_ms      = p_duracao,
    resumo          = p_resumo,
    erro            = p_erro,
    ultimo_ok_em    = case when p_ok then now() else cron_execucoes.ultimo_ok_em end,
    falhas_seguidas = case when p_ok then 0 else cron_execucoes.falhas_seguidas + 1 end,
    execucoes       = cron_execucoes.execucoes + 1;
$$;
revoke all on function public.registar_cron(text, boolean, integer, text, text) from public, anon, authenticated;

-- "Isto foi útil?" depois de comparar a lista. Sem id de pessoa: só o dia,
-- a resposta e, se a pessoa quiser, uma frase.
create table if not exists public.feedback_app (
  id        uuid primary key default gen_random_uuid(),
  dia       date not null default ((now() at time zone 'Europe/Lisbon')::date),
  contexto  text not null,
  util      boolean not null,
  texto     text,
  criado_em timestamptz not null default now()
);
create index if not exists feedback_app_dia on public.feedback_app (dia);
alter table public.feedback_app enable row level security;
