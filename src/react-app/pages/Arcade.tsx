import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Header } from "@/react-app/components/Header";
import { Footer } from "@/react-app/components/Footer";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { useAuth } from "@/react-app/auth";
import { Gamepad2, Trophy, Zap, Sparkles, Shield, Star, Crown, Flame, Award, Info, ChevronLeft, ChevronRight, X, Medal, TrendingUp, User, Calendar, Wifi, Users, Swords, Gift, Percent, Palette, Tag, Package, Clock, Check, Loader2, Castle, Drama, CircleDot, Circle, Ship, Target, Square, Brain, Crosshair, Spade, HelpCircle } from "lucide-react";
import { 
  Game2048, SnakeGame, MemoryGame, TetrisGame, BreakoutGame, FlappyGame,
  PongGame, AsteroidsGame, InvadersGame, PacmanGame, FroggerGame, DinoGame,
  MinesweeperGame, SudokuGame, WordleGame, SlidingPuzzleGame, LightsOutGame, FifteenPuzzleGame,
  HelicopterGame, TanksGame, ShooterGame, DodgeGame, PlatformerGame, RacingGame,
  BlackjackGame, SolitaireGame, TicTacToeGame, Connect4Game, ReversiGame, SimonGame,
  ReactionGame, AimTrainerGame, TypingGame, ColorMatchGame, MathBlitzGame, SequenceGame
} from "@/react-app/components/games";

// Synthwave grid floor component
function NeonGrid() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, rgba(236, 72, 153, 0.1) 100%)",
          transform: "perspective(500px) rotateX(60deg)",
          transformOrigin: "center bottom",
        }}
      >
        {/* Horizontal lines */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-px bg-pink-500/60"
            style={{ 
              bottom: `${i * 16}px`,
              boxShadow: "0 0 10px rgba(236, 72, 153, 0.8), 0 0 20px rgba(236, 72, 153, 0.4)"
            }}
          />
        ))}
        {/* Vertical lines */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px bg-pink-500/40"
            style={{ 
              left: `${(i + 1) * 5}%`,
              boxShadow: "0 0 8px rgba(236, 72, 153, 0.6)"
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Floating stars
function Stars() {
  const stars = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 60,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 3,
    duration: Math.random() * 2 + 1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.size > 2 ? "#4ade80" : "#fff",
            boxShadow: star.size > 2 
              ? "0 0 10px #4ade80, 0 0 20px #4ade80" 
              : "0 0 4px #fff",
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// Mountain silhouettes
function Mountains() {
  return (
    <div className="absolute bottom-32 left-0 right-0 pointer-events-none">
      <svg viewBox="0 0 1200 200" className="w-full h-32" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path
          d="M0,200 L0,150 L100,100 L200,140 L300,80 L400,120 L500,60 L600,100 L700,50 L800,90 L900,70 L1000,110 L1100,80 L1200,130 L1200,200 Z"
          fill="url(#mountainGrad)"
        />
      </svg>
    </div>
  );
}

// Shopping badges definitions (spending-based)
const SHOPPING_BADGES = [
  { id: "bronze", name: "Bronze Gamer", requirement: 5000, tickets: 10, tier: 1, Icon: Shield, color: "#cd7f32" },
  { id: "silver", name: "Silver Gamer", requirement: 15000, tickets: 30, tier: 2, Icon: Star, color: "#c0c0c0" },
  { id: "gold", name: "Gold Gamer", requirement: 30000, tickets: 75, tier: 3, Icon: Crown, color: "#ffd700" },
  { id: "platinum", name: "Platinum Master", requirement: 50000, tickets: 150, tier: 4, Icon: Flame, color: "#e5e4e2" },
  { id: "diamond", name: "Diamond Legend", requirement: 100000, tickets: 350, tier: 5, Icon: Sparkles, color: "#b9f2ff" },
];

interface ShoppingBadge {
  id: string;
  earned: boolean;
  progress: number;
}

interface GameAchievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  tickets_required: number | null;
  game_type: string | null;
  score_required: number | null;
  games_required: number | null;
}

interface EarnedBadge {
  badge_id: number;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  earned_at: string;
}

interface ArcadeStats {
  stats: {
    totalTickets: number;
    ticketsSpent: number;
    availableTickets: number;
    gamesPlayed: number;
    highScores: Record<string, number>;
  };
  earnedBadges: EarnedBadge[];
  recentSessions: Array<{ game_type: string; score: number; tickets_earned: number }>;
}

interface BadgeDisplay {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  earned: boolean;
  progress: number;
  games_required?: number | null;
}

// Leaderboard types
interface LeaderboardEntry {
  user_id: string;
  total_score: number;
  high_score?: number;
  games_played: number;
  total_tickets?: number;
  game_type?: string;
  // RetroPass customization
  leaderboard_icon?: string | null;
  leaderboard_color?: string | null;
  display_title?: string | null;
  has_retropass?: number;
}

interface LeaderboardData {
  period: string;
  overall: LeaderboardEntry[];
  perGame: LeaderboardEntry[];
  activeGames: Array<{ game_type: string; total_sessions: number; total_score: number }>;
}

interface UserRankings {
  period: string;
  overallStats: { total_score: number; games_played: number; total_tickets: number };
  overallRank: number;
  gameStats: Array<{ game_type: string; total_score: number; high_score: number; games_played: number }>;
}

type LeaderboardPeriod = "day" | "week" | "month" | "year" | "all";

// Ticket Shop types
interface ArcadeReward {
  id: number;
  type: string;
  name: string;
  description: string;
  ticket_cost: number;
  image_url: string | null;
  is_active: boolean;
  quantity_available: number | null;
}

interface MyReward {
  id: number;
  reward_id: number;
  reward_type: string;
  reward_name: string;
  reward_code: string | null;
  is_used: boolean;
  redeemed_at: string;
}

// Free games list (open source/HTML5) with developer credits
interface GameInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  cover: string;
  playable: boolean;
  credits: {
    developer: string;
    originalConcept?: string;
    license: string;
    year?: string;
  };
}

const GAMES: GameInfo[] = [
  // Page 1
  { 
    id: "2048", 
    name: "2048", 
    description: "Combine tiles to reach 2048!",
    category: "Puzzle",
    color: "from-amber-500 to-orange-600",
    cover: "/assets/game-cover-2048.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Gabriele Cirulli (2014)", license: "MIT", year: "2024" },
  },
  { 
    id: "tetris", 
    name: "Neon Blocks", 
    description: "Classic block stacking action",
    category: "Arcade",
    color: "from-cyan-500 to-blue-600",
    cover: "/assets/game-cover-tetris.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Alexey Pajitnov (1984)", license: "Open Source", year: "2024" },
  },
  { 
    id: "snake", 
    name: "Cyber Snake", 
    description: "Grow your neon snake!",
    category: "Arcade",
    color: "from-green-500 to-emerald-600",
    cover: "/assets/game-cover-snake.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Nokia (1997)", license: "Open Source", year: "2024" },
  },
  { 
    id: "breakout", 
    name: "Brick Breaker", 
    description: "Break all the bricks!",
    category: "Arcade",
    color: "from-pink-500 to-rose-600",
    cover: "/assets/game-cover-breakout.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Atari (1976)", license: "Open Source", year: "2024" },
  },
  { 
    id: "memory", 
    name: "Memory Match", 
    description: "Test your memory skills",
    category: "Puzzle",
    color: "from-purple-500 to-violet-600",
    cover: "/assets/game-cover-memory.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Classic Card Game", license: "Open Source", year: "2024" },
  },
  { 
    id: "flappy", 
    name: "Pixel Bird", 
    description: "Navigate through pipes!",
    category: "Arcade",
    color: "from-yellow-500 to-lime-600",
    cover: "/assets/game-cover-flappy.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Dong Nguyen (2013)", license: "Open Source", year: "2024" },
  },
  // Page 2 - Classic Arcade
  { 
    id: "pong", 
    name: "Neon Pong", 
    description: "Classic ping pong battle!",
    category: "Arcade",
    color: "from-blue-500 to-purple-600",
    cover: "/assets/game-cover-pong.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Atari (1972)", license: "Open Source", year: "2024" },
  },
  { 
    id: "asteroids", 
    name: "Space Rocks", 
    description: "Destroy asteroids in space!",
    category: "Arcade",
    color: "from-gray-500 to-slate-600",
    cover: "/assets/game-cover-asteroids.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Atari (1979)", license: "Open Source", year: "2024" },
  },
  { 
    id: "invaders", 
    name: "Pixel Invaders", 
    description: "Defend Earth from aliens!",
    category: "Shooter",
    color: "from-green-500 to-teal-600",
    cover: "/assets/game-cover-invaders.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Taito (1978)", license: "Open Source", year: "2024" },
  },
  { 
    id: "pacman", 
    name: "Dot Chomper", 
    description: "Eat dots, avoid ghosts!",
    category: "Arcade",
    color: "from-yellow-400 to-orange-500",
    cover: "/assets/game-cover-pacman.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Namco (1980)", license: "Open Source", year: "2024" },
  },
  { 
    id: "frogger", 
    name: "Road Hopper", 
    description: "Cross the road safely!",
    category: "Arcade",
    color: "from-lime-500 to-green-600",
    cover: "/assets/game-cover-frogger.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Konami (1981)", license: "Open Source", year: "2024" },
  },
  { 
    id: "dino", 
    name: "Desert Runner", 
    description: "Jump over cacti!",
    category: "Runner",
    color: "from-amber-600 to-yellow-500",
    cover: "/assets/game-cover-dino.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Chrome Dino (2014)", license: "Open Source", year: "2024" },
  },
  // Page 3 - Puzzle Games
  { 
    id: "minesweeper", 
    name: "Mine Field", 
    description: "Clear the field carefully!",
    category: "Puzzle",
    color: "from-gray-600 to-red-600",
    cover: "/assets/game-cover-minesweeper.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Microsoft (1990)", license: "Open Source", year: "2024" },
  },
  { 
    id: "sudoku", 
    name: "Number Grid", 
    description: "Fill the 9x9 grid!",
    category: "Puzzle",
    color: "from-indigo-500 to-blue-600",
    cover: "/assets/game-cover-sudoku.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Traditional Puzzle", license: "Open Source", year: "2024" },
  },
  { 
    id: "wordle", 
    name: "Word Guess", 
    description: "Guess the 5-letter word!",
    category: "Word",
    color: "from-green-500 to-emerald-600",
    cover: "/assets/game-cover-wordle.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Josh Wardle (2021)", license: "Open Source", year: "2024" },
  },
  { 
    id: "sliding", 
    name: "Slide Puzzle", 
    description: "Slide tiles to solve!",
    category: "Puzzle",
    color: "from-pink-500 to-purple-600",
    cover: "/assets/game-cover-sliding.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Sam Loyd (1874)", license: "Open Source", year: "2024" },
  },
  { 
    id: "lights", 
    name: "Lights Out", 
    description: "Turn off all the lights!",
    category: "Puzzle",
    color: "from-yellow-500 to-amber-600",
    cover: "/assets/game-cover-lights.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Tiger Electronics (1995)", license: "Open Source", year: "2024" },
  },
  { 
    id: "fifteen", 
    name: "15 Puzzle", 
    description: "Order the numbers 1-15!",
    category: "Puzzle",
    color: "from-teal-500 to-cyan-600",
    cover: "/assets/game-cover-fifteen.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Noyes Palmer (1880)", license: "Open Source", year: "2024" },
  },
  // Page 4 - Action Games
  { 
    id: "helicopter", 
    name: "Cave Copter", 
    description: "Navigate the cave!",
    category: "Action",
    color: "from-sky-500 to-blue-600",
    cover: "/assets/game-cover-helicopter.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Helicopter Game (2000)", license: "Open Source", year: "2024" },
  },
  { 
    id: "tanks", 
    name: "Tank Battle", 
    description: "Destroy enemy tanks!",
    category: "Action",
    color: "from-olive-500 to-green-700",
    cover: "/assets/game-cover-tanks.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Atari (1974)", license: "Open Source", year: "2024" },
  },
  { 
    id: "shooter", 
    name: "Star Blaster", 
    description: "Shoot through space!",
    category: "Shooter",
    color: "from-red-500 to-orange-600",
    cover: "/assets/game-cover-shooter.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Classic Shoot 'em up", license: "Open Source", year: "2024" },
  },
  { 
    id: "dodge", 
    name: "Dodge Master", 
    description: "Avoid falling objects!",
    category: "Action",
    color: "from-purple-500 to-pink-600",
    cover: "/assets/game-cover-dodge.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Classic Arcade", license: "Open Source", year: "2024" },
  },
  { 
    id: "platformer", 
    name: "Pixel Jump", 
    description: "Jump to the top!",
    category: "Platformer",
    color: "from-blue-500 to-indigo-600",
    cover: "/assets/game-cover-platformer.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Doodle Jump Style", license: "Open Source", year: "2024" },
  },
  { 
    id: "racing", 
    name: "Neon Racer", 
    description: "Race through traffic!",
    category: "Racing",
    color: "from-red-500 to-pink-600",
    cover: "/assets/game-cover-racing.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Road Fighter (1984)", license: "Open Source", year: "2024" },
  },
  // Page 5 - Card & Board Games
  { 
    id: "blackjack", 
    name: "21 Neon", 
    description: "Get closest to 21!",
    category: "Cards",
    color: "from-emerald-600 to-green-700",
    cover: "/assets/game-cover-blackjack.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Traditional Card Game", license: "Open Source", year: "2024" },
  },
  { 
    id: "solitaire", 
    name: "Neon Solitaire", 
    description: "Classic card sorting!",
    category: "Cards",
    color: "from-blue-600 to-purple-700",
    cover: "/assets/game-cover-solitaire.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Microsoft (1990)", license: "Open Source", year: "2024" },
  },
  { 
    id: "tictactoe", 
    name: "Tic Tac Glow", 
    description: "X's and O's battle!",
    category: "Board",
    color: "from-cyan-500 to-blue-600",
    cover: "/assets/game-cover-tictactoe.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Traditional Game", license: "Open Source", year: "2024" },
  },
  { 
    id: "connect4", 
    name: "Connect Neon", 
    description: "Connect 4 in a row!",
    category: "Board",
    color: "from-red-500 to-yellow-500",
    cover: "/assets/game-cover-connect4.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Milton Bradley (1974)", license: "Open Source", year: "2024" },
  },
  { 
    id: "reversi", 
    name: "Flip Wars", 
    description: "Flip to dominate!",
    category: "Board",
    color: "from-gray-700 to-white",
    cover: "/assets/game-cover-reversi.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Lewis Waterman (1888)", license: "Open Source", year: "2024" },
  },
  { 
    id: "simon", 
    name: "Simon Says", 
    description: "Follow the pattern!",
    category: "Memory",
    color: "from-red-500 via-green-500 to-blue-500",
    cover: "/assets/game-cover-simon.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Milton Bradley (1978)", license: "Open Source", year: "2024" },
  },
  // Page 6 - Reflex & Skill Games
  { 
    id: "reaction", 
    name: "Quick Reflex", 
    description: "Test your reaction time!",
    category: "Reflex",
    color: "from-orange-500 to-red-600",
    cover: "/assets/game-cover-reaction.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Classic Reaction Test", license: "Open Source", year: "2024" },
  },
  { 
    id: "aim", 
    name: "Target Practice", 
    description: "Click the targets fast!",
    category: "Reflex",
    color: "from-red-600 to-rose-700",
    cover: "/assets/game-cover-aim.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Aim Trainer", license: "Open Source", year: "2024" },
  },
  { 
    id: "typing", 
    name: "Type Blast", 
    description: "Type words before they fall!",
    category: "Skill",
    color: "from-green-500 to-teal-600",
    cover: "/assets/game-cover-typing.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Typing Games", license: "Open Source", year: "2024" },
  },
  { 
    id: "color", 
    name: "Color Match", 
    description: "Match colors not words!",
    category: "Brain",
    color: "from-rainbow-500 to-purple-600",
    cover: "/assets/game-cover-color.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Stroop Test (1935)", license: "Open Source", year: "2024" },
  },
  { 
    id: "math", 
    name: "Math Blitz", 
    description: "Solve math fast!",
    category: "Brain",
    color: "from-blue-500 to-cyan-600",
    cover: "/assets/game-cover-math.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "Math Games", license: "Open Source", year: "2024" },
  },
  { 
    id: "sequence", 
    name: "Number Sequence", 
    description: "Find the next number!",
    category: "Brain",
    color: "from-violet-500 to-purple-600",
    cover: "/assets/game-cover-sequence.png",
    playable: true,
    credits: { developer: "Retromynd Team", originalConcept: "IQ Tests", license: "Open Source", year: "2024" },
  },
];

