import DemandCard from "@/components/DemandCard";
import type { DemandRow, DeliverableRow } from "@/types/demands";
import type { AppRole } from "@/hooks/useAuth";
import type { UseMutationResult } from "@tanstack/react-query";

interface DemandListProps {
  filtered: DemandRow[];
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

export default function DemandList({
  filtered,
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
}: DemandListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
      {filtered.map((d) => (
        <DemandCard
          key={d.id}
          demand={d}
          role={role}
          deliverable={deliverables.find((x) => x.demand_id === d.id) ?? null}
          userId={userId}
          onUpdateStatus={onUpdateStatus}
          onRefresh={onRefresh}
          updating={updatingId === d.id}
          canEditOrDelete={canEditOrDelete}
          onEdit={canEditOrDelete ? onEdit : undefined}
          onDelete={canEditOrDelete ? onDelete : undefined}
          deleting={deleteDemandMutation.isPending}
        />
      ))}
    </div>
  );
}
