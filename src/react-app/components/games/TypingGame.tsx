import { useState, useEffect, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface TypingGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const WORDS = [
  "react", "gaming", "arcade", "pixel", "retro", "neon", "cyber", "digital",
  "quantum", "matrix", "vector", "binary", "cosmic", "galactic", "stellar",
  "turbo", "mega", "ultra", "hyper", "super", "power", "force", "speed",
  "blast", "flash", "crash", "smash", "dash", "rush", "zoom", "boom"
];

export default function TypingGame({ onGameEnd, onScoreUpdate }: TypingGameProps) {
  const [currentWord, setCurrentWord] = useState("");
  const [typedWord, setTypedWord] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [wordsTyped, setWordsTyped] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { playTick, playSuccess, playGameOver } = useGameSounds();

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

  const getNewWord = () => {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  };

  const startGame = () => {
    setCurrentWord(getNewWord());
    setTypedWord("");
    setScore(0);
    setWordsTyped(0);
    setTimeLeft(60);
    setGameStarted(true);
    setGameOver(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameOver) return;
    const value = e.target.value.toLowerCase();
    setTypedWord(value);
    playTick();

    if (value === currentWord) {
      playSuccess();
      const wordScore = currentWord.length * 10;
      setScore(s => { const ns = s + wordScore; onScoreUpdate(ns); return ns; });
      setWordsTyped(w => w + 1);
      setCurrentWord(getNewWord());
      setTypedWord("");
    }
  };

  const wpm = timeLeft < 60 ? Math.round(wordsTyped / ((60 - timeLeft) / 60)) : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-8 text-lg">
        <span className="text-cyan-400">Score: {score}</span>
        <span className="text-green-400">Words: {wordsTyped}</span>
        <span className="text-purple-400">WPM: {wpm}</span>
        <span className="text-yellow-400">Time: {timeLeft}s</span>
      </div>

      {!gameStarted && !gameOver && (
        <button onClick={startGame} className="px-8 py-4 bg-purple-600 rounded-lg text-white font-bold text-xl hover:bg-purple-500">
          Start Typing Test
        </button>
      )}

      {gameStarted && !gameOver && (
        <>
          <div className="text-5xl font-mono tracking-wider">
            {currentWord.split("").map((char, i) => (
              <span
                key={i}
                className={
                  i < typedWord.length
                    ? typedWord[i] === char
                      ? "text-green-400"
                      : "text-red-400"
                    : "text-gray-400"
                }
              >
                {char}
              </span>
            ))}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={typedWord}
            onChange={handleInput}
            className="w-64 px-4 py-3 bg-gray-800 border-2 border-purple-500 rounded-lg text-white text-center text-xl focus:outline-none focus:border-cyan-400"
            autoComplete="off"
            autoCapitalize="off"
          />
        </>
      )}

      {gameOver && (
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">Time's Up!</div>
          <div className="text-xl text-white mb-1">Final Score: {score}</div>
          <div className="text-gray-300 mb-4">Words: {wordsTyped} | WPM: {Math.round(wordsTyped)}</div>
          <div className="text-lg mb-4">
            {wordsTyped >= 60 ? "🔥 Speed Demon!" :
             wordsTyped >= 45 ? "⚡ Fast Fingers!" :
             wordsTyped >= 30 ? "👍 Good Speed!" :
             wordsTyped >= 15 ? "😊 Keep Practicing!" : "💪 You Got This!"}
          </div>
          <button onClick={startGame} className="px-6 py-2 bg-purple-600 rounded-lg text-white font-bold hover:bg-purple-500">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
