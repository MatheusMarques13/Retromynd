import { useState, useEffect, useCallback, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface PongGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function PongGame({ onGameEnd, onScoreUpdate }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const playerY = useRef(150);
  const aiY = useRef(150);
  const ball = useRef({ x: 200, y: 200, vx: 4, vy: 2 });
  const animationRef = useRef<number>(0);
  const sounds = useGameSounds();

  const resetBall = useCallback(() => {
    ball.current = { x: 200, y: 200, vx: Math.random() > 0.5 ? 4 : -4, vy: (Math.random() - 0.5) * 4 };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      playerY.current = Math.max(0, Math.min(320, e.clientY - rect.top - 40));
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    const gameLoop = () => {
      if (gameOver) return;
      const b = ball.current;
      b.x += b.vx; b.y += b.vy;
      if (b.y <= 0 || b.y >= 390) b.vy = -b.vy;
      
      // AI movement
      aiY.current += (b.y - aiY.current - 40) * 0.08;
      
      // Player paddle collision
      if (b.x <= 30 && b.y >= playerY.current && b.y <= playerY.current + 80) {
        b.vx = Math.abs(b.vx) * 1.05;
        b.vy += (b.y - playerY.current - 40) * 0.1;
        sounds.playBounce();
      }
      // AI paddle collision
      if (b.x >= 370 && b.y >= aiY.current && b.y <= aiY.current + 80) {
        b.vx = -Math.abs(b.vx);
        sounds.playBounce();
      }
      // Score
      if (b.x < 0) { sounds.playError(); resetBall(); }
      if (b.x > 400) {
        setScore(s => { const newS = s + 10; onScoreUpdate(newS); return newS; });
        sounds.playScore();
        resetBall();
      }
      if (score >= 50) { setGameOver(true); sounds.playWin(); onGameEnd(score); }

      // Draw
      ctx.fillStyle = "#1a0030";
      ctx.fillRect(0, 0, 400, 400);
      ctx.strokeStyle = "#ff00ff33";
      ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(200, 400); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#00ffff";
      ctx.fillRect(10, playerY.current, 15, 80);
      ctx.fillStyle = "#ff00ff";
      ctx.fillRect(375, aiY.current, 15, 80);
      ctx.beginPath();
      ctx.arc(b.x, b.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#ffff00";
      ctx.fill();
      ctx.shadowBlur = 20; ctx.shadowColor = "#ffff00";
      ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "bold 24px monospace";
      ctx.fillText(score.toString(), 100, 40);

      animationRef.current = requestAnimationFrame(gameLoop);
    };
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => { canvas.removeEventListener("mousemove", handleMouseMove); cancelAnimationFrame(animationRef.current!); };
  }, [gameOver, score, onGameEnd, onScoreUpdate, resetBall]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-cyan-400 font-bold text-xl">Score: {score}</div>
      <canvas ref={canvasRef} width={400} height={400} className="border-2 border-purple-500 rounded-lg" style={{ cursor: "none" }} />
      {gameOver && (
        <div className="text-yellow-400 text-2xl font-bold animate-pulse">YOU WIN! 🏆</div>
      )}
      <p className="text-gray-400 text-sm">Move mouse to control paddle</p>
    </div>
  );
}
