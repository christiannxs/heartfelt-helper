import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProducers } from "@/hooks/useProducers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onCreated: () => void;
}

export default function CreateDemandDialog({ onCreated }: Props) {
  const { user, role } = useAuth();
  const { data: producers = [] } = useProducers(role);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [producer, setProducer] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("demands").insert({
        name,
        description: description || null,
        producer_name: producer,
        created_by: user.id,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      });
      if (error) throw error;
      toast.success("Demanda criada com sucesso!");
      setName("");
      setDescription("");
      setProducer("");
      setDueAt("");
      setOpen(false);
      onCreated();
    } catch (err: unknown) {
      toast.error("Erro ao criar demanda: " + (err instanceof Error ? err.message : "Erro desconhecido"));
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nova Demanda
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Demanda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="demand-name">Nome da Demanda</Label>
            <Input id="demand-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Beat Trap para artista X" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demand-desc">Descrição</Label>
            <Textarea id="demand-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes sobre a demanda..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demand-due">Prazo de entrega</Label>
            <Input
              id="demand-due"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-muted-foreground">Opcional. Define o limite para esta demanda ser entregue.</p>
          </div>
          <div className="space-y-2">
            <Label>Produtor</Label>
            <p className="text-xs text-muted-foreground">Consulte a disponibilidade dos produtores no topo da página para saber quando solicitar demandas.</p>
            <Select value={producer} onValueChange={setProducer} required disabled={producers.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={producers.length === 0 ? "Nenhum produtor cadastrado" : "Selecione o produtor"} />
              </SelectTrigger>
              <SelectContent>
                {producers.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !producer || producers.length === 0}>
            {submitting ? "Criando..." : "Criar Demanda"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
