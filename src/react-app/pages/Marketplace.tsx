import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Plus, Store, TrendingUp, Shield, Users, ChevronRight, Gamepad2, Trophy, Tv, BookOpen, Laptop, Package } from "lucide-react";
import { useAuth } from "@/react-app/auth";
import { Header } from "@/react-app/components/Header";
import { Footer } from "@/react-app/components/Footer";
import { useLanguage } from "@/react-app/contexts/LanguageContext";

export default function MarketplacePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "gaming", Icon: Gamepad2, name: t("marketplace.categories.gaming") },
    { id: "collectibles", Icon: Trophy, name: t("marketplace.categories.collectibles") },
    { id: "retro", Icon: Tv, name: t("marketplace.categories.retro") },
    { id: "comics", Icon: BookOpen, name: t("marketplace.categories.comics") },
    { id: "electronics", Icon: Laptop, name: t("marketplace.categories.electronics") },
    { id: "other", Icon: Package, name: t("marketplace.categories.other") },
  ];

  const features = [
    {
      icon: Shield,
      title: t("marketplace.features.secure.title"),
      description: t("marketplace.features.secure.description"),
    },
    {
      icon: Users,
      title: t("marketplace.features.community.title"),
      description: t("marketplace.features.community.description"),
    },
    {
      icon: TrendingUp,
      title: t("marketplace.features.sell.title"),
      description: t("marketplace.features.sell.description"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="py-8 lg:py-12">
          <div className="container mx-auto px-4">
            <div className="panel-raised p-1">
              {/* Title bar */}
              <div className="bg-gradient-to-r from-retro-dark to-retro-darker text-white px-3 py-1.5 flex items-center gap-2">
                <Store size={16} />
                <span className="font-pixel text-sm">{t("marketplace.titleBar")}</span>
              </div>
              
              <div className="panel-inset p-6 lg:p-10 text-center">
                <h1 className="font-pixel text-3xl lg:text-5xl text-retro-black mb-4">
                  {t("marketplace.hero.title")}
                </h1>
                <p className="text-retro-dark text-lg mb-8 max-w-2xl mx-auto">
                  {t("marketplace.hero.subtitle")}
                </p>
                
                {/* Search bar */}
                <div className="max-w-xl mx-auto mb-8">
                  <div className="panel-raised p-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("marketplace.search.placeholder")}
                        className="flex-1 px-4 py-3 bg-white border-2 border-retro-darker focus:outline-none font-mono"
                      />
                      <button className="btn-gold px-6 py-3 font-bold flex items-center gap-2">
                        <Search size={18} />
                        {t("marketplace.search.button")}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    className="btn-gold px-8 py-4 font-bold text-lg flex items-center justify-center gap-2"
                    onClick={() => navigate("/marketplace/browse")}
                  >
                    <Store size={20} />
                    {t("marketplace.cta.browse")}
                  </button>
                  <button 
                    className="btn-retro px-8 py-4 font-bold text-lg flex items-center justify-center gap-2"
                    onClick={() => user ? navigate("/marketplace/sell") : navigate("/login")}
                  >
                    <Plus size={20} />
                    {t("marketplace.cta.sell")}
                  </button>
                </div>
                
                {/* Demo Link */}
                <div className="mt-6 pt-4 border-t-2 border-dashed border-retro-dark/30">
                  <button
                    onClick={() => navigate("/marketplace/seller/demo")}
                    className="text-sm text-retro-dark hover:text-retro-gold transition-colors font-mono underline"
                  >
                    👀 Ver perfil de vendedor (demonstração)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Categories Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="panel-raised p-1">
              <div className="bg-gradient-to-r from-retro-dark to-retro-darker text-white px-3 py-1.5">
                <span className="font-pixel text-sm">{t("marketplace.categories.title")}</span>
              </div>
              
              <div className="panel-inset p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {categories.map((category) => (
                    <button 
                      key={category.id}
                      className="btn-retro p-4 flex flex-col items-center gap-2 hover:bg-retro-light transition-colors"
                      onClick={() => navigate(`/marketplace/browse?category=${category.id}`)}
                    >
                      <category.Icon className="w-8 h-8 text-retro-accent" />
                      <span className="font-bold text-sm text-center">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="panel-raised p-1">
                  <div className="bg-gradient-to-r from-retro-gold to-yellow-500 text-retro-black px-3 py-1.5 flex items-center gap-2">
                    <feature.icon size={16} />
                    <span className="font-pixel text-sm">{feature.title}</span>
                  </div>
                  <div className="panel-inset p-4">
                    <p className="text-retro-dark text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How it Works Section */}
        <section className="py-8 pb-12">
          <div className="container mx-auto px-4">
            <div className="panel-raised p-1">
              <div className="bg-gradient-to-r from-retro-dark to-retro-darker text-white px-3 py-1.5">
                <span className="font-pixel text-sm">{t("marketplace.howItWorks.title")}</span>
              </div>
              
              <div className="panel-inset p-6">
                <div className="grid md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-retro-gold text-retro-black font-pixel text-2xl flex items-center justify-center border-4 border-retro-darker">
                        {step}
                      </div>
                      <h3 className="font-bold text-retro-black mb-2">
                        {t(`marketplace.howItWorks.step${step}.title`)}
                      </h3>
                      <p className="text-sm text-retro-dark">
                        {t(`marketplace.howItWorks.step${step}.description`)}
                      </p>
                      {step < 4 && (
                        <ChevronRight className="hidden md:block mx-auto mt-4 text-retro-dark" size={24} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
