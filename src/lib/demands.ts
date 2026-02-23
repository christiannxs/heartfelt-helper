import { startOfDay, subDays } from "date-fns";

/** Considera "prazo próximo" se due_at estiver nos próximos dias (não concluída). */
const PRAZO_PROXIMO_HORAS = 48; // 2 dias

export function isDueSoon(dueAt: string | null, status: string): boolean {
  if (!dueAt || status === "concluido") return false;
  const due = new Date(dueAt).getTime();
  const now = Date.now();
  const diffHours = (due - now) / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= PRAZO_PROXIMO_HORAS;
}

export function isOverdue(dueAt: string | null, status: string): boolean {
  if (!dueAt || status === "concluido") return false;
  return new Date(dueAt).getTime() < Date.now();
}

/** Retorna o início do período para filtro (created_at). */
export function getPeriodStart(preset: string): Date | null {
  const now = new Date();
  switch (preset) {
    case "7":
      return startOfDay(subDays(now, 7));
    case "30":
      return startOfDay(subDays(now, 30));
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null;
  }
}

export function countDueSoon(
  demands: { due_at: string | null; status: string }[]
): number {
  return demands.filter((d) => isDueSoon(d.due_at, d.status)).length;
}
