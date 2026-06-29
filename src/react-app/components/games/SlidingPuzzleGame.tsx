import { useState, useEffect } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface SlidingPuzzleGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function SlidingPuzzleGame({ onGameEnd, onScoreUpdate }: SlidingPuzzleGameProps) {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const sounds = useGameSounds();

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    let arr = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (!isSolvable(arr)) {
      [arr[0], arr[1]] = [arr[1], arr[0]];
    }
    setTiles(arr);
    setMoves(0);
    setGameWon(false);
  };

  const isSolvable = (arr: number[]) => {
    let inversions = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] && arr[j] && arr[i] > arr[j]) inversions++;
      }
    }
    return inversions % 2 === 0;
  };

  const checkWin = (arr: number[]) => {
    return arr.every((val, idx) => val === (idx + 1) % 9);
  };

  const moveTile = (index: number) => {
    if (gameWon) return;
    const emptyIndex = tiles.indexOf(0);
    const validMoves = [emptyIndex - 1, emptyIndex + 1, emptyIndex - 3, emptyIndex + 3];
    
    if (emptyIndex % 3 === 0 && index === emptyIndex - 1) return;
    if (emptyIndex % 3 === 2 && index === emptyIndex + 1) return;
    
    if (validMoves.includes(index)) {
      const newTiles = [...tiles];
      [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
      setTiles(newTiles);
      sounds.playMove();
      const newMoves = moves + 1;
      setMoves(newMoves);
      const score = Math.max(1000 - newMoves * 10, 100);
      onScoreUpdate(score);
      
      if (checkWin(newTiles)) {
        setGameWon(true);
        sounds.playWin();
        onGameEnd(score);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-cyan-400 font-bold text-xl">Moves: {moves}</div>
      <div className="grid grid-cols-3 gap-2 p-4 bg-purple-900/50 rounded-xl">
        {tiles.map((tile, index) => (
          <button
            key={index}
            onClick={() => moveTile(index)}
            className={`w-20 h-20 rounded-lg font-bold text-2xl transition-all ${
              tile === 0
                ? "bg-transparent"
                : "bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-lg hover:scale-105"
            }`}
            style={{ boxShadow: tile ? "0 0 20px rgba(0,255,255,0.3)" : "none" }}
          >
            {tile || ""}
          </button>
        ))}
      </div>
      {gameWon && (
        <div className="text-yellow-400 text-2xl font-bold animate-pulse">PUZZLE SOLVED! 🧩</div>
      )}
      <button onClick={initGame} className="px-4 py-2 bg-pink-600 rounded-lg text-white hover:bg-pink-500">
        New Puzzle
      </button>
    </div>
  );
}
