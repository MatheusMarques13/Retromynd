import { useState, useEffect } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router";
import { useAdmin } from "../hooks/useAdmin";
import { ArrowLeft, Plus, Trash2, Save, Package, ShieldAlert, Palette, AlertTriangle } from "lucide-react";

interface Variant {
  id?: number;
  name: string;
  size: string;
  color: string;
  color_hex: string;
  sku: string;
  price_cents: number | null;
  stock_quantity: number;
  is_available: boolean;
}

interface ProductForm {
  name: string;
  description: string;
  base_price_cents: number;
  category: string;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
}

const CATEGORIES = [
  "Gaming",
  "Collectibles",
  "Retro Tech",
  "Board Games",
  "Comics",
  "Decor",
];

const DEFAULT_VARIANT: Variant = {
  name: "",
  size: "",
  color: "",
  color_hex: "#000000",
  sku: "",
  price_cents: null,
  stock_quantity: 0,
  is_available: true,
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isPending } = useAdmin();
  
  // Demo mode for preview testing
  const isDemoMode = location.pathname.includes("/admin/demo");

  const [form, setForm] = useState<ProductForm>({
    name: "",
    description: "",
    base_price_cents: 0,
    category: CATEGORIES[0],
    images: [""],
    is_featured: false,
    is_active: true,
  });

  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isDemoMode && !isPending && !isAdmin) {
      navigate("/login");
    }
  }, [isPending, isAdmin, navigate, isDemoMode]);

  useEffect(() => {
    if (isEditing && (isAdmin || isDemoMode)) {
      loadProduct();
    }
  }, [id, isAdmin, isDemoMode]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`);
      if (!res.ok) throw new Error("Produto não encontrado");
      const data = await res.json();
      
      setForm({
        name: data.product.name || "",
        description: data.product.description || "",
        base_price_cents: data.product.base_price_cents || 0,
        category: data.product.category || CATEGORIES[0],
        images: data.product.images ? JSON.parse(data.product.images) : [""],
        is_featured: Boolean(data.product.is_featured),
        is_active: Boolean(data.product.is_active),
      });
      
      setVariants(data.variants.map((v: Variant) => ({
        ...v,
        is_available: Boolean(v.is_available),
      })));
    } catch (err) {
      setError("Erro ao carregar produto");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        images: form.images.filter(Boolean),
        variants: variants.map(v => ({
          ...v,
          price_cents: v.price_cents || null,
        })),
      };

      const url = isEditing ? `/api/admin/products/${id}` : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar");
      }

      navigate(isDemoMode ? "/admin/demo/products" : "/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { ...DEFAULT_VARIANT }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number | boolean | null) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const addImageField = () => {
    setForm({ ...form, images: [...form.images, ""] });
  };

  const updateImage = (index: number, value: string) => {
    const updated = [...form.images];
    updated[index] = value;
    setForm({ ...form, images: updated });
  };

  const removeImage = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  if (!isDemoMode && (isPending || loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(180 60% 35%)" }}>
        <div className="panel-raised p-8 text-center">
          <div className="animate-pulse text-retro-dark font-mono">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!isDemoMode && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(180 60% 35%)" }}>
        <div className="panel-raised p-8 text-center max-w-md">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-red-600" />
          <h1 className="text-xl font-bold text-retro-dark mb-2">Acesso Negado</h1>
          <Link to="/" className="btn-retro">Voltar para a loja</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: "hsl(180 60% 35%)" }}>
      {/* Header */}
      <div className="panel-raised m-4">
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold tracking-wide flex items-center gap-2">
            <Package className="w-4 h-4" />
            {isEditing ? "EDITAR PRODUTO" : "NOVO PRODUTO"}
          </span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-300 border border-gray-400"></div>
            <div className="w-3 h-3 bg-gray-300 border border-gray-400"></div>
            <Link to={isDemoMode ? "/admin/demo" : "/admin"} className="w-3 h-3 bg-red-400 border border-gray-400 hover:bg-red-500"></Link>
          </div>
        </div>

        <div className="p-4">
          {isDemoMode && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-100 px-3 py-2 mb-3 border-2 border-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-bold">MODO DEMONSTRAÇÃO - Mudanças não serão salvas</span>
            </div>
          )}
          <Link to={isDemoMode ? "/admin/demo/products" : "/admin/products"} className="btn-retro inline-flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar para lista
          </Link>
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-4 panel-inset p-3 bg-red-100 border-red-300">
          <p className="text-red-700 font-mono text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Product Info */}
        <div className="panel-raised mx-4 mb-4">
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-3 py-1">
            <span className="text-white text-sm font-bold">INFORMAÇÕES DO PRODUTO</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-retro-dark font-bold mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="panel-inset w-full px-3 py-2 text-retro-dark"
                  placeholder="Nome do produto"
                />
              </div>
              <div>
                <label className="block text-retro-dark font-bold mb-1">Categoria *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="panel-inset w-full px-3 py-2 text-retro-dark bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-retro-dark font-bold mb-1">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="panel-inset w-full px-3 py-2 text-retro-dark min-h-[100px]"
                placeholder="Descrição do produto"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-retro-dark font-bold mb-1">Preço Base (centavos) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.base_price_cents}
                  onChange={(e) => setForm({ ...form, base_price_cents: parseInt(e.target.value) || 0 })}
                  className="panel-inset w-full px-3 py-2 text-retro-dark"
                  placeholder="9900 = R$ 99,00"
                />
                <p className="text-xs text-retro-dark/70 mt-1">
                  {(form.base_price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="text-retro-dark font-bold">Destaque</span>
                </label>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="text-retro-dark font-bold">Ativo</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="panel-raised mx-4 mb-4">
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-3 py-1 flex items-center justify-between">
            <span className="text-white text-sm font-bold">IMAGENS</span>
            <button type="button" onClick={addImageField} className="text-white text-xs hover:underline">
              + Adicionar
            </button>
          </div>
          <div className="p-4 space-y-2">
            {form.images.map((img, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={img}
                  onChange={(e) => updateImage(index, e.target.value)}
                  className="panel-inset flex-1 px-3 py-2 text-retro-dark"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
                {form.images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="btn-retro px-3 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Variants */}
        <div className="panel-raised mx-4 mb-4">
          <div className="bg-gradient-to-r from-purple-900 to-purple-700 px-3 py-1 flex items-center justify-between">
            <span className="text-white text-sm font-bold flex items-center gap-2">
              <Palette className="w-4 h-4" />
              VARIANTES (Tamanhos, Cores)
            </span>
            <button type="button" onClick={addVariant} className="text-white text-xs hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" />
              Adicionar Variante
            </button>
          </div>
          <div className="p-4">
            {variants.length === 0 ? (
              <p className="text-retro-dark/70 text-center py-4">
                Nenhuma variante. Clique em "Adicionar Variante" para criar tamanhos, cores, etc.
              </p>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={index} className="panel-inset p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-retro-dark">Variante #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-retro-dark/70 mb-1">Nome</label>
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, "name", e.target.value)}
                          className="panel-inset w-full px-2 py-1 text-sm text-retro-dark"
                          placeholder="P Azul"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-retro-dark/70 mb-1">Tamanho</label>
                        <input
                          type="text"
                          value={variant.size}
                          onChange={(e) => updateVariant(index, "size", e.target.value)}
                          className="panel-inset w-full px-2 py-1 text-sm text-retro-dark"
                          placeholder="P, M, G, GG"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-retro-dark/70 mb-1">Cor</label>
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => updateVariant(index, "color", e.target.value)}
                          className="panel-inset w-full px-2 py-1 text-sm text-retro-dark"
                          placeholder="Azul, Vermelho"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-retro-dark/70 mb-1">Cor (hex)</label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={variant.color_hex}
                            onChange={(e) => updateVariant(index, "color_hex", e.target.value)}
                            className="w-8 h-8 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={variant.color_hex}
                            onChange={(e) => updateVariant(index, "color_hex", e.target.value)}
                            className="panel-inset flex-1 px-2 py-1 text-sm text-retro-dark"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-retro-dark/70 mb-1">SKU</label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(index, "sku", e.target.value)}
                          className="panel-inset w-full px-2 py-1 text-sm text-retro-dark"
                          placeholder="PROD-001-P-AZ"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-retro-dark/70 mb-1">Preço (¢)</label>
                        <input
                          type="number"
                          value={variant.price_cents || ""}
                          onChange={(e) => updateVariant(index, "price_cents", e.target.value ? parseInt(e.target.value) : null)}
                          className="panel-inset w-full px-2 py-1 text-sm text-retro-dark"
                          placeholder="Usar base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-retro-dark/70 mb-1">Estoque</label>
                        <input
                          type="number"
                          min="0"
                          value={variant.stock_quantity}
                          onChange={(e) => updateVariant(index, "stock_quantity", parseInt(e.target.value) || 0)}
                          className="panel-inset w-full px-2 py-1 text-sm text-retro-dark"
                        />
                      </div>
                      <div className="flex items-center pt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={variant.is_available}
                            onChange={(e) => updateVariant(index, "is_available", e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-retro-dark">Disponível</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="mx-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-gold w-full py-3 flex items-center justify-center gap-2 text-lg"
          >
            <Save className="w-5 h-5" />
            {saving ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Criar Produto")}
          </button>
        </div>
      </form>
    </div>
  );
}
