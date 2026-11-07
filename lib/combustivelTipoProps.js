import { dadosTipo } from "./municipios";
import { lerSerie } from "./precosSnapshot";
import { cabecalhoCacheCombustivel } from "./cacheCombustivel";

/* getServerSideProps das páginas /combustiveis/gasoleo, /gasolina-95 e /gpl. */
export function propsTipo(slug) {
  return async function getServerSideProps({ res }) {
    const dados = await dadosTipo(slug);
    if (!dados) return { notFound: true };
    const serie = await lerSerie({ escopo: "pais", chave: "*", tipo: dados.tipo.tipo }).catch(() => []);
    // Sem stale-while-revalidate (lib/cacheCombustivel) — ver pages/combustiveis/[cidade].js.
    res.setHeader("Cache-Control", cabecalhoCacheCombustivel());
    return { props: JSON.parse(JSON.stringify({ dados, serie })) };
  };
}
