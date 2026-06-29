import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Plus, X, ImageIcon, Loader2, Upload, Gamepad2, Package, Sparkles, DollarSign, TrendingUp, Tag, Hash, Lock, Shield, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { useAuth } from "@/react-app/auth";

const itemCategories = [
  "Gaming",
  "Collectibles", 
  "Retro Tech",
  "Comics",
  "Electronics",
  "Other",
];

const gamePlatforms = [
  { value: "genshin", label: "Genshin Impact" },
  { value: "lol", label: "League of Legends" },
  { value: "valorant", label: "Valorant" },
  { value: "csgo", label: "CS2 / CS:GO" },
  { value: "fortnite", label: "Fortnite" },
  { value: "minecraft", label: "Minecraft" },
  { value: "roblox", label: "Roblox" },
  { value: "playstation", label: "PlayStation Network" },
  { value: "xbox", label: "Xbox Live" },
  { value: "nintendo", label: "Nintendo Account" },
  { value: "steam", label: "Steam" },
  { value: "epic", label: "Epic Games" },
  { value: "other", label: "Other" },
];

const conditions = [
  { value: "new", key: "createListing.conditions.new" },
  { value: "like_new", key: "createListing.conditions.likeNew" },
  { value: "good", key: "createListing.conditions.good" },
  { value: "fair", key: "createListing.conditions.fair" },
  { value: "used", key: "createListing.conditions.used" },
];

const accountConditions = [
  { value: "full_access", key: "Full Access" },
  { value: "email_changeable", key: "Email Changeable" },
  { value: "linked", key: "Linked Account" },
];

