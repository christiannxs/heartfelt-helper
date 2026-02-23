import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata time no formato HH:mm (ex: "08:00:00" → "08:00"). */
export function timeShort(t: string): string {
  return t ? t.slice(0, 5) : "";
}
