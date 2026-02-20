import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  onCreated: () => void;
}

export default function CreateDemandDialog({ onCreated }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [producer, setProducer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("demands").insert({
      name,
      description: description || null,
      producer_name: producer,
      created_by: user.id,
    });
    if (error) {
      toast.error("Erro ao criar demanda: " + error.message);
    } else {
      toast.success("Demanda criada com sucesso!");
      setName("");
      setDescription("");
      setProducer("");
      setOpen(false);
      onCreated();
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
            <Label>Produtor</Label>
            <Select value={producer} onValueChange={setProducer} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produtor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mhad">Mhad</SelectItem>
                <SelectItem value="Felipe 1x">Felipe 1x</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !producer}>
            {submitting ? "Criando..." : "Criar Demanda"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
