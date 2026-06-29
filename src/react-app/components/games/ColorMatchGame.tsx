import { useState, useEffect, useCallback } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface ColorMatchGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const COLORS = [
  { name: "RED", color: "#ef4444" },
  { name: "BLUE", color: "#3b82f6" },
  { name: "GREEN", color: "#22c55e" },
  { name: "YELLOW", color: "#eab308" },
  { name: "PURPLE", color: "#a855f7" },
  { name: "ORANGE", color: "#f97316" }
];

export default function ColorMatchGame({ onGameEnd, onScoreUpdate }: ColorMatchGameProps) {
  const [displayWord, setDisplayWord] = useState({ name: "", color: "" });
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<"correct" | "wrong" | null>(null);
  const { playSuccess, playError, playGameOver } = useGameSounds();

  const generateRound = useCallback(() => {
    const wordIndex = Math.floor(Math.random() * COLORS.length);
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    setDisplayWord({ name: COLORS[wordIndex].name, color: COLORS[colorIndex].color });
    setLastAnswer(null);
  }, []);

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

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setGameStarted(true);
    setGameOver(false);
    generateRound();
  };

  const handleAnswer = (isMatch: boolean) => {
    if (gameOver) return;
    
    const actualColorName = COLORS.find(c => c.color === displayWord.color)?.name;
    const isCorrect = (displayWord.name === actualColorName) === isMatch;

    if (isCorrect) {
      playSuccess();
      const points = 10 + streak * 5;
      setScore(s => { const ns = s + points; onScoreUpdate(ns); return ns; });
      setStreak(s => s + 1);
      setLastAnswer("correct");
    } else {
      playError();
      setStreak(0);
      setLastAnswer("wrong");
    }

    setTimeout(generateRound, 300);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-8 text-lg">
        <span className="text-cyan-400">Score: {score}</span>
        <span className="text-orange-400">Streak: {streak}🔥</span>
        <span className="text-yellow-400">Time: {timeLeft}s</span>
      </div>

      {!gameStarted && !gameOver && (
        <div className="text-center">
          <p className="text-gray-300 mb-4 max-w-xs">
            Does the COLOR of the word match what the word says?
          </p>
          <button onClick={startGame} className="px-8 py-4 bg-purple-600 rounded-lg text-white font-bold text-xl hover:bg-purple-500">
            Start Game
          </button>
        </div>
      )}

      {gameStarted && !gameOver && (
        <>
          <div
            className={`w-72 h-32 rounded-xl flex items-center justify-center text-5xl font-bold transition-all ${
              lastAnswer === "correct" ? "ring-4 ring-green-400" :
              lastAnswer === "wrong" ? "ring-4 ring-red-400" : ""
            }`}
            style={{ backgroundColor: "#1a1a2e" }}
          >
            <span style={{ color: displayWord.color }}>{displayWord.name}</span>
          </div>

          <p className="text-gray-400 text-center">Does the COLOR match the WORD?</p>

          <div className="flex gap-4">
            <button
              onClick={() => handleAnswer(true)}
              className="px-12 py-4 bg-green-600 rounded-lg text-white font-bold text-xl hover:bg-green-500"
            >
              YES ✓
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="px-12 py-4 bg-red-600 rounded-lg text-white font-bold text-xl hover:bg-red-500"
            >
              NO ✗
            </button>
          </div>
        </>
      )}

      {gameOver && (
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">Game Over!</div>
          <div className="text-xl text-white mb-4">Final Score: {score}</div>
          <button onClick={startGame} className="px-6 py-2 bg-purple-600 rounded-lg text-white font-bold hover:bg-purple-500">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
