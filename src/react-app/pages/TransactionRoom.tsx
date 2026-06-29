import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MessageCircle,
  Key,
  Copy,
  Eye,
  EyeOff,
  Flag,
  DollarSign,
  User,
  Gamepad2,
} from "lucide-react";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { useAuth } from "@/react-app/auth";

interface Transaction {
  id: number;
  listing_id: number;
  buyer_id: string;
  seller_id: string;
  amount_cents: number;
  platform_fee_cents: number;
  seller_payout_cents: number;
  status: string;
  stripe_payment_intent_id: string | null;
  delivery_deadline_at: string | null;
  auto_release_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  title: string;
  description: string;
  images: string;
  game_platform: string | null;
  account_level: string | null;
  account_rank: string | null;
  account_server: string | null;
}

interface Credentials {
  login_email: string | null;
  login_username: string | null;
  login_password: string | null;
  recovery_email: string | null;
  recovery_phone: string | null;
  additional_info: string | null;
  is_revealed: boolean;
  revealed_at: string | null;
}

interface Message {
  id: number;
  transaction_id: number;
  sender_id: string;
  message_type: string;
  content: string;
  is_system: boolean;
  is_read: boolean;
  created_at: string;
}

interface Dispute {
  id: number;
  transaction_id: number;
  opened_by: string;
  reason: string;
  description: string | null;
  status: string;
  resolution: string | null;
  created_at: string;
}

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

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800 border-yellow-300",
  paid: "bg-blue-100 text-blue-800 border-blue-300",
  in_delivery: "bg-purple-100 text-purple-800 border-purple-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  disputed: "bg-red-100 text-red-800 border-red-300",
  cancelled: "bg-gray-100 text-gray-800 border-gray-300",
  refunded: "bg-orange-100 text-orange-800 border-orange-300",
};

