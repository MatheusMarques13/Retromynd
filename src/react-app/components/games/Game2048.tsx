import { useState, useEffect, useCallback } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface Game2048Props {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

type Grid = number[][];

export default function Game2048({ onGameEnd, onScoreUpdate }: Game2048Props) {
  const [grid, setGrid] = useState<Grid>(() => initializeGrid());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const sounds = useGameSounds();

  function initializeGrid(): Grid {
    const newGrid = Array(4).fill(null).map(() => Array(4).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    return newGrid;
  }

  function addRandomTile(g: Grid) {
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (g[i][j] === 0) emptyCells.push([i, j]);
      }
    }
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      g[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  function slideRow(row: number[]): { newRow: number[]; points: number } {
    let points = 0;
    const filtered = row.filter(x => x !== 0);
    const merged: number[] = [];
    let skip = false;
    
    for (let i = 0; i < filtered.length; i++) {
      if (skip) {
        skip = false;
        continue;
      }
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        merged.push(filtered[i] * 2);
        points += filtered[i] * 2;
        skip = true;
      } else {
        merged.push(filtered[i]);
      }
    }
    
    while (merged.length < 4) merged.push(0);
    return { newRow: merged, points };
  }

  function move(direction: "up" | "down" | "left" | "right") {
    if (gameOver) return;
    
    let newGrid = grid.map(row => [...row]);
    let totalPoints = 0;
    let moved = false;

    const transpose = (g: Grid): Grid => g[0].map((_, i) => g.map(row => row[i]));
    const reverse = (g: Grid): Grid => g.map(row => [...row].reverse());

    if (direction === "up") {
      newGrid = transpose(newGrid);
      for (let i = 0; i < 4; i++) {
        const { newRow, points } = slideRow(newGrid[i]);
        if (JSON.stringify(newRow) !== JSON.stringify(newGrid[i])) moved = true;
        newGrid[i] = newRow;
        totalPoints += points;
      }
      newGrid = transpose(newGrid);
    } else if (direction === "down") {
      newGrid = transpose(newGrid);
      newGrid = reverse(newGrid);
      for (let i = 0; i < 4; i++) {
        const { newRow, points } = slideRow(newGrid[i]);
        if (JSON.stringify(newRow) !== JSON.stringify(newGrid[i])) moved = true;
        newGrid[i] = newRow;
        totalPoints += points;
      }
      newGrid = reverse(newGrid);
      newGrid = transpose(newGrid);
    } else if (direction === "left") {
      for (let i = 0; i < 4; i++) {
        const { newRow, points } = slideRow(newGrid[i]);
        if (JSON.stringify(newRow) !== JSON.stringify(newGrid[i])) moved = true;
        newGrid[i] = newRow;
        totalPoints += points;
      }
    } else if (direction === "right") {
      newGrid = reverse(newGrid);
      for (let i = 0; i < 4; i++) {
        const { newRow, points } = slideRow(newGrid[i]);
        if (JSON.stringify(newRow) !== JSON.stringify(newGrid[i])) moved = true;
        newGrid[i] = newRow;
        totalPoints += points;
      }
      newGrid = reverse(newGrid);
    }

    if (moved) {
      addRandomTile(newGrid);
      const newScore = score + totalPoints;
      setScore(newScore);
      setGrid(newGrid);
      onScoreUpdate(newScore);

      // Play sounds
      if (totalPoints > 0) {
        sounds.playMerge();
      } else {
        sounds.playMove();
      }

      // Check for 2048 win
      for (let row of newGrid) {
        if (row.includes(2048) && !won) {
          setWon(true);
          sounds.playWin();
        }
      }

      // Check game over
      if (isGameOver(newGrid)) {
        setGameOver(true);
        sounds.playGameOver();
        onGameEnd(newScore);
      }
    }
  }

  function isGameOver(g: Grid): boolean {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (g[i][j] === 0) return false;
        if (i < 3 && g[i][j] === g[i + 1][j]) return false;
        if (j < 3 && g[i][j] === g[i][j + 1]) return false;
      }
    }
    return true;
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      const dirMap: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right"
      };
      move(dirMap[e.key]);
    }
  }, [grid, score, gameOver]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Touch handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? "right" : "left");
    } else {
      move(dy > 0 ? "down" : "up");
    }
    setTouchStart(null);
  }

  function restart() {
    setGrid(initializeGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  }

  const getTileColor = (value: number): string => {
    const colors: Record<number, string> = {
      0: "bg-gray-800/50",
      2: "bg-amber-100 text-gray-900",
      4: "bg-amber-200 text-gray-900",
      8: "bg-orange-400 text-white",
      16: "bg-orange-500 text-white",
      32: "bg-orange-600 text-white",
      64: "bg-red-500 text-white",
      128: "bg-yellow-400 text-white",
      256: "bg-yellow-500 text-white",
      512: "bg-yellow-600 text-white",
      1024: "bg-amber-500 text-white",
      2048: "bg-amber-400 text-white",
    };
    return colors[value] || "bg-purple-600 text-white";
  };

  return (
    <div 
      className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Score */}
      <div className="mb-4 text-center">
        <div className="text-amber-400 text-sm font-mono mb-1">SCORE</div>
        <div className="text-3xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
          {score}
        </div>
      </div>

      {/* Grid */}
      <div className="relative">
        <div className="grid grid-cols-4 gap-2 p-3 bg-gray-900/80 rounded-xl border-2 border-amber-500/30">
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg font-bold text-lg sm:text-xl transition-all duration-100 ${getTileColor(cell)}`}
                style={{ fontFamily: "'VT323', monospace" }}
              >
                {cell !== 0 && cell}
              </div>
            ))
          )}
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl">
            <div className="text-2xl font-bold text-red-400 mb-2" style={{ fontFamily: "'VT323', monospace" }}>
              GAME OVER
            </div>
            <div className="text-lg text-amber-400 mb-4">Final Score: {score}</div>
            <button
              onClick={restart}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Win Overlay */}
        {won && !gameOver && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500/90 rounded-lg">
            <span className="text-black font-bold">🎉 You reached 2048!</span>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div className="mt-4 text-gray-500 text-xs text-center">
        Use arrow keys or swipe to move tiles
      </div>
    </div>
  );
}
