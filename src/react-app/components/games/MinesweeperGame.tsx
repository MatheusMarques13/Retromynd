import { useState, useCallback } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface MinesweeperGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const GRID_SIZE = 10;
const MINE_COUNT = 15;

type CellState = { mine: boolean; revealed: boolean; flagged: boolean; adjacent: number };

export default function MinesweeperGame({ onGameEnd, onScoreUpdate }: MinesweeperGameProps) {
  const [grid, setGrid] = useState<CellState[][]>(() => initGrid());
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const sounds = useGameSounds();

  function initGrid(): CellState[][] {
    const g: CellState[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
    );
    // Place mines
    let placed = 0;
    while (placed < MINE_COUNT) {
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);
      if (!g[r][c].mine) { g[r][c].mine = true; placed++; }
    }
    // Calculate adjacents
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!g[r][c].mine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && g[nr][nc].mine) count++;
            }
          }
          g[r][c].adjacent = count;
        }
      }
    }
    return g;
  }

  const reveal = useCallback((r: number, c: number) => {
    if (gameOver || won) return;
    setGrid(prev => {
      const g = prev.map(row => row.map(cell => ({ ...cell })));
      if (g[r][c].revealed || g[r][c].flagged) return prev;
      
      if (g[r][c].mine) {
        // Reveal all mines
        g.forEach(row => row.forEach(cell => { if (cell.mine) cell.revealed = true; }));
        setGameOver(true);
        sounds.playExplosion();
        onGameEnd(score);
        return g;
      }

      // Flood fill for empty cells
      const stack: [number, number][] = [[r, c]];
      let revealed = 0;
      while (stack.length > 0) {
        const [cr, cc] = stack.pop()!;
        if (cr < 0 || cr >= GRID_SIZE || cc < 0 || cc >= GRID_SIZE) continue;
        if (g[cr][cc].revealed || g[cr][cc].mine || g[cr][cc].flagged) continue;
        g[cr][cc].revealed = true;
        revealed++;
        if (g[cr][cc].adjacent === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              stack.push([cr + dr, cc + dc]);
            }
          }
        }
      }
      
      const newScore = score + revealed * 10;
      setScore(newScore);
      onScoreUpdate(newScore);
      if (revealed > 0) sounds.playClick();

      // Check win
      const unrevealed = g.flat().filter(c => !c.revealed && !c.mine).length;
      if (unrevealed === 0) {
        setWon(true);
        sounds.playWin();
        onGameEnd(newScore + 100);
      }

      return g;
    });
  }, [gameOver, won, score, onGameEnd, onScoreUpdate]);

  const toggleFlag = useCallback((r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (gameOver || won) return;
    setGrid(prev => {
      const g = prev.map(row => row.map(cell => ({ ...cell })));
      if (!g[r][c].revealed) { g[r][c].flagged = !g[r][c].flagged; sounds.playTick(); }
      return g;
    });
  }, [gameOver, won]);

  const reset = () => {
    setGrid(initGrid());
    setGameOver(false);
    setWon(false);
    setScore(0);
  };

  const colors: Record<number, string> = {
    1: "text-blue-500", 2: "text-green-500", 3: "text-red-500", 4: "text-purple-500",
    5: "text-yellow-600", 6: "text-cyan-500", 7: "text-pink-500", 8: "text-gray-500"
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <span className="text-cyan-400 font-bold">Score: {score}</span>
        <span className="text-gray-400">💣 {MINE_COUNT - grid.flat().filter(c => c.flagged).length}</span>
      </div>
      <div className="grid gap-0.5 bg-gray-700 p-2 rounded-lg" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
        {grid.map((row, r) => row.map((cell, c) => (
          <button
            key={`${r}-${c}`}
            onClick={() => reveal(r, c)}
            onContextMenu={(e) => toggleFlag(r, c, e)}
            className={`w-8 h-8 text-sm font-bold flex items-center justify-center transition-all ${
              cell.revealed
                ? cell.mine
                  ? "bg-red-600"
                  : "bg-gray-300"
                : "bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-300 hover:to-gray-400 shadow-inner"
            } ${colors[cell.adjacent] || ""}`}
          >
            {cell.revealed
              ? cell.mine ? "💣" : cell.adjacent > 0 ? cell.adjacent : ""
              : cell.flagged ? "🚩" : ""}
          </button>
        )))}
      </div>
      {(gameOver || won) && (
        <div className="flex flex-col items-center gap-2">
          <div className={`text-2xl font-bold ${won ? "text-green-400" : "text-red-400"}`}>
            {won ? "YOU WIN! 🎉" : "GAME OVER 💥"}
          </div>
          <button onClick={reset} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500">
            Play Again
          </button>
        </div>
      )}
      <p className="text-gray-400 text-sm">Click to reveal, Right-click to flag</p>
    </div>
  );
}