export default function CreateListing() {
  const { t } = useLanguage();
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Listing type
  const [listingType, setListingType] = useState<"item" | "account">("item");
  
  // Common fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingPrice, setIsGeneratingPrice] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<{
    suggestedPrice: number;
    minPrice: number;
    maxPrice: number;
    confidence: string;
    reasoning: string;
  } | null>(null);
  const [isGeneratingValuation, setIsGeneratingValuation] = useState(false);
  const [accountValuation, setAccountValuation] = useState<{
    estimatedValue: { low: number; mid: number; high: number };
    marketDemand: string;
    confidence: string;
    valueFactors: { positive: string[]; negative: string[] };
    riskLevel: string;
    riskFactors: string[];
    recommendations: string[];
    summary: string;
  } | null>(null);
  const [error, setError] = useState("");
  
  // Tag suggestions state
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<{
    primaryTags: string[];
    secondaryTags: string[];
    trendingTags: string[];
    searchTerms: string[];
  } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Item-specific fields
  const [category, setCategory] = useState(itemCategories[0]);
  const [condition, setCondition] = useState("good");
  const [location, setLocation] = useState("");
  
  // Account-specific fields
  const [gamePlatform, setGamePlatform] = useState(gamePlatforms[0].value);
  const [accountLevel, setAccountLevel] = useState("");
  const [accountRank, setAccountRank] = useState("");
  const [accountServer, setAccountServer] = useState("");
  const [accountCondition, setAccountCondition] = useState("full_access");
  
  // Account credentials (for escrow transactions)
  const [credLoginEmail, setCredLoginEmail] = useState("");
  const [credLoginUsername, setCredLoginUsername] = useState("");
  const [credLoginPassword, setCredLoginPassword] = useState("");
  const [credRecoveryEmail, setCredRecoveryEmail] = useState("");
  const [credRecoveryPhone, setCredRecoveryPhone] = useState("");
  const [credAdditionalInfo, setCredAdditionalInfo] = useState("");
  const [showCredPassword, setShowCredPassword] = useState(false);

  const addImageUrl = () => {
    if (imageInput.trim() && images.length < 5) {
      setImages([...images, imageInput.trim()]);
      setImageInput("");
    }
  };

  const generateDescription = async () => {
    if (!title.trim()) {
      setError(t("ai.needTitle"));
      return;
    }
    
    setIsGeneratingDesc(true);
    setError("");
    
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          condition: listingType === "account" ? accountCondition : condition,
          listingType,
          gamePlatform: listingType === "account" ? gamePlatform : undefined,
          accountLevel: listingType === "account" ? accountLevel : undefined,
          accountRank: listingType === "account" ? accountRank : undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate description");
      }
      
      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
      }
    } catch {
      setError(t("ai.generateError"));
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const generatePrice = async () => {
    if (!title.trim()) {
      setError(t("ai.needTitle"));
      return;
    }
    
    setIsGeneratingPrice(true);
    setError("");
    setPriceSuggestion(null);
    
    try {
      const response = await fetch("/api/ai/smart-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          condition: listingType === "account" ? accountCondition : condition,
          listingType,
          gamePlatform: listingType === "account" ? gamePlatform : undefined,
          accountLevel: listingType === "account" ? accountLevel : undefined,
          accountRank: listingType === "account" ? accountRank : undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate price suggestion");
      }
      
      const data = await response.json();
      if (data.suggestedPrice) {
        setPriceSuggestion(data);
        // Auto-fill the suggested price
        setPrice((data.suggestedPrice / 100).toFixed(2));
      }
    } catch {
      setError(t("ai.priceError"));
    } finally {
      setIsGeneratingPrice(false);
    }
  };

  const generateValuation = async () => {
    if (!gamePlatform) {
      setError(t("ai.needGame"));
      return;
    }
    
    setIsGeneratingValuation(true);
    setError("");
    setAccountValuation(null);
    
    try {
      const response = await fetch("/api/ai/account-valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gamePlatform: gamePlatforms.find(g => g.value === gamePlatform)?.label || gamePlatform,
          accountLevel,
          accountRank,
          accountServer,
          features: accountCondition,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate valuation");
      }
      
      const data = await response.json();
      if (data.valuation) {
        setAccountValuation(data.valuation);
        // Auto-fill the mid value price
        if (data.valuation.estimatedValue?.mid) {
          setPrice(data.valuation.estimatedValue.mid.toFixed(2));
        }
      }
    } catch {
      setError(t("ai.valuationError"));
    } finally {
      setIsGeneratingValuation(false);
    }
  };

  const generateTags = async () => {
    if (!title.trim()) {
      setError(t("ai.needTitle"));
      return;
    }
    
    setIsGeneratingTags(true);
    setError("");
    setSuggestedTags(null);
    
    try {
      const response = await fetch("/api/ai/tag-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          listingType,
          gamePlatform: listingType === "account" ? gamePlatform : undefined,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to generate tags");
      
      const data = await response.json();
      if (data.primaryTags) {
        setSuggestedTags(data);
      }
    } catch {
      setError(t("tags.error"));
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setError("");
    
    try {
      for (const file of Array.from(files)) {
        if (images.length >= 5) break;
        
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }
        
        const data = await response.json();
        setImages(prev => [...prev, data.url]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError(t("createListing.errors.invalidPrice"));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload: Record<string, unknown> = {
        title,
        description,
        price_cents: Math.round(priceNum * 100),
        images,
        listing_type: listingType,
      };
      
      if (listingType === "item") {
        payload.category = category;
        payload.condition = condition;
        payload.location = location;
      } else {
        payload.category = "Accounts";
        payload.condition = accountCondition;
        payload.game_platform = gamePlatform;
        payload.account_level = accountLevel;
        payload.account_rank = accountRank;
        payload.account_server = accountServer;
      }
      
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error("Failed to create listing");
      
      const data = await response.json();
      
      // Save credentials for account listings (escrow system)
      if (listingType === "account" && credLoginPassword && data.listingId) {
        try {
          await fetch(`/api/listings/${data.listingId}/credentials`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              login_email: credLoginEmail || null,
              login_username: credLoginUsername || null,
              login_password: credLoginPassword,
              recovery_email: credRecoveryEmail || null,
              recovery_phone: credRecoveryPhone || null,
              additional_info: credAdditionalInfo || null,
            }),
          });
        } catch {
          // Credentials save failed, but listing was created - user can update later
          console.error("Failed to save credentials");
        }
      }
      
      navigate(`/marketplace/listing/${data.listingId}`);
    } catch {
      setError(t("createListing.errors.failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not logged in
  if (!isPending && !user) {
    navigate("/login");
    return null;
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 100% 55%)" }}>
        <div className="panel-raised p-8">
          <Loader2 className="w-8 h-8 animate-spin text-retro-dark" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "hsl(210 100% 55%)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="panel-raised mb-6">
          <div className="bg-gradient-to-r from-retro-dark to-retro-gray text-white px-3 py-1 flex items-center gap-2">
            <div className="w-3 h-3 bg-retro-gold" />
            <span className="font-display text-sm tracking-wider">
              {t("createListing.titleBar")}
            </span>
          </div>
          <div className="p-4">
            <Link 
              to="/marketplace" 
              className="inline-flex items-center gap-2 text-retro-dark hover:text-retro-gold transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-display text-sm">{t("createListing.back")}</span>
            </Link>
            <h1 className="font-display text-2xl text-retro-dark">
              {t("createListing.heading")}
            </h1>
          </div>
        </div>

        {/* Listing Type Selector */}
        <div className="panel-raised mb-6 p-4">
          <label className="block font-display text-sm text-retro-dark mb-3">
            What are you selling?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setListingType("item")}
              className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                listingType === "item" 
                  ? "border-retro-gold bg-retro-gold/10" 
                  : "border-retro-gray/30 hover:border-retro-gray/60"
              }`}
            >
              <Package className={`w-8 h-8 ${listingType === "item" ? "text-retro-gold" : "text-retro-gray"}`} />
              <span className="font-display text-sm text-retro-dark">Physical Item</span>
              <span className="text-xs text-retro-gray font-body">Games, collectibles, tech</span>
            </button>
            <button
              type="button"
              onClick={() => setListingType("account")}
              className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                listingType === "account" 
                  ? "border-retro-gold bg-retro-gold/10" 
                  : "border-retro-gray/30 hover:border-retro-gray/60"
              }`}
            >
              <Gamepad2 className={`w-8 h-8 ${listingType === "account" ? "text-retro-gold" : "text-retro-gray"}`} />
              <span className="font-display text-sm text-retro-dark">Game Account</span>
              <span className="text-xs text-retro-gray font-body">Genshin, LoL, PSN, etc.</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="panel-raised">
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block font-display text-sm text-retro-dark mb-2">
                {t("createListing.fields.title")} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none"
                placeholder={listingType === "account" ? "e.g., AR55 Genshin Account - 50+ 5-stars" : t("createListing.placeholders.title")}
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-display text-sm text-retro-dark">
                  {t("createListing.fields.description")} *
                </label>
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={isGeneratingDesc}
                  className="btn-retro px-3 py-1 text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isGeneratingDesc ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {isGeneratingDesc ? t("ai.generating") : t("ai.generateDesc")}
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none resize-none"
                placeholder={listingType === "account" 
                  ? "Describe what's included: characters, skins, items, achievements, etc." 
                  : t("createListing.placeholders.description")}
              />
            </div>

            {/* Price */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-display text-sm text-retro-dark">
                  {t("createListing.fields.price")} *
                </label>
                <button
                  type="button"
                  onClick={generatePrice}
                  disabled={isGeneratingPrice || !title.trim()}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-display bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all"
                >
                  {isGeneratingPrice ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t("ai.analyzing")}
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-3 h-3" />
                      {t("ai.smartPrice")}
                    </>
                  )}
                </button>
              </div>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-retro-dark">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full panel-inset pl-7 pr-3 py-2 font-body text-retro-dark focus:outline-none"
                />
              </div>
              {priceSuggestion && (
                <div className="mt-3 p-3 panel-raised bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="font-display text-sm text-purple-700">{t("ai.priceSuggestion")}</span>
                  </div>
                  <div className="flex items-baseline gap-4 mb-2">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{t("ai.priceMin")}</p>
                      <p className="font-display text-green-600">${(priceSuggestion.minPrice / 100).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{t("ai.priceRecommended")}</p>
                      <p className="font-display text-lg text-purple-700">${(priceSuggestion.suggestedPrice / 100).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{t("ai.priceMax")}</p>
                      <p className="font-display text-green-600">${(priceSuggestion.maxPrice / 100).toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic">{priceSuggestion.reasoning}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPrice((priceSuggestion.minPrice / 100).toFixed(2))}
                      className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {t("ai.useMin")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrice((priceSuggestion.suggestedPrice / 100).toFixed(2))}
                      className="text-xs px-2 py-1 bg-purple-100 border border-purple-300 rounded hover:bg-purple-200"
                    >
                      {t("ai.useRecommended")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrice((priceSuggestion.maxPrice / 100).toFixed(2))}
                      className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {t("ai.useMax")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Account-specific fields */}
            {listingType === "account" && (
              <>
                {/* Game/Platform */}
                <div>
                  <label className="block font-display text-sm text-retro-dark mb-2">
                    Game / Platform *
                  </label>
                  <select
                    value={gamePlatform}
                    onChange={(e) => setGamePlatform(e.target.value)}
                    className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none cursor-pointer"
                  >
                    {gamePlatforms.map((gp) => (
                      <option key={gp.value} value={gp.value}>{gp.label}</option>
                    ))}
                  </select>
                </div>

                {/* Account details row */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-display text-sm text-retro-dark mb-2">
                      Level / AR
                    </label>
                    <input
                      type="text"
                      value={accountLevel}
                      onChange={(e) => setAccountLevel(e.target.value)}
                      className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none"
                      placeholder="e.g., AR 55"
                    />
                  </div>
                  <div>
                    <label className="block font-display text-sm text-retro-dark mb-2">
                      Rank / Tier
                    </label>
                    <input
                      type="text"
                      value={accountRank}
                      onChange={(e) => setAccountRank(e.target.value)}
                      className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none"
                      placeholder="e.g., Diamond"
                    />
                  </div>
                  <div>
                    <label className="block font-display text-sm text-retro-dark mb-2">
                      Server
                    </label>
                    <input
                      type="text"
                      value={accountServer}
                      onChange={(e) => setAccountServer(e.target.value)}
                      className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none"
                      placeholder="e.g., NA"
                    />
                  </div>
                </div>

                {/* Account condition */}
                <div>
                  <label className="block font-display text-sm text-retro-dark mb-2">
                    Account Access Type *
                  </label>
                  <select
                    value={accountCondition}
                    onChange={(e) => setAccountCondition(e.target.value)}
                    className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none cursor-pointer"
                  >
                    {accountConditions.map((c) => (
                      <option key={c.value} value={c.value}>{c.key}</option>
                    ))}
                  </select>
                </div>

                {/* AI Account Valuation */}
                <div className="p-4 panel-raised bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-cyan-600" />
                      <span className="font-display text-sm text-cyan-800">{t("ai.accountValuation")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={generateValuation}
                      disabled={isGeneratingValuation || !gamePlatform}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all"
                    >
                      {isGeneratingValuation ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {t("ai.analyzing")}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          {t("ai.getValuation")}
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{t("ai.valuationHelp")}</p>
                  
                  {accountValuation && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-cyan-200">
                      {/* Estimated Value */}
                      <div className="flex items-baseline gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">{t("ai.priceMin")}</p>
                          <p className="font-display text-green-600">${accountValuation.estimatedValue.low.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">{t("ai.priceRecommended")}</p>
                          <p className="font-display text-lg text-cyan-700">${accountValuation.estimatedValue.mid.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">{t("ai.priceMax")}</p>
                          <p className="font-display text-green-600">${accountValuation.estimatedValue.high.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Quick set buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPrice(accountValuation.estimatedValue.low.toFixed(2))}
                          className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                          {t("ai.useMin")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrice(accountValuation.estimatedValue.mid.toFixed(2))}
                          className="text-xs px-2 py-1 bg-cyan-100 border border-cyan-300 rounded hover:bg-cyan-200"
                        >
                          {t("ai.useRecommended")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrice(accountValuation.estimatedValue.high.toFixed(2))}
                          className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                          {t("ai.useMax")}
                        </button>
                      </div>

                      {/* Market info badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-display ${
                          accountValuation.marketDemand === "high" ? "bg-green-100 text-green-700" :
                          accountValuation.marketDemand === "medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {t("ai.demand")}: {accountValuation.marketDemand}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-display ${
                          accountValuation.riskLevel === "low" ? "bg-green-100 text-green-700" :
                          accountValuation.riskLevel === "medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {t("ai.risk")}: {accountValuation.riskLevel}
                        </span>
                      </div>

                      {/* Value factors */}
                      {accountValuation.valueFactors.positive.length > 0 && (
                        <div>
                          <p className="text-xs font-display text-green-700 mb-1">✓ {t("ai.positiveFactors")}</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {accountValuation.valueFactors.positive.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {accountValuation.valueFactors.negative.length > 0 && (
                        <div>
                          <p className="text-xs font-display text-red-700 mb-1">✗ {t("ai.negativeFactors")}</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {accountValuation.valueFactors.negative.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Summary */}
                      <p className="text-xs text-gray-700 italic bg-white/50 p-2 rounded">{accountValuation.summary}</p>

                      {/* Recommendations */}
                      {accountValuation.recommendations.length > 0 && (
                        <div>
                          <p className="text-xs font-display text-cyan-700 mb-1">💡 {t("ai.recommendations")}</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {accountValuation.recommendations.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Account Credentials (Escrow) */}
                <div className="p-4 panel-raised bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-5 h-5 text-purple-600" />
                    <span className="font-display text-sm text-purple-800">Account Credentials (Secure Escrow)</span>
                  </div>
                  
                  <div className="flex items-start gap-2 p-3 bg-white/70 rounded mb-4">
                    <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">
                      These credentials are encrypted and only revealed to the buyer <strong>after payment</strong>. 
                      The buyer must confirm receipt before you receive payment. This protects both parties.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block font-display text-sm text-retro-dark mb-2">
                        Login Email
                      </label>
                      <input
                        type="email"
                        value={credLoginEmail}
                        onChange={(e) => setCredLoginEmail(e.target.value)}
                        className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none"
                        placeholder="account@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block font-display text-sm text-retro-dark mb-2">
                        Login Username (if different)
                      </label>
                      <input
                        type="text"
                        value={credLoginUsername}
                        onChange={(e) => setCredLoginUsername(e.target.value)}
                        className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none"
                        placeholder="username123"
                      />
                    </div>
                    
                    <div>
                      <label className="block font-display text-sm text-retro-dark mb-2">
                        Account Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showCredPassword ? "text" : "password"}
                          value={credLoginPassword}
                          onChange={(e) => setCredLoginPassword(e.target.value)}
                          className="w-full panel-inset px-3 py-2 pr-10 font-body text-retro-dark focus:outline-none"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCredPassword(!showCredPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                        >
                          {showCredPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block font-display text-sm text-retro-dark mb-2">
                        Recovery Email (optional)
                      </label>
                      <input
                        type="email"
                        value={credRecoveryEmail}
                        onChange={(e) => setCredRecoveryEmail(e.target.value)}
                        className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none"
                        placeholder="recovery@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block font-display text-sm text-retro-dark mb-2">
                        Recovery Phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={credRecoveryPhone}
                        onChange={(e) => setCredRecoveryPhone(e.target.value)}
                        className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none"
                        placeholder="+1 555 123 4567"
                      />
                    </div>
                    
                    <div>
                      <label className="block font-display text-sm text-retro-dark mb-2">
                        Additional Login Info (optional)
                      </label>
                      <textarea
                        value={credAdditionalInfo}
                        onChange={(e) => setCredAdditionalInfo(e.target.value)}
                        rows={3}
                        className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none resize-none"
                        placeholder="Security questions, 2FA backup codes, linked accounts, etc."
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Item-specific fields */}
            {listingType === "item" && (
              <>
                {/* Category and Condition row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-display text-sm text-retro-dark mb-2">
                      {t("createListing.fields.category")} *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none cursor-pointer"
                    >
                      {itemCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-display text-sm text-retro-dark mb-2">
                      {t("createListing.fields.condition")} *
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none cursor-pointer"
                    >
                      {conditions.map((c) => (
                        <option key={c.value} value={c.value}>{t(c.key)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block font-display text-sm text-retro-dark mb-2">
                    {t("createListing.fields.location")}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none"
                    placeholder={t("createListing.placeholders.location")}
                  />
                </div>
              </>
            )}

            {/* Images */}
            <div>
              <label className="block font-display text-sm text-retro-dark mb-2">
                {t("createListing.fields.images")}
              </label>
              
              {/* Image preview grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square panel-inset">
                      <img 
                        src={img} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-retro-gold text-retro-dark text-xs text-center py-0.5 font-display">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
                  {images.length < 5 && (
                    <div className="aspect-square panel-inset flex items-center justify-center text-retro-gray">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
              )}
              
              {/* Upload buttons */}
              {images.length < 5 && (
                <div className="space-y-3">
                  {/* File upload */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`btn-retro px-4 py-2 inline-flex items-center gap-2 cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {isUploading ? "Uploading..." : "Upload from device"}
                    </label>
                  </div>
                  
                  {/* URL input */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageInput}
                      onChange={(e) => setImageInput(e.target.value)}
                      className="flex-1 panel-inset px-3 py-2 font-body text-retro-dark focus:outline-none"
                      placeholder={t("createListing.placeholders.imageUrl")}
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="btn-retro px-4 py-2 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      {t("createListing.addImage")}
                    </button>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-retro-gray mt-2 font-body">
                {listingType === "account" 
                  ? "Add screenshots of your account, inventory, characters, or achievements (max 5 images, 5MB each)"
                  : t("createListing.imagesHelp")}
              </p>
            </div>

            {/* AI Tag Suggestions */}
            <div className="p-4 panel-raised bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-orange-600" />
                  <span className="font-display text-sm text-orange-800">{t("tags.title")}</span>
                </div>
                <button
                  type="button"
                  onClick={generateTags}
                  disabled={isGeneratingTags || !title.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition-all"
                >
                  {isGeneratingTags ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t("tags.generating")}
                    </>
                  ) : (
                    <>
                      <Hash className="w-3 h-3" />
                      {t("tags.generate")}
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-3">{t("tags.description")}</p>
              
              {suggestedTags && (
                <div className="space-y-3 mt-4 pt-4 border-t border-orange-200">
                  {/* Primary Tags */}
                  {suggestedTags.primaryTags.length > 0 && (
                    <div>
                      <p className="text-xs font-display text-orange-700 mb-2 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {t("tags.primary")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedTags.primaryTags.map((tag, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-2 py-1 rounded text-xs font-body transition-all ${
                              selectedTags.includes(tag)
                                ? "bg-orange-500 text-white"
                                : "bg-white border border-orange-300 text-orange-700 hover:bg-orange-100"
                            }`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Trending Tags */}
                  {suggestedTags.trendingTags.length > 0 && (
                    <div>
                      <p className="text-xs font-display text-pink-700 mb-2 flex items-center gap-1">
                        🔥 {t("tags.trending")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedTags.trendingTags.map((tag, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-2 py-1 rounded text-xs font-body transition-all ${
                              selectedTags.includes(tag)
                                ? "bg-pink-500 text-white"
                                : "bg-white border border-pink-300 text-pink-700 hover:bg-pink-100"
                            }`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Secondary Tags */}
                  {suggestedTags.secondaryTags.length > 0 && (
                    <div>
                      <p className="text-xs font-display text-gray-600 mb-2">{t("tags.secondary")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedTags.secondaryTags.map((tag, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-2 py-1 rounded text-xs font-body transition-all ${
                              selectedTags.includes(tag)
                                ? "bg-gray-500 text-white"
                                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Selected tags display */}
                  {selectedTags.length > 0 && (
                    <div className="p-2 bg-white/70 rounded">
                      <p className="text-xs font-display text-gray-700 mb-2">{t("tags.selected")} ({selectedTags.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Search terms tip */}
                  {suggestedTags.searchTerms.length > 0 && (
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-xs font-display text-blue-700 mb-1">💡 {t("tags.searchTerms")}</p>
                      <p className="text-xs text-gray-600">{suggestedTags.searchTerms.join(", ")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="panel-inset bg-red-100 p-3 text-red-700 font-body text-sm">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full btn-gold py-3 font-display text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("createListing.submitting")}
                </>
              ) : (
                t("createListing.submit")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
