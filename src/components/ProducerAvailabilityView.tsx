import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducerAvailabilityForView, type AvailabilityForViewRow } from "@/hooks/useProducerAvailability";
import { CalendarCheck } from "lucide-react";

function timeShort(t: string): string {
  if (!t) return "";
  return t.slice(0, 5);
}

export default function ProducerAvailabilityView() {
  const { data: rows = [], isLoading } = useProducerAvailabilityForView(true);
  const [selectedProducer, setSelectedProducer] = useState<string>("");

  const byProducer = useMemo(() => {
    const map = new Map<string, AvailabilityForViewRow[]>();
    for (const r of rows) {
      const list = map.get(r.producer_name) ?? [];
      list.push(r);
      map.set(r.producer_name, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.date.localeCompare(b.date) || a.slot_start.localeCompare(b.slot_start));
    }
    return map;
  }, [rows]);

  const producers = useMemo(() => Array.from(byProducer.keys()).sort((a, b) => a.localeCompare(b)), [byProducer]);
  const selectedRows = selectedProducer ? byProducer.get(selectedProducer) ?? [] : rows;

  const byDate = useMemo(() => {
    const map = new Map<string, AvailabilityForViewRow[]>();
    for (const r of selectedRows) {
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    }
    return map;
  }, [selectedRows]);

  const markedDates = useMemo(
    () => [...new Set(selectedRows.map((r) => r.date))].map((d) => new Date(d)),
    [selectedRows]
  );

  const firstProducer = producers[0];
  const currentProducer = selectedProducer || (firstProducer ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5" />
          Disponibilidade dos produtores
        </CardTitle>
        <CardDescription>
          Consulte quando cada produtor está disponível para planejar e solicitar demandas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {producers.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Produtor</label>
            <Select
              value={currentProducer}
              onValueChange={(v) => setSelectedProducer(v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o produtor" />
              </SelectTrigger>
              <SelectContent>
                {producers.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : selectedRows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            {rows.length === 0
              ? "Nenhum produtor cadastrou disponibilidade ainda."
              : currentProducer
                ? "Este produtor ainda não cadastrou horários de disponibilidade."
                : "Selecione um produtor para ver os horários."}
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6">
            <Calendar
              mode="single"
              selected={undefined}
              locale={ptBR}
              modifiers={{ available: markedDates }}
              modifiersClassNames={{ available: "bg-primary/20 font-semibold" }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium mb-2">
                {currentProducer ? `Horários – ${currentProducer}` : "Horários"}
              </h4>
              <ul className="space-y-3">
                {Array.from(byDate.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateStr, slotList]) => (
                    <li key={dateStr} className="rounded-lg border bg-card p-3 text-sm">
                      <span className="font-medium text-muted-foreground">
                        {format(new Date(dateStr + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </span>
                      <ul className="mt-1 flex flex-wrap gap-2">
                        {slotList.map((s, i) => (
                          <li key={`${s.date}-${s.slot_start}-${i}`} className="rounded bg-muted px-2 py-0.5">
                            {timeShort(s.slot_start)} – {timeShort(s.slot_end)}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
