import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { 
  ArrowLeft, 
  MapPin, 
  Tag, 
  Gamepad2, 
  MessageCircle, 
  User, 
  Calendar,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  Gem,
  TrendingUp,
  TrendingDown,
  Star,
  BarChart3,
  Scale,
  MessageSquare,
  Clock,
  Layers,
  Repeat
} from "lucide-react";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { useAuth } from "@/react-app/auth";

interface Listing {
  id: number;
  user_id: string;
  title: string;
  description: string;
  price_cents: number;
  category: string;
  condition: string;
  images: string;
  status: string;
  location: string;
  listing_type: string;
  game_platform: string | null;
  account_level: string | null;
  account_rank: string | null;
  account_server: string | null;
  created_at: string;
}

interface FraudAnalysis {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  isLikelyAuthentic: boolean;
  findings: Array<{
    type: string;
    severity: string;
    description: string;
    location?: string;
  }>;
  authenticityIndicators: string[];
  redFlags: string[];
  recommendation: string;
  summary: string;
}

interface RarityAnalysis {
  rarityScore: number;
  rarityTier: "common" | "uncommon" | "rare" | "epic" | "legendary";
  estimatedScarcity: string;
  rarityFactors: { positive: string[]; negative: string[]; };
  collectibilityScore: number;
  demandLevel: string;
  investmentPotential: string;
  comparables: string[];
  authenticityTips: string[];
  summary: string;
}

interface MarketTrendsAnalysis {
  trendingItems: string[];
  marketInsights: string[];
  hotCategories: string[];
  priceDirection: "up" | "down" | "stable";
  seasonalFactors: string[];
  recommendation: string;
}

interface PriceComparisonAnalysis {
  verdict: "great_deal" | "fair_price" | "overpriced" | "needs_research";
  marketRange: { low: number; average: number; high: number; };
  comparables: Array<{ title: string; price: number; condition: string; }>;
  potentialSavings: number;
  confidence: number;
  summary: string;
}

interface NegotiationAdvice {
  suggestedOffer: number;
  counterOfferStrategy: string[];
  negotiationTips: string[];
  leveragePoints: string[];
  walkAwayPrice: number;
  successChance: number;
  openingMessage: string;
}

interface ValuePrediction {
  predictions: { sixMonths: number; oneYear: number; fiveYears: number; };
  appreciationFactors: string[];
  depreciationRisks: string[];
  investmentRating: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  comparableAppreciations: string[];
  recommendation: string;
  confidence: number;
}

interface CollectionAnalysis {
  collectionName: string;
  theme: string;
  totalItems: number;
  estimatedValue: number;
  completionPercentage: number;
  missingPieces: string[];
  relatedItems: Array<{ title: string; estimatedPrice: number; rarity: string; }>;
  collectionTips: string[];
  investmentPotential: string;
  summary: string;
}

interface TradeMatchAnalysis {
  matchScore: number;
  potentialTrades: Array<{ 
    title: string; 
    estimatedValue: number; 
    compatibility: number;
    tradeAdvantage: "favorable" | "fair" | "unfavorable";
  }>;
  tradeRecommendation: string;
  valueBalance: string;
  negotiationTips: string[];
  summary: string;
}

const gamePlatforms: Record<string, string> = {
  genshin: "Genshin Impact",
  lol: "League of Legends",
  valorant: "Valorant",
  csgo: "CS2 / CS:GO",
  fortnite: "Fortnite",
  minecraft: "Minecraft",
  roblox: "Roblox",
  playstation: "PlayStation Network",
  xbox: "Xbox Live",
  nintendo: "Nintendo Account",
  steam: "Steam",
  epic: "Epic Games",
  other: "Other",
};

