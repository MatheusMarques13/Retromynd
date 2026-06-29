import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { Header } from "@/react-app/components/Header";
import { Footer } from "@/react-app/components/Footer";
import { useAuth } from "@/react-app/auth";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { 
  Crown, Diamond, Ticket, Gift, Palette, Star, Sparkles, 
  CheckCircle2, Zap, Trophy, Shield, Gamepad2, ChevronRight,
  Copy, Check, Clock, X, Settings, Users, AlertTriangle,
  Package, Flame, Calendar, CalendarCheck, Frame, Swords,
  Rocket, Ghost, Bird, Skull, Joystick, type LucideIcon
} from "lucide-react";

// Map icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Crown, Gem: Diamond, Star, Flame, Rocket, Zap, Trophy, Diamond,
  Sparkles, Gamepad2, Joystick, Ghost, Bird, Skull, Swords
};

interface Subscription {
  id: number;
  status: string;
  current_period_end: string;
  cancelled_at: string | null;
  leaderboard_icon: string | null;
  leaderboard_color: string | null;
  display_title: string | null;
  availableCoupons: number;
  ticketBalance: number;
}

interface Coupon {
  id: number;
  code: string;
  discount_percent: number;
  is_used: boolean;
  used_at: string | null;
  expires_at: string;
}

interface CustomizationOption {
  id: string;
  name: string;
  icon?: string;
  hex?: string;
}

interface MysteryBox {
  id: number;
  month_year: string;
  is_opened: boolean;
  reward_type: string | null;
  reward_value: string | null;
  opened_at: string | null;
}

interface LoginStreak {
  current_streak: number;
  longest_streak: number;
  last_login_date: string;
  total_logins: number;
  tickets_earned: number;
  can_checkin: boolean;
  today_reward?: { type: string; value: number };
}

interface AvatarFrame {
  id: string;
  name: string;
  frame_type: string;
  css_animation: string;
  colors: string;
  is_premium: boolean;
  is_animated?: boolean;
}

interface Tournament {
  id: number;
  name: string;
  game_type: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
  max_participants: number | null;
  participant_count: number;
  is_retropass_only: boolean;
}

// Demo mode mock data
const DEMO_SUBSCRIPTION: Subscription = {
  id: 999,
  status: "active",
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  cancelled_at: null,
  leaderboard_icon: "crown",
  leaderboard_color: "#FFD700",
  display_title: "Legend",
  availableCoupons: 5,
  ticketBalance: 5000
};

