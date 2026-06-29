import { useState, useEffect } from "react";
// Admin products list page
import { useNavigate, Link, useLocation } from "react-router";
import { useAdmin } from "../hooks/useAdmin";
import { Package, Plus, Edit, Trash2, ShieldAlert, Eye, EyeOff, Star, ArrowLeft, AlertTriangle } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  base_price_cents: number;
  category: string;
  images: string | null;
  is_featured: number;
  is_active: number;
  created_at: string;
}

export default function AdminProducts() {
  const { isAdmin, isPending } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  
  // Demo mode for preview testing
  const isDemoMode = location.pathname.includes("/admin/demo");

  useEffect(() => {
    if (!isDemoMode && !isPending && !isAdmin) {
      navigate("/login");
    }
  }, [isPending, isAdmin, navigate, isDemoMode]);

  useEffect(() => {
    if (isAdmin || isDemoMode) {
      loadProducts();
    }
  }, [isAdmin, isDemoMode]);

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Erro ao excluir:", err);
    } finally {
      setDeleting(null);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getFirstImage = (images: string | null) => {
    if (!images) return null;
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
    } catch {
      return null;
    }
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
            GERENCIAR PRODUTOS
          </span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-300 border border-gray-400"></div>
            <div className="w-3 h-3 bg-gray-300 border border-gray-400"></div>
            <Link to="/admin" className="w-3 h-3 bg-red-400 border border-gray-400 hover:bg-red-500"></Link>
          </div>
        </div>

        <div className="p-4">
          {isDemoMode && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-100 px-3 py-2 mb-3 border-2 border-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-bold">MODO DEMONSTRAÇÃO - Apenas visualização</span>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to={isDemoMode ? "/admin/demo" : "/admin"} className="btn-retro inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao painel
            </Link>
            <Link to={isDemoMode ? "/admin/demo/products/new" : "/admin/products/new"} className="btn-gold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Produto
            </Link>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="panel-raised mx-4">
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-3 py-1">
          <span className="text-white text-sm font-bold">
            {products.length} PRODUTO{products.length !== 1 ? "S" : ""} CADASTRADO{products.length !== 1 ? "S" : ""}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-retro-dark/30" />
            <p className="text-retro-dark/70 mb-4">Nenhum produto cadastrado ainda.</p>
            <Link to={isDemoMode ? "/admin/demo/products/new" : "/admin/products/new"} className="btn-gold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Primeiro Produto
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-300">
            {products.map((product) => (
              <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                {/* Image */}
                <div className="w-16 h-16 panel-inset flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {getFirstImage(product.images) ? (
                    <img
                      src={getFirstImage(product.images)!}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-retro-dark/30" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-retro-dark truncate">{product.name}</h3>
                    {product.is_featured ? (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        <Star className="w-3 h-3" /> Destaque
                      </span>
                    ) : null}
                    {!product.is_active ? (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Inativo
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-retro-dark/70">{product.category}</p>
                  <p className="text-sm font-mono font-bold text-retro-dark">
                    {formatPrice(product.base_price_cents)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    to={isDemoMode ? `/admin/demo/products/${product.id}` : `/admin/products/${product.id}`}
                    className="btn-retro p-2"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                    className="btn-retro p-2 text-red-600 disabled:opacity-50"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
