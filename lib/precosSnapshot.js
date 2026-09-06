/*
 * Snapshot durável dos preços da DGEG.
 *
 * O problema que isto resolve: a cache dos preços vivia dentro de cada
 * instância serverless. Uma instância fria não tinha nada, e se a DGEG
 * estivesse em baixo nesse instante o utilizador não via preço nenhum —
 * mesmo que os dados estivessem bons cinco minutos antes, noutra instância.
 * A frescura passava a depender do tráfego e da sorte.
 *
 * Agora há uma linha no Supabase, reescrita de hora a hora pelo cron. Quem
 * serve páginas lê daí; a DGEG ao vivo é só a rede de recurso para o caso
 * de ainda não haver snapshot nenhum.
 *
 * O snapshot carrega sempre a SUA data — nunca a de quem o leu.
 */
import { getSupabaseAdmin } from "./supabaseAdmin";
import { todosOsPostos, normalizarPosto, postoUtilizavel, VALIDADE_PRECOS } from "./dgeg";

/* O mesmo prazo do resto — definido uma vez em lib/dgeg.js. */
export const VALIDADE_SNAPSHOT = VALIDADE_PRECOS;

/* Idade a partir da qual convém alguém ser avisado de que isto encravou. */
export const IDADE_PREOCUPANTE = 6 * 60 * 60 * 1000;

const CACHE_MEMORIA = 30 * 60 * 1000;
let memoria = null; // { snapshot, ts }

/*
 * Guardamos os postos já normalizados e filtrados — só o que as páginas
 * mostram. Poupa uns megabytes e evita repetir a filtragem a cada leitura.
 */
function paraGuardar(postos) {
  return postos.map(p => ({
    i: p.id, n: p.nome, ma: p.marca, mu: p.municipio, di: p.distrito,
    t: p.tipoLabel, p: p.preco, la: p.lat, lo: p.lon, dp: p.dataPreco,
  }));
}

function daGuardado(linhas) {
  return (linhas || []).map(l => ({
    id: l.i, nome: l.n, marca: l.ma, municipio: l.mu, distrito: l.di,
    tipoLabel: l.t, preco: l.p, lat: l.la, lon: l.lo, dataPreco: l.dp,
  }));
}

/* Lê o último snapshot guardado. null se não houver, ou se for velho demais. */
export async function lerSnapshot() {
  const agora = Date.now();
  if (memoria && agora - memoria.ts < CACHE_MEMORIA) return memoria.snapshot;

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb
    .from("precos_dgeg")
    .select("postos, n_postos, obtido_em, data_preco")
    .eq("id", "dgeg")
    .maybeSingle();

  if (error || !data) return null;

  const obtidoEm = new Date(data.obtido_em).getTime();
  if (!Number.isFinite(obtidoEm)) return null;
  if (agora - obtidoEm > VALIDADE_SNAPSHOT) return null; // velho demais para servir

  const snapshot = {
    postos: daGuardado(data.postos),
    obtidoEm,
    dataPreco: data.data_preco ? new Date(data.data_preco).getTime() : null,
    origem: "snapshot",
  };
  memoria = { snapshot, ts: agora };
  return snapshot;
}

/*
 * Vai à DGEG e guarda o resultado. Só escreve se trouxer postos: um
 * snapshot bom nunca é substituído por uma falha — é precisamente nessas
 * horas que ele faz falta.
 */
export async function atualizarSnapshot() {
  // forcar: ignora a cache em memória desta instância. O cron existe para
  // trazer dados novos — reescrever o snapshot com o que já cá estava seria
  // dar-lhe uma data nova sem lhe dar preços novos.
  const cru = await todosOsPostos({ forcar: true });
  const postos = cru.postos.map(normalizarPosto).filter(postoUtilizavel);

  if (!postos.length) {
    return { ok: false, motivo: "a DGEG não devolveu postos — snapshot anterior mantido", nPostos: 0 };
  }

  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, motivo: "SUPABASE_SERVICE_ROLE_KEY em falta", nPostos: postos.length };

  const datas = postos.map(p => p.dataPreco).filter(Boolean);
  const obtidoEm = cru.obtidoEm ?? Date.now();

  const { error } = await sb.from("precos_dgeg").upsert({
    id: "dgeg",
    postos: paraGuardar(postos),
    n_postos: postos.length,
    obtido_em: new Date(obtidoEm).toISOString(),
    data_preco: datas.length ? new Date(Math.max(...datas)).toISOString() : null,
    atualizado_em: new Date().toISOString(),
  });

  if (error) return { ok: false, motivo: `Supabase: ${error.message}`, nPostos: postos.length };

  memoria = null; // a próxima leitura vai buscar o novo
  return {
    ok: true,
    nPostos: postos.length,
    obtidoEm,
    dataPreco: datas.length ? Math.max(...datas) : null,
    parcial: cru.stale, // algum distrito veio de cache em vez de fresco
  };
}

/* Idade do snapshot, para vigilância. */
export async function idadeSnapshot() {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from("precos_dgeg").select("obtido_em, n_postos").eq("id", "dgeg").maybeSingle();
  if (error || !data) return null;
  const obtidoEm = new Date(data.obtido_em).getTime();
  return { obtidoEm, nPostos: data.n_postos, idadeMs: Date.now() - obtidoEm };
}
