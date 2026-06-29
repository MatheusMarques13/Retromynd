import { useState, useEffect } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";
import { 
  Gamepad2, Joystick, Ghost, Bot, Target, Dice5, Spade, Trophy,
  type LucideIcon 
} from "lucide-react";

interface MemoryGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Card {
  id: number;
  iconName: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Icon configuration for memory cards
const CARD_ICONS: { name: string; component: LucideIcon; color: string }[] = [
  { name: 'gamepad', component: Gamepad2, color: '#00CED1' },
  { name: 'joystick', component: Joystick, color: '#FF6B6B' },
  { name: 'ghost', component: Ghost, color: '#9B59B6' },
  { name: 'robot', component: Bot, color: '#3498DB' },
  { name: 'target', component: Target, color: '#E74C3C' },
  { name: 'dice', component: Dice5, color: '#2ECC71' },
  { name: 'spade', component: Spade, color: '#1ABC9C' },
  { name: 'trophy', component: Trophy, color: '#F1C40F' },
];

const getIconByName = (name: string) => {
  return CARD_ICONS.find(icon => icon.name === name) || CARD_ICONS[0];
};

export default function MemoryGame({ onGameEnd, onScoreUpdate }: MemoryGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const sounds = useGameSounds();

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    let interval: number | null = null;
    if (startTime && !gameOver) {
      interval = window.setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, gameOver]);

  function initializeGame() {
    const iconNames = CARD_ICONS.map(icon => icon.name);
    const shuffledCards = [...iconNames, ...iconNames]
      .sort(() => Math.random() - 0.5)
      .map((iconName, index) => ({
        id: index,
        iconName,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledCards);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameOver(false);
    setStartTime(null);
    setTimeElapsed(0);
  }

  function handleCardClick(cardId: number) {
    if (isChecking) return;
    if (flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    if (!startTime) {
      setStartTime(Date.now());
    }

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    sounds.playFlip();
    
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    if (newFlipped.length === 2) {
      setIsChecking(true);
      const newMoves = moves + 1;
      setMoves(newMoves);
      
      const [first, second] = newFlipped;
      const firstCard = cards.find(c => c.id === first)!;
      const secondCard = cards.find(c => c.id === second)!;

      if (firstCard.iconName === secondCard.iconName) {
        // Match found
        setTimeout(() => {
          const newMatches = matches + 1;
          setMatches(newMatches);
          sounds.playSuccess();
          
          setCards(prev => prev.map(c => 
            c.id === first || c.id === second ? { ...c, isMatched: true } : c
          ));
          setFlippedCards([]);
          setIsChecking(false);

          // Calculate score based on moves and time
          const baseScore = 100;
          const movesPenalty = Math.max(0, newMoves - 8) * 5;
          const score = Math.max(10, baseScore - movesPenalty) * newMatches;
          onScoreUpdate(score);

          // Check win
          if (newMatches === CARD_ICONS.length) {
            const finalScore = Math.max(100, 1000 - (newMoves * 10) - (timeElapsed * 2));
            setGameOver(true);
            sounds.playWin();
            onGameEnd(finalScore);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          sounds.playError();
          setCards(prev => prev.map(c => 
            c.id === first || c.id === second ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900/20 to-violet-900/20 p-4">
      {/* Stats */}
      <div className="flex gap-6 mb-4">
        <div className="text-center">
          <div className="text-purple-400 text-xs font-mono">MOVES</div>
          <div className="text-xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
            {moves}
          </div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 text-xs font-mono">MATCHES</div>
          <div className="text-xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
            {matches}/{CARD_ICONS.length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 text-xs font-mono">TIME</div>
          <div className="text-xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
            {timeElapsed}s
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="relative">
        <div className="grid grid-cols-4 gap-2 p-3 bg-gray-900/80 rounded-xl border-2 border-purple-500/30">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isFlipped || card.isMatched || isChecking}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg font-bold text-2xl transition-all duration-300 transform flex items-center justify-center ${
                card.isFlipped || card.isMatched
                  ? "bg-purple-600 rotate-0 scale-100"
                  : "bg-gray-700 hover:bg-gray-600 rotate-0 scale-100 hover:scale-105"
              } ${card.isMatched ? "opacity-70" : ""}`}
              style={{
                boxShadow: card.isFlipped || card.isMatched 
                  ? "0 0 15px rgba(168, 85, 247, 0.5)" 
                  : "none",
              }}
            >
              {(card.isFlipped || card.isMatched) ? (
                (() => {
                  const iconData = getIconByName(card.iconName);
                  const IconComponent = iconData.component;
                  return <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: iconData.color }} />;
                })()
              ) : (
                <span className="text-gray-400">?</span>
              )}
            </button>
          ))}
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl">
            <div className="text-2xl font-bold text-purple-400 mb-2 flex items-center gap-2" style={{ fontFamily: "'VT323', monospace" }}>
              <Trophy className="w-6 h-6 text-yellow-400" /> YOU WIN!
            </div>
            <div className="text-sm text-gray-400 mb-1">
              Completed in {moves} moves and {timeElapsed}s
            </div>
            <div className="text-lg text-purple-400 mb-4">
              Score: {Math.max(100, 1000 - (moves * 10) - (timeElapsed * 2))}
            </div>
            <button
              onClick={initializeGame}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div className="mt-4 text-gray-500 text-xs text-center">
        Click cards to flip and find matching pairs
      </div>
    </div>
  );
}
