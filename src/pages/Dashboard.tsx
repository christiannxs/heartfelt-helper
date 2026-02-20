import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DemandCard from "@/components/DemandCard";
import CreateDemandDialog from "@/components/CreateDemandDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LogOut, Music2, LayoutDashboard } from "lucide-react";

interface Demand {
  id: string;
  name: string;
  description: string | null;
  producer_name: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { role, displayName, signOut } = useAuth();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProducer, setFilterProducer] = useState<string>("all");

  const fetchDemands = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("demands")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar demandas");
    } else {
      setDemands((data as Demand[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDemands();
  }, [fetchDemands]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("demands")
      .update({ status: newStatus as "aguardando" | "em_producao" | "concluido" })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success("Status atualizado!");
      fetchDemands();
    }
    setUpdatingId(null);
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

  const roleLabel = role === "atendente" ? "Atendente" : role === "produtor" ? "Produtor" : "CEO";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Music2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">PHD STUDIO DEMANDAS</h1>
              <p className="text-xs text-muted-foreground">{roleLabel} · {displayName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Stats */}
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

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Demandas</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(role === "ceo" || role === "atendente") && (
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
                    <SelectItem value="Mhad">Mhad</SelectItem>
                    <SelectItem value="Felipe 1x">Felipe 1x</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            {role === "atendente" && <CreateDemandDialog onCreated={fetchDemands} />}
          </div>
        </div>

        {/* Demand list */}
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
                demand={d}
                role={role}
                onUpdateStatus={handleUpdateStatus}
                updating={updatingId === d.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
