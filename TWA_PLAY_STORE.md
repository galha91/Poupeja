# Publicar o PoupeJá na Play Store (TWA)

## Porque TWA e não Capacitor

O `capacitor.config.json` tem `server.url` a apontar para `https://xn--poupej-uta.com`.
Isso faz da app uma **janela para o site**: a WebView carrega o site ao vivo e mais
nada. É o padrão que a política *Spam and Minimum Functionality* da Google rejeita
— apps cuja função é carregar um website dentro de uma WebView.

A **Trusted Web Activity** faz a mesma coisa de forma que a Google aceita, porque é
o caminho que a própria Google criou para PWAs:

- abre o site em ecrã inteiro, sem barra de browser nem aviso de "página web"
- usa o Chrome instalado no telemóvel, não uma WebView empacotada
- exige prova de que és dono do domínio (Digital Asset Links), e é essa prova que
  a distingue de um wrapper qualquer

O Capacitor continua a fazer falta se um dia precisares de coisas nativas a sério
(câmara com acesso directo, widgets, background sync). Hoje não precisas: a app
usa geolocalização e ficheiros, que o browser já dá.

## O que já está feito no repositório

| | |
|---|---|
| `public/.well-known/assetlinks.json` | criado, servido em `/.well-known/assetlinks.json` (verificado em produção: 200, `application/json`) |
| `public/manifest.json` | ícones 192/512 maskable, `display: standalone`, `start_url`, **4 screenshots** |
| `public/screenshots/` | 780×1688, geradas dos ecrãs reais |
| `/privacidade` | existe — a Play Store exige uma política pública |
| `assets/icon-only.png`, `assets/splash.png` | prontos, se um dia precisares de gerar recursos à mão |

