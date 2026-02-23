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
import { Clock, Loader2, CheckCircle2, Play, Flag, Pencil, Trash2, RotateCcw } from "lucide-react";
import DemandDeliverySection, { type DeliverableRow } from "@/components/DemandDeliverySection";

interface Demand {
  id: string;
  name: string;
  description: string | null;
  producer_name: string;
  status: string;
  created_at: string;
}

interface DemandCardProps {
  demand: Demand;
  role: string | null;
  deliverable?: DeliverableRow | null;
  userId?: string;
  onUpdateStatus?: (id: string, newStatus: string) => void;
  onRefresh?: () => void;
  updating?: boolean;
  canEditOrDelete?: boolean;
  onEdit?: (demand: Demand) => void;
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

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{demand.name}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            {canEditOrDelete && onEdit && (
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(demand)} title="Editar">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {canEditOrDelete && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={deleting} title="Apagar">
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
            <Badge className={config.className}>
              <span className="flex items-center gap-1">
                {config.icon}
                {config.label}
              </span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {demand.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{demand.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Produtor: <strong className="text-foreground">{demand.producer_name}</strong></span>
          <span>{new Date(demand.created_at).toLocaleDateString("pt-BR")}</span>
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
