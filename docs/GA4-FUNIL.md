# GA4 — funil de ativação e retenção do PoupeJá

Guia para montar, no GA4, a resposta a três perguntas: **quem chega**, **quem faz alguma coisa útil na primeira visita** e **quem volta**. Não precisa de código: os eventos já são enviados pela app (lista completa em `lib/analytics.js`).

## 1. Marcar os eventos de ativação como "eventos-chave"

*Admin → Apresentação de dados → Eventos.* Marca como **evento-chave** (estrela):

| Evento | O que quer dizer |
|---|---|
| `inicio_combustivel` | Tocou no herói do gasóleo (localização, mapa, email ou talão) |
| `comparar_pesquisa` | Fez uma pesquisa de preços sua (o exemplo do dia é `comparar_exemplo` e **não** conta) |
| `lista_criada` | Pôs o primeiro artigo numa lista |
| `receipt_scanned` | Guardou um talão |
| `subscrever_combustivel` | Pediu o email semanal de combustível |
| `subscrever_folhetos` | Pediu o email semanal de folhetos |
| `alerta_preco_criado` | Criou um alerta de preço |
| `share` / `partilhar` | Partilhou alguma coisa |

Os eventos só aparecem nesta lista depois de terem acontecido pelo menos uma vez. Se faltar algum, volta daqui a uns dias.

## 2. Funil "primeira visita → ativação"

*Explorar → Exploração de funil.*

1. **Passo 1:** `first_visit` (automático do GA4).
2. **Passo 2:** qualquer um dos eventos-chave acima. Em "Adicionar condição", usa **ou** entre eles.
3. Ativa **"Funil aberto"** desligado e **"Tempo decorrido"**.
4. **Divisão:** `Grupo de canais predefinido da sessão`. Assim vês se quem vem do Google ativa mais ou menos do que quem vem de partilhas.

A taxa do passo 2 é a **ativação**. É o número a fazer subir.

## 3. Retenção D1 / D7 / D30

*Explorar → Exploração de coortes.*

- **Inclusão na coorte:** `first_visit`.
- **Devolução:** "Qualquer evento" (ou, mais exigente, um evento-chave).
- **Granularidade:** Diária, depois Semanal.
- **Divisão:** `modo_app` (propriedade do utilizador já enviada: `browser`, `pwa` ou `app-android`). Mostra se quem instala volta mais.

Lê-se assim: a coluna "Dia 1" é a D1, a "Dia 7" é a D7 e assim por diante.

## 4. Painel semanal (5 números)

*Relatórios → Biblioteca → Criar relatório de detalhe*, ou só uma exploração guardada:

1. Novos utilizadores (`first_visit`)
2. % ativados na primeira sessão (funil, passo 2)
3. D7 (coorte)
4. Subscrições de email (`subscrever_combustivel` + `subscrever_folhetos`)
5. Partilhas por 100 sessões (`share` + `partilhar`)

## 5. Ver o efeito das mudanças recentes

- **Herói do gasóleo:** `inicio_combustivel` com o parâmetro `nivel`. Registá-lo como **dimensão personalizada** (*Admin → Definições personalizadas → Criar → âmbito Evento → parâmetro `nivel`*) para separar `pais`, `aproximada` e `exata`. Faz o mesmo com `acao`.
- **Exemplo do Mercado:** compara `comparar_exemplo` (quantas vezes o exemplo apareceu) com `comparar_pesquisa` nas mesmas sessões. Se quem vê o exemplo pesquisa mais, o exemplo está a funcionar.

Os parâmetros só aparecem nos relatórios a partir do dia em que são registados como dimensão personalizada; os dados anteriores não são recuperados. Faz este passo cedo.
