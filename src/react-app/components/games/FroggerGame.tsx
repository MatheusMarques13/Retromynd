import { useState, useEffect, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface FroggerGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Vehicle { x: number; y: number; width: number; speed: number; color: string; }

export default function FroggerGame({ onGameEnd, onScoreUpdate }: FroggerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const frog = useRef({ x: 185, y: 360 });
  const vehicles = useRef<Vehicle[]>([]);
  const logs = useRef<{ x: number; y: number; width: number; speed: number }[]>([]);
  const sounds = useGameSounds();

  useEffect(() => {
    // Initialize vehicles
    vehicles.current = [
      { x: 0, y: 300, width: 60, speed: 2, color: "#ff0000" },
      { x: 150, y: 300, width: 60, speed: 2, color: "#ff0000" },
      { x: 300, y: 300, width: 60, speed: 2, color: "#ff0000" },
      { x: 50, y: 260, width: 80, speed: -3, color: "#0000ff" },
      { x: 250, y: 260, width: 80, speed: -3, color: "#0000ff" },
      { x: 0, y: 220, width: 50, speed: 4, color: "#ffff00" },
      { x: 200, y: 220, width: 50, speed: 4, color: "#ffff00" },
      { x: 100, y: 180, width: 70, speed: -2, color: "#00ff00" },
      { x: 300, y: 180, width: 70, speed: -2, color: "#00ff00" },
    ];
    // Initialize logs
    logs.current = [
      { x: 0, y: 100, width: 80, speed: 1.5 },
      { x: 200, y: 100, width: 80, speed: 1.5 },
      { x: 50, y: 60, width: 100, speed: -2 },
      { x: 250, y: 60, width: 100, speed: -2 },
    ];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKey = (e: KeyboardEvent) => {
      const f = frog.current;
      if (e.key === "ArrowUp") { f.y = Math.max(20, f.y - 40); sounds.playJump(); }
      if (e.key === "ArrowDown") { f.y = Math.min(360, f.y + 40); sounds.playJump(); }
      if (e.key === "ArrowLeft") { f.x = Math.max(0, f.x - 30); sounds.playJump(); }
      if (e.key === "ArrowRight") { f.x = Math.min(370, f.x + 30); sounds.playJump(); }
    };
    window.addEventListener("keydown", handleKey);

    let animationId: number;
    const gameLoop = () => {
      if (lives <= 0) { sounds.playGameOver(); onGameEnd(score); return; }
      const f = frog.current;

      // Move vehicles
      vehicles.current.forEach(v => {
        v.x += v.speed;
        if (v.x > 420) v.x = -v.width;
        if (v.x < -v.width) v.x = 420;
      });

      // Move logs
      logs.current.forEach(l => {
        l.x += l.speed;
        if (l.x > 420) l.x = -l.width;
        if (l.x < -l.width) l.x = 420;
      });

      // Check vehicle collision
      vehicles.current.forEach(v => {
        if (f.y >= v.y - 15 && f.y <= v.y + 25 && f.x + 25 > v.x && f.x < v.x + v.width) {
          setLives(l => l - 1);
          f.x = 185; f.y = 360;
          sounds.playHit();
        }
      });

      // Check water zone (y < 140)
      if (f.y < 140 && f.y > 20) {
        const onLog = logs.current.find(l => f.y >= l.y - 15 && f.y <= l.y + 25 && f.x + 25 > l.x && f.x < l.x + l.width);
        if (onLog) {
          f.x += onLog.speed;
          if (f.x < 0 || f.x > 370) { setLives(l => l - 1); f.x = 185; f.y = 360; sounds.playHit(); }
        } else {
          setLives(l => l - 1);
          f.x = 185; f.y = 360;
          sounds.playHit();
        }
      }

      // Win condition
      if (f.y <= 20) {
        setScore(s => { const n = s + 50; onScoreUpdate(n); return n; });
        f.x = 185; f.y = 360;
        sounds.playScore();
      }

      // Draw
      ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, 400, 400);
      
      // Draw zones
      ctx.fillStyle = "#228b22"; ctx.fillRect(0, 0, 400, 40); // Goal
      ctx.fillStyle = "#1e90ff"; ctx.fillRect(0, 40, 400, 100); // Water
      ctx.fillStyle = "#228b22"; ctx.fillRect(0, 140, 400, 30); // Safe zone
      ctx.fillStyle = "#333"; ctx.fillRect(0, 170, 400, 150); // Road
      ctx.fillStyle = "#228b22"; ctx.fillRect(0, 320, 400, 80); // Start

      // Draw road lines
      ctx.strokeStyle = "#fff"; ctx.setLineDash([20, 15]);
      for (let y = 200; y < 320; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(400, y); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw logs
      logs.current.forEach(l => {
        ctx.fillStyle = "#8b4513";
        ctx.fillRect(l.x, l.y, l.width, 30);
        ctx.strokeStyle = "#5c3317"; ctx.lineWidth = 2;
        ctx.strokeRect(l.x, l.y, l.width, 30);
      });

      // Draw vehicles
      vehicles.current.forEach(v => {
        ctx.fillStyle = v.color;
        ctx.fillRect(v.x, v.y, v.width, 25);
        ctx.fillStyle = "#fff";
        ctx.fillRect(v.x + 5, v.y + 5, 8, 8);
        ctx.fillRect(v.x + v.width - 13, v.y + 5, 8, 8);
      });

      // Draw frog
      ctx.fillStyle = "#32cd32";
      ctx.beginPath();
      ctx.ellipse(f.x + 15, f.y + 12, 15, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(f.x + 8, f.y + 5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(f.x + 22, f.y + 5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(f.x + 8, f.y + 5, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(f.x + 22, f.y + 5, 2, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
      ctx.fillText(`Score: ${score}  Lives: ${"🐸".repeat(Math.max(0, lives))}`, 10, 390);

      animationId = requestAnimationFrame(gameLoop);
    };
    animationId = requestAnimationFrame(gameLoop);
    return () => { window.removeEventListener("keydown", handleKey); cancelAnimationFrame(animationId); };
  }, [lives, score, onGameEnd, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={400} className="border-2 border-green-500 rounded-lg" />
      {lives <= 0 && <div className="text-red-400 text-2xl font-bold">GAME OVER</div>}
      <p className="text-gray-400 text-sm">Arrow keys to hop</p>
    </div>
  );
}
