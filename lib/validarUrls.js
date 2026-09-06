import { PROMOCOES } from "./lojas-data.js";

// 403 = site bloqueia robots mas a página existe para utilizadores → aviso
// 404/410/timeout = link genuinamente quebrado → auto-corrigir para urlFallback

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-PT,pt;q=0.9",
};

async function pedir(url, metodo) {
  return fetch(url, {
    method: metodo,
    headers: HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
  });
}

/*
 * Só declara "partida" depois de confirmar com GET.
 *
 * A verificação era só HEAD, e há sites que respondem 404 (ou 405, ou nada)
 * a um HEAD e servem a página perfeitamente a um GET. Como um link partido
 * dispara a auto-correção, um falso positivo aqui não é inofensivo: trocava
 * um folheto que FUNCIONA pela homepage da loja, e o utilizador deixava de
 * chegar ao folheto. Custa um segundo pedido, e só nos casos maus.
 */
async function checarUrl({ nome, url }) {
  let status = 0;
  try {
    const r = await pedir(url, "HEAD");
    status = r.status;
    if (status === 403 || status === 401 || status === 429) {
      return { nome, url, status, estado: "aviso" };
    }
    if (status !== 404 && status !== 410) {
      return { nome, url, status, estado: "ok" };
    }
  } catch {
    // timeout ou erro de rede — pode ser transitório, o GET confirma
  }

  try {
    const r = await pedir(url, "GET");
    const s = r.status;
    if (s === 403 || s === 401 || s === 429) return { nome, url, status: s, estado: "aviso" };
    if (s === 404 || s === 410) return { nome, url, status: s, estado: "partida" };
    // O HEAD mentiu: a página existe. Fica ok, e o estado guarda o método
    // que resolveu, para se perceber no email porque é que o número mudou.
    return { nome, url, status: s, estado: "ok", viaGet: true };
  } catch {
    return { nome, url, status: status || 0, estado: "partida" };
  }
}

export const PREFIXO_FOLHETO = "Folheto ";

/*
 * Para onde mandar o utilizador quando o link do folheto parte.
 *
 * Não se inventa URL nenhum: o recurso é a raiz do domínio que JÁ está no
 * folheto (aldi.pt/folheto/esta-semana.html → aldi.pt). O domínio existe
 * por construção, portanto o utilizador aterra sempre na loja certa em vez
 * de num 404 — mesmo que tenha de procurar o folheto a partir daí.
 *
 * Se um dia houver uma página melhor (a secção de folhetos da cadeia, por
 * exemplo), basta pôr `urlFallback` nesse folheto no folhetos.json e ela
 * ganha precedência.
 */
export function fallbackDoFolheto(folheto) {
  if (folheto?.urlFallback) return folheto.urlFallback;
  try {
    return new URL(folheto.url).origin + "/";
  } catch {
    return null;
  }
}

export async function validarTodasUrls(folhetos = []) {
  const urlsFolhetos = folhetos.map(f => ({ nome: `${PREFIXO_FOLHETO}${f.loja}`, url: f.url }));
  const urlsPromo    = PROMOCOES.map(p => ({ nome: p.nome, url: p.url }));
  const todas = [...urlsPromo, ...urlsFolhetos];
  const resultados = await Promise.all(todas.map(checarUrl));
  const partidas = resultados.filter(r => r.estado === "partida");
  const avisos   = resultados.filter(r => r.estado === "aviso");
  return { resultados, partidas, avisos };
}

const OWNER = "galha91";
const REPO  = "Poupeja";

async function lerFicheiroGitHub(token, path) {
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!r.ok) return null;
  const data = await r.json();
  return { sha: data.sha, conteudo: Buffer.from(data.content, "base64").toString("utf-8") };
}

async function escreverFicheiroGitHub(token, path, conteudo, sha, mensagem) {
  await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: mensagem,
      content: Buffer.from(conteudo).toString("base64"),
      sha,
      committer: { name: "PoupeJá Bot", email: "noreply@xn--poupej-uta.com" },
    }),
  });
}

