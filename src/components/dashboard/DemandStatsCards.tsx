interface DemandStatsCardsProps {
  counts: { aguardando: number; em_producao: number; concluido: number };
  filterStatus: string;
  onStatusCardClick: (status: string) => void;
}

export default function DemandStatsCards({ counts, filterStatus, onStatusCardClick }: DemandStatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => onStatusCardClick("aguardando")}
          className={`min-h-[72px] sm:min-h-0 rounded-xl border bg-card p-3 sm:p-4 text-center transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${filterStatus === "aguardando" ? "ring-2 ring-[hsl(var(--warning))] border-[hsl(var(--warning))]" : ""}`}
        >
          <p className="text-2xl font-bold text-[hsl(var(--warning))]">{counts.aguardando}</p>
          <p className="text-xs text-muted-foreground">Aguardando</p>
        </button>
        <button
          type="button"
          onClick={() => onStatusCardClick("em_producao")}
          className={`min-h-[72px] sm:min-h-0 rounded-xl border bg-card p-3 sm:p-4 text-center transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${filterStatus === "em_producao" ? "ring-2 ring-primary border-primary" : ""}`}
        >
          <p className="text-2xl font-bold text-primary">{counts.em_producao}</p>
          <p className="text-xs text-muted-foreground">Em Produção</p>
        </button>
        <button
          type="button"
          onClick={() => onStatusCardClick("concluido")}
          className={`min-h-[72px] sm:min-h-0 rounded-xl border bg-card p-3 sm:p-4 text-center transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${filterStatus === "concluido" ? "ring-2 ring-[hsl(var(--success))] border-[hsl(var(--success))]" : ""}`}
        >
          <p className="text-2xl font-bold text-[hsl(var(--success))]">{counts.concluido}</p>
          <p className="text-xs text-muted-foreground">Concluído</p>
        </button>
    </div>
  );
}
