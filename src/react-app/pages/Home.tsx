import { useState } from "react";
import { useNavigate, Link } from "react-router";

import { Header } from "@/react-app/components/Header";
import { HeroBanner } from "@/react-app/components/HeroBanner";
import { CategoryBar } from "@/react-app/components/CategoryBar";
import { ProductCard } from "@/react-app/components/ProductCard";
import { Footer } from "@/react-app/components/Footer";
import { products } from "@/react-app/data/products";
import { useWishlist } from "@/react-app/hooks/useWishlist";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { Star, Zap, Palette, Shirt, ShoppingBag, Smartphone, Paintbrush } from "lucide-react";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<string[]>([]);
  
  const { toggleWishlist, isWishlisted, wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleToggleWishlist = async (productId: string) => {
    const result = await toggleWishlist(productId);
    if (result.requiresAuth) {
      navigate("/login");
    }
  };

  const addToCart = (productId: string) => {
    setCart(prev => [...prev, productId]);
  };

  return (
    <div className="min-h-screen bg-background relative scanlines">
      <Header 
        cartCount={cart.length}
        wishlistCount={wishlistCount}
        onCartClick={() => {}}
        onWishlistClick={() => {}}
      />
      
      <main className="container mx-auto px-4">
        <HeroBanner />
        
        {/* Arcade Portal */}
        <section className="py-6">
          <Link 
            to="/arcade"
            className="block panel-raised p-0 overflow-hidden group cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-8 overflow-hidden">
              {/* Animated portal rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-64 h-64 rounded-full border border-purple-500/30 animate-pulse" />
                <div className="absolute w-48 h-48 rounded-full border border-pink-500/40 animate-pulse" style={{ animationDelay: '0.3s' }} />
                <div className="absolute w-32 h-32 rounded-full border border-cyan-400/50 animate-pulse" style={{ animationDelay: '0.6s' }} />
                <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/60 via-pink-500/60 to-cyan-400/60 blur-xl animate-pulse" />
              </div>
              
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-pink-500/10 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Scanlines overlay */}
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)] pointer-events-none" />
              
              {/* Content */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-purple-300 text-sm uppercase tracking-widest mb-1">Retromynd Arcade</p>
                    <h3 className="font-pixel text-2xl sm:text-3xl text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:via-pink-400 group-hover:to-cyan-400 transition-all">
                      ENTER PORTAL
                    </h3>
                  </div>
                </div>
                
                <div className="hidden sm:flex items-center gap-3">
                  <span className="text-purple-300/80 text-sm">{t("arcade.earnBadges")}</span>
                  <div className="w-10 h-10 rounded-full border-2 border-purple-400/50 flex items-center justify-center group-hover:border-cyan-400 group-hover:bg-cyan-400/10 transition-all">
                    <span className="text-purple-300 group-hover:text-cyan-300 transition-colors">→</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
        
        {/* Custom Products Section - Printify */}
        <section className="py-6">
          <Link 
            to="/custom-products"
            className="block panel-raised p-0 overflow-visible group cursor-pointer transition-all hover:scale-[1.01] relative"
          >
            {/* SPECIAL Badge - Comic Burst Style */}
            <div className="absolute -top-8 right-4 z-20">
              <div className="relative group/badge">
                {/* Comic burst SVG background */}
                <svg 
                  viewBox="0 0 120 80" 
                  className="w-28 h-20 drop-shadow-lg"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.6)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
                  }}
                >
                  {/* Burst shape with hatched shadow effect */}
                  <defs>
                    <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="4" stroke="#000" strokeWidth="1.5" opacity="0.7"/>
                    </pattern>
                  </defs>
                  {/* Shadow burst (offset) */}
                  <polygon 
                    points="65,8 75,18 95,12 88,28 108,32 92,42 105,58 82,52 78,72 60,58 42,72 38,52 15,58 28,42 12,32 32,28 25,12 45,18 55,8"
                    fill="url(#hatch)"
                    transform="translate(4, 4)"
                  />
                  {/* Main burst - Yellow */}
                  <polygon 
                    points="65,8 75,18 95,12 88,28 108,32 92,42 105,58 82,52 78,72 60,58 42,72 38,52 15,58 28,42 12,32 32,28 25,12 45,18 55,8"
                    fill="#FACC15"
                    stroke="#000"
                    strokeWidth="2.5"
                  />
                </svg>
                {/* Text overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span 
                    className="font-black text-sm tracking-tight transform -rotate-6"
                    style={{
                      fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
                      color: '#000',
                      textShadow: '1px 1px 0 #FACC15',
                      letterSpacing: '-0.5px'
                    }}
                  >
                    SPECIAL!
                  </span>
                </div>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 p-8 overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
                }} />
              </div>
              
              {/* Floating elements */}
              <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/10 animate-bounce" style={{ animationDuration: '3s' }} />
              <div className="absolute bottom-6 right-20 w-8 h-8 rounded-full bg-white/10 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              <div className="absolute top-1/2 right-1/3 w-6 h-6 rounded-full bg-white/10 animate-bounce" style={{ animationDuration: '2s', animationDelay: '1s' }} />
              
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-white/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30 group-hover:scale-110 transition-transform">
                    <Palette className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-pink-200 text-sm uppercase tracking-widest mb-1">{t("home.customProducts.subtitle")}</p>
                    <h3 className="font-pixel text-2xl sm:text-3xl text-white mb-2">
                      {t("home.customProducts.title")}
                    </h3>
                    <p className="text-white/80 text-sm max-w-md">
                      {t("home.customProducts.description")}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="flex items-center gap-2">
                      <Shirt className="w-4 h-4" />
                      <ShoppingBag className="w-4 h-4" />
                      <Smartphone className="w-4 h-4" />
                      <Paintbrush className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="px-6 py-3 rounded-full border-2 border-white/50 flex items-center justify-center group-hover:border-white group-hover:bg-white/10 transition-all">
                    <span className="text-white font-bold group-hover:scale-105 transition-transform">{t("home.customProducts.cta")}</span>
                    <span className="text-white ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
        
        {/* Products section */}
        <section className="py-8">
          {/* Section header panel */}
          <div className="panel-raised p-0 overflow-hidden mb-6">
            <div className="title-bar">
              <div className="flex items-center gap-2">
                <Star size={14} />
                <span>{t("home.featuredProducts")}</span>
              </div>
            </div>
            
            <div className="p-4 text-center">
              <h2 className="font-pixel text-3xl lg:text-4xl font-bold text-retro-black">
                {t("home.trendingNow")}
              </h2>
              <p className="text-sm text-retro-dark mt-2">
                {t("home.orderNow")}
              </p>
            </div>
            
            {/* Category filter */}
            <CategoryBar 
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
          
          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={isWishlisted(product.id)}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={addToCart}
              />
            ))}
          </div>
          
          {/* Load more */}
          <div className="text-center mt-8">
            <button className="btn-gold px-8 py-3 font-bold text-lg">
              {t("home.viewAllProducts")}
            </button>
          </div>
        </section>
        
        {/* Marketplace banner */}
        <section className="py-8">
          <div className="panel-raised p-0 overflow-hidden">
            <div className="title-bar text-center justify-center">
              <span>{t("home.marketplaceBanner")}</span>
            </div>
            <div className="p-8 text-center bg-retro-gold">
              <h2 className="font-pixel text-3xl lg:text-5xl font-bold mb-4 text-retro-black">
                {t("home.sellYourStuff")}
              </h2>
              <div className="panel-raised inline-block p-4 mb-6">
                <p className="text-base lg:text-lg text-retro-black max-w-2xl">
                  {t("home.marketplaceDescription")}
                </p>
              </div>
              <div>
                <button 
                  onClick={() => navigate("/marketplace/sell")}
                  className="btn-retro px-8 py-4 font-bold text-lg"
                >
                  {t("home.advertiseNow")}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <div className="container mx-auto px-4 pb-8">
        <Footer />
      </div>
    </div>
  );
}
