import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { useAuth } from "@/react-app/auth";
import { useLanguage } from "../contexts/LanguageContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  ShoppingBag
} from "lucide-react";

interface OrderItem {
  id: number;
  product_id: number;
  supplier_id: number;
  quantity: number;
  unit_price_cents: number;
  variant_info: string | null;
  supplier_status: string;
  tracking_number: string | null;
  tracking_url: string | null;
  product_name: string;
  images: string;
  supplier_name: string;
}

interface Order {
  id: number;
  status: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  pending: { icon: <Clock size={16} />, color: "text-yellow-700", bg: "bg-yellow-100" },
  processing: { icon: <Package size={16} />, color: "text-blue-700", bg: "bg-blue-100" },
  shipped: { icon: <Truck size={16} />, color: "text-purple-700", bg: "bg-purple-100" },
  delivered: { icon: <CheckCircle size={16} />, color: "text-green-700", bg: "bg-green-100" },
  cancelled: { icon: <XCircle size={16} />, color: "text-red-700", bg: "bg-red-100" },
};

const DEMO_ORDERS: Order[] = [
  {
    id: 101,
    status: "shipped",
    subtotal_cents: 13998,
    shipping_cents: 0,
    total_cents: 13998,
    shipping_name: "Demo User",
    shipping_address: "Rua das Flores, 123",
    shipping_city: "São Paulo",
    shipping_state: "SP",
    shipping_zip: "01234-567",
    shipping_country: "BR",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-18T14:20:00Z",
    items: [
      { id: 1, product_id: 1, supplier_id: 1, quantity: 2, unit_price_cents: 4999, variant_info: null, supplier_status: "shipped", tracking_number: "YT123456789CN", tracking_url: "https://track17.net/YT123456789CN", product_name: "Teclado Gamer RGB Mecânico", images: "[]", supplier_name: "AliExpress" },
      { id: 2, product_id: 2, supplier_id: 1, quantity: 1, unit_price_cents: 4000, variant_info: null, supplier_status: "processing", tracking_number: null, tracking_url: null, product_name: "Mouse Gamer LED", images: "[]", supplier_name: "AliExpress" },
    ]
  },
  {
    id: 102,
    status: "delivered",
    subtotal_cents: 7999,
    shipping_cents: 0,
    total_cents: 7999,
    shipping_name: "Demo User",
    shipping_address: "Rua das Flores, 123",
    shipping_city: "São Paulo",
    shipping_state: "SP",
    shipping_zip: "01234-567",
    shipping_country: "BR",
    created_at: "2024-01-10T08:15:00Z",
    updated_at: "2024-01-20T09:30:00Z",
    items: [
      { id: 3, product_id: 3, supplier_id: 2, quantity: 1, unit_price_cents: 7999, variant_info: '{"size":"M","color":"Preto"}', supplier_status: "delivered", tracking_number: "BR123456789BR", tracking_url: "https://rastreamento.correios.com.br/BR123456789BR", product_name: "Camiseta Retro Gamer", images: "[]", supplier_name: "Printful" },
    ]
  },
  {
    id: 103,
    status: "pending",
    subtotal_cents: 15999,
    shipping_cents: 0,
    total_cents: 15999,
    shipping_name: "Demo User",
    shipping_address: "Rua das Flores, 123",
    shipping_city: "São Paulo",
    shipping_state: "SP",
    shipping_zip: "01234-567",
    shipping_country: "BR",
    created_at: "2024-01-22T16:45:00Z",
    updated_at: "2024-01-22T16:45:00Z",
    items: [
      { id: 4, product_id: 4, supplier_id: 1, quantity: 1, unit_price_cents: 15999, variant_info: null, supplier_status: "pending", tracking_number: null, tracking_url: null, product_name: "Console Retro 500 Jogos", images: "[]", supplier_name: "CJ Dropshipping" },
    ]
  }
];

