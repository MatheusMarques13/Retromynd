import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/react-app/auth";
import { useAdmin } from "../hooks/useAdmin";
import { 
  Package, 
  ArrowLeft, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save
} from "lucide-react";

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  supplier_id: number;
  quantity: number;
  unit_price_cents: number;
  unit_cost_cents: number;
  variant_info: string | null;
  supplier_status: string;
  supplier_order_id: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  product_name: string;
  images: string;
  supplier_name: string;
  external_id: string | null;
  external_url: string | null;
  order_status: string;
  user_id: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
}

interface SupplierGroup {
  id: number;
  name: string;
  type: string;
  items: OrderItem[];
  pendingCount: number;
  processingCount: number;
  shippedCount: number;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente", color: "bg-yellow-500" },
  { value: "processing", label: "Processando", color: "bg-blue-500" },
  { value: "shipped", label: "Enviado", color: "bg-purple-500" },
  { value: "delivered", label: "Entregue", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelado", color: "bg-red-500" },
];

const DEMO_SUPPLIER_ORDERS: SupplierGroup[] = [
  {
    id: 1,
    name: "AliExpress Global",
    type: "aliexpress",
    pendingCount: 3,
    processingCount: 2,
    shippedCount: 1,
    items: [
      { id: 1, order_id: 101, product_id: 1, supplier_id: 1, quantity: 2, unit_price_cents: 4999, unit_cost_cents: 2500, variant_info: null, supplier_status: "pending", supplier_order_id: null, tracking_number: null, tracking_url: null, product_name: "RGB Gaming Keyboard", images: "[]", supplier_name: "AliExpress Global", external_id: "ALI123", external_url: "https://aliexpress.com/item/123", order_status: "pending", user_id: "user1", shipping_name: "João Silva", shipping_address: "Rua das Flores, 123", shipping_city: "São Paulo", shipping_state: "SP", shipping_zip: "01234-567", shipping_country: "BR" },
      { id: 2, order_id: 101, product_id: 2, supplier_id: 1, quantity: 1, unit_price_cents: 8999, unit_cost_cents: 4500, variant_info: null, supplier_status: "pending", supplier_order_id: null, tracking_number: null, tracking_url: null, product_name: "Retro Gaming Console", images: "[]", supplier_name: "AliExpress Global", external_id: "ALI456", external_url: "https://aliexpress.com/item/456", order_status: "pending", user_id: "user1", shipping_name: "João Silva", shipping_address: "Rua das Flores, 123", shipping_city: "São Paulo", shipping_state: "SP", shipping_zip: "01234-567", shipping_country: "BR" },
      { id: 3, order_id: 102, product_id: 3, supplier_id: 1, quantity: 3, unit_price_cents: 1999, unit_cost_cents: 800, variant_info: null, supplier_status: "processing", supplier_order_id: "ALI-2024-001", tracking_number: null, tracking_url: null, product_name: "Pixel Art Lamp", images: "[]", supplier_name: "AliExpress Global", external_id: "ALI789", external_url: "https://aliexpress.com/item/789", order_status: "processing", user_id: "user2", shipping_name: "Maria Santos", shipping_address: "Av. Brasil, 456", shipping_city: "Rio de Janeiro", shipping_state: "RJ", shipping_zip: "20000-000", shipping_country: "BR" },
      { id: 4, order_id: 103, product_id: 1, supplier_id: 1, quantity: 1, unit_price_cents: 4999, unit_cost_cents: 2500, variant_info: null, supplier_status: "shipped", supplier_order_id: "ALI-2024-002", tracking_number: "YT123456789CN", tracking_url: "https://track.com/YT123456789CN", product_name: "RGB Gaming Keyboard", images: "[]", supplier_name: "AliExpress Global", external_id: "ALI123", external_url: "https://aliexpress.com/item/123", order_status: "shipped", user_id: "user3", shipping_name: "Pedro Costa", shipping_address: "Rua Verde, 789", shipping_city: "Curitiba", shipping_state: "PR", shipping_zip: "80000-000", shipping_country: "BR" },
    ]
  },
  {
    id: 2,
    name: "CJ Dropshipping BR",
    type: "cj_dropshipping",
    pendingCount: 1,
    processingCount: 1,
    shippedCount: 0,
    items: [
      { id: 5, order_id: 104, product_id: 4, supplier_id: 2, quantity: 1, unit_price_cents: 15999, unit_cost_cents: 9000, variant_info: null, supplier_status: "pending", supplier_order_id: null, tracking_number: null, tracking_url: null, product_name: "Coleção de Quadrinhos Vintage", images: "[]", supplier_name: "CJ Dropshipping BR", external_id: "CJ001", external_url: "https://cjdropshipping.com/p/001", order_status: "pending", user_id: "user4", shipping_name: "Ana Lima", shipping_address: "Rua Azul, 321", shipping_city: "Belo Horizonte", shipping_state: "MG", shipping_zip: "30000-000", shipping_country: "BR" },
      { id: 6, order_id: 105, product_id: 5, supplier_id: 2, quantity: 2, unit_price_cents: 7999, unit_cost_cents: 4000, variant_info: null, supplier_status: "processing", supplier_order_id: "CJ-2024-001", tracking_number: null, tracking_url: null, product_name: "Figura Anime Premium", images: "[]", supplier_name: "CJ Dropshipping BR", external_id: "CJ002", external_url: "https://cjdropshipping.com/p/002", order_status: "processing", user_id: "user5", shipping_name: "Carlos Neto", shipping_address: "Av. Central, 100", shipping_city: "Salvador", shipping_state: "BA", shipping_zip: "40000-000", shipping_country: "BR" },
    ]
  },
  {
    id: 3,
    name: "Printful POD",
    type: "printful",
    pendingCount: 2,
    processingCount: 0,
    shippedCount: 0,
    items: [
      { id: 7, order_id: 106, product_id: 6, supplier_id: 3, quantity: 3, unit_price_cents: 3999, unit_cost_cents: 1800, variant_info: '{"size":"M","color":"Preto"}', supplier_status: "pending", supplier_order_id: null, tracking_number: null, tracking_url: null, product_name: "Camiseta Retro Gamer", images: "[]", supplier_name: "Printful POD", external_id: null, external_url: null, order_status: "pending", user_id: "user6", shipping_name: "Lucia Fernandes", shipping_address: "Rua Rosa, 555", shipping_city: "Fortaleza", shipping_state: "CE", shipping_zip: "60000-000", shipping_country: "BR" },
      { id: 8, order_id: 106, product_id: 7, supplier_id: 3, quantity: 1, unit_price_cents: 5999, unit_cost_cents: 2500, variant_info: '{"size":"G"}', supplier_status: "pending", supplier_order_id: null, tracking_number: null, tracking_url: null, product_name: "Moletom Pixel Art", images: "[]", supplier_name: "Printful POD", external_id: null, external_url: null, order_status: "pending", user_id: "user6", shipping_name: "Lucia Fernandes", shipping_address: "Rua Rosa, 555", shipping_city: "Fortaleza", shipping_state: "CE", shipping_zip: "60000-000", shipping_country: "BR" },
    ]
  }
];

export default function AdminOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isPending } = useAuth();
  const { isAdmin, isPending: adminLoading } = useAdmin();
  const [supplierGroups, setSupplierGroups] = useState<SupplierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<number>>(new Set());
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    supplier_status: "",
    supplier_order_id: "",
    tracking_number: "",
    tracking_url: ""
  });
  const [saving, setSaving] = useState(false);
  
  const isDemoMode = location.pathname.includes("/admin/demo");

  useEffect(() => {
    if (isDemoMode) {
      setSupplierGroups(DEMO_SUPPLIER_ORDERS);
      setExpandedSuppliers(new Set(DEMO_SUPPLIER_ORDERS.map(s => s.id)));
      setLoading(false);
      return;
    }
    fetchSupplierOrders();
  }, [isDemoMode]);

  const fetchSupplierOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders/by-supplier");
      if (res.ok) {
        const data = await res.json();
        setSupplierGroups(data);
        setExpandedSuppliers(new Set(data.map((s: SupplierGroup) => s.id)));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSupplier = (id: number) => {
    const newExpanded = new Set(expandedSuppliers);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSuppliers(newExpanded);
  };

  const startEdit = (item: OrderItem) => {
    setEditingItem(item.id);
    setEditForm({
      supplier_status: item.supplier_status,
      supplier_order_id: item.supplier_order_id || "",
      tracking_number: item.tracking_number || "",
      tracking_url: item.tracking_url || ""
    });
  };

  const saveEdit = async (orderId: number, itemId: number) => {
    if (isDemoMode) {
      setSupplierGroups(prev => prev.map(group => ({
        ...group,
        items: group.items.map(item => 
          item.id === itemId ? { ...item, ...editForm } : item
        )
      })));
      setEditingItem(null);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/item/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      
      if (res.ok) {
        await fetchSupplierOrders();
        setEditingItem(null);
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <span className={`px-2 py-0.5 rounded text-white text-xs ${opt?.color || "bg-gray-500"}`}>
        {opt?.label || status}
      </span>
    );
  };

  if (isPending || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 100% 55%)" }}>
        <div className="panel-raised p-8 text-center">
          <div className="animate-pulse text-xl font-display">CARREGANDO...</div>
        </div>
      </div>
    );
  }

  if (!isDemoMode && (!user || !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 100% 55%)" }}>
        <div className="panel-raised p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <p className="text-lg mb-4">Acesso negado</p>
          <button onClick={() => navigate("/")} className="btn-retro">Voltar</button>
        </div>
      </div>
    );
  }

  const totalPending = supplierGroups.reduce((sum, g) => sum + g.pendingCount, 0);
  const totalProcessing = supplierGroups.reduce((sum, g) => sum + g.processingCount, 0);
  const totalShipped = supplierGroups.reduce((sum, g) => sum + g.shippedCount, 0);

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "hsl(210 100% 55%)" }}>
      <div className="max-w-6xl mx-auto">
        {isDemoMode && (
          <div className="panel-raised p-3 mb-4 text-center" style={{ background: "hsl(45 100% 60%)" }}>
            <span className="font-bold">⚠️ DEMO MODE</span> - Alterações não são salvas
          </div>
        )}

        {/* Header */}
        <div className="panel-raised p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(isDemoMode ? "/admin/demo" : "/admin")}
                className="btn-retro flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <div className="flex items-center gap-2">
                <Truck className="text-retro-pink" size={24} />
                <h1 className="text-xl font-bold font-display">ROTEAMENTO DE PEDIDOS</h1>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="text-yellow-600" size={16} />
                <span>{totalPending} pendentes</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="text-blue-600" size={16} />
                <span>{totalProcessing} processando</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="text-purple-600" size={16} />
                <span>{totalShipped} enviados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Groups */}
        {loading ? (
          <div className="panel-raised p-8 text-center">
            <div className="animate-pulse">Carregando pedidos...</div>
          </div>
        ) : supplierGroups.length === 0 ? (
          <div className="panel-raised p-8 text-center">
            <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
            <p className="text-lg">Nenhum pedido pendente!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {supplierGroups.map(group => (
              <div key={group.id} className="panel-raised overflow-hidden">
                {/* Supplier Header */}
                <button
                  onClick={() => toggleSupplier(group.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="text-retro-pink" size={20} />
                    <span className="font-bold font-display">{group.name}</span>
                    <span className="text-xs text-gray-500 uppercase">{group.type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 text-xs">
                      {group.pendingCount > 0 && (
                        <span className="bg-yellow-500 text-white px-2 py-0.5 rounded">{group.pendingCount} pendentes</span>
                      )}
                      {group.processingCount > 0 && (
                        <span className="bg-blue-500 text-white px-2 py-0.5 rounded">{group.processingCount} processando</span>
                      )}
                      {group.shippedCount > 0 && (
                        <span className="bg-purple-500 text-white px-2 py-0.5 rounded">{group.shippedCount} enviados</span>
                      )}
                    </div>
                    {expandedSuppliers.has(group.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {/* Items List */}
                {expandedSuppliers.has(group.id) && group.items.length > 0 && (
                  <div className="border-t-2 border-gray-300">
                    {group.items.map(item => (
                      <div key={item.id} className="p-4 border-b border-gray-200 last:border-b-0">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {/* Product Info */}
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold">{item.product_name}</span>
                                  <span className="text-xs text-gray-500">x{item.quantity}</span>
                                  {getStatusBadge(item.supplier_status)}
                                </div>
                                <div className="text-sm text-gray-600 space-y-0.5">
                                  <p>Pedido #{item.order_id} • {formatPrice(item.unit_price_cents * item.quantity)}</p>
                                  <p>Lucro: {formatPrice((item.unit_price_cents - item.unit_cost_cents) * item.quantity)}</p>
                                  {item.external_id && (
                                    <p className="flex items-center gap-1">
                                      ID Fornecedor: {item.external_id}
                                      {item.external_url && (
                                        <a href={item.external_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                          <ExternalLink size={12} />
                                        </a>
                                      )}
                                    </p>
                                  )}
                                  {item.variant_info && (
                                    <p>Variante: {JSON.parse(item.variant_info).size} {JSON.parse(item.variant_info).color}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Shipping Address */}
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <p className="font-semibold">{item.shipping_name}</p>
                              <p>{item.shipping_address}</p>
                              <p>{item.shipping_city}, {item.shipping_state} - {item.shipping_zip}</p>
                              <p>{item.shipping_country}</p>
                            </div>
                          </div>

                          {/* Edit Section */}
                          <div className="md:w-80">
                            {editingItem === item.id ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs font-bold mb-1">Status</label>
                                  <select
                                    value={editForm.supplier_status}
                                    onChange={(e) => setEditForm({ ...editForm, supplier_status: e.target.value })}
                                    className="panel-inset w-full p-1 text-sm"
                                  >
                                    {STATUS_OPTIONS.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold mb-1">ID Pedido Fornecedor</label>
                                  <input
                                    type="text"
                                    value={editForm.supplier_order_id}
                                    onChange={(e) => setEditForm({ ...editForm, supplier_order_id: e.target.value })}
                                    className="panel-inset w-full p-1 text-sm"
                                    placeholder="Ex: ALI-2024-001"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold mb-1">Código Rastreio</label>
                                  <input
                                    type="text"
                                    value={editForm.tracking_number}
                                    onChange={(e) => setEditForm({ ...editForm, tracking_number: e.target.value })}
                                    className="panel-inset w-full p-1 text-sm"
                                    placeholder="Ex: YT123456789CN"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold mb-1">URL Rastreio</label>
                                  <input
                                    type="text"
                                    value={editForm.tracking_url}
                                    onChange={(e) => setEditForm({ ...editForm, tracking_url: e.target.value })}
                                    className="panel-inset w-full p-1 text-sm"
                                    placeholder="https://..."
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveEdit(item.order_id, item.id)}
                                    disabled={saving}
                                    className="btn-gold flex-1 flex items-center justify-center gap-1 text-sm py-1"
                                  >
                                    <Save size={14} /> {saving ? "Salvando..." : "Salvar"}
                                  </button>
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="btn-retro text-sm py-1"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1 text-sm">
                                {item.supplier_order_id && (
                                  <p><span className="font-semibold">Pedido:</span> {item.supplier_order_id}</p>
                                )}
                                {item.tracking_number && (
                                  <p className="flex items-center gap-1">
                                    <span className="font-semibold">Rastreio:</span> {item.tracking_number}
                                    {item.tracking_url && (
                                      <a href={item.tracking_url} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                                        <ExternalLink size={12} />
                                      </a>
                                    )}
                                  </p>
                                )}
                                <button
                                  onClick={() => startEdit(item)}
                                  className="btn-retro flex items-center gap-1 text-sm py-1 mt-2"
                                >
                                  <Edit2 size={14} /> Atualizar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
