import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Lowercase and replace spaces with underscores.
 * @param name - The name to normalize.
 * @returns da-cid
 */
export function normalizeCid(name: string): string {
  return name.toLowerCase().replace(/[ ]/g, "-");
}
