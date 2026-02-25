import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProducers } from "@/hooks/useProducers";
import { supabase } from "@/integrations/supabase/client";
import { handleApiError } from "@/lib/errors";
import { toast } from "sonner";
import { ARTISTS } from "@/lib/artists";

const createDemandSchema = z.object({
  artist: z.string().optional().or(z.literal("")),
  name: z.string().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
  description: z.string().max(2000).optional().or(z.literal("")),
  dueAt: z.string().optional().or(z.literal("")),
  producer: z.string().min(1, "Selecione um produtor"),
});

type CreateDemandForm = z.infer<typeof createDemandSchema>;

interface Props {
  onCreated: () => void;
}

export default function CreateDemandDialog({ onCreated }: Props) {
  const { user, role, displayName } = useAuth();
  const { data: producers = [] } = useProducers(role);
  const [open, setOpen] = useState(false);

  const isProducer = role === "produtor";
  const producerOptions = isProducer && displayName ? [displayName] : producers;
  const producerDisabled = isProducer;

  const form = useForm<CreateDemandForm>({
    resolver: zodResolver(createDemandSchema),
    defaultValues: {
      artist: "",
      name: "",
      description: "",
      dueAt: "",
      producer: "",
    },
  });

  useEffect(() => {
    if (open && isProducer && displayName) {
      form.setValue("producer", displayName);
    }
  }, [open, isProducer, displayName, form]);

  const onSubmit = async (values: CreateDemandForm) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("demands").insert({
        artist_name: values.artist?.trim() || null,
        name: values.name.trim(),
        description: values.description?.trim() || null,
        producer_name: values.producer.trim(),
        created_by: user.id,
        due_at: values.dueAt ? new Date(values.dueAt).toISOString() : null,
      });
      if (error) throw error;
      toast.success("Demanda criada com sucesso!");
      form.reset({
        artist: "",
        name: "",
        description: "",
        dueAt: "",
        producer: isProducer && displayName ? displayName : "",
      });
      setOpen(false);
      onCreated();
    } catch (err: unknown) {
      handleApiError(err, "Erro ao criar demanda.");
    }
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="artist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artista</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o artista" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ARTISTS.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Demanda</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Beat Trap para artista X" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Detalhes sobre a demanda..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo de entrega</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Opcional.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="producer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produtor</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={producerDisabled || producerOptions.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={producerOptions.length === 0 ? "Nenhum produtor cadastrado" : "Selecione o produtor"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {producerOptions.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!producerDisabled && (
                    <p className="text-xs text-muted-foreground">Consulte a disponibilidade no topo da página.</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting || producerOptions.length === 0}
            >
              {form.formState.isSubmitting ? "Criando..." : "Criar Demanda"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
