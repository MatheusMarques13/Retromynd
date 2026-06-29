import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router';
import { useAuth } from '@/react-app/auth';
import { useLanguage } from '@/react-app/contexts/LanguageContext';
import { Header } from '@/react-app/components/Header';
import { Footer } from '@/react-app/components/Footer';
import { 
  Crown, Users, ArrowLeft, Copy, Check, Loader2, Gamepad2, Shield, Zap, AlertTriangle,
  CircleDot, Circle, Ship, Target, Flag, Brain, type LucideIcon
} from 'lucide-react';

// Icon mapping for game types
const GAME_ICON_MAP: Record<string, LucideIcon> = {
  Gamepad2, CircleDot, Circle, Ship, Target, Flag, Brain,
};

const ONLINE_GAMES = [
  { id: 'pong', name: 'Pong', type: 'realtime', icon: 'Gamepad2', color: '#00ffff' },
  { id: 'tictactoe', name: 'Tic Tac Toe', type: 'turn-based', icon: 'CircleDot', color: '#ff6b9d' },
  { id: 'connect4', name: 'Connect 4', type: 'turn-based', icon: 'Circle', color: '#ffd700' },
  { id: 'reversi', name: 'Reversi', type: 'turn-based', icon: 'Circle', color: '#9d4edd' },
  { id: 'battleship', name: 'Battleship', type: 'turn-based', icon: 'Ship', color: '#00bfff' },
  { id: 'tanks', name: 'Tank Battle', type: 'realtime', icon: 'Target', color: '#32cd32' },
  { id: 'checkers', name: 'Checkers', type: 'turn-based', icon: 'Flag', color: '#ff4500' },
  { id: 'memory', name: 'Memory Duel', type: 'turn-based', icon: 'Brain', color: '#da70d6' },
];

// Helper to render game icon
const renderGameIcon = (iconName: string, className?: string) => {
  const IconComponent = GAME_ICON_MAP[iconName] || Gamepad2;
  return <IconComponent className={className} />;
};

