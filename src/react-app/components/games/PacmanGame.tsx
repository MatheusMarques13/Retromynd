import { useState, useEffect, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface PacmanGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const MAZE = [
  "######################",
  "#..........##........#",
  "#.###.####.##.####.###",
  "#....................#",
  "#.###.##.####.##.###.#",
  "#.....##..##..##.....#",
  "#####.###.##.###.#####",
  "    #.##......##.#    ",
  "#####.##.####.##.#####",
  ".........####.........",
  "#####.##.####.##.#####",
  "    #.##......##.#    ",
  "#####.##.####.##.#####",
  "#..........##........#",
  "#.###.####.##.####.###",
  "#...#..........#.....#",
  "###.#.##.####.##.#.###",
  "#.....##..##..##.....#",
  "#.#######.##.#######.#",
  "#....................#",
  "######################",
];

export default function PacmanGame({ onGameEnd, onScoreUpdate }: PacmanGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const pacman = useRef({ x: 10, y: 15, dir: 0 });
  const ghosts = useRef([
    { x: 10, y: 9, color: "#ff0000", dir: 0 },
    { x: 11, y: 9, color: "#00ffff", dir: 1 },
    { x: 9, y: 9, color: "#ffb8ff", dir: 2 },
  ]);
  const dots = useRef<Set<string>>(new Set());
  const sounds = useGameSounds();

  useEffect(() => {
    dots.current.clear();
    for (let y = 0; y < MAZE.length; y++) {
      for (let x = 0; x < MAZE[y].length; x++) {
        if (MAZE[y][x] === ".") dots.current.add(`${x},${y}`);
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cellSize = 18;

    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") pacman.current.dir = 0;
      if (e.key === "ArrowDown") pacman.current.dir = 1;
      if (e.key === "ArrowLeft") pacman.current.dir = 2;
      if (e.key === "ArrowUp") pacman.current.dir = 3;
    };
    window.addEventListener("keydown", handleKey);

    const canMove = (x: number, y: number) => {
      if (y < 0 || y >= MAZE.length) return true;
      if (x < 0 || x >= MAZE[y].length) return true;
      return MAZE[y][x] !== "#";
    };

    let frame = 0;
    let animationId: number;
    const gameLoop = () => {
      if (lives <= 0) { sounds.playGameOver(); onGameEnd(score); return; }
      if (dots.current.size === 0) { sounds.playWin(); onGameEnd(score + 200); return; }
      frame++;

      // Move pacman
      if (frame % 8 === 0) {
        const p = pacman.current;
        const [dx, dy] = dirs[p.dir];
        let nx = p.x + dx, ny = p.y + dy;
        if (nx < 0) nx = 21; if (nx > 21) nx = 0;
        if (canMove(nx, ny)) { p.x = nx; p.y = ny; }
        
        const key = `${p.x},${p.y}`;
        if (dots.current.has(key)) {
          dots.current.delete(key);
          setScore(s => { const n = s + 10; onScoreUpdate(n); return n; });
          sounds.playCollect();
        }
      }

      // Move ghosts
      if (frame % 12 === 0) {
        ghosts.current.forEach(g => {
          const [dx, dy] = dirs[g.dir];
          let nx = g.x + dx, ny = g.y + dy;
          if (nx < 0) nx = 21; if (nx > 21) nx = 0;
          if (!canMove(nx, ny) || Math.random() < 0.2) {
            g.dir = Math.floor(Math.random() * 4);
          } else {
            g.x = nx; g.y = ny;
          }
        });
      }

      // Ghost collision
      const p = pacman.current;
      ghosts.current.forEach(g => {
        if (g.x === p.x && g.y === p.y) {
          setLives(l => l - 1);
          p.x = 10; p.y = 15;
          sounds.playHit();
        }
      });

      // Draw
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 400, 400);
      
      for (let y = 0; y < MAZE.length; y++) {
        for (let x = 0; x < MAZE[y].length; x++) {
          if (MAZE[y][x] === "#") {
            ctx.fillStyle = "#2121de";
            ctx.fillRect(x * cellSize + 4, y * cellSize + 4, cellSize - 1, cellSize - 1);
          }
        }
      }

      dots.current.forEach(key => {
        const [x, y] = key.split(",").map(Number);
        ctx.beginPath();
        ctx.arc(x * cellSize + cellSize / 2 + 4, y * cellSize + cellSize / 2 + 4, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ffb897";
        ctx.fill();
      });

      // Draw pacman
      ctx.beginPath();
      ctx.arc(p.x * cellSize + cellSize / 2 + 4, p.y * cellSize + cellSize / 2 + 4, 8, 0.2 + p.dir * Math.PI / 2, 2 * Math.PI - 0.2 + p.dir * Math.PI / 2);
      ctx.lineTo(p.x * cellSize + cellSize / 2 + 4, p.y * cellSize + cellSize / 2 + 4);
      ctx.fillStyle = "#ffff00";
      ctx.fill();

      // Draw ghosts
      ghosts.current.forEach(g => {
        ctx.beginPath();
        ctx.arc(g.x * cellSize + cellSize / 2 + 4, g.y * cellSize + cellSize / 2 + 2, 8, Math.PI, 0);
        ctx.fillStyle = g.color;
        ctx.fill();
        ctx.fillRect(g.x * cellSize - 4 + 4, g.y * cellSize + 2 + 4, 16, 8);
        ctx.fillStyle = "#fff";
        ctx.fillRect(g.x * cellSize + 4, g.y * cellSize + 4, 4, 4);
        ctx.fillRect(g.x * cellSize + 10, g.y * cellSize + 4, 4, 4);
      });

      ctx.fillStyle = "#fff"; ctx.font = "12px monospace";
      ctx.fillText(`Score: ${score}  Lives: ${"❤️".repeat(Math.max(0, lives))}`, 5, 395);

      animationId = requestAnimationFrame(gameLoop);
    };
    animationId = requestAnimationFrame(gameLoop);
    return () => { window.removeEventListener("keydown", handleKey); cancelAnimationFrame(animationId); };
  }, [lives, score, onGameEnd, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={400} className="border-2 border-blue-500 rounded-lg" />
      <p className="text-gray-400 text-sm">Arrow keys to move</p>
    </div>
  );
}
