import { useMemo } from "react";
import { startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";

interface DemandDateRangeCalendarProps {
  startDate: string;
  dueDate: string;
}

/**
 * Calendário que exibe visualmente o período entre a data de início e a data de término.
 * Quando ambas as datas estão preenchidas, o intervalo é destacado no calendário.
 */
export function DemandDateRangeCalendar({ startDate, dueDate }: DemandDateRangeCalendarProps) {
  const range = useMemo((): DateRange | undefined => {
    if (!startDate?.trim()) return undefined;
    const from = startOfDay(new Date(startDate));
    if (!dueDate?.trim()) return { from };
    const to = startOfDay(new Date(dueDate));
    if (from > to) return { from };
    return { from, to };
  }, [startDate, dueDate]);

  if (!startDate?.trim()) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Período no calendário
      </p>
      <Calendar
        mode="range"
        selected={range}
        onSelect={() => {}}
        locale={ptBR}
        className="w-full max-w-none rounded-md border-0"
        classNames={{
          day_range_start: "rounded-l-md bg-primary text-primary-foreground",
          day_range_end: "rounded-r-md bg-primary text-primary-foreground",
          day_range_middle: "bg-primary/20 text-primary-foreground",
        }}
        disabled={(date) => date < startOfDay(new Date())}
      />
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
          Início → Término
        </span>
      </div>
    </div>
  );
}