export default function OnlineLobby() {
  const { user } = useAuth();
  useLanguage(); // For future translations
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Check if demo mode
  const isDemo = location.pathname === "/online/demo";
  
  const [hasRetroPass, setHasRetroPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string | null>(searchParams.get('game'));
  const [mode] = useState<'select' | 'matchmaking' | 'private'>('select');
  const [matchmaking, setMatchmaking] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ wins: number; losses: number; draws: number; games: number } | null>(null);
  const [playersOnline, setPlayersOnline] = useState(Math.floor(Math.random() * 50) + 10);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isDemo) {
      // Demo mode: simulate RetroPass subscriber
      setHasRetroPass(true);
      setStats({ wins: 47, losses: 23, draws: 8, games: 78 });
      setLoading(false);
    } else {
      checkRetroPass();
      fetchStats();
    }
    // Simulate players online fluctuation
    const interval = setInterval(() => {
      setPlayersOnline(prev => Math.max(5, prev + Math.floor(Math.random() * 7) - 3));
    }, 5000);
    return () => {
      clearInterval(interval);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isDemo]);

  const checkRetroPass = async () => {
    try {
      const res = await fetch('/api/retropass/status');
      if (res.ok) {
        const data = await res.json();
        setHasRetroPass(data.isSubscribed);
      }
    } catch (err) {
      console.error('Failed to check RetroPass:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/online/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.totals);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const startMatchmaking = async () => {
    if (!selectedGame) return;
    setMatchmaking(true);
    setError(null);
    
    try {
      const res = await fetch('/api/online/matchmaking/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: selectedGame })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to join matchmaking');
        setMatchmaking(false);
        return;
      }
      
      if (data.matched) {
        // Found a match! Navigate to game room
        navigate(`/online/game/${data.roomCode}`);
        return;
      }
      
      // Start polling for match
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch('/api/online/matchmaking/status');
          const statusData = await statusRes.json();
          
          if (statusData.matched && statusData.roomCode) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            navigate(`/online/game/${statusData.roomCode}`);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);
      
    } catch (err) {
      setError('Connection error');
      setMatchmaking(false);
    }
  };

  const cancelMatchmaking = async () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    
    try {
      await fetch('/api/online/matchmaking/leave', { method: 'POST' });
    } catch (err) {
      console.error('Failed to leave matchmaking:', err);
    }
    
    setMatchmaking(false);
  };

  const createPrivateRoom = async () => {
    if (!selectedGame) return;
    setError(null);
    
    try {
      const res = await fetch('/api/online/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: selectedGame })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to create room');
        return;
      }
      
      setCreatedRoomCode(data.roomCode);
      
      // Start polling for opponent to join
      pollingRef.current = setInterval(async () => {
        try {
          const roomRes = await fetch(`/api/online/rooms/${data.roomCode}`);
          const roomData = await roomRes.json();
          
          if (roomData.status === 'playing' && roomData.player2) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            navigate(`/online/game/${data.roomCode}`);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);
      
    } catch (err) {
      setError('Connection error');
    }
  };

  const joinPrivateRoom = async () => {
    if (!roomCode.trim()) return;
    setError(null);
    
    try {
      const res = await fetch(`/api/online/rooms/${roomCode.toUpperCase()}/join`, {
        method: 'POST'
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to join room');
        return;
      }
      
      navigate(`/online/game/${roomCode.toUpperCase()}`);
      
    } catch (err) {
      setError('Connection error');
    }
  };

  const copyRoomCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user && !isDemo) {
    return (
      <div className="min-h-screen bg-[#0a0f14]">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'VT323, monospace' }}>
              Login Required
            </h1>
            <p className="text-gray-400 mb-6">Sign in to access Online Arena</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors"
            >
              Sign In
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!hasRetroPass) {
    return (
      <div className="min-h-screen bg-[#0a0f14]">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'VT323, monospace' }}>
              RetroPass Required
            </h1>
            <p className="text-gray-400 mb-6">
              Online Arena is an exclusive feature for RetroPass subscribers
            </p>
            <button
              onClick={() => navigate('/retropass')}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold rounded-lg hover:from-yellow-300 hover:to-amber-400 transition-all flex items-center gap-2 mx-auto"
            >
              <Crown className="w-5 h-5" />
              Get RetroPass
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedGameData = ONLINE_GAMES.find(g => g.id === selectedGame);

  return (
    <div className="min-h-screen bg-[#0a0f14]">
      <Header />
      
      {/* Demo mode banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/30 py-3 px-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">DEMO MODE - Online Arena (RetroPass exclusivo)</span>
          </div>
        </div>
      )}
      
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 via-transparent to-purple-900/10" />
        {/* Grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <main className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/arcade')}
            className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400" 
                style={{ fontFamily: 'VT323, monospace' }}>
              ONLINE ARENA
            </h1>
            <p className="text-gray-400 text-sm">Multiplayer battles for RetroPass members</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">{playersOnline} online</span>
            </div>
            {stats && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <span className="text-green-400">{stats.wins}W</span>
                <span className="text-red-400">{stats.losses}L</span>
                <span className="text-gray-400">{stats.draws}D</span>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto">
          {/* Game selection */}
          {mode === 'select' && !selectedGame && (
            <div className="space-y-6">
              <h2 className="text-xl text-white font-semibold text-center mb-6" style={{ fontFamily: 'VT323, monospace' }}>
                SELECT YOUR GAME
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ONLINE_GAMES.map(game => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    className="group relative p-6 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-cyan-500/50 transition-all hover:scale-105"
                    style={{ '--game-color': game.color } as React.CSSProperties}
                  >
                    <div className="text-4xl mb-3 flex justify-center">{renderGameIcon(game.icon, 'w-10 h-10')}</div>
                    <div className="text-white font-medium" style={{ fontFamily: 'VT323, monospace' }}>{game.name}</div>
                    <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${game.type === 'realtime' ? 'text-cyan-400' : 'text-purple-400'}`}>
                      {game.type === 'realtime' ? <><Zap className="w-3 h-3" /> Real-time</> : <><Target className="w-3 h-3" /> Turn-based</>}
                    </div>
                    <div 
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"
                      style={{ backgroundColor: game.color }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode selection */}
          {mode === 'select' && selectedGame && !matchmaking && !createdRoomCode && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setSelectedGame(null)}
                  className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedGameData?.icon}</span>
                  <h2 className="text-2xl text-white font-bold" style={{ fontFamily: 'VT323, monospace' }}>
                    {selectedGameData?.name}
                  </h2>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-center">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Quick Match */}
                <button
                  onClick={startMatchmaking}
                  className="group relative p-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 hover:border-cyan-400 transition-all"
                >
                  <div className="absolute inset-0 rounded-xl bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Zap className="w-12 h-12 text-cyan-400 mb-4 mx-auto" />
                  <h3 className="text-xl text-white font-bold mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                    QUICK MATCH
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Find a random opponent automatically
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400 text-sm">
                    <Users className="w-4 h-4" />
                    <span>~{Math.floor(playersOnline / 3)} searching</span>
                  </div>
                </button>

                {/* Private Room */}
                <div className="p-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30">
                  <Gamepad2 className="w-12 h-12 text-purple-400 mb-4 mx-auto" />
                  <h3 className="text-xl text-white font-bold mb-2 text-center" style={{ fontFamily: 'VT323, monospace' }}>
                    PRIVATE ROOM
                  </h3>
                  <p className="text-gray-400 text-sm text-center mb-4">
                    Play with a friend using a room code
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={createPrivateRoom}
                      className="w-full py-3 px-4 rounded-lg bg-purple-500/30 hover:bg-purple-500/40 text-purple-300 font-medium transition-colors"
                    >
                      Create Room
                    </button>
                    
                    <div className="relative">
                      <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        placeholder="Enter room code"
                        maxLength={6}
                        className="w-full py-3 px-4 rounded-lg bg-gray-800/50 border border-gray-600 text-white text-center uppercase tracking-widest placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        style={{ fontFamily: 'VT323, monospace', letterSpacing: '0.2em' }}
                      />
                    </div>
                    
                    <button
                      onClick={joinPrivateRoom}
                      disabled={roomCode.length < 6}
                      className="w-full py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Matchmaking screen */}
          {matchmaking && (
            <div className="text-center py-16">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 animate-ping" />
                <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <span className="text-4xl">{selectedGameData?.icon}</span>
                </div>
              </div>
              
              <h2 className="text-2xl text-white font-bold mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                SEARCHING FOR OPPONENT...
              </h2>
              <p className="text-gray-400 mb-8">
                Looking for a worthy challenger in {selectedGameData?.name}
              </p>
              
              <button
                onClick={cancelMatchmaking}
                className="px-6 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Room created - waiting for opponent */}
          {createdRoomCode && (
            <div className="text-center py-16">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <span className="text-4xl">{selectedGameData?.icon}</span>
                </div>
              </div>
              
              <h2 className="text-2xl text-white font-bold mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                ROOM CREATED
              </h2>
              <p className="text-gray-400 mb-6">
                Share this code with your friend
              </p>
              
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-gray-800/50 border border-purple-500/30 mb-8">
                <span 
                  className="text-3xl text-purple-400 font-bold tracking-widest"
                  style={{ fontFamily: 'VT323, monospace', letterSpacing: '0.3em' }}
                >
                  {createdRoomCode}
                </span>
                <button
                  onClick={copyRoomCode}
                  className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              
              <p className="text-gray-500 mb-8 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Waiting for opponent to join...
              </p>
              
              <button
                onClick={() => {
                  if (pollingRef.current) clearInterval(pollingRef.current);
                  setCreatedRoomCode(null);
                }}
                className="px-6 py-3 rounded-lg bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      <style>{`
        @keyframes cyberPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
