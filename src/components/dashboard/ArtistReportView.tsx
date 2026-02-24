import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ARTISTS } from "@/lib/artists";
import DemandList from "@/components/dashboard/DemandList";
import type { DemandRow, DeliverableRow } from "@/types/demands";
import type { AppRole } from "@/hooks/useAuth";
import type { UseMutationResult } from "@tanstack/react-query";
import { FileBarChart } from "lucide-react";

interface ArtistReportViewProps {
  demands: DemandRow[];
  deliverables: DeliverableRow[];
  role: AppRole | null;
  userId: string;
  updatingId: string | null;
  onUpdateStatus: (id: string, newStatus: string) => void;
  onRefresh: () => void;
  canEditOrDelete: boolean;
  onEdit: (demand: DemandRow) => void;
  onDelete: (id: string) => void;
  updateStatusMutation: UseMutationResult<void, Error, { id: string; status: "aguardando" | "em_producao" | "concluido" }, unknown>;
  deleteDemandMutation: UseMutationResult<void, Error, string, unknown>;
}

export default function ArtistReportView({
  demands,
  deliverables,
  role,
  userId,
  updatingId,
  onUpdateStatus,
  onRefresh,
  canEditOrDelete,
  onEdit,
  onDelete,
  updateStatusMutation,
  deleteDemandMutation,
}: ArtistReportViewProps) {
  const [selectedArtist, setSelectedArtist] = useState<string>("");

  const byArtist = selectedArtist
    ? demands.filter((d) => (d.artist_name ?? "").trim() === selectedArtist)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5 text-muted-foreground shrink-0" />
          <h2 className="text-lg font-semibold">
            {role === "produtor" ? "Suas demandas por artista" : "Relatório por artista"}
          </h2>
        </div>
        <Select value={selectedArtist} onValueChange={setSelectedArtist}>
          <SelectTrigger className="w-full sm:w-[280px] min-h-[44px] sm:min-h-0">
            <SelectValue placeholder={role === "produtor" ? "Selecione um artista para ver suas demandas" : "Selecione um artista para ver as demandas"} />
          </SelectTrigger>
          <SelectContent>
            {ARTISTS.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedArtist ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {role === "produtor"
            ? "Selecione um artista acima para listar suas demandas para ele(a)."
            : "Selecione um artista acima para listar as demandas feitas para ele(a)."}
        </p>
      ) : byArtist.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nenhuma demanda encontrada para o artista &quot;{selectedArtist}&quot;.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            <strong>{byArtist.length}</strong> {byArtist.length === 1 ? "demanda" : "demandas"} para <strong>{selectedArtist}</strong>.
          </p>
          <DemandList
            filtered={byArtist}
            deliverables={deliverables}
            role={role}
            userId={userId}
            updatingId={updatingId}
            onUpdateStatus={onUpdateStatus}
            onRefresh={onRefresh}
            canEditOrDelete={canEditOrDelete}
            onEdit={onEdit}
            onDelete={onDelete}
            updateStatusMutation={updateStatusMutation}
            deleteDemandMutation={deleteDemandMutation}
          />
        </>
      )}
    </div>
  );
}
