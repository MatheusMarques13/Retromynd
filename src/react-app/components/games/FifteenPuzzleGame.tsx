import { useState, useEffect } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface FifteenPuzzleGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function FifteenPuzzleGame({ onGameEnd, onScoreUpdate }: FifteenPuzzleGameProps) {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const sounds = useGameSounds();

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    let arr = Array.from({ length: 16 }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (!isSolvable(arr)) {
      const nonZero = arr.filter(x => x !== 0);
      [nonZero[0], nonZero[1]] = [nonZero[1], nonZero[0]];
      let idx = 0;
      arr = arr.map(x => x === 0 ? 0 : nonZero[idx++]);
    }
    setTiles(arr);
    setMoves(0);
    setGameWon(false);
  };

  const isSolvable = (arr: number[]) => {
    let inversions = 0;
    const flat = arr.filter(x => x !== 0);
    for (let i = 0; i < flat.length; i++) {
      for (let j = i + 1; j < flat.length; j++) {
        if (flat[i] > flat[j]) inversions++;
      }
    }
    const emptyRow = Math.floor(arr.indexOf(0) / 4);
    return (inversions + emptyRow) % 2 === 1;
  };

  const checkWin = (arr: number[]) => {
    for (let i = 0; i < 15; i++) {
      if (arr[i] !== i + 1) return false;
    }
    return arr[15] === 0;
  };

  const moveTile = (index: number) => {
    if (gameWon) return;
    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / 4);
    const emptyRow = Math.floor(emptyIndex / 4);
    const col = index % 4;
    const emptyCol = emptyIndex % 4;
    
    const isAdjacent = (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
                       (Math.abs(col - emptyCol) === 1 && row === emptyRow);
    
    if (isAdjacent) {
      const newTiles = [...tiles];
      [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
      setTiles(newTiles);
      sounds.playMove();
      const newMoves = moves + 1;
      setMoves(newMoves);
      const score = Math.max(2000 - newMoves * 10, 100);
      onScoreUpdate(score);
      
      if (checkWin(newTiles)) {
        setGameWon(true);
        sounds.playWin();
        onGameEnd(score);
      }
    }
  };

  const colors = ["from-red-500 to-orange-500", "from-orange-500 to-yellow-500", "from-yellow-500 to-green-500", "from-green-500 to-cyan-500", "from-cyan-500 to-blue-500", "from-blue-500 to-purple-500", "from-purple-500 to-pink-500", "from-pink-500 to-red-500"];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-cyan-400 font-bold text-xl">Moves: {moves}</div>
      <div className="grid grid-cols-4 gap-1 p-3 bg-gray-900 rounded-xl">
        {tiles.map((tile, index) => (
          <button
            key={index}
            onClick={() => moveTile(index)}
            className={`w-16 h-16 rounded font-bold text-xl transition-all ${
              tile === 0
                ? "bg-transparent"
                : `bg-gradient-to-br ${colors[tile % colors.length]} text-white shadow-lg hover:scale-105`
            }`}
          >
            {tile || ""}
          </button>
        ))}
      </div>
      {gameWon && (
        <div className="text-yellow-400 text-2xl font-bold animate-pulse">SOLVED! 🏆</div>
      )}
      <button onClick={initGame} className="px-4 py-2 bg-pink-600 rounded-lg text-white hover:bg-pink-500">
        New Puzzle
      </button>
    </div>
  );
}
