import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock, Loader2, CheckCircle2, Play, Flag, Pencil, Trash2, RotateCcw, AlertTriangle, Eye } from "lucide-react";
import DemandDeliverySection from "@/components/DemandDeliverySection";
import type { DemandRow, DeliverableRow } from "@/types/demands";
import type { AppRole } from "@/hooks/useAuth";
import { isDueSoon, isOverdue } from "@/lib/demands";

interface DemandCardProps {
  demand: DemandRow;
  role: AppRole | null;
  deliverable?: DeliverableRow | null;
  userId?: string;
  onUpdateStatus?: (id: string, newStatus: string) => void;
  onRefresh?: () => void;
  updating?: boolean;
  canEditOrDelete?: boolean;
  onEdit?: (demand: DemandRow) => void;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  aguardando: {
    label: "Aguardando",
    icon: <Clock className="h-3.5 w-3.5" />,
    className: "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] border-transparent",
  },
  em_producao: {
    label: "Em Produção",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    className: "bg-primary text-primary-foreground border-transparent",
  },
  concluido: {
    label: "Concluído",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] border-transparent",
  },
};

export default function DemandCard({
  demand,
  role,
  deliverable = null,
  userId = "",
  onUpdateStatus,
  onRefresh,
  updating,
  canEditOrDelete = false,
  onEdit,
  onDelete,
  deleting = false,
}: DemandCardProps) {
  const config = statusConfig[demand.status] ?? statusConfig.aguardando;
  const dueSoon = isDueSoon(demand.due_at, demand.status);
  const overdue = isOverdue(demand.due_at, demand.status);

  return (
    <Card
      className={`rounded-xl border-border transition-shadow hover:shadow-md overflow-hidden ${dueSoon || overdue ? "border-[hsl(var(--warning))]/50" : ""}`}
    >
      <CardHeader className="p-4 pb-2 space-y-3">
        {/* Linha 1: artista + título (com clamp) e ações */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {demand.artist_name && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{demand.artist_name}</p>
            )}
            <CardTitle className="text-base leading-snug line-clamp-2 break-words mt-0.5">{demand.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 touch-manipulation" title="Abrir">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  {demand.artist_name && (
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{demand.artist_name}</p>
                  )}
                  <DialogTitle className="text-lg pr-8">{demand.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  {demand.description && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Descrição</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{demand.description}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground border-t pt-4">
                    {demand.solicitante_name && (
                      <span>Solicitante: <strong className="text-foreground">{demand.solicitante_name}</strong></span>
                    )}
                    <span>Produtor: <strong className="text-foreground">{demand.producer_name}</strong></span>
                    <span>Criada: {new Date(demand.created_at).toLocaleDateString("pt-BR")}</span>
                    {demand.due_at && (
                      <span>Prazo: <strong className="text-foreground">{new Date(demand.due_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong></span>
                    )}
                  </div>
                  <div className="pt-2">
                    <Badge className={config.className}>
                      <span className="flex items-center gap-1">
                        {config.icon}
                        {config.label}
                      </span>
                    </Badge>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {canEditOrDelete && onEdit && (
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 touch-manipulation" onClick={() => onEdit(demand)} title="Editar">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {canEditOrDelete && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive touch-manipulation" disabled={deleting} title="Apagar">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apagar demanda?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A demanda &quot;{demand.name}&quot; será removida. Entregas vinculadas também serão removidas. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(demand.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleting}>
                      {deleting ? "Apagando..." : "Apagar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        {/* Linha 2: badge de status com espaço garantido (nunca trunca) */}
        <div className="flex items-center justify-between gap-2">
          <Badge className={`${config.className} whitespace-nowrap shrink-0 w-fit`}>
            <span className="flex items-center gap-1.5">
              {config.icon}
              {config.label}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {demand.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 break-words">{demand.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          {demand.solicitante_name && (
            <span>Solicitante: <strong className="text-foreground">{demand.solicitante_name}</strong></span>
          )}
          <span>Produtor: <strong className="text-foreground">{demand.producer_name}</strong></span>
          <span>Criada: {new Date(demand.created_at).toLocaleDateString("pt-BR")}</span>
          {demand.due_at && (
            <span>Prazo: <strong className="text-foreground">{new Date(demand.due_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong></span>
          )}
          {(dueSoon || overdue) && (
            <span className="inline-flex items-center gap-1 rounded bg-[hsl(var(--warning))]/20 px-1.5 py-0.5 text-[hsl(var(--warning))] font-medium">
              <AlertTriangle className="h-3 w-3" />
              {overdue ? "Atrasada" : "Prazo próximo"}
            </span>
          )}
        </div>
        {role === "produtor" && (
          <div className="flex gap-2 pt-1">
            {demand.status === "aguardando" && (
              <Button size="sm" onClick={() => onUpdateStatus?.(demand.id, "em_producao")} disabled={updating}>
                <Play className="h-3.5 w-3.5 mr-1" /> Iniciar Produção
              </Button>
            )}
            {demand.status === "em_producao" && (
              <Button size="sm" variant="outline" className="border-[hsl(var(--success))] text-[hsl(var(--success))]" onClick={() => onUpdateStatus?.(demand.id, "concluido")} disabled={updating}>
                <Flag className="h-3.5 w-3.5 mr-1" /> Finalizar
              </Button>
            )}
          </div>
        )}
        {/* Admin, Atendente, CEO: podem reabrir demanda concluída para alteração */}
        {(role === "admin" || role === "atendente" || role === "ceo") && demand.status === "concluido" && (
          <div className="pt-1">
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus?.(demand.id, "em_producao")} disabled={updating}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Voltar para alteração
            </Button>
          </div>
        )}
        {/* Produtor: mostra aba de comentário e upload ao iniciar (em_producao) ou quando concluído */}
        {role === "produtor" && (demand.status === "em_producao" || demand.status === "concluido") && onRefresh && (
          <DemandDeliverySection
            demandId={demand.id}
            role={role}
            deliverable={deliverable}
            userId={userId}
            onRefresh={onRefresh}
          />
        )}
        {/* Outros perfis: só mostram entrega quando concluído */}
        {role !== "produtor" && demand.status === "concluido" && onRefresh && (
          <DemandDeliverySection
            demandId={demand.id}
            role={role}
            deliverable={deliverable}
            userId={userId}
            onRefresh={onRefresh}
          />
        )}
      </CardContent>
    </Card>
  );
}