export default function ListingDetail() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Fraud detection state
  const [selectedImageForScan, setSelectedImageForScan] = useState<string | null>(null);
  const [scanningFraud, setScanningFraud] = useState(false);
  const [fraudAnalysis, setFraudAnalysis] = useState<FraudAnalysis | null>(null);
  const [fraudError, setFraudError] = useState("");
  
  // Price alert state
  const [priceAlert, setPriceAlert] = useState<{ id: number; target_price_cents: number } | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [alertSaving, setAlertSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Rarity checker state
  const [checkingRarity, setCheckingRarity] = useState(false);
  const [rarityAnalysis, setRarityAnalysis] = useState<RarityAnalysis | null>(null);
  const [rarityError, setRarityError] = useState("");
  
  // Market trends state
  const [analyzingTrends, setAnalyzingTrends] = useState(false);
  const [trendsAnalysis, setTrendsAnalysis] = useState<MarketTrendsAnalysis | null>(null);
  const [trendsError, setTrendsError] = useState("");
  
  // Price comparison state
  const [comparingPrice, setComparingPrice] = useState(false);
  const [priceComparison, setPriceComparison] = useState<PriceComparisonAnalysis | null>(null);
  const [priceCompareError, setPriceCompareError] = useState("");
  
  // Negotiation assistant state
  const [gettingAdvice, setGettingAdvice] = useState(false);
  const [negotiationAdvice, setNegotiationAdvice] = useState<NegotiationAdvice | null>(null);
  const [negotiateError, setNegotiateError] = useState("");
  const [userBudget, setUserBudget] = useState("");
  
  // Value prediction state
  const [predictingValue, setPredictingValue] = useState(false);
  const [valuePrediction, setValuePrediction] = useState<ValuePrediction | null>(null);
  const [predictError, setPredictError] = useState("");
  
  // Collection builder state
  const [buildingCollection, setBuildingCollection] = useState(false);
  const [collectionAnalysis, setCollectionAnalysis] = useState<CollectionAnalysis | null>(null);
  const [collectionError, setCollectionError] = useState("");
  
  // Trade matcher state
  const [findingTrades, setFindingTrades] = useState(false);
  const [tradeAnalysis, setTradeAnalysis] = useState<TradeMatchAnalysis | null>(null);
  const [tradeError, setTradeError] = useState("");
  const [userCollection, setUserCollection] = useState("");
  


  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${id}`);
        if (!response.ok) {
          throw new Error("Listing not found");
        }
        const data = await response.json();
        setListing(data.listing);
      } catch {
        setError("Failed to load listing");
      } finally {
        setLoading(false);
      }
    };
    
    fetchListing();
  }, [id]);

  // Fetch existing price alert
  useEffect(() => {
    if (!user || !id) return;
    
    const fetchAlert = async () => {
      try {
        const response = await fetch(`/api/price-alerts/listing/${id}`, { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          if (data.alert) {
            setPriceAlert(data.alert);
            setTargetPrice((data.alert.target_price_cents / 100).toString());
          }
        }
      } catch {
        // No alert exists
      }
    };
    
    fetchAlert();
  }, [user, id]);

  const savePriceAlert = async () => {
    if (!user || !listing) return;
    
    const targetCents = Math.round(parseFloat(targetPrice) * 100);
    if (isNaN(targetCents) || targetCents <= 0) {
      setAlertMessage({ type: "error", text: t("priceAlert.mustBeLower") });
      return;
    }
    
    if (targetCents >= listing.price_cents) {
      setAlertMessage({ type: "error", text: t("priceAlert.mustBeLower") });
      return;
    }
    
    setAlertSaving(true);
    setAlertMessage(null);
    
    try {
      const response = await fetch("/api/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId: listing.id, targetPriceCents: targetCents }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPriceAlert({ id: data.alertId, target_price_cents: targetCents });
        setAlertMessage({ type: "success", text: priceAlert ? t("priceAlert.alertUpdated") : t("priceAlert.alertSet") });
      } else {
        throw new Error("Failed to save alert");
      }
    } catch {
      setAlertMessage({ type: "error", text: t("priceAlert.saving") });
    } finally {
      setAlertSaving(false);
    }
  };

  const removePriceAlert = async () => {
    if (!priceAlert) return;
    
    setAlertSaving(true);
    setAlertMessage(null);
    
    try {
      const response = await fetch(`/api/price-alerts/${priceAlert.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (response.ok) {
        setPriceAlert(null);
        setTargetPrice("");
        setAlertMessage({ type: "success", text: t("priceAlert.alertRemoved") });
      }
    } catch {
      setAlertMessage({ type: "error", text: t("priceAlert.saving") });
    } finally {
      setAlertSaving(false);
    }
  };

  const checkRarity = async () => {
    if (!listing) return;
    
    setCheckingRarity(true);
    setRarityError("");
    setRarityAnalysis(null);
    
    try {
      const response = await fetch("/api/ai/rarity-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: listing.title,
          description: listing.description,
          category: listing.category,
          condition: listing.condition,
          gamePlatform: listing.game_platform,
          listingType: listing.listing_type,
          accountLevel: listing.account_level,
          accountRank: listing.account_rank,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to analyze rarity");
      
      const data = await response.json();
      setRarityAnalysis(data);
    } catch {
      setRarityError(t("rarity.error"));
    } finally {
      setCheckingRarity(false);
    }
  };

  const analyzeMarketTrends = async () => {
    if (!listing) return;
    
    setAnalyzingTrends(true);
    setTrendsError("");
    setTrendsAnalysis(null);
    
    try {
      const response = await fetch("/api/ai/market-trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: listing.category,
          itemType: listing.listing_type,
          gamePlatform: listing.game_platform,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to analyze trends");
      
      const data = await response.json();
      setTrendsAnalysis(data);
    } catch {
      setTrendsError(t("trends.error"));
    } finally {
      setAnalyzingTrends(false);
    }
  };

  const comparePrices = async () => {
    if (!listing) return;
    
    setComparingPrice(true);
    setPriceCompareError("");
    setPriceComparison(null);
    
    try {
      const response = await fetch("/api/ai/price-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: listing.title,
          category: listing.category,
          condition: listing.condition,
          priceCents: listing.price_cents,
          gamePlatform: listing.game_platform,
          accountLevel: listing.account_level,
          accountRank: listing.account_rank,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to compare prices");
      
      const data = await response.json();
      setPriceComparison(data);
    } catch {
      setPriceCompareError(t("compare.error"));
    } finally {
      setComparingPrice(false);
    }
  };

  const getNegotiationAdvice = async () => {
    if (!listing) return;
    
    const budgetCents = userBudget ? Math.round(parseFloat(userBudget) * 100) : undefined;
    
    setGettingAdvice(true);
    setNegotiateError("");
    setNegotiationAdvice(null);
    
    try {
      const response = await fetch("/api/ai/negotiation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: listing.title,
          askingPriceCents: listing.price_cents,
          condition: listing.condition,
          category: listing.category,
          budgetCents,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to get advice");
      
      const data = await response.json();
      setNegotiationAdvice(data);
    } catch {
      setNegotiateError(t("negotiate.error"));
    } finally {
      setGettingAdvice(false);
    }
  };

  const predictValue = async () => {
    if (!listing) return;
    
    setPredictingValue(true);
    setPredictError("");
    setValuePrediction(null);
    
    try {
      const response = await fetch("/api/ai/value-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: listing.title,
          category: listing.category,
          condition: listing.condition,
          currentPriceCents: listing.price_cents,
          gamePlatform: listing.game_platform,
          accountLevel: listing.account_level,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to predict value");
      
      const data = await response.json();
      setValuePrediction(data);
    } catch {
      setPredictError(t("predict.error"));
    } finally {
      setPredictingValue(false);
    }
  };

  const buildCollection = async () => {
    if (!listing) return;
    
    setBuildingCollection(true);
    setCollectionError("");
    setCollectionAnalysis(null);
    
    try {
      const response = await fetch("/api/ai/collection-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: listing.title,
          category: listing.category,
          condition: listing.condition,
          priceCents: listing.price_cents,
          gamePlatform: listing.game_platform,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to analyze collection");
      
      const data = await response.json();
      setCollectionAnalysis(data);
    } catch {
      setCollectionError(t("collection.error"));
    } finally {
      setBuildingCollection(false);
    }
  };

  const findTrades = async () => {
    if (!listing) return;
    
    setFindingTrades(true);
    setTradeError("");
    setTradeAnalysis(null);
    
    try {
      const response = await fetch("/api/ai/trade-matcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: listing.title,
          category: listing.category,
          condition: listing.condition,
          priceCents: listing.price_cents,
          gamePlatform: listing.game_platform,
          userCollection: userCollection || undefined,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to find trades");
      
      const data = await response.json();
      setTradeAnalysis(data);
    } catch {
      setTradeError(t("trade.error"));
    } finally {
      setFindingTrades(false);
    }
  };

  const parseImages = (imagesJson: string): string[] => {
    try {
      return JSON.parse(imagesJson) || [];
    } catch {
      return [];
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getConditionLabel = (cond: string) => {
    const map: Record<string, string> = {
      new: t("createListing.conditions.new"),
      like_new: t("createListing.conditions.likeNew"),
      good: t("createListing.conditions.good"),
      fair: t("createListing.conditions.fair"),
      used: t("createListing.conditions.used"),
      full_access: "Full Access",
      email_changeable: "Email Changeable",
      linked: "Linked Account",
    };
    return map[cond] || cond;
  };

  const scanForFraud = async (imageUrl: string) => {
    if (!listing) return;
    
    setScanningFraud(true);
    setFraudError("");
    setFraudAnalysis(null);
    setSelectedImageForScan(imageUrl);
    
    try {
      const response = await fetch("/api/ai/fraud-detection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          gamePlatform: listing.game_platform 
            ? gamePlatforms[listing.game_platform] || listing.game_platform 
            : undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }
      
      const data = await response.json();
      if (data.analysis) {
        setFraudAnalysis(data.analysis);
      } else {
        throw new Error("Invalid response");
      }
    } catch {
      setFraudError(t("fraud.error"));
    } finally {
      setScanningFraud(false);
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low":
        return <ShieldCheck className="w-6 h-6 text-green-500" />;
      case "medium":
        return <Shield className="w-6 h-6 text-yellow-500" />;
      case "high":
        return <ShieldAlert className="w-6 h-6 text-orange-500" />;
      case "critical":
        return <ShieldX className="w-6 h-6 text-red-500" />;
      default:
        return <Shield className="w-6 h-6 text-gray-500" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 100% 55%)" }}>
        <div className="panel-raised p-8">
          <Loader2 className="w-8 h-8 animate-spin text-retro-dark" />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 100% 55%)" }}>
        <div className="panel-raised p-8 text-center">
          <h2 className="font-display text-xl text-retro-dark mb-4">{error || "Listing not found"}</h2>
          <button onClick={() => navigate("/marketplace/browse")} className="btn-retro px-4 py-2">
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const images = parseImages(listing.images);
  const isAccount = listing.listing_type === "account";
  const isOwnListing = user?.id === listing.user_id;

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "hsl(210 100% 55%)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="panel-raised mb-6">
          <div className="bg-gradient-to-r from-retro-dark to-retro-gray text-white px-3 py-1 flex items-center gap-2">
            <div className="w-3 h-3 bg-retro-gold" />
            <span className="font-display text-sm tracking-wider">
              {isAccount ? t("fraud.titleBarAccount") : t("fraud.titleBarItem")}
            </span>
          </div>
          <div className="p-4">
            <Link 
              to="/marketplace/browse" 
              className="inline-flex items-center gap-2 text-retro-dark hover:text-retro-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-display text-sm">{t("createListing.back")}</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div className="panel-raised p-4">
            {images.length > 0 ? (
              <>
                <div className="aspect-square panel-inset overflow-hidden mb-3 relative">
                  <img 
                    src={images[currentImageIndex]} 
                    alt={listing.title}
                    className="w-full h-full object-contain bg-white"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(i => i > 0 ? i - 1 : images.length - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 btn-retro p-2"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(i => i < images.length - 1 ? i + 1 : 0)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 btn-retro p-2"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
                
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-16 h-16 flex-shrink-0 panel-inset overflow-hidden ${
                          idx === currentImageIndex ? "ring-2 ring-retro-gold" : ""
                        }`}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Fraud Detection for Accounts */}
                {isAccount && images.length > 0 && (
                  <div className="mt-4 p-3 panel-raised bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-red-600" />
                      <span className="font-display text-sm text-red-800">{t("fraud.title")}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{t("fraud.description")}</p>
                    
                    <button
                      onClick={() => scanForFraud(images[currentImageIndex])}
                      disabled={scanningFraud}
                      className="btn-retro px-4 py-2 text-sm flex items-center gap-2 w-full justify-center"
                      style={{ background: "linear-gradient(180deg, hsl(0 70% 55%) 0%, hsl(0 70% 45%) 100%)", color: "white" }}
                    >
                      {scanningFraud ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("fraud.scanning")}
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          {t("fraud.scanButton")}
                        </>
                      )}
                    </button>
                    
                    {fraudError && (
                      <p className="text-xs text-red-600 mt-2">{fraudError}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square panel-inset flex items-center justify-center bg-gray-200">
                <span className="text-gray-500 font-display">{t("fraud.noImages")}</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Main Info */}
            <div className="panel-raised p-4">
              <div className="flex items-start gap-2 mb-3">
                {isAccount && (
                  <span className="px-2 py-1 text-xs font-display rounded" style={{ background: "hsl(280 70% 50%)", color: "white" }}>
                    <Gamepad2 className="w-3 h-3 inline mr-1" />
                    Account
                  </span>
                )}
                <span className="px-2 py-1 text-xs font-display rounded" style={{ background: "hsl(50 90% 55%)" }}>
                  {getConditionLabel(listing.condition)}
                </span>
              </div>
              
              <h1 className="font-display text-2xl text-retro-dark mb-2">{listing.title}</h1>
              
              <div className="text-3xl font-display mb-4" style={{ color: "hsl(120 60% 30%)" }}>
                {formatPrice(listing.price_cents)}
              </div>

              {/* Account specific info */}
              {isAccount && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {listing.game_platform && (
                    <span className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      <Gamepad2 className="w-3 h-3" />
                      {gamePlatforms[listing.game_platform] || listing.game_platform}
                    </span>
                  )}
                  {listing.account_level && (
                    <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Level: {listing.account_level}
                    </span>
                  )}
                  {listing.account_rank && (
                    <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                      Rank: {listing.account_rank}
                    </span>
                  )}
                  {listing.account_server && (
                    <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      Server: {listing.account_server}
                    </span>
                  )}
                </div>
              )}

              {/* Item specific info */}
              {!isAccount && (
                <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {listing.category}
                  </span>
                  {listing.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {listing.location}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <Calendar className="w-3 h-3" />
                Posted {formatDate(listing.created_at)}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {/* Buy Securely - Account Listings */}
                {!isOwnListing && listing.listing_type === "account" && user && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/account-transactions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ listing_id: listing.id }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          navigate(`/marketplace/transaction/${data.transaction.id}`);
                        }
                      } catch {
                        // Silent fail
                      }
                    }}
                    className="w-full py-3 font-display flex items-center justify-center gap-2 text-white rounded transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(180deg, hsl(270 70% 55%) 0%, hsl(270 70% 45%) 100%)" }}
                  >
                    <Shield className="w-5 h-5" />
                    Buy Securely with Escrow
                  </button>
                )}
                
                <div className="flex gap-3">
                  {!isOwnListing && (
                    <button
                      onClick={() => navigate(`/messages/${listing.user_id}`)}
                      className="btn-gold flex-1 py-3 font-display flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      {t("fraud.contactSeller")}
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/marketplace/seller/${listing.user_id}`)}
                    className="btn-retro flex-1 py-3 font-display flex items-center justify-center gap-2"
                  >
                    <User className="w-5 h-5" />
                    {t("fraud.viewSeller")}
                  </button>
                </div>
              </div>

              {/* Price Alert */}
              {!isOwnListing && (
                <div className="mt-4 p-3 panel-inset bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="font-display text-sm text-blue-800">{t("priceAlert.title")}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{t("priceAlert.description")}</p>
                  
                  {user ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                            placeholder={t("priceAlert.placeholder")}
                            className="w-full pl-7 pr-3 py-2 panel-inset font-body text-sm"
                          />
                        </div>
                        <button
                          onClick={savePriceAlert}
                          disabled={alertSaving || !targetPrice}
                          className="btn-retro px-4 py-2 text-sm flex items-center gap-1"
                          style={{ background: "linear-gradient(180deg, hsl(210 70% 55%) 0%, hsl(210 70% 45%) 100%)", color: "white" }}
                        >
                          {alertSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                          {priceAlert ? t("priceAlert.updateAlert") : t("priceAlert.setAlert")}
                        </button>
                      </div>
                      
                      {priceAlert && (
                        <button
                          onClick={removePriceAlert}
                          disabled={alertSaving}
                          className="w-full btn-retro px-3 py-1.5 text-xs flex items-center justify-center gap-1 text-red-600 hover:bg-red-50"
                        >
                          <BellOff className="w-3 h-3" />
                          {t("priceAlert.removeAlert")}
                        </button>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        {t("priceAlert.currentPrice")}: <span className="font-bold">{formatPrice(listing.price_cents)}</span>
                      </div>
                      
                      {alertMessage && (
                        <p className={`text-xs ${alertMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                          {alertMessage.text}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">{t("priceAlert.loginRequired")}</p>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="panel-raised p-4">
              <h3 className="font-display text-sm text-retro-dark mb-2 uppercase">{t("fraud.descriptionLabel")}</h3>
              <p className="font-body text-gray-700 whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Fraud Analysis Results */}
            {fraudAnalysis && (
              <div className={`panel-raised p-4 border-2 ${getRiskColor(fraudAnalysis.riskLevel)}`}>
                <div className="flex items-center gap-3 mb-4">
                  {getRiskIcon(fraudAnalysis.riskLevel)}
                  <div>
                    <h3 className="font-display text-lg">{t("fraud.analysisTitle")}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold uppercase ${
                        fraudAnalysis.riskLevel === "low" ? "text-green-700" :
                        fraudAnalysis.riskLevel === "medium" ? "text-yellow-700" :
                        fraudAnalysis.riskLevel === "high" ? "text-orange-700" :
                        "text-red-700"
                      }`}>
                        {t(`fraud.risk.${fraudAnalysis.riskLevel}`)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({t("fraud.score")}: {fraudAnalysis.riskScore}/100)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-sm text-gray-700 mb-4 p-2 bg-white/50 rounded">{fraudAnalysis.summary}</p>

                {/* Authenticity */}
                <div className="flex items-center gap-2 mb-4">
                  {fraudAnalysis.isLikelyAuthentic ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-green-700 font-bold">{t("fraud.likelyAuthentic")}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-red-700 font-bold">{t("fraud.likelySuspicious")}</span>
                    </>
                  )}
                </div>

                {/* Red Flags */}
                {fraudAnalysis.redFlags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-display text-red-700 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {t("fraud.redFlags")}
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {fraudAnalysis.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <XCircle className="w-3 h-3 text-red-500 mt-1 flex-shrink-0" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Authenticity Indicators */}
                {fraudAnalysis.authenticityIndicators.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-display text-green-700 mb-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {t("fraud.authenticityIndicators")}
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {fraudAnalysis.authenticityIndicators.map((indicator, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Findings */}
                {fraudAnalysis.findings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-display text-gray-700 mb-2">{t("fraud.detailedFindings")}</h4>
                    <div className="space-y-2">
                      {fraudAnalysis.findings.map((finding, i) => (
                        <div key={i} className={`text-xs p-2 rounded ${
                          finding.severity === "high" ? "bg-red-50 border border-red-200" :
                          finding.severity === "medium" ? "bg-yellow-50 border border-yellow-200" :
                          "bg-gray-50 border border-gray-200"
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-bold uppercase ${
                              finding.severity === "high" ? "text-red-700" :
                              finding.severity === "medium" ? "text-yellow-700" :
                              "text-gray-700"
                            }`}>
                              {finding.type}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              finding.severity === "high" ? "bg-red-200 text-red-800" :
                              finding.severity === "medium" ? "bg-yellow-200 text-yellow-800" :
                              "bg-gray-200 text-gray-800"
                            }`}>
                              {finding.severity}
                            </span>
                          </div>
                          <p className="text-gray-600">{finding.description}</p>
                          {finding.location && (
                            <p className="text-gray-500 mt-1 italic">Location: {finding.location}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                <div className="p-3 bg-white/70 rounded">
                  <h4 className="text-sm font-display text-gray-700 mb-1">{t("fraud.recommendation")}</h4>
                  <p className="text-sm text-gray-600">{fraudAnalysis.recommendation}</p>
                </div>

                {/* Scan another image */}
                {images.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-xs text-gray-500 mb-2">{t("fraud.scanOther")}</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentImageIndex(idx);
                            scanForFraud(img);
                          }}
                          disabled={scanningFraud}
                          className={`w-12 h-12 flex-shrink-0 panel-inset overflow-hidden hover:ring-2 hover:ring-retro-gold transition-all ${
                            img === selectedImageForScan ? "ring-2 ring-red-500" : ""
                          }`}
                        >
                          <img src={img} alt={`Scan ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rarity Checker Section */}
            <div className="panel-raised p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gem className="w-5 h-5" style={{ color: "hsl(280 70% 50%)" }} />
                  <h3 className="font-display text-sm text-retro-dark uppercase">{t("rarity.title")}</h3>
                </div>
                <button
                  onClick={checkRarity}
                  disabled={checkingRarity}
                  className="btn-retro px-3 py-1.5 text-xs flex items-center gap-1"
                  style={{ background: "linear-gradient(180deg, hsl(280 70% 55%) 0%, hsl(280 70% 45%) 100%)", color: "white" }}
                >
                  {checkingRarity ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Gem className="w-3 h-3" />
                  )}
                  {checkingRarity ? t("rarity.checking") : t("rarity.checkButton")}
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-3">{t("rarity.description")}</p>
              
              {rarityError && (
                <p className="text-xs text-red-600 mb-2">{rarityError}</p>
              )}
              
              {rarityAnalysis && (
                <div className="space-y-4">
                  {/* Rarity Score & Tier */}
                  <div className="flex items-center gap-4 p-3 rounded" style={{
                    background: rarityAnalysis.rarityTier === "legendary" ? "linear-gradient(135deg, hsl(45 100% 50%) 0%, hsl(35 100% 45%) 100%)" :
                                rarityAnalysis.rarityTier === "epic" ? "linear-gradient(135deg, hsl(280 70% 50%) 0%, hsl(260 70% 45%) 100%)" :
                                rarityAnalysis.rarityTier === "rare" ? "linear-gradient(135deg, hsl(210 80% 55%) 0%, hsl(210 80% 45%) 100%)" :
                                rarityAnalysis.rarityTier === "uncommon" ? "linear-gradient(135deg, hsl(140 60% 45%) 0%, hsl(140 60% 35%) 100%)" :
                                "linear-gradient(135deg, hsl(0 0% 60%) 0%, hsl(0 0% 50%) 100%)"
                  }}>
                    <div className="text-center">
                      <div className="text-3xl font-display text-white drop-shadow-lg">{rarityAnalysis.rarityScore}</div>
                      <div className="text-xs text-white/80">{t("rarity.score")}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-display text-lg text-white uppercase drop-shadow-lg">
                        {t(`rarity.tier.${rarityAnalysis.rarityTier}`)}
                      </div>
                      <div className="text-xs text-white/80">{rarityAnalysis.estimatedScarcity}</div>
                    </div>
                    <Star className="w-8 h-8 text-white/80" />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="panel-inset p-2 text-center">
                      <div className="text-xs text-gray-500 mb-1">{t("rarity.collectibility")}</div>
                      <div className="font-display text-lg" style={{ color: "hsl(280 70% 50%)" }}>{rarityAnalysis.collectibilityScore}</div>
                    </div>
                    <div className="panel-inset p-2 text-center">
                      <div className="text-xs text-gray-500 mb-1">{t("rarity.demand")}</div>
                      <div className="font-display text-sm text-retro-dark">{rarityAnalysis.demandLevel}</div>
                    </div>
                    <div className="panel-inset p-2 text-center">
                      <div className="text-xs text-gray-500 mb-1">{t("rarity.investment")}</div>
                      <div className="font-display text-sm text-retro-dark">{rarityAnalysis.investmentPotential}</div>
                    </div>
                  </div>

                  {/* Rarity Factors */}
                  <div className="grid grid-cols-2 gap-3">
                    {rarityAnalysis.rarityFactors.positive.length > 0 && (
                      <div className="panel-inset p-2">
                        <h4 className="text-xs font-display text-green-700 mb-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {t("rarity.positive")}
                        </h4>
                        <ul className="text-xs space-y-1">
                          {rarityAnalysis.rarityFactors.positive.map((factor, i) => (
                            <li key={i} className="flex items-start gap-1 text-gray-700">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rarityAnalysis.rarityFactors.negative.length > 0 && (
                      <div className="panel-inset p-2">
                        <h4 className="text-xs font-display text-red-700 mb-2 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          {t("rarity.negative")}
                        </h4>
                        <ul className="text-xs space-y-1">
                          {rarityAnalysis.rarityFactors.negative.map((factor, i) => (
                            <li key={i} className="flex items-start gap-1 text-gray-700">
                              <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Comparables */}
                  {rarityAnalysis.comparables.length > 0 && (
                    <div className="panel-inset p-2">
                      <h4 className="text-xs font-display text-gray-700 mb-2">{t("rarity.comparables")}</h4>
                      <ul className="text-xs space-y-1">
                        {rarityAnalysis.comparables.map((item, i) => (
                          <li key={i} className="text-gray-600">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Authenticity Tips */}
                  {rarityAnalysis.authenticityTips.length > 0 && (
                    <div className="panel-inset p-2">
                      <h4 className="text-xs font-display text-gray-700 mb-2">{t("rarity.authenticityTips")}</h4>
                      <ul className="text-xs space-y-1">
                        {rarityAnalysis.authenticityTips.map((tip, i) => (
                          <li key={i} className="text-gray-600 flex items-start gap-1">
                            <Shield className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="p-3 bg-white/70 rounded">
                    <p className="text-sm text-gray-700">{rarityAnalysis.summary}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Market Trends Section */}
            <div className="panel-raised p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" style={{ color: "hsl(210 80% 50%)" }} />
                  <h3 className="font-display text-sm text-retro-dark uppercase">{t("trends.title")}</h3>
                </div>
                <button
                  onClick={analyzeMarketTrends}
                  disabled={analyzingTrends}
                  className="btn-retro px-3 py-1.5 text-xs flex items-center gap-1"
                  style={{ background: "linear-gradient(180deg, hsl(210 80% 55%) 0%, hsl(210 80% 45%) 100%)", color: "white" }}
                >
                  {analyzingTrends ? <Loader2 className="w-3 h-3 animate-spin" /> : <BarChart3 className="w-3 h-3" />}
                  {analyzingTrends ? t("trends.analyzing") : t("trends.analyze")}
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-3">{t("trends.description")}</p>
              
              {trendsError && <p className="text-xs text-red-600 mb-2">{trendsError}</p>}
              
              {trendsAnalysis && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 rounded" style={{
                    background: trendsAnalysis.priceDirection === "up" ? "hsl(140 60% 90%)" :
                                trendsAnalysis.priceDirection === "down" ? "hsl(0 60% 90%)" : "hsl(45 60% 90%)"
                  }}>
                    {trendsAnalysis.priceDirection === "up" ? <TrendingUp className="w-5 h-5 text-green-600" /> :
                     trendsAnalysis.priceDirection === "down" ? <TrendingDown className="w-5 h-5 text-red-600" /> :
                     <Scale className="w-5 h-5 text-yellow-600" />}
                    <span className="font-display text-sm">{t(`trends.${trendsAnalysis.priceDirection}`)}</span>
                  </div>
                  
                  {trendsAnalysis.trendingItems.length > 0 && (
                    <div className="panel-inset p-2">
                      <h4 className="text-xs font-display text-gray-700 mb-2">{t("trends.trendingItems")}</h4>
                      <ul className="text-xs space-y-1">
                        {trendsAnalysis.trendingItems.slice(0, 5).map((item, i) => (
                          <li key={i} className="text-gray-600">🔥 {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {trendsAnalysis.marketInsights.length > 0 && (
                    <div className="panel-inset p-2">
                      <h4 className="text-xs font-display text-gray-700 mb-2">{t("trends.insights")}</h4>
                      <ul className="text-xs space-y-1">
                        {trendsAnalysis.marketInsights.map((insight, i) => (
                          <li key={i} className="text-gray-600">💡 {insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="p-2 bg-white/70 rounded">
                    <h4 className="text-xs font-display text-gray-700 mb-1">{t("trends.recommendation")}</h4>
                    <p className="text-xs text-gray-600">{trendsAnalysis.recommendation}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Price Comparison Section */}
            <div className="panel-raised p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5" style={{ color: "hsl(45 90% 45%)" }} />
                  <h3 className="font-display text-sm text-retro-dark uppercase">{t("compare.title")}</h3>
                </div>
                <button
                  onClick={comparePrices}
                  disabled={comparingPrice}
                  className="btn-retro px-3 py-1.5 text-xs flex items-center gap-1"
                  style={{ background: "linear-gradient(180deg, hsl(45 90% 50%) 0%, hsl(45 90% 40%) 100%)", color: "hsl(45 90% 15%)" }}
                >
                  {comparingPrice ? <Loader2 className="w-3 h-3 animate-spin" /> : <Scale className="w-3 h-3" />}
                  {comparingPrice ? t("compare.comparing") : t("compare.compare")}
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-3">{t("compare.description")}</p>
              
              {priceCompareError && <p className="text-xs text-red-600 mb-2">{priceCompareError}</p>}
              
              {priceComparison && (
                <div className="space-y-3">
                  <div className="p-3 rounded text-center" style={{
                    background: priceComparison.verdict === "great_deal" ? "hsl(140 60% 90%)" :
                                priceComparison.verdict === "fair_price" ? "hsl(210 60% 90%)" :
                                priceComparison.verdict === "overpriced" ? "hsl(0 60% 90%)" : "hsl(45 60% 90%)"
                  }}>
                    <div className="font-display text-lg">{t(`compare.${priceComparison.verdict}`)}</div>
                    <div className="text-xs text-gray-500">{t("compare.confidence")}: {priceComparison.confidence}%</div>
                  </div>
                  
                  <div className="panel-inset p-2">
                    <h4 className="text-xs font-display text-gray-700 mb-2">{t("compare.marketRange")}</h4>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">${(priceComparison.marketRange.low / 100).toFixed(2)}</span>
                      <span className="text-blue-600 font-bold">${(priceComparison.marketRange.average / 100).toFixed(2)}</span>
                      <span className="text-red-600">${(priceComparison.marketRange.high / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Low</span>
                      <span>Avg</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  {priceComparison.potentialSavings > 0 && (
                    <div className="p-2 bg-green-50 rounded text-center">
                      <span className="text-xs text-gray-600">{t("compare.savings")}: </span>
                      <span className="font-display text-green-600">${(priceComparison.potentialSavings / 100).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600 p-2 bg-white/70 rounded">{priceComparison.summary}</p>
                </div>
              )}
            </div>

            {/* Negotiation Assistant Section */}
            {!isOwnListing && (
              <div className="panel-raised p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" style={{ color: "hsl(330 70% 50%)" }} />
                    <h3 className="font-display text-sm text-retro-dark uppercase">{t("negotiate.title")}</h3>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-3">{t("negotiate.description")}</p>
                
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={userBudget}
                      onChange={(e) => setUserBudget(e.target.value)}
                      placeholder={t("negotiate.budget")}
                      className="w-full pl-7 pr-3 py-2 panel-inset font-body text-sm"
                    />
                  </div>
                  <button
                    onClick={getNegotiationAdvice}
                    disabled={gettingAdvice}
                    className="btn-retro px-3 py-2 text-xs flex items-center gap-1"
                    style={{ background: "linear-gradient(180deg, hsl(330 70% 55%) 0%, hsl(330 70% 45%) 100%)", color: "white" }}
                  >
                    {gettingAdvice ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                    {gettingAdvice ? t("negotiate.analyzing") : t("negotiate.getAdvice")}
                  </button>
                </div>
                
                {negotiateError && <p className="text-xs text-red-600 mb-2">{negotiateError}</p>}
                
                {negotiationAdvice && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="panel-inset p-2 text-center">
                        <div className="text-xs text-gray-500 mb-1">{t("negotiate.suggestedOffer")}</div>
                        <div className="font-display text-lg text-green-600">${(negotiationAdvice.suggestedOffer / 100).toFixed(2)}</div>
                      </div>
                      <div className="panel-inset p-2 text-center">
                        <div className="text-xs text-gray-500 mb-1">{t("negotiate.walkAway")}</div>
                        <div className="font-display text-lg text-red-600">${(negotiationAdvice.walkAwayPrice / 100).toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="p-2 bg-green-50 rounded text-center">
                      <span className="text-xs text-gray-600">{t("negotiate.successChance")}: </span>
                      <span className="font-display text-green-600">{negotiationAdvice.successChance}%</span>
                    </div>
                    
                    {negotiationAdvice.negotiationTips.length > 0 && (
                      <div className="panel-inset p-2">
                        <h4 className="text-xs font-display text-gray-700 mb-2">{t("negotiate.tips")}</h4>
                        <ul className="text-xs space-y-1">
                          {negotiationAdvice.negotiationTips.map((tip, i) => (
                            <li key={i} className="text-gray-600">💡 {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {negotiationAdvice.openingMessage && (
                      <div className="panel-inset p-2">
                        <h4 className="text-xs font-display text-gray-700 mb-2">{t("negotiate.openingMessage")}</h4>
                        <p className="text-xs text-gray-600 italic">"{negotiationAdvice.openingMessage}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Value Prediction Section */}
            <div className="panel-raised p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: "hsl(160 70% 40%)" }} />
                  <h3 className="font-display text-sm text-retro-dark uppercase">{t("predict.title")}</h3>
                </div>
                <button
                  onClick={predictValue}
                  disabled={predictingValue}
                  className="btn-retro px-3 py-1.5 text-xs flex items-center gap-1"
                  style={{ background: "linear-gradient(180deg, hsl(160 70% 45%) 0%, hsl(160 70% 35%) 100%)", color: "white" }}
                >
                  {predictingValue ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                  {predictingValue ? t("predict.predicting") : t("predict.predict")}
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-3">{t("predict.description")}</p>
              
              {predictError && <p className="text-xs text-red-600 mb-2">{predictError}</p>}
              
              {valuePrediction && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="panel-inset p-2 text-center">
                      <div className="text-xs text-gray-500 mb-1">{t("predict.6months")}</div>
                      <div className="font-display text-sm" style={{ color: valuePrediction.predictions.sixMonths >= listing.price_cents ? "hsl(140 60% 35%)" : "hsl(0 60% 45%)" }}>
                        ${(valuePrediction.predictions.sixMonths / 100).toFixed(0)}
                      </div>
                    </div>
                    <div className="panel-inset p-2 text-center">
                      <div className="text-xs text-gray-500 mb-1">{t("predict.1year")}</div>
                      <div className="font-display text-sm" style={{ color: valuePrediction.predictions.oneYear >= listing.price_cents ? "hsl(140 60% 35%)" : "hsl(0 60% 45%)" }}>
                        ${(valuePrediction.predictions.oneYear / 100).toFixed(0)}
                      </div>
                    </div>
                    <div className="panel-inset p-2 text-center">
                      <div className="text-xs text-gray-500 mb-1">{t("predict.5years")}</div>
                      <div className="font-display text-sm" style={{ color: valuePrediction.predictions.fiveYears >= listing.price_cents ? "hsl(140 60% 35%)" : "hsl(0 60% 45%)" }}>
                        ${(valuePrediction.predictions.fiveYears / 100).toFixed(0)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded text-center" style={{
                    background: valuePrediction.investmentRating === "strong_buy" || valuePrediction.investmentRating === "buy" ? "hsl(140 60% 90%)" :
                                valuePrediction.investmentRating === "hold" ? "hsl(45 60% 90%)" : "hsl(0 60% 90%)"
                  }}>
                    <div className="text-xs text-gray-500 mb-1">{t("predict.rating")}</div>
                    <div className="font-display text-lg">{t(`predict.${valuePrediction.investmentRating}`)}</div>
                    <div className="text-xs text-gray-500">{t("predict.confidence")}: {valuePrediction.confidence}%</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {valuePrediction.appreciationFactors.length > 0 && (
                      <div className="panel-inset p-2">
                        <h4 className="text-xs font-display text-green-700 mb-2">{t("predict.appreciation")}</h4>
                        <ul className="text-xs space-y-1">
                          {valuePrediction.appreciationFactors.slice(0, 3).map((f, i) => (
                            <li key={i} className="text-gray-600 flex items-start gap-1">
                              <TrendingUp className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {valuePrediction.depreciationRisks.length > 0 && (
                      <div className="panel-inset p-2">
                        <h4 className="text-xs font-display text-red-700 mb-2">{t("predict.depreciation")}</h4>
                        <ul className="text-xs space-y-1">
                          {valuePrediction.depreciationRisks.slice(0, 3).map((r, i) => (
                            <li key={i} className="text-gray-600 flex items-start gap-1">
                              <TrendingDown className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2 bg-white/70 rounded">
                    <h4 className="text-xs font-display text-gray-700 mb-1">{t("predict.recommendation")}</h4>
                    <p className="text-xs text-gray-600">{valuePrediction.recommendation}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Collection Builder Section */}
            <div className="panel-raised p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5" style={{ color: "hsl(280 70% 50%)" }} />
                  <h3 className="font-display text-sm text-retro-dark uppercase">{t("collection.title")}</h3>
                </div>
                <button
                  onClick={buildCollection}
                  disabled={buildingCollection}
                  className="btn-retro px-3 py-1.5 text-xs flex items-center gap-1"
                  style={{ background: "linear-gradient(180deg, hsl(280 70% 55%) 0%, hsl(280 70% 45%) 100%)", color: "white" }}
                >
                  {buildingCollection ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                  {buildingCollection ? t("collection.building") : t("collection.build")}
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-3">{t("collection.description")}</p>
              
              {collectionError && <p className="text-xs text-red-600 mb-2">{collectionError}</p>}
              
              {collectionAnalysis && (
                <div className="space-y-3">
                  <div className="panel-inset p-3">
                    <h4 className="font-display text-sm" style={{ color: "hsl(280 70% 40%)" }}>{collectionAnalysis.collectionName}</h4>
                    <p className="text-xs text-gray-500">{collectionAnalysis.theme}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="panel-inset p-2 text-center">
                      <div className="text-xs text-gray-500 mb-1">{t("collection.items")}</div>
                      <div className="font-display text-lg" style={{ color: "hsl(280 70% 40%)" }}>{collectionAnalysis.totalItems}</div>
                    </div>
                    <div className="panel-inset p-2 text-center">
                      <div className="text-xs text-gray-500 mb-1">{t("collection.value")}</div>
                      <div className="font-display text-lg text-green-600">${(collectionAnalysis.estimatedValue / 100).toFixed(0)}</div>
                    </div>
                    <div className="panel-inset p-2 text-center">
                      <div className="text-xs text-gray-500 mb-1">{t("collection.complete")}</div>
                      <div className="font-display text-lg" style={{ color: collectionAnalysis.completionPercentage >= 80 ? "hsl(140 60% 35%)" : "hsl(45 70% 45%)" }}>
                        {collectionAnalysis.completionPercentage}%
                      </div>
                    </div>
                  </div>
                  
                  {collectionAnalysis.relatedItems.length > 0 && (
                    <div className="panel-inset p-2">
                      <h4 className="text-xs font-display text-gray-700 mb-2">{t("collection.related")}</h4>
                      <div className="space-y-2">
                        {collectionAnalysis.relatedItems.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{item.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-white text-[10px]" style={{
                                background: item.rarity === "legendary" ? "hsl(45 100% 45%)" :
                                            item.rarity === "epic" ? "hsl(280 70% 50%)" :
                                            item.rarity === "rare" ? "hsl(210 80% 50%)" : "hsl(0 0% 60%)"
                              }}>{item.rarity}</span>
                              <span className="text-green-600 font-display">${(item.estimatedPrice / 100).toFixed(0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {collectionAnalysis.missingPieces.length > 0 && (
                    <div className="panel-inset p-2">
                      <h4 className="text-xs font-display text-orange-700 mb-2">{t("collection.missing")}</h4>
                      <ul className="text-xs space-y-1">
                        {collectionAnalysis.missingPieces.slice(0, 4).map((piece, i) => (
                          <li key={i} className="text-gray-600">🔍 {piece}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {collectionAnalysis.collectionTips.length > 0 && (
                    <div className="panel-inset p-2">
                      <h4 className="text-xs font-display text-gray-700 mb-2">{t("collection.tips")}</h4>
                      <ul className="text-xs space-y-1">
                        {collectionAnalysis.collectionTips.slice(0, 3).map((tip, i) => (
                          <li key={i} className="text-gray-600">💡 {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="p-2 bg-white/70 rounded">
                    <p className="text-xs text-gray-600">{collectionAnalysis.summary}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Trade Matcher Section */}
            <div className="panel-raised p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Repeat className="w-5 h-5" style={{ color: "hsl(200 70% 45%)" }} />
                  <h3 className="font-display text-sm text-retro-dark uppercase">{t("trade.title")}</h3>
                </div>
                <button
                  onClick={findTrades}
                  disabled={findingTrades}
                  className="btn-retro px-3 py-1.5 text-xs flex items-center gap-1"
                  style={{ background: "linear-gradient(180deg, hsl(200 70% 50%) 0%, hsl(200 70% 40%) 100%)", color: "white" }}
                >
                  {findingTrades ? <Loader2 className="w-3 h-3 animate-spin" /> : <Repeat className="w-3 h-3" />}
                  {findingTrades ? t("trade.finding") : t("trade.find")}
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-3">{t("trade.description")}</p>
              
              <div className="mb-3">
                <label className="text-xs text-gray-600 block mb-1">{t("trade.yourCollection")}</label>
                <input
                  type="text"
                  value={userCollection}
                  onChange={(e) => setUserCollection(e.target.value)}
                  placeholder={t("trade.collectionPlaceholder")}
                  className="panel-inset w-full px-2 py-1.5 text-xs"
                />
              </div>
              
              {tradeError && <p className="text-xs text-red-600 mb-2">{tradeError}</p>}
              
              {tradeAnalysis && (
                <div className="space-y-3">
                  <div className="p-3 rounded text-center" style={{ background: "hsl(200 60% 92%)" }}>
                    <div className="text-xs text-gray-500 mb-1">{t("trade.matchScore")}</div>
                    <div className="font-display text-2xl" style={{ color: "hsl(200 70% 40%)" }}>{tradeAnalysis.matchScore}%</div>
                    <div className="text-xs text-gray-500">{tradeAnalysis.valueBalance}</div>
                  </div>
                  
                  {tradeAnalysis.potentialTrades.length > 0 && (
                    <div className="panel-inset p-2">
                      <h4 className="text-xs font-display text-gray-700 mb-2">{t("trade.potentialTrades")}</h4>
                      <div className="space-y-2">
                        {tradeAnalysis.potentialTrades.slice(0, 4).map((trade, i) => (
                          <div key={i} className="flex items-center justify-between text-xs p-2 bg-white/50 rounded">
                            <div>
                              <span className="text-gray-700">{trade.title}</span>
                              <div className="text-gray-500">${(trade.estimatedValue / 100).toFixed(0)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{trade.compatibility}%</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] text-white ${
                                trade.tradeAdvantage === "favorable" ? "bg-green-500" :
                                trade.tradeAdvantage === "fair" ? "bg-yellow-500" : "bg-red-500"
                              }`}>
                                {t(`trade.${trade.tradeAdvantage}`)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {tradeAnalysis.negotiationTips.length > 0 && (
                    <div className="panel-inset p-2">
                      <h4 className="text-xs font-display text-gray-700 mb-2">{t("trade.negotiationTips")}</h4>
                      <ul className="text-xs space-y-1">
                        {tradeAnalysis.negotiationTips.slice(0, 3).map((tip, i) => (
                          <li key={i} className="text-gray-600">💬 {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="p-2 bg-white/70 rounded">
                    <h4 className="text-xs font-display text-gray-700 mb-1">{t("trade.recommendation")}</h4>
                    <p className="text-xs text-gray-600">{tradeAnalysis.tradeRecommendation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
