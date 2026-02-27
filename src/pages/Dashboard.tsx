import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProducers } from "@/hooks/useProducers";
import { useDemands } from "@/hooks/useDemands";
import EditDemandDialog from "@/components/EditDemandDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { handleApiError } from "@/lib/errors";
import { toast } from "sonner";
import { LogOut, LayoutDashboard, UserPlus, AlertTriangle, FileBarChart } from "lucide-react";
import UserManagement from "@/components/UserManagement";
import ProducerAvailabilityCalendar from "@/components/ProducerAvailabilityCalendar";
import ProducerAvailabilityView from "@/components/ProducerAvailabilityView";
import DemandStatsCards from "@/components/dashboard/DemandStatsCards";
import DemandFilters from "@/components/dashboard/DemandFilters";
import DemandKanban from "@/components/dashboard/DemandKanban";
import ArtistReportView from "@/components/dashboard/ArtistReportView";
import type { DemandRow } from "@/types/demands";
import { getPeriodStart, countDueSoon } from "@/lib/demands";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export default function Dashboard() {
  const { user, loading: authLoading, role, displayName, signOut } = useAuth();
  const { data: producers = [] } = useProducers(role);
  const queryClient = useQueryClient();
  const {
    demands,
    deliverables,
    isLoading: demandsLoading,
    refetch,
    updateStatusMutation,
    deleteDemandMutation,
  } = useDemands();

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingDemand, setEditingDemand] = useState<DemandRow | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProducer, setFilterProducer] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const lastUpdatedByUsRef = useRef<Map<string, number>>(new Map());

  const canEditOrDelete = role === "ceo" || role === "atendente" || role === "admin";

  // Notificações in-app: Realtime em demandas
  useEffect(() => {
    const channel = supabase
      .channel("demands-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "demands" },
        (payload) => {
          const newRow = payload.new as DemandRow;
          const id = newRow?.id;
          if (!id) return;
          const now = Date.now();
          if (lastUpdatedByUsRef.current.get(id) && now - lastUpdatedByUsRef.current.get(id)! < 2500) return;
          queryClient.invalidateQueries({ queryKey: queryKeys.demands.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.deliverables.all });
          const statusLabel = newRow.status === "concluido" ? "Concluída" : newRow.status === "em_producao" ? "Em produção" : "Aguardando";
          toast.info(`Demanda atualizada: ${newRow.name} → ${statusLabel}`);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const periodStart = getPeriodStart(dateFilter);
  const filtered = demands.filter((d) => {
    if (filterStatus === "all") {
      if (d.status === "concluido") return false;
    } else if (d.status !== filterStatus) {
      return false;
    }
    if (filterProducer !== "all" && d.producer_name !== filterProducer) return false;
    if (periodStart && new Date(d.created_at) < periodStart) return false;
    return true;
  });

  const dueSoonCount = countDueSoon(demands);

  /** No relatório por artista: admin/ceo/atendente veem todas; produtor só as suas. */
  const demandsForReport =
    role === "produtor" && displayName != null
      ? demands.filter((d) => d.producer_name === displayName)
      : demands;

  const counts = {
    aguardando: demands.filter((d) => d.status === "aguardando").length,
    em_producao: demands.filter((d) => d.status === "em_producao").length,
    concluido: demands.filter((d) => d.status === "concluido").length,
  };

  const roleLabel = role === "atendente" ? "Atendente" : role === "produtor" ? "Produtor" : role === "admin" ? "Desenvolvedor" : "CEO";

  const handleStatusCardClick = (status: string) => {
    setFilterStatus((prev) => (prev === status ? "all" : status));
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    lastUpdatedByUsRef.current.set(id, Date.now());
    setUpdatingId(id);
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: newStatus as "aguardando" | "em_producao" | "concluido",
      });
      toast.success("Status atualizado!");
    } catch (e) {
      handleApiError(e, "Erro ao atualizar status");
    }
    setUpdatingId(null);
  };

  const availabilitySection =
    role === "produtor" && user ? (
      <ProducerAvailabilityCalendar userId={user.id} />
    ) : (role === "ceo" || role === "atendente" || role === "admin") ? (
      <ProducerAvailabilityView />
    ) : null;

  const demandsContent = (
    <div className="space-y-8">
      {/* Cabeçalho da aba Demandas */}
      <header className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Demandas</h2>
        <p className="text-sm text-muted-foreground">
          Acompanhe e gerencie as solicitações por status, produtor e período.
        </p>
      </header>

      {availabilitySection && (
        <section className="rounded-xl border border-border bg-card/50 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Disponibilidade</h3>
          {availabilitySection}
        </section>
      )}

      {dueSoonCount > 0 && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/10 px-4 py-3.5 text-sm text-[hsl(var(--warning))]"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            {dueSoonCount} {dueSoonCount === 1 ? "demanda com prazo" : "demandas com prazo"} nos próximos 2 dias.
          </span>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Resumo por status</h3>
        <DemandStatsCards
          counts={counts}
          filterStatus={filterStatus}
          onStatusCardClick={handleStatusCardClick}
        />
      </section>

      <section className="space-y-3">
        <DemandFilters
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterProducer={filterProducer}
          setFilterProducer={setFilterProducer}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          producers={producers}
          showFilters={canEditOrDelete}
          showCreateButton={role === "atendente" || role === "admin" || role === "ceo" || role === "produtor"}
          onCreated={refetch}
        />
      </section>

      <section className="space-y-4">
        {demandsLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-muted-foreground">Carregando demandas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center py-16 px-4 text-center">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground/60 mb-3" />
            <p className="font-medium text-foreground">Nenhuma demanda encontrada</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Ajuste os filtros ou crie uma nova demanda para começar.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Lista de demandas
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {filtered.length} {filtered.length === 1 ? "item" : "itens"}
              </span>
            </div>
            <DemandKanban
              filtered={filtered}
              deliverables={deliverables}
              role={role}
              userId={user.id}
              updatingId={updatingId}
              onUpdateStatus={handleUpdateStatus}
              onRefresh={refetch}
              canEditOrDelete={canEditOrDelete}
              onEdit={setEditingDemand}
              onDelete={(id) => deleteDemandMutation.mutate(id)}
              updateStatusMutation={updateStatusMutation}
              deleteDemandMutation={deleteDemandMutation}
            />
          </>
        )}
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary/20 bg-accent sticky top-0 z-10">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/minha-logo.png" alt="Logo" className="h-8 sm:h-9 w-auto object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black leading-none text-accent-foreground tracking-tight truncate"><span className="text-primary">DEMANDAS</span></h1>
              <p className="text-xs text-muted-foreground truncate">{roleLabel} · {displayName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="min-h-[44px] touch-manipulation shrink-0 text-accent-foreground hover:text-primary" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {role === "admin" ? (
          <Tabs defaultValue="demandas" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="h-11 flex-wrap">
                <TabsTrigger value="demandas" className="gap-2 px-4">
                  <LayoutDashboard className="h-4 w-4" />
                  Demandas
                </TabsTrigger>
                <TabsTrigger value="relatorio" className="gap-2 px-4">
                  <FileBarChart className="h-4 w-4" />
                  Relatório
                </TabsTrigger>
                <TabsTrigger value="gerenciar-usuarios" className="gap-2 px-4">
                  <UserPlus className="h-4 w-4" />
                  Gerenciar usuários
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="demandas" className="space-y-6 mt-0">
              {demandsContent}
            </TabsContent>

            <TabsContent value="relatorio" className="mt-0">
              <ArtistReportView
                demands={demandsForReport}
                deliverables={deliverables}
                role={role}
                userId={user.id}
                updatingId={updatingId}
                onUpdateStatus={handleUpdateStatus}
                onRefresh={refetch}
                canEditOrDelete={canEditOrDelete}
                onEdit={setEditingDemand}
                onDelete={(id) => deleteDemandMutation.mutate(id)}
                updateStatusMutation={updateStatusMutation}
                deleteDemandMutation={deleteDemandMutation}
              />
            </TabsContent>

            <TabsContent value="gerenciar-usuarios" className="mt-0">
              <UserManagement expandedByDefault />
            </TabsContent>
          </Tabs>
        ) : (role === "ceo" || role === "atendente" || role === "produtor") ? (
          <Tabs defaultValue="demandas" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="h-11">
                <TabsTrigger value="demandas" className="gap-2 px-4">
                  <LayoutDashboard className="h-4 w-4" />
                  Demandas
                </TabsTrigger>
                <TabsTrigger value="relatorio" className="gap-2 px-4">
                  <FileBarChart className="h-4 w-4" />
                  Relatório
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="demandas" className="space-y-6 mt-0">
              {demandsContent}
            </TabsContent>

            <TabsContent value="relatorio" className="mt-0">
              <ArtistReportView
                demands={demandsForReport}
                deliverables={deliverables}
                role={role}
                userId={user.id}
                updatingId={updatingId}
                onUpdateStatus={handleUpdateStatus}
                onRefresh={refetch}
                canEditOrDelete={canEditOrDelete}
                onEdit={setEditingDemand}
                onDelete={(id) => deleteDemandMutation.mutate(id)}
                updateStatusMutation={updateStatusMutation}
                deleteDemandMutation={deleteDemandMutation}
              />
            </TabsContent>
          </Tabs>
        ) : (
          demandsContent
        )}

        <EditDemandDialog
          demand={editingDemand}
          open={!!editingDemand}
          onOpenChange={(open) => !open && setEditingDemand(null)}
          onUpdated={() => { refetch(); setEditingDemand(null); }}
        />
      </main>
    </div>
  );
}
