import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/query-keys";

const SETUP_KEY = "setup_complete";

export interface SetupStatus {
  complete: boolean;
}

const TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout: verifique a conexão com o Supabase")), ms)
    ),
  ]);
}

export async function fetchSetupStatus(): Promise<SetupStatus> {
  const { data: config } = await withTimeout(
    supabase.from("app_config").select("value").eq("key", SETUP_KEY).maybeSingle(),
    TIMEOUT_MS
  );
  if (config?.value === true) return { complete: true };
  return { complete: false };
}

export async function setSetupComplete(): Promise<void> {
  const { error } = await supabase.from("app_config").upsert({ key: SETUP_KEY, value: true }, { onConflict: "key" });
  if (error) throw error;
}

export function useSetupStatus() {
  return useQuery({
    queryKey: queryKeys.setupStatus.all,
    queryFn: fetchSetupStatus,
    retry: 1,
    retryDelay: 2000,
  });
}

export function useSetSetupComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setSetupComplete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.setupStatus.all }),
  });
}
