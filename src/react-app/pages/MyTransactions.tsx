import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import {
  Shield,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Gamepad2,
  DollarSign,
  MessageCircle,
} from "lucide-react";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { useAuth } from "@/react-app/auth";

// Demo transactions data
const DEMO_USER_ID = "demo-user-123";
const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    listing_id: 101,
    buyer_id: DEMO_USER_ID,
    seller_id: "seller-456",
    amount_cents: 12500,
    platform_fee_cents: 625,
    seller_payout_cents: 11875,
    status: "completed",
    delivered_at: "2024-07-10T14:30:00Z",
    completed_at: "2024-07-11T09:00:00Z",
    cancelled_at: null,
    created_at: "2024-07-08T10:00:00Z",
    title: "Conta Genshin Impact AR58 - 5 Personagens 5★",
    images: '["https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400"]',
    game_platform: "genshin",
  },
  {
    id: 2,
    listing_id: 102,
    buyer_id: "buyer-789",
    seller_id: DEMO_USER_ID,
    amount_cents: 8900,
    platform_fee_cents: 445,
    seller_payout_cents: 8455,
    status: "in_delivery",
    delivered_at: null,
    completed_at: null,
    cancelled_at: null,
    created_at: "2024-07-12T15:00:00Z",
    title: "League of Legends - Diamond 2 Account",
    images: '["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400"]',
    game_platform: "lol",
  },
  {
    id: 3,
    listing_id: 103,
    buyer_id: DEMO_USER_ID,
    seller_id: "seller-321",
    amount_cents: 5500,
    platform_fee_cents: 275,
    seller_payout_cents: 5225,
    status: "paid",
    delivered_at: null,
    completed_at: null,
    cancelled_at: null,
    created_at: "2024-07-14T08:00:00Z",
    title: "Valorant Radiant Account - NA Server",
    images: '["https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=400"]',
    game_platform: "valorant",
  },
  {
    id: 4,
    listing_id: 104,
    buyer_id: "buyer-555",
    seller_id: DEMO_USER_ID,
    amount_cents: 3200,
    platform_fee_cents: 160,
    seller_payout_cents: 3040,
    status: "disputed",
    delivered_at: null,
    completed_at: null,
    cancelled_at: null,
    created_at: "2024-07-05T12:00:00Z",
    title: "Steam Account - 150+ Games",
    images: '["https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400"]',
    game_platform: "steam",
  },
  {
    id: 5,
    listing_id: 105,
    buyer_id: DEMO_USER_ID,
    seller_id: "seller-999",
    amount_cents: 7800,
    platform_fee_cents: 390,
    seller_payout_cents: 7410,
    status: "pending_payment",
    delivered_at: null,
    completed_at: null,
    cancelled_at: null,
    created_at: "2024-07-15T16:00:00Z",
    title: "Fortnite Account - 200+ Skins",
    images: '["https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=400"]',
    game_platform: "fortnite",
  },
];

interface Transaction {
  id: number;
  listing_id: number;
  buyer_id: string;
  seller_id: string;
  amount_cents: number;
  platform_fee_cents: number;
  seller_payout_cents: number;
  status: string;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  title: string;
  images: string;
  game_platform: string | null;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending_payment: { 
    color: "bg-yellow-100 text-yellow-800 border-yellow-300", 
    icon: <Clock className="w-4 h-4" />,
    label: "Awaiting Payment"
  },
  paid: { 
    color: "bg-blue-100 text-blue-800 border-blue-300", 
    icon: <DollarSign className="w-4 h-4" />,
    label: "Paid - Awaiting Delivery"
  },
  in_delivery: { 
    color: "bg-purple-100 text-purple-800 border-purple-300", 
    icon: <Shield className="w-4 h-4" />,
    label: "In Delivery"
  },
  completed: { 
    color: "bg-green-100 text-green-800 border-green-300", 
    icon: <CheckCircle className="w-4 h-4" />,
    label: "Completed"
  },
  disputed: { 
    color: "bg-red-100 text-red-800 border-red-300", 
    icon: <AlertTriangle className="w-4 h-4" />,
    label: "Disputed"
  },
  cancelled: { 
    color: "bg-gray-100 text-gray-800 border-gray-300", 
    icon: <XCircle className="w-4 h-4" />,
    label: "Cancelled"
  },
  refunded: { 
    color: "bg-orange-100 text-orange-800 border-orange-300", 
    icon: <DollarSign className="w-4 h-4" />,
    label: "Refunded"
  },
};

const gamePlatforms: Record<string, string> = {
  genshin: "Genshin Impact",
  lol: "League of Legends",
  valorant: "Valorant",
  csgo: "CS2 / CS:GO",
  fortnite: "Fortnite",
  minecraft: "Minecraft",
  roblox: "Roblox",
  playstation: "PlayStation Network",
  xbox: "Xbox Live",
  nintendo: "Nintendo Account",
  steam: "Steam",
  epic: "Epic Games",
  other: "Other",
};

