import { useState, useEffect, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface DodgeGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Obstacle { x: number; y: number; width: number; speed: number; }

export default function DodgeGame({ onGameEnd, onScoreUpdate }: DodgeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const playerX = useRef(200);
  const obstacles = useRef<Obstacle[]>([]);
  const animationRef = useRef<number>(0);
  const sounds = useGameSounds();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      playerX.current = Math.max(20, Math.min(380, e.clientX - rect.left));
    };
    canvas.addEventListener("mousemove", handleMove);

    let spawnTimer = 0;
    let difficulty = 1;

    const gameLoop = () => {
      if (gameOver) return;

      spawnTimer++;
      if (spawnTimer > Math.max(20, 60 - difficulty * 5)) {
        const width = 30 + Math.random() * 80;
        obstacles.current.push({
          x: Math.random() * (400 - width),
          y: -30,
          width,
          speed: 3 + Math.random() * difficulty
        });
        spawnTimer = 0;
      }

      obstacles.current = obstacles.current.filter(o => {
        o.y += o.speed;
        if (o.y > 400) {
          setScore(s => {
            const ns = s + 10;
            onScoreUpdate(ns);
            if (ns % 100 === 0) { difficulty = Math.min(10, difficulty + 1); sounds.playPowerUp(); }
            return ns;
          });
          return false;
        }
        if (o.y + 20 > 360 && o.y < 380) {
          if (playerX.current > o.x - 15 && playerX.current < o.x + o.width + 15) {
            setGameOver(true);
            sounds.playGameOver();
            onGameEnd(score);
          }
        }
        return true;
      });

      ctx.fillStyle = "#0f0020";
      ctx.fillRect(0, 0, 400, 400);
      
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = `rgba(255,0,255,${0.1 - i * 0.01})`;
        ctx.beginPath();
        ctx.moveTo(0, 50 + i * 50);
        ctx.lineTo(400, 50 + i * 50);
        ctx.stroke();
      }

      ctx.fillStyle = "#ff00ff";
      obstacles.current.forEach(o => {
        ctx.fillRect(o.x, o.y, o.width, 20);
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff00ff";
      });
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#00ffff";
      ctx.beginPath();
      ctx.arc(playerX.current, 370, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00ffff";
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px monospace";
      ctx.fillText(`Score: ${score}`, 10, 30);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(animationRef.current!);
    };
  }, [gameOver, score, onGameEnd, onScoreUpdate]);

  const resetGame = () => {
    obstacles.current = [];
    playerX.current = 200;
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={400} className="border-2 border-purple-500 rounded-lg" />
      {gameOver ? (
        <>
          <div className="text-red-400 text-2xl font-bold">GAME OVER! Score: {score}</div>
          <button onClick={resetGame} className="px-4 py-2 bg-purple-600 rounded-lg text-white hover:bg-purple-500">
            Try Again
          </button>
        </>
      ) : (
        <p className="text-gray-400 text-sm">Move mouse to dodge obstacles</p>
      )}
    </div>
  );
}
