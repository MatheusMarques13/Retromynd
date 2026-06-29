import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, ShoppingCart, Heart, Menu, User, X, LogOut, MessageSquare, Shield, Package, Trophy, Star, Crown, Flame, Sparkles, UserCircle, HandCoins, Gamepad2 } from "lucide-react";
import { useAuth } from "@/react-app/auth";
import { GameboyMascot } from "./GameboyMascot";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { useAdmin } from "@/react-app/hooks/useAdmin";

// Badge icons and colors for header display
const BADGE_CONFIG = {
  bronze: { Icon: Shield, color: "#cd7f32", name: "Bronze" },
  silver: { Icon: Star, color: "#c0c0c0", name: "Silver" },
  gold: { Icon: Crown, color: "#ffd700", name: "Gold" },
  platinum: { Icon: Flame, color: "#e5e4e2", name: "Platinum" },
  diamond: { Icon: Sparkles, color: "#b9f2ff", name: "Diamond" },
};

// Badges indicator component
function BadgesIndicator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [tickets, setTickets] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBadges = async () => {
      try {
        const res = await fetch("/api/arcade/stats");
        if (res.ok) {
          const data = await res.json();
          setEarnedBadges(data.earnedBadgeIds || []);
          setTickets(data.stats?.availableTickets || 0);
        }
      } catch (err) {
        console.error("Failed to fetch badges:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [user]);

  if (!user || loading) return null;

  const badgeOrder = ["bronze", "silver", "gold", "platinum", "diamond"];
  const earnedSet = new Set(earnedBadges);

  return (
    <button
      onClick={() => navigate("/arcade")}
      className="btn-retro px-2 py-1.5 flex items-center gap-1.5 group relative"
      title="Arcade & Badges"
    >
      {/* Trophy icon */}
      <Trophy size={16} className="text-yellow-600" />
      
      {/* Badge sequence */}
      <div className="flex items-center -space-x-1">
        {badgeOrder.map((badgeId) => {
          const config = BADGE_CONFIG[badgeId as keyof typeof BADGE_CONFIG];
          const earned = earnedSet.has(badgeId);
          const Icon = config.Icon;
          
          return (
            <div
              key={badgeId}
              className={`w-5 h-5 rounded-full flex items-center justify-center border-2 border-white transition-all ${
                earned ? "scale-100" : "scale-75 opacity-30 grayscale"
              }`}
              style={{
                backgroundColor: earned ? config.color : "#666",
                boxShadow: earned ? `0 0 6px ${config.color}` : "none",
              }}
            >
              <Icon className="w-3 h-3 text-black" />
            </div>
          );
        })}
      </div>

      {/* Ticket count */}
      {tickets > 0 && (
        <span className="text-xs font-bold text-yellow-600 ml-1">
          {tickets}🎟
        </span>
      )}

      {/* Tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
        <div className="panel-raised p-2 whitespace-nowrap text-xs">
          <div className="text-center font-bold mb-1 flex items-center justify-center gap-1"><Gamepad2 className="w-4 h-4" /> Arcade & Badges</div>
          <div className="text-retro-dark">
            {earnedBadges.length > 0 
              ? `${earnedBadges.length} badge${earnedBadges.length > 1 ? "s" : ""} earned`
              : "Start shopping to earn badges!"}
          </div>
        </div>
      </div>
    </button>
  );
}

interface HeaderProps {
  cartCount?: number;
  wishlistCount?: number;
  onCartClick?: () => void;
  onWishlistClick?: () => void;
}

export function Header({ 
  cartCount = 0, 
  wishlistCount = 0,
  onCartClick,
  onWishlistClick,
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { user, isPending, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  
  const navItems = [
    { key: "marketplace.nav", href: "/marketplace", isMarketplace: true },
    { key: "header.gaming", href: "#" },
    { key: "header.collectibles", href: "#" },
    { key: "header.retroTech", href: "#" },
    { key: "header.comics", href: "#" },
    { key: "header.sale", href: "#", isSale: true },
  ];

  return (
    <header className="relative z-50">
      {/* Announcement bar - marquee style */}
      <div className="bg-retro-gold text-retro-black py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap font-bold tracking-wide">
          ★ {t("announcement.freeShipping")} ★ {t("announcement.useCode")} ★ {t("announcement.callNow")} ★ {t("announcement.freeShipping")} ★ {t("announcement.useCode")} ★
        </div>
      </div>
      
      {/* Main header panel */}
      <div className="panel-raised" style={{ background: 'hsl(330 80% 65%)' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Mobile menu button */}
            <button 
              className="lg:hidden btn-retro p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {/* Logo */}
            <a href="/" className="flex items-center gap-3">
              <GameboyMascot size="sm" />
              <div>
                <h1 className="text-2xl lg:text-3xl font-pixel font-bold tracking-wider text-retro-black">
                  RETROMYND
                </h1>
                <p className="text-xs hidden sm:block" style={{ color: 'hsl(330 60% 20%)' }}>{t("header.tagline")}</p>
              </div>
            </a>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <a 
                  key={item.key}
                  href={item.href} 
                  className={`btn-retro px-4 py-2 text-sm font-bold whitespace-nowrap ${item.isSale ? "btn-gold" : ""} ${item.isMarketplace ? "bg-retro-accent text-white" : ""}`}
                >
                  {t(item.key)}
                </a>
              ))}
            </nav>
            
            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Language Selector */}
              <LanguageSelector />
              
              {/* Search */}
              <button 
                className="btn-retro p-2"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search size={18} />
              </button>
              
              {/* Wishlist */}
              <button 
                className="btn-retro p-2 relative"
                onClick={onWishlistClick}
              >
                <Heart size={18} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-retro-gold text-retro-black text-xs font-bold flex items-center justify-center border-2 border-retro-darker">
                    {wishlistCount}
                  </span>
                )}
              </button>
              
              {/* Cart */}
              <button 
                className="btn-retro p-2 relative"
                onClick={onCartClick}
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-retro-gold text-retro-black text-xs font-bold flex items-center justify-center border-2 border-retro-darker">
                    {cartCount}
                  </span>
                )}
              </button>
              
              {/* Badges indicator - only for logged in users */}
              {user && <BadgesIndicator />}
              
              {/* Login/User button */}
              {isPending ? (
                <div className="hidden lg:flex btn-retro px-4 py-2 items-center gap-2 text-sm">
                  <div className="w-4 h-4 border-2 border-retro-dark border-t-transparent rounded-full animate-spin" />
                </div>
              ) : user ? (
                <div className="hidden lg:flex items-center gap-2">
                  <div className="relative group">
                    <button className="btn-retro px-3 py-2 flex items-center gap-2 text-sm">
                      {user.google_user_data.picture ? (
                        <img 
                          src={user.google_user_data.picture} 
                          alt="" 
                          className="w-5 h-5 rounded-full border border-retro-darker"
                        />
                      ) : (
                        <User size={16} />
                      )}
                      <span className="max-w-[100px] truncate font-bold">
                        {user.google_user_data.given_name || user.email.split("@")[0]}
                      </span>
                    </button>
                    
                    {/* User dropdown */}
                    <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                      <div className="panel-raised p-1 min-w-[150px]">
                        <div className="panel-inset p-1">
                          <div className="px-2 py-1 text-xs text-retro-dark border-b border-retro-darker mb-1 truncate">
                            {user.email}
                          </div>
                          <button
                            onClick={() => navigate("/profile")}
                            className="w-full text-left px-2 py-1.5 text-sm font-mono flex items-center gap-2 hover:bg-retro-light"
                          >
                            <UserCircle size={14} />
                            {t("header.profile")}
                          </button>
                          <button
                            onClick={() => navigate("/retropass")}
                            className="w-full text-left px-2 py-1.5 text-sm font-mono flex items-center gap-2 hover:bg-yellow-100"
                            style={{
                              background: "linear-gradient(90deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))",
                              color: "#b8860b",
                              fontWeight: "bold",
                              textShadow: "0 0 8px rgba(255,215,0,0.5)"
                            }}
                          >
                            <Crown size={14} className="text-yellow-600" />
                            RetroPass
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => navigate("/admin")}
                              className="w-full text-left px-2 py-1.5 text-sm font-mono flex items-center gap-2 hover:bg-retro-light text-purple-700"
                            >
                              <Shield size={14} />
                              Admin
                            </button>
                          )}
                          <button
                            onClick={() => navigate("/my-orders")}
                            className="w-full text-left px-2 py-1.5 text-sm font-mono flex items-center gap-2 hover:bg-retro-light"
                          >
                            <Package size={14} />
                            {t("header.orders")}
                          </button>
                          <button
                            onClick={() => navigate("/marketplace/transactions")}
                            className="w-full text-left px-2 py-1.5 text-sm font-mono flex items-center gap-2 hover:bg-retro-light"
                          >
                            <HandCoins size={14} />
                            {t("header.transactions")}
                          </button>
                          <button
                            onClick={() => navigate("/messages")}
                            className="w-full text-left px-2 py-1.5 text-sm font-mono flex items-center gap-2 hover:bg-retro-light"
                          >
                            <MessageSquare size={14} />
                            {t("header.messages")}
                          </button>
                          <button
                            onClick={logout}
                            className="w-full text-left px-2 py-1.5 text-sm font-mono flex items-center gap-2 hover:bg-retro-light"
                          >
                            <LogOut size={14} />
                            {t("header.logout")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  className="hidden lg:flex btn-gold px-4 py-2 items-center gap-2 text-sm"
                  onClick={() => navigate("/login")}
                >
                  <User size={16} />
                  {t("header.login")}
                </button>
              )}
            </div>
          </div>
          
          {/* Search bar - expandable */}
          {searchOpen && (
            <div className="pb-4">
              <div className="panel-inset p-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("header.search")}
                    className="flex-1 px-3 py-2 bg-white border-2 border-retro-darker focus:outline-none font-mono text-sm"
                    autoFocus
                  />
                  <button className="btn-gold px-4 py-2 font-bold text-sm">
                    {t("header.search").split(" ")[0].toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden panel-raised border-t-2 border-retro-darker">
          <nav className="container mx-auto px-4 py-2 flex flex-col gap-1">
            {navItems.map((item) => (
              <a 
                key={item.key}
                href={item.href} 
                className={`btn-retro py-3 px-4 font-bold text-sm ${item.isSale ? "btn-gold" : ""}`}
              >
                {t(item.key)}
              </a>
            ))}
            <hr className="my-2 border-retro-darker" />
            {user ? (
              <>
                <div className="py-2 px-4 text-sm text-retro-dark flex items-center gap-2">
                  {user.google_user_data.picture && (
                    <img 
                      src={user.google_user_data.picture} 
                      alt="" 
                      className="w-6 h-6 rounded-full border border-retro-darker"
                    />
                  )}
                  <span className="truncate">{user.email}</span>
                </div>
                <button 
                  className="btn-retro py-3 px-4 font-bold text-sm flex items-center gap-2"
                  onClick={() => navigate("/profile")}
                >
                  <UserCircle size={16} />
                  {t("header.profile")}
                </button>
                <button 
                  className="py-3 px-4 font-bold text-sm flex items-center gap-2"
                  onClick={() => navigate("/retropass")}
                  style={{
                    background: "linear-gradient(90deg, rgba(255,215,0,0.4), rgba(255,165,0,0.3))",
                    border: "2px solid #ffd700",
                    boxShadow: "0 0 12px rgba(255,215,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
                    color: "#8b6914",
                    textShadow: "0 0 8px rgba(255,215,0,0.6)"
                  }}
                >
                  <Crown size={16} className="text-yellow-600" />
                  RetroPass
                </button>
                {isAdmin && (
                  <button 
                    className="btn-retro py-3 px-4 font-bold text-sm flex items-center gap-2 text-purple-700"
                    onClick={() => navigate("/admin")}
                  >
                    <Shield size={16} />
                    Admin
                  </button>
                )}
                <button 
                  className="btn-retro py-3 px-4 font-bold text-sm flex items-center gap-2"
                  onClick={() => navigate("/messages")}
                >
                  <MessageSquare size={16} />
                  {t("header.messages")}
                </button>
                <button 
                  className="btn-retro py-3 px-4 font-bold text-sm flex items-center gap-2"
                  onClick={() => navigate("/marketplace/transactions")}
                >
                  <HandCoins size={16} />
                  {t("header.transactions")}
                </button>
                <button 
                  className="btn-retro py-3 px-4 font-bold text-sm flex items-center gap-2"
                  onClick={logout}
                >
                  <LogOut size={16} />
                  {t("header.logout")}
                </button>
              </>
            ) : (
              <button 
                className="btn-gold py-3 px-4 font-bold text-sm flex items-center gap-2"
                onClick={() => navigate("/login")}
              >
                <User size={16} />
                {t("header.login")}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
