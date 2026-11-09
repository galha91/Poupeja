# PoupeJá: regras para não rebentar os planos grátis

O site corre na Vercel (plano Hobby) e no Supabase (plano grátis). Em
novembro de 2026 rebentou os dois: a conta Vercel foi pausada (402) e o
Supabase passou dos 30 GB de tráfego num mês. Estas regras existem para isso
não voltar a acontecer. Lê-as antes de mexer em páginas, APIs ou crons.

## Orçamentos (por mês, com margem)

| Recurso | Limite grátis | Orçamento diário |
|---|---|---|
| Vercel Fluid Active CPU | 4 h | ≤ 5 min (limite ≈ 8 min) |
| Vercel ISR Writes | 200 mil | ≤ 5 mil |
| Vercel Function Invocations | 1 milhão | ≤ 25 mil |
| Vercel CDN Requests | 1 milhão | ≤ 25 mil |
| Vercel Deployment Storage | 10 GB | retenção de 1 semana (preview) |
| Supabase egress (tráfego de saída) | 5,5 GB | ≤ 150 MB |
| Supabase base de dados | 500 MB | — |

O Hobby da Vercel é só para uso não comercial; o site tem links de
afiliados. Se começar a dar rendimento a sério, o Pro é o plano certo.

## Regras

1. **Nada pesado por pedido.** Nenhuma página (`getStaticProps`,
   `getServerSideProps`) ou rota `/api` lê tabelas grandes ou agrega o
   catálogo. Se uma página precisa de dados derivados de muitas linhas,
   esses dados são **pré-calculados no GitHub** e guardados prontos numa
   tabela; a página lê só a sua linha. Padrão: `lib/paginasMarca.js`
   (leitura) + `lib/paginasMarcaGerar.js` (geração) + tabela
   `paginas_marca`.
2. **Trabalho pesado corre no GitHub Actions, não na Vercel.** Scraping,
   agregações, geração de páginas: uma rota em `pages/api/cron-*.js`
   protegida pelo `CRON_SECRET`, corrida pelo `scripts/cron/correr.mjs`, e
   registada em `lib/cronsGithub.js` (o workflow
   `.github/workflows/historico-precos.yml` acorda de hora a hora e faz a
   tarefa em falta). Num repositório público os minutos são grátis.
   O agendador do GitHub não é fiável (chegou a parar 15 h): quem acorda o
   workflow de hora a hora é o pg_cron do Supabase
   (`chamar_planeador_github`, token no Vault como `github_dispatch`).
3. **ISR longo.** Páginas com dados que mudam uma vez por dia: `revalidate`
   de 6 h a 24 h. Páginas no servidor (`getServerSideProps`): cache na CDN
   (`s-maxage`), ver `lib/cacheCombustivel.js`.
4. **Memória por instância.** Leituras repetidas do mesmo dado (snapshot
   dos combustíveis, resumos de preços) ficam em memória horas, não
   minutos.
5. **Poucos deploys.** Cada deploy de produção apaga a cache ISR e todas as
   páginas regeneram na visita seguinte (pico de CPU). Junta as alterações.
   O `ignoreCommand` do `vercel.json` salta o build quando só mudam
   `.github`, `*.md`, `docs`, `tests`, `scripts/cron` ou `supabase`.
6. **Bots.** Os de treino de IA e de SEO estão bloqueados em
   `data/bots-bloqueados.json` (usado no `next.config.js` e no
   `public/robots.txt`). **Nunca** bloquear motores de pesquisa (Google,
   Bing, Apple…) nem os bots de pesquisa das IAs (OAI-SearchBot,
   ChatGPT-User, PerplexityBot, Claude-SearchBot, Claude-User): os testes em
   `tests/robots.test.mjs` garantem isso.
7. **Não depender do Pro.** Nada que só exista no plano pago (funções acima
   de 300 s, mais regras de firewall, etc.).

## Onde ver o consumo

- **Supabase:** tabela `consumo_supabase` (bytes por tabela e por dia, contados
  por `lib/consumoSupabase.js` no cliente admin). O `cron-resumo-admin`
  manda email quando um dia passa de 150 MB ou o mês se aproxima dos 5 GB.
- **Tarefas automáticas:** `/admin` → Qualidade → Tarefas automáticas
  (tabela `cron_execucoes`).
- **Vercel:** painel → Usage (Fluid Active CPU, ISR Writes) e, no Pro,
  Observability → Functions (invocações e CPU por rota).
