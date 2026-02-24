import { toast } from "sonner";

/**
 * Extrai mensagem amigável de um erro (Supabase, Error, ou desconhecido).
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return "Erro desconhecido";
}

/**
 * Loga o erro no console e mostra toast de erro. Útil em catch de mutations.
 * Se toastMessage for passado, usa como título e mostra a mensagem real como descrição.
 */
export function handleApiError(err: unknown, toastMessage?: string): void {
  const message = getErrorMessage(err);
  console.error("[API Error]", err);
  if (toastMessage) {
    toast.error(toastMessage, { description: message });
  } else {
    toast.error(message);
  }
}
