import { useState } from "react";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyAvailability, type ProducerAvailabilityRow } from "@/hooks/useProducerAvailability";
import { toast } from "sonner";
import { CalendarDays, Sun, Moon, Clock, X } from "lucide-react";

const PRESETS = [
  { id: "manha", label: "Manhã", start: "08:00:00", end: "12:00:00", icon: Sun },
  { id: "tarde", label: "Tarde", start: "14:00:00", end: "18:00:00", icon: Moon },
  { id: "dia", label: "Dia todo", start: "08:00:00", end: "18:00:00", icon: Clock },
] as const;

function timeShort(t: string): string {
  return t ? t.slice(0, 5) : "";
}

function slotMatches(s: ProducerAvailabilityRow, start: string, end: string): boolean {
  const a = s.slot_start.slice(0, 5);
  const b = s.slot_end.slice(0, 5);
  const x = start.slice(0, 5);
  const y = end.slice(0, 5);
  return a === x && b === y;
}

interface Props {
  userId: string;
}

export default function ProducerAvailabilityCalendar({ userId }: Props) {
  const { data: slots = [], isLoading, insertSlot, deleteSlot } = useMyAvailability(userId);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const slotsForSelected = selectedDate
    ? slots.filter((s) => s.date === selectedDateStr)
    : [];

  const handlePreset = async (start: string, end: string) => {
    if (!selectedDate) return;
    const already = slotsForSelected.some((s) => slotMatches(s, start, end));
    if (already) {
      toast.info("Este período já está marcado.");
      return;
    }
    try {
      await insertSlot({
        user_id: userId,
        date: selectedDateStr,
        slot_start: start,
        slot_end: end,
      });
      toast.success("Adicionado!");
    } catch (e) {
      toast.error("Erro ao salvar.");
    }
  };

  const handleDelete = async (row: ProducerAvailabilityRow) => {
    try {
      await deleteSlot(row.id);
      toast.success("Removido.");
    } catch {
      toast.error("Erro ao remover.");
    }
  };

  const markedDates = [...new Set(slots.map((s) => s.date))].map((d) => startOfDay(new Date(d)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Minha disponibilidade
        </CardTitle>
        <CardDescription>
          Clique em um dia e escolha Manhã, Tarde ou Dia todo. Assim a equipe sabe quando você está disponível.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              disabled={(date) => date < startOfDay(new Date())}
              modifiers={{ available: markedDates }}
              modifiersClassNames={{ available: "bg-primary/20 font-semibold" }}
            />
          </div>

          <div className="flex-1 min-w-0">
            {selectedDate ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">Toque para adicionar:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map(({ label, start, end, icon: Icon }) => (
                    <Button
                      key={label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handlePreset(start, end)}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
                {slotsForSelected.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground pt-1">Marcados (toque em ✕ para remover):</p>
                    <div className="flex flex-wrap gap-2">
                      {slotsForSelected.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-sm"
                        >
                          {timeShort(s.slot_start)}–{timeShort(s.slot_end)}
                          <button
                            type="button"
                            aria-label="Remover"
                            className="rounded-full p-0.5 hover:bg-primary/30"
                            onClick={() => handleDelete(s)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Clique em um dia no calendário.</p>
            )}
          </div>
        </div>
        {isLoading && (
          <div className="flex justify-center py-2">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
