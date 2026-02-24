import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProducers } from "@/hooks/useProducers";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ARTISTS } from "@/lib/artists";

export interface DemandForEdit {
  id: string;
  artist_name: string | null;
  name: string;
  description: string | null;
  producer_name: string;
  status: string;
  due_at: string | null;
}

interface Props {
  demand: DemandForEdit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export default function EditDemandDialog({ demand, open, onOpenChange, onUpdated }: Props) {
  const { role } = useAuth();
  const { data: producers = [] } = useProducers(role);
  const [artist, setArtist] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [producer, setProducer] = useState("");
  const [status, setStatus] = useState<string>("aguardando");
  const [dueAt, setDueAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (demand) {
      setArtist(demand.artist_name ?? "");
      setName(demand.name);
      setDescription(demand.description ?? "");
      setProducer(demand.producer_name);
      setStatus(demand.status);
      if (demand.due_at) {
        const d = new Date(demand.due_at);
        const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate(), h = d.getHours(), min = d.getMinutes();
        setDueAt(`${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
      } else {
        setDueAt("");
      }
    }
  }, [demand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demand) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("demands")
        .update({
          artist_name: artist?.trim() || null,
          name,
          description: description || null,
          producer_name: producer,
          status: status as "aguardando" | "em_producao" | "concluido",
          due_at: dueAt ? new Date(dueAt).toISOString() : null,
        })
        .eq("id", demand.id);
      if (error) throw error;
      toast.success("Demanda atualizada!");
      onOpenChange(false);
      onUpdated();
    } catch (err: unknown) {
      toast.error("Erro ao atualizar: " + (err instanceof Error ? err.message : "Erro desconhecido"));
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Demanda</DialogTitle>
        </DialogHeader>
        {demand && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Artista</Label>
              <Select value={artist} onValueChange={setArtist}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o artista" />
                </SelectTrigger>
                <SelectContent>
                  {ARTISTS.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-demand-name">Nome da Demanda</Label>
              <Input
                id="edit-demand-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: Beat Trap para artista X"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-demand-desc">Descrição</Label>
              <Textarea
                id="edit-demand-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes sobre a demanda..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-demand-due">Prazo de entrega</Label>
              <Input
                id="edit-demand-due"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Produtor</Label>
              <Select value={producer} onValueChange={setProducer} required disabled={producers.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={producers.length === 0 ? "Nenhum produtor cadastrado" : "Selecione o produtor"} />
                </SelectTrigger>
                <SelectContent>
                  {producers.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="em_producao">Em Produção</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !producer || producers.length === 0}>
              {submitting ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
