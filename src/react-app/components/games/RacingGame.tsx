import { useState, useEffect, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface RacingGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Car { x: number; y: number; lane: number; }

export default function RacingGame({ onGameEnd, onScoreUpdate }: RacingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const playerLane = useRef(1);
  const cars = useRef<Car[]>([]);
  const speed = useRef(5);
  const roadOffset = useRef(0);
  const animationRef = useRef<number>(0);
  const sounds = useGameSounds();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const laneX = [100, 200, 300];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") { playerLane.current = Math.max(0, playerLane.current - 1); sounds.playMove(); }
      if (e.key === "ArrowRight" || e.key === "d") { playerLane.current = Math.min(2, playerLane.current + 1); sounds.playMove(); }
    };
    window.addEventListener("keydown", handleKeyDown);

    const gameLoop = () => {
      if (gameOver) return;

      roadOffset.current = (roadOffset.current + speed.current) % 40;
      
      if (Math.random() < 0.02) {
        const lane = Math.floor(Math.random() * 3);
        if (!cars.current.some(c => c.y < 100 && c.lane === lane)) {
          cars.current.push({ x: laneX[lane], y: -60, lane });
        }
      }

      cars.current = cars.current.filter(c => {
        c.y += speed.current - 2;
        if (c.y > 450) {
          setScore(s => {
            const ns = s + 10;
            onScoreUpdate(ns);
            if (ns % 100 === 0) speed.current = Math.min(15, speed.current + 0.5);
            return ns;
          });
          return false;
        }
        if (c.y > 300 && c.y < 380 && c.lane === playerLane.current) {
          setGameOver(true);
          sounds.playExplosion();
          onGameEnd(score);
        }
        return true;
      });

      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, 400, 400);
      
      ctx.fillStyle = "#333";
      ctx.fillRect(50, 0, 300, 400);
      
      ctx.strokeStyle = "#ffff00";
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -roadOffset.current;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(50 + i * 100, 0);
        ctx.lineTo(50 + i * 100, 400);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.fillStyle = "#ff0000";
      cars.current.forEach(c => {
        ctx.fillRect(c.x - 20, c.y - 30, 40, 60);
        ctx.fillStyle = "#aa0000";
        ctx.fillRect(c.x - 15, c.y - 25, 30, 15);
        ctx.fillStyle = "#ff0000";
      });

      ctx.fillStyle = "#00ff00";
      const px = laneX[playerLane.current];
      ctx.fillRect(px - 20, 320, 40, 60);
      ctx.fillStyle = "#00aa00";
      ctx.fillRect(px - 15, 325, 30, 15);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px monospace";
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.fillText(`Speed: ${Math.floor(speed.current * 10)}`, 300, 30);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(animationRef.current!);
    };
  }, [gameOver, score, onGameEnd, onScoreUpdate]);

  const resetGame = () => {
    cars.current = [];
    playerLane.current = 1;
    speed.current = 5;
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={400} className="border-2 border-yellow-500 rounded-lg" />
      {gameOver ? (
        <>
          <div className="text-red-400 text-2xl font-bold">CRASH! Score: {score}</div>
          <button onClick={resetGame} className="px-4 py-2 bg-yellow-600 rounded-lg text-white hover:bg-yellow-500">
            Race Again
          </button>
        </>
      ) : (
        <p className="text-gray-400 text-sm">A/D or Left/Right arrows to change lanes</p>
      )}
    </div>
  );
}
