/*
 * Cópia de segurança das garantias, contas que renovam e perfil dos prazos.
 * Os dados vivem só no dispositivo: limpar os dados do browser apaga-os.
 * Esta cópia (um ficheiro .json, fotos incluídas) é a forma de os levar
 * para outro telemóvel ou de os recuperar. Partes puras, testáveis.
 */
export const VERSAO_COPIA = 1;

/** Valida uma cópia lida de ficheiro. Devolve { ok, erro? }. */
export function validarCopia(c) {
  if (!c || typeof c !== "object" || c.app !== "poupeja") return { ok: false, erro: "Este ficheiro não é uma cópia do PoupeJá." };
  if (!(c.versao >= 1)) return { ok: false, erro: "A cópia está incompleta ou danificada." };
  if (c.versao > VERSAO_COPIA) return { ok: false, erro: "Esta cópia foi feita numa versão mais recente da app. Atualiza o PoupeJá e tenta de novo." };
  if (!Array.isArray(c.garantias) || !Array.isArray(c.renovacoes)) return { ok: false, erro: "A cópia está incompleta ou danificada." };
  return { ok: true };
}

/** Junta por id: o que já existe no dispositivo não é apagado nem substituído. */
export function juntarPorId(locais, vindos) {
  const ids = new Set(locais.map(x => x.id));
  const novos = [];
  for (const x of vindos) {
    if (!x || !x.id || ids.has(x.id)) continue;
    ids.add(x.id);
    novos.push(x);
  }
  return [...locais, ...novos];
}
