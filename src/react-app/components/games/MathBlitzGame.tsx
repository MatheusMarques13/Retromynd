import { useState, useEffect, useCallback, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface MathBlitzGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function MathBlitzGame({ onGameEnd, onScoreUpdate }: MathBlitzGameProps) {
  const [problem, setProblem] = useState({ question: "", answer: 0 });
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { playSuccess, playError, playGameOver, playPowerUp } = useGameSounds();

  const generateProblem = useCallback(() => {
    const ops = ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * Math.min(ops.length, difficulty + 1))];
    let a: number, b: number, answer: number;

    const max = 10 + difficulty * 5;
    
    if (op === "+") {
      a = Math.floor(Math.random() * max) + 1;
      b = Math.floor(Math.random() * max) + 1;
      answer = a + b;
    } else if (op === "-") {
      a = Math.floor(Math.random() * max) + 1;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
    } else {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
    }

    setProblem({ question: `${a} ${op} ${b}`, answer });
    setUserAnswer("");
    setFeedback(null);
  }, [difficulty]);

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
    setDifficulty(1);
    setTimeLeft(60);
    setGameStarted(true);
    setGameOver(false);
    generateProblem();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const checkAnswer = () => {
    const num = parseInt(userAnswer);
    if (isNaN(num)) return;

    if (num === problem.answer) {
      playSuccess();
      const points = 10 + streak * 2 + difficulty * 5;
      setScore(s => { const ns = s + points; onScoreUpdate(ns); return ns; });
      setStreak(s => s + 1);
      setFeedback("correct");
      if (streak > 0 && streak % 5 === 0) {
        playPowerUp();
        setDifficulty(d => Math.min(5, d + 1));
      }
    } else {
      playError();
      setStreak(0);
      setFeedback("wrong");
    }

    setTimeout(generateProblem, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") checkAnswer();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-6 text-lg">
        <span className="text-cyan-400">Score: {score}</span>
        <span className="text-orange-400">Streak: {streak}🔥</span>
        <span className="text-purple-400">Level: {difficulty}</span>
        <span className="text-yellow-400">Time: {timeLeft}s</span>
      </div>

      {!gameStarted && !gameOver && (
        <button onClick={startGame} className="px-8 py-4 bg-purple-600 rounded-lg text-white font-bold text-xl hover:bg-purple-500">
          Start Math Blitz
        </button>
      )}

      {gameStarted && !gameOver && (
        <>
          <div
            className={`w-72 h-32 rounded-xl flex items-center justify-center text-5xl font-bold bg-gray-800 transition-all ${
              feedback === "correct" ? "ring-4 ring-green-400" :
              feedback === "wrong" ? "ring-4 ring-red-400" : ""
            }`}
          >
            <span className="text-white">{problem.question} = ?</span>
          </div>

          <input
            ref={inputRef}
            type="number"
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-32 px-4 py-3 bg-gray-800 border-2 border-purple-500 rounded-lg text-white text-center text-2xl focus:outline-none focus:border-cyan-400"
            autoComplete="off"
          />

          <button
            onClick={checkAnswer}
            className="px-8 py-3 bg-green-600 rounded-lg text-white font-bold hover:bg-green-500"
          >
            Submit
          </button>
        </>
      )}

      {gameOver && (
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">Time's Up!</div>
          <div className="text-xl text-white mb-4">Final Score: {score}</div>
          <div className="text-gray-300 mb-4">Max Level Reached: {difficulty}</div>
          <button onClick={startGame} className="px-6 py-2 bg-purple-600 rounded-lg text-white font-bold hover:bg-purple-500">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
