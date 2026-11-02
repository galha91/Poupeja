import { exigirAdmin } from "../../lib/adminAuth";
import { googleConfigurado, lerAnalytics, lerSearchConsole } from "../../lib/googleApis";
import { trafegoProprio, periodoValido } from "../../lib/adminDados";

// Tráfego do site para o /admin: contador próprio (sem cookies) no período
// pedido (?dias=7|30|90, com o período anterior para comparar), Google
// Analytics 4 e Search Console (estes dois só se a conta de serviço estiver
// configurada; têm o seu próprio intervalo).
export default async function handler(req, res) {
  const ctx = await exigirAdmin(req, res);
  if (!ctx) return;
  const dias = periodoValido(req.query.dias);

  const cfg = googleConfigurado();
  const tentar = async (ativo, fn) => { if (!ativo) return { dados: null }; try { return { dados: await fn() }; } catch (e) { return { dados: null, erro: String(e.message || e).slice(0, 200) }; } };
  const [proprio, ga, sc] = await Promise.all([
    trafegoProprio(ctx.admin, dias).catch(() => null),
    tentar(cfg.ga, lerAnalytics),
    tentar(cfg.sc, lerSearchConsole),
  ]);

  return res.status(200).json({
    proprio,
    google: { configurado: cfg, ga: ga.dados, gaErro: ga.erro || null, sc: sc.dados, scErro: sc.erro || null },
    atualizadoEm: new Date().toISOString(),
  });
}
