import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateDemandDialog from "@/components/CreateDemandDialog";
import { LayoutDashboard } from "lucide-react";

const PERIOD_OPTIONS = [
  { value: "all", label: "Todos os períodos" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "month", label: "Este mês" },
] as const;

interface DemandFiltersProps {
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterProducer: string;
  setFilterProducer: (v: string) => void;
  dateFilter: string;
  setDateFilter: (v: string) => void;
  producers: string[];
  showFilters: boolean;
  showCreateButton: boolean;
  onCreated: () => void;
}

export default function DemandFilters({
  filterStatus,
  setFilterStatus,
  filterProducer,
  setFilterProducer,
  dateFilter,
  setDateFilter,
  producers,
  showFilters,
  showCreateButton,
  onCreated,
}: DemandFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-muted-foreground shrink-0" />
        <h2 className="text-lg font-semibold">Demandas</h2>
      </div>
      <div className="flex flex-wrap items-center gap-2 min-h-[44px]">
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-[160px] min-h-[44px] sm:min-h-0">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showFilters && (
          <>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px] min-h-[44px] sm:min-h-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="aguardando">Aguardando</SelectItem>
                <SelectItem value="em_producao">Em Produção</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProducer} onValueChange={setFilterProducer}>
              <SelectTrigger className="w-full sm:w-[150px] min-h-[44px] sm:min-h-0">
                <SelectValue placeholder="Produtor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Produtores</SelectItem>
                {producers.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        {showCreateButton && <CreateDemandDialog onCreated={onCreated} />}
      </div>
    </div>
  );
}
