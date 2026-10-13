# Ficha da Play Store — textos e respostas prontos

Tudo o que o Play Console vai pedir, já escrito. Copia daqui.

> A declaração de Data Safety foi levantada do código, não de memória, e os
> textos da app foram corrigidos para dizerem o mesmo. Se mexeres no que a
> app recolhe, volta a esta secção antes de submeter.

---

## Recursos gráficos

| | estado |
|---|---|
| Ícone 512×512 | `public/icon-512.png` ✅ |
| **Feature graphic 1024×500** | `assets/play/feature-graphic.png` ✅ *(era obrigatório e faltava)* |
| Screenshots de telemóvel | `public/screenshots/` — 4 × 780×1688 ✅ |
| Política de privacidade | `https://xn--poupej-uta.com/privacidade` ✅ |

O feature graphic é gerado de `assets/play/feature-graphic.html`, que é
auto-suficiente (o porquinho vai em SVG dentro do ficheiro). Para o refazer
depois de uma alteração:

```bash
node -e "
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1024,height:500}});
await p.goto('file://'+process.cwd()+'/assets/play/feature-graphic.html',{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(600);
await p.screenshot({path:'assets/play/feature-graphic.png'}); await b.close();})()"
```

> **Capturas — refazer antes de submeter (13/10/2026).** As de
> `public/screenshots/` são de setembro: o Início já não abre na poupança
> (abre no gasóleo de hoje, "perto de <cidade>") e o modo convidado voltou
> a existir. Tira-as no telemóvel, com preços reais, por esta ordem — é a
> ordem que vende: 1) Início com o gasóleo perto de ti; 2) Comparar preços
> com um resultado (ex.: «azeite»); 3) Lista de compras otimizada; 4)
> Folhetos; 5) Talões e garantias; 6) Leitor de código de barras (depois do
> merge do PR #93). 1080×2400 ou 780×1688, sem barra de notificações.

---

## Textos

### Nome da app (máx. 30)

```
PoupeJá
```

### Descrição curta (máx. 80)

```
Compara preços do supermercado, gasóleo mais barato, folhetos e talões. Grátis.
```

*(79 caracteres. "Sem anúncios" ficou de fora de propósito: a app tem
ligações a lojas e serviços parceiros com comissão, e a Google pode ler isso
como publicidade. As palavras que as pessoas pesquisam na loja — "comparar
preços", "supermercado", "gasóleo", "folhetos" — estão logo aqui: é o texto
que mais pesa na pesquisa da Play Store, a seguir ao nome.)*

### Descrição completa (máx. 4000)

*(O código de barras só existe depois do merge do PR #93; se submeteres antes, tira "— ou aponta a câmara ao código de barras —".)*

```
O PoupeJá junta num só sítio as contas que se fazem todas as semanas em
Portugal: onde fica mais barato o supermercado, onde atestar o carro, e
quanto é que já poupaste. Grátis e sem precisares de criar conta.

COMPARAR PREÇOS NO SUPERMERCADO
Escreve um produto — ou aponta a câmara ao código de barras — e vês onde
está mais barato no Continente, Pingo Doce, Auchan, Aldi e Lidl (no Lidl,
as promoções da semana). Comparamos como se compra: ao kg, ao litro, à
unidade. Nunca inventamos preços: o que não está online, não comparamos.

A LISTA DE COMPRAS QUE DIZ ONDE COMPRAR
Junta os artigos e o PoupeJá diz em que supermercado a lista fica mais
barata, e quanto poupas face ao mais caro. Partilha a lista com a família.

COMBUSTÍVEL AO PREÇO DE HOJE
O gasóleo e a gasolina mais baratos perto de ti, com os preços oficiais
da DGEG. Tens desconto numa marca (cartão de frota, de supermercado, da
empresa)? Diz quanto e a lista ordena pelo preço que pagas mesmo.

FOLHETOS DA SEMANA
Continente, Pingo Doce, Lidl, Auchan, Aldi, Intermarché, E.Leclerc,
Froiz e El Corte Inglés, num só sítio, sem abrires nove apps.

TALÕES E GARANTIAS
Fotografa o talão e o PoupeJá lê o valor poupado. Guarda as garantias
dos aparelhos que compraste e recebe aviso antes de expirarem.

CONTAS DA CASA E APOIOS DO ESTADO
As contas fixas com data de vencimento, os prazos do IRS e do IMI, e os
apoios a que podes ter direito, com o link para o site oficial.

—

Feito em Portugal, para preços portugueses. Funciona logo, sem conta. Se
quiseres os dados noutro telemóvel, crias conta com email ou Google.

O PoupeJá não tem qualquer ligação às cadeias de supermercados nem às
marcas de combustível mencionadas.

FONTES OFICIAIS
O PoupeJá é uma aplicação independente: não é um serviço do Estado nem
está associada a nenhuma entidade pública. A informação oficial que
mostra vem de fontes públicas, e cada valor traz na app o link para o
original:
• Combustíveis — DGEG: https://precoscombustiveis.dgeg.gov.pt
• IRS — Portal das Finanças: https://info.portaldasfinancas.gov.pt
• Euribor — Banco de Portugal: https://bpstat.bportugal.pt
• Apoios — gov.pt e Segurança Social: https://www.gov.pt e https://www.seg-social.pt
Lista completa: https://xn--poupej-uta.com/fontes
```

---

## Segurança dos dados (Data Safety)

Esta secção é uma **declaração** — a Google compara-a com o comportamento da
app e com a política de privacidade. Divergências são motivo de rejeição ou
de remoção posterior.

### O que o código realmente faz

| dado | o que acontece | onde está no código |
|---|---|---|
| **Email** | conta e autenticação | `lib/supabase.js` |
| **Localização aproximada** | (1) a cidade deduzida do IP pelo Vercel, para o gasóleo "perto de"; não é guardada (`pages/api/onde-estou.js`); (2) GPS só quando tocas em "localização exata"; não é guardado | `pages/api/onde-estou.js`, `SecaoMobilidade.jsx`, `EcraInicio.jsx` |
| **Email para avisos semanais** | só se pedires o email de folhetos ou de combustível; guardado (email + concelho) até cancelares | `pages/api/subscrever.js`, `pages/api/subscrever-combustivel.js` |
| **Código de barras** | a imagem da câmara é lida no telemóvel; só o número vai à Open Food Facts para saber o nome do produto; nada é guardado | `LeitorCodigoBarras.jsx` (PR #93) |
| **Fotografia do talão** | **enviada uma vez** para `/api/ler-talao`, que a reencaminha para a **API da Anthropic** para extrair loja, data, total e poupança. Depois fica só no dispositivo — **não é sincronizada** | `SecaoTaloes.jsx`, `pages/api/ler-talao.js`, `lib/sync.js` (`TRANSFORMA.poupeja_taloes`) |
| **Talões guardados (sem a imagem)** | `localStorage` e, com sessão iniciada, sincronizados para o Supabase (`dados_utilizador`) | `lib/sync.js` |
| **Utilização do site** | Google Analytics em todas as páginas | `pages/_document.js` |
| **Passagem para lojas parceiras** | Awin, para atribuição de comissão | `lib/cookies.js` (só após aceitar) |
| **Anúncios** | **nenhuns** — não há AdMob nem adsbygoogle no projeto | verificado |

### Respostas ao formulário

| pergunta | resposta |
|---|---|
| A app recolhe ou partilha dados? | **Sim** |
| Contém anúncios? | **Não** |
| Os dados são encriptados em trânsito? | **Sim** (HTTPS em tudo) |
| O utilizador pode pedir a eliminação dos dados? | **Sim** |
| Link para pedir a eliminação da conta | `https://xn--poupej-uta.com/apagar-conta` |

A app abre sem conta (modo convidado automático), mas permite criar uma, por isso a Google obriga a duas coisas, e as duas existem:
apagar a conta **dentro da app** (Definições → Conta → Apagar conta) e uma
**página web** para o pedir sem a app instalada (`/apagar-conta`). As duas
apagam a conta e, em cascata, todos os dados dela no Supabase.

| tipo de dados | recolhido | partilhado | finalidade |
|---|---|---|---|
| Email | Sim | Não | Gestão de conta; Comunicações (só quem pede o email semanal) |
| Nome | Sim | Não | Gestão de conta |
| IDs de utilizador | Sim | Não | Gestão de conta |
| Localização aproximada | Sim | Não | Funcionalidade da app |
| Fotografias | **Sim** | ver nota | Funcionalidade da app |
| Compras (valores dos talões) | Sim | Não | Funcionalidade da app |
| Interacções na app | Sim | Sim — Google Analytics | Análise |

#### A nota sobre as fotografias

A fotografia **sai do dispositivo** — vai à API da Anthropic para ser lida.
Declara-a como **recolhida: Sim**. Há uma isenção no formulário para dados
tratados de forma efémera (em memória, só o tempo do pedido), mas depende da
política de retenção do fornecedor, e declarar a mais nunca fez rejeitar uma
app — declarar a menos, sim.

Para **partilhada**, existe a isenção de *service provider*: quem trata os
dados por tua conta, sob contrato, não conta como partilha. A Anthropic
encaixa aí. Se preferires não depender dessa leitura, declara **Sim** e
explica a finalidade — não há penalização por ser transparente.

Se quiseres fechar a questão de vez, vê nas definições da tua conta Anthropic
se tens retenção zero activa para a API. Com isso, a isenção de tratamento
efémero fica sem margem para dúvida.

#### As imagens que já lá estão

A app deixou de enviar fotografias, mas as que foram sincronizadas antes
continuam nas linhas `poupeja_taloes` do Supabase. Vão-se embora sozinhas
assim que essa pessoa adicionar ou apagar um talão — a escrita seguinte
substitui a linha pela versão sem imagem. Quem nunca mais mexer nos talões
fica com as antigas lá.

Para as limpar já, no SQL Editor do Supabase:

```sql
-- Confirma primeiro quantas linhas têm imagens
select count(*) from dados_utilizador
where chave = 'poupeja_taloes' and valor::text like '%data:image%';

-- Tira o campo "imagem" de cada talão, deixando o resto intacto
update dados_utilizador
set valor = (
  select jsonb_agg(talao - 'imagem')
  from jsonb_array_elements(valor) as talao
)
where chave = 'poupeja_taloes'
  and jsonb_typeof(valor) = 'array'
  and valor::text like '%data:image%';
```

Não corri isto — são dados de produção e de pessoas, e a decisão é tua.
Corre o `select` primeiro.

---

## Classificação de conteúdo

Questionário curto. Para esta app é tudo **Não**: sem violência, sem conteúdo
sexual, sem linguagem imprópria, sem substâncias, sem jogo a dinheiro, sem
conteúdo gerado por utilizadores partilhado publicamente.

Categoria sugerida: **Finanças** (alternativa defensável: Estilo de vida).

Público-alvo: **18 e mais**. Escolher uma faixa que inclua menores activa as
regras das Famílias, que são mais exigentes e não trazem nada a esta app.

---

## Acesso à app (App access)

A app abre **sem conta** (modo convidado automático, também na app
Android): tudo funciona sem login. Criar conta só serve para ter os dados
noutro telemóvel. Por isso, no Play Console:

1. Escolhe **"Todas as funcionalidades estão disponíveis sem acesso especial"**.
2. Não é preciso conta de teste. *(A secção antiga pedia uma, porque a app
   Android obrigava a entrar — já não é assim. Declarar acesso restrito
   sem o haver só atrasa a revisão.)*

Se um dia a app voltar a exigir conta, cria uma de teste com email e
palavra-passe (ex.: `poupeja.portugal+revisor@gmail.com`) e escolhe
"Algumas funcionalidades estão restritas".

