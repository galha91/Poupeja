/*
 * Datas do IVA zero de 2027 (Orçamento do Estado). À parte de lib/ivaZero
 * para o Início (lib/campanhas) as poder usar sem levar para o browser o
 * código que lê o Supabase.
 */
/*
 * Estado da medida. O Parlamento aprovou o IVA zero no OE2027, mas a
 * 25 nov 2026 o Primeiro-Ministro disse que o Governo não vai criar a lista
 * de alimentos nem aplicá-la. Enquanto não houver lista oficial em vigor, o
 * site fala da medida como "aprovada, mas recusada pelo Governo" e não como
 * certa. Passar a "em-vigor" quando for publicada; "nao-aplicada" se cair.
 */
export const ESTADO = "recusada-pelo-governo";
export const ESTADO_DESDE = "2026-11-25";
export const INICIO = "2027-01-01";
export const FIM_PREVISTO = "2027-03-31";
// A campanha no Início e no email começa depois do Natal.
export const CAMPANHA_DESDE = "2026-12-27";
