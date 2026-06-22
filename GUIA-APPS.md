# Guia — Publicar o PoupeJá nas lojas (Android + iOS)

O PoupeJá continua a ser **um único projeto**. O site funciona como sempre em
`poupejá.com`, e o Capacitor cria uma "casca" nativa que carrega esse mesmo
site dentro de uma app real, com splash screen, barra de estado e capacidades
nativas. Quando atualizas o site, a app mostra logo a versão nova — não é
preciso submeter de novo às lojas a cada alteração.

> **Já está feito neste repositório:** Capacitor instalado, `capacitor.config.json`
> a apontar para produção, e os scripts no `package.json`. Falta só correr os
> comandos abaixo **no teu computador** (este ambiente cloud não tem Android
> Studio nem Xcode).

---

## Pré-requisitos

| Plataforma | Precisas de | Onde |
|-----------|-------------|------|
| **Android** | Android Studio (grátis) | qualquer PC/Mac |
| **iOS** | Mac com Xcode (grátis) | só funciona em Mac |
| Contas | Google Play ($25, uma vez) · Apple Developer ($99/ano) | — |

---

## Passo 1 — Clonar e instalar (no teu computador)

```bash
git clone https://github.com/galha91/Poupeja.git
cd Poupeja
npm install
```

## Passo 2 — Gerar os projetos nativos

```bash
npm run cap:add:android   # cria a pasta android/
npm run cap:add:ios       # cria a pasta ios/ (só em Mac)
npm run cap:sync          # aplica a configuração
```

## Passo 3a — Compilar Android

```bash
npm run cap:android       # abre o Android Studio
```

No Android Studio:
1. Espera o Gradle sincronizar
2. **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**
3. Cria uma chave de assinatura (guarda-a bem — é para sempre)
4. O ficheiro `.aab` é o que carregas no Google Play Console

## Passo 3b — Compilar iOS (só em Mac)

```bash
npm run cap:ios           # abre o Xcode
```

No Xcode:
1. Em **Signing & Capabilities**, escolhe a tua equipa (Apple Developer)
2. **Product → Archive**
3. **Distribute App → App Store Connect**

---

## Passo 4 — Submeter

- **Google Play:** [play.google.com/console](https://play.google.com/console) → criar app → carregar `.aab` → preencher ficha (descrição, screenshots, política de privacidade: já tens em `/privacidade`)
- **Apple:** [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → criar app → submeter via Xcode

---

## Notas importantes

- **Atualizações:** como a app carrega o site em produção, basta fazer deploy
  normal no Vercel — a app atualiza sozinha. Só voltas às lojas se mudares
  ícones, nome ou capacidades nativas.

- **iOS — risco de rejeição:** a Apple às vezes rejeita apps que são "só um
  site embrulhado" (regra 4.2). O PoupeJá tem a favor: notificações push,
  geolocalização (combustíveis) e câmara (talões). Se rejeitarem, a solução é
  adicionar mais um plugin nativo (ex: `@capacitor/push-notifications`) para
  reforçar a funcionalidade nativa. O Android não tem este problema.

- **appId:** `com.poupeja.app` — muda em `capacitor.config.json` se quiseres
  outro identificador (não pode mudar depois de publicado).

- **Ícone e splash:** usa os ícones em `public/icon-512.png`. Para gerar todos
  os tamanhos automaticamente: `npm i -D @capacitor/assets` e depois
  `npx capacitor-assets generate`.