/*
 * Auto-corrige URLs partidas, substituindo-as pelo respetivo fallback.
 * Requer GITHUB_TOKEN com permissão contents:write.
 *
 * Trata DOIS ficheiros, porque os links vivem em sítios diferentes:
 *   lib/lojas-data.js    — as lojas de retalho (PROMOCOES), em JS
 *   public/folhetos.json — os folhetos dos supermercados, em JSON
 *
 * Os folhetos ficavam de fora: eram validados e davam alerta, mas nunca
 * corrigidos, porque isto só sabia procurar em PROMOCOES. Na prática, um
 * supermercado que mudasse a estrutura do URL deixava um link morto na app
 * até alguém abrir o email e ir lá à mão.
 *
 * `folhetos` é a lista atual (de lerFolhetos()), para se saber o fallback
 * de cada um.
 */
export async function autoCorrigirUrls(partidas, folhetos = []) {
  const token = process.env.GITHUB_TOKEN;
  if (!token || !partidas.length) return [];

  const corrigidas = [];

  // Que substituições fazer em cada ficheiro. O `antes`/`depois` respeita a
  // sintaxe de cada um: `url: "…"` no JS, `"url": "…"` no JSON.
  const planos = {
    "lib/lojas-data.js":    [],
    "public/folhetos.json": [],
  };

  for (const { nome, url } of partidas) {
    if (nome.startsWith(PREFIXO_FOLHETO)) {
      const loja = nome.slice(PREFIXO_FOLHETO.length);
      const folheto = folhetos.find(f => f.loja === loja);
      const destino = folheto && fallbackDoFolheto(folheto);
      if (!destino || destino === url) continue;
      planos["public/folhetos.json"].push({
        nome, url, destino,
        antes: `"url": "${url}"`, depois: `"url": "${destino}"`,
      });
    } else {
      const loja = PROMOCOES.find(p => p.nome === nome);
      if (!loja?.urlFallback || url === loja.urlFallback) continue;
      planos["lib/lojas-data.js"].push({
        nome, url, destino: loja.urlFallback,
        antes: `url: "${url}"`, depois: `url: "${loja.urlFallback}"`,
      });
    }
  }

  for (const [path, substituicoes] of Object.entries(planos)) {
    if (!substituicoes.length) continue;
    try {
      const ficheiro = await lerFicheiroGitHub(token, path);
      if (!ficheiro) continue;

      let conteudo = ficheiro.conteudo;
      const feitas = [];
      for (const s of substituicoes) {
        if (!conteudo.includes(s.antes)) continue;
        conteudo = conteudo.replace(s.antes, s.depois);
        feitas.push(s);
      }
      if (!feitas.length) continue;

      const nomes = feitas.map(f => f.nome).join(", ");
      await escreverFicheiroGitHub(
        token, path, conteudo, ficheiro.sha,
        `auto-fix: URL quebrada substituída por fallback (${nomes})`
      );
      feitas.forEach(f => corrigidas.push({ nome: f.nome, urlPartida: f.url, urlNova: f.destino }));
    } catch (e) {
      console.error(`autoCorrigirUrls (${path}):`, e?.message);
    }
  }

  return corrigidas;
}

