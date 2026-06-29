import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Header } from '@/react-app/components/Header';
import { Footer } from '@/react-app/components/Footer';
import { useAuth } from '@/react-app/auth';
import { useLanguage } from '@/react-app/contexts/LanguageContext';
import { 
  ArrowLeft, Copy, Check, Loader2, Users, Trophy, Crown,
  Swords, Clock, RefreshCw, Home, XCircle,
  Gamepad2, CircleDot, Circle, Ship, Target, Flag, Brain, Medal,
  Bot, Ghost, Wand2, Skull, Cat, Dog, Bird, Fish, Rocket, Star, Flame, Sparkles,
  type LucideIcon
} from 'lucide-react';

// Icon mapping for dynamic rendering
const ICON_MAP: Record<string, LucideIcon> = {
  Gamepad2, CircleDot, Circle, Ship, Target, Flag, Brain, Medal,
  Bot, Ghost, Wand2, Skull, Cat, Dog, Bird, Fish, Rocket, Star, Flame, Sparkles,
};

// Game type configuration
const GAME_CONFIGS: Record<string, { name: string; icon: string; turnBased: boolean }> = {
  'pong': { name: 'Neon Pong', icon: 'Gamepad2', turnBased: false },
  'tictactoe': { name: 'Tic Tac Toe', icon: 'CircleDot', turnBased: true },
  'connect4': { name: 'Connect 4', icon: 'Circle', turnBased: true },
  'reversi': { name: 'Reversi', icon: 'Circle', turnBased: true },
  'battleship': { name: 'Battleship', icon: 'Ship', turnBased: true },
  'tanks': { name: 'Tank Battle', icon: 'Medal', turnBased: false },
  'checkers': { name: 'Checkers', icon: 'Flag', turnBased: true },
  'memory-duel': { name: 'Memory Duel', icon: 'Brain', turnBased: true },
};

// Helper to render icon
const renderIcon = (iconName: string, className?: string) => {
  const IconComponent = ICON_MAP[iconName] || Gamepad2;
  return <IconComponent className={className} />;
};

interface Player {
  id: string;
  username?: string;
  display_name?: string;
  avatar_preset?: string;
}

interface GameState {
  turn: number;
  board?: unknown[][];
  lastMove?: unknown;
  moves?: number;
  [key: string]: unknown;
}

interface RoomData {
  roomCode: string;
  gameType: string;
  status: 'waiting' | 'playing' | 'finished';
  player1: Player;
  player2: Player | null;
  gameState: GameState;
  winnerId: string | null;
  isPlayer1: boolean;
  isPlayer2: boolean;
  isYourTurn: boolean;
}

