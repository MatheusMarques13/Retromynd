import { Globe } from "lucide-react";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { Language } from "@/react-app/data/translations";

export function LanguageSelector() {
  const { language, setLanguage, languageNames, t } = useLanguage();

  const languages = Object.keys(languageNames) as Language[];

  return (
    <div className="relative group">
      <button className="btn-retro p-2 flex items-center gap-1">
        <Globe size={18} />
        <span className="hidden sm:inline text-xs font-bold uppercase">{language}</span>
      </button>
      
      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
        <div className="panel-raised p-1 min-w-[140px]">
          <div className="panel-inset p-1">
            <div className="text-xs font-bold text-retro-dark px-2 py-1 border-b-2 border-retro-darker mb-1">
              {t("language.select")}
            </div>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`w-full text-left px-2 py-1.5 text-sm font-mono transition-colors ${
                  language === lang
                    ? "bg-retro-gold text-retro-black font-bold"
                    : "hover:bg-retro-light"
                }`}
              >
                {languageNames[lang]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