export default function MyOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isPending } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  
  // Check if demo mode via route
  const isDemo = location.pathname === "/my-orders/demo";
  const [isDemoMode, setIsDemoMode] = useState(isDemo);

  useEffect(() => {
    if (isPending && !isDemo) return;
    
    if (!user || isDemo) {
      // Demo mode for non-logged users or /orders/demo route
      setIsDemoMode(true);
      setOrders(DEMO_ORDERS);
      setExpandedOrders(new Set([DEMO_ORDERS[0].id]));
      setLoading(false);
      return;
    }
    
    fetchOrders();
  }, [user, isPending, isDemo]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        if (data.length > 0) {
          setExpandedOrders(new Set([data[0].id]));
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (id: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedOrders(newExpanded);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t("orders.pending"),
      processing: t("orders.processing"),
      shipped: t("orders.shipped"),
      delivered: t("orders.delivered"),
      cancelled: t("orders.cancelled")
    };
    return labels[status] || status;
  };

  const getTrackingSteps = (status: string) => {
    const steps = ["pending", "processing", "shipped", "delivered"];
    const currentIndex = steps.indexOf(status);
    return steps.map((step, index) => ({
      step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  if ((isPending || loading) && !isDemo) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="panel-raised p-8 text-center">
            <div className="animate-pulse text-xl font-display">{t("orders.loading")}</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="panel-raised mb-6">
            <div className="bg-gradient-to-r from-retro-pink to-pink-500 px-4 py-2 flex items-center gap-2">
              <ShoppingBag className="text-white" size={20} />
              <span className="text-white font-bold font-display">{t("orders.title")}</span>
            </div>
            <div className="p-4">
              {isDemoMode && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-100 px-3 py-2 mb-3 border-2 border-amber-300 rounded">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{t("orders.demoMode")} - <button onClick={() => navigate("/login")} className="underline font-bold">{t("orders.loginToSee")}</button></span>
                </div>
              )}
              <p className="text-retro-dark/70">{t("orders.subtitle")}</p>
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="panel-raised p-8 text-center">
              <Package className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg mb-4">{t("orders.noOrders")}</p>
              <Link to="/" className="btn-gold">{t("orders.startShopping")}</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => {
                const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const isExpanded = expandedOrders.has(order.id);
                
                return (
                  <div key={order.id} className="panel-raised overflow-hidden">
                    {/* Order Header */}
                    <button
                      onClick={() => toggleOrder(order.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded ${config.bg}`}>
                          {config.icon}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">#{order.id}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Calendar size={12} />
                            {formatDate(order.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold">{formatPrice(order.total_cents)}</div>
                          <div className="text-xs text-gray-500">{order.items.length} {order.items.length === 1 ? "item" : "itens"}</div>
                        </div>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>

                    {/* Order Details */}
                    {isExpanded && (
                      <div className="border-t-2 border-gray-200">
                        {/* Progress Tracker */}
                        {order.status !== "cancelled" && (
                          <div className="p-4 bg-gray-50">
                            <div className="flex items-center justify-between max-w-md mx-auto">
                              {getTrackingSteps(order.status).map((step, index) => (
                                <div key={step.step} className="flex items-center">
                                  <div className={`flex flex-col items-center`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      step.completed 
                                        ? step.current ? "bg-retro-pink text-white" : "bg-green-500 text-white"
                                        : "bg-gray-300 text-gray-500"
                                    }`}>
                                      {STATUS_CONFIG[step.step]?.icon}
                                    </div>
                                    <span className={`text-xs mt-1 ${step.completed ? "font-medium" : "text-gray-400"}`}>
                                      {getStatusLabel(step.step)}
                                    </span>
                                  </div>
                                  {index < 3 && (
                                    <div className={`w-8 h-0.5 mx-1 ${
                                      step.completed && !step.current ? "bg-green-500" : "bg-gray-300"
                                    }`} />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Items */}
                        <div className="p-4 space-y-3">
                          <h4 className="font-bold text-sm mb-2">{t("orders.items")}</h4>
                          {order.items.map(item => {
                            const itemConfig = STATUS_CONFIG[item.supplier_status] || STATUS_CONFIG.pending;
                            
                            return (
                              <div key={item.id} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded">
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                  <Package className="text-gray-400" size={20} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-medium">{item.product_name}</p>
                                      <p className="text-xs text-gray-500">
                                        {t("orders.qty")}: {item.quantity} • {formatPrice(item.unit_price_cents * item.quantity)}
                                      </p>
                                      {item.variant_info && (
                                        <p className="text-xs text-gray-500">
                                          {JSON.parse(item.variant_info).size} {JSON.parse(item.variant_info).color}
                                        </p>
                                      )}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs ${itemConfig.bg} ${itemConfig.color}`}>
                                      {getStatusLabel(item.supplier_status)}
                                    </span>
                                  </div>
                                  
                                  {/* Tracking Info */}
                                  {item.tracking_number && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded flex items-center gap-2">
                                      <Truck className="text-blue-600" size={14} />
                                      <span className="text-sm font-mono">{item.tracking_number}</span>
                                      {item.tracking_url && (
                                        <a 
                                          href={item.tracking_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="ml-auto text-blue-600 hover:underline text-sm flex items-center gap-1"
                                        >
                                          {t("orders.track")} <ExternalLink size={12} />
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Shipping Address */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                          <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                            <MapPin size={14} />
                            {t("orders.shippingAddress")}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {order.shipping_name}<br />
                            {order.shipping_address}<br />
                            {order.shipping_city}, {order.shipping_state} - {order.shipping_zip}<br />
                            {order.shipping_country}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