O `assetlinks.json` tem de ter a impressão digital do certificado que **assina a
app que chega ao telemóvel**. Com o Play App Signing essa chave é da Google, não
tua — ver [A impressão digital certa](#a-impressão-digital-certa), mais abaixo.
É o passo que mais facilmente fica errado, e errado não dá erro nenhum: a app
abre na mesma, só que com a barra do Chrome.

## Opção A — PWABuilder (sem instalar nada, dá para fazer do telemóvel)

É o caminho recomendado aqui: nada para instalar, corre no browser.

### 1. Gerar o pacote

1. Abre **[pwabuilder.com](https://www.pwabuilder.com)** no telemóvel.
2. Mete o endereço do site: `https://xn--poupej-uta.com` — sem `www`, e tem de ser
   o domínio que **serve** o site, não um que redirecciona. A verificação do
   Android não segue redireccionamentos: se o `assetlinks.json` estiver atrás de
   um 308, falha em silêncio. (Chegou a acontecer: o domínio sem `www`
   redireccionava para o `www`; foi invertido na Vercel.)
3. Espera pela análise — mostra uma pontuação para Manifest, Service Worker e
   Segurança. Não precisa de ser 100% para gerar o pacote Android.
4. Toca em **Package for stores**.
5. Escolhe **Android**.
6. Confirma/ajusta os campos (os valores por omissão já vêm certos, mas confirma):
   - **Package ID**: `com.poupeja.app` — tem de ser exactamente este, é o mesmo
     que já está no `capacitor.config.json`.
   - **App name / Launcher name**: PoupeJá
   - **Display mode**: standalone
   - **Theme color / Nav color**: `#0b6b4f`
   - **Host**: `xn--poupej-uta.com`
   - **Version code**: sobe em cada versão nova (1, 2, 3…) — a Play Store recusa
     um número repetido.
   - **Signing key**: na **primeira** vez, **"New"**. Em todas as seguintes,
     **"Use mine"** com o `signing.keystore` e os dados do `signing-key-info`
     guardados — com uma chave nova a Play Store recusa o upload.
   - **Location delegation**: ligado (a Mobilidade usa a localização).
   - **Fallback behavior**: Custom Tabs.
7. Toca em **Generate** e descarrega o `.zip`.

### 2. Guardar o que não pode perder

O `.zip` traz:

- `app-release-bundle.aab` — é o que sobe ao Play Console.
- um ficheiro de chave (`.keystore` ou `.jks`) e um `signing-key-info.txt` com a
  palavra-passe.
- `assetlinks.json` — com a impressão digital da **tua** chave (a de
  carregamento). **Não chega sozinha**: a app que a Play Store instala é
  reassinada pela Google com outra chave. Ver a secção seguinte.

> **Guarda o ficheiro de chave e a palavra-passe num gestor de palavras-passe, já.**
> Sem eles nunca mais consegues publicar uma actualização desta app — a Google não
> tem como repor uma chave perdida. Não os apagues do telemóvel até teres a certeza
> de que estão guardados noutro sítio.

### 3. Play Console

1. Cria a app em [play.google.com/console](https://play.google.com/console)
   (conta de developer pessoal, 25 USD uma vez só).
2. Envia o `.aab` para um **teste interno**.
3. Põe a impressão digital certa no `assetlinks.json` (secção seguinte).
4. Preenche a ficha da loja (`FICHA_PLAY_STORE.md`).

Contas pessoais novas só chegam à produção depois de um **teste fechado com
12 testadores durante 14 dias**. O teste interno não conta para isso.

## A impressão digital certa

**Não a copies da página "Assinatura de apps" do Play Console.** Foi o que se
fez aqui, e as duas impressões digitais que lá aparecem (chave "clássica" e
"pós-quântica", beta) **não eram** o certificado do APK distribuído. A API de
Digital Asset Links respondia `linked: true` a ambas — porque isso só confirma
que a impressão digital está no ficheiro, não que é a da app. A app abria com a
barra do Chrome e nada dizia porquê.

Tira-a do APK que a Google distribui:

1. Play Console → a app → **Explorador de pacotes de apps** (ou abre a versão em
   *Testes internos* e desce até *App bundles*)
2. Separador **Transferências** → **APK assinado e universal**
3. Lê o certificado:

   ```bash
   keytool -printcert -jarfile app.apk | grep SHA256
   ```

   O `keytool` lê a assinatura v1, que este APK tem. Se um dia deixar de ter,
   o `apksig` (dentro do `bundletool-all.jar`) lê as v2/v3 — ver o PR #44.
   Sem computador: manda o APK a quem o possa ler.

O certificado desta app, lido assim, é `41:D9:FE…:63:2B` (CN=Android,
O=Google Inc.), nos blocos v2 e v3. É o primeiro do `assetlinks.json`.

O certificado é o mesmo para todas as versões: só muda se a chave de assinatura
for alterada no Play Console.

### Confirmar

```
https://xn--poupej-uta.com/.well-known/assetlinks.json   → 200, sem redireccionar
```

e no telemóvel, **reinstalando** a app (a verificação corre na instalação):
abre em ecrã inteiro, sem barra com o endereço. Se aparecer a barra, pelo menu
⋮ vê-se em que browser está a correr; o Chrome e o Samsung Internet suportam
TWA, outros podem não suportar.

## Opção B — Bubblewrap (linha de comandos, precisa de computador)

Faz o mesmo que o PWABuilder, mas por linha de comandos. Só compensa se um dia
quiseres automatizar o build ou já tiveres o ambiente Android configurado.

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://xn--poupej-uta.com/manifest.json
bubblewrap build
```

Precisa de JDK 17 e do Android SDK; o Bubblewrap propõe instalá-los na primeira
execução. Pede as mesmas respostas da Opção A (Package ID `com.poupeja.app`,
domínio `xn--poupej-uta.com`, cor `#0b6b4f`).

A impressão digital tira-se da mesma forma: do APK assinado pela Google, como
em [A impressão digital certa](#a-impressão-digital-certa).

## Ficha da loja

- **Screenshots**: as de `public/screenshots/` servem para começar. Para a ficha
  pública talvez prefiras capturas com uma conta já com dados, em vez do estado de
  convidado.
- **Política de privacidade**: `https://xn--poupej-uta.com/privacidade`
- **Data Safety** — declara o que a app recolhe mesmo:

  | dados | onde | porquê |
  |---|---|---|
  | Localização aproximada | Mobilidade | encontrar postos perto do utilizador |
  | Fotografias | Talões | o utilizador fotografa o talão |
  | Email | Conta | autenticação |

  Diz também que os dados são encriptados em trânsito e que o utilizador pode pedir
  a eliminação da conta.

## Sobre o Capacitor

Não o apagues. Fica no repositório para o dia em que precisares de nativo a sério.
Só não é por aí que a app vai para a loja agora.

Se mudares de ideias e quiseres mesmo o caminho Capacitor, tira o `server.url` e
empacota o site como ficheiros locais (`webDir`) — uma app que carrega os seus
próprios ficheiros já não é um wrapper. Mas perdes as actualizações instantâneas:
cada mudança passa a exigir uma nova versão na loja.