export function construirEmailAlerta({ partidas, avisos, corrigidas = [], base }) {
  const temPartidas  = partidas.length > 0;
  const temAvisos    = avisos.length > 0;
  const temCorrigidas = corrigidas.length > 0;

  function linhaUrl(p, cor) {
    const statusLabel = p.status === 0 ? "timeout / sem resposta" : `HTTP ${p.status}`;
    return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
        <div style="font-size:13px;font-weight:700;color:#0f172a;border-left:3px solid ${cor};padding-left:10px;">${p.nome}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:3px;word-break:break-all;padding-left:13px;">${p.url}</div>
        <div style="font-size:11px;font-weight:700;color:${cor};margin-top:2px;padding-left:13px;">${statusLabel}</div>
      </td>
    </tr>`;
  }

  function linhaCorrigida(c) {
    return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0fdf4;">
        <div style="font-size:13px;font-weight:700;color:#0f172a;border-left:3px solid #16a34a;padding-left:10px;">${c.nome} ✓</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:3px;padding-left:13px;word-break:break-all;text-decoration:line-through;">${c.urlPartida}</div>
        <div style="font-size:11px;color:#16a34a;font-weight:700;margin-top:2px;padding-left:13px;">→ ${c.urlNova} (fallback)</div>
      </td>
    </tr>`;
  }

  const secaoCorrigidas = temCorrigidas ? `
    <p style="margin:0 0 8px;font-size:13px;font-weight:900;color:#16a34a;">✅ Auto-corrigidas (${corrigidas.length}) — já a funcionar</p>
    <p style="margin:0 0 10px;font-size:12px;color:#64748b;line-height:1.5;">
      Substituídas pela homepage (fallback) automaticamente. O Vercel faz redeploy em ~2 min. Quando puderes, verifica se há uma URL de promoções mais específica.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">${corrigidas.map(linhaCorrigida).join("")}</table>` : "";

  const secaoPartidas = (temPartidas && !temCorrigidas) ? `
    <p style="margin:0 0 8px;font-size:13px;font-weight:900;color:#dc2626;">🔴 Quebradas — GITHUB_TOKEN em falta, não foi possível auto-corrigir</p>
    <table width="100%" cellpadding="0" cellspacing="0">${partidas.map(p => linhaUrl(p, "#dc2626")).join("")}</table>` : "";

  const secaoAvisos = temAvisos ? `
    <p style="margin:${(temPartidas || temCorrigidas) ? "20px" : "0"} 0 8px;font-size:13px;font-weight:900;color:#d97706;">🟡 Não verificáveis (${avisos.length}) — site bloqueia robots</p>
    <p style="margin:0 0 10px;font-size:12px;color:#64748b;line-height:1.5;">
      Devolvem 403 ao servidor mas devem funcionar para utilizadores. Verifica no browser se tiveres dúvidas.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">${avisos.map(p => linhaUrl(p, "#d97706")).join("")}</table>` : "";

  /* O botão mandava sempre para /lojas, mesmo quando o que partiu foi um
     folheto de supermercado — que vive noutra secção. */
  const mexeuEmFolhetos = [...partidas, ...avisos, ...corrigidas]
    .some(x => (x.nome || "").startsWith(PREFIXO_FOLHETO));
  const destinoBotao = mexeuEmFolhetos
    ? { href: "/folhetos", texto: "Abrir os folhetos" }
    : { href: "/lojas",    texto: "Abrir secção Lojas" };

  const corHeader = temCorrigidas
    ? "linear-gradient(135deg,#15803d,#16a34a)"
    : temPartidas ? "linear-gradient(135deg,#dc2626,#ef4444)"
    : "linear-gradient(135deg,#d97706,#f59e0b)";

  const tituloHeader = temCorrigidas
    ? `✅ ${corrigidas.length} URL${corrigidas.length > 1 ? "s" : ""} auto-corrigida${corrigidas.length > 1 ? "s" : ""}`
    : temPartidas ? `⚠️ ${partidas.length} link${partidas.length > 1 ? "s" : ""} quebrado${partidas.length > 1 ? "s" : ""}`
    : `🟡 ${avisos.length} link${avisos.length > 1 ? "s" : ""} a verificar`;

  const subject = temCorrigidas
    ? `✅ PoupeJá — ${corrigidas.length} URL${corrigidas.length > 1 ? "s" : ""} auto-corrigida${corrigidas.length > 1 ? "s"  : ""} (fallback ativo)`
    : temPartidas ? `⚠️ PoupeJá — ${partidas.length} link${partidas.length > 1 ? "s" : ""} quebrado${partidas.length > 1 ? "s" : ""}`
    : `🟡 PoupeJá — ${avisos.length} link${avisos.length > 1 ? "s" : ""} a verificar manualmente`;

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>${tituloHeader} — PoupeJá</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <tr>
          <td style="background:${corHeader};padding:28px 32px;text-align:center;">
            <div style="font-size:18px;font-weight:900;color:#ffffff;">PoupeJá — ${tituloHeader}</div>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:12px;">Monitorização automática semanal</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            ${secaoCorrigidas}
            ${secaoPartidas}
            ${secaoAvisos}
            <div style="text-align:center;margin-top:24px;">
              <a href="${base}${destinoBotao.href}" style="display:inline-block;background:#0f172a;color:#ffffff;font-weight:700;font-size:13px;text-decoration:none;padding:12px 28px;border-radius:10px;">
                ${destinoBotao.texto} →
              </a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