export default function MyTransactions() {
  useLanguage(); // For future i18n
  const { user, isPending: authPending } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if demo mode
  const isDemo = location.pathname === "/marketplace/transactions/demo";
  
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "buying" | "selling">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (isDemo) {
      // Load demo data with filtering
      let filtered = DEMO_TRANSACTIONS;
      if (filter === "buying") {
        filtered = filtered.filter(tx => tx.buyer_id === DEMO_USER_ID);
      } else if (filter === "selling") {
        filtered = filtered.filter(tx => tx.seller_id === DEMO_USER_ID);
      }
      if (statusFilter !== "all") {
        filtered = filtered.filter(tx => tx.status === statusFilter);
      }
      setTransactions(filtered);
      setLoading(false);
      return;
    }
    
    const fetchTransactions = async () => {
      try {
        const params = new URLSearchParams();
        if (filter !== "all") params.set("role", filter);
        if (statusFilter !== "all") params.set("status", statusFilter);
        
        const response = await fetch(`/api/account-transactions?${params}`, { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchTransactions();
  }, [user, filter, statusFilter, isDemo]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const parseImages = (imagesJson: string): string[] => {
    try {
      return JSON.parse(imagesJson) || [];
    } catch {
      return [];
    }
  };

  const getRole = (tx: Transaction) => {
    const userId = isDemo ? DEMO_USER_ID : user?.id;
    return tx.buyer_id === userId ? "buyer" : "seller";
  };

  if ((authPending || loading) && !isDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 100% 55%)" }}>
        <div className="panel-raised p-8">
          <Loader2 className="w-8 h-8 animate-spin text-retro-dark" />
        </div>
      </div>
    );
  }

  if (!user && !isDemo) {
    navigate("/login");
    return null;
  }

  const activeCount = transactions.filter(t => ["pending_payment", "paid", "in_delivery", "disputed"].includes(t.status)).length;

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "hsl(210 100% 55%)" }}>
      {/* Demo mode banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-amber-500/90 py-3 px-4 text-center mb-4">
          <div className="flex items-center justify-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-display font-medium tracking-wider">DEMO MODE - Transações do Usuário</span>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="panel-raised mb-6">
          <div className="bg-gradient-to-r from-retro-dark to-retro-gray text-white px-3 py-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-display text-sm tracking-wider">
              My Secure Transactions
            </span>
            {activeCount > 0 && (
              <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-xs">
                {activeCount} active
              </span>
            )}
          </div>
          <div className="p-4">
            <Link 
              to="/marketplace" 
              className="inline-flex items-center gap-2 text-retro-dark hover:text-retro-gold transition-colors"
            >
              ← Back to Marketplace
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="panel-raised mb-6 p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-display">Role</label>
              <div className="flex gap-1">
                {[
                  { value: "all", label: "All" },
                  { value: "buying", label: "Buying" },
                  { value: "selling", label: "Selling" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value as typeof filter)}
                    className={`px-3 py-1.5 text-sm font-display rounded transition-all ${
                      filter === opt.value
                        ? "bg-retro-gold text-retro-dark"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-display">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="panel-inset px-3 py-1.5 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending_payment">Awaiting Payment</option>
                <option value="paid">Paid</option>
                <option value="in_delivery">In Delivery</option>
                <option value="completed">Completed</option>
                <option value="disputed">Disputed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <div className="panel-raised p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="font-display text-xl text-retro-dark mb-2">No Transactions Yet</h2>
            <p className="text-gray-600 mb-4">
              When you buy or sell game accounts with escrow protection, they'll appear here.
            </p>
            <Link to="/marketplace/browse" className="btn-gold px-6 py-2 inline-flex items-center gap-2">
              Browse Accounts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => {
              const images = parseImages(tx.images);
              const role = getRole(tx);
              const config = statusConfig[tx.status] || statusConfig.pending_payment;
              
              return (
                <Link
                  key={tx.id}
                  to={`/marketplace/transaction/${tx.id}`}
                  className="panel-raised block hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4 p-4">
                    {/* Image */}
                    <div className="w-20 h-20 flex-shrink-0 panel-inset overflow-hidden">
                      {images[0] ? (
                        <img src={images[0]} alt={tx.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Gamepad2 className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-display text-lg text-retro-dark truncate">{tx.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {tx.game_platform && (
                              <span className="flex items-center gap-1">
                                <Gamepad2 className="w-3 h-3" />
                                {gamePlatforms[tx.game_platform] || tx.game_platform}
                              </span>
                            )}
                            <span>•</span>
                            <span>{formatDate(tx.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <div className="font-display text-lg text-green-600">
                            {formatPrice(tx.amount_cents)}
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                            role === "buyer" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                          }`}>
                            {role === "buyer" ? "Buying" : "Selling"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Status & Action */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-display border ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </span>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MessageCircle className="w-4 h-4" />
                          <span>Open Chat</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action hint based on status and role */}
                  {tx.status === "pending_payment" && role === "buyer" && (
                    <div className="px-4 pb-3">
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Action needed: Complete payment to proceed
                      </div>
                    </div>
                  )}
                  {tx.status === "paid" && role === "seller" && (
                    <div className="px-4 pb-3">
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Action needed: Deliver account credentials
                      </div>
                    </div>
                  )}
                  {tx.status === "in_delivery" && role === "buyer" && (
                    <div className="px-4 pb-3">
                      <div className="p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Action needed: Verify account and confirm receipt
                      </div>
                    </div>
                  )}
                  {tx.status === "disputed" && (
                    <div className="px-4 pb-3">
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Dispute in progress - moderator reviewing
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
        
        {/* Info Box */}
        <div className="panel-raised mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h4 className="font-display text-green-700 mb-1">Escrow Protection</h4>
              <p className="text-sm text-gray-600">
                All account transactions are protected by our escrow system. Payment is held securely until 
                you confirm receipt of the account, ensuring safe transactions for both buyers and sellers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
