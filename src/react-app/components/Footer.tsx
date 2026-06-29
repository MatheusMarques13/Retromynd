import { Mail, Phone, MapPin } from "lucide-react";
import { GameboyMascot } from "./GameboyMascot";
import { useLanguage } from "@/react-app/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="mt-8 p-4" style={{ background: 'hsl(0 70% 50%)' }}>
      {/* Main footer panel */}
      <div className="panel-raised">
        {/* Title bar */}
        <div className="title-bar">
          <span>{t("footer.titleBar")}</span>
        </div>
        
        <div className="p-6 lg:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <GameboyMascot size="sm" />
                <h3 className="font-pixel text-xl font-bold text-retro-black">
                  RETROMYND
                </h3>
              </div>
              <div className="panel-inset p-3">
                <p className="text-sm text-retro-black">
                  {t("footer.brandDescription")}
                </p>
              </div>
            </div>
            
            {/* Quick links */}
            <div>
              <h4 className="font-bold mb-3 text-retro-black">{t("footer.shop")}</h4>
              <div className="panel-inset p-2">
                <ul className="space-y-1">
                  {[
                    { key: "footer.newArrivals" },
                    { key: "footer.bestSellers" },
                    { key: "footer.sale" },
                    { key: "footer.collections" }
                  ].map((item) => (
                    <li key={item.key}>
                      <a href="#" className="btn-retro block py-1 px-2 text-sm hover:bg-retro-light">
                        → {t(item.key)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Help */}
            <div>
              <h4 className="font-bold mb-3 text-retro-black">{t("footer.help")}</h4>
              <div className="panel-inset p-2">
                <ul className="space-y-1">
                  {[
                    { key: "footer.faqs" },
                    { key: "footer.shipping" },
                    { key: "footer.returns" },
                    { key: "footer.contactUs" }
                  ].map((item) => (
                    <li key={item.key}>
                      <a href="#" className="btn-retro block py-1 px-2 text-sm hover:bg-retro-light">
                        → {t(item.key)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Contact */}
            <div>
              <h4 className="font-bold mb-3 text-retro-black">{t("footer.contact")}</h4>
              <div className="panel-inset p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} />
                  <span>1-800-ROCKET</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} />
                  <span>help@rocketstyle.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} />
                  <span>Space Station 9, Earth</span>
                </div>
              </div>
              
              {/* Newsletter */}
              <div className="mt-4">
                <h5 className="font-bold mb-2 text-sm text-retro-black">{t("footer.joinCrew")}</h5>
                <div className="flex gap-1">
                  <input
                    type="email"
                    placeholder={t("footer.yourEmail")}
                    className="flex-1 px-2 py-1 bg-white border-2 border-retro-darker text-sm"
                  />
                  <button className="btn-gold px-3 py-1 text-sm font-bold">
                    {t("footer.go")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="panel-inset mx-4 mb-4 p-3 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-retro-dark">
          <p>{t("footer.madeIn90s")}</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-retro-black">{t("footer.privacy")}</a>
            <a href="#" className="hover:text-retro-black">{t("footer.terms")}</a>
            <a href="#" className="hover:text-retro-black">{t("footer.cookies")}</a>
          </div>
        </div>
        
        {/* Developer Credits */}
        <div className="text-center pb-4 text-xs text-retro-dark">
          <p>
            {t("footer.madeBy")} <span className="font-bold text-retro-black">Matheus Marques</span>, {t("footer.seeMyWork")}{" "}
            <a 
              href="https://mmarques.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-bold text-pink-600 hover:text-pink-700 hover:underline transition-colors"
            >
              mmarques.dev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