const GAMES_PER_PAGE = 6;

export default function ArcadePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [arcadeStats, setArcadeStats] = useState<ArcadeStats | null>(null);
  const [allAchievements, setAllAchievements] = useState<GameAchievement[]>([]);
  const [shoppingBadges, setShoppingBadges] = useState<ShoppingBadge[]>([]);
  const [_loading, setLoading] = useState(true);
  const [currentScore, setCurrentScore] = useState(0);
  const [ticketsEarned, setTicketsEarned] = useState<number | null>(null);
  const [currentGamePage, setCurrentGamePage] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState<GameInfo | null>(null);
  
  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [userRankings, setUserRankings] = useState<UserRankings | null>(null);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>("all");
  const [selectedLeaderboardGame, setSelectedLeaderboardGame] = useState<string | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  
  // Ticket Shop state
  const [rewards, setRewards] = useState<ArcadeReward[]>([]);
  const [myRewards, setMyRewards] = useState<MyReward[]>([]);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  
  // Pagination for games carousel
  const totalPages = Math.ceil(GAMES.length / GAMES_PER_PAGE);
  const currentGames = GAMES.slice(
    currentGamePage * GAMES_PER_PAGE,
    (currentGamePage + 1) * GAMES_PER_PAGE
  );
  
  const goToNextPage = () => {
    setCurrentGamePage((prev) => (prev + 1) % totalPages);
  };
  
  const goToPrevPage = () => {
    setCurrentGamePage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleGameEnd = useCallback(async (finalScore: number) => {
    if (!user || !selectedGame) return;
    
    try {
      const res = await fetch("/api/arcade/game-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: selectedGame,
          score: finalScore,
          durationSeconds: Math.floor(Math.random() * 120) + 30, // Placeholder duration
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setTicketsEarned(data.ticketsEarned);
        
        // Refresh stats after game
        const statsRes = await fetch("/api/arcade/user-stats");
        if (statsRes.ok) {
          setArcadeStats(await statsRes.json());
        }
        
        // Check for new badges
        await fetch("/api/arcade/check-badges", { method: "POST" });
      }
    } catch (err) {
      console.error("Failed to save game session:", err);
    }
  }, [user, selectedGame]);

  const handleScoreUpdate = useCallback((score: number) => {
    setCurrentScore(score);
  }, []);

  const closeGame = () => {
    setSelectedGame(null);
    setCurrentScore(0);
    setTicketsEarned(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch game achievements (arcade_badges table)
        const achievementsRes = await fetch("/api/arcade/badges");
        if (achievementsRes.ok) {
          const achievements = await achievementsRes.json();
          setAllAchievements(achievements);
        }
        
        if (!user) {
          setLoading(false);
          return;
        }
        
        // Check for new badges first
        await fetch("/api/arcade/check-badges", { method: "POST" });
        
        // Fetch shopping badges from /api/arcade/stats
        const statsRes = await fetch("/api/arcade/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          // Shopping badges with progress info
          if (statsData.allBadges) {
            setShoppingBadges(statsData.allBadges);
          }
        }
        
        // Then fetch user game stats
        const res = await fetch("/api/arcade/user-stats");
        if (res.ok) {
          const data = await res.json();
          setArcadeStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch arcade data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLeaderboardLoading(true);
      try {
        const gameParam = selectedLeaderboardGame ? `&game=${selectedLeaderboardGame}` : "";
        const res = await fetch(`/api/arcade/leaderboards?period=${leaderboardPeriod}${gameParam}`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboardData(data);
        }
        
        // Fetch user's personal rankings if logged in
        if (user) {
          const userRes = await fetch(`/api/arcade/my-rankings?period=${leaderboardPeriod}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setUserRankings(userData);
          }
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [leaderboardPeriod, selectedLeaderboardGame, user]);

  // Fetch ticket shop rewards
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const res = await fetch("/api/arcade/rewards");
        if (res.ok) {
          const data = await res.json();
          setRewards(data.rewards || []);
        }
        
        if (user) {
          const myRes = await fetch("/api/arcade/my-rewards");
          if (myRes.ok) {
            const myData = await myRes.json();
            setMyRewards(myData.rewards || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch rewards:", err);
      }
    };
    
    fetchRewards();
  }, [user]);

  const handleRedeemReward = async (rewardId: number) => {
    if (!user || redeemingId) return;
    
    setRedeemingId(rewardId);
    try {
      const res = await fetch(`/api/arcade/rewards/${rewardId}/redeem`, {
        method: "POST",
      });
      
      if (res.ok) {
        const data = await res.json();
        // Refresh stats (tickets changed)
        const statsRes = await fetch("/api/arcade/user-stats");
        if (statsRes.ok) {
          setArcadeStats(await statsRes.json());
        }
        // Refresh my rewards
        const myRes = await fetch("/api/arcade/my-rewards");
        if (myRes.ok) {
          const myData = await myRes.json();
          setMyRewards(myData.rewards || []);
        }
        // Show success message
        alert(data.message || "Reward redeemed!");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to redeem reward");
      }
    } catch (err) {
      console.error("Failed to redeem:", err);
      alert("Failed to redeem reward");
    } finally {
      setRedeemingId(null);
    }
  };

  const tickets = arcadeStats?.stats?.availableTickets || 0;
  const gamesPlayed = arcadeStats?.stats?.gamesPlayed || 0;
  
  // Calculate game achievement display data
  const achievementDisplays: BadgeDisplay[] = allAchievements.map(achievement => {
    const earned = arcadeStats?.earnedBadges?.some(eb => eb.badge_id === achievement.id) || false;
    let progress = 0;
    
    if (!earned && arcadeStats?.stats) {
      if (achievement.games_required) {
        progress = Math.min(100, (gamesPlayed / achievement.games_required) * 100);
      } else if (achievement.tickets_required) {
        progress = Math.min(100, ((arcadeStats.stats.totalTickets || 0) / achievement.tickets_required) * 100);
      }
    }
    
    return { ...achievement, earned, progress };
  });

  // Entrance animation styles
  const entranceAnimation = `
    @keyframes arcadeLand {
      0% {
        opacity: 0;
        transform: translateY(-40px) scale(0.96);
      }
      70% {
        opacity: 1;
        transform: translateY(4px) scale(1.01);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes bgFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .arcade-land {
      animation: arcadeLand 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      opacity: 0;
    }
    .arcade-land-1 { animation-delay: 0.15s; }
    .arcade-land-2 { animation-delay: 0.3s; }
    .arcade-land-3 { animation-delay: 0.45s; }
    .arcade-land-4 { animation-delay: 0.6s; }
    .arcade-land-5 { animation-delay: 0.75s; }
    .arcade-bg-fade {
      animation: bgFadeIn 0.5s ease-out forwards;
    }
  `;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      <style>{entranceAnimation}</style>
      <Header />
      
      <main className="flex-1 relative overflow-hidden">
        {/* Background effects - fade in first */}
        <div className="arcade-bg-fade">
          <Stars />
          <Mountains />
          <NeonGrid />
        </div>
        
        {/* Animated scanlines overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10 arcade-bg-fade"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12 arcade-land arcade-land-1">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-green-400 animate-pulse" />
              <span className="text-green-400 text-sm tracking-widest uppercase">
                {t("arcade.subtitle") || "retromynd presents"}
              </span>
              <Sparkles className="w-5 h-5 text-green-400 animate-pulse" />
            </div>
            
            <h1 
              className="text-5xl md:text-7xl font-bold mb-4"
              style={{
                fontFamily: "'VT323', monospace",
                background: "linear-gradient(180deg, #f9a8d4 0%, #ec4899 50%, #be185d 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 40px rgba(236, 72, 153, 0.5)",
                letterSpacing: "0.1em",
              }}
            >
              {t("arcade.title") || "RETRO ARCADE"}
            </h1>
            
            <p className="text-gray-400 text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Space Mono', monospace" }}>
              {t("arcade.description") || "Play free retro games, earn badges, and collect arcade tickets!"}
            </p>
          </div>

          {/* Badges & Tickets Display */}
          <div className="mb-12 arcade-land arcade-land-2">
            <div className="bg-black/60 backdrop-blur-sm border border-pink-500/30 rounded-lg p-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                {/* Tickets */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t("arcade.yourTickets") || "Your Tickets"}</p>
                    <p className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'VT323', monospace" }}>
                      {tickets}
                    </p>
                  </div>
                </div>

                {/* Shopping Badge Progress */}
                <div className="flex-1 max-w-md">
                  <p className="text-gray-400 text-sm mb-2">
                    {t("arcade.badgeProgress") || "Badge Progress"}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {SHOPPING_BADGES.map((badgeDef) => {
                      const shopBadge = shoppingBadges.find(b => b.id === badgeDef.id);
                      const earned = shopBadge?.earned || false;
                      const progress = shopBadge?.progress || 0;
                      const IconComponent = badgeDef.Icon;
                      
                      return (
                        <div 
                          key={badgeDef.id}
                          className="relative group"
                          title={`${badgeDef.name} - R$${badgeDef.requirement}+`}
                        >
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              earned 
                                ? "ring-2 ring-offset-2 ring-offset-black" 
                                : "opacity-40"
                            }`}
                            style={{ 
                              backgroundColor: earned ? badgeDef.color : "#333",
                              boxShadow: earned ? `0 0 0 2px #0a0a0f, 0 0 0 4px ${badgeDef.color}` : "none",
                            }}
                          >
                            <IconComponent 
                              className="w-5 h-5" 
                              style={{ color: earned ? "#000" : "#666" }}
                            />
                          </div>
                          {!earned && progress > 0 && (
                            <div 
                              className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-700 rounded-full overflow-hidden"
                            >
                              <div 
                                className="h-full transition-all"
                                style={{ 
                                  width: `${Math.min(progress, 100)}%`,
                                  backgroundColor: badgeDef.color,
                                }}
                              />
                            </div>
                          )}
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-pink-500/50 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <p className="text-white font-bold">{badgeDef.name}</p>
                            <p className="text-gray-400">R${badgeDef.requirement}+ {t("arcade.spent") || "spent"}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* How it works */}
                <button
                  onClick={() => navigate("/arcade/badges")}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded text-white text-sm font-medium hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  {t("arcade.howItWorks") || "How It Works"}
                </button>
                
                {/* RetroPass */}
                <button
                  onClick={() => navigate("/retropass")}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 rounded text-black text-sm font-bold hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/30"
                >
                  <Crown className="w-4 h-4" />
                  {t("arcade.retroPass") || "RETROPASS"}
                </button>
              </div>
            </div>
          </div>

          {/* My Badges Section - Shopping Badges */}
          <div className="mb-12 arcade-land arcade-land-3">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 
                className="text-2xl font-bold text-yellow-400"
                style={{ fontFamily: "'VT323', monospace" }}
              >
                {t("arcade.myBadges") || "MY BADGES"}
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {SHOPPING_BADGES.map((badgeDef) => {
                const shopBadge = shoppingBadges.find(b => b.id === badgeDef.id);
                const earned = shopBadge?.earned || false;
                const progress = shopBadge?.progress || 0;
                const IconComponent = badgeDef.Icon;
                
                return (
                  <div
                    key={badgeDef.id}
                    className={`relative group transition-all duration-300 ${
                      earned ? "hover:scale-105" : "opacity-60"
                    }`}
                  >
                    <div 
                      className={`relative overflow-hidden rounded-xl border p-5 ${
                        earned 
                          ? "bg-gradient-to-br from-black/60 to-black/40 border-opacity-50" 
                          : "bg-black/30 border-white/10"
                      }`}
                      style={{
                        borderColor: earned ? badgeDef.color : undefined,
                        boxShadow: earned ? `0 0 25px ${badgeDef.color}40, inset 0 0 30px ${badgeDef.color}10` : "none",
                      }}
                    >
                      {/* Badge icon */}
                      <div className="text-center mb-3 flex justify-center">
                        <div 
                          className="p-3 rounded-full"
                          style={{
                            backgroundColor: earned ? `${badgeDef.color}20` : "rgba(100,100,100,0.1)",
                            boxShadow: earned ? `0 0 20px ${badgeDef.color}40` : "none",
                          }}
                        >
                          <IconComponent 
                            className="w-8 h-8"
                            style={{ 
                              color: earned ? badgeDef.color : "#666",
                              filter: earned ? `drop-shadow(0 0 8px ${badgeDef.color})` : "none",
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Badge name */}
                      <h3 
                        className="text-center text-lg font-bold mb-1 uppercase"
                        style={{ 
                          fontFamily: "'VT323', monospace",
                          color: earned ? badgeDef.color : "#666",
                          textShadow: earned ? `0 0 10px ${badgeDef.color}60` : "none",
                        }}
                      >
                        {badgeDef.name}
                      </h3>
                      
                      {/* Requirement */}
                      <p className="text-center text-xs text-gray-500">
                        R$ {badgeDef.requirement}+ {t("arcade.spent") || "spent"}
                      </p>
                      
                      {/* Progress bar for unearned */}
                      {!earned && progress > 0 && (
                        <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(progress, 100)}%`,
                              backgroundColor: badgeDef.color,
                              boxShadow: `0 0 8px ${badgeDef.color}`,
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Earned checkmark */}
                      {earned && (
                        <div 
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: badgeDef.color }}
                        >
                          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Lock indicator */}
                      {!earned && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black border border-pink-500/50 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48">
                      <p className="text-white font-bold mb-1">{badgeDef.name}</p>
                      <p className="text-gray-400">
                        {earned 
                          ? t("arcade.badgeEarned") || "Badge earned! 🎉" 
                          : `${t("arcade.progress") || "Progress"}: ${Math.round(progress)}%`
                        }
                      </p>
                      <p className="text-pink-400 text-xs mt-1">
                        +{badgeDef.tickets} tickets
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Games Carousel */}
          <div className="mb-8 arcade-land arcade-land-4">
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-2xl font-bold text-pink-400 flex items-center gap-2"
                style={{ fontFamily: "'VT323', monospace" }}
              >
                <Gamepad2 className="w-6 h-6" />
                {t("arcade.freeGames") || "FREE GAMES"}
              </h2>
              
              {/* Page indicator and navigation */}
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm" style={{ fontFamily: "'VT323', monospace" }}>
                  {t("arcade.page") || "Page"} {currentGamePage + 1} / {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={goToPrevPage}
                    className="w-10 h-10 rounded-lg bg-black/60 border border-pink-500/30 text-pink-400 flex items-center justify-center hover:bg-pink-500/20 hover:border-pink-500 transition-all"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToNextPage}
                    className="w-10 h-10 rounded-lg bg-black/60 border border-pink-500/30 text-pink-400 flex items-center justify-center hover:bg-pink-500/20 hover:border-pink-500 transition-all"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Games Grid with transition */}
            <div className="relative overflow-hidden">
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300"
                key={currentGamePage}
                style={{ animation: "fadeIn 0.3s ease-out" }}
              >
                {currentGames.map((game) => (
                  <div key={game.id} className="relative group">
                    <button
                      onClick={() => setSelectedGame(game.id)}
                      className="w-full overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm transition-all hover:border-pink-500/50 hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]"
                    >
                      {/* Game thumbnail/preview area */}
                      <div className="h-44 relative overflow-hidden">
                        {/* Cover image */}
                        <img 
                          src={game.cover} 
                          alt={game.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        {/* Gradient overlay for better text contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {/* Scanline effect */}
                        <div 
                          className="absolute inset-0 opacity-30 pointer-events-none"
                          style={{
                            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
                          }}
                        />
                        {/* Colored glow border on hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-pink-500 rounded-t-lg" 
                          style={{ boxShadow: "inset 0 0 30px rgba(236, 72, 153, 0.3)" }}
                        />
                        {/* Play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 rounded-full bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/50">
                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                        {/* Category badge */}
                        <span className="absolute top-2 right-2 text-xs text-white font-bold px-2 py-1 bg-black/60 backdrop-blur-sm rounded border border-white/20">
                          {game.category}
                        </span>
                      </div>
                      
                      {/* Game info */}
                      <div className="p-4 text-left">
                        <h3 
                          className="text-xl font-bold text-white mb-1"
                          style={{ fontFamily: "'VT323', monospace" }}
                        >
                          {game.name}
                        </h3>
                        <p className="text-gray-400 text-sm">{game.description}</p>
                      </div>
                    </button>
                    
                    {/* Info button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInfoModal(game);
                      }}
                      className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/70 border border-cyan-500/50 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/30 hover:border-cyan-400 transition-all z-10 opacity-0 group-hover:opacity-100"
                      aria-label="Game info"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Page dots */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentGamePage(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === currentGamePage 
                      ? "bg-pink-500 scale-125 shadow-[0_0_10px_rgba(236,72,153,0.5)]" 
                      : "bg-gray-600 hover:bg-gray-500"
                  }`}
                  aria-label={`Go to page ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* === PREMIUM GAME: SHADOW HUNTER === */}
          <div className="mb-12 arcade-land arcade-land-7">
            {/* Premium section header */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
              <div className="flex items-center gap-2 px-4">
                <Crown className="w-6 h-6 text-yellow-400" />
                <span 
                  className="text-yellow-400 text-sm tracking-[0.3em] uppercase"
                  style={{ fontFamily: "'VT323', monospace" }}
                >
                  {t("arcade.premiumExperience") || "PREMIUM EXPERIENCE"}
                </span>
                <Crown className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
            </div>

            {/* Premium game card with golden borders */}
            <div 
              className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden group cursor-pointer"
              onClick={() => navigate("/shadow-hunter")}
              style={{
                background: "linear-gradient(135deg, #0a0a0f 0%, #1a1520 50%, #0a0a0f 100%)",
              }}
            >
              {/* Animated golden border */}
              <div 
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #DAA520, #FFD700, #B8860B, #FFD700, #DAA520)",
                  padding: "3px",
                  backgroundSize: "400% 400%",
                  animation: "goldShimmer 3s ease infinite",
                }}
              >
                <div className="absolute inset-[3px] rounded-2xl bg-[#0a0a0f]" />
              </div>

              {/* Inner decorative border */}
              <div 
                className="absolute inset-[6px] rounded-xl pointer-events-none"
                style={{
                  border: "1px solid rgba(218, 165, 32, 0.3)",
                  boxShadow: "inset 0 0 30px rgba(218, 165, 32, 0.1)",
                }}
              />

              {/* Corner ornaments */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-yellow-500/60 rounded-tl-lg" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-yellow-500/60 rounded-tr-lg" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-yellow-500/60 rounded-bl-lg" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-yellow-500/60 rounded-br-lg" />

              {/* Content */}
              <div className="relative z-10 p-8 flex flex-col md:flex-row gap-8 items-center">
                {/* Game preview area */}
                <div 
                  className="w-full md:w-1/2 aspect-video rounded-xl overflow-hidden relative"
                  style={{
                    boxShadow: "0 0 40px rgba(139, 0, 0, 0.4), 0 0 80px rgba(218, 165, 32, 0.2)",
                    border: "2px solid rgba(218, 165, 32, 0.4)",
                  }}
                >
                  {/* Victorian hunter character preview */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%)",
                    }}
                  >
                    {/* Isometric floor pattern */}
                    <div 
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, transparent 48%, rgba(100,100,150,0.3) 49%, rgba(100,100,150,0.3) 51%, transparent 52%),
                          linear-gradient(-45deg, transparent 48%, rgba(100,100,150,0.3) 49%, rgba(100,100,150,0.3) 51%, transparent 52%)
                        `,
                        backgroundSize: "40px 20px",
                      }}
                    />
                    
                    {/* Character silhouette */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Red cape glow */}
                        <div 
                          className="absolute -left-8 top-0 bottom-0 w-16 rounded-full blur-xl"
                          style={{ background: "rgba(220, 20, 60, 0.4)" }}
                        />
                        {/* Character silhouette */}
                        <div 
                          className="w-32 h-48 relative"
                          style={{
                            background: "linear-gradient(180deg, #2D2D44 0%, #1A1A2E 100%)",
                            clipPath: "polygon(30% 0%, 70% 0%, 85% 20%, 100% 50%, 90% 100%, 10% 100%, 0% 50%, 15% 20%)",
                            boxShadow: "0 0 60px rgba(139, 0, 0, 0.5)",
                          }}
                        >
                          {/* Hat */}
                          <div 
                            className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-8"
                            style={{
                              background: "#1A1A1A",
                              clipPath: "polygon(0% 100%, 20% 30%, 50% 0%, 80% 30%, 100% 100%)",
                            }}
                          />
                          {/* Sword glints */}
                          <div className="absolute -left-4 top-1/4 w-1 h-12 bg-gradient-to-b from-white/60 to-transparent rotate-[-30deg]" />
                          <div className="absolute -right-4 top-1/4 w-1 h-12 bg-gradient-to-b from-white/60 to-transparent rotate-[30deg]" />
                        </div>
                      </div>
                    </div>

                    {/* Atmospheric particles */}
                    <div className="absolute inset-0 overflow-hidden">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div 
                          key={i}
                          className="absolute w-1 h-1 rounded-full bg-yellow-500/40 animate-pulse"
                          style={{
                            left: `${15 + i * 10}%`,
                            top: `${20 + Math.sin(i) * 30}%`,
                            animationDelay: `${i * 0.3}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{
                        background: "linear-gradient(135deg, #DAA520, #FFD700)",
                        boxShadow: "0 0 40px rgba(218, 165, 32, 0.6)",
                      }}
                    >
                      <svg className="w-10 h-10 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Game info */}
                <div className="flex-1 text-center md:text-left">
                  {/* Exclusive badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40">
                    <Flame className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="text-yellow-400 text-xs font-bold tracking-wider uppercase">
                      {t("arcade.exclusive") || "EXCLUSIVE"}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 
                    className="text-4xl md:text-5xl font-bold mb-3"
                    style={{
                      fontFamily: "'VT323', monospace",
                      background: "linear-gradient(180deg, #FFD700 0%, #DAA520 50%, #B8860B 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 0 40px rgba(218, 165, 32, 0.5)",
                    }}
                  >
                    SHADOW HUNTER
                  </h3>

                  {/* Subtitle */}
                  <p 
                    className="text-gray-400 text-lg mb-4"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {t("arcade.shadowHunterDesc") || "Isometric roguelike with Victorian gothic aesthetic"}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
                    {[
                      { Icon: Swords, label: t("arcade.dualSwords") || "Dual Swords" },
                      { Icon: Drama, label: t("arcade.curses") || "Curses & Blessings" },
                      { Icon: Castle, label: t("arcade.dungeons") || "Procedural Dungeons" },
                    ].map((feature, i) => (
                      <div 
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10"
                      >
                        <feature.Icon className="w-4 h-4 text-amber-400" />
                        <span className="text-gray-300 text-sm">{feature.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Play button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/shadow-hunter");
                    }}
                    className="inline-flex items-center gap-3 px-8 py-3 rounded-xl font-bold text-black transition-all hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #FFD700, #DAA520)",
                      boxShadow: "0 4px 20px rgba(218, 165, 32, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                    }}
                  >
                    <Gamepad2 className="w-5 h-5" />
                    <span style={{ fontFamily: "'VT323', monospace", fontSize: "1.25rem" }}>
                      {t("arcade.playNow") || "PLAY NOW"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Bottom decorative line */}
              <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
            </div>

            {/* Gold shimmer animation */}
            <style>{`
              @keyframes goldShimmer {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
          </div>

          {/* === ONLINE ARENA - RetroPass Exclusive === */}
          <div className="mb-12 arcade-land arcade-land-8">
            {/* Premium section header */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <div className="flex items-center gap-2 px-4">
                <Wifi className="w-6 h-6 text-cyan-400 animate-pulse" />
                <span 
                  className="text-cyan-400 text-sm tracking-[0.3em] uppercase"
                  style={{ fontFamily: "'VT323', monospace" }}
                >
                  {t("arcade.onlineArena") || "ONLINE ARENA"}
                </span>
                <Wifi className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            </div>

            {/* Online Arena card */}
            <div 
              className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0a0f14 0%, #0d1520 50%, #0a0f14 100%)",
              }}
            >
              {/* Animated cyber border */}
              <div 
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #06b6d4, #22d3ee, #0891b2, #22d3ee, #06b6d4)",
                  padding: "2px",
                  backgroundSize: "400% 400%",
                  animation: "cyberShimmer 4s ease infinite",
                }}
              >
                <div className="absolute inset-[2px] rounded-2xl bg-[#0a0f14]" />
              </div>

              {/* Scanning line effect */}
              <div 
                className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"
                style={{ zIndex: 5 }}
              >
                <div 
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                  style={{ animation: "scanLine 3s ease-in-out infinite" }}
                />
              </div>

              {/* RetroPass badge */}
              <div className="absolute top-4 right-4 z-20">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/50">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span 
                    className="text-yellow-400 text-xs font-bold tracking-wider uppercase"
                    style={{ fontFamily: "'VT323', monospace" }}
                  >
                    RETROPASS
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <h3 
                    className="text-4xl md:text-5xl font-bold mb-3"
                    style={{
                      fontFamily: "'VT323', monospace",
                      background: "linear-gradient(180deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 0 40px rgba(6, 182, 212, 0.5)",
                    }}
                  >
                    {t("arcade.onlineArenaTitle") || "MULTIPLAYER ARENA"}
                  </h3>
                  <p 
                    className="text-gray-400 text-lg max-w-2xl mx-auto"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {t("arcade.onlineArenaDesc") || "Challenge other RetroPass members in real-time battles. Climb the ranks and prove your skills!"}
                  </p>
                </div>

                {/* Online Games Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { id: "pong", name: "Pong", Icon: Gamepad2, players: "1v1", type: "realtime" },
                    { id: "tictactoe", name: "Tic Tac Toe", Icon: CircleDot, players: "1v1", type: "turnbased" },
                    { id: "connect4", name: "Connect 4", Icon: Circle, players: "1v1", type: "turnbased" },
                    { id: "reversi", name: "Reversi", Icon: Circle, players: "1v1", type: "turnbased" },
                    { id: "battleship", name: "Battleship", Icon: Ship, players: "1v1", type: "turnbased" },
                    { id: "tanks", name: "Tank Battle", Icon: Crosshair, players: "1v1", type: "realtime" },
                    { id: "checkers", name: "Checkers", Icon: Square, players: "1v1", type: "turnbased" },
                    { id: "memory_duel", name: "Memory Duel", Icon: Brain, players: "1v1", type: "turnbased" },
                  ].map((game) => (
                    <button
                      key={game.id}
                      onClick={() => navigate(`/online?game=${game.id}`)}
                      className="group relative p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105"
                      style={{ boxShadow: "0 0 20px rgba(6, 182, 212, 0.1)" }}
                    >
                      {/* Game type badge */}
                      <div className="absolute -top-2 -right-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 ${
                          game.type === "realtime" 
                            ? "bg-red-500/20 text-red-400 border border-red-500/40" 
                            : "bg-green-500/20 text-green-400 border border-green-500/40"
                        }`}>
                          {game.type === "realtime" ? <><Zap className="w-3 h-3" /> LIVE</> : <><Target className="w-3 h-3" /> TURN</>}
                        </span>
                      </div>
                      
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform flex justify-center"><game.Icon className="w-10 h-10 text-cyan-400" /></div>
                      <h4 
                        className="text-cyan-300 font-bold text-sm mb-1"
                        style={{ fontFamily: "'VT323', monospace" }}
                      >
                        {game.name}
                      </h4>
                      <div className="flex items-center justify-center gap-1 text-gray-500 text-xs">
                        <Users className="w-3 h-3" />
                        <span>{game.players}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap justify-center gap-6 pt-4 border-t border-cyan-500/20">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {t("arcade.playersOnline") || "Players Online"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {t("arcade.rankedMatches") || "Ranked Matches"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Trophy className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {t("arcade.eloRating") || "ELO Rating System"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cyber shimmer animation */}
              <style>{`
                @keyframes cyberShimmer {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
                @keyframes scanLine {
                  0% { top: -2px; opacity: 0; }
                  20% { opacity: 1; }
                  80% { opacity: 1; }
                  100% { top: 100%; opacity: 0; }
                }
              `}</style>
            </div>
          </div>

          {/* === ANIME ARENA - Turn-Based Online Games === */}
          <div className="mb-12 arcade-land arcade-land-9">
            {/* Anime-style header */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
              <div className="flex items-center gap-2 px-4">
                <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
                <span 
                  className="text-pink-400 text-sm tracking-[0.3em] uppercase"
                  style={{ fontFamily: "'VT323', monospace" }}
                >
                  {t("arcade.animeArena") || "ANIME ARENA"}
                </span>
                <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
            </div>

            {/* Anime Arena card */}
            <div 
              className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #1a0a1e 0%, #2d1033 50%, #1a0a1e 100%)",
              }}
            >
              {/* Animated anime border */}
              <div 
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #ec4899, #f472b6, #db2777, #f472b6, #ec4899)",
                  padding: "2px",
                  backgroundSize: "400% 400%",
                  animation: "animeShimmer 4s ease infinite",
                }}
              >
                <div className="absolute inset-[2px] rounded-2xl bg-[#1a0a1e]" />
              </div>

              {/* Sparkle effects */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" style={{ zIndex: 5 }}>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-pink-300 rounded-full"
                    style={{
                      left: `${10 + i * 12}%`,
                      top: `${20 + (i % 3) * 25}%`,
                      animation: `sparkle ${1.5 + i * 0.2}s ease-in-out infinite`,
                      animationDelay: `${i * 0.3}s`,
                    }}
                  />
                ))}
              </div>

              {/* RetroPass badge */}
              <div className="absolute top-4 right-4 z-20">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/50">
                  <Crown className="w-4 h-4 text-pink-400" />
                  <span 
                    className="text-pink-400 text-xs font-bold tracking-wider uppercase"
                    style={{ fontFamily: "'VT323', monospace" }}
                  >
                    RETROPASS
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <h3 
                    className="text-4xl md:text-5xl font-bold mb-3"
                    style={{
                      fontFamily: "'VT323', monospace",
                      background: "linear-gradient(180deg, #f472b6 0%, #ec4899 50%, #db2777 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 0 40px rgba(236, 72, 153, 0.5)",
                    }}
                  >
                    {t("arcade.animeArenaTitle") || "ANIME BATTLE ARENA"}
                  </h3>
                  <p 
                    className="text-gray-400 text-lg max-w-2xl mx-auto"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {t("arcade.animeArenaDesc") || "Epic turn-based battles with anime aesthetics. Summon monsters, cast spells, and duel to victory!"}
                  </p>
                </div>

                {/* Anime Games Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {[
                    { 
                      id: "card_battle", 
                      name: t("arcade.cardBattle") || "Card Battle", 
                      Icon: Spade, 
                      desc: t("arcade.cardBattleDesc") || "Yu-Gi-Oh style duels",
                      features: ["8000 LP", "Monsters/Spells/Traps", "Turn-based"],
                      gradient: "from-purple-600 to-indigo-700",
                      ready: true
                    },
                    { 
                      id: "turn_battle", 
                      name: t("arcade.turnBattle") || "Turn Battle", 
                      Icon: Swords, 
                      desc: t("arcade.turnBattleDesc") || "RPG-style combat",
                      features: ["Skills & Elements", "Items & Combos", "Character Classes"],
                      gradient: "from-red-600 to-orange-700",
                      ready: false
                    },
                    { 
                      id: "quiz_battle", 
                      name: t("arcade.quizBattle") || "Quiz Battle", 
                      Icon: HelpCircle, 
                      desc: t("arcade.quizBattleDesc") || "Anime trivia showdown",
                      features: ["Anime Questions", "Speed Bonus", "Rankings"],
                      gradient: "from-cyan-600 to-blue-700",
                      ready: false
                    },
                  ].map((game) => (
                    <button
                      key={game.id}
                      onClick={() => game.ready && navigate(`/online?game=${game.id}`)}
                      disabled={!game.ready}
                      className={`group relative p-6 rounded-xl border transition-all duration-300 ${
                        game.ready 
                          ? "border-pink-500/40 bg-pink-950/20 hover:bg-pink-900/30 hover:border-pink-400/60 hover:scale-105 cursor-pointer"
                          : "border-gray-700/40 bg-gray-900/20 cursor-not-allowed opacity-60"
                      }`}
                      style={{ boxShadow: game.ready ? "0 0 30px rgba(236, 72, 153, 0.15)" : "none" }}
                    >
                      {/* Status badge */}
                      <div className="absolute -top-2 -right-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          game.ready 
                            ? "bg-green-500/20 text-green-400 border border-green-500/40" 
                            : "bg-gray-500/20 text-gray-400 border border-gray-500/40"
                        }`}>
                          {game.ready ? <><Check className="w-3 h-3 inline mr-0.5" />PLAY</> : "COMING SOON"}
                        </span>
                      </div>
                      
                      {/* Icon with gradient background */}
                      <div 
                        className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center bg-gradient-to-br ${game.gradient} group-hover:scale-110 transition-transform`}
                        style={{ boxShadow: game.ready ? "0 0 20px rgba(0,0,0,0.3)" : "none" }}
                      >
                        <game.Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <h4 
                        className="text-pink-300 font-bold text-xl mb-2"
                        style={{ fontFamily: "'VT323', monospace" }}
                      >
                        {game.name}
                      </h4>
                      
                      <p className="text-gray-500 text-sm mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>
                        {game.desc}
                      </p>
                      
                      {/* Features */}
                      <div className="flex flex-wrap justify-center gap-1">
                        {game.features.map((feature, i) => (
                          <span 
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-black/30 text-gray-400 border border-gray-700/50"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Info row */}
                <div className="flex flex-wrap justify-center gap-6 pt-4 border-t border-pink-500/20">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Swords className="w-4 h-4 text-pink-400" />
                    <span className="text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {t("arcade.animeTurnBased") || "Turn-Based Strategy"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4 text-pink-400" />
                    <span className="text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {t("arcade.anime1v1") || "1v1 Duels"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Trophy className="w-4 h-4 text-pink-400" />
                    <span className="text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {t("arcade.animeRanked") || "Ranked Matches"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Anime shimmer animation */}
              <style>{`
                @keyframes animeShimmer {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
                @keyframes sparkle {
                  0%, 100% { opacity: 0; transform: scale(0); }
                  50% { opacity: 1; transform: scale(1); }
                }
              `}</style>
            </div>
          </div>

          {/* Game Achievements Section */}
          {achievementDisplays.length > 0 && (
            <div className="mb-12 arcade-land arcade-land-5">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-purple-400" />
                <h2 
                  className="text-2xl font-bold text-purple-400"
                  style={{ fontFamily: "'VT323', monospace" }}
                >
                  {t("arcade.gameAchievements") || "GAME ACHIEVEMENTS"}
                </h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {achievementDisplays.map((achievement) => {
                  const rarityColors: Record<string, { bg: string; border: string; glow: string }> = {
                    common: { bg: "from-gray-700/40 to-gray-800/40", border: "#a0a0a0", glow: "rgba(160, 160, 160, 0.3)" },
                    uncommon: { bg: "from-green-900/40 to-emerald-900/40", border: "#4ade80", glow: "rgba(74, 222, 128, 0.3)" },
                    rare: { bg: "from-blue-900/40 to-indigo-900/40", border: "#3b82f6", glow: "rgba(59, 130, 246, 0.3)" },
                    epic: { bg: "from-purple-900/40 to-violet-900/40", border: "#a855f7", glow: "rgba(168, 85, 247, 0.3)" },
                    legendary: { bg: "from-yellow-900/40 to-amber-900/40", border: "#fbbf24", glow: "rgba(251, 191, 36, 0.3)" },
                  };
                  const colors = rarityColors[achievement.rarity] || rarityColors.common;
                  
                  return (
                    <div
                      key={achievement.id}
                      className={`relative group transition-all duration-300 ${
                        achievement.earned ? "hover:scale-105" : "opacity-50"
                      }`}
                    >
                      <div 
                        className={`relative overflow-hidden rounded-xl border p-4 ${
                          achievement.earned 
                            ? `bg-gradient-to-br ${colors.bg} border-opacity-50` 
                            : "bg-black/30 border-white/5"
                        }`}
                        style={{
                          borderColor: achievement.earned ? colors.border : undefined,
                          boxShadow: achievement.earned ? `0 0 20px ${colors.glow}` : "none",
                        }}
                      >
                        {/* Achievement icon */}
                        <div className="text-center mb-2">
                          <span 
                            className="text-3xl"
                            style={{ filter: achievement.earned ? "none" : "grayscale(1)" }}
                          >
                            {achievement.icon}
                          </span>
                        </div>
                        
                        {/* Achievement name */}
                        <h3 
                          className="text-center text-sm font-bold mb-1 truncate"
                          style={{ 
                            fontFamily: "'VT323', monospace",
                            color: achievement.earned ? colors.border : "#666",
                          }}
                        >
                          {achievement.name}
                        </h3>
                        
                        {/* Rarity tag */}
                        <p className="text-center text-xs text-gray-500 capitalize">
                          {achievement.rarity}
                        </p>
                        
                        {/* Progress bar for unearned */}
                        {!achievement.earned && achievement.progress > 0 && (
                          <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500"
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        )}
                        
                        {/* Lock indicator */}
                        {!achievement.earned && (
                          <div className="absolute top-2 right-2">
                            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black border border-purple-500/50 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48">
                        <p className="text-white font-bold mb-1">{achievement.name}</p>
                        <p className="text-gray-400">{achievement.description}</p>
                        {achievement.games_required && (
                          <p className="text-purple-400 text-xs mt-1">
                            {t("arcade.gamesPlayed") || "Games played"}: {gamesPlayed}/{achievement.games_required}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leaderboard Section */}
          <div className="mb-12 arcade-land arcade-land-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
                <h2 
                  className="text-2xl font-bold text-cyan-400"
                  style={{ fontFamily: "'VT323', monospace" }}
                >
                  {t("arcade.leaderboard") || "LEADERBOARD"}
                </h2>
              </div>
              
              {/* Period filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4 text-gray-400" />
                {(["day", "week", "month", "year", "all"] as LeaderboardPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setLeaderboardPeriod(period)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      leaderboardPeriod === period
                        ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                        : "bg-black/30 text-gray-400 border border-white/10 hover:border-cyan-500/30 hover:text-cyan-400"
                    }`}
                    style={{ fontFamily: "'VT323', monospace" }}
                  >
                    {t(`arcade.period.${period}`) || period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* User's personal stats (if logged in) */}
            {user && userRankings && userRankings.overallStats && (
              <div 
                className="mb-6 p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-900/20 to-purple-900/20"
                style={{ boxShadow: "0 0 30px rgba(6, 182, 212, 0.1)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-300 font-bold" style={{ fontFamily: "'VT323', monospace" }}>
                    {t("arcade.yourStats") || "YOUR STATS"}
                  </span>
                  {(userRankings.overallRank ?? 0) > 0 && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                      #{userRankings.overallRank} {t("arcade.overall") || "Overall"}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
                      {(userRankings.overallStats?.total_score ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">{t("arcade.totalScore") || "Total Score"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
                      {userRankings.overallStats?.games_played ?? 0}
                    </p>
                    <p className="text-xs text-gray-400">{t("arcade.gamesPlayedShort") || "Games"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'VT323', monospace" }}>
                      {userRankings.overallStats?.total_tickets ?? 0}
                    </p>
                    <p className="text-xs text-gray-400">{t("arcade.ticketsEarned") || "Tickets"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Game filter tabs */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedLeaderboardGame(null)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                  selectedLeaderboardGame === null
                    ? "bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-white border border-cyan-500/50"
                    : "bg-black/30 text-gray-400 border border-white/10 hover:border-white/30"
                }`}
                style={{ fontFamily: "'VT323', monospace" }}
              >
                {t("arcade.allGames") || "All Games"}
              </button>
              {leaderboardData?.activeGames?.slice(0, 8).map((game) => (
                <button
                  key={game.game_type}
                  onClick={() => setSelectedLeaderboardGame(game.game_type)}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                    selectedLeaderboardGame === game.game_type
                      ? "bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-white border border-cyan-500/50"
                      : "bg-black/30 text-gray-400 border border-white/10 hover:border-white/30"
                  }`}
                  style={{ fontFamily: "'VT323', monospace" }}
                >
                  {game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1)}
                </button>
              ))}
            </div>

            {/* Leaderboard table */}
            {leaderboardLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div 
                className="rounded-xl border border-white/10 overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(6, 182, 212, 0.05) 100%)" }}
              >
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 p-3 bg-black/40 border-b border-white/10 text-xs text-gray-400 uppercase">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-5">{t("arcade.player") || "Player"}</div>
                  <div className="col-span-3 text-right">{t("arcade.score") || "Score"}</div>
                  <div className="col-span-3 text-right">{t("arcade.games") || "Games"}</div>
                </div>

                {/* Leaderboard entries */}
                {(selectedLeaderboardGame ? leaderboardData?.perGame : leaderboardData?.overall)?.slice(0, 10).map((entry, idx) => {
                  const isCurrentUser = user?.id === entry.user_id;
                  const hasRetroPass = entry.has_retropass === 1;
                  const customColor = entry.leaderboard_color || null;
                  const customIcon = entry.leaderboard_icon || null;
                  const customTitle = entry.display_title || null;
                  
                  // Color mapping for RetroPass custom colors
                  const colorMap: Record<string, string> = {
                    gold: "text-yellow-400",
                    purple: "text-purple-400",
                    cyan: "text-cyan-400",
                    pink: "text-pink-400",
                    green: "text-green-400",
                    orange: "text-orange-400",
                    red: "text-red-400",
                    blue: "text-blue-400",
                    white: "text-white",
                    rainbow: "bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent",
                  };
                  
                  const rankColors = [
                    { bg: "from-yellow-500/20 to-amber-500/20", border: "border-yellow-500/50", text: "text-yellow-400" },
                    { bg: "from-gray-400/20 to-slate-400/20", border: "border-gray-400/50", text: "text-gray-300" },
                    { bg: "from-amber-700/20 to-orange-700/20", border: "border-amber-700/50", text: "text-amber-500" },
                  ];
                  const rankStyle = rankColors[idx] || { bg: "", border: "border-transparent", text: "text-gray-400" };
                  
                  // Determine player name color
                  const nameColor = hasRetroPass && customColor 
                    ? colorMap[customColor] || "text-white"
                    : isCurrentUser 
                      ? "text-cyan-300" 
                      : "text-white";

                  return (
                    <div 
                      key={entry.user_id}
                      className={`grid grid-cols-12 gap-2 p-3 items-center transition-all ${
                        hasRetroPass 
                          ? "bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-yellow-500/10 border-l-2 border-l-yellow-500"
                          : isCurrentUser 
                            ? "bg-cyan-500/10 border-l-2 border-l-cyan-500" 
                            : idx < 3 
                              ? `bg-gradient-to-r ${rankStyle.bg}` 
                              : "hover:bg-white/5"
                      } ${idx > 0 ? "border-t border-white/5" : ""}`}
                    >
                      <div className="col-span-1 text-center">
                        {idx < 3 ? (
                          <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${rankStyle.border} border-2`}>
                            <Medal className={`w-3.5 h-3.5 ${rankStyle.text}`} />
                          </div>
                        ) : (
                          <span className="text-gray-500 font-mono">{idx + 1}</span>
                        )}
                      </div>
                      <div className="col-span-5 truncate flex items-center gap-2">
                        {/* RetroPass custom icon */}
                        {hasRetroPass && customIcon && (
                          <span className="text-base flex-shrink-0">{customIcon}</span>
                        )}
                        {/* RetroPass Crown badge */}
                        {hasRetroPass && (
                          <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span 
                            className={`font-medium truncate ${nameColor}`} 
                            style={{ fontFamily: "'VT323', monospace" }}
                          >
                            {isCurrentUser ? t("arcade.you") || "You" : `Player ${entry.user_id.slice(0, 6)}`}
                          </span>
                          {/* RetroPass custom title */}
                          {hasRetroPass && customTitle && (
                            <span className="text-[10px] text-yellow-500/80 uppercase tracking-wider truncate">
                              {customTitle}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-white font-bold" style={{ fontFamily: "'VT323', monospace" }}>
                          {(entry.total_score ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-gray-400">{entry.games_played}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Empty state */}
                {(!selectedLeaderboardGame ? leaderboardData?.overall : leaderboardData?.perGame)?.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{t("arcade.noScoresYet") || "No scores yet. Be the first to play!"}</p>
                  </div>
                )}
              </div>
            )}

            {/* User's per-game stats */}
            {user && userRankings && userRankings.gameStats && userRankings.gameStats.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-purple-400 mb-4" style={{ fontFamily: "'VT323', monospace" }}>
                  {t("arcade.yourGameStats") || "YOUR GAME STATS"}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {userRankings.gameStats.map((stat) => (
                    <div 
                      key={stat.game_type}
                      className="p-3 rounded-lg border border-purple-500/20 bg-purple-900/10 hover:border-purple-500/40 transition-all"
                    >
                      <p className="text-sm font-bold text-white truncate" style={{ fontFamily: "'VT323', monospace" }}>
                        {stat.game_type.charAt(0).toUpperCase() + stat.game_type.slice(1)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {t("arcade.highScore") || "High"}: <span className="text-purple-400">{(stat.high_score ?? 0).toLocaleString()}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {t("arcade.total") || "Total"}: {(stat.total_score ?? 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ticket Shop Section */}
          <div className="mb-12 arcade-land arcade-land-10">
            <div className="flex items-center gap-3 mb-6">
              <Gift className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-bold text-amber-400" style={{ fontFamily: "'VT323', monospace" }}>
                {t("arcade.ticketShop") || "TICKET SHOP"}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500/50 to-transparent" />
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-bold" style={{ fontFamily: "'VT323', monospace" }}>
                  {tickets.toLocaleString()}
                </span>
              </div>
            </div>
            
            <p className="text-gray-400 mb-6">
              {t("arcade.ticketShopDesc") || "Redeem your tickets for exclusive rewards, discounts, and customizations!"}
            </p>

            {/* Rewards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rewards.filter(r => r.is_active).map((reward) => {
                const canAfford = tickets >= reward.ticket_cost;
                const isRedeeming = redeemingId === reward.id;
                const alreadyOwned = reward.type === "avatar" || reward.type === "title" || reward.type === "frame"
                  ? myRewards.some(mr => mr.reward_id === reward.id && !mr.is_used)
                  : false;
                
                // Icon based on type
                const RewardIcon = reward.type === "coupon" ? Percent
                  : reward.type === "avatar" ? Palette
                  : reward.type === "title" ? Tag
                  : reward.type === "boost" ? Flame
                  : reward.type === "frame" ? Award
                  : Package;
                
                // Color based on type
                const typeColor = reward.type === "coupon" ? "emerald"
                  : reward.type === "avatar" ? "purple"
                  : reward.type === "title" ? "cyan"
                  : reward.type === "boost" ? "orange"
                  : reward.type === "frame" ? "yellow"
                  : "pink";
                
                return (
                  <div
                    key={reward.id}
                    className={`relative p-4 rounded-xl border transition-all ${
                      canAfford && !alreadyOwned
                        ? `border-${typeColor}-500/40 bg-${typeColor}-900/10 hover:border-${typeColor}-500/60 hover:bg-${typeColor}-900/20`
                        : "border-gray-700/50 bg-gray-900/30 opacity-60"
                    }`}
                    style={{
                      boxShadow: canAfford && !alreadyOwned ? `0 0 20px rgba(var(--${typeColor}-rgb), 0.1)` : "none",
                    }}
                  >
                    {/* Type badge */}
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold bg-${typeColor}-500/20 text-${typeColor}-400 border border-${typeColor}-500/30`}>
                      {reward.type.toUpperCase()}
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${typeColor}-500/20 to-${typeColor}-600/10 border border-${typeColor}-500/30 flex items-center justify-center mb-3`}>
                      <RewardIcon className={`w-6 h-6 text-${typeColor}-400`} />
                    </div>
                    
                    {/* Name & Description */}
                    <h3 className="font-bold text-white mb-1" style={{ fontFamily: "'VT323', monospace" }}>
                      {reward.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {reward.description}
                    </p>
                    
                    {/* Cost & Redeem */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-amber-400" style={{ fontFamily: "'VT323', monospace" }}>
                          {reward.ticket_cost.toLocaleString()}
                        </span>
                      </div>
                      
                      {alreadyOwned ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm">
                          <Check className="w-4 h-4" />
                          {t("arcade.owned") || "Owned"}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRedeemReward(reward.id)}
                          disabled={!canAfford || !user || isRedeeming}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                            canAfford && user
                              ? `bg-gradient-to-r from-${typeColor}-500 to-${typeColor}-600 text-white hover:from-${typeColor}-400 hover:to-${typeColor}-500`
                              : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {isRedeeming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : !user ? (
                            t("arcade.loginToRedeem") || "Login"
                          ) : !canAfford ? (
                            t("arcade.notEnoughTickets") || "Not enough"
                          ) : (
                            t("arcade.redeem") || "Redeem"
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Limited quantity indicator */}
                    {reward.quantity_available !== null && reward.quantity_available > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {reward.quantity_available} {t("arcade.remaining") || "remaining"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* My Rewards Section */}
            {user && myRewards.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-amber-400 mb-4" style={{ fontFamily: "'VT323', monospace" }}>
                  {t("arcade.myRewards") || "MY REWARDS"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className={`p-3 rounded-lg border ${
                        reward.is_used 
                          ? "border-gray-700/30 bg-gray-900/20 opacity-50"
                          : "border-amber-500/30 bg-amber-900/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-sm" style={{ fontFamily: "'VT323', monospace" }}>
                            {reward.reward_name}
                          </p>
                          {reward.reward_code && (
                            <p className="text-xs text-amber-400 font-mono mt-1">
                              {t("arcade.code") || "Code"}: {reward.reward_code}
                            </p>
                          )}
                        </div>
                        <div className={`px-2 py-0.5 rounded text-xs ${
                          reward.is_used 
                            ? "bg-gray-700/50 text-gray-500"
                            : "bg-green-500/20 text-green-400"
                        }`}>
                          {reward.is_used 
                            ? (t("arcade.used") || "Used")
                            : (t("arcade.active") || "Active")
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Trophy showcase */}
          <div className="text-center py-8 arcade-land arcade-land-6">
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div className="text-left">
                <p className="text-yellow-400 font-bold" style={{ fontFamily: "'VT323', monospace" }}>
                  {t("arcade.earnBadges") || "EARN BADGES BY SHOPPING!"}
                </p>
                <p className="text-gray-400 text-sm">
                  {t("arcade.spendToEarn") || "Every purchase gets you closer to the next badge"}
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />

      {/* Game Info Modal */}
      {showInfoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInfoModal(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div 
            className="relative z-10 w-full max-w-md rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)",
              boxShadow: "0 0 60px rgba(6, 182, 212, 0.3), 0 0 120px rgba(139, 92, 246, 0.2)",
              border: "2px solid rgba(6, 182, 212, 0.5)",
            }}
          >
            {/* Header */}
            <div 
              className="p-4 border-b border-cyan-500/30"
              style={{
                background: "linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="w-6 h-6 text-cyan-400" />
                  <h3 
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: "'VT323', monospace" }}
                  >
                    {showInfoModal.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowInfoModal(null)}
                  className="w-8 h-8 rounded-full bg-black/50 border border-white/20 text-white flex items-center justify-center hover:bg-red-500/30 hover:border-red-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Game cover */}
              <div className="relative w-full h-40 rounded-lg overflow-hidden mb-6">
                <img 
                  src={showInfoModal.cover} 
                  alt={showInfoModal.name}
                  className="w-full h-full object-cover"
                />
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
                  }}
                />
              </div>
              
              {/* Credits info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider">{t("arcade.developer") || "Developer"}</p>
                    <p className="text-white font-medium">{showInfoModal.credits.developer}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider">{t("arcade.originalConcept") || "Original Concept"}</p>
                    <p className="text-white font-medium">{showInfoModal.credits.originalConcept}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-center">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{t("arcade.license") || "License"}</p>
                    <p className="text-green-400 font-medium text-sm">{showInfoModal.credits.license}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-center">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{t("arcade.year") || "Year"}</p>
                    <p className="text-yellow-400 font-medium text-sm">{showInfoModal.credits.year}</p>
                  </div>
                </div>
              </div>
              
              {/* Category badge */}
              <div className="mt-6 flex justify-center">
                <span className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400 text-sm font-medium">
                  {showInfoModal.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Arcade Cabinet Modal */}
      {selectedGame && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          onClick={closeGame}
        >
          {/* Dark ambient background with animated glow */}
          <div className="absolute inset-0 bg-black">
            {/* Floor reflection */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-1/3"
              style={{
                background: "linear-gradient(to top, rgba(236, 72, 153, 0.15) 0%, transparent 100%)",
              }}
            />
            {/* Ambient side lights */}
            <div 
              className="absolute left-0 top-1/4 bottom-1/4 w-32"
              style={{
                background: "radial-gradient(ellipse at left center, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
              }}
            />
            <div 
              className="absolute right-0 top-1/4 bottom-1/4 w-32"
              style={{
                background: "radial-gradient(ellipse at right center, rgba(6, 182, 212, 0.3) 0%, transparent 70%)",
              }}
            />
          </div>

          {/* Arcade Cabinet */}
          <div 
            className="relative z-10 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: "perspective(1200px) rotateX(2deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Cabinet Top Header */}
            <div 
              className="relative w-[500px] h-16 rounded-t-3xl"
              style={{
                background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)",
                boxShadow: "0 -4px 20px rgba(236, 72, 153, 0.3), inset 0 2px 4px rgba(255,255,255,0.1)",
                borderTop: "2px solid rgba(236, 72, 153, 0.5)",
                borderLeft: "2px solid rgba(139, 92, 246, 0.3)",
                borderRight: "2px solid rgba(6, 182, 212, 0.3)",
              }}
            >
              {/* Game Title Marquee */}
              <div 
                className="absolute inset-x-8 inset-y-2 rounded-lg overflow-hidden flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)",
                  boxShadow: "0 0 30px rgba(236, 72, 153, 0.5), inset 0 0 20px rgba(0,0,0,0.3)",
                }}
              >
                <h2 
                  className="text-2xl font-bold text-white tracking-widest"
                  style={{ 
                    fontFamily: "'VT323', monospace",
                    textShadow: "0 0 10px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {GAMES.find(g => g.id === selectedGame)?.name?.toUpperCase()}
                </h2>
                {/* Scanlines overlay on marquee */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
                  }}
                />
              </div>
              {/* Decorative bolts */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-700 border border-gray-600" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-700 border border-gray-600" />
            </div>

            {/* Main Cabinet Body */}
            <div 
              className="relative w-[500px]"
              style={{
                background: "linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #0a0a14 100%)",
                boxShadow: "0 0 60px rgba(0,0,0,0.8), inset 0 0 2px rgba(255,255,255,0.05)",
                borderLeft: "3px solid #1a1a2e",
                borderRight: "3px solid #1a1a2e",
              }}
            >
              {/* Neon edge strips */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{
                  background: "linear-gradient(180deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)",
                  boxShadow: "-4px 0 20px rgba(139, 92, 246, 0.5)",
                }}
              />
              <div 
                className="absolute right-0 top-0 bottom-0 w-1"
                style={{
                  background: "linear-gradient(180deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)",
                  boxShadow: "4px 0 20px rgba(139, 92, 246, 0.5)",
                }}
              />

              {/* Screen Bezel */}
              <div className="p-6">
                <div 
                  className="relative rounded-lg overflow-hidden"
                  style={{
                    background: "#000",
                    boxShadow: "0 0 40px rgba(139, 92, 246, 0.3), inset 0 0 60px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.5)",
                    border: "4px solid #2a2a3e",
                  }}
                >
                  {/* Inner bezel glow */}
                  <div 
                    className="absolute inset-0 rounded pointer-events-none"
                    style={{
                      boxShadow: "inset 0 0 30px rgba(236, 72, 153, 0.2), inset 0 0 60px rgba(139, 92, 246, 0.1)",
                    }}
                  />
                  
                  {/* Game Screen Area */}
                  <div className="relative bg-black" style={{ minHeight: "360px" }}>
                    {/* Render actual game */}
                    {selectedGame === "2048" && <Game2048 onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "snake" && <SnakeGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "memory" && <MemoryGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "tetris" && <TetrisGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "breakout" && <BreakoutGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "flappy" && <FlappyGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "pong" && <PongGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "asteroids" && <AsteroidsGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "invaders" && <InvadersGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "pacman" && <PacmanGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "frogger" && <FroggerGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "dino" && <DinoGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "minesweeper" && <MinesweeperGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "sudoku" && <SudokuGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "wordle" && <WordleGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "sliding" && <SlidingPuzzleGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "lights" && <LightsOutGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "fifteen" && <FifteenPuzzleGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "helicopter" && <HelicopterGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "tanks" && <TanksGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "shooter" && <ShooterGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "dodge" && <DodgeGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "platformer" && <PlatformerGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "racing" && <RacingGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "blackjack" && <BlackjackGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "solitaire" && <SolitaireGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "tictactoe" && <TicTacToeGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "connect4" && <Connect4Game onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "reversi" && <ReversiGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "simon" && <SimonGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "reaction" && <ReactionGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "aim" && <AimTrainerGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "typing" && <TypingGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "color" && <ColorMatchGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "math" && <MathBlitzGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    {selectedGame === "sequence" && <SequenceGame onGameEnd={handleGameEnd} onScoreUpdate={handleScoreUpdate} />}
                    
                    {/* Tickets earned overlay */}
                    {ticketsEarned !== null && (
                      <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20">
                        <Sparkles className="w-12 h-12 text-yellow-400 mb-3 animate-pulse" />
                        <div className="text-2xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'VT323', monospace" }}>
                          +{ticketsEarned} TICKETS!
                        </div>
                        <div className="text-gray-400 text-sm mb-4">Score: {currentScore}</div>
                        <button
                          onClick={closeGame}
                          className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded"
                        >
                          CLOSE
                        </button>
                      </div>
                    )}
                    
                    {/* Scanlines overlay */}
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-20 z-10"
                      style={{
                        background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Control Panel */}
              <div 
                className="relative mx-4 mb-4 p-4 rounded-lg"
                style={{
                  background: "linear-gradient(180deg, #1f1f35 0%, #151525 100%)",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5), 0 -2px 10px rgba(139, 92, 246, 0.2)",
                  border: "2px solid #2a2a3e",
                }}
              >
                <div className="flex items-center justify-between gap-6">
                  {/* Joystick */}
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-16 h-16 rounded-full relative"
                      style={{
                        background: "linear-gradient(145deg, #2a2a3e 0%, #1a1a2e 100%)",
                        boxShadow: "inset 0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)",
                      }}
                    >
                      {/* Joystick stick */}
                      <div 
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full"
                        style={{
                          background: "linear-gradient(145deg, #3a3a4e 0%, #1a1a2e 100%)",
                          boxShadow: "0 4px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1)",
                        }}
                      >
                        {/* Ball top */}
                        <div 
                          className="absolute left-1/2 -top-4 -translate-x-1/2 w-6 h-6 rounded-full"
                          style={{
                            background: "linear-gradient(145deg, #ff4081 0%, #c51162 100%)",
                            boxShadow: "0 2px 10px rgba(236, 72, 153, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)",
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 font-mono">MOVE</span>
                  </div>

                  {/* Center buttons */}
                  <div className="flex gap-3">
                    <button 
                      className="px-4 py-1 text-xs font-mono rounded"
                      style={{
                        background: "linear-gradient(180deg, #3a3a4e 0%, #2a2a3e 100%)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)",
                        color: "#888",
                      }}
                    >
                      1P
                    </button>
                    <button 
                      className="px-4 py-1 text-xs font-mono rounded"
                      style={{
                        background: "linear-gradient(180deg, #3a3a4e 0%, #2a2a3e 100%)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)",
                        color: "#888",
                      }}
                    >
                      2P
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {[
                      { color: "#ec4899", label: "A" },
                      { color: "#8b5cf6", label: "B" },
                      { color: "#06b6d4", label: "C" },
                    ].map((btn, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{
                            background: `linear-gradient(145deg, ${btn.color} 0%, ${btn.color}99 100%)`,
                            boxShadow: `0 4px 12px ${btn.color}66, inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
                          }}
                        >
                          {btn.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Speaker grille */}
                <div className="flex justify-center gap-4 mt-3">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-1 h-3 rounded-full bg-gray-700" />
                  ))}
                </div>
              </div>

              {/* Coin slot area */}
              <div 
                className="mx-4 mb-4 p-3 rounded-lg flex items-center justify-center gap-4"
                style={{
                  background: "linear-gradient(180deg, #151525 0%, #0a0a14 100%)",
                  border: "1px solid #2a2a3e",
                }}
              >
                <div 
                  className="w-8 h-4 rounded-sm"
                  style={{
                    background: "linear-gradient(180deg, #1a1a2e 0%, #0a0a14 100%)",
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8)",
                    border: "1px solid #333",
                  }}
                />
                <span className="text-[10px] text-yellow-500 font-mono tracking-widest">INSERT COIN</span>
                <div 
                  className="w-8 h-4 rounded-sm"
                  style={{
                    background: "linear-gradient(180deg, #1a1a2e 0%, #0a0a14 100%)",
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8)",
                    border: "1px solid #333",
                  }}
                />
              </div>
            </div>

            {/* Cabinet Base */}
            <div 
              className="w-[520px] h-8 rounded-b-lg"
              style={{
                background: "linear-gradient(180deg, #0a0a14 0%, #050508 100%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.8)",
                borderBottom: "2px solid #1a1a2e",
                borderLeft: "3px solid #0f0f1a",
                borderRight: "3px solid #0f0f1a",
              }}
            />

            {/* Close button - floating */}
            <button
              onClick={closeGame}
              className="absolute -top-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 hover:scale-110"
              style={{
                background: "linear-gradient(145deg, #ec4899 0%, #be185d 100%)",
                boxShadow: "0 0 20px rgba(236, 72, 153, 0.5), 0 4px 8px rgba(0,0,0,0.3)",
                color: "white",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            >
              ✕
            </button>
          </div>

          {/* Keyframe animations */}
          <style>{`
            @keyframes screenFlicker {
              0% { opacity: 0.03; }
              50% { opacity: 0.05; }
              100% { opacity: 0.03; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
