import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { Store, Package, ShoppingBag, Calendar, ArrowLeft, MapPin, MessageSquare, Shield, Sparkles, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

interface Listing {
  id: number;
  title: string;
  price_cents: number;
  category: string;
  condition: string;
  images: string;
  location: string;
  created_at: string;
}

interface SellerData {
  listings: Listing[];
  stats: {
    total_listings: number;
    active_listings: number;
    sold_listings: number;
    member_since: string;
  };
}

// Demo data for preview mode
const DEMO_LISTINGS: Listing[] = [
  {
    id: 1,
    title: "Mechanical Gaming Keyboard RGB",
    price_cents: 12999,
    category: "Gaming",
    condition: "Like New",
    images: JSON.stringify(["https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&h=400&fit=crop"]),
    location: "São Paulo, SP",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    title: "Vintage Nintendo Console Collection",
    price_cents: 34999,
    category: "Retro Tech",
    condition: "Good",
    images: JSON.stringify(["https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=400&h=400&fit=crop"]),
    location: "Rio de Janeiro, RJ",
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    title: "Complete D&D Dice Set (Metal)",
    price_cents: 4599,
    category: "Board Games",
    condition: "New",
    images: JSON.stringify(["https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400&h=400&fit=crop"]),
    location: "Curitiba, PR",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    title: "Sci-Fi Movie Poster Collection (5 posters)",
    price_cents: 8999,
    category: "Collectibles",
    condition: "Like New",
    images: JSON.stringify(["https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&h=400&fit=crop"]),
    location: "Belo Horizonte, MG",
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_SELLER_DATA: SellerData = {
  listings: DEMO_LISTINGS,
  stats: {
    total_listings: 12,
    active_listings: 4,
    sold_listings: 8,
    member_since: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

export default function SellerProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sellerData, setSellerData] = useState<SellerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzingReputation, setIsAnalyzingReputation] = useState(false);
  const [reputationAnalysis, setReputationAnalysis] = useState<{
    overallScore: number;
    trustLevel: string;
    strengths: string[];
    concerns: string[];
    tradingRecommendations: string[];
    verificationStatus: string[];
    riskIndicators: string[];
    summary: string;
  } | null>(null);
  
  const isDemo = userId === "demo";

  useEffect(() => {
    // Demo mode - show mock data immediately
    if (isDemo) {
      setSellerData(DEMO_SELLER_DATA);
      setLoading(false);
      return;
    }

    const fetchSellerData = async () => {
      try {
        const response = await fetch(`/api/sellers/${userId}`);
        if (!response.ok) {
          throw new Error("Seller not found");
        }
        const data = await response.json();
        setSellerData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load seller");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSellerData();
    }
  }, [userId, isDemo]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });
  };

  const getFirstImage = (imagesJson: string): string => {
    try {
      const images = JSON.parse(imagesJson);
      return images[0] || "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop";
    } catch {
      return "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop";
    }
  };

  const analyzeReputation = async () => {
    if (!sellerData) return;
    
    setIsAnalyzingReputation(true);
    
    try {
      const response = await fetch("/api/ai/reputation-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: userId,
          stats: sellerData.stats,
          listingsCount: sellerData.listings.length,
          categories: [...new Set(sellerData.listings.map(l => l.category))],
        }),
      });
      
      if (!response.ok) throw new Error("Failed to analyze reputation");
      
      const data = await response.json();
      setReputationAnalysis(data);
    } catch (err) {
      console.error("Reputation analysis failed:", err);
    } finally {
      setIsAnalyzingReputation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="panel-raised p-8 text-center">
          <div className="animate-pulse text-retro-dark font-mono text-lg">
            {t("seller.loading")}
          </div>
        </div>
      </div>
    );
  }

  if (error || !sellerData) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="panel-raised p-8 text-center space-y-4">
          <Store className="w-16 h-16 mx-auto text-retro-dark opacity-50" />
          <h2 className="text-xl font-bold text-retro-dark font-mono">
            {t("seller.notFound")}
          </h2>
          <button
            onClick={() => navigate("/marketplace")}
            className="btn-retro"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("seller.backToMarketplace")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/marketplace/browse")}
          className="btn-retro text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("seller.backToMarketplace")}
        </button>

        {/* Main Profile Card */}
        <div className="panel-raised">
          {/* Title Bar */}
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-3 py-1.5 flex items-center gap-2">
            <Store className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm font-mono truncate">
              {t("seller.titleBar")}
            </span>
            <div className="ml-auto flex gap-1">
              <div className="w-4 h-4 bg-gray-300 border border-gray-400 shadow-[inset_-1px_-1px_0_#808080,inset_1px_1px_0_#fff]" />
              <div className="w-4 h-4 bg-gray-300 border border-gray-400 shadow-[inset_-1px_-1px_0_#808080,inset_1px_1px_0_#fff]" />
              <div className="w-4 h-4 bg-gray-300 border border-gray-400 shadow-[inset_-1px_-1px_0_#808080,inset_1px_1px_0_#fff]" />
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 panel-inset flex items-center justify-center bg-gradient-to-br from-retro-teal to-[#006666]">
                  <Store className="w-12 h-12 md:w-16 md:h-16 text-white" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-retro-dark font-mono">
                    {isDemo ? "🚀 Demo Seller" : `Seller #${userId}`}
                  </h1>
                  {isDemo && (
                    <div className="mt-2 panel-inset px-3 py-1 inline-block">
                      <span className="text-xs font-mono text-retro-dark/70">
                        ⚠️ Preview Mode - Sample Data
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-retro-dark/70 font-mono text-sm mt-1">
                    <Calendar className="w-4 h-4" />
                    {t("seller.memberSince")} {formatDate(sellerData.stats.member_since)}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="panel-inset p-3 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-retro-gold font-mono">
                      {sellerData.stats.active_listings}
                    </div>
                    <div className="text-xs text-retro-dark/70 font-mono">
                      {t("seller.stats.activeListings")}
                    </div>
                  </div>
                  <div className="panel-inset p-3 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-green-600 font-mono">
                      {sellerData.stats.sold_listings}
                    </div>
                    <div className="text-xs text-retro-dark/70 font-mono">
                      {t("seller.stats.soldItems")}
                    </div>
                  </div>
                  <div className="panel-inset p-3 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-retro-dark font-mono">
                      {sellerData.stats.total_listings}
                    </div>
                    <div className="text-xs text-retro-dark/70 font-mono">
                      {t("seller.stats.totalListings")}
                    </div>
                  </div>
                </div>

                {/* Contact Button */}
                <button className="btn-gold w-full md:w-auto">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t("seller.contact")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Reputation Analysis */}
        <div className="panel-raised">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-3 py-1.5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm font-mono">
              {t("reputation.title")}
            </span>
          </div>
          
          <div className="p-4">
            {!reputationAnalysis ? (
              <div className="text-center py-6">
                <Shield className="w-12 h-12 mx-auto text-retro-dark/30 mb-3" />
                <p className="text-sm text-retro-dark/70 font-mono mb-4">
                  {t("reputation.description")}
                </p>
                <button
                  onClick={analyzeReputation}
                  disabled={isAnalyzingReputation}
                  className="btn-retro inline-flex items-center gap-2 px-6 py-2"
                >
                  {isAnalyzingReputation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("reputation.analyzing")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t("reputation.analyze")}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score and Trust Level */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 panel-inset">
                  <div className="text-center">
                    <div className={`text-4xl font-bold font-mono ${
                      reputationAnalysis.overallScore >= 80 ? "text-green-600" :
                      reputationAnalysis.overallScore >= 60 ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {reputationAnalysis.overallScore}
                    </div>
                    <div className="text-xs text-retro-dark/70 font-mono">{t("reputation.score")}</div>
                  </div>
                  <div className="flex-1">
                    <div className={`inline-block px-3 py-1 rounded text-sm font-bold font-mono ${
                      reputationAnalysis.trustLevel === "high" ? "bg-green-100 text-green-700" :
                      reputationAnalysis.trustLevel === "medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {t("reputation.trustLevel")}: {reputationAnalysis.trustLevel.toUpperCase()}
                    </div>
                    <p className="text-sm text-retro-dark/70 font-mono mt-2">{reputationAnalysis.summary}</p>
                  </div>
                </div>
                
                {/* Strengths */}
                {reputationAnalysis.strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-green-700 font-mono mb-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {t("reputation.strengths")}
                    </h4>
                    <ul className="space-y-1">
                      {reputationAnalysis.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-retro-dark/80 font-mono flex items-start gap-2">
                          <span className="text-green-500">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Concerns */}
                {reputationAnalysis.concerns.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-yellow-700 font-mono mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {t("reputation.concerns")}
                    </h4>
                    <ul className="space-y-1">
                      {reputationAnalysis.concerns.map((c, i) => (
                        <li key={i} className="text-sm text-retro-dark/80 font-mono flex items-start gap-2">
                          <span className="text-yellow-500">⚠</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Risk Indicators */}
                {reputationAnalysis.riskIndicators.length > 0 && (
                  <div className="p-3 bg-red-50 rounded">
                    <h4 className="text-sm font-bold text-red-700 font-mono mb-2">
                      🚨 {t("reputation.riskIndicators")}
                    </h4>
                    <ul className="space-y-1">
                      {reputationAnalysis.riskIndicators.map((r, i) => (
                        <li key={i} className="text-sm text-red-700 font-mono">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Trading Recommendations */}
                {reputationAnalysis.tradingRecommendations.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded">
                    <h4 className="text-sm font-bold text-blue-700 font-mono mb-2">
                      💡 {t("reputation.recommendations")}
                    </h4>
                    <ul className="space-y-1">
                      {reputationAnalysis.tradingRecommendations.map((r, i) => (
                        <li key={i} className="text-sm text-blue-700 font-mono">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Verification Status */}
                {reputationAnalysis.verificationStatus.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {reputationAnalysis.verificationStatus.map((v, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Listings Section */}
        <div className="panel-raised">
          {/* Title Bar */}
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-3 py-1.5 flex items-center gap-2">
            <Package className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm font-mono">
              {t("seller.listings.title")} ({sellerData.stats.active_listings})
            </span>
          </div>

          <div className="p-4">
            {sellerData.listings.length === 0 ? (
              <div className="panel-inset p-8 text-center">
                <ShoppingBag className="w-12 h-12 mx-auto text-retro-dark/30 mb-3" />
                <p className="text-retro-dark/70 font-mono">
                  {t("seller.listings.empty")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sellerData.listings.map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/marketplace/listing/${listing.id}`}
                    className="panel-raised hover:shadow-lg transition-shadow group"
                  >
                    {/* Image */}
                    <div className="aspect-square panel-inset m-2 overflow-hidden">
                      <img
                        src={getFirstImage(listing.images)}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-2">
                      <h3 className="font-bold text-retro-dark font-mono text-sm line-clamp-2 group-hover:text-retro-gold transition-colors">
                        {listing.title}
                      </h3>
                      
                      <div className="text-xl font-bold text-retro-gold font-mono">
                        {formatPrice(listing.price_cents)}
                      </div>

                      <div className="flex items-center justify-between text-xs text-retro-dark/70 font-mono">
                        <span className="panel-inset px-2 py-0.5">
                          {listing.condition}
                        </span>
                        {listing.location && (
                          <span className="flex items-center gap-1 truncate max-w-[50%]">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{listing.location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
