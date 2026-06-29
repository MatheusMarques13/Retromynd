import { useState, useEffect, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface AimTrainerGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function AimTrainerGame({ onGameEnd, onScoreUpdate }: AimTrainerGameProps) {
  const [target, setTarget] = useState({ x: 200, y: 200, size: 50 });
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const { playHit, playError, playGameOver } = useGameSounds();

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      playGameOver();
      onGameEnd(score);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameStarted, gameOver, score, onGameEnd]);

  const spawnTarget = () => {
    const size = Math.max(20, 60 - Math.floor(hits / 5) * 5);
    setTarget({
      x: 30 + Math.random() * 340,
      y: 30 + Math.random() * 340,
      size
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!gameStarted) {
      setGameStarted(true);
      spawnTarget();
      return;
    }
    if (gameOver) return;

    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dist = Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2);

    if (dist < target.size / 2) {
      playHit();
      const points = Math.round(100 / target.size * 20);
      setScore(s => { const ns = s + points; onScoreUpdate(ns); return ns; });
      setHits(h => h + 1);
      spawnTarget();
    } else {
      playError();
      setMisses(m => m + 1);
    }
  };

  const resetGame = () => {
    setScore(0);
    setHits(0);
    setMisses(0);
    setTimeLeft(30);
    setGameStarted(false);
    setGameOver(false);
  };

  const accuracy = hits + misses > 0 ? Math.round(hits / (hits + misses) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-8 text-lg">
        <span className="text-cyan-400">Score: {score}</span>
        <span className="text-green-400">Hits: {hits}</span>
        <span className="text-red-400">Accuracy: {accuracy}%</span>
        <span className="text-yellow-400">Time: {timeLeft}s</span>
      </div>

      <div
        ref={areaRef}
        onClick={handleClick}
        className="w-[400px] h-[400px] bg-gray-900 rounded-xl relative cursor-crosshair overflow-hidden"
        style={{ boxShadow: "inset 0 0 50px rgba(0,0,0,0.5)" }}
      >
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center text-xl text-gray-400">
            Click to Start
          </div>
        )}

        {gameStarted && !gameOver && (
          <div
            className="absolute rounded-full bg-gradient-to-br from-red-500 to-orange-500 transition-all duration-75"
            style={{
              left: target.x - target.size / 2,
              top: target.y - target.size / 2,
              width: target.size,
              height: target.size,
              boxShadow: `0 0 ${target.size}px rgba(255,100,0,0.5)`
            }}
          >
            <div className="absolute inset-[30%] rounded-full bg-white/30" />
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <div className="text-3xl font-bold text-yellow-400 mb-2">Time's Up!</div>
            <div className="text-xl text-white">Score: {score}</div>
            <div className="text-gray-300">Hits: {hits} | Accuracy: {accuracy}%</div>
          </div>
        )}
      </div>

      {gameOver && (
        <button onClick={resetGame} className="px-6 py-2 bg-orange-600 rounded-lg text-white font-bold hover:bg-orange-500">
          Play Again
        </button>
      )}
    </div>
  );
}
