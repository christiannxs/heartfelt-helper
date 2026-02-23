import type { Database } from "@/integrations/supabase/types";

/** Linha da tabela demands (com nome do produtor para exibição). */
export type DemandRow = Database["public"]["Tables"]["demands"]["Row"];

/** Linha da tabela demand_deliverables. */
export type DeliverableRow = Database["public"]["Tables"]["demand_deliverables"]["Row"];

/** Status possíveis de uma demanda. */
export type DemandStatus = Database["public"]["Enums"]["demand_status"];