const DEMO_COUPONS: Coupon[] = [
  { id: 1, code: "RETRO15-DEMO1", discount_percent: 15, is_used: false, used_at: null, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 2, code: "RETRO15-DEMO2", discount_percent: 15, is_used: false, used_at: null, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 3, code: "RETRO15-DEMO3", discount_percent: 15, is_used: false, used_at: null, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 4, code: "RETRO15-DEMO4", discount_percent: 15, is_used: true, used_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 5, code: "RETRO15-DEMO5", discount_percent: 15, is_used: false, used_at: null, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
];

const DEMO_CUSTOM_OPTIONS = {
  icons: [
    { id: "crown", name: "Crown", icon: "Crown" },
    { id: "diamond", name: "Diamond", icon: "Gem" },
    { id: "star", name: "Star", icon: "Star" },
    { id: "fire", name: "Fire", icon: "Flame" },
    { id: "rocket", name: "Rocket", icon: "Rocket" },
    { id: "dragon", name: "Dragon", icon: "Flame" },
    { id: "lightning", name: "Lightning", icon: "Zap" },
    { id: "rainbow", name: "Rainbow", icon: "Sparkles" },
  ],
  colors: [
    { id: "#FFD700", name: "Gold", hex: "#FFD700" },
    { id: "#E673AA", name: "Pink", hex: "#E673AA" },
    { id: "#00BFFF", name: "Cyan", hex: "#00BFFF" },
    { id: "#FF6B6B", name: "Red", hex: "#FF6B6B" },
    { id: "#7B68EE", name: "Purple", hex: "#7B68EE" },
    { id: "#00FF7F", name: "Green", hex: "#00FF7F" },
    { id: "#FF8C00", name: "Orange", hex: "#FF8C00" },
    { id: "#FFFFFF", name: "White", hex: "#FFFFFF" },
  ],
  titles: [
    { id: "Legend", name: "Legend" },
    { id: "Champion", name: "Champion" },
    { id: "Master", name: "Master" },
    { id: "Pro", name: "Pro" },
    { id: "Elite", name: "Elite" },
    { id: "VIP", name: "VIP" },
  ]
};

const DEMO_TOURNAMENTS: Tournament[] = [
  {
    id: 1,
    name: "Tetris Championship",
    game_type: "tetris",
    description: "Weekly high score battle - reach the top!",
    status: "active",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    prize_pool: 10000,
    max_participants: 100,
    participant_count: 67,
    is_retropass_only: true
  },
  {
    id: 2,
    name: "Snake Masters Cup",
    game_type: "snake",
    description: "Classic arcade showdown",
    status: "active",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    prize_pool: 5000,
    max_participants: 50,
    participant_count: 42,
    is_retropass_only: true
  },
  {
    id: 3,
    name: "Memory Challenge",
    game_type: "memory",
    description: "Test your memory skills",
    status: "upcoming",
    start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    prize_pool: 7500,
    max_participants: 75,
    participant_count: 23,
    is_retropass_only: false
  }
];

export default function RetroPassPage() {
  const { user, isPending } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Check if demo mode
  const isDemo = location.pathname === "/retropass/demo";
  
  const [loading, setLoading] = useState(true);
  const [hasRetroPass, setHasRetroPass] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [customOptions, setCustomOptions] = useState<{
    icons: CustomizationOption[];
    colors: CustomizationOption[];
    titles: CustomizationOption[];
  } | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  
  // New feature states
  const [mysteryBox, setMysteryBox] = useState<MysteryBox | null>(null);
  const [openingBox, setOpeningBox] = useState(false);
  const [boxReward, setBoxReward] = useState<{ type: string; value: string } | null>(null);
  const [loginStreak, setLoginStreak] = useState<LoginStreak | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [frames, setFrames] = useState<AvatarFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<string>("none");
  const [showFrameModal, setShowFrameModal] = useState(false);
  const [savingFrame, setSavingFrame] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [joinedTournaments, setJoinedTournaments] = useState<Set<number>>(new Set());
  const [joiningTournament, setJoiningTournament] = useState<number | null>(null);
  
  const success = searchParams.get("success") === "true";
  const cancelled = searchParams.get("cancelled") === "true";

  useEffect(() => {
    if (isDemo) {
      // Demo mode: use mock data
      setHasRetroPass(true);
      setSubscription(DEMO_SUBSCRIPTION);
      setCoupons(DEMO_COUPONS);
      setCustomOptions(DEMO_CUSTOM_OPTIONS);
      setSelectedIcon("crown");
      setSelectedColor("#FFD700");
      setSelectedTitle("Legend");
      // Demo data for new features
      setMysteryBox({
        id: 1,
        month_year: new Date().toISOString().slice(0, 7),
        is_opened: false,
        reward_type: null,
        reward_value: null,
        opened_at: null
      });
      setLoginStreak({
        current_streak: 7,
        longest_streak: 14,
        last_login_date: new Date().toISOString().split('T')[0],
        total_logins: 45,
        tickets_earned: 2250,
        can_checkin: true,
        today_reward: { type: "tickets", value: 150 }
      });
      setFrames([
        { id: 'none', name: 'No Frame', frame_type: 'none', css_animation: '', colors: '', is_premium: false },
        { id: 'fire', name: 'Inferno', frame_type: 'animated', css_animation: 'fire-glow', colors: '#ff6b35,#f7931e,#ff0000', is_premium: true },
        { id: 'electric', name: 'Lightning', frame_type: 'animated', css_animation: 'electric-pulse', colors: '#00d4ff,#0099ff,#ffffff', is_premium: true },
        { id: 'rainbow', name: 'Rainbow', frame_type: 'animated', css_animation: 'rainbow-rotate', colors: 'rainbow', is_premium: true },
        { id: 'golden', name: 'Golden Aura', frame_type: 'animated', css_animation: 'golden-shimmer', colors: '#ffd700,#ffb347,#ff8c00', is_premium: true },
        { id: 'neon', name: 'Neon Pulse', frame_type: 'animated', css_animation: 'neon-pulse', colors: '#ff00ff,#00ffff,#ff00ff', is_premium: true },
      ]);
      setCurrentFrame("fire");
      setTournaments(DEMO_TOURNAMENTS);
      setJoinedTournaments(new Set([1]));
      setLoading(false);
    } else if (user) {
      // User is logged in, fetch their data
      fetchStatus();
    } else if (!isPending) {
      // Not logged in and auth check is complete
      setLoading(false);
    }
  }, [user, isPending, isDemo]);

  useEffect(() => {
    if (showCustomize && !customOptions && !isDemo) {
      fetchCustomizationOptions();
    }
  }, [showCustomize]);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/retropass/status");
      const data = await res.json();
      setHasRetroPass(data.hasRetroPass);
      setSubscription(data.subscription);
      
      if (data.hasRetroPass) {
        setSelectedIcon(data.subscription?.leaderboard_icon || "");
        setSelectedColor(data.subscription?.leaderboard_color || "");
        setSelectedTitle(data.subscription?.display_title || "");
        
        const couponsRes = await fetch("/api/retropass/coupons");
        const couponsData = await couponsRes.json();
        setCoupons(couponsData.coupons || []);
        
        // Fetch additional RetroPass features
        fetchMysteryBox();
        fetchLoginStreak();
        fetchFrames();
        fetchTournaments();
      }
    } catch (error) {
      console.error("Failed to fetch RetroPass status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomizationOptions = async () => {
    try {
      const res = await fetch("/api/retropass/customization-options");
      const data = await res.json();
      setCustomOptions(data);
    } catch (error) {
      console.error("Failed to fetch customization options:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    setSubscribing(true);
    try {
      const res = await fetch("/api/retropass/subscribe", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to start subscription:", error);
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(t("retropass.confirmCancel") || "Are you sure you want to cancel your RetroPass subscription?")) {
      return;
    }
    
    try {
      const res = await fetch("/api/retropass/cancel", { method: "POST" });
      if (res.ok) {
        fetchStatus();
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    }
  };

  const handleSaveCustomization = async () => {
    if (isDemo) {
      // Demo mode: just close the modal, state already updated locally
      setShowCustomize(false);
      return;
    }
    
    setSaving(true);
    try {
      await fetch("/api/retropass/customize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          icon: selectedIcon || null,
          color: selectedColor || null,
          title: selectedTitle || null
        })
      });
      setShowCustomize(false);
      fetchStatus();
    } catch (error) {
      console.error("Failed to save customization:", error);
    } finally {
      setSaving(false);
    }
  };

  const fetchMysteryBox = async () => {
    try {
      const res = await fetch("/api/retropass/mystery-box");
      const data = await res.json();
      setMysteryBox(data.mysteryBox);
    } catch (error) {
      console.error("Failed to fetch mystery box:", error);
    }
  };

  const handleOpenMysteryBox = async () => {
    if (isDemo) {
      // Demo: simulate opening
      setOpeningBox(true);
      setTimeout(() => {
        setBoxReward({ type: "tickets", value: "500" });
        setMysteryBox(prev => prev ? { ...prev, is_opened: true, reward_type: "tickets", reward_value: "500" } : null);
        setOpeningBox(false);
      }, 2000);
      return;
    }
    
    setOpeningBox(true);
    try {
      const res = await fetch("/api/retropass/mystery-box/open", { method: "POST" });
      const data = await res.json();
      if (data.reward) {
        setBoxReward(data.reward);
        fetchMysteryBox();
        fetchStatus(); // Refresh tickets if earned
      }
    } catch (error) {
      console.error("Failed to open mystery box:", error);
    } finally {
      setOpeningBox(false);
    }
  };

  const fetchLoginStreak = async () => {
    try {
      const res = await fetch("/api/retropass/login-streak");
      const data = await res.json();
      setLoginStreak(data);
    } catch (error) {
      console.error("Failed to fetch login streak:", error);
    }
  };

  const handleCheckIn = async () => {
    if (isDemo) {
      // Demo: simulate check-in
      setCheckingIn(true);
      setTimeout(() => {
        setLoginStreak(prev => prev ? { 
          ...prev, 
          current_streak: prev.current_streak + 1, 
          can_checkin: false,
          today_reward: { type: "tickets", value: 150 }
        } : null);
        setCheckingIn(false);
      }, 1000);
      return;
    }
    
    setCheckingIn(true);
    try {
      const res = await fetch("/api/retropass/login-streak/checkin", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchLoginStreak();
        fetchStatus(); // Refresh tickets
      }
    } catch (error) {
      console.error("Failed to check in:", error);
    } finally {
      setCheckingIn(false);
    }
  };

  const fetchFrames = async () => {
    try {
      const res = await fetch("/api/retropass/frames");
      const data = await res.json();
      setFrames(data.frames || []);
      setCurrentFrame(data.currentFrame || "none");
    } catch (error) {
      console.error("Failed to fetch frames:", error);
    }
  };

  const fetchTournaments = async () => {
    try {
      const res = await fetch("/api/retropass/tournaments");
      const data = await res.json();
      setTournaments(data.tournaments || []);
    } catch (error) {
      console.error("Failed to fetch tournaments:", error);
    }
  };

  const handleJoinTournament = async (tournamentId: number) => {
    if (isDemo) {
      setJoinedTournaments(prev => new Set([...prev, tournamentId]));
      return;
    }
    
    setJoiningTournament(tournamentId);
    try {
      const res = await fetch(`/api/retropass/tournaments/${tournamentId}/join`, {
        method: "POST"
      });
      if (res.ok) {
        setJoinedTournaments(prev => new Set([...prev, tournamentId]));
        fetchTournaments();
      }
    } catch (error) {
      console.error("Failed to join tournament:", error);
    } finally {
      setJoiningTournament(null);
    }
  };

  const handleSetFrame = async (frameId: string) => {
    if (isDemo) {
      setCurrentFrame(frameId);
      setShowFrameModal(false);
      return;
    }
    
    setSavingFrame(true);
    try {
      await fetch("/api/retropass/frames/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameId })
      });
      setCurrentFrame(frameId);
      setShowFrameModal(false);
    } catch (error) {
      console.error("Failed to set frame:", error);
    } finally {
      setSavingFrame(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Detect if user is from Brazil
  const isBrazilian = typeof navigator !== 'undefined' && 
    (navigator.language === 'pt-BR' || navigator.language.startsWith('pt'));

  // Premium benefits list with diverse colors
  const benefits = [
    { icon: Ticket, title: t("retropass.benefit1Title") || "5,000 Tickets/Month", desc: t("retropass.benefit1Desc") || "Play 50 games free every month", color: "#06B6D4", bgColor: "rgba(6, 182, 212, 0.15)" },
    { icon: Gift, title: t("retropass.benefit2Title") || "5 Exclusive Coupons", desc: t("retropass.benefit2Desc") || "15% off on all purchases", color: "#E673AA", bgColor: "rgba(230, 115, 170, 0.15)" },
    { icon: Diamond, title: t("retropass.benefit3Title") || "Diamond Badge", desc: t("retropass.benefit3Desc") || "Instant legendary status", color: "#A855F7", bgColor: "rgba(168, 85, 247, 0.15)" },
    { icon: Palette, title: t("retropass.benefit4Title") || "Custom Leaderboard", desc: t("retropass.benefit4Desc") || "Unique icons, colors & titles", color: "#22C55E", bgColor: "rgba(34, 197, 94, 0.15)" },
    { icon: Crown, title: t("retropass.benefit5Title") || "Exclusive Page", desc: t("retropass.benefit5Desc") || "Access to premium features", color: "#F97316", bgColor: "rgba(249, 115, 22, 0.15)" },
    { icon: Zap, title: t("retropass.benefit6Title") || "Priority Support", desc: t("retropass.benefit6Desc") || "Get help faster", color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.15)" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] overflow-x-hidden">
      {/* Animated starfield background - spaceship advancing through space */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Deep space gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, #0a0a1f 0%, #050510 50%, #000 100%)"
          }}
        />
        
        {/* Distant nebula glow */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
          style={{
            background: "radial-gradient(circle, #4B0082 0%, transparent 70%)",
            top: "-100px",
            right: "-100px",
          }}
        />
        
        {/* Passing stars - multiple layers for depth */}
        {/* Layer 1 - Slow distant stars */}
        {Array.from({ length: 40 }).map((_, i) => {
          const colors = ["#FFD700", "#E673AA", "#00BFFF", "#FFFFFF", "#FF6B6B", "#7B68EE"];
          const color = colors[i % colors.length];
          const size = 1 + Math.random() * 1.5;
          return (
            <div
              key={`star1-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                boxShadow: `0 0 ${size * 2}px ${color}`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `starPass ${8 + Math.random() * 6}s linear infinite`,
                animationDelay: `${Math.random() * 8}s`,
                opacity: 0.6 + Math.random() * 0.4
              }}
            />
          );
        })}
        
        {/* Layer 2 - Medium speed stars */}
        {Array.from({ length: 30 }).map((_, i) => {
          const colors = ["#FFFFFF", "#FFD700", "#00CED1", "#FF69B4", "#98FB98"];
          const color = colors[i % colors.length];
          const size = 1.5 + Math.random() * 2;
          return (
            <div
              key={`star2-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                boxShadow: `0 0 ${size * 3}px ${color}`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `starPass ${5 + Math.random() * 4}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: 0.7 + Math.random() * 0.3
              }}
            />
          );
        })}
        
        {/* Layer 3 - Fast close stars with trails */}
        {Array.from({ length: 20 }).map((_, i) => {
          const colors = ["#FFD700", "#FFFFFF", "#00FFFF", "#FF1493"];
          const color = colors[i % colors.length];
          const size = 2 + Math.random() * 2;
          return (
            <div
              key={`star3-${i}`}
              className="absolute"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                boxShadow: `0 0 ${size * 4}px ${color}, -20px 0 ${size * 6}px ${color}40, -40px 0 ${size * 4}px ${color}20`,
                borderRadius: "50%",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `starPass ${2 + Math.random() * 3}s linear infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          );
        })}
        
        {/* Grid pattern - subtle space grid */}
        <div 
          className="absolute inset-0 opacity-3"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 215, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 215, 0, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            transform: "perspective(500px) rotateX(60deg)",
            transformOrigin: "center bottom"
          }}
        />
      </div>

      <Header />
      
      <main className="flex-1 relative z-10">
        {/* Success/Cancel banners */}
        {/* Demo mode banner */}
        {isDemo && (
          <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/30 py-4 px-4 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">DEMO MODE - Visualização de usuário RetroPass inscrito</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-gradient-to-r from-green-500/20 via-green-500/10 to-green-500/20 border-b border-green-500/30 py-4 px-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{t("retropass.welcomeMessage") || "Welcome to RetroPass! Your premium benefits are now active."}</span>
            </div>
          </div>
        )}
        
        {cancelled && (
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border-b border-amber-500/30 py-4 px-4 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <X className="w-5 h-5" />
              <span>{t("retropass.checkoutCancelled") || "Checkout was cancelled. You can subscribe anytime."}</span>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            {/* RetroPass Logo */}
            <div className="relative inline-block mb-8">
              <div 
                className="absolute inset-0 blur-3xl opacity-50"
                style={{ background: "radial-gradient(circle, #FFD700, #E673AA)" }}
              />
              <div className="relative">
                <div 
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(230, 115, 170, 0.2))",
                    border: "2px solid rgba(255, 215, 0, 0.5)",
                    boxShadow: "0 0 60px rgba(255, 215, 0, 0.3), inset 0 0 30px rgba(255, 215, 0, 0.1)"
                  }}
                >
                  <Crown className="w-12 h-12 text-yellow-400" />
                  <span 
                    className="text-5xl md:text-6xl font-bold"
                    style={{
                      fontFamily: "'VT323', monospace",
                      background: "linear-gradient(135deg, #FFD700, #FFA500, #E673AA)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 0 40px rgba(255, 215, 0, 0.5)"
                    }}
                  >
                    RETROPASS
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>
              {t("retropass.tagline") || "The ultimate premium experience for true retro gaming enthusiasts"}
            </p>
            
            {/* Price tag */}
            <div className="inline-flex items-baseline gap-2 mb-8">
              <span className="text-5xl font-bold text-yellow-400" style={{ fontFamily: "'VT323', monospace" }}>
                {isBrazilian ? "R$24,90" : "$4.99"}
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-400">{t("retropass.perMonth") || "month"}</span>
            </div>
          </div>

          {/* Subscriber Dashboard OR Subscribe CTA */}
          {hasRetroPass && subscription ? (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Status Card */}
              <div 
                className="rounded-3xl p-8 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(230, 115, 170, 0.05))",
                  border: "2px solid rgba(255, 215, 0, 0.3)"
                }}
              >
                {/* Decorative corners */}
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-yellow-500/50 rounded-tl" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-yellow-500/50 rounded-tr" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-yellow-500/50 rounded-bl" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-yellow-500/50 rounded-br" />

                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* User avatar with badge */}
                  <div className="relative">
                    <div 
                      className="w-32 h-32 rounded-full flex items-center justify-center text-5xl"
                      style={{
                        background: "linear-gradient(135deg, #FFD700, #FFA500)",
                        boxShadow: "0 0 40px rgba(255, 215, 0, 0.4)"
                      }}
                    >
                      {(() => {
                        const iconName = customOptions?.icons.find(i => i.id === selectedIcon)?.icon || "Crown";
                        const IconComponent = ICON_MAP[iconName] || Crown;
                        return <IconComponent className="w-16 h-16 text-white" />;
                      })()}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full p-2">
                      <Diamond className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* User info */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <span 
                        className="text-2xl font-bold"
                        style={{ 
                          color: selectedColor || "#FFD700",
                          fontFamily: "'VT323', monospace"
                        }}
                      >
                        {isDemo ? "RetroGamer" : user?.email?.split("@")[0]}
                      </span>
                      {selectedTitle && (
                        <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-sm">
                          {selectedTitle}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 flex items-center justify-center md:justify-start gap-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      {t("retropass.memberSince") || "RetroPass Member since"} {formatDate(subscription.current_period_end)}
                    </p>
                    {subscription.cancelled_at && (
                      <p className="text-amber-400 text-sm mt-1">
                        {t("retropass.cancelledNotice") || "Subscription ends on"} {formatDate(subscription.current_period_end)}
                      </p>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400" style={{ fontFamily: "'VT323', monospace" }}>
                        {subscription.ticketBalance.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">{t("retropass.tickets") || "Tickets"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-pink-400" style={{ fontFamily: "'VT323', monospace" }}>
                        {subscription.availableCoupons}
                      </div>
                      <div className="text-sm text-gray-400">{t("retropass.coupons") || "Coupons"}</div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap justify-center md:justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => setShowCustomize(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    {t("retropass.customize") || "Customize"}
                  </button>
                  <button
                    onClick={() => navigate("/arcade")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-all"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    {t("retropass.playArcade") || "Play Arcade"}
                  </button>
                  {!subscription.cancelled_at && !isDemo && (
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                    >
                      {t("retropass.cancelSubscription") || "Cancel"}
                    </button>
                  )}
                </div>
              </div>

              {/* Coupons Section */}
              <div 
                className="rounded-3xl p-8"
                style={{
                  background: "linear-gradient(135deg, rgba(230, 115, 170, 0.1), rgba(255, 215, 0, 0.05))",
                  border: "1px solid rgba(230, 115, 170, 0.2)"
                }}
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "'VT323', monospace" }}>
                  <Gift className="w-7 h-7 text-pink-400" />
                  {t("retropass.yourCoupons") || "Your Coupons"}
                </h2>

                {coupons.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">{t("retropass.noCoupons") || "No coupons available"}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.filter(c => !c.is_used).map((coupon) => (
                      <div
                        key={coupon.id}
                        className="relative rounded-xl p-4 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20"
                      >
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 text-xs">
                          -{coupon.discount_percent}%
                        </div>
                        <div className="font-mono text-lg text-white mb-2">{coupon.code}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t("retropass.expiresOn") || "Expires"} {formatDate(coupon.expires_at)}
                          </span>
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className="p-1.5 rounded hover:bg-white/10 transition-colors"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {coupons.filter(c => c.is_used).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-sm text-gray-500 mb-3">{t("retropass.usedCoupons") || "Used Coupons"}</h3>
                    <div className="flex flex-wrap gap-2">
                      {coupons.filter(c => c.is_used).map((coupon) => (
                        <div
                          key={coupon.id}
                          className="px-3 py-1 rounded bg-white/5 text-gray-500 text-sm line-through"
                        >
                          {coupon.code}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mystery Box Section */}
              <div className="rounded-2xl p-6 border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-pink-900/20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.3),transparent_70%)]" />
                </div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-20 h-20 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 ${!mysteryBox?.is_opened && !openingBox ? 'animate-pulse' : ''}`}>
                        <Package className={`w-10 h-10 text-white ${openingBox ? 'animate-bounce' : ''}`} />
                      </div>
                      {!mysteryBox?.is_opened && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
                        {t("retropass.mysteryBox") || "Monthly Mystery Box"}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {mysteryBox?.is_opened 
                          ? (t("retropass.boxOpened") || "Already opened this month!")
                          : (t("retropass.boxAvailable") || "A surprise awaits you!")
                        }
                      </p>
                    </div>
                  </div>
                  
                  {boxReward ? (
                    <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40">
                      <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                      <div>
                        <div className="text-sm text-amber-300">{t("retropass.youWon") || "You won:"}</div>
                        <div className="text-lg font-bold text-white">
                          {boxReward.type === "tickets" && `🎟️ ${boxReward.value} Tickets`}
                          {boxReward.type === "coupon" && `🏷️ ${boxReward.value}% Coupon`}
                          {boxReward.type === "frame" && `🖼️ ${boxReward.value} Frame`}
                          {boxReward.type === "title" && `👑 "${boxReward.value}" Title`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleOpenMysteryBox}
                      disabled={mysteryBox?.is_opened || openingBox}
                      className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                        mysteryBox?.is_opened
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30'
                      }`}
                      style={{ fontFamily: "'VT323', monospace" }}
                    >
                      {openingBox ? (
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 animate-spin" />
                          {t("retropass.opening") || "Opening..."}
                        </span>
                      ) : mysteryBox?.is_opened ? (
                        t("retropass.alreadyOpened") || "Already Opened"
                      ) : (
                        t("retropass.openBox") || "🎁 Open Box"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Login Streak Section */}
              <div className="rounded-2xl p-6 border-2 border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-red-900/20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500">
                      <Flame className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
                        {t("retropass.loginStreak") || "Daily Login Streak"}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-400" />
                          <span className="text-orange-400 font-bold">{loginStreak?.current_streak || 0}</span>
                          <span className="text-gray-500 text-sm">{t("retropass.days") || "days"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <Trophy className="w-4 h-4" />
                          <span>{t("retropass.best") || "Best:"} {loginStreak?.longest_streak || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* 7-day streak display */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const isCompleted = day <= (loginStreak?.current_streak || 0) % 7 || (loginStreak?.current_streak || 0) >= 7;
                        return (
                          <div
                            key={day}
                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                              isCompleted
                                ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
                                : 'bg-white/10 text-gray-500'
                            }`}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleCheckIn}
                      disabled={!loginStreak?.can_checkin || checkingIn}
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        !loginStreak?.can_checkin
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30'
                      }`}
                      style={{ fontFamily: "'VT323', monospace" }}
                    >
                      {checkingIn ? (
                        <CalendarCheck className="w-5 h-5 animate-spin" />
                      ) : !loginStreak?.can_checkin ? (
                        <span className="flex items-center gap-2">
                          <Check className="w-5 h-5" />
                          {t("retropass.checkedIn") || "Done!"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          {t("retropass.checkIn") || "Check In"}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {loginStreak?.today_reward && loginStreak.can_checkin && (
                  <div className="mt-4 pt-4 border-t border-orange-500/20 flex items-center justify-center gap-2 text-orange-300 text-sm">
                    <Gift className="w-4 h-4" />
                    {t("retropass.todayReward") || "Today's reward:"} +{loginStreak.today_reward.value} {loginStreak.today_reward.type}
                  </div>
                )}
              </div>

              {/* Avatar Frames Section */}
              <div className="rounded-2xl p-6 border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-blue-900/20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500"
                        style={{
                          boxShadow: currentFrame !== 'none' 
                            ? `0 0 20px ${frames.find(f => f.id === currentFrame)?.colors.split(',')[0] || '#00d4ff'}`
                            : undefined,
                          animation: currentFrame !== 'none' ? 'pulse 2s infinite' : undefined
                        }}
                      >
                        <Frame className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
                        {t("retropass.avatarFrames") || "Avatar Frames"}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {t("retropass.currentFrame") || "Current:"}{" "}
                        <span className="text-cyan-400 font-semibold">
                          {frames.find(f => f.id === currentFrame)?.name || "None"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowFrameModal(true)}
                    className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                    style={{ fontFamily: "'VT323', monospace" }}
                  >
                    <span className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      {t("retropass.chooseFrame") || "Choose Frame"}
                    </span>
                  </button>
                </div>

                {/* Frame preview row */}
                <div className="mt-4 pt-4 border-t border-cyan-500/20 flex justify-center gap-3 overflow-x-auto pb-2">
                  {frames.slice(0, 6).map((frame) => (
                    <div
                      key={frame.id}
                      className={`w-12 h-12 rounded-full flex-shrink-0 cursor-pointer transition-all ${
                        currentFrame === frame.id ? 'ring-2 ring-cyan-400 scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        background: frame.id === 'none' 
                          ? 'rgba(255,255,255,0.1)' 
                          : `linear-gradient(135deg, ${frame.colors.split(',').slice(0, 2).join(', ')})`,
                        boxShadow: frame.id !== 'none' ? `0 0 10px ${frame.colors.split(',')[0]}60` : undefined
                      }}
                      onClick={() => handleSetFrame(frame.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Tournaments Section */}
              <div className="rounded-2xl p-6 border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
                      {t("retropass.tournaments") || "Weekly Tournaments"}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {t("retropass.tournamentsDesc") || "Compete for glory and exclusive prizes"}
                    </p>
                  </div>
                </div>

                {tournaments.length > 0 ? (
                  <div className="space-y-4">
                    {tournaments.map((tournament) => {
                      const isJoined = joinedTournaments.has(tournament.id);
                      const startDate = new Date(tournament.start_date);
                      const endDate = new Date(tournament.end_date);
                      const now = new Date();
                      const isActive = now >= startDate && now <= endDate;
                      const hasEnded = now > endDate;
                      
                      return (
                        <div
                          key={tournament.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isActive 
                              ? 'border-purple-500/50 bg-purple-500/10' 
                              : hasEnded 
                                ? 'border-gray-600/30 bg-gray-800/20 opacity-60'
                                : 'border-purple-500/20 bg-purple-500/5'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                isActive ? 'bg-purple-500' : 'bg-purple-500/30'
                              }`}>
                                <Swords className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-white">{tournament.name}</h4>
                                  {isActive && (
                                    <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded-full animate-pulse">
                                      {t("retropass.live") || "LIVE"}
                                    </span>
                                  )}
                                  {hasEnded && (
                                    <span className="px-2 py-0.5 text-xs bg-gray-500 text-white rounded-full">
                                      {t("retropass.ended") || "ENDED"}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400">{tournament.description}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {tournament.participant_count || 0} {t("retropass.participants") || "participants"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-xs text-gray-400">{t("retropass.prize") || "Prize"}</div>
                                <div className="font-bold text-yellow-400 flex items-center gap-1">
                                  <Star className="w-4 h-4" />
                                  {tournament.prize_pool}
                                </div>
                              </div>
                              
                              {!hasEnded && (
                                isJoined ? (
                                  <button
                                    className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                                  >
                                    <span className="flex items-center gap-2">
                                      <Check className="w-4 h-4" />
                                      {t("retropass.joined") || "Joined"}
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleJoinTournament(tournament.id)}
                                    disabled={joiningTournament === tournament.id}
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:scale-105 transition-all disabled:opacity-50"
                                  >
                                    {joiningTournament === tournament.id ? (
                                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      t("retropass.join") || "Join"
                                    )}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{t("retropass.noTournaments") || "No active tournaments right now"}</p>
                    <p className="text-sm">{t("retropass.checkBack") || "Check back soon for new competitions!"}</p>
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate("/arcade")}
                  className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <Gamepad2 className="w-8 h-8 text-cyan-400" />
                    <div className="text-left">
                      <div className="font-bold text-white">{t("retropass.goToArcade") || "Arcade"}</div>
                      <div className="text-sm text-gray-400">{t("retropass.playGames") || "Play games & earn more"}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                </button>

                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <Users className="w-8 h-8 text-purple-400" />
                    <div className="text-left">
                      <div className="font-bold text-white">{t("retropass.myProfile") || "My Profile"}</div>
                      <div className="text-sm text-gray-400">{t("retropass.viewBadges") || "View badges & stats"}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                </button>

                <button
                  onClick={() => navigate("/")}
                  className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <Trophy className="w-8 h-8 text-amber-400" />
                    <div className="text-left">
                      <div className="font-bold text-white">{t("retropass.shop") || "Shop"}</div>
                      <div className="text-sm text-gray-400">{t("retropass.useCoupons") || "Use your coupons"}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-amber-400 transition-colors" />
                </button>
              </div>
            </div>
          ) : (
            /* Non-subscriber view - Benefits showcase */
            <div className="max-w-6xl mx-auto">
              {/* Benefits grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className="group relative rounded-2xl p-6 transition-all hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${benefit.bgColor}, rgba(255, 255, 255, 0.02))`,
                      border: "2px solid rgba(255, 215, 0, 0.3)",
                      boxShadow: "0 4px 20px rgba(255, 215, 0, 0.1)"
                    }}
                  >
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: `linear-gradient(135deg, ${benefit.bgColor}, rgba(255, 215, 0, 0.08))`
                      }}
                    />
                    <div className="relative">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                        style={{
                          background: benefit.bgColor,
                          boxShadow: `0 0 20px ${benefit.color}40`
                        }}
                      >
                        <benefit.icon className="w-7 h-7" style={{ color: benefit.color }} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'VT323', monospace" }}>
                        {benefit.title}
                      </h3>
                      <p className="text-gray-400 text-sm">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Section */}
              <div 
                className="text-center rounded-3xl p-12 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(230, 115, 170, 0.1))",
                  border: "2px solid rgba(255, 215, 0, 0.3)"
                }}
              >
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.1), transparent)",
                    animation: "shimmer 3s infinite"
                  }}
                />
                
                <div className="relative">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
                    <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
                    <Star className="w-6 h-6 text-yellow-400 animate-pulse" style={{ animationDelay: "1s" }} />
                  </div>
                  
                  <h2 
                    className="text-3xl md:text-4xl font-bold mb-4"
                    style={{
                      fontFamily: "'VT323', monospace",
                      background: "linear-gradient(135deg, #FFD700, #E673AA)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent"
                    }}
                  >
                    {t("retropass.joinNow") || "Join RetroPass Today"}
                  </h2>
                  
                  <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                    {t("retropass.joinDesc") || "Unlock all premium benefits and become a legend in the retromynd community."}
                  </p>
                  
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #FFD700, #FFA500)",
                      color: "#000",
                      boxShadow: "0 0 40px rgba(255, 215, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3)"
                    }}
                  >
                    <Crown className="w-6 h-6" />
                    <span style={{ fontFamily: "'VT323', monospace" }}>
                      {subscribing 
                        ? (t("retropass.processing") || "Processing...") 
                        : (t("retropass.subscribe") || "SUBSCRIBE FOR $4.99/mo")}
                    </span>
                  </button>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    {t("retropass.cancelAnytime") || "Cancel anytime. No commitment."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Customization Modal */}
      {showCustomize && customOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8"
            style={{
              background: "linear-gradient(135deg, #1a1a2e, #16213e)",
              border: "2px solid rgba(255, 215, 0, 0.3)"
            }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 
                className="text-2xl font-bold text-yellow-400"
                style={{ fontFamily: "'VT323', monospace" }}
              >
                {t("retropass.customizeLeaderboard") || "Customize Your Leaderboard Look"}
              </h2>
              <button
                onClick={() => setShowCustomize(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Preview */}
            <div className="mb-8 p-6 rounded-xl bg-black/40 border border-white/10">
              <div className="text-sm text-gray-500 mb-3">{t("retropass.preview") || "Preview"}</div>
              <div className="flex items-center gap-4">
                <span className="text-2xl">
                  {(() => {
                    const iconName = customOptions.icons.find(i => i.id === selectedIcon)?.icon || "Crown";
                    const IconComponent = ICON_MAP[iconName] || Crown;
                    return <IconComponent className="w-6 h-6 text-yellow-400" />;
                  })()}
                </span>
                <span 
                  className="text-xl font-bold"
                  style={{ 
                    color: customOptions.colors.find(c => c.id === selectedColor)?.hex || "#FFD700",
                    fontFamily: "'VT323', monospace"
                  }}
                >
                  {user?.email?.split("@")[0]}
                </span>
                {selectedTitle && (
                  <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-sm">
                    {customOptions.titles.find(t => t.id === selectedTitle)?.name}
                  </span>
                )}
              </div>
            </div>

            {/* Icon selection */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-3">{t("retropass.selectIcon") || "Select Icon"}</label>
              <div className="grid grid-cols-8 gap-2">
                {customOptions.icons.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => setSelectedIcon(icon.id)}
                    className={`p-3 rounded-lg text-2xl transition-all ${
                      selectedIcon === icon.id 
                        ? "bg-yellow-500/20 ring-2 ring-yellow-500" 
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {(() => {
                      const IconComponent = ICON_MAP[icon.icon || "Crown"] || Crown;
                      return <IconComponent className="w-6 h-6" />;
                    })()}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selection */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-3">{t("retropass.selectColor") || "Select Name Color"}</label>
              <div className="grid grid-cols-5 gap-2">
                {customOptions.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`p-3 rounded-lg flex items-center gap-2 transition-all ${
                      selectedColor === color.id 
                        ? "ring-2 ring-white" 
                        : "hover:ring-1 hover:ring-white/30"
                    }`}
                    style={{ backgroundColor: `${color.hex}20` }}
                  >
                    <div 
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-sm text-gray-300">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title selection */}
            <div className="mb-8">
              <label className="block text-sm text-gray-400 mb-3">{t("retropass.selectTitle") || "Select Title"}</label>
              <div className="grid grid-cols-5 gap-2">
                {customOptions.titles.map((title) => (
                  <button
                    key={title.id}
                    onClick={() => setSelectedTitle(title.id)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      selectedTitle === title.id 
                        ? "bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500" 
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {title.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowCustomize(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all"
              >
                {t("retropass.cancel") || "Cancel"}
              </button>
              <button
                onClick={handleSaveCustomization}
                disabled={saving}
                className="flex-1 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #FFD700, #FFA500)",
                  color: "#000"
                }}
              >
                {saving ? (t("retropass.saving") || "Saving...") : (t("retropass.saveChanges") || "Save Changes")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Frame Selection Modal */}
      {showFrameModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-8 border-2 border-cyan-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
                {t("retropass.selectFrame") || "Select Avatar Frame"}
              </h3>
              <button
                onClick={() => setShowFrameModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6">
              {frames.map((frame) => (
                <button
                  key={frame.id}
                  onClick={() => handleSetFrame(frame.id)}
                  disabled={savingFrame}
                  className={`relative p-4 rounded-xl transition-all ${
                    currentFrame === frame.id
                      ? 'ring-2 ring-cyan-400 bg-cyan-500/20'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div
                    className="w-16 h-16 mx-auto rounded-full mb-2"
                    style={{
                      background: frame.id === 'none'
                        ? 'rgba(255,255,255,0.1)'
                        : `linear-gradient(135deg, ${frame.colors.split(',').slice(0, 2).join(', ')})`,
                      boxShadow: frame.id !== 'none' ? `0 0 15px ${frame.colors.split(',')[0]}60` : undefined,
                      animation: frame.is_animated && frame.id !== 'none' ? 'pulse 2s infinite' : undefined
                    }}
                  />
                  <div className="text-center">
                    <div className="text-sm font-semibold text-white">{frame.name}</div>
                    {frame.is_animated && frame.id !== 'none' && (
                      <span className="text-xs text-cyan-400">✨ Animated</span>
                    )}
                  </div>
                  {currentFrame === frame.id && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFrameModal(false)}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition-all"
              style={{ fontFamily: "'VT323', monospace" }}
            >
              {t("retropass.done") || "Done"}
            </button>
          </div>
        </div>
      )}

      <Footer />

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-20px); opacity: 0.8; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes starPass {
          0% {
            transform: translateX(-50px);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            transform: translateX(calc(100vw + 100px));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
