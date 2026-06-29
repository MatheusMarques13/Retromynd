import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";
import { AlertTriangle } from "lucide-react";
import {
  User,
  Gamepad2,
  Trophy,
  Medal,
  Star,
  Settings,
  Eye,
  EyeOff,
  Save,
  Check,
  X,
  Palette,
  Heart,
  Crown,
  Zap,
  Target,
  Clock,
  Share2,
  Package,
  ShoppingCart,
  Sparkles,
  Gem,
  Rocket,
  Ghost,
  Cat,
  Dog,
  Bird,
  Fish,
  Skull,
  Flame,
  Sword,
  Shield,
  Music,
  Camera,
  Headphones,
  Joystick,
  Bot,
  Swords,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

// Icon mapping for dynamic icon rendering
const ICON_MAP: Record<string, LucideIcon> = {
  Gamepad2, Trophy, Medal, Star, Crown, Zap, Target, Heart,
  Package, ShoppingCart, Sparkles, Gem, Rocket, Ghost,
  Cat, Dog, Bird, Fish, Skull, Flame, Sword, Shield,
  Music, Camera, Headphones, User, Joystick, Bot, Swords, Wand2,
};

interface AvatarPreset {
  id: string;
  name: string;
  icon: string;
}

interface Badge {
  badge_id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  earned_at: string;
}

interface GameSession {
  game_type: string;
  high_score: number;
  times_played: number;
  total_tickets: number;
}

interface ProfileData {
  id: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_preset: string;
  bio: string | null;
  theme_color: string;
  favorite_game: string | null;
  display_badges: string | null;
  is_public: number;
  total_games_played: number;
  total_score: number;
  profile_views: number;
  created_at: string;
}

interface ArcadeStats {
  total_tickets: number;
  tickets_spent: number;
  games_played: number;
  high_scores?: string;
}

const THEME_COLORS = [
  { id: "pink", color: "#E673AA", name: "Retro Pink" },
  { id: "cyan", color: "#06B6D4", name: "Cyber Cyan" },
  { id: "purple", color: "#A855F7", name: "Neon Purple" },
  { id: "green", color: "#22C55E", name: "Matrix Green" },
  { id: "orange", color: "#F97316", name: "Sunset Orange" },
  { id: "blue", color: "#3B82F6", name: "Electric Blue" },
  { id: "yellow", color: "#EAB308", name: "Golden Yellow" },
  { id: "red", color: "#EF4444", name: "Fire Red" },
];

const GAME_NAMES: Record<string, string> = {
  "2048": "2048",
  tetris: "Tetris",
  snake: "Snake",
  breakout: "Breakout",
  memory: "Memory",
  flappy: "Flappy Bird",
  pong: "Pong",
  asteroids: "Asteroids",
  invaders: "Space Invaders",
  pacman: "Pac-Man",
  frogger: "Frogger",
  dino: "Dino Run",
  minesweeper: "Minesweeper",
  sudoku: "Sudoku",
  wordle: "Wordle",
  sliding: "Sliding Puzzle",
  lights: "Lights Out",
  fifteen: "Fifteen Puzzle",
  helicopter: "Helicopter",
  tanks: "Tanks",
  shooter: "Space Shooter",
  dodge: "Dodge Ball",
  platformer: "Platformer",
  racing: "Racing",
  blackjack: "Blackjack",
  solitaire: "Solitaire",
  tictactoe: "Tic-Tac-Toe",
  connect4: "Connect 4",
  reversi: "Reversi",
  simon: "Simon Says",
  reaction: "Reaction Test",
  aim: "Aim Trainer",
  typing: "Typing Speed",
  color: "Color Match",
  math: "Math Blitz",
  sequence: "Sequence Memory",
};

// Demo data for preview testing
const DEMO_PROFILE: ProfileData = {
  id: 1,
  user_id: "demo-user-123",
  username: "RetroGamer99",
  display_name: "João Gamer",
  avatar_url: null,
  avatar_preset: "gameboy",
  bio: "Colecionador de jogos retrô e entusiasta de cultura geek desde os anos 90! 🎮",
  theme_color: "#E673AA",
  favorite_game: "tetris",
  display_badges: '["arcade_master","collector","first_purchase"]',
  is_public: 1,
  total_games_played: 342,
  total_score: 128450,
  profile_views: 89,
  created_at: "2024-01-15T10:00:00Z",
};

const DEMO_ARCADE_STATS: ArcadeStats = {
  total_tickets: 12850,
  tickets_spent: 4200,
  games_played: 342,
  high_scores: JSON.stringify({
    tetris: 98500,
    snake: 45200,
    "2048": 32768,
    pacman: 28400,
    breakout: 15600,
  }),
};

const DEMO_BADGES: Badge[] = [
  { badge_id: "arcade_master", name: "Arcade Master", description: "Played 100+ arcade games", icon: "Gamepad2", rarity: "epic", earned_at: "2024-06-15T10:00:00Z" },
  { badge_id: "collector", name: "Collector", description: "Own 10+ items", icon: "Package", rarity: "rare", earned_at: "2024-05-20T10:00:00Z" },
  { badge_id: "first_purchase", name: "First Purchase", description: "Made your first purchase", icon: "ShoppingCart", rarity: "common", earned_at: "2024-02-10T10:00:00Z" },
  { badge_id: "high_scorer", name: "High Scorer", description: "Scored 50,000+ points", icon: "Trophy", rarity: "legendary", earned_at: "2024-07-01T10:00:00Z" },
  { badge_id: "social_butterfly", name: "Social Butterfly", description: "Made 5+ friends", icon: "Sparkles", rarity: "uncommon", earned_at: "2024-04-12T10:00:00Z" },
];

const DEMO_GAME_SESSIONS: GameSession[] = [
  { game_type: "tetris", high_score: 98500, times_played: 87, total_tickets: 4250 },
  { game_type: "snake", high_score: 45200, times_played: 65, total_tickets: 2800 },
  { game_type: "2048", high_score: 32768, times_played: 42, total_tickets: 1950 },
  { game_type: "pacman", high_score: 28400, times_played: 38, total_tickets: 1600 },
  { game_type: "breakout", high_score: 15600, times_played: 31, total_tickets: 1200 },
  { game_type: "memory", high_score: 12800, times_played: 28, total_tickets: 850 },
  { game_type: "flappy", high_score: 156, times_played: 51, total_tickets: 200 },
];

export default function UserProfile() {
  const { t } = useLanguage();
  const location = useLocation();
  
  // Check if demo mode
  const isDemo = location.pathname === "/profile/demo";
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [arcadeStats, setArcadeStats] = useState<ArcadeStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [avatars, setAvatars] = useState<AvatarPreset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "achievements" | "stats">("profile");
  const [editMode, setEditMode] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    bio: "",
    avatar_preset: "gameboy",
    theme_color: "#E673AA",
    favorite_game: "",
    is_public: true,
  });

  useEffect(() => {
    if (isDemo) {
      // Load demo data
      setProfile(DEMO_PROFILE);
      setArcadeStats(DEMO_ARCADE_STATS);
      setBadges(DEMO_BADGES);
      setGameSessions(DEMO_GAME_SESSIONS);
      setFormData({
        username: DEMO_PROFILE.username,
        display_name: DEMO_PROFILE.display_name,
        bio: DEMO_PROFILE.bio || "",
        avatar_preset: DEMO_PROFILE.avatar_preset,
        theme_color: DEMO_PROFILE.theme_color,
        favorite_game: DEMO_PROFILE.favorite_game || "",
        is_public: DEMO_PROFILE.is_public === 1,
      });
      setLoading(false);
      loadAvatars();
    } else {
      loadProfile();
      loadAvatars();
    }
  }, [isDemo]);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();

      setProfile(data.profile);
      setArcadeStats(data.arcadeStats);
      setBadges(data.badges || []);
      setGameSessions(data.gameSessions || []);

      if (data.profile) {
        setFormData({
          username: data.profile.username || "",
          display_name: data.profile.display_name || "",
          bio: data.profile.bio || "",
          avatar_preset: data.profile.avatar_preset || "gameboy",
          theme_color: data.profile.theme_color || "#E673AA",
          favorite_game: data.profile.favorite_game || "",
          is_public: data.profile.is_public === 1,
        });
      }
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadAvatars = async () => {
    try {
      const res = await fetch("/api/profile/avatars");
      const data = await res.json();
      setAvatars(data.avatars || []);
    } catch {
      console.error("Failed to load avatars");
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile");
      }

      const data = await res.json();
      setProfile(data.profile);
      setSuccess(true);
      setEditMode(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const copyProfileLink = () => {
    if (profile?.username) {
      navigator.clipboard.writeText(`${window.location.origin}/profile/${profile.username}`);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const getAvatarIcon = (presetId: string) => {
    const avatar = avatars.find((a) => a.id === presetId);
    const iconName = avatar?.icon || "Gamepad2";
    const IconComponent = ICON_MAP[iconName];
    return IconComponent ? <IconComponent className="w-6 h-6" /> : <Gamepad2 className="w-6 h-6" />;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "from-yellow-400 to-amber-600";
      case "epic": return "from-purple-400 to-purple-600";
      case "rare": return "from-blue-400 to-blue-600";
      default: return "from-gray-400 to-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
      {/* Demo mode banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/30 py-3 px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">DEMO MODE - Perfil de Usuário</span>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <div
        className="relative pt-20 pb-32 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${formData.theme_color}20 0%, transparent 50%)`,
        }}
      >
        {/* Grid background */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(${formData.theme_color}40 1px, transparent 1px), linear-gradient(90deg, ${formData.theme_color}40 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          {/* Avatar and Name */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-6xl border-4 shadow-lg shadow-black/50"
              style={{
                borderColor: formData.theme_color,
                background: `linear-gradient(135deg, ${formData.theme_color}30, transparent)`,
                boxShadow: `0 0 30px ${formData.theme_color}40`,
              }}
            >
              {getAvatarIcon(formData.avatar_preset)}
            </div>

            <div className="text-center md:text-left">
              <h1
                className="text-4xl font-bold mb-2"
                style={{ color: formData.theme_color }}
              >
                {formData.display_name || formData.username}
              </h1>
              <p className="text-gray-400 text-lg">@{formData.username}</p>
              {formData.bio && (
                <p className="text-gray-300 mt-2 max-w-md">{formData.bio}</p>
              )}
            </div>

            <div className="flex-1" />

            <div className="flex gap-2">
              {formData.is_public && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyProfileLink}
                  className="border-gray-600 hover:border-cyan-400"
                >
                  {showCopied ? <Check className="w-4 h-4 mr-1" /> : <Share2 className="w-4 h-4 mr-1" />}
                  {showCopied ? t("profile.copied") : t("profile.shareProfile")}
                </Button>
              )}
              <Button
                variant={editMode ? "destructive" : "default"}
                size="sm"
                onClick={() => setEditMode(!editMode)}
                className={editMode ? "" : "bg-gradient-to-r from-pink-500 to-purple-500"}
              >
                {editMode ? <X className="w-4 h-4 mr-1" /> : <Settings className="w-4 h-4 mr-1" />}
                {editMode ? t("profile.cancel") : t("profile.editProfile")}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/40 backdrop-blur border border-gray-700 rounded-lg p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
              <div className="text-2xl font-bold text-white">{badges.length}</div>
              <div className="text-xs text-gray-400">{t("profile.badges")}</div>
            </div>
            <div className="bg-black/40 backdrop-blur border border-gray-700 rounded-lg p-4 text-center">
              <Gamepad2 className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
              <div className="text-2xl font-bold text-white">{arcadeStats?.games_played || 0}</div>
              <div className="text-xs text-gray-400">{t("profile.gamesPlayed")}</div>
            </div>
            <div className="bg-black/40 backdrop-blur border border-gray-700 rounded-lg p-4 text-center">
              <Star className="w-6 h-6 mx-auto mb-2 text-pink-400" />
              <div className="text-2xl font-bold text-white">{arcadeStats?.total_tickets || 0}</div>
              <div className="text-xs text-gray-400">{t("profile.totalTickets")}</div>
            </div>
            <div className="bg-black/40 backdrop-blur border border-gray-700 rounded-lg p-4 text-center">
              <Eye className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <div className="text-2xl font-bold text-white">{profile?.profile_views || 0}</div>
              <div className="text-xs text-gray-400">{t("profile.profileViews")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 pb-20 relative z-20">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {(["profile", "achievements", "stats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? "text-white shadow-lg"
                  : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
              style={
                activeTab === tab
                  ? { background: `linear-gradient(135deg, ${formData.theme_color}, ${formData.theme_color}aa)` }
                  : {}
              }
            >
              {tab === "profile" && <User className="w-4 h-4 inline mr-2" />}
              {tab === "achievements" && <Trophy className="w-4 h-4 inline mr-2" />}
              {tab === "stats" && <Target className="w-4 h-4 inline mr-2" />}
              {t(`profile.tab.${tab}`)}
            </button>
          ))}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {t("profile.saved")}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            {editMode ? (
              <div className="space-y-6">
                {/* Avatar Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    {t("profile.selectAvatar")}
                  </label>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setFormData({ ...formData, avatar_preset: avatar.id })}
                        className={`w-14 h-14 rounded-lg text-2xl flex items-center justify-center transition-all ${
                          formData.avatar_preset === avatar.id
                            ? "ring-2 scale-110"
                            : "bg-gray-700 hover:bg-gray-600"
                        }`}
                        style={
                          formData.avatar_preset === avatar.id
                            ? { boxShadow: `0 0 0 2px ${formData.theme_color}`, background: `${formData.theme_color}40` }
                            : {}
                        }
                      >
                        {(() => {
                          const IconComp = ICON_MAP[avatar.icon];
                          return IconComp ? <IconComp className="w-6 h-6" /> : <Gamepad2 className="w-6 h-6" />;
                        })()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <Palette className="w-4 h-4 inline mr-2" />
                    {t("profile.themeColor")}
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {THEME_COLORS.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setFormData({ ...formData, theme_color: theme.color })}
                        className={`w-10 h-10 rounded-full transition-all ${
                          formData.theme_color === theme.color ? "ring-2 ring-white scale-110" : ""
                        }`}
                        style={{ background: theme.color }}
                        title={theme.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("profile.username")}
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t("profile.usernameHint")}</p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("profile.displayName")}
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                    maxLength={50}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("profile.bio")}
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400 resize-none"
                    rows={3}
                    maxLength={200}
                  />
                </div>

                {/* Favorite Game */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Heart className="w-4 h-4 inline mr-2" />
                    {t("profile.favoriteGame")}
                  </label>
                  <select
                    value={formData.favorite_game}
                    onChange={(e) => setFormData({ ...formData, favorite_game: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">{t("profile.selectGame")}</option>
                    {Object.entries(GAME_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* Public Profile Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {formData.is_public ? (
                      <Eye className="w-5 h-5 text-green-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <div className="text-white font-medium">{t("profile.publicProfile")}</div>
                      <div className="text-xs text-gray-400">{t("profile.publicProfileHint")}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                    className={`w-12 h-6 rounded-full transition-all ${
                      formData.is_public ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-all ${
                        formData.is_public ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Save Button */}
                <Button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  {saving ? (
                    <span className="animate-spin mr-2">⏳</span>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saving ? t("profile.saving") : t("profile.saveChanges")}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-300">
                      <User className="w-5 h-5 text-cyan-400" />
                      <span className="text-gray-500">{t("profile.username")}:</span>
                      <span className="text-white">@{formData.username}</span>
                    </div>
                    {formData.favorite_game && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <Heart className="w-5 h-5 text-pink-400" />
                        <span className="text-gray-500">{t("profile.favoriteGame")}:</span>
                        <span className="text-white">{GAME_NAMES[formData.favorite_game] || formData.favorite_game}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-300">
                      <Clock className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-500">{t("profile.memberSince")}:</span>
                      <span className="text-white">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <Link
                      to="/arcade"
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all flex items-center gap-2"
                    >
                      <Gamepad2 className="w-5 h-5" />
                      {t("profile.goToArcade")}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="space-y-6">
            {/* Featured Badges */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                {t("profile.earnedBadges")}
              </h3>
              {badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {badges.map((badge, index) => (
                    <div
                      key={index}
                      className={`bg-gradient-to-br ${getRarityColor(badge.rarity)} p-0.5 rounded-lg`}
                    >
                      <div className="bg-gray-900 rounded-lg p-4 h-full">
                        <div className="text-3xl mb-2">
                          {(() => {
                            const BadgeIcon = ICON_MAP[badge.icon];
                            return BadgeIcon ? <BadgeIcon className="w-8 h-8 text-white" /> : <Star className="w-8 h-8 text-white" />;
                          })()}
                        </div>
                        <div className="text-white font-medium text-sm">{badge.name}</div>
                        <div className="text-xs text-gray-400">{badge.description}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(badge.earned_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t("profile.noBadgesYet")}</p>
                  <Link to="/arcade" className="text-cyan-400 hover:underline mt-2 inline-block">
                    {t("profile.earnBadgesInArcade")}
                  </Link>
                </div>
              )}
            </div>

            {/* Achievement Progress */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                {t("profile.achievementProgress")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t("profile.totalBadges")}</span>
                  <span className="text-white font-bold">{badges.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t("profile.legendaryBadges")}</span>
                  <span className="text-yellow-400 font-bold">
                    {badges.filter((b) => b.rarity === "legendary").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t("profile.epicBadges")}</span>
                  <span className="text-purple-400 font-bold">
                    {badges.filter((b) => b.rarity === "epic").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t("profile.rareBadges")}</span>
                  <span className="text-blue-400 font-bold">
                    {badges.filter((b) => b.rarity === "rare").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            {/* Game Sessions */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-pink-400" />
                {t("profile.gameStats")}
              </h3>
              {gameSessions.length > 0 ? (
                <div className="space-y-3">
                  {gameSessions.slice(0, 10).map((session, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ background: `${formData.theme_color}40` }}
                        >
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🎮"}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {GAME_NAMES[session.game_type] || session.game_type}
                          </div>
                          <div className="text-xs text-gray-400">
                            {session.times_played} {t("profile.timesPlayed")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">{session.high_score.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">{t("profile.highScore")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t("profile.noGamesYet")}</p>
                  <Link to="/arcade" className="text-cyan-400 hover:underline mt-2 inline-block">
                    {t("profile.startPlaying")}
                  </Link>
                </div>
              )}
            </div>

            {/* Arcade Stats Summary */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Medal className="w-5 h-5 text-yellow-400" />
                {t("profile.arcadeSummary")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-cyan-400">
                    {arcadeStats?.games_played || 0}
                  </div>
                  <div className="text-sm text-gray-400">{t("profile.totalGames")}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-pink-400">
                    {arcadeStats?.total_tickets || 0}
                  </div>
                  <div className="text-sm text-gray-400">{t("profile.ticketsEarned")}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {arcadeStats?.tickets_spent || 0}
                  </div>
                  <div className="text-sm text-gray-400">{t("profile.ticketsSpent")}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
