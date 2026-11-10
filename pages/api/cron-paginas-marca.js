import { bearerValido } from "../../lib/seguranca";
import { gerarPaginasMarca } from "../../lib/paginasMarcaGerar";
import { gerarCabazInicio } from "../../lib/cabazInicioGerar";
import { comRegisto } from "../../lib/cronRegisto";

/*
 * Gera as páginas /produto e /marca para a tabela paginas_marca (ver
 * lib/paginasMarca). Corre nos GitHub Actions, uma vez por dia
 * (.github/workflows/historico-precos.yml), e não na Vercel: o trabalho é
 * pesado e era o maior gasto de CPU do site. A rota existe para o
 * scripts/cron/correr.mjs e para correr à mão em caso de necessidade.
 *
 * No fim calcula também o cabaz básico do Início (lib/cabazInicio): 6
 * pesquisas às lojas, guardadas numa linha da mesma tabela. Se falhar, as
 * páginas já estão geradas e a tarefa conta como feita na mesma.
 */
async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  const r = await gerarPaginasMarca();
  const cabaz = await gerarCabazInicio().catch((e) => ({ ok: false, erro: String(e?.message || e).slice(0, 120) }));
  console.log("cron-paginas-marca:", JSON.stringify({ ...r, cabaz }));
  return res.status(200).json({ ...r, cabaz });
}

// Cada execução fica registada para o /admin (Qualidade → Tarefas automáticas).
export default comRegisto("cron-paginas-marca", handler);
