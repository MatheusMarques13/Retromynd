import { useState, useEffect, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface PlatformerGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Platform { x: number; y: number; width: number; }

export default function PlatformerGame({ onGameEnd, onScoreUpdate }: PlatformerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const player = useRef({ x: 200, y: 350, vy: 0, onGround: true });
  const platforms = useRef<Platform[]>([{ x: 150, y: 380, width: 100 }]);
  const keys = useRef<Set<string>>(new Set());
  const cameraY = useRef(0);
  const animationRef = useRef<number>(0);
  const sounds = useGameSounds();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    for (let i = 1; i < 50; i++) {
      platforms.current.push({
        x: Math.random() * 300,
        y: 380 - i * 80,
        width: 60 + Math.random() * 60
      });
    }

    const gameLoop = () => {
      if (gameOver) return;
      const p = player.current;

      if (keys.current.has("a") || keys.current.has("arrowleft")) p.x -= 5;
      if (keys.current.has("d") || keys.current.has("arrowright")) p.x += 5;
      if ((keys.current.has("w") || keys.current.has("arrowup") || keys.current.has(" ")) && p.onGround) {
        p.vy = -12;
        p.onGround = false;
        sounds.playJump();
      }

      p.x = Math.max(15, Math.min(385, p.x));
      p.vy += 0.5;
      p.y += p.vy;
      p.onGround = false;

      platforms.current.forEach(plat => {
        if (p.vy > 0 && p.y >= plat.y - 15 && p.y <= plat.y + 10 &&
            p.x > plat.x - 15 && p.x < plat.x + plat.width + 15) {
          p.y = plat.y - 15;
          p.vy = 0;
          p.onGround = true;
        }
      });

      if (p.y < cameraY.current + 150) {
        cameraY.current = p.y - 150;
        const newScore = Math.max(score, Math.floor(-cameraY.current / 10));
        if (newScore > score) {
          setScore(newScore);
          onScoreUpdate(newScore);
        }
      }

      if (p.y > cameraY.current + 450) {
        setGameOver(true);
        sounds.playGameOver();
        onGameEnd(score);
      }

      ctx.fillStyle = "#1a0a30";
      ctx.fillRect(0, 0, 400, 400);

      ctx.save();
      ctx.translate(0, -cameraY.current);

      platforms.current.forEach(plat => {
        const gradient = ctx.createLinearGradient(plat.x, plat.y, plat.x + plat.width, plat.y);
        gradient.addColorStop(0, "#00ff88");
        gradient.addColorStop(1, "#00ffff");
        ctx.fillStyle = gradient;
        ctx.fillRect(plat.x, plat.y, plat.width, 10);
      });

      ctx.fillStyle = "#ff6600";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ff6600";
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px monospace";
      ctx.fillText(`Height: ${score}`, 10, 30);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationRef.current!);
    };
  }, [gameOver, score, onGameEnd, onScoreUpdate]);

  const resetGame = () => {
    player.current = { x: 200, y: 350, vy: 0, onGround: true };
    platforms.current = [{ x: 150, y: 380, width: 100 }];
    for (let i = 1; i < 50; i++) {
      platforms.current.push({ x: Math.random() * 300, y: 380 - i * 80, width: 60 + Math.random() * 60 });
    }
    cameraY.current = 0;
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={400} className="border-2 border-green-500 rounded-lg" />
      {gameOver ? (
        <>
          <div className="text-yellow-400 text-2xl font-bold">Height: {score}</div>
          <button onClick={resetGame} className="px-4 py-2 bg-green-600 rounded-lg text-white hover:bg-green-500">
            Try Again
          </button>
        </>
      ) : (
        <p className="text-gray-400 text-sm">A/D or Arrows to move, W/Space to jump</p>
      )}
    </div>
  );
}