export default function TransactionRoom() {
  useLanguage(); // For future i18n
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isPending: authPending } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBuyer, setIsBuyer] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [error, setError] = useState("");
  
  // UI state
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [delivering, setDelivering] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/account-transactions/${id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Transaction not found");
      
      const data = await response.json();
      setTransaction(data.transaction);
      setCredentials(data.credentials);
      setDispute(data.dispute);
      setIsBuyer(data.isBuyer);
      setIsSeller(data.isSeller);
    } catch {
      setError("Failed to load transaction");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/account-transactions/${id}/messages`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch {
      // Silent fail for messages
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchTransaction();
      fetchMessages();
      
      // Poll for new messages every 10 seconds
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [user, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      const response = await fetch(`/api/account-transactions/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      
      if (response.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch {
      setError("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handlePayment = async () => {
    setProcessingPayment(true);
    try {
      const response = await fetch(`/api/account-transactions/${id}/checkout`, {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        throw new Error("Failed to create checkout");
      }
    } catch {
      setError("Failed to process payment");
      setProcessingPayment(false);
    }
  };

  const handleDeliver = async () => {
    if (!confirm("Are you sure you want to deliver the account credentials? The buyer will be able to see them immediately.")) {
      return;
    }
    
    setDelivering(true);
    try {
      const response = await fetch(`/api/account-transactions/${id}/deliver`, {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        fetchTransaction();
        fetchMessages();
      } else {
        throw new Error("Failed to deliver");
      }
    } catch {
      setError("Failed to deliver account");
    } finally {
      setDelivering(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm("Confirm that you have received the account and everything is correct? This will release payment to the seller.")) {
      return;
    }
    
    setConfirming(true);
    try {
      const response = await fetch(`/api/account-transactions/${id}/confirm`, {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        fetchTransaction();
        fetchMessages();
      } else {
        throw new Error("Failed to confirm");
      }
    } catch {
      setError("Failed to confirm receipt");
    } finally {
      setConfirming(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    
    setSubmittingDispute(true);
    try {
      const response = await fetch(`/api/account-transactions/${id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason: disputeReason.trim(),
          description: disputeDescription.trim() || null,
        }),
      });
      
      if (response.ok) {
        setShowDisputeModal(false);
        setDisputeReason("");
        setDisputeDescription("");
        fetchTransaction();
        fetchMessages();
      } else {
        throw new Error("Failed to open dispute");
      }
    } catch {
      setError("Failed to open dispute");
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this transaction?")) return;
    
    setCancelling(true);
    try {
      const response = await fetch(`/api/account-transactions/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: "Cancelled by user" }),
      });
      
      if (response.ok) {
        fetchTransaction();
        fetchMessages();
      } else {
        throw new Error("Failed to cancel");
      }
    } catch {
      setError("Failed to cancel transaction");
    } finally {
      setCancelling(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const parseImages = (imagesJson: string): string[] => {
    try {
      return JSON.parse(imagesJson) || [];
    } catch {
      return [];
    }
  };

  const getTimeRemaining = (autoReleaseAt: string) => {
    const diff = new Date(autoReleaseAt).getTime() - Date.now();
    if (diff <= 0) return "Auto-release pending";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  if (authPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 100% 55%)" }}>
        <div className="panel-raised p-8">
          <Loader2 className="w-8 h-8 animate-spin text-retro-dark" />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  if (error && !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 100% 55%)" }}>
        <div className="panel-raised p-8 text-center">
          <h2 className="font-display text-xl text-retro-dark mb-4">{error}</h2>
          <Link to="/marketplace/transactions" className="btn-retro px-4 py-2">
            Back to Transactions
          </Link>
        </div>
      </div>
    );
  }

  if (!transaction) return null;

  const images = parseImages(transaction.images);

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "hsl(210 100% 55%)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="panel-raised mb-6">
          <div className="bg-gradient-to-r from-retro-dark to-retro-gray text-white px-3 py-1 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="font-display text-sm tracking-wider">
              Secure Transaction Room
            </span>
            <span className="ml-auto text-xs opacity-75">#{transaction.id}</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <Link 
              to="/marketplace/transactions" 
              className="inline-flex items-center gap-2 text-retro-dark hover:text-retro-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-display text-sm">My Transactions</span>
            </Link>
            
            <span className={`px-3 py-1 rounded-full text-xs font-display border ${statusColors[transaction.status]}`}>
              {transaction.status.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Listing Info + Actions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Listing Card */}
            <div className="panel-raised overflow-hidden">
              {images.length > 0 && (
                <div className="aspect-video overflow-hidden">
                  <img src={images[0]} alt={transaction.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gamepad2 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-600 font-display">
                    {gamePlatforms[transaction.game_platform || ""] || transaction.game_platform}
                  </span>
                </div>
                <h3 className="font-display text-lg text-retro-dark mb-2">{transaction.title}</h3>
                
                {(transaction.account_level || transaction.account_rank) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {transaction.account_level && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Level: {transaction.account_level}
                      </span>
                    )}
                    {transaction.account_rank && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Rank: {transaction.account_rank}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="text-2xl font-display text-green-600 mb-3">
                  {formatPrice(transaction.amount_cents)}
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Platform Fee:</span>
                    <span>-{formatPrice(transaction.platform_fee_cents)}</span>
                  </div>
                  <div className="flex justify-between font-display">
                    <span>Seller Receives:</span>
                    <span className="text-green-600">{formatPrice(transaction.seller_payout_cents)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Badge */}
            <div className="panel-raised p-3 flex items-center gap-3">
              <User className="w-5 h-5 text-retro-dark" />
              <div>
                <span className="text-xs text-gray-500">Your Role:</span>
                <div className="font-display text-sm text-retro-dark">
                  {isBuyer ? "Buyer" : "Seller"}
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="panel-raised p-4">
              <h4 className="font-display text-sm text-retro-dark mb-3">Transaction Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${transaction.status !== "pending_payment" ? "bg-green-500" : "bg-yellow-500"}`}>
                    {transaction.status !== "pending_payment" ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <Clock className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-display">Payment</div>
                    <div className="text-xs text-gray-500">
                      {transaction.status === "pending_payment" ? "Awaiting payment" : "Completed"}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    transaction.delivered_at ? "bg-green-500" : 
                    transaction.status === "paid" ? "bg-yellow-500" : "bg-gray-300"
                  }`}>
                    {transaction.delivered_at ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : transaction.status === "paid" ? (
                      <Clock className="w-4 h-4 text-white" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-display">Delivery</div>
                    <div className="text-xs text-gray-500">
                      {transaction.delivered_at ? `Delivered ${formatDate(transaction.delivered_at)}` : 
                       transaction.status === "paid" ? "Waiting for seller" : "Pending"}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    transaction.completed_at ? "bg-green-500" : 
                    transaction.status === "in_delivery" ? "bg-yellow-500" : "bg-gray-300"
                  }`}>
                    {transaction.completed_at ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : transaction.status === "in_delivery" ? (
                      <Clock className="w-4 h-4 text-white" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-display">Confirmation</div>
                    <div className="text-xs text-gray-500">
                      {transaction.completed_at ? `Confirmed ${formatDate(transaction.completed_at)}` : 
                       transaction.status === "in_delivery" ? "Waiting for buyer" : "Pending"}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Auto-release warning */}
              {transaction.status === "in_delivery" && transaction.auto_release_at && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-display">
                      {getTimeRemaining(transaction.auto_release_at)}
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Payment auto-releases if buyer doesn't confirm or dispute
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="panel-raised p-4 space-y-3">
              {/* Buyer: Pay button */}
              {isBuyer && transaction.status === "pending_payment" && (
                <button
                  onClick={handlePayment}
                  disabled={processingPayment}
                  className="w-full btn-gold py-3 font-display flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <DollarSign className="w-5 h-5" />
                  )}
                  Pay {formatPrice(transaction.amount_cents)}
                </button>
              )}
              
              {/* Seller: Deliver button */}
              {isSeller && transaction.status === "paid" && (
                <button
                  onClick={handleDeliver}
                  disabled={delivering}
                  className="w-full py-3 font-display flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(180deg, hsl(280 70% 55%) 0%, hsl(280 70% 45%) 100%)", color: "white" }}
                >
                  {delivering ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Unlock className="w-5 h-5" />
                  )}
                  Deliver Account
                </button>
              )}
              
              {/* Buyer: Confirm button */}
              {isBuyer && transaction.status === "in_delivery" && !dispute && (
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="w-full py-3 font-display flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded"
                >
                  {confirming ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Confirm Receipt
                </button>
              )}
              
              {/* Dispute button */}
              {["paid", "in_delivery"].includes(transaction.status) && !dispute && (
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="w-full py-2 text-sm font-display flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 hover:bg-red-50 rounded"
                >
                  <Flag className="w-4 h-4" />
                  Open Dispute
                </button>
              )}
              
              {/* Cancel button */}
              {transaction.status === "pending_payment" && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full py-2 text-sm font-display flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 rounded"
                >
                  {cancelling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Cancel Transaction
                </button>
              )}
            </div>

            {/* Dispute Info */}
            {dispute && (
              <div className="panel-raised p-4 border-2 border-red-300 bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-display text-red-700">Dispute Open</span>
                </div>
                <p className="text-sm text-red-700 mb-2">{dispute.reason}</p>
                {dispute.description && (
                  <p className="text-xs text-red-600 mb-2">{dispute.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  Opened {formatDate(dispute.created_at)}
                </p>
                {dispute.resolution && (
                  <div className="mt-3 p-2 bg-white rounded">
                    <p className="text-xs font-display text-gray-700">Resolution:</p>
                    <p className="text-sm text-gray-600">{dispute.resolution}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Chat + Credentials */}
          <div className="lg:col-span-2 space-y-4">
            {/* Credentials Section (shown to buyer after delivery or to seller always) */}
            {credentials && (isSeller || (isBuyer && transaction.delivered_at)) && (
              <div className="panel-raised overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    <span className="font-display text-sm">Account Credentials</span>
                  </div>
                  <button
                    onClick={() => setShowCredentials(!showCredentials)}
                    className="flex items-center gap-1 text-xs hover:bg-white/20 px-2 py-1 rounded"
                  >
                    {showCredentials ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showCredentials ? "Hide" : "Show"}
                  </button>
                </div>
                
                {showCredentials ? (
                  <div className="p-4 space-y-3">
                    {credentials.login_email && (
                      <div className="flex items-center justify-between p-2 panel-inset">
                        <div>
                          <span className="text-xs text-gray-500 block">Login Email</span>
                          <span className="font-mono text-sm">{credentials.login_email}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(credentials.login_email!, "email")}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          {copiedField === "email" ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {credentials.login_username && (
                      <div className="flex items-center justify-between p-2 panel-inset">
                        <div>
                          <span className="text-xs text-gray-500 block">Username</span>
                          <span className="font-mono text-sm">{credentials.login_username}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(credentials.login_username!, "username")}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          {copiedField === "username" ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {credentials.login_password && (
                      <div className="flex items-center justify-between p-2 panel-inset bg-yellow-50 border border-yellow-200">
                        <div>
                          <span className="text-xs text-yellow-700 block">Password</span>
                          <span className="font-mono text-sm">{credentials.login_password}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(credentials.login_password!, "password")}
                          className="p-2 hover:bg-yellow-100 rounded"
                        >
                          {copiedField === "password" ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-yellow-600" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {credentials.recovery_email && (
                      <div className="flex items-center justify-between p-2 panel-inset">
                        <div>
                          <span className="text-xs text-gray-500 block">Recovery Email</span>
                          <span className="font-mono text-sm">{credentials.recovery_email}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(credentials.recovery_email!, "recovery_email")}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          {copiedField === "recovery_email" ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {credentials.recovery_phone && (
                      <div className="flex items-center justify-between p-2 panel-inset">
                        <div>
                          <span className="text-xs text-gray-500 block">Recovery Phone</span>
                          <span className="font-mono text-sm">{credentials.recovery_phone}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(credentials.recovery_phone!, "recovery_phone")}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          {copiedField === "recovery_phone" ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {credentials.additional_info && (
                      <div className="p-2 panel-inset">
                        <span className="text-xs text-gray-500 block mb-1">Additional Info</span>
                        <p className="text-sm whitespace-pre-wrap">{credentials.additional_info}</p>
                      </div>
                    )}
                    
                    {isBuyer && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-center gap-2 text-blue-700 text-xs">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Please verify the account and confirm receipt to release payment to seller.</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click "Show" to reveal credentials</p>
                  </div>
                )}
              </div>
            )}

            {/* Credentials locked message for buyer before delivery */}
            {isBuyer && !transaction.delivered_at && transaction.status !== "pending_payment" && (
              <div className="panel-raised p-4 border-2 border-purple-200 bg-purple-50">
                <div className="flex items-center gap-3">
                  <Lock className="w-8 h-8 text-purple-400" />
                  <div>
                    <h4 className="font-display text-purple-700">Credentials Locked</h4>
                    <p className="text-sm text-purple-600">
                      Account credentials will be revealed once the seller delivers them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Section */}
            <div className="panel-raised overflow-hidden flex flex-col" style={{ height: "500px" }}>
              <div className="bg-gradient-to-r from-retro-dark to-retro-gray text-white px-4 py-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="font-display text-sm">Secure Chat</span>
                <span className="ml-auto text-xs opacity-75">{messages.length} messages</span>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    {msg.is_system ? (
                      <div className="w-full text-center">
                        <div className="inline-block px-3 py-2 bg-gray-200 rounded-lg text-xs text-gray-600">
                          <Shield className="w-3 h-3 inline mr-1" />
                          {msg.content}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(msg.created_at)}
                        </div>
                      </div>
                    ) : (
                      <div className={`max-w-[70%] ${msg.sender_id === user?.id ? "text-right" : ""}`}>
                        <div
                          className={`inline-block px-4 py-2 rounded-lg ${
                            msg.sender_id === user?.id
                              ? "bg-blue-500 text-white"
                              : "bg-white border border-gray-200 text-gray-800"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          {msg.sender_id === user?.id ? "You" : isBuyer ? "Seller" : "Buyer"}
                          <span>•</span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              {!["completed", "cancelled", "refunded"].includes(transaction.status) && (
                <div className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 panel-inset px-3 py-2 text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                      className="btn-retro px-4 py-2 flex items-center gap-2"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {["completed", "cancelled", "refunded"].includes(transaction.status) && (
                <div className="p-3 border-t border-gray-200 bg-gray-100 text-center text-sm text-gray-500">
                  This conversation is closed
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="panel-raised max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-display text-sm">Open Dispute</span>
              </div>
              <button onClick={() => setShowDisputeModal(false)} className="hover:bg-white/20 p-1 rounded">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Open a dispute if something is wrong with the transaction. A moderator will review your case.
              </p>
              
              <div>
                <label className="block font-display text-sm text-retro-dark mb-2">
                  Reason *
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full panel-inset px-3 py-2 text-sm"
                >
                  <option value="">Select a reason...</option>
                  <option value="Account credentials don't work">Account credentials don't work</option>
                  <option value="Account is different from description">Account is different from description</option>
                  <option value="Account was banned or suspended">Account was banned or suspended</option>
                  <option value="Seller not responding">Seller not responding</option>
                  <option value="Fraudulent listing">Fraudulent listing</option>
                  <option value="Other issue">Other issue</option>
                </select>
              </div>
              
              <div>
                <label className="block font-display text-sm text-retro-dark mb-2">
                  Additional Details
                </label>
                <textarea
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  rows={3}
                  className="w-full panel-inset px-3 py-2 text-sm resize-none"
                  placeholder="Provide more details about the issue..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 btn-retro py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispute}
                  disabled={!disputeReason.trim() || submittingDispute}
                  className="flex-1 py-2 font-display flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50"
                >
                  {submittingDispute ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                  Open Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 panel-raised p-4 bg-red-50 border border-red-200 max-w-sm">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={() => setError("")}
            className="absolute top-2 right-2 text-red-400 hover:text-red-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
