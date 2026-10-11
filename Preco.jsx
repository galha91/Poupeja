/*
 * Como o PoupeJá escreve dinheiro — um sítio só.
 *
 * Os preços estavam espalhados por dezenas de ficheiros, cada um a
 * compor o seu: uns com toFixed(2), outros com toLocaleString, uns com
 * o € antes, outros depois, e os algarismos todos proporcionais. Numa
 * lista isso faz a vírgula saltar de linha para linha.
 *
 * Aqui há duas peças:
 *   Preco       — a quantia, sempre com a mesma anatomia
 *   LinhaPreco  — a linha de uma lista de preços, com a amplitude à vista
 */
import { eur } from "./lib/formato";

/*
 * Anatomia da quantia: o símbolo recua (é constante, não é informação),
 * o inteiro manda, os cêntimos acompanham a meia altura. É a hierarquia
 * de uma etiqueta de preço — o que o olho procura primeiro são os euros.
 */
export function Preco({
  valor,
  casas = 2,
  tamanho = 22,
  cor = "var(--pj-brand-ink)",
  peso = 600,
  display = true,
}) {
  if (valor == null || !Number.isFinite(valor)) {
    return <span style={{ color: "var(--pj-text-faint)", fontSize: tamanho * 0.8 }}>—</span>;
  }
  const texto = eur(valor, casas);
  const [inteiro, decimais] = texto.split(",");
  return (
    <span
      className={`pj-num${display ? " font-display" : ""}`}
      style={{ fontSize: tamanho, fontWeight: peso, color: cor, lineHeight: 1, whiteSpace: "nowrap" }}
    >
      <span style={{ fontSize: tamanho * 0.62, fontWeight: 500, opacity: 0.5, marginRight: 2 }}>€</span>
      {inteiro}
      {decimais != null && (
        <span style={{ fontSize: tamanho * 0.62, fontWeight: peso }}>,{decimais}</span>
      )}
    </span>
  );
}

/*
 * ASSINATURA — a linha de preço.
 *
 * Quem abre uma lista de combustíveis tem uma pergunta só: qual é o
 * barato? Até aqui a lista respondia por ordenação, e mais nada — o
 * mais barato e o mais caro tinham exactamente o mesmo aspecto, e a
 * distância entre eles era invisível.
 *
 * Cada linha passa a mostrar onde cai entre o mínimo e o máximo DAQUELA
 * lista. O traço não é enfeite: é a distância ao mais barato. O primeiro
 * leva marca, os outros levam quanto custam a mais.
 *
 *   min/max  — extremos da lista, para a escala ser a da lista e não absoluta
 *   destaque — marcar como o melhor (normalmente o primeiro)
 */
export function LinhaPreco({
  nome,
  contexto,
  valor,
  min,
  max,
  casas = 3,
  destaque = false,
  href,
  onClick,
  primeira = false,
}) {
  const amplitude = (max ?? 0) - (min ?? 0);
  // Sem amplitude (preços todos iguais, ou um só) o traço não diz nada:
  // mostrá-lo seria inventar uma diferença que não existe.
  const temEscala = amplitude > 0.0005 && Number.isFinite(valor);
  const posicao = temEscala ? Math.min(Math.max((valor - min) / amplitude, 0), 1) : 0;
  const diferencaCent = temEscala ? Math.round((valor - min) * 100) : 0;
  // "+0" não informa — abaixo de um cêntimo, a diferença não existe na prática.
  const mostraDiferenca = temEscala && diferencaCent >= 1;

  const Elemento = href ? "a" : onClick ? "button" : "div";
  const props = href ? { href } : onClick ? { onClick, type: "button" } : {};

  return (
    <Elemento
      {...props}
      className={`pj-tap w-full text-left no-underline flex items-center gap-3 ${href || onClick ? "press" : ""}`}
      style={{
        padding: "12px 14px 12px 12px",
        borderTop: primeira ? "none" : "1px solid var(--pj-subtle)",
        background: destaque ? "var(--pj-brand-wash)" : "transparent",
        // O mais barato ganha um fio verde à esquerda: lê-se antes de
        // qualquer texto, mesmo em diagonal.
        borderLeft: `3px solid ${destaque ? "var(--pj-brand)" : "transparent"}`,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--pj-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {nome}
        </span>
        {contexto && (
          <span style={{ display: "block", fontSize: 12, color: "var(--pj-text-faint)", marginTop: 2 }}>
            {contexto}
          </span>
        )}
      </span>

      {/*
        Quanto custa a mais do que o mais barato da lista.
        A barra ENCHE da esquerda: vazia = é este o barato; cheia = é o
        mais caro dos que estão aqui. Um traço a marcar posição numa
        escala obrigava a decifrar; uma barra que cresce lê-se de relance.
        Fica cinzenta de propósito — o verde está reservado ao vencedor,
        e uma barra grande não é um alarme, é só distância.
      */}
      {temEscala && (
        <span className="hidden sm:flex" style={{ width: 132, alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ position: "relative", flex: 1, height: 5, borderRadius: 999, background: "var(--pj-subtle)", overflow: "hidden" }}>
            {/*
              Barra vazia = está ao nível do mais barato. Antes desenhava-se
              um coto de 4% a quem estava a menos de um cêntimo de distância,
              e o coto contradizia a etiqueta vazia ao lado: dizia "há
              diferença" onde o texto dizia que não havia.
            */}
            {mostraDiferenca && (
              <span
                style={{
                  position: "absolute", inset: 0,
                  width: `${Math.max(posicao * 100, 4)}%`,
                  borderRadius: 999,
                  background: "var(--pj-text-muted)",
                  opacity: 0.42,
                }}
              />
            )}
          </span>
          <span
            className="pj-num"
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              width: 52,
              textAlign: "right",
              color: destaque ? "var(--pj-brand)" : "var(--pj-text-faint)",
            }}
          >
            {destaque ? "melhor" : mostraDiferenca ? `+${diferencaCent}c` : ""}
          </span>
        </span>
      )}

      <span style={{ flexShrink: 0 }}>
        <Preco valor={valor} casas={casas} tamanho={20} peso={600} />
      </span>
    </Elemento>
  );
}
