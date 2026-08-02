"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

const LanguageSwitcher = ({
  compact = false,
  className = "",
}: Readonly<{ compact?: boolean; className?: string }>) => {
  const { locale, setLocale, t } = useLanguage();

  return (
    <fieldset
      className={`flex overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 text-xs font-semibold text-white shadow-lg ${className}`}
      aria-label={t("Language")}
    >
      <button
        type="button"
        onClick={() => setLocale("de")}
        className={`${compact ? "px-2.5 py-1.5" : "px-3 py-2"} transition-colors ${
          locale === "de" ? "bg-red-600" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
        }`}
        aria-pressed={locale === "de"}
      >
        DE
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`${compact ? "px-2.5 py-1.5" : "px-3 py-2"} transition-colors ${
          locale === "en" ? "bg-red-600" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
        }`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </fieldset>
  );
};

export default LanguageSwitcher;
