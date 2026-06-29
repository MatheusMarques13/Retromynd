import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAdmin } from "@/react-app/hooks/useAdmin";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { 
  Package, 
  Plus, 
  Link, 
  Upload, 
  AlertTriangle,
  Check,
  X,
  Loader2,
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  ExternalLink,
  Store,
  Zap
} from "lucide-react";

interface Supplier {
  id: number;
  name: string;
  type: string;
  default_margin_percent: number;
}

interface ImportProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  cost_cents: number;
  images: string[];
  external_url: string;
  external_id: string;
  variants: { name: string; sku: string; stock: number }[];
  selected: boolean;
  margin_percent: number;
  final_price_cents: number;
  specifications?: { key: string; value: string }[];
  seller?: string;
  rating?: number;
  reviewCount?: number;
}

export default function AdminProductImport() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDemoMode = location.pathname.includes("/admin/demo");
  const { isAdmin, isPending: adminLoading } = useAdmin();
  useLanguage(); // For language context

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [importMode, setImportMode] = useState<"manual" | "url" | "bulk">("manual");
  const [urlInput, setUrlInput] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ImportProduct[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  // Manual product form
  const [manualProduct, setManualProduct] = useState({
    name: "",
    description: "",
    category: "",
    cost_cents: 0,
    images: [""],
    external_url: "",
    external_id: "",
    margin_percent: 30
  });

  // Demo suppliers
  const DEMO_SUPPLIERS: Supplier[] = [
    { id: 1, name: "AliExpress Global", type: "aliexpress", default_margin_percent: 40 },
    { id: 2, name: "CJ Dropshipping", type: "cj_dropshipping", default_margin_percent: 35 },
    { id: 3, name: "Printful Brasil", type: "printful", default_margin_percent: 25 }
  ];

  useEffect(() => {
    if (isDemoMode) {
      setSuppliers(DEMO_SUPPLIERS);
      setSelectedSupplier(1);
    } else {
      fetchSuppliers();
    }
  }, [isDemoMode]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/admin/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
        if (data.length > 0) {
          setSelectedSupplier(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch suppliers", err);
    }
  };

  const currentSupplier = suppliers.find(s => s.id === selectedSupplier);

  const calculateFinalPrice = (costCents: number, marginPercent: number) => {
    return Math.round(costCents * (1 + marginPercent / 100));
  };

  const generateDescription = async () => {
    if (!manualProduct.name) {
      setError("Adicione um nome primeiro");
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualProduct.name,
          category: manualProduct.category,
          listingType: "item"
        })
      });
      if (res.ok) {
        const { description } = await res.json();
        setManualProduct(prev => ({ ...prev, description }));
      }
    } catch (err) {
      console.error("AI generation failed", err);
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleManualAdd = () => {
    if (!manualProduct.name || !manualProduct.cost_cents) {
      setError("Nome e custo são obrigatórios");
      return;
    }

    const newProduct: ImportProduct = {
      id: `manual-${Date.now()}`,
      name: manualProduct.name,
      description: manualProduct.description,
      category: manualProduct.category,
      cost_cents: manualProduct.cost_cents,
      images: manualProduct.images.filter(img => img.trim() !== ""),
      external_url: manualProduct.external_url,
      external_id: manualProduct.external_id || `MAN-${Date.now()}`,
      variants: [],
      selected: true,
      margin_percent: manualProduct.margin_percent,
      final_price_cents: calculateFinalPrice(manualProduct.cost_cents, manualProduct.margin_percent)
    };

    setProducts(prev => [...prev, newProduct]);
    setManualProduct({
      name: "",
      description: "",
      category: "",
      cost_cents: 0,
      images: [""],
      external_url: "",
      external_id: "",
      margin_percent: currentSupplier?.default_margin_percent || 30
    });
    setError("");
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      setError("Cole uma URL de produto");
      return;
    }

    setIsLoading(true);
    setError("");

    if (isDemoMode) {
      // Simulate import for demo
      setTimeout(() => {
        const demoProduct: ImportProduct = {
          id: `url-${Date.now()}`,
          name: "Teclado Mecânico RGB Gaming",
          description: "Teclado mecânico com switches blue, iluminação RGB personalizável, layout ABNT2.",
          category: "Gaming",
          cost_cents: 8500,
          images: ["https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400"],
          external_url: urlInput,
          external_id: `EXT-${Date.now()}`,
          variants: [
            { name: "Switch Blue", sku: "KB-BLUE-001", stock: 50 },
            { name: "Switch Red", sku: "KB-RED-001", stock: 30 }
          ],
          selected: true,
          margin_percent: currentSupplier?.default_margin_percent || 30,
          final_price_cents: calculateFinalPrice(8500, currentSupplier?.default_margin_percent || 30)
        };
        setProducts(prev => [...prev, demoProduct]);
        setUrlInput("");
        setIsLoading(false);
      }, 1500);
    } else {
      try {
        const res = await fetch("/api/ai/extract-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlInput, supplierId: selectedSupplier })
        });
        if (res.ok) {
          const product = await res.json();
          const margin = currentSupplier?.default_margin_percent || 30;
          setProducts(prev => [...prev, {
            ...product,
            id: `url-${Date.now()}`,
            selected: true,
            margin_percent: margin,
            final_price_cents: calculateFinalPrice(product.cost_cents, margin)
          }]);
          setUrlInput("");
        } else {
          setError("Falha ao extrair produto da URL");
        }
      } catch (err) {
        setError("Erro ao importar produto");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBulkImport = async () => {
    const urls = bulkUrls.split("\n").filter(u => u.trim());
    if (urls.length === 0) {
      setError("Cole pelo menos uma URL");
      return;
    }

    setIsLoading(true);
    setError("");

    if (isDemoMode) {
      setTimeout(() => {
        const demoProducts: ImportProduct[] = urls.map((url, i) => ({
          id: `bulk-${Date.now()}-${i}`,
          name: `Produto Importado ${i + 1}`,
          description: "Descrição do produto importado em massa.",
          category: "Geral",
          cost_cents: 5000 + (i * 1000),
          images: ["https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400"],
          external_url: url,
          external_id: `BULK-${Date.now()}-${i}`,
          variants: [],
          selected: true,
          margin_percent: currentSupplier?.default_margin_percent || 30,
          final_price_cents: calculateFinalPrice(5000 + (i * 1000), currentSupplier?.default_margin_percent || 30)
        }));
        setProducts(prev => [...prev, ...demoProducts]);
        setBulkUrls("");
        setIsLoading(false);
      }, 2000);
    } else {
      // Real implementation would call API for each URL
      setIsLoading(false);
      setError("Importação em massa requer integração com fornecedor");
    }
  };

  const toggleProductSelection = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, selected: !p.selected } : p
    ));
  };

  const updateProductMargin = (productId: string, margin: number) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { 
        ...p, 
        margin_percent: margin,
        final_price_cents: calculateFinalPrice(p.cost_cents, margin)
      } : p
    ));
  };

  const removeProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const nextImage = (productId: string, totalImages: number) => {
    setImageIndexes(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (productId: string, totalImages: number) => {
    setImageIndexes(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const setImageIndex = (productId: string, index: number) => {
    setImageIndexes(prev => ({ ...prev, [productId]: index }));
  };

  const handleImportSelected = async () => {
    const selectedProducts = products.filter(p => p.selected);
    if (selectedProducts.length === 0) {
      setError("Selecione pelo menos um produto");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    if (isDemoMode) {
      setTimeout(() => {
        setSuccess(`${selectedProducts.length} produtos importados com sucesso!`);
        setProducts([]);
        setIsLoading(false);
      }, 1500);
    } else {
      try {
        for (const product of selectedProducts) {
          await fetch("/api/admin/dropship/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              supplier_id: selectedSupplier,
              external_id: product.external_id,
              name: product.name,
              description: product.description,
              category: product.category,
              cost_cents: product.cost_cents,
              margin_percent: product.margin_percent,
              images: product.images,
              variants: product.variants,
              external_url: product.external_url
            })
          });
        }
        setSuccess(`${selectedProducts.length} produtos importados com sucesso!`);
        setProducts([]);
      } catch (err) {
        setError("Erro ao salvar produtos");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  };

  if (!isDemoMode && adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 100% 55%)" }}>
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!isDemoMode && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "hsl(210 100% 55%)" }}>
        <div className="panel-raised p-6 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-retro-gold" />
          <h1 className="text-xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-retro-dark/70">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: "hsl(210 100% 55%)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Demo Warning */}
        {isDemoMode && (
          <div className="panel-raised p-3 bg-yellow-100 border-yellow-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">Modo Demo - alterações não serão salvas</span>
          </div>
        )}

        {/* Header */}
        <div className="panel-raised">
          <div className="bg-retro-purple text-white px-3 py-1.5 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span className="font-bold text-sm">Importar Produtos</span>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => navigate(isDemoMode ? "/admin/demo/suppliers" : "/admin/suppliers")}
                className="btn-retro flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              {/* Supplier Selection */}
              <div className="flex items-center gap-3">
                <label className="font-medium text-sm">Fornecedor:</label>
                <select
                  value={selectedSupplier || ""}
                  onChange={(e) => setSelectedSupplier(Number(e.target.value))}
                  className="panel-inset px-3 py-1.5 text-sm min-w-[180px]"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Import Mode Tabs */}
        <div className="panel-raised">
          <div className="flex border-b-2 border-retro-dark/20">
            <button
              onClick={() => setImportMode("manual")}
              className={`flex-1 px-4 py-3 font-medium text-sm flex items-center justify-center gap-2 ${
                importMode === "manual" ? "bg-retro-light border-b-2 border-retro-purple" : "hover:bg-retro-light/50"
              }`}
            >
              <Plus className="w-4 h-4" />
              Manual
            </button>
            <button
              onClick={() => setImportMode("url")}
              className={`flex-1 px-4 py-3 font-medium text-sm flex items-center justify-center gap-2 ${
                importMode === "url" ? "bg-retro-light border-b-2 border-retro-purple" : "hover:bg-retro-light/50"
              }`}
            >
              <Link className="w-4 h-4" />
              Por URL
            </button>
            <button
              onClick={() => setImportMode("bulk")}
              className={`flex-1 px-4 py-3 font-medium text-sm flex items-center justify-center gap-2 ${
                importMode === "bulk" ? "bg-retro-light border-b-2 border-retro-purple" : "hover:bg-retro-light/50"
              }`}
            >
              <Upload className="w-4 h-4" />
              Em Massa
            </button>
          </div>

          <div className="p-4">
            {/* Manual Import */}
            {importMode === "manual" && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome do Produto *</label>
                    <input
                      type="text"
                      value={manualProduct.name}
                      onChange={(e) => setManualProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="panel-inset w-full px-3 py-2"
                      placeholder="Ex: Teclado Mecânico RGB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoria</label>
                    <input
                      type="text"
                      value={manualProduct.category}
                      onChange={(e) => setManualProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="panel-inset w-full px-3 py-2"
                      placeholder="Ex: Gaming"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Descrição</label>
                    <button
                      onClick={generateDescription}
                      disabled={isGeneratingDesc || !manualProduct.name}
                      className="btn-retro text-xs flex items-center gap-1 px-2 py-1"
                    >
                      {isGeneratingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Gerar com IA
                    </button>
                  </div>
                  <textarea
                    value={manualProduct.description}
                    onChange={(e) => setManualProduct(prev => ({ ...prev, description: e.target.value }))}
                    className="panel-inset w-full px-3 py-2 h-24 resize-none"
                    placeholder="Descrição detalhada do produto..."
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Custo (R$) *</label>
                    <input
                      type="number"
                      value={(manualProduct.cost_cents / 100).toFixed(2)}
                      onChange={(e) => setManualProduct(prev => ({ ...prev, cost_cents: Math.round(parseFloat(e.target.value || "0") * 100) }))}
                      className="panel-inset w-full px-3 py-2"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Margem (%)</label>
                    <input
                      type="number"
                      value={manualProduct.margin_percent}
                      onChange={(e) => setManualProduct(prev => ({ ...prev, margin_percent: parseInt(e.target.value) || 0 }))}
                      className="panel-inset w-full px-3 py-2"
                      min="0"
                      max="500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preço Final</label>
                    <div className="panel-inset w-full px-3 py-2 bg-green-100 font-bold text-green-800">
                      {formatPrice(calculateFinalPrice(manualProduct.cost_cents, manualProduct.margin_percent))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">URLs de Imagem</label>
                  {manualProduct.images.map((img, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={img}
                        onChange={(e) => {
                          const newImages = [...manualProduct.images];
                          newImages[i] = e.target.value;
                          setManualProduct(prev => ({ ...prev, images: newImages }));
                        }}
                        className="panel-inset flex-1 px-3 py-2"
                        placeholder="https://..."
                      />
                      {i === manualProduct.images.length - 1 ? (
                        <button
                          onClick={() => setManualProduct(prev => ({ ...prev, images: [...prev.images, ""] }))}
                          className="btn-retro px-3"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const newImages = manualProduct.images.filter((_, idx) => idx !== i);
                            setManualProduct(prev => ({ ...prev, images: newImages }));
                          }}
                          className="btn-retro px-3 text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">URL Original (opcional)</label>
                    <input
                      type="url"
                      value={manualProduct.external_url}
                      onChange={(e) => setManualProduct(prev => ({ ...prev, external_url: e.target.value }))}
                      className="panel-inset w-full px-3 py-2"
                      placeholder="https://fornecedor.com/produto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ID Externo (opcional)</label>
                    <input
                      type="text"
                      value={manualProduct.external_id}
                      onChange={(e) => setManualProduct(prev => ({ ...prev, external_id: e.target.value }))}
                      className="panel-inset w-full px-3 py-2"
                      placeholder="SKU-123"
                    />
                  </div>
                </div>

                <button onClick={handleManualAdd} className="btn-gold w-full flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar à Lista
                </button>
              </div>
            )}

            {/* URL Import */}
            {importMode === "url" && (
              <div className="space-y-4">
                <div className="p-3 bg-gradient-to-r from-retro-purple/10 to-retro-teal/10 rounded-lg border border-retro-purple/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-retro-purple/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-retro-purple" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Importação Inteligente com IA</h4>
                      <p className="text-xs text-retro-dark/70 mt-0.5">
                        Cole a URL de um produto e nosso sistema extrairá automaticamente: nome, descrição, 
                        todas as imagens do carrossel, variantes, preço (convertido para BRL), especificações e avaliações.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL do Produto</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="panel-inset flex-1 px-3 py-2"
                      placeholder="https://aliexpress.com/item/... ou https://cjdropshipping.com/..."
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleUrlImport}
                      disabled={isLoading || !urlInput.trim()}
                      className="btn-gold px-6 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Extraindo...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Extrair
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isLoading && (
                  <div className="panel-inset p-4 bg-retro-light/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-retro-purple border-t-transparent animate-spin" />
                      <div>
                        <p className="font-medium text-sm">Analisando página do produto...</p>
                        <p className="text-xs text-retro-dark/60">Extraindo imagens, preços, variantes e especificações</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-retro-dark/60">
                  <strong>Sites suportados:</strong> AliExpress, CJ Dropshipping, Shopee, Amazon, e outros marketplaces
                </div>
              </div>
            )}

            {/* Bulk Import */}
            {importMode === "bulk" && (
              <div className="space-y-4">
                <p className="text-sm text-retro-dark/70">
                  Cole múltiplas URLs de produtos (uma por linha) para importação em massa.
                </p>
                <textarea
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                  className="panel-inset w-full px-3 py-2 h-40 resize-none font-mono text-sm"
                  placeholder="https://aliexpress.com/item/1234567.html&#10;https://aliexpress.com/item/7654321.html&#10;https://aliexpress.com/item/9876543.html"
                />
                <button
                  onClick={handleBulkImport}
                  disabled={isLoading}
                  className="btn-gold w-full flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Importar Todos ({bulkUrls.split("\n").filter(u => u.trim()).length} URLs)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="panel-raised p-3 bg-red-100 border-red-400 flex items-center gap-2">
            <X className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="panel-raised p-3 bg-green-100 border-green-400 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {/* Products Queue */}
        {products.length > 0 && (
          <div className="panel-raised">
            <div className="bg-retro-teal text-white px-3 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="font-bold text-sm">Produtos para Importar ({products.length})</span>
              </div>
              <span className="text-xs">
                {products.filter(p => p.selected).length} selecionados
              </span>
            </div>
            <div className="divide-y divide-retro-dark/20">
              {products.map((product) => {
                const currentImageIndex = imageIndexes[product.id] || 0;
                const isExpanded = expandedProduct === product.id;
                
                return (
                <div key={product.id} className={`p-4 ${!product.selected ? "opacity-50" : ""}`}>
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <button
                        onClick={() => toggleProductSelection(product.id)}
                        className={`w-6 h-6 border-2 rounded flex items-center justify-center ${
                          product.selected ? "bg-green-500 border-green-600 text-white" : "border-retro-dark/40"
                        }`}
                      >
                        {product.selected && <Check className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Image Carousel */}
                    <div className="w-32 flex-shrink-0">
                      <div className="relative w-32 h-32 panel-inset overflow-hidden group">
                        {product.images.length > 0 ? (
                          <>
                            <img 
                              src={product.images[currentImageIndex]} 
                              alt={product.name} 
                              className="w-full h-full object-cover transition-opacity"
                            />
                            {product.images.length > 1 && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); prevImage(product.id, product.images.length); }}
                                  className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); nextImage(product.id, product.images.length); }}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
                                  {currentImageIndex + 1}/{product.images.length}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-retro-light/50">
                            <ImageIcon className="w-8 h-8 text-retro-dark/30" />
                          </div>
                        )}
                      </div>
                      {/* Image Thumbnails */}
                      {product.images.length > 1 && (
                        <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                          {product.images.slice(0, 5).map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setImageIndex(product.id, idx)}
                              className={`w-6 h-6 flex-shrink-0 rounded overflow-hidden border-2 transition-colors ${
                                currentImageIndex === idx ? "border-retro-purple" : "border-transparent hover:border-retro-purple/50"
                              }`}
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                          {product.images.length > 5 && (
                            <span className="text-xs text-retro-dark/60 self-center ml-1">+{product.images.length - 5}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="font-bold line-clamp-2 flex-1">{product.name}</h3>
                        {product.external_url && (
                          <a 
                            href={product.external_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-retro-purple hover:text-retro-purple/70 flex-shrink-0"
                            title="Ver original"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-retro-dark/70 line-clamp-2 mt-1">{product.description}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {product.category && (
                          <span className="px-2 py-0.5 bg-retro-purple/20 text-retro-purple text-xs rounded">
                            {product.category}
                          </span>
                        )}
                        {product.variants.length > 0 && (
                          <span className="px-2 py-0.5 bg-retro-teal/20 text-retro-teal text-xs rounded">
                            {product.variants.length} variantes
                          </span>
                        )}
                        {product.images.length > 1 && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {product.images.length} fotos
                          </span>
                        )}
                        {product.seller && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {product.seller}
                          </span>
                        )}
                        {product.rating && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            {product.rating.toFixed(1)}
                            {product.reviewCount && <span className="opacity-70">({product.reviewCount})</span>}
                          </span>
                        )}
                      </div>

                      {/* Expandable Details */}
                      {(product.specifications && product.specifications.length > 0) && (
                        <button
                          onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                          className="text-xs text-retro-purple hover:underline mt-2 flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          {isExpanded ? "Ocultar especificações" : `Ver ${product.specifications.length} especificações`}
                        </button>
                      )}
                      
                      {isExpanded && product.specifications && (
                        <div className="mt-2 p-2 bg-retro-light/50 rounded text-xs grid grid-cols-2 gap-x-4 gap-y-1 max-h-32 overflow-y-auto">
                          {product.specifications.map((spec, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-retro-dark/60 truncate">{spec.key}:</span>
                              <span className="font-medium truncate">{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="w-48 flex-shrink-0 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Custo:</span>
                        <span className="font-mono">{formatPrice(product.cost_cents)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Margem:</label>
                        <input
                          type="number"
                          value={product.margin_percent}
                          onChange={(e) => updateProductMargin(product.id, parseInt(e.target.value) || 0)}
                          className="panel-inset w-16 px-2 py-1 text-sm text-center"
                          min="0"
                          max="500"
                        />
                        <span className="text-sm">%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-bold text-green-700">
                        <span>Venda:</span>
                        <span className="font-mono">{formatPrice(product.final_price_cents)}</span>
                      </div>
                      <div className="text-xs text-retro-dark/60 text-right">
                        Lucro: {formatPrice(product.final_price_cents - product.cost_cents)}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded self-start"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )})}
            </div>

            {/* Import Button */}
            <div className="p-4 bg-retro-light/50 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Lucro estimado por unidade: </span>
                <span className="text-green-700 font-bold">
                  {formatPrice(
                    products
                      .filter(p => p.selected)
                      .reduce((sum, p) => sum + (p.final_price_cents - p.cost_cents), 0) / 
                    Math.max(products.filter(p => p.selected).length, 1)
                  )}
                </span>
              </div>
              <button
                onClick={handleImportSelected}
                disabled={isLoading || products.filter(p => p.selected).length === 0}
                className="btn-gold px-8 flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Importar {products.filter(p => p.selected).length} Produtos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
