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
| `public/.well-known/assetlinks.json` | criado, servido em `/.well-known/assetlinks.json` (verificado: 200, `application/json`) |
| `public/manifest.json` | ícones 192/512 maskable, `display: standalone`, `start_url`, **4 screenshots** |
| `public/screenshots/` | 780×1688, geradas dos ecrãs reais |
| `/privacidade` | existe — a Play Store exige uma política pública |
| `assets/icon-only.png`, `assets/splash.png` | prontos para gerar os recursos nativos |

**Falta uma coisa no assetlinks.json:** a impressão digital SHA-256. Não dá para a
inventar — vem do Play Console depois do primeiro envio (ver passo 4).

## Passos

### 1. Instalar o Bubblewrap

```bash
npm i -g @bubblewrap/cli
```

Precisa de JDK 17 e do Android SDK; o Bubblewrap propõe instalá-los na primeira
execução.

### 2. Gerar o projeto

```bash
bubblewrap init --manifest https://xn--poupej-uta.com/manifest.json
```

Responde:

- **Package name**: `com.poupeja.app` — o mesmo que está no `capacitor.config.json`
  e no `assetlinks.json`. Se mudares aqui, muda nos dois sítios.
- **Domain**: `xn--poupej-uta.com` (a forma punycode de poupejá.com; é assim que
  tem de ficar)
- **Launcher name**: PoupeJá
- **Status bar color**: `#0b6b4f`

### 3. Construir e assinar

```bash
bubblewrap build
```

Gera um `app-release-bundle.aab` e, na primeira vez, uma keystore.

> **Guarda a keystore e a palavra-passe.** Sem elas não consegues publicar
> actualizações desta app — nunca. Não vivem no repositório: põe-nas num gestor de
> palavras-passe.

### 4. Play Console — e fechar o Digital Asset Links

1. Cria a app no [Play Console](https://play.google.com/console) e envia o `.aab`
   para um teste interno.
2. Vai a **Setup → App integrity → App signing** e copia a
   **SHA-256 certificate fingerprint**.
3. Mete essa impressão digital no `public/.well-known/assetlinks.json`, no lugar de
   `SUBSTITUIR_PELA_IMPRESSAO_DIGITAL_DO_PLAY_CONSOLE`.
4. Faz deploy do site.
5. Confirma que está a servir:
   ```bash
   curl https://xn--poupej-uta.com/.well-known/assetlinks.json
   ```

Sem este passo a app abre **com a barra do Chrome à vista** — que é precisamente o
aspecto de wrapper que queremos evitar. É o passo que mais vezes fica por fazer.

### 5. Ficha da loja

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
