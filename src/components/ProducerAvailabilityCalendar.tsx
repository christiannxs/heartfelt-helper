import { useMemo } from "react";
import { startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDemands } from "@/hooks/useDemands";

interface Props {
  userId: string;
}

export default function ProducerAvailabilityCalendar({ userId }: Props) {
  const { displayName } = useAuth();
  const { demands, isLoading } = useDemands();

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

  return (
    <Card className="border border-border/70 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Meu calendário de entregas
        </CardTitle>
        <CardDescription>
          Cada demanda com prazo de entrega marcado ocupa automaticamente o dia correspondente. Dias destacados
          indicam datas já comprometidas com entregas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex w-full flex-col items-center gap-3 rounded-xl bg-muted/40 px-4 py-4 shadow-inner">
            <Calendar
              className="w-full max-w-none rounded-xl border bg-background shadow-sm"
              mode="single"
              selected={undefined}
              onSelect={undefined}
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
                <span>Dia ocupado (entrega marcada)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border border-muted-foreground/60" />
                <span>Dia livre</span>
              </div>
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
