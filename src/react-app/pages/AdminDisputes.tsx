import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { useAdmin } from "../hooks/useAdmin";
import { useLanguage } from "../contexts/LanguageContext";
import { 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  DollarSign,
  MessageSquare,
  Shield,
  RefreshCw
} from "lucide-react";

interface Dispute {
  id: number;
  transaction_id: number;
  opened_by: string;
  reason: string;
  description: string;
  status: string;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  amount_cents: number;
  buyer_id: string;
  seller_id: string;
  transaction_status: string;
  listing_title: string;
  game_platform: string | null;
}

export default function AdminDisputes() {
  const { isAdmin, isPending } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"open" | "resolved">("open");
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolution, setResolution] = useState("");
  const [refundBuyer, setRefundBuyer] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const isDemoMode = location.pathname.includes("/admin/demo");

  useEffect(() => {
    if (!isDemoMode && !isPending && !isAdmin) {
      navigate("/login");
    }
  }, [isPending, isAdmin, navigate, isDemoMode]);

  useEffect(() => {
    if (isAdmin || isDemoMode) {
      loadDisputes();
    }
  }, [isAdmin, isDemoMode]);

  const loadDisputes = async () => {
    try {
      const res = await fetch("/api/admin/disputes");
      const data = await res.json();
      setDisputes(data.disputes || []);
    } catch (err) {
      console.error("Error loading disputes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId: number) => {
    if (!resolution.trim()) {
      alert(t("disputes.resolutionPlaceholder"));
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution: resolution.trim(), refund_buyer: refundBuyer })
      });
      
      if (res.ok) {
        await loadDisputes();
        setResolvingId(null);
        setResolution("");
        setRefundBuyer(true);
      } else {
        const data = await res.json();
        alert(data.error || "Error resolving dispute");
      }
    } catch (err) {
      console.error("Error resolving:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const openDisputes = disputes.filter(d => d.status === "open");
  const resolvedDisputes = disputes.filter(d => d.status === "resolved");
  const currentDisputes = activeTab === "open" ? openDisputes : resolvedDisputes;

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            to={isDemoMode ? "/admin/demo" : "/admin"}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Shield className="w-8 h-8 text-red-500" />
              {t("disputes.title")}
            </h1>
            {isDemoMode && (
              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded mt-1 inline-block">
                DEMO MODE
              </span>
            )}
          </div>
          <button
            onClick={loadDisputes}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("open")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "open"
                ? "bg-red-500 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Clock className="w-4 h-4" />
            {t("disputes.pending")} ({openDisputes.length})
          </button>
          <button
            onClick={() => setActiveTab("resolved")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "resolved"
                ? "bg-green-500 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {t("disputes.resolved")} ({resolvedDisputes.length})
          </button>
        </div>

        {/* Disputes List */}
        {currentDisputes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-600 p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {t("disputes.noDisputes")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentDisputes.map((dispute) => (
              <div
                key={dispute.id}
                className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-600 overflow-hidden"
              >
                {/* Dispute Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        dispute.status === "open" 
                          ? "bg-red-100 dark:bg-red-900/30" 
                          : "bg-green-100 dark:bg-green-900/30"
                      }`}>
                        {dispute.status === "open" ? (
                          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          Disputa #{dispute.id}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Transação #{dispute.transaction_id} • {formatDate(dispute.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                        {formatPrice(dispute.amount_cents)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        dispute.status === "open"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      }`}>
                        {dispute.status === "open" ? t("disputes.pending") : t("disputes.resolved")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dispute Details */}
                <div className="p-4 space-y-4">
                  {/* Listing Info */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white">
                        {dispute.listing_title}
                      </p>
                      {dispute.game_platform && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {dispute.game_platform}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-500 dark:text-gray-400">{t("transaction.buyer")}:</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
                        {dispute.buyer_id.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-green-500" />
                      <span className="text-gray-500 dark:text-gray-400">{t("transaction.seller")}:</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
                        {dispute.seller_id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {t("transaction.disputeReason")}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-750 p-3 rounded-lg">
                      <span className="font-medium">{dispute.reason}</span>
                      {dispute.description && (
                        <>
                          <br />
                          <span className="text-sm">{dispute.description}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Resolution (if resolved) */}
                  {dispute.status === "resolved" && dispute.resolution && (
                    <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {t("disputes.resolution")}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        {dispute.resolution}
                      </p>
                      {dispute.resolved_at && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Resolvido em {formatDate(dispute.resolved_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Resolve Form (if open) */}
                  {dispute.status === "open" && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      {resolvingId === dispute.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t("disputes.resolution")}
                            </label>
                            <textarea
                              value={resolution}
                              onChange={(e) => setResolution(e.target.value)}
                              placeholder={t("disputes.resolutionPlaceholder")}
                              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
                              rows={3}
                            />
                          </div>
                          
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`resolution-${dispute.id}`}
                                checked={refundBuyer}
                                onChange={() => setRefundBuyer(true)}
                                className="w-4 h-4 text-red-500"
                              />
                              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <XCircle className="w-4 h-4" />
                                {t("disputes.refundBuyer")}
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`resolution-${dispute.id}`}
                                checked={!refundBuyer}
                                onChange={() => setRefundBuyer(false)}
                                className="w-4 h-4 text-green-500"
                              />
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <DollarSign className="w-4 h-4" />
                                {t("disputes.releaseSeller")}
                              </span>
                            </label>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolve(dispute.id)}
                              disabled={submitting}
                              className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                            >
                              {submitting ? "..." : t("disputes.resolve")}
                            </button>
                            <button
                              onClick={() => {
                                setResolvingId(null);
                                setResolution("");
                                setRefundBuyer(true);
                              }}
                              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                              {t("transaction.cancel")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvingId(dispute.id)}
                          className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          {t("disputes.resolve")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
