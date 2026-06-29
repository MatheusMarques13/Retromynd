import { useState, useCallback } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface SimonGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function SimonGame({ onGameEnd, onScoreUpdate }: SimonGameProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [canClick, setCanClick] = useState(false);
  const sounds = useGameSounds();

  const colors = [
    { bg: "bg-green-500", active: "bg-green-300", glow: "#22c55e" },
    { bg: "bg-red-500", active: "bg-red-300", glow: "#ef4444" },
    { bg: "bg-yellow-500", active: "bg-yellow-300", glow: "#eab308" },
    { bg: "bg-blue-500", active: "bg-blue-300", glow: "#3b82f6" }
  ];

  const playSequence = useCallback(async (seq: number[]) => {
    setCanClick(false);
    for (let i = 0; i < seq.length; i++) {
      await new Promise(r => setTimeout(r, 300));
      setActiveButton(seq[i]);
      sounds.playBeep();
      await new Promise(r => setTimeout(r, 500));
      setActiveButton(null);
    }
    await new Promise(r => setTimeout(r, 200));
    setCanClick(true);
  }, [sounds]);

  const startGame = () => {
    const firstMove = Math.floor(Math.random() * 4);
    setSequence([firstMove]);
    setPlayerSequence([]);
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setTimeout(() => playSequence([firstMove]), 500);
  };

  const handleClick = (index: number) => {
    if (!canClick || gameOver) return;

    setActiveButton(index);
    sounds.playBeep();
    setTimeout(() => setActiveButton(null), 200);

    const newPlayerSeq = [...playerSequence, index];
    setPlayerSequence(newPlayerSeq);

    if (index !== sequence[newPlayerSeq.length - 1]) {
      setGameOver(true);
      setIsPlaying(false);
      sounds.playError();
      onGameEnd(score);
      return;
    }

    if (newPlayerSeq.length === sequence.length) {
      const newScore = score + sequence.length * 10;
      setScore(newScore);
      onScoreUpdate(newScore);
      sounds.playSuccess();
      
      const nextMove = Math.floor(Math.random() * 4);
      const newSeq = [...sequence, nextMove];
      setSequence(newSeq);
      setPlayerSequence([]);
      setTimeout(() => playSequence(newSeq), 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-cyan-400 font-bold text-xl">
        {isPlaying ? `Level: ${sequence.length} | Score: ${score}` : "Press Start"}
      </div>

      <div className="grid grid-cols-2 gap-4 p-6 bg-gray-900 rounded-full">
        {colors.map((color, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={!canClick}
            className={`w-28 h-28 rounded-full transition-all duration-100 ${
              activeButton === i ? color.active : color.bg
            } ${i === 0 ? "rounded-br-none" : i === 1 ? "rounded-bl-none" : i === 2 ? "rounded-tr-none" : "rounded-tl-none"}`}
            style={{
              boxShadow: activeButton === i ? `0 0 40px ${color.glow}` : "none"
            }}
          />
        ))}
      </div>

      {!isPlaying && !gameOver && (
        <button onClick={startGame} className="px-8 py-3 bg-purple-600 rounded-lg text-white font-bold text-lg hover:bg-purple-500">
          Start Game
        </button>
      )}

      {!canClick && isPlaying && !gameOver && (
        <div className="text-yellow-400 animate-pulse text-lg">Watch the sequence...</div>
      )}

      {canClick && isPlaying && (
        <div className="text-green-400 text-lg">Your turn! Repeat the pattern</div>
      )}

      {gameOver && (
        <>
          <div className="text-red-400 text-2xl font-bold">Game Over!</div>
          <div className="text-gray-300">Final Score: {score} | Reached Level {sequence.length}</div>
          <button onClick={startGame} className="px-6 py-2 bg-purple-600 rounded-lg text-white font-bold hover:bg-purple-500">
            Try Again
          </button>
        </>
      )}
    </div>
  );
}
