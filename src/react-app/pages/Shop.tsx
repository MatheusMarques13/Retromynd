import { useState, useEffect } from "react";
import { 
  Search, Sparkles, Filter, Grid, List, Package, 
  ChevronDown, ChevronUp, X, Loader2, ShoppingCart,
  Star, Tag, Gamepad2, Disc3, BookOpen, Cpu
} from "lucide-react";
import { Header } from "@/react-app/components/Header";
import { Footer } from "@/react-app/components/Footer";
import { useLanguage } from "@/react-app/contexts/LanguageContext";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category: string;
  image_url: string | null;
  is_active: boolean;
}

interface AIFilterSuggestion {
  query: string;
  filters: {
    category?: string;
    priceRange?: { min: number; max: number };
    keywords?: string[];
  };
  explanation: string;
}

const CATEGORIES = [
  { id: "gaming", icon: Gamepad2, color: "from-blue-500 to-cyan-500" },
  { id: "collectibles", icon: Star, color: "from-purple-500 to-pink-500" },
  { id: "retroTech", icon: Cpu, color: "from-orange-500 to-amber-500" },
  { id: "comics", icon: BookOpen, color: "from-green-500 to-emerald-500" },
  { id: "music", icon: Disc3, color: "from-red-500 to-rose-500" },
];

