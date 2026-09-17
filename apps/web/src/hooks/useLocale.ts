import { getLocale } from "@/paraglide/runtime.js";

/** BCP-47 locale for Intl formatting, derived from the active UI language. */
export function useLocale(): string {
  return getLocale() === "he" ? "he-IL" : "en-US";
}
