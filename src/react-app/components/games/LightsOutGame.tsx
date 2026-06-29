import { useState, useEffect } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface LightsOutGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function LightsOutGame({ onGameEnd, onScoreUpdate }: LightsOutGameProps) {
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const sounds = useGameSounds();

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const newGrid = Array(5).fill(null).map(() => Array(5).fill(false));
    for (let i = 0; i < 8; i++) {
      const r = Math.floor(Math.random() * 5);
      const c = Math.floor(Math.random() * 5);
      toggle(newGrid, r, c);
    }
    setGrid(newGrid);
    setMoves(0);
    setGameWon(false);
  };

  const toggle = (g: boolean[][], r: number, c: number) => {
    g[r][c] = !g[r][c];
    if (r > 0) g[r - 1][c] = !g[r - 1][c];
    if (r < 4) g[r + 1][c] = !g[r + 1][c];
    if (c > 0) g[r][c - 1] = !g[r][c - 1];
    if (c < 4) g[r][c + 1] = !g[r][c + 1];
  };

  const handleClick = (r: number, c: number) => {
    if (gameWon) return;
    const newGrid = grid.map(row => [...row]);
    toggle(newGrid, r, c);
    setGrid(newGrid);
    sounds.playClick();
    const newMoves = moves + 1;
    setMoves(newMoves);
    
    const allOff = newGrid.every(row => row.every(cell => !cell));
    const score = Math.max(500 - newMoves * 5, 50);
    onScoreUpdate(score);
    
    if (allOff) {
      setGameWon(true);
      sounds.playWin();
      onGameEnd(score);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-cyan-400 font-bold text-xl">Moves: {moves}</div>
      <div className="grid grid-cols-5 gap-1 p-4 bg-gray-900 rounded-xl">
        {grid.map((row, r) =>
          row.map((lit, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => handleClick(r, c)}
              className={`w-14 h-14 rounded transition-all ${
                lit
                  ? "bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)]"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            />
          ))
        )}
      </div>
      {gameWon && (
        <div className="text-yellow-400 text-2xl font-bold animate-pulse">ALL LIGHTS OUT! 💡</div>
      )}
      <button onClick={initGame} className="px-4 py-2 bg-pink-600 rounded-lg text-white hover:bg-pink-500">
        New Game
      </button>
      <p className="text-gray-400 text-sm text-center">Click a light to toggle it and adjacent lights</p>
    </div>
  );
}