export default function ShopPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AIFilterSuggestion | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "name">("newest");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (data.success) {
        setProducts(data.products.filter((p: Product) => p.is_active));
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIFilter = async () => {
    if (!aiQuery.trim()) return;
    
    setAiLoading(true);
    try {
      const response = await fetch("/api/ai/shop-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      });
      const data = await response.json();
      
      if (data.success) {
        setAiSuggestion(data.suggestion);
        // Apply filters from AI
        if (data.suggestion.filters.category) {
          setSelectedCategory(data.suggestion.filters.category);
        }
        if (data.suggestion.filters.priceRange) {
          setPriceRange(data.suggestion.filters.priceRange);
        }
        if (data.suggestion.filters.keywords?.length) {
          setSearchQuery(data.suggestion.filters.keywords.join(" "));
        }
      }
    } catch (error) {
      console.error("AI filter error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setPriceRange(null);
    setAiSuggestion(null);
    setAiQuery("");
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }
      
      // Price range filter
      if (priceRange) {
        if (product.price < priceRange.min || product.price > priceRange.max) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.id - a.id;
      }
    });

  const hasActiveFilters = searchQuery || selectedCategory || priceRange || aiSuggestion;

  return (
    <div className="min-h-screen bg-retro-teal flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="panel-raised mb-6">
            <div className="title-bar">
              <div className="flex items-center gap-2">
                <Package size={14} />
                <span>{t("shop.title") || "INVENTORY.EXE"}</span>
              </div>
              <div className="flex gap-1">
                <button className="w-4 h-4 bg-retro-panel border border-retro-darker text-xs leading-none">_</button>
                <button className="w-4 h-4 bg-retro-panel border border-retro-darker text-xs leading-none">□</button>
              </div>
            </div>
            
            <div className="p-6">
              <h1 className="text-3xl font-pixel font-bold text-retro-black mb-2">
                {t("shop.heading") || "LOAD INVENTORY"}
              </h1>
              <p className="text-retro-dark">
                {t("shop.subtitle") || "Browse our complete collection of geek treasures"}
              </p>
            </div>
          </div>

          {/* AI Filter Assistant */}
          <div className="panel-raised mb-6">
            <div className="title-bar">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-yellow-300" />
                <span>{t("shop.aiAssistant") || "AI FILTER ASSISTANT"}</span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAIFilter()}
                    placeholder={t("shop.aiPlaceholder") || "Try: 'Show me retro games under $50' or 'Gaming collectibles for beginners'"}
                    className="input-field w-full pl-10 pr-4 py-3 text-sm"
                  />
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                </div>
                <button
                  onClick={handleAIFilter}
                  disabled={aiLoading || !aiQuery.trim()}
                  className="btn-gold px-6 py-3 font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {t("shop.askAI") || "ASK AI"}
                </button>
              </div>
              
              {/* AI Suggestion Result */}
              {aiSuggestion && (
                <div className="mt-4 p-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 
                               border border-pink-500/30 rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-retro-black font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-500" />
                        {t("shop.aiSays") || "AI suggests:"}
                      </p>
                      <p className="text-sm text-retro-dark mt-1">{aiSuggestion.explanation}</p>
                    </div>
                    <button
                      onClick={() => setAiSuggestion(null)}
                      className="text-retro-dark hover:text-retro-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="panel-raised mb-6">
            <div className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("shop.searchPlaceholder") || "Search products..."}
                    className="input-field w-full pl-10 pr-4 py-2"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-retro-dark" />
                </div>
                
                {/* View Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`btn-retro p-2 ${viewMode === "grid" ? "bg-retro-highlight" : ""}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`btn-retro p-2 ${viewMode === "list" ? "bg-retro-highlight" : ""}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="input-field px-4 py-2"
                >
                  <option value="newest">{t("shop.sortNewest") || "Newest"}</option>
                  <option value="price_asc">{t("shop.sortPriceLow") || "Price: Low to High"}</option>
                  <option value="price_desc">{t("shop.sortPriceHigh") || "Price: High to Low"}</option>
                  <option value="name">{t("shop.sortName") || "Name A-Z"}</option>
                </select>
                
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn-retro px-4 py-2 flex items-center gap-2 ${showFilters ? "bg-retro-highlight" : ""}`}
                >
                  <Filter className="w-4 h-4" />
                  {t("shop.filters") || "Filters"}
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="btn-retro px-4 py-2 flex items-center gap-2 text-red-600"
                  >
                    <X className="w-4 h-4" />
                    {t("shop.clearFilters") || "Clear"}
                  </button>
                )}
              </div>
              
              {/* Expanded Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t-2 border-retro-darker">
                  {/* Categories */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-retro-black mb-2">
                      {t("shop.categories") || "Categories"}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2
                                       transition-all duration-200 ${
                              selectedCategory === cat.id
                                ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                                : "bg-retro-panel border-2 border-retro-darker text-retro-black hover:bg-retro-highlight"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {t(`nav.${cat.id}`) || cat.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-bold text-retro-black mb-2">
                      {t("shop.priceRange") || "Price Range"}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: t("shop.priceUnder25") || "Under $25", min: 0, max: 25 },
                        { label: "$25 - $50", min: 25, max: 50 },
                        { label: "$50 - $100", min: 50, max: 100 },
                        { label: t("shop.priceOver100") || "Over $100", min: 100, max: 10000 },
                      ].map((range) => (
                        <button
                          key={range.label}
                          onClick={() => 
                            setPriceRange(
                              priceRange?.min === range.min && priceRange?.max === range.max 
                                ? null 
                                : range
                            )
                          }
                          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2
                                     transition-all duration-200 ${
                            priceRange?.min === range.min && priceRange?.max === range.max
                              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                              : "bg-retro-panel border-2 border-retro-darker text-retro-black hover:bg-retro-highlight"
                          }`}
                        >
                          <Tag className="w-4 h-4" />
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 text-retro-dark text-sm">
            {t("shop.showingResults") || "Showing"} <span className="font-bold text-retro-black">{filteredProducts.length}</span> {t("shop.products") || "products"}
            {hasActiveFilters && (
              <span className="ml-2 text-pink-600">
                ({t("shop.filtered") || "filtered"})
              </span>
            )}
          </div>

          {/* Products Grid/List */}
          {loading ? (
            <div className="panel-raised p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-retro-dark" />
              <p className="mt-4 text-retro-dark font-mono">{t("shop.loading") || "Loading inventory..."}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="panel-raised p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-retro-dark opacity-50" />
              <p className="mt-4 text-retro-dark font-mono">{t("shop.noProducts") || "No products found"}</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn-gold mt-4 px-6 py-2"
                >
                  {t("shop.clearFilters") || "Clear filters"}
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <ProductListItem key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { t } = useLanguage();
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.compare_at_price!) * 100)
    : 0;

  return (
    <div className="panel-raised overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="relative aspect-square bg-retro-panel">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-retro-dark opacity-30" />
          </div>
        )}
        
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 
                         text-xs font-bold rounded animate-pulse">
            -{discountPercent}%
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="text-xs text-retro-dark uppercase tracking-wide mb-1">
          {product.category}
        </div>
        <h3 className="font-bold text-retro-black mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-pixel font-bold text-retro-black">
            ${product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-retro-dark line-through">
              ${product.compare_at_price!.toFixed(2)}
            </span>
          )}
        </div>
        
        <button className="btn-gold w-full py-2 text-sm font-bold flex items-center justify-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          {t("shop.addToCart") || "ADD TO CART"}
        </button>
      </div>
    </div>
  );
}

function ProductListItem({ product }: { product: Product }) {
  const { t } = useLanguage();
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.compare_at_price!) * 100)
    : 0;

  return (
    <div className="panel-raised overflow-hidden flex gap-4 p-4 group hover:shadow-lg transition-shadow">
      <div className="relative w-32 h-32 flex-shrink-0 bg-retro-panel rounded">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-retro-dark opacity-30" />
          </div>
        )}
        
        {hasDiscount && (
          <div className="absolute top-1 right-1 bg-red-500 text-white px-1.5 py-0.5 
                         text-xs font-bold rounded animate-pulse">
            -{discountPercent}%
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-xs text-retro-dark uppercase tracking-wide mb-1">
          {product.category}
        </div>
        <h3 className="font-bold text-retro-black mb-2 group-hover:text-pink-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-retro-dark line-clamp-2 mb-3">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-pixel font-bold text-retro-black">
              ${product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-retro-dark line-through">
                ${product.compare_at_price!.toFixed(2)}
              </span>
            )}
          </div>
          
          <button className="btn-gold px-4 py-2 text-sm font-bold flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            {t("shop.addToCart") || "ADD TO CART"}
          </button>
        </div>
      </div>
    </div>
  );
}
