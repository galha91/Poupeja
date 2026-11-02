import { exigirAdmin } from "../../lib/adminAuth";
import { metricas, retencao, emails, saude, notas, lerMetas, contactos, periodoValido } from "../../lib/adminDados";

// Crescimento e qualidade para o /admin, no período pedido (?dias=7|30|90):
// uso das funcionalidades, pesquisas, retenção dos convidados (por semana,
// origem e campanha), emails sem conta, erros, velocidade, saúde dos preços,
// notas e metas. Cada bloco é independente: uma tabela em falta (migração por
// aplicar) devolve null nesse bloco e o resto continua a aparecer.
export default async function handler(req, res) {
  const ctx = await exigirAdmin(req, res);
  if (!ctx) return;
  const { admin } = ctx;
  const dias = periodoValido(req.query.dias);
  const seguro = (p) => p.catch(() => null);
  const [m, r, e, s, n, metas, c] = await Promise.all([
    seguro(metricas(admin, dias)), seguro(retencao(admin, dias)), seguro(emails(admin, dias)),
    seguro(saude(admin)), seguro(notas(admin)), seguro(lerMetas(admin)), seguro(contactos(admin)),
  ]);
  return res.status(200).json({ dias, metricas: m, retencao: r, emails: e, saude: s, notas: n, metas, contactos: c, atualizadoEm: new Date().toISOString() });
}
