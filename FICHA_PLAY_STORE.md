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
| Screenshots de telemóvel | `public/screenshots/` — 4 × 780×1688 ⚠️ ver nota |
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

> **Nota sobre os screenshots.** O `inicio.png` mostra o cabeçalho
> *"Boa tarde, Convidado"* e o cartão *"A usar como convidado — cria conta
> grátis"*. É o estado verdadeiro da app sem sessão iniciada, mas numa ficha
> de loja anuncia que quem está a ver não tem conta. Vale a pena recapturar
> esse ecrã com sessão iniciada. Os outros três não têm esse problema.

---

## Textos

### Nome da app (máx. 30)

```
PoupeJá
```

### Descrição curta (máx. 80)

```
Folhetos, combustível e a poupança real dos teus talões.
```

### Descrição completa (máx. 4000)

```
O PoupeJá junta num só sítio as contas que se fazem todas as semanas em
Portugal: quanto custa o supermercado, quanto custa atestar o carro, e
quanto é que já poupaste sem dar por isso.

FOLHETOS DE TODOS OS SUPERMERCADOS
Continente, Pingo Doce, Lidl, Auchan, Aldi, Intermarché, E.Leclerc,
Froiz, El Corte Inglés e mais. Actualizados à segunda-feira, sem teres
de andar a abrir nove apps diferentes.

COMBUSTÍVEL AO PREÇO DE HOJE
Os postos mais baratos perto de ti, com os preços oficiais da DGEG.
Vês a diferença em cêntimos por litro entre o mais barato e os outros,
e a distância a que ficam.

A TUA POUPANÇA, CALCULADA DOS TALÕES
Fotografa o talão e o PoupeJá lê o valor poupado que já lá vem escrito.
Ao fim do mês tens um número real — não uma estimativa — e a comparação
com o mês anterior.

CONTAS E GARANTIAS
As contas da casa com data de vencimento, e as garantias dos aparelhos
que compraste, com aviso antes de expirarem.

APOIOS DO ESTADO
O que existe, a quem se destina e como se pede. Sem linguagem de
Diário da República.

LISTA DE COMPRAS E EMENTAS
A lista organizada por corredor, e ideias de refeições com o que está
em folheto esta semana.

—

Feito em Portugal, para preços portugueses. Funciona no browser e como
app. Podes usar sem criar conta; com conta, os teus dados acompanham-te
entre dispositivos.

Os preços de combustível são os publicados pela DGEG. O PoupeJá não tem
qualquer ligação às cadeias de supermercados nem às marcas de
combustível mencionadas.
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
| **Localização aproximada** | só quando pedes postos perto de ti; não é guardada | `SecaoMobilidade.jsx`, `EcraInicio.jsx` |
| **Fotografia do talão** | **enviada uma vez** para `/api/ler-talao`, que a reencaminha para a **API da Anthropic** para extrair loja, data, total e poupança. Depois fica só no dispositivo — **não é sincronizada** | `SecaoTaloes.jsx`, `pages/api/ler-talao.js`, `lib/sync.js` (`TRANSFORMA.poupeja_taloes`) |
| **Talões guardados (sem a imagem)** | `localStorage` e, com sessão iniciada, sincronizados para o Supabase (`dados_utilizador`) | `lib/sync.js` |
| **Utilização do site** | Google Analytics em todas as páginas | `pages/_document.js` |
| **Passagem para lojas parceiras** | Awin, para atribuição de comissão | `pages/_document.js:67` |
| **Anúncios** | **nenhuns** — não há AdMob nem adsbygoogle no projeto | verificado |

### Respostas ao formulário

| pergunta | resposta |
|---|---|
| A app recolhe ou partilha dados? | **Sim** |
| Contém anúncios? | **Não** |
| Os dados são encriptados em trânsito? | **Sim** (HTTPS em tudo) |
| O utilizador pode pedir a eliminação dos dados? | **Sim** |

| tipo de dados | recolhido | partilhado | finalidade |
|---|---|---|---|
| Email | Sim | Não | Gestão de conta |
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

O Play Console pergunta se há partes da app atrás de login. Resposta:
**a app é utilizável sem credenciais** — o modo convidado dá acesso a
folhetos, combustíveis, apoios e receitas. Só a sincronização entre
dispositivos exige conta. Vale a pena escrever exactamente isto na caixa de
instruções, para o revisor não ficar bloqueado à procura de uma conta de
teste.
