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

**Falta uma coisa no assetlinks.json:** a impressão digital SHA-256. Não dá para a
inventar — só existe depois de a app ser assinada (ver Opção A ou B abaixo).

## Opção A — PWABuilder (sem instalar nada, dá para fazer do telemóvel)

É o caminho recomendado aqui: nada para instalar, corre no browser, e no fim já
devolve o `assetlinks.json` pronto com a impressão digital lá dentro — poupa o
passo de ir ao Play Console buscá-la à mão.

### 1. Gerar o pacote

1. Abre **[pwabuilder.com](https://www.pwabuilder.com)** no telemóvel.
2. Mete o endereço do site: `https://poupejá.com` (ou `https://xn--poupej-uta.com`,
   é o mesmo). Ele vai buscar o `manifest.json` e o service worker sozinho.
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
   - **Signing key**: escolhe **"Create new"** (deixa o PWABuilder gerar a chave).
     Não escolhas "None" — essa opção usa o Google Play App Signing e obriga a
     voltar ao passo de ir buscar a impressão digital ao Play Console à mão,
     que é exactamente o que este caminho evita.
7. Toca em **Generate** e descarrega o `.zip`.

### 2. Guardar o que não pode perder

O `.zip` traz:

- `app-release-bundle.aab` — é o que sobe ao Play Console.
- um ficheiro de chave (`.keystore` ou `.jks`) e um `signing-key-info.txt` com a
  palavra-passe.
- `assetlinks.json` — **já com a impressão digital certa**.

> **Guarda o ficheiro de chave e a palavra-passe num gestor de palavras-passe, já.**
> Sem eles nunca mais consegues publicar uma actualização desta app — a Google não
> tem como repor uma chave perdida. Não os apagues do telemóvel até teres a certeza
> de que estão guardados noutro sítio.

### 3. Pôr o assetlinks.json a valer

O `assetlinks.json` do `.zip` tem de substituir o que já está no repositório
(`public/.well-known/assetlinks.json`, que ainda tem um marcador por preencher).

O conteúdo não é sensível — é feito para ser público, o Android lê-o directamente
do site. Podes:

- abrir o ficheiro no telemóvel, copiar o texto e mandar aqui para eu o pôr no
  repositório e publicar, **ou**
- editá-lo directamente no GitHub, no telemóvel (github.com → o repositório →
  `public/.well-known/assetlinks.json` → ícone de lápis).

Depois de publicado, confirma-se assim:

```
https://xn--poupej-uta.com/.well-known/assetlinks.json
```

Sem isto a app abre **com a barra do Chrome à vista** — o aspecto de wrapper que
queremos evitar.

### 4. Play Console

1. Cria a app em [play.google.com/console](https://play.google.com/console)
   (precisa da conta de developer, 25 USD uma vez só, se ainda não a tiveres).
2. Envia o `app-release-bundle.aab` para um **teste interno**.
3. Preenche a ficha da loja (ver secção abaixo).

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

Aqui **não** vem `assetlinks.json` pronto: depois de enviar o `.aab` ao Play
Console, vai a **Setup → App integrity → App signing**, copia a
**SHA-256 certificate fingerprint** e mete-a no
`public/.well-known/assetlinks.json`, no lugar do marcador.

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