export default function OnlineGame() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  useLanguage(); // For future translations
  
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submittingMove, setSubmittingMove] = useState(false);
  
  // Fetch room state
  const fetchRoom = useCallback(async () => {
    if (!roomCode) return;
    
    try {
      const res = await fetch(`/api/online/rooms/${roomCode}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch room');
      }
      const data = await res.json();
      setRoom(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error');
    } finally {
      setLoading(false);
    }
  }, [roomCode]);
  
  // Initial fetch
  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);
  
  // Polling for updates
  useEffect(() => {
    if (!room || room.status === 'finished') return;
    
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [room, fetchRoom]);
  
  // Submit move
  const submitMove = async (move: unknown) => {
    if (!roomCode || submittingMove) return;
    
    setSubmittingMove(true);
    try {
      const res = await fetch(`/api/online/rooms/${roomCode}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit move');
      }
      
      // Refresh room state
      await fetchRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed');
    } finally {
      setSubmittingMove(false);
    }
  };
  

  
  // Copy room code
  const copyCode = async () => {
    if (!roomCode) return;
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Get player display name
  const getPlayerName = (player: Player | null, fallback: string) => {
    if (!player) return fallback;
    return player.display_name || player.username || `Player ${fallback}`;
  };
  
  // Get avatar icon component
  const getAvatarIcon = (player: Player | null, fallbackIcon: string = 'Gamepad2') => {
    if (!player?.avatar_preset) return renderIcon(fallbackIcon, 'w-8 h-8');
    const presets: Record<string, string> = {
      'robot': 'Bot', 'alien': 'Skull', 'ghost': 'Ghost', 'wizard': 'Wand2',
      'ninja': 'Swords', 'astronaut': 'Rocket', 'pirate': 'Skull', 'dragon': 'Flame',
      'unicorn': 'Sparkles', 'phoenix': 'Flame', 'skull': 'Skull', 'cat': 'Cat',
      'dog': 'Dog', 'fox': 'Dog', 'owl': 'Bird', 'panda': 'Ghost',
      'gameboy': 'Gamepad2', 'rocket': 'Rocket', 'star': 'Star', 'controller': 'Gamepad2',
      'fire': 'Flame', 'diamond': 'Sparkles', 'crown': 'Crown'
    };
    return renderIcon(presets[player.avatar_preset] || fallbackIcon, 'w-8 h-8');
  };
  
  const gameConfig = room ? GAME_CONFIGS[room.gameType] : null;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-cyan-400 font-mono">CONNECTING TO SERVER...</p>
        </div>
      </div>
    );
  }
  
  if (error || !room) {
    return (
      <div className="min-h-screen bg-[#0a0f14] flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-8 text-center max-w-md">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-400 mb-2">Connection Error</h2>
            <p className="text-red-300 mb-6">{error || 'Room not found'}</p>
            <button
              onClick={() => navigate('/online')}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-6 rounded-lg transition-all"
            >
              Back to Lobby
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0a0f14] flex flex-col">
      <Header />
      
      <main className="flex-grow p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/online')}
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-mono">EXIT</span>
            </button>
            
            <div className="flex items-center gap-4">
              {/* Room Code */}
              <button
                onClick={copyCode}
                className="flex items-center gap-2 bg-[#1a1f28] border border-cyan-500/30 rounded px-3 py-2 hover:border-cyan-400 transition-colors"
              >
                <span className="text-gray-400 font-mono text-sm">ROOM:</span>
                <span className="text-cyan-400 font-bold font-mono">{roomCode}</span>
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          {/* Game Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
              {gameConfig?.icon} {gameConfig?.name || room.gameType}
            </h1>
          </div>
          
          {/* Players Bar */}
          <div className="flex items-center justify-center gap-8 mb-6">
            {/* Player 1 */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
              room.status === 'playing' && room.gameState.turn === 1
                ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20'
                : 'border-gray-700 bg-[#1a1f28]'
            }`}>
              <div className="text-cyan-400">{getAvatarIcon(room.player1)}</div>
              <div>
                <p className="text-white font-bold">{getPlayerName(room.player1, '1')}</p>
                <p className="text-xs text-cyan-400">
                  {room.isPlayer1 ? '(YOU)' : 'Player 1'}
                </p>
              </div>
              {room.winnerId === room.player1.id && (
                <Crown className="w-6 h-6 text-yellow-400" />
              )}
            </div>
            
            {/* VS */}
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-pink-500 to-purple-600">
              <Swords className="w-10 h-10 text-pink-500" />
            </div>
            
            {/* Player 2 */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
              room.status === 'playing' && room.gameState.turn === 2
                ? 'border-pink-400 bg-pink-400/10 shadow-lg shadow-pink-400/20'
                : 'border-gray-700 bg-[#1a1f28]'
            }`}>
              {room.player2 ? (
                <>
                  <div className="text-pink-400">{getAvatarIcon(room.player2)}</div>
                  <div>
                    <p className="text-white font-bold">{getPlayerName(room.player2, '2')}</p>
                    <p className="text-xs text-pink-400">
                      {room.isPlayer2 ? '(YOU)' : 'Player 2'}
                    </p>
                  </div>
                  {room.winnerId === room.player2.id && (
                    <Crown className="w-6 h-6 text-yellow-400" />
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <Users className="w-6 h-6 animate-pulse" />
                  <span>Waiting...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Game Content */}
          <div className="bg-[#1a1f28] border-2 border-cyan-500/30 rounded-xl p-6 min-h-[400px]">
            {/* Waiting for Player */}
            {room.status === 'waiting' && (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                  <Users className="w-10 h-10 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xl text-cyan-400 font-bold mt-6 mb-2">
                  WAITING FOR OPPONENT
                </p>
                <p className="text-gray-400 mb-6">
                  Share the room code with a friend to start playing
                </p>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-2 bg-cyan-500/20 border-2 border-cyan-400 text-cyan-400 px-6 py-3 rounded-lg hover:bg-cyan-500/30 transition-all"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span className="font-bold">{roomCode}</span>
                </button>
              </div>
            )}
            
            {/* Game Playing */}
            {room.status === 'playing' && (
              <div className="text-center">
                {/* Turn Indicator */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
                  room.isYourTurn
                    ? 'bg-green-500/20 border border-green-400 text-green-400'
                    : 'bg-yellow-500/20 border border-yellow-400 text-yellow-400'
                }`}>
                  {room.isYourTurn ? (
                    <>
                      <Swords className="w-5 h-5" />
                      <span className="font-bold">YOUR TURN</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 animate-pulse" />
                      <span className="font-bold">OPPONENT'S TURN</span>
                    </>
                  )}
                </div>
                
                {/* Game Board Placeholder */}
                <div className="bg-[#0a0f14] rounded-lg p-8 mb-6">
                  <GameBoard
                    gameType={room.gameType}
                    gameState={room.gameState}
                    isYourTurn={room.isYourTurn}
                    playerNumber={room.isPlayer1 ? 1 : 2}
                    onMove={submitMove}
                    disabled={submittingMove}
                  />
                </div>
                
                {/* Move Counter */}
                <p className="text-gray-500 font-mono text-sm">
                  Move #{room.gameState.moves || 0}
                </p>
              </div>
            )}
            
            {/* Game Finished */}
            {room.status === 'finished' && (
              <div className="flex flex-col items-center justify-center h-96">
                {room.winnerId ? (
                  <>
                    <Trophy className={`w-24 h-24 mb-4 ${
                      room.winnerId === user?.id ? 'text-yellow-400' : 'text-gray-500'
                    }`} />
                    <h2 className={`text-3xl font-bold mb-2 ${
                      room.winnerId === user?.id ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {room.winnerId === user?.id ? 'VICTORY!' : 'DEFEAT'}
                    </h2>
                    <p className="text-gray-400 mb-8">
                      {room.winnerId === user?.id
                        ? 'Congratulations! You won the game!'
                        : 'Better luck next time!'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">🤝</div>
                    <h2 className="text-3xl font-bold text-purple-400 mb-2">DRAW!</h2>
                    <p className="text-gray-400 mb-8">The game ended in a tie</p>
                  </>
                )}
                
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/online')}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-all"
                  >
                    <Home className="w-5 h-5" />
                    <span>Back to Lobby</span>
                  </button>
                  <button
                    onClick={() => navigate(`/online?game=${room.gameType}`)}
                    className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded-lg transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Play Again</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Cyber scan line effect */}
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
}

// Game Board Component - renders appropriate game based on type
interface GameBoardProps {
  gameType: string;
  gameState: GameState;
  isYourTurn: boolean;
  playerNumber: 1 | 2;
  onMove: (move: unknown) => void;
  onGameEnd: (winnerId?: string, isDraw?: boolean) => void;
  disabled: boolean;
}

function GameBoard({ gameType, gameState, isYourTurn, playerNumber, onMove, disabled }: Omit<GameBoardProps, 'onGameEnd'>) {
  // Tic Tac Toe
  if (gameType === 'tictactoe') {
    return (
      <TicTacToeBoard
        gameState={gameState}
        isYourTurn={isYourTurn}
        playerNumber={playerNumber}
        onMove={onMove}
        disabled={disabled}
      />
    );
  }
  
  // Connect 4
  if (gameType === 'connect4') {
    return (
      <Connect4Board
        gameState={gameState}
        isYourTurn={isYourTurn}
        playerNumber={playerNumber}
        onMove={onMove}
        disabled={disabled}
      />
    );
  }
  
  // Default placeholder
  return (
    <div className="text-center py-12">
      <div className="text-cyan-400 mb-4">{renderIcon(GAME_CONFIGS[gameType]?.icon || 'Gamepad2', 'w-16 h-16')}</div>
      <p className="text-cyan-400 font-bold text-xl mb-2">
        {GAME_CONFIGS[gameType]?.name || gameType}
      </p>
      <p className="text-gray-500">
        Game component coming soon!
      </p>
      <div className="mt-6 p-4 bg-[#1a1f28] rounded-lg inline-block">
        <p className="text-gray-400 font-mono text-sm">
          Game State: {JSON.stringify(gameState, null, 2)}
        </p>
      </div>
    </div>
  );
}

// Tic Tac Toe Online Board
interface BoardProps {
  gameState: GameState;
  isYourTurn: boolean;
  playerNumber: 1 | 2;
  onMove: (move: unknown) => void;
  onGameEnd: (winnerId?: string, isDraw?: boolean) => void;
  disabled: boolean;
}

function TicTacToeBoard({ gameState, isYourTurn, playerNumber, onMove, disabled }: Omit<BoardProps, 'onGameEnd'>) {
  // Initialize board from game state or create empty
  const board = (gameState.board as (number | null)[][]) || [
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ];
  
  const checkWinner = (b: (number | null)[][]): number | null => {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (b[i][0] && b[i][0] === b[i][1] && b[i][1] === b[i][2]) return b[i][0];
    }
    // Check columns
    for (let i = 0; i < 3; i++) {
      if (b[0][i] && b[0][i] === b[1][i] && b[1][i] === b[2][i]) return b[0][i];
    }
    // Check diagonals
    if (b[0][0] && b[0][0] === b[1][1] && b[1][1] === b[2][2]) return b[0][0];
    if (b[0][2] && b[0][2] === b[1][1] && b[1][1] === b[2][0]) return b[0][2];
    return null;
  };
  
  const isBoardFull = (b: (number | null)[][]): boolean => {
    return b.every(row => row.every(cell => cell !== null));
  };
  
  const handleClick = (row: number, col: number) => {
    if (!isYourTurn || disabled || board[row][col] !== null) return;
    
    // Create new board with move
    const newBoard = board.map((r, ri) => 
      r.map((c, ci) => (ri === row && ci === col) ? playerNumber : c)
    );
    
    // Check for winner
    const winner = checkWinner(newBoard);
    if (winner) {
      onMove({ row, col, board: newBoard, winner: playerNumber });
      // Let server handle game end
    } else if (isBoardFull(newBoard)) {
      onMove({ row, col, board: newBoard, draw: true });
    } else {
      onMove({ row, col, board: newBoard });
    }
  };
  
  return (
    <div className="inline-grid grid-cols-3 gap-2">
      {board.map((row, ri) =>
        row.map((cell, ci) => (
          <button
            key={`${ri}-${ci}`}
            onClick={() => handleClick(ri, ci)}
            disabled={!isYourTurn || disabled || cell !== null}
            className={`w-24 h-24 text-5xl font-bold rounded-lg transition-all ${
              cell === null
                ? isYourTurn && !disabled
                  ? 'bg-gray-800 hover:bg-gray-700 cursor-pointer'
                  : 'bg-gray-800 cursor-not-allowed'
                : cell === 1
                  ? 'bg-cyan-500/30 border-2 border-cyan-400'
                  : 'bg-pink-500/30 border-2 border-pink-400'
            }`}
          >
            {cell === 1 ? (
              <span className="text-cyan-400">X</span>
            ) : cell === 2 ? (
              <span className="text-pink-400">O</span>
            ) : null}
          </button>
        ))
      )}
    </div>
  );
}

// Connect 4 Online Board
function Connect4Board({ gameState, isYourTurn, playerNumber, onMove, disabled }: Omit<BoardProps, 'onGameEnd'>) {
  const ROWS = 6;
  const COLS = 7;
  
  // Initialize board (6 rows x 7 columns)
  const board = (gameState.board as (number | null)[][]) || 
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  
  const dropPiece = (col: number) => {
    if (!isYourTurn || disabled) return;
    
    // Find lowest empty row in column
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === null) {
        row = r;
        break;
      }
    }
    
    if (row === -1) return; // Column full
    
    // Create new board with move
    const newBoard = board.map((r, ri) => 
      r.map((c, ci) => (ri === row && ci === col) ? playerNumber : c)
    );
    
    onMove({ col, row, board: newBoard });
  };
  
  return (
    <div className="inline-block">
      {/* Column hover indicators */}
      <div className="flex gap-1 mb-2">
        {Array(COLS).fill(null).map((_, col) => (
          <div
            key={col}
            className={`w-12 h-6 rounded-t flex items-center justify-center transition-all ${
              hoverCol === col && isYourTurn
                ? playerNumber === 1 ? 'bg-cyan-500/50' : 'bg-pink-500/50'
                : 'bg-transparent'
            }`}
          >
            {hoverCol === col && isYourTurn && (
              <div className={`w-4 h-4 rounded-full ${
                playerNumber === 1 ? 'bg-cyan-400' : 'bg-pink-400'
              }`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Board */}
      <div className="bg-blue-900 p-2 rounded-lg">
        {board.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((cell, ci) => (
              <button
                key={`${ri}-${ci}`}
                onClick={() => dropPiece(ci)}
                onMouseEnter={() => setHoverCol(ci)}
                onMouseLeave={() => setHoverCol(null)}
                disabled={!isYourTurn || disabled || board[0][ci] !== null}
                className={`w-12 h-12 rounded-full transition-all ${
                  cell === null
                    ? 'bg-[#0a0f14]'
                    : cell === 1
                      ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
                      : 'bg-pink-400 shadow-lg shadow-pink-400/50'
                } ${isYourTurn && !disabled && cell === null ? 'cursor-pointer hover:opacity-80' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
