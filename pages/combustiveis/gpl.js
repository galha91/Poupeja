import PaginaTipoCombustivel from "../../PaginaTipoCombustivel";
import { propsTipo } from "../../lib/combustivelTipoProps";

export default PaginaTipoCombustivel;
export const getServerSideProps = propsTipo("gpl");
