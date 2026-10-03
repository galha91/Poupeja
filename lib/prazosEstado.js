import { diaDoAno, diasEntre, paraData, hojeIso } from "./datas.js";

/*
 * Prazos do Estado (data/prazos-estado.json) — próxima ocorrência e filtros.
 * O ficheiro guarda datas sem ano ("MM-DD") para não ter de ser editado
 * todos os anos; aqui calcula-se a próxima vez que cada prazo acaba.
 */

export const PERFIS = [
  { id: "filhos",    label: "Tenho filhos" },
  { id: "arrendo",   label: "Arrendo" },
  { id: "casa",      label: "Casa própria ou crédito" },
  { id: "jovem",     label: "Até 35 anos" },
  { id: "estudante", label: "Estudante" },
];

/**
 * Próximo período ainda por terminar: { inicio, fim, aberto } (datas ISO),
 * ou null para prazos contínuos/sem data.
 */
export function proximoPeriodo(prazo, hoje = hojeIso()) {
  if (prazo?.tipo !== "anual" || !Array.isArray(prazo.periodos)) return null;
  const ano = paraData(hoje)?.getFullYear();
  if (!ano) return null;
  const cands = [];
  for (const a of [ano, ano + 1]) {
    for (const p of prazo.periodos) {
      const fim = diaDoAno(a, p.fim);
      if (!fim) continue;
      const inicio = p.inicio ? diaDoAno(a, p.inicio) : null;
      cands.push({ inicio, fim });
    }
  }
  const futuros = cands
    .filter(c => diasEntre(hoje, c.fim) >= 0)
    .sort((x, y) => diasEntre(y.fim, x.fim));
  if (!futuros.length) return null;
  const c = futuros[0];
  return { ...c, aberto: !c.inicio || diasEntre(c.inicio, hoje) >= 0 };
}

export function filtrarPorPerfil(prazos, perfis = []) {
  if (!perfis.length) return prazos;
  return prazos.filter(p =>
    !Array.isArray(p.perfis) || p.perfis.includes("todos") || p.perfis.some(x => perfis.includes(x))
  );
}

/** Os que têm data primeiro (o que acaba mais cedo à frente); os contínuos no fim. */
export function ordenarPrazos(prazos, hoje = hojeIso()) {
  return prazos
    .map(p => ({ ...p, proximo: proximoPeriodo(p.prazo, hoje) }))
    .sort((a, b) => {
      if (!a.proximo && !b.proximo) return 0;
      if (!a.proximo) return 1;
      if (!b.proximo) return -1;
      return diasEntre(b.proximo.fim, a.proximo.fim);
    });
}

/** Verificação mínima do ficheiro, para um erro de edição não partir o ecrã. */
export function prazoValido(p) {
  if (!p || typeof p !== "object") return false;
  if (!p.id || !p.titulo || !p.link || !/^https:\/\//.test(p.link)) return false;
  if (p.prazo?.tipo === "continuo") return true;
  if (p.prazo?.tipo !== "anual" || !Array.isArray(p.prazo.periodos) || !p.prazo.periodos.length) return false;
  return p.prazo.periodos.every(x => /^\d{2}-\d{2}$/.test(x.fim) && (!x.inicio || /^\d{2}-\d{2}$/.test(x.inicio)));
}
