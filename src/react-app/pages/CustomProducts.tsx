import { useState, useEffect } from "react";
import {
  Palette, Sparkles, Loader2, ChevronRight, ChevronLeft,
  Shirt, Package, Image as ImageIcon, Check, Truck, Info,
  Star, Zap, Heart, ArrowRight, Upload
} from "lucide-react";
import { Header } from "@/react-app/components/Header";
import { Footer } from "@/react-app/components/Footer";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { useAuth } from "@/react-app/auth";

interface Blueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}

interface PrintProvider {
  id: number;
  title: string;
  location: {
    address1: string;
    city: string;
    country: string;
  };
}

interface Variant {
  id: number;
  title: string;
  options: {
    color?: string;
    size?: string;
  };
  placeholders: {
    position: string;
    width: number;
    height: number;
  }[];
}

interface SelectedProduct {
  blueprint: Blueprint;
  provider: PrintProvider | null;
  variants: Variant[];
  selectedVariant: Variant | null;
}

const POPULAR_CATEGORIES = [
  { id: 6, name: "T-Shirts", icon: Shirt, color: "from-pink-500 to-rose-500" },
  { id: 47, name: "Hoodies", icon: Package, color: "from-purple-500 to-indigo-500" },
  { id: 9, name: "Mugs", icon: Package, color: "from-amber-500 to-orange-500" },
  { id: 71, name: "Posters", icon: ImageIcon, color: "from-cyan-500 to-blue-500" },
  { id: 580, name: "Stickers", icon: Star, color: "from-green-500 to-emerald-500" },
  { id: 304, name: "Phone Cases", icon: Zap, color: "from-violet-500 to-purple-500" },
];

