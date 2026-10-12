import { exigirAdmin } from "../../lib/adminAuth";
import { googleConfigurado, lerAnalytics, lerSearchConsole } from "../../lib/googleApis";

// Tráfego do site para o /admin: contador próprio (sem cookies), Google
// Analytics 4 e Search Console (estes dois só se a conta de serviço estiver
// configurada).
export default async function handler(req, res) {
  const ctx = await exigirAdmin(req, res);
  if (!ctx) return;
  const { admin } = ctx;

  const dia = (d) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
  const desde = dia(new Date(Date.now() - 29 * 864e5));
  const hoje = dia(new Date());

  const [vd, vu] = await Promise.all([
    admin.from("visitas_dia").select("dia, caminho, origem, n").gte("dia", desde).limit(50000),
    admin.from("visitas_unicos").select("dia, n").gte("dia", desde),
  ]);

  const linhas = vd.data || [];
  const unicos = Object.fromEntries((vu.data || []).map(u => [u.dia, u.n]));
  const porDia = {};
  for (const l of linhas) porDia[l.dia] = (porDia[l.dia] || 0) + l.n;

  const serie = [];
  for (let i = 13; i >= 0; i--) {
    const d = dia(new Date(Date.now() - i * 864e5));
    serie.push({ dia: d, vistas: porDia[d] || 0, visitantes: unicos[d] || 0 });
  }
  const soma = (campo, dias) => {
    const lim = dia(new Date(Date.now() - (dias - 1) * 864e5));
    return campo === "vistas"
      ? linhas.filter(l => l.dia >= lim).reduce((s, l) => s + l.n, 0)
      : (vu.data || []).filter(u => u.dia >= lim).reduce((s, u) => s + u.n, 0);
  };

  const lim7 = dia(new Date(Date.now() - 6 * 864e5));
  const agrupar = (chave) => {
    const m = {};
    for (const l of linhas) if (l.dia >= lim7) m[l[chave]] = (m[l[chave]] || 0) + l.n;
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, n]) => ({ [chave]: k, n }));
  };

  const cfg = googleConfigurado();
  const tentar = async (ativo, fn) => { if (!ativo) return { dados: null }; try { return { dados: await fn() }; } catch (e) { return { dados: null, erro: String(e.message || e).slice(0, 200) }; } };
  const [ga, sc] = await Promise.all([tentar(cfg.ga, lerAnalytics), tentar(cfg.sc, lerSearchConsole)]);

  const lim14 = dia(new Date(Date.now() - 13 * 864e5));
  const anteriores7 = (vu.data || []).filter(u => u.dia >= lim14 && u.dia < lim7).reduce((s, u) => s + u.n, 0);

  return res.status(200).json({
    proprio: {
      anteriores7,
      desdeDia: serie.find(s => s.vistas > 0)?.dia || hoje,
      hoje: { vistas: porDia[hoje] || 0, visitantes: unicos[hoje] || 0 },
      sete: { vistas: soma("vistas", 7), visitantes: soma("visitantes", 7) },
      trinta: { vistas: soma("vistas", 30) },
      serie,
      paginas: agrupar("caminho"),
      origens: agrupar("origem"),
      erro: vd.error ? "Tabela de visitas indisponível." : null,
    },
    google: { configurado: cfg, ga: ga.dados, gaErro: ga.erro || null, sc: sc.dados, scErro: sc.erro || null },
    atualizadoEm: new Date().toISOString(),
  });
}
