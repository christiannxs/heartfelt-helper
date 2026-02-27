import { useMemo, useState } from "react";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDemands } from "@/hooks/useDemands";
import type { DemandRow } from "@/types/demands";

interface Props {
  userId: string;
  onEditDemand?: (demand: DemandRow) => void;
  onAddDemandWithDate?: (date: Date) => void;
}

const statusLabel: Record<string, string> = {
  aguardando: "Aguardando",
  em_producao: "Em produção",
  concluido: "Concluído",
};

export default function ProducerAvailabilityCalendar({ userId, onEditDemand, onAddDemandWithDate }: Props) {
  const { displayName } = useAuth();
  const { demands, isLoading } = useDemands();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const markedDates = useMemo(() => {
    if (!displayName) return [];
    const dates = demands
      .filter((d) => d.producer_name === displayName && d.due_at)
      .map((d) => {
        const date = new Date(d.due_at!);
        return startOfDay(date);
      });

    return [...new Set(dates.map((d) => d.toISOString()))].map((iso) => startOfDay(new Date(iso)));
  }, [demands, displayName]);

  const demandsOnSelectedDay = useMemo((): DemandRow[] => {
    if (!selectedDate || !displayName) return [];
    const dayKey = format(selectedDate, "yyyy-MM-dd");
    return demands.filter((d) => {
      if (d.producer_name !== displayName || !d.due_at) return false;
      const dueDay = format(new Date(d.due_at), "yyyy-MM-dd");
      return dueDay === dayKey;
    });
  }, [demands, displayName, selectedDate]);

  return (
    <Card className="border border-border/70 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Meu calendário de términos
        </CardTitle>
        <CardDescription>
          Clique em um dia para ver as demandas com término naquela data. Dias destacados indicam
          datas já comprometidas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex w-full flex-col items-center gap-3 rounded-xl bg-muted/40 px-4 py-4 shadow-inner">
            <Calendar
              className="w-full max-w-none rounded-xl border bg-background shadow-sm"
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              disabled={(date) => date < startOfDay(new Date())}
              modifiers={{ busy: markedDates }}
              modifiersClassNames={{
                busy:
                  "bg-destructive text-destructive-foreground font-semibold rounded-full border border-destructive",
              }}
            />
            <div className="mt-1 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-destructive" />
                <span>Dia ocupado (término marcado)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border border-muted-foreground/60" />
                <span>Dia livre</span>
              </div>
            </div>
            <div className="w-full rounded-lg border bg-card px-3 py-2 text-xs sm:text-sm text-muted-foreground space-y-2">
              {selectedDate ? (
                <>
                  <p className="font-medium text-foreground">
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </p>
                  {onAddDemandWithDate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => onAddDemandWithDate(selectedDate)}
                    >
                      <Plus className="h-4 w-4" />
                      Nova demanda com término neste dia
                    </Button>
                  )}
                  {demandsOnSelectedDay.length > 0 ? (
                    <ul className="space-y-1.5">
                      {demandsOnSelectedDay.map((d) => (
                        <li key={d.id}>
                          {onEditDemand ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start gap-2 h-auto py-1.5 px-2 rounded-md bg-muted/60 hover:bg-muted text-left font-normal"
                              onClick={() => onEditDemand(d)}
                            >
                              <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="font-medium text-foreground truncate flex-1">{d.name}</span>
                              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs shrink-0">
                                {statusLabel[d.status] ?? d.status}
                              </span>
                              {d.solicitante_name && (
                                <span className="text-muted-foreground truncate hidden sm:inline">
                                  {d.solicitante_name}
                                </span>
                              )}
                            </Button>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/60 px-2 py-1.5">
                              <span className="font-medium text-foreground truncate">{d.name}</span>
                              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">
                                {statusLabel[d.status] ?? d.status}
                              </span>
                              {d.solicitante_name && (
                                <span className="text-muted-foreground truncate">{d.solicitante_name}</span>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma demanda com término neste dia.</p>
                  )}
                </>
              ) : (
                <p>Clique em um dia para ver as demandas com término naquela data.</p>
              )}
            </div>
          </div>
        </div>
        {isLoading && (
          <div className="flex justify-center py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
