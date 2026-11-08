import { bearerValido } from "../../lib/seguranca";
import { gerarPaginasMarca } from "../../lib/paginasMarcaGerar";
import { comRegisto } from "../../lib/cronRegisto";

/*
 * Gera as páginas /produto e /marca para a tabela paginas_marca (ver
 * lib/paginasMarca). Corre nos GitHub Actions, uma vez por dia
 * (.github/workflows/historico-precos.yml), e não na Vercel: o trabalho é
 * pesado e era o maior gasto de CPU do site. A rota existe para o
 * scripts/cron/correr.mjs e para correr à mão em caso de necessidade.
 */
async function handler(req, res) {
  if (!bearerValido(req.headers.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  const r = await gerarPaginasMarca();
  console.log("cron-paginas-marca:", JSON.stringify(r));
  return res.status(200).json(r);
}

// Cada execução fica registada para o /admin (Qualidade → Tarefas automáticas).
export default comRegisto("cron-paginas-marca", handler);
