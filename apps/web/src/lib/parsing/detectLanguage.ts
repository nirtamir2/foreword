import { franc } from "franc-min";

/** ISO 639-3 codes reported by franc mapped onto the ISO 639-1 codes the app uses. */
const ISO3_TO_ISO1: Record<string, string> = {
  eng: "en",
  heb: "he",
  spa: "es",
  fra: "fr",
  deu: "de",
  ita: "it",
  por: "pt",
  rus: "ru",
  nld: "nl",
  arb: "ar",
  cmn: "zh",
  jpn: "ja",
  kor: "ko",
  pol: "pl",
  tur: "tr",
  swe: "sv",
  ukr: "uk",
  ron: "ro",
  ell: "el",
  ces: "cs",
  hun: "hu",
  fin: "fi",
  dan: "da",
  nob: "no",
  ind: "id",
  vie: "vi",
};

/** Best-effort language detection from a text sample. Returns an ISO 639-1 code or null. */
export function detectLanguage(text: string): string | null {
  const sample = text.slice(0, 12_000);
  if (sample.trim().length < 20) {
    return null;
  }
  const code = franc(sample, { minLength: 20 });
  if (code === "und") {
    return null;
  }
  return ISO3_TO_ISO1[code] ?? null;
}
