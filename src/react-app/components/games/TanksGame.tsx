import { useState, useEffect, useCallback, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface TanksGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Tank { x: number; y: number; angle: number; }
interface Bullet { x: number; y: number; vx: number; vy: number; }
interface Enemy { x: number; y: number; hp: number; }

export default function TanksGame({ onGameEnd, onScoreUpdate }: TanksGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const tank = useRef<Tank>({ x: 200, y: 350, angle: -Math.PI / 2 });
  const bullets = useRef<Bullet[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const keys = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>(0);
  const sounds = useGameSounds();

  const spawnEnemy = useCallback(() => {
    enemies.current.push({ x: 50 + Math.random() * 300, y: -30, hp: 1 });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let lastShot = 0;
    let spawnTimer = 0;

    const gameLoop = (time: number) => {
      if (gameOver) return;
      const t = tank.current;

      if (keys.current.has("a") || keys.current.has("arrowleft")) t.x = Math.max(20, t.x - 4);
      if (keys.current.has("d") || keys.current.has("arrowright")) t.x = Math.min(380, t.x + 4);
      if (keys.current.has(" ") && time - lastShot > 200) {
        bullets.current.push({ x: t.x, y: t.y - 20, vx: 0, vy: -8 });
        lastShot = time;
        sounds.playShoot();
      }

      bullets.current = bullets.current.filter(b => {
        b.x += b.vx; b.y += b.vy;
        return b.y > -10;
      });

      spawnTimer++;
      if (spawnTimer > 60) { spawnEnemy(); spawnTimer = 0; }

      enemies.current = enemies.current.filter(e => {
        e.y += 1.5;
        bullets.current.forEach((b, bi) => {
          if (Math.abs(b.x - e.x) < 25 && Math.abs(b.y - e.y) < 25) {
            e.hp--;
            bullets.current.splice(bi, 1);
            if (e.hp <= 0) {
              setScore(s => { const ns = s + 50; onScoreUpdate(ns); return ns; });
              sounds.playExplosion();
            }
          }
        });
        if (e.y > 400) {
          setGameOver(true);
          sounds.playGameOver();
          onGameEnd(score);
        }
        return e.hp > 0;
      });

      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, 400, 400);
      
      ctx.strokeStyle = "#00ff0022";
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 20, 0);
        ctx.lineTo(i * 20, 400);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * 20);
        ctx.lineTo(400, i * 20);
        ctx.stroke();
      }

      ctx.fillStyle = "#00ff00";
      ctx.fillRect(t.x - 20, t.y - 15, 40, 30);
      ctx.fillRect(t.x - 5, t.y - 30, 10, 20);

      ctx.fillStyle = "#ffff00";
      bullets.current.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "#ff0000";
      enemies.current.forEach(e => {
        ctx.fillRect(e.x - 20, e.y - 15, 40, 30);
      });

      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px monospace";
      ctx.fillText(`Score: ${score}`, 10, 30);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationRef.current!);
    };
  }, [gameOver, score, onGameEnd, onScoreUpdate, spawnEnemy]);

  const resetGame = () => {
    tank.current = { x: 200, y: 350, angle: -Math.PI / 2 };
    bullets.current = [];
    enemies.current = [];
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={400} className="border-2 border-green-500 rounded-lg" />
      {gameOver ? (
        <>
          <div className="text-red-400 text-2xl font-bold">GAME OVER! Score: {score}</div>
          <button onClick={resetGame} className="px-4 py-2 bg-green-600 rounded-lg text-white hover:bg-green-500">
            Play Again
          </button>
        </>
      ) : (
        <p className="text-gray-400 text-sm">A/D or Arrows to move, SPACE to shoot</p>
      )}
    </div>
  );
}
