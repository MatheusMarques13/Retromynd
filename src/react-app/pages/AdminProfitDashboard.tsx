import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Truck,
  ChevronLeft,
  BarChart3,
  PieChart
} from "lucide-react";

interface DashboardData {
  summary: {
    totalOrders: number;
    successfulOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    totalProfit: number;
    avgMargin: number;
  };
  dailyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
    profit: number;
  }>;
  supplierStats: Array<{
    id: number;
    name: string;
    type: string;
    order_count: number;
    items_sold: number;
    revenue: number;
    profit: number;
  }>;
  topProducts: Array<{
    id: number;
    name: string;
    supplier_name: string;
    cost_cents: number;
    price_cents: number;
    margin_cents: number;
    margin_percent: number;
    total_sold: number;
    total_profit: number;
  }>;
  marginDistribution: Array<{
    margin_range: string;
    product_count: number;
  }>;
}

export default function AdminProfitDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/profit-dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load profit dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground font-mono animate-pulse">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  const maxDailyRevenue = Math.max(...(data?.dailyStats?.map(d => d.revenue) || [1]));
  const maxSupplierProfit = Math.max(...(data?.supplierStats?.map(s => s.profit || 0) || [1]));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b-2 border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/demo" 
              className="p-2 bg-muted hover:bg-accent rounded border border-border transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-mono flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-green-500" />
                {t("admin.profitDashboard")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("admin.profitDashboardDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-card border-2 border-border rounded p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              {t("admin.totalRevenue")}
            </div>
            <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
              {formatCurrency(data?.summary.totalRevenue || 0)}
            </div>
          </div>

          {/* Total Profit */}
          <div className="bg-card border-2 border-border rounded p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              {t("admin.totalProfit")}
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data?.summary.totalProfit || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {data?.summary.avgMargin || 0}% {t("admin.avgMargin")}
            </div>
          </div>

          {/* Orders */}
          <div className="bg-card border-2 border-border rounded p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Package className="w-4 h-4" />
              {t("admin.totalOrders")}
            </div>
            <div className="text-2xl font-bold font-mono">
              {data?.summary.totalOrders || 0}
            </div>
            <div className="text-xs space-x-2 mt-1">
              <span className="text-green-600">✓ {data?.summary.successfulOrders || 0}</span>
              <span className="text-yellow-600">⏳ {data?.summary.pendingOrders || 0}</span>
              <span className="text-red-600">✗ {data?.summary.cancelledOrders || 0}</span>
            </div>
          </div>

          {/* Avg Order Value */}
          <div className="bg-card border-2 border-border rounded p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Truck className="w-4 h-4" />
              {t("admin.avgOrderValue")}
            </div>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(
                data?.summary.successfulOrders 
                  ? Math.round(data.summary.totalRevenue / data.summary.successfulOrders) 
                  : 0
              )}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Revenue Chart */}
          <div className="bg-card border-2 border-border rounded p-4">
            <h2 className="font-bold font-mono mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              {t("admin.dailyRevenue")} ({t("admin.last30Days")})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data?.dailyStats?.length ? (
                data.dailyStats.slice(0, 14).map((day) => (
                  <div key={day.date} className="flex items-center gap-3 text-sm">
                    <span className="w-20 font-mono text-muted-foreground">
                      {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                        style={{ width: `${(day.revenue / maxDailyRevenue) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 absolute top-0"
                        style={{ width: `${(day.profit / maxDailyRevenue) * 100}%`, opacity: 0.7 }}
                      />
                    </div>
                    <span className="w-20 text-right font-mono text-green-600 dark:text-green-400">
                      {formatCurrency(day.profit)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {t("admin.noDataYet")}
                </p>
              )}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-500 rounded" /> {t("admin.revenue")}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded" /> {t("admin.profit")}
              </span>
            </div>
          </div>

          {/* Margin Distribution */}
          <div className="bg-card border-2 border-border rounded p-4">
            <h2 className="font-bold font-mono mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              {t("admin.marginDistribution")}
            </h2>
            <div className="space-y-3">
              {data?.marginDistribution?.length ? (
                data.marginDistribution.map((item) => {
                  const colors: Record<string, string> = {
                    "0-10%": "bg-red-500",
                    "10-20%": "bg-orange-500",
                    "20-30%": "bg-yellow-500",
                    "30-50%": "bg-green-500",
                    "50%+": "bg-emerald-500"
                  };
                  const total = data.marginDistribution.reduce((a, b) => a + b.product_count, 0);
                  const pct = total ? Math.round((item.product_count / total) * 100) : 0;
                  
                  return (
                    <div key={item.margin_range} className="flex items-center gap-3">
                      <span className="w-16 font-mono text-sm">{item.margin_range}</span>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div 
                          className={`h-full ${colors[item.margin_range] || "bg-gray-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 text-right font-mono text-sm">
                        {item.product_count} ({pct}%)
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {t("admin.noProductsYet")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Supplier Performance */}
        <div className="bg-card border-2 border-border rounded p-4">
          <h2 className="font-bold font-mono mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-500" />
            {t("admin.supplierPerformance")}
          </h2>
          {data?.supplierStats?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-2 font-mono">{t("admin.supplier")}</th>
                    <th className="text-left py-2 font-mono">{t("admin.type")}</th>
                    <th className="text-right py-2 font-mono">{t("admin.orders")}</th>
                    <th className="text-right py-2 font-mono">{t("admin.itemsSold")}</th>
                    <th className="text-right py-2 font-mono">{t("admin.revenue")}</th>
                    <th className="text-right py-2 font-mono">{t("admin.profit")}</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.supplierStats.map((supplier) => {
                    const margin = supplier.revenue ? Math.round((supplier.profit / supplier.revenue) * 100) : 0;
                    return (
                      <tr key={supplier.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 font-medium">{supplier.name}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-muted rounded text-xs font-mono uppercase">
                            {supplier.type}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono">{supplier.order_count || 0}</td>
                        <td className="py-3 text-right font-mono">{supplier.items_sold || 0}</td>
                        <td className="py-3 text-right font-mono">{formatCurrency(supplier.revenue || 0)}</td>
                        <td className="py-3 text-right font-mono text-green-600 dark:text-green-400">
                          {formatCurrency(supplier.profit || 0)}
                        </td>
                        <td className="py-3 w-24">
                          <div className="h-2 bg-muted rounded overflow-hidden">
                            <div 
                              className="h-full bg-green-500"
                              style={{ width: `${((supplier.profit || 0) / maxSupplierProfit) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{margin}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {t("admin.noSuppliersYet")}
            </p>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-card border-2 border-border rounded p-4">
          <h2 className="font-bold font-mono mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            {t("admin.topProducts")}
          </h2>
          {data?.topProducts?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-2 font-mono">{t("admin.product")}</th>
                    <th className="text-left py-2 font-mono">{t("admin.supplier")}</th>
                    <th className="text-right py-2 font-mono">{t("admin.cost")}</th>
                    <th className="text-right py-2 font-mono">{t("admin.price")}</th>
                    <th className="text-right py-2 font-mono">{t("admin.margin")}</th>
                    <th className="text-right py-2 font-mono">{t("admin.sold")}</th>
                    <th className="text-right py-2 font-mono">{t("admin.totalProfit")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 font-medium max-w-xs truncate">{product.name}</td>
                      <td className="py-3 text-muted-foreground">{product.supplier_name}</td>
                      <td className="py-3 text-right font-mono text-red-600 dark:text-red-400">
                        {formatCurrency(product.cost_cents)}
                      </td>
                      <td className="py-3 text-right font-mono">
                        {formatCurrency(product.price_cents)}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`font-mono px-2 py-0.5 rounded text-xs ${
                          product.margin_percent >= 30 
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : product.margin_percent >= 15
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        }`}>
                          {product.margin_percent}%
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono">{product.total_sold}</td>
                      <td className="py-3 text-right font-mono text-green-600 dark:text-green-400 font-bold">
                        {formatCurrency(product.total_profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {t("admin.noProductsYet")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
