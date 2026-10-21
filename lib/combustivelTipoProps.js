import { dadosTipo } from "./municipios";
import { lerSerie } from "./precosSnapshot";

/* getServerSideProps das páginas /combustiveis/gasoleo, /gasolina-95 e /gpl. */
export function propsTipo(slug) {
  return async function getServerSideProps({ res }) {
    const dados = await dadosTipo(slug);
    if (!dados) return { notFound: true };
    const serie = await lerSerie({ escopo: "pais", chave: "*", tipo: dados.tipo.tipo }).catch(() => []);
    // 30 minutos secos, sem stale-while-revalidate — ver pages/combustiveis/[cidade].js.
    res.setHeader("Cache-Control", "public, s-maxage=1800");
    return { props: JSON.parse(JSON.stringify({ dados, serie })) };
  };
}
