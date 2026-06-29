import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Search, Filter, X, MapPin, Tag, ChevronDown, Package, Gamepad2, Camera, ImageIcon, Loader2 } from "lucide-react";
import { useLanguage } from "@/react-app/contexts/LanguageContext";

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

const itemCategories = [
  "gaming",
  "collectibles",
  "retro",
  "comics",
  "electronics",
  "other",
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

const conditions = ["new", "like_new", "good", "fair", "used"];

export default function BrowseListings() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Image search states
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchResult, setImageSearchResult] = useState<{
    searchQuery: string;
    category: string;
    gamePlatform: string | null;
    isGameAccount: boolean;
    confidence: string;
    description: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [listingType, setListingType] = useState(searchParams.get("listing_type") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [gamePlatform, setGamePlatform] = useState(searchParams.get("game_platform") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (listingType) params.set("listing_type", listingType);
      if (category) params.set("category", category);
      if (gamePlatform) params.set("game_platform", gamePlatform);
      if (condition) params.set("condition", condition);
      if (minPrice) params.set("min_price", minPrice);
      if (maxPrice) params.set("max_price", maxPrice);
      if (sortBy) params.set("sort", sortBy);
      
      const response = await fetch(`/api/listings?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (listingType) params.set("listing_type", listingType);
    if (category) params.set("category", category);
    if (gamePlatform) params.set("game_platform", gamePlatform);
    if (condition) params.set("condition", condition);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (sortBy) params.set("sort", sortBy);
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearch("");
    setListingType("");
    setCategory("");
    setGamePlatform("");
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setSearchParams({});
  };

  const handleListingTypeChange = (type: string) => {
    setListingType(type);
    // Clear category-specific filters when switching types
    if (type === "account") {
      setCategory("");
    } else if (type === "item") {
      setGamePlatform("");
    } else {
      setCategory("");
      setGamePlatform("");
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
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

  const getCategoryLabel = (cat: string) => {
    return t(`marketplace.categories.${cat}`) || cat;
  };

  const getGamePlatformLabel = (platform: string) => {
    const found = gamePlatforms.find(p => p.value === platform);
    return found?.label || platform;
  };

  const parseImages = (imagesJson: string): string[] => {
    try {
      return JSON.parse(imagesJson) || [];
    } catch {
      return [];
    }
  };

  const handleImageSearch = async (file: File) => {
    setImageSearchLoading(true);
    setImageSearchResult(null);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        const response = await fetch("/api/ai/image-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setImageSearchResult(data);
          
          // Auto-apply search results
          setSearch(data.searchQuery || "");
          if (data.isGameAccount) {
            setListingType("account");
            if (data.gamePlatform) {
              setGamePlatform(data.gamePlatform);
            }
          } else if (data.category) {
            setListingType("item");
            setCategory(data.category);
          }
        } else {
          console.error("Image search failed");
        }
        
        setImageSearchLoading(false);
      };
      
      reader.onerror = () => {
        console.error("Failed to read image");
        setImageSearchLoading(false);
      };
    } catch (error) {
      console.error("Image search error:", error);
      setImageSearchLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSearch(file);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "hsl(180 60% 35%)" }}>
      {/* Title Bar */}
      <div
        className="panel-raised mx-4 mt-4 p-1 flex items-center gap-2"
        style={{ background: "hsl(240 80% 35%)" }}
      >
        <Package className="w-4 h-4 text-white ml-2" />
        <span className="text-white text-sm font-bold tracking-wide">
          {t("browse.titleBar")}
        </span>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Listing Type Tabs */}
        <div className="panel-raised p-2 mb-4 flex gap-2" style={{ background: "hsl(0 0% 80%)" }}>
          <button
            onClick={() => { handleListingTypeChange(""); applyFilters(); }}
            className={`flex-1 py-3 px-4 text-sm font-bold rounded transition-all flex items-center justify-center gap-2 ${
              !listingType 
                ? "bg-white shadow-md text-gray-800" 
                : "text-gray-600 hover:bg-white/50"
            }`}
          >
            <Package className="w-4 h-4" />
            All Listings
          </button>
          <button
            onClick={() => { handleListingTypeChange("item"); applyFilters(); }}
            className={`flex-1 py-3 px-4 text-sm font-bold rounded transition-all flex items-center justify-center gap-2 ${
              listingType === "item" 
                ? "bg-white shadow-md text-gray-800" 
                : "text-gray-600 hover:bg-white/50"
            }`}
          >
            <Package className="w-4 h-4" />
            Physical Items
          </button>
          <button
            onClick={() => { handleListingTypeChange("account"); applyFilters(); }}
            className={`flex-1 py-3 px-4 text-sm font-bold rounded transition-all flex items-center justify-center gap-2 ${
              listingType === "account" 
                ? "bg-white shadow-md text-gray-800" 
                : "text-gray-600 hover:bg-white/50"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Game Accounts
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="panel-raised p-4 mb-4" style={{ background: "hsl(0 0% 85%)" }}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 flex gap-2">
              <div className="panel-inset flex-1 flex items-center px-3 py-2 bg-white">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  placeholder={t("marketplace.search.placeholder")}
                  className="flex-1 bg-transparent outline-none text-sm font-mono"
                />
              </div>
              
              {/* Image Search Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => setShowImageSearch(true)}
                className="btn-retro px-3 py-2 flex items-center gap-2 text-sm font-bold"
                title={t("imageSearch.title")}
              >
                {imageSearchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              
              <button
                onClick={applyFilters}
                className="btn-gold px-4 py-2 text-sm font-bold whitespace-nowrap"
              >
                {t("marketplace.search.button")}
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-retro px-4 py-2 flex items-center gap-2 text-sm font-bold whitespace-nowrap"
            >
              <Filter className="w-4 h-4" />
              {t("browse.filters")}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t-2 border-gray-400">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category (for items) or Game/Platform (for accounts) */}
                {listingType === "account" ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                      Game / Platform
                    </label>
                    <select
                      value={gamePlatform}
                      onChange={(e) => setGamePlatform(e.target.value)}
                      className="panel-inset w-full p-2 bg-white text-sm font-mono"
                    >
                      <option value="">All Games</option>
                      {gamePlatforms.map((gp) => (
                        <option key={gp.value} value={gp.value}>
                          {gp.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : listingType === "item" ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                      {t("createListing.fields.category")}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="panel-inset w-full p-2 bg-white text-sm font-mono"
                    >
                      <option value="">{t("browse.allCategories")}</option>
                      {itemCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {getCategoryLabel(cat)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                      {t("createListing.fields.category")}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="panel-inset w-full p-2 bg-white text-sm font-mono"
                    >
                      <option value="">{t("browse.allCategories")}</option>
                      {itemCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {getCategoryLabel(cat)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Condition */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                    {t("browse.condition")}
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="panel-inset w-full p-2 bg-white text-sm font-mono"
                  >
                    <option value="">{t("browse.allConditions")}</option>
                    {listingType === "account" ? (
                      <>
                        <option value="full_access">Full Access</option>
                        <option value="email_changeable">Email Changeable</option>
                        <option value="linked">Linked Account</option>
                      </>
                    ) : (
                      conditions.map((cond) => (
                        <option key={cond} value={cond}>
                          {getConditionLabel(cond)}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                    {t("browse.priceRange")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder={t("browse.minPrice")}
                      className="panel-inset w-full p-2 bg-white text-sm font-mono"
                    />
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder={t("browse.maxPrice")}
                      className="panel-inset w-full p-2 bg-white text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                    {t("browse.sortBy")}
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="panel-inset w-full p-2 bg-white text-sm font-mono"
                  >
                    <option value="newest">{t("browse.sort.newest")}</option>
                    <option value="oldest">{t("browse.sort.oldest")}</option>
                    <option value="price_low">{t("browse.sort.priceLow")}</option>
                    <option value="price_high">{t("browse.sort.priceHigh")}</option>
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={clearFilters}
                  className="btn-retro px-4 py-2 text-sm font-bold flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  {t("browse.clearFilters")}
                </button>
                <button
                  onClick={applyFilters}
                  className="btn-gold px-4 py-2 text-sm font-bold"
                >
                  {t("browse.applyFilters")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="text-white text-sm font-bold mb-4">
            {listings.length} {t("browse.resultsCount")}
          </div>
        )}

        {/* Listings Grid */}
        {loading ? (
          <div className="panel-raised p-8 text-center" style={{ background: "hsl(0 0% 85%)" }}>
            <div className="animate-pulse text-gray-600 font-bold">
              {t("browse.loading")}
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="panel-raised p-8 text-center" style={{ background: "hsl(0 0% 85%)" }}>
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              {t("browse.noResults")}
            </h3>
            <p className="text-gray-500 text-sm">
              {t("browse.noResultsDesc")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing) => {
              const images = parseImages(listing.images);
              const coverImage = images[0] || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400";
              const isAccount = listing.listing_type === "account";
              
              return (
                <div
                  key={listing.id}
                  className="panel-raised overflow-hidden cursor-pointer hover:translate-y-[-2px] transition-transform"
                  style={{ background: "hsl(0 0% 90%)" }}
                  onClick={() => navigate(`/marketplace/listing/${listing.id}`)}
                >
                  {/* Image */}
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={coverImage}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Type badge */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {isAccount && (
                        <span
                          className="panel-raised px-2 py-1 text-xs font-bold flex items-center gap-1"
                          style={{ background: "hsl(280 70% 50%)", color: "white" }}
                        >
                          <Gamepad2 className="w-3 h-3" />
                          Account
                        </span>
                      )}
                      <span
                        className="panel-raised px-2 py-1 text-xs font-bold"
                        style={{ background: "hsl(50 90% 55%)" }}
                      >
                        {getConditionLabel(listing.condition)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-gray-800 line-clamp-2 mb-2">
                      {listing.title}
                    </h3>
                    
                    {/* Category/Game info */}
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                      {isAccount ? (
                        <>
                          <Gamepad2 className="w-3 h-3" />
                          {getGamePlatformLabel(listing.game_platform || "")}
                        </>
                      ) : (
                        <>
                          <Tag className="w-3 h-3" />
                          {getCategoryLabel(listing.category)}
                        </>
                      )}
                    </div>

                    {/* Account details */}
                    {isAccount && (listing.account_level || listing.account_rank || listing.account_server) && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {listing.account_level && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            {listing.account_level}
                          </span>
                        )}
                        {listing.account_rank && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                            {listing.account_rank}
                          </span>
                        )}
                        {listing.account_server && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            {listing.account_server}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Location (for items) */}
                    {!isAccount && listing.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <MapPin className="w-3 h-3" />
                        {listing.location}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span
                        className="text-lg font-bold"
                        style={{ color: "hsl(120 60% 30%)" }}
                      >
                        {formatPrice(listing.price_cents)}
                      </span>
                      <button className="btn-retro px-3 py-1 text-xs font-bold whitespace-nowrap">
                        {t("browse.viewDetails")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Back to Marketplace */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/marketplace")}
            className="btn-retro px-6 py-2 font-bold"
          >
            ← {t("createListing.back")}
          </button>
        </div>
      </div>

      {/* Image Search Modal */}
      {showImageSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="panel-raised p-0 w-full max-w-md" style={{ background: "hsl(0 0% 85%)" }}>
            {/* Title Bar */}
            <div
              className="p-2 flex items-center justify-between"
              style={{ background: "hsl(240 80% 35%)" }}
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-bold">
                  {t("imageSearch.title")}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowImageSearch(false);
                  setImageSearchResult(null);
                }}
                className="text-white hover:bg-white/20 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-700 mb-4">
                {t("imageSearch.description")}
              </p>

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="panel-inset bg-white p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {imageSearchLoading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-3" />
                    <span className="text-sm text-gray-600 font-bold">
                      {t("imageSearch.analyzing")}
                    </span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="text-sm text-gray-600 font-bold mb-1">
                      {t("imageSearch.uploadPrompt")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t("imageSearch.supportedFormats")}
                    </span>
                  </>
                )}
              </div>

              {/* Search Result */}
              {imageSearchResult && (
                <div className="mt-4 panel-inset bg-white p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">🤖</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {t("imageSearch.found")}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {imageSearchResult.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {t("imageSearch.searchFor")}: {imageSearchResult.searchQuery}
                    </span>
                    {imageSearchResult.category && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {getCategoryLabel(imageSearchResult.category)}
                      </span>
                    )}
                    {imageSearchResult.gamePlatform && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {getGamePlatformLabel(imageSearchResult.gamePlatform)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowImageSearch(false);
                    setImageSearchResult(null);
                  }}
                  className="btn-retro flex-1 py-2 font-bold text-sm"
                >
                  {t("imageSearch.cancel")}
                </button>
                {imageSearchResult && (
                  <button
                    onClick={() => {
                      applyFilters();
                      setShowImageSearch(false);
                    }}
                    className="btn-gold flex-1 py-2 font-bold text-sm"
                  >
                    {t("imageSearch.search")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