export default function CustomProductsPage() {
  const { t } = useLanguage();
  const { } = useAuth();
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [designUrl, setDesignUrl] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, _setCreatingProduct] = useState(false);
  const [step, setStep] = useState<"browse" | "customize" | "preview">("browse");

  useEffect(() => {
    fetchBlueprints();
  }, [page]);

  const fetchBlueprints = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/printify/blueprints?page=${page}&limit=20`);
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setBlueprints(Array.isArray(data) ? data : data.data || []);
      // Estimate total pages (Printify doesn't return total)
      if (Array.isArray(data) && data.length === 20) {
        setTotalPages(Math.max(totalPages, page + 1));
      }
    } catch (err) {
      setError("Failed to load products catalog");
    } finally {
      setLoading(false);
    }
  };

  const selectBlueprint = async (blueprint: Blueprint) => {
    setLoadingDetails(true);
    setSelectedProduct({
      blueprint,
      provider: null,
      variants: [],
      selectedVariant: null,
    });
    setStep("customize");

    try {
      // Fetch print providers
      const providersRes = await fetch(`/api/printify/blueprints/${blueprint.id}/providers`);
      const providers = await providersRes.json();

      if (Array.isArray(providers) && providers.length > 0) {
        const provider = providers[0]; // Use first provider

        // Fetch variants for this provider
        const variantsRes = await fetch(
          `/api/printify/blueprints/${blueprint.id}/providers/${provider.id}/variants`
        );
        const variantsData = await variantsRes.json();

        setSelectedProduct({
          blueprint,
          provider,
          variants: variantsData.variants || [],
          selectedVariant: variantsData.variants?.[0] || null,
        });
      }
    } catch (err) {
      console.error("Failed to load product details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.url) {
        setUploadedImageUrl(uploadData.url);
        setDesignUrl(uploadData.url);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const goBack = () => {
    if (step === "preview") {
      setStep("customize");
    } else if (step === "customize") {
      setStep("browse");
      setSelectedProduct(null);
      setDesignUrl("");
      setUploadedImageUrl(null);
    }
  };

  // Group variants by color
  const groupedVariants = selectedProduct?.variants.reduce((acc, v) => {
    const color = v.options?.color || "Default";
    if (!acc[color]) acc[color] = [];
    acc[color].push(v);
    return acc;
  }, {} as Record<string, Variant[]>) || {};

  const uniqueColors = Object.keys(groupedVariants);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const sizesForColor = selectedColor ? groupedVariants[selectedColor] || [] : [];

  useEffect(() => {
    if (uniqueColors.length > 0 && !selectedColor) {
      setSelectedColor(uniqueColors[0]);
    }
  }, [uniqueColors, selectedColor]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950/30 to-slate-900">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-4">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-pink-300">{t("customProducts.badge") || "Print on Demand"}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">
              {t("customProducts.title") || "Custom Products"}
            </span>
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            {t("customProducts.subtitle") || "Create unique products with your own designs. T-shirts, hoodies, mugs, posters, and more - printed and shipped worldwide."}
          </p>

          {/* Quick categories */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {POPULAR_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    // Find blueprint by ID and select it
                    const bp = blueprints.find((b) => b.id === cat.id);
                    if (bp) selectBlueprint(bp);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${cat.color} text-white font-medium shadow-lg hover:scale-105 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-20">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {["browse", "customize", "preview"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === s
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                    : i < ["browse", "customize", "preview"].indexOf(step)
                    ? "bg-green-500 text-white"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {i < ["browse", "customize", "preview"].indexOf(step) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  step === s ? "text-white" : "text-slate-400"
                }`}
              >
                {s === "browse" && (t("customProducts.step1") || "Choose Product")}
                {s === "customize" && (t("customProducts.step2") || "Customize")}
                {s === "preview" && (t("customProducts.step3") || "Preview")}
              </span>
              {i < 2 && <ArrowRight className="w-4 h-4 text-slate-600 mx-2" />}
            </div>
          ))}
        </div>

        {/* Back button */}
        {step !== "browse" && (
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            {t("common.back") || "Back"}
          </button>
        )}

        {/* Browse Step */}
        {step === "browse" && (
          <>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 text-red-300">
                {error}
                <button
                  onClick={fetchBlueprints}
                  className="ml-4 text-sm underline hover:no-underline"
                >
                  {t("common.retry") || "Retry"}
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {blueprints.map((blueprint) => (
                    <button
                      key={blueprint.id}
                      onClick={() => selectBlueprint(blueprint)}
                      className="group bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-pink-500/50 transition-all hover:scale-[1.02] text-left"
                    >
                      <div className="aspect-square relative overflow-hidden bg-slate-900/50">
                        {blueprint.images?.[0] ? (
                          <img
                            src={blueprint.images[0]}
                            alt={blueprint.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-slate-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-white group-hover:text-pink-400 transition-colors line-clamp-2">
                          {blueprint.title}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">{blueprint.brand}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t("common.previous") || "Previous"}
                  </button>
                  <span className="text-slate-400">
                    {t("common.page") || "Page"} {page}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    {t("common.next") || "Next"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Customize Step */}
        {step === "customize" && selectedProduct && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Preview */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <div className="aspect-square relative overflow-hidden rounded-xl bg-slate-900/50 mb-4">
                {selectedProduct.blueprint.images?.[0] ? (
                  <img
                    src={selectedProduct.blueprint.images[0]}
                    alt={selectedProduct.blueprint.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-20 h-20 text-slate-600" />
                  </div>
                )}

                {/* Design overlay preview */}
                {(uploadedImageUrl || designUrl) && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img
                      src={uploadedImageUrl || designUrl}
                      alt="Your design"
                      className="w-1/2 h-1/2 object-contain opacity-80"
                    />
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-white mb-2">
                {selectedProduct.blueprint.title}
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                {selectedProduct.blueprint.description || selectedProduct.blueprint.brand}
              </p>

              {selectedProduct.provider && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Truck className="w-4 h-4" />
                  <span>
                    {t("customProducts.printedBy") || "Printed by"}: {selectedProduct.provider.title}
                  </span>
                </div>
              )}
            </div>

            {/* Customization Options */}
            <div className="space-y-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
                </div>
              ) : (
                <>
                  {/* Upload Design */}
                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-pink-400" />
                      {t("customProducts.uploadDesign") || "Upload Your Design"}
                    </h3>

                    <div className="space-y-4">
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        <div className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-slate-600 rounded-xl hover:border-pink-500 transition-colors cursor-pointer">
                          {uploading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-slate-400" />
                              <span className="text-slate-300">
                                {t("customProducts.clickToUpload") || "Click to upload image"}
                              </span>
                            </>
                          )}
                        </div>
                      </label>

                      <div className="text-center text-slate-400 text-sm">
                        {t("customProducts.or") || "or"}
                      </div>

                      <input
                        type="url"
                        value={designUrl}
                        onChange={(e) => setDesignUrl(e.target.value)}
                        placeholder={t("customProducts.pasteUrl") || "Paste image URL..."}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Color Selection */}
                  {uniqueColors.length > 0 && (
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        {t("customProducts.selectColor") || "Select Color"}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {uniqueColors.slice(0, 12).map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              setSelectedColor(color);
                              setSelectedProduct((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      selectedVariant: groupedVariants[color]?.[0] || null,
                                    }
                                  : null
                              );
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedColor === color
                                ? "bg-pink-500 text-white"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Selection */}
                  {sizesForColor.length > 0 && (
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        {t("customProducts.selectSize") || "Select Size"}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {sizesForColor.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() =>
                              setSelectedProduct((prev) =>
                                prev ? { ...prev, selectedVariant: variant } : null
                              )
                            }
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedProduct?.selectedVariant?.id === variant.id
                                ? "bg-pink-500 text-white"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                          >
                            {variant.options?.size || variant.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Button */}
                  <button
                    onClick={() => setStep("preview")}
                    disabled={!designUrl || !selectedProduct?.selectedVariant}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {t("customProducts.previewProduct") || "Preview Product"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && selectedProduct && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
              <div className="aspect-square relative overflow-hidden rounded-xl bg-slate-900/50 mb-6">
                {selectedProduct.blueprint.images?.[0] && (
                  <img
                    src={selectedProduct.blueprint.images[0]}
                    alt={selectedProduct.blueprint.title}
                    className="w-full h-full object-contain"
                  />
                )}
                {(uploadedImageUrl || designUrl) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={uploadedImageUrl || designUrl}
                      alt="Your design"
                      className="w-1/2 h-1/2 object-contain opacity-90"
                    />
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedProduct.blueprint.title}
              </h2>

              <div className="space-y-2 text-slate-300 mb-6">
                <p>
                  <span className="text-slate-400">{t("customProducts.color") || "Color"}:</span>{" "}
                  {selectedColor}
                </p>
                <p>
                  <span className="text-slate-400">{t("customProducts.size") || "Size"}:</span>{" "}
                  {selectedProduct.selectedVariant?.options?.size ||
                    selectedProduct.selectedVariant?.title}
                </p>
              </div>

              <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200">
                    {t("customProducts.comingSoon") ||
                      "Custom product ordering is coming soon! For now, contact us with your design and we'll create it for you."}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={goBack}
                  className="flex-1 py-3 px-6 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  {t("customProducts.editDesign") || "Edit Design"}
                </button>
                <button
                  onClick={() => {
                    // Future: Implement order creation
                    alert(t("customProducts.contactUs") || "Contact us to order!");
                  }}
                  className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  {t("customProducts.requestQuote") || "Request Quote"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
