import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, translations, languageNames } from "@/react-app/data/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languageNames: typeof languageNames;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "rocketstyle-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in translations) {
        return stored as Language;
      }
      // Try to detect browser language
      const browserLang = navigator.language;
      // Check for exact match first (e.g., "pt-BR")
      if (browserLang in translations) {
        return browserLang as Language;
      }
      // Check for Brazilian Portuguese specifically
      if (browserLang.startsWith("pt")) {
        return "pt-BR" as Language;
      }
      // Fall back to base language code
      const baseLang = browserLang.split("-")[0];
      if (baseLang in translations) {
        return baseLang as Language;
      }
    }
    return "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageNames }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
