import { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { useAdmin } from "../hooks/useAdmin";
import { Package, Plus, Settings, BarChart3, ShieldAlert, AlertTriangle, Truck, Shield, Tv } from "lucide-react";

export default function AdminDashboard() {
  const { isAdmin, isPending, user } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Demo mode for preview testing (when login doesn't work)
  const isDemoMode = location.pathname.includes("/admin/demo");

  useEffect(() => {
    if (!isDemoMode && !isPending && !isAdmin) {
      navigate("/login");
    }
  }, [isPending, isAdmin, navigate, isDemoMode]);

  if (!isDemoMode && isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(180 60% 35%)" }}>
        <div className="panel-raised p-8 text-center">
          <div className="animate-pulse text-retro-dark font-mono">Verificando acesso...</div>
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
          <p className="text-retro-dark/70 mb-4">
            Você não tem permissão para acessar o painel de administração.
          </p>
          <Link to="/" className="btn-retro">
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "hsl(180 60% 35%)" }}>
      {/* Header */}
      <div className="panel-raised m-4">
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold tracking-wide flex items-center gap-2">
            <Settings className="w-4 h-4" />
            PAINEL DE ADMINISTRAÇÃO - RETROMYND
          </span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-300 border border-gray-400"></div>
            <div className="w-3 h-3 bg-gray-300 border border-gray-400"></div>
            <Link to="/" className="w-3 h-3 bg-red-400 border border-gray-400 hover:bg-red-500"></Link>
          </div>
        </div>
        
        <div className="p-4">
          {isDemoMode && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-100 px-3 py-2 mb-3 border-2 border-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-bold">MODO DEMONSTRAÇÃO - Apenas visualização</span>
            </div>
          )}
          <p className="text-retro-dark mb-2">
            Logado como: <strong>{isDemoMode ? "admin@demo.com (Demo)" : user?.email}</strong>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-4 mb-4">
        <div className="panel-raised p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-retro-dark">12</p>
              <p className="text-sm text-retro-dark/70">Produtos</p>
            </div>
          </div>
        </div>
        
        <div className="panel-raised p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-retro-dark">--</p>
              <p className="text-sm text-retro-dark/70">Vendas</p>
            </div>
          </div>
        </div>
        
        <div className="panel-raised p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-retro-dark">--</p>
              <p className="text-sm text-retro-dark/70">Configurações</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mx-4 mb-4">
        <div className="panel-raised">
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-3 py-1">
            <span className="text-white text-sm font-bold">AÇÕES RÁPIDAS</span>
          </div>
          <div className="p-4 flex flex-wrap gap-3">
            <Link to={isDemoMode ? "/admin/demo/products" : "/admin/products"} className="btn-retro flex items-center gap-2">
              <Package className="w-4 h-4" />
              Gerenciar Produtos
            </Link>
            <Link to={isDemoMode ? "/admin/demo/products/new" : "/admin/products/new"} className="btn-gold flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Produto
            </Link>
            <Link to={isDemoMode ? "/admin/demo/suppliers" : "/admin/suppliers"} className="btn-retro flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Fornecedores Dropshipping
            </Link>
            <Link to={isDemoMode ? "/admin/demo/orders" : "/admin/orders"} className="btn-retro flex items-center gap-2">
              <Package className="w-4 h-4" />
              Roteamento de Pedidos
            </Link>
            <Link to={isDemoMode ? "/admin/demo/disputes" : "/admin/disputes"} className="btn-retro flex items-center gap-2 !bg-red-100 hover:!bg-red-200 !text-red-700 !border-red-300">
              <Shield className="w-4 h-4" />
              Disputas de Transações
            </Link>
            <Link to={isDemoMode ? "/retrolab/demo" : "/retrolab"} className="btn-retro flex items-center gap-2 !bg-pink-100 hover:!bg-pink-200 !text-pink-700 !border-pink-300">
              <Tv className="w-4 h-4" />
              RetroLab (Templates)
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Products Preview */}
      <div className="mx-4 mb-4">
        <div className="panel-raised">
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-3 py-1 flex items-center justify-between">
            <span className="text-white text-sm font-bold">PRODUTOS RECENTES</span>
            <Link to={isDemoMode ? "/admin/demo/products" : "/admin/products"} className="text-white text-xs hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="p-4">
            <p className="text-retro-dark/70 text-center py-8">
              Os produtos serão listados aqui após a configuração do banco de dados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
