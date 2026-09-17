import { m } from "@/paraglide/messages.js";

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
}

const LANGUAGES: ReadonlyArray<{ code: string; nativeLabel: string }> = [
  { code: "en", nativeLabel: "English" },
  { code: "he", nativeLabel: "עברית" },
  { code: "es", nativeLabel: "Español" },
  { code: "fr", nativeLabel: "Français" },
  { code: "de", nativeLabel: "Deutsch" },
  { code: "it", nativeLabel: "Italiano" },
  { code: "pt", nativeLabel: "Português" },
  { code: "nl", nativeLabel: "Nederlands" },
  { code: "ru", nativeLabel: "Русский" },
  { code: "uk", nativeLabel: "Українська" },
  { code: "pl", nativeLabel: "Polski" },
  { code: "cs", nativeLabel: "Čeština" },
  { code: "ro", nativeLabel: "Română" },
  { code: "el", nativeLabel: "Ελληνικά" },
  { code: "tr", nativeLabel: "Türkçe" },
  { code: "sv", nativeLabel: "Svenska" },
  { code: "da", nativeLabel: "Dansk" },
  { code: "no", nativeLabel: "Norsk" },
  { code: "fi", nativeLabel: "Suomi" },
  { code: "hu", nativeLabel: "Magyar" },
  { code: "ar", nativeLabel: "العربية" },
  { code: "zh", nativeLabel: "中文" },
  { code: "ja", nativeLabel: "日本語" },
  { code: "ko", nativeLabel: "한국어" },
];

const RTL_LANGUAGES = new Set(["he", "ar", "fa", "ur"]);

export function languageLabel({ code }: { code: string | null }): string {
  if (code == null) {
    return m.unknown_language();
  }
  switch (code) {
    case "en": {
      return m.language_name_en();
    }
    case "he": {
      return m.language_name_he();
    }
    case "es": {
      return m.language_name_es();
    }
    case "fr": {
      return m.language_name_fr();
    }
    case "de": {
      return m.language_name_de();
    }
    case "it": {
      return m.language_name_it();
    }
    case "pt": {
      return m.language_name_pt();
    }
    case "nl": {
      return m.language_name_nl();
    }
    case "ru": {
      return m.language_name_ru();
    }
    case "uk": {
      return m.language_name_uk();
    }
    case "pl": {
      return m.language_name_pl();
    }
    case "cs": {
      return m.language_name_cs();
    }
    case "ro": {
      return m.language_name_ro();
    }
    case "el": {
      return m.language_name_el();
    }
    case "tr": {
      return m.language_name_tr();
    }
    case "sv": {
      return m.language_name_sv();
    }
    case "da": {
      return m.language_name_da();
    }
    case "no": {
      return m.language_name_no();
    }
    case "fi": {
      return m.language_name_fi();
    }
    case "hu": {
      return m.language_name_hu();
    }
    case "ar": {
      return m.language_name_ar();
    }
    case "zh": {
      return m.language_name_zh();
    }
    case "ja": {
      return m.language_name_ja();
    }
    case "ko": {
      return m.language_name_ko();
    }
    default: {
      return code.toUpperCase();
    }
  }
}

export function languageOptions(): ReadonlyArray<LanguageOption> {
  return LANGUAGES.map((language) => ({
    code: language.code,
    label: languageLabel({ code: language.code }),
    nativeLabel: language.nativeLabel,
  }));
}

export function languageLabels(): Record<string, string> {
  return Object.fromEntries(
    LANGUAGES.map((language) => [language.code, languageLabel({ code: language.code })]),
  );
}

export function isSupportedLanguage(code: string | null): boolean {
  return code != null && LANGUAGES.some((language) => language.code === code);
}

export function isRtlLanguage(code: string | null): boolean {
  return code != null && RTL_LANGUAGES.has(code);
}

export function directionFor(code: string | null): "rtl" | "ltr" {
  return isRtlLanguage(code) ? "rtl" : "ltr";
}
