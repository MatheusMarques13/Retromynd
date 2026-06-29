import { useState, useEffect, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface ShooterGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Target { x: number; y: number; size: number; speed: number; }

export default function ShooterGame({ onGameEnd, onScoreUpdate }: ShooterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const targets = useRef<Target[]>([]);
  const animationRef = useRef<number>(0);
  const sounds = useGameSounds();

  useEffect(() => {
    if (timeLeft <= 0) {
      setGameOver(true);
      onGameEnd(score);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, score, onGameEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const spawnTarget = () => {
      const size = 20 + Math.random() * 30;
      targets.current.push({
        x: -size,
        y: 50 + Math.random() * 300,
        size,
        speed: 2 + Math.random() * 3
      });
    };

    const handleClick = (e: MouseEvent) => {
      if (gameOver) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      for (let i = targets.current.length - 1; i >= 0; i--) {
        const t = targets.current[i];
        const dist = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
        if (dist < t.size) {
          const points = Math.round(100 / t.size * 10);
          setScore(s => { const ns = s + points; onScoreUpdate(ns); return ns; });
          targets.current.splice(i, 1);
          sounds.playHit();
          break;
        }
      }
    };

    canvas.addEventListener("click", handleClick);

    let spawnTimer = 0;
    const gameLoop = () => {
      if (gameOver) return;

      spawnTimer++;
      if (spawnTimer > 30) { spawnTarget(); spawnTimer = 0; }

      targets.current = targets.current.filter(t => {
        t.x += t.speed;
        return t.x < 450;
      });

      ctx.fillStyle = "#1a0030";
      ctx.fillRect(0, 0, 400, 400);
      
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`;
        ctx.fillRect(Math.random() * 400, Math.random() * 400, 1, 1);
      }

      targets.current.forEach(t => {
        const gradient = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.size);
        gradient.addColorStop(0, "#ff6600");
        gradient.addColorStop(0.7, "#ff0066");
        gradient.addColorStop(1, "#ff006600");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px monospace";
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.fillText(`Time: ${timeLeft}s`, 300, 30);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      canvas.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationRef.current!);
    };
  }, [gameOver, score, timeLeft, onScoreUpdate]);

  const resetGame = () => {
    targets.current = [];
    setScore(0);
    setTimeLeft(30);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={400} className="border-2 border-orange-500 rounded-lg cursor-crosshair" />
      {gameOver ? (
        <>
          <div className="text-yellow-400 text-2xl font-bold">Final Score: {score}</div>
          <button onClick={resetGame} className="px-4 py-2 bg-orange-600 rounded-lg text-white hover:bg-orange-500">
            Play Again
          </button>
        </>
      ) : (
        <p className="text-gray-400 text-sm">Click the targets! Smaller = more points</p>
      )}
    </div>
  );
}
