import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DemandCard from "@/components/DemandCard";
import CreateDemandDialog from "@/components/CreateDemandDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, LayoutDashboard, UserPlus } from "lucide-react";
import UserManagement from "@/components/UserManagement";
import { useProducers } from "@/hooks/useProducers";

interface Demand {
  id: string;
  name: string;
  description: string | null;
  producer_name: string;
  status: string;
  created_at: string;
}

export interface DeliverableRow {
  id: string;
  demand_id: string;
  storage_path?: string | null;
  file_name?: string | null;
  comments?: string | null;
  uploaded_by?: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchDemands() {
  const { data, error } = await supabase
    .from("demands")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Demand[];
}

async function fetchDeliverables(): Promise<DeliverableRow[]> {
  const { data, error } = await supabase.from("demand_deliverables").select("*");
  if (error) throw error;
  return (data ?? []) as DeliverableRow[];
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { user, loading: authLoading, role, displayName, signOut } = useAuth();
  const { data: demands = [], isLoading: demandsLoading } = useQuery({ queryKey: ["demands"], queryFn: fetchDemands });
  const { data: deliverablesList = [] } = useQuery({ queryKey: ["deliverables"], queryFn: fetchDeliverables });
  const { data: producers = [] } = useProducers(role);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "aguardando" | "em_producao" | "concluido" }) => {
      const { error } = await supabase.from("demands").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["demands"] }),
  });

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProducer, setFilterProducer] = useState<string>("all");

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const deliverables: DeliverableRow[] = deliverablesList;

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: newStatus as "aguardando" | "em_producao" | "concluido",
      });
      toast.success("Status atualizado!");
    } catch {
      toast.error("Erro ao atualizar status");
    }
    setUpdatingId(null);
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["demands"] });
    queryClient.invalidateQueries({ queryKey: ["deliverables"] });
  };

  const filtered = demands.filter((d) => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (filterProducer !== "all" && d.producer_name !== filterProducer) return false;
    return true;
  });

  const counts = {
    aguardando: demands.filter((d) => d.status === "aguardando").length,
    em_producao: demands.filter((d) => d.status === "em_producao").length,
    concluido: demands.filter((d) => d.status === "concluido").length,
  };

  const roleLabel = role === "atendente" ? "Atendente" : role === "produtor" ? "Produtor" : role === "admin" ? "Desenvolvedor" : "CEO";
  const loading = demandsLoading;

  const demandsContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-[hsl(var(--warning))]">{counts.aguardando}</p>
          <p className="text-xs text-muted-foreground">Aguardando</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{counts.em_producao}</p>
          <p className="text-xs text-muted-foreground">Em Produção</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-[hsl(var(--success))]">{counts.concluido}</p>
          <p className="text-xs text-muted-foreground">Concluído</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Demandas</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(role === "ceo" || role === "atendente" || role === "admin") && (
            <>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
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
                <SelectTrigger className="w-[150px]">
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
          {(role === "atendente" || role === "admin" || role === "ceo") && <CreateDemandDialog onCreated={refetch} />}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma demanda encontrada.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <DemandCard
              key={d.id}
              demand={{ ...d, created_at: d.created_at }}
              role={role!}
              deliverable={deliverables.find((x) => x.demand_id === d.id) ?? null}
              userId={user?.id ?? ""}
              onUpdateStatus={handleUpdateStatus}
              onRefresh={refetch}
              updating={updatingId === d.id}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary/20 bg-accent sticky top-0 z-10">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
            <div>
              <h1 className="text-lg font-black leading-none text-accent-foreground tracking-tight"><span className="text-primary">DEMANDAS</span></h1>
              <p className="text-xs text-muted-foreground">{roleLabel} · {displayName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-accent-foreground hover:text-primary" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {role === "admin" ? (
          <Tabs defaultValue="demandas" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="h-11">
                <TabsTrigger value="demandas" className="gap-2 px-4">
                  <LayoutDashboard className="h-4 w-4" />
                  Demandas
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

            <TabsContent value="gerenciar-usuarios" className="mt-0">
              <UserManagement expandedByDefault />
            </TabsContent>
          </Tabs>
        ) : (
          demandsContent
        )}
      </main>
    </div>
  );
}
