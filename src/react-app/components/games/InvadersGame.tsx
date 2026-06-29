import { useState, useEffect, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface InvadersGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function InvadersGame({ onGameEnd, onScoreUpdate }: InvadersGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const playerX = useRef(185);
  const bullets = useRef<{ x: number; y: number }[]>([]);
  const invaders = useRef<{ x: number; y: number; alive: boolean }[]>([]);
  const invaderBullets = useRef<{ x: number; y: number }[]>([]);
  const direction = useRef(1);
  const sounds = useGameSounds();

  useEffect(() => {
    const rows = 4, cols = 8;
    invaders.current = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        invaders.current.push({ x: 50 + c * 40, y: 40 + r * 35, alive: true });
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") playerX.current = Math.max(0, playerX.current - 20);
      if (e.key === "ArrowRight") playerX.current = Math.min(370, playerX.current + 20);
      if (e.key === " " && bullets.current.length < 3) { bullets.current.push({ x: playerX.current + 15, y: 360 }); sounds.playShoot(); }
    };
    window.addEventListener("keydown", handleKey);

    let frame = 0;
    let animationId: number;
    const gameLoop = () => {
      if (gameOver || lives <= 0) { if (lives <= 0) onGameEnd(score); return; }
      frame++;

      // Move invaders
      if (frame % 30 === 0) {
        let hitEdge = false;
        invaders.current.forEach(inv => { if (inv.alive) { inv.x += direction.current * 10; if (inv.x < 10 || inv.x > 360) hitEdge = true; } });
        if (hitEdge) { direction.current *= -1; invaders.current.forEach(inv => { if (inv.alive) inv.y += 15; }); }
      }

      // Invader shooting
      if (frame % 60 === 0) {
        const alive = invaders.current.filter(i => i.alive);
        if (alive.length > 0) {
          const shooter = alive[Math.floor(Math.random() * alive.length)];
          invaderBullets.current.push({ x: shooter.x + 12, y: shooter.y + 20 });
        }
      }

      // Move bullets
      bullets.current = bullets.current.filter(b => { b.y -= 8; return b.y > 0; });
      invaderBullets.current = invaderBullets.current.filter(b => { b.y += 5; return b.y < 400; });

      // Collision detection
      bullets.current.forEach(bullet => {
        invaders.current.forEach(inv => {
          if (inv.alive && Math.abs(bullet.x - inv.x - 12) < 15 && Math.abs(bullet.y - inv.y - 10) < 15) {
            inv.alive = false;
            bullet.y = -100;
            setScore(s => { const n = s + 10; onScoreUpdate(n); return n; });
            sounds.playExplosion();
          }
        });
      });

      invaderBullets.current.forEach(b => {
        if (Math.abs(b.x - playerX.current - 15) < 20 && b.y > 350) {
          setLives(l => l - 1);
          b.y = 500;
          sounds.playHit();
        }
      });

      // Check win/lose
      if (invaders.current.every(i => !i.alive)) { setGameOver(true); sounds.playWin(); onGameEnd(score + 100); }
      if (invaders.current.some(i => i.alive && i.y > 340)) { sounds.playGameOver(); setLives(0); }

      // Draw
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = "#0f0";
      ctx.fillRect(playerX.current, 365, 30, 15);
      ctx.beginPath(); ctx.moveTo(playerX.current + 15, 355); ctx.lineTo(playerX.current + 5, 365); ctx.lineTo(playerX.current + 25, 365); ctx.fill();

      invaders.current.forEach(inv => {
        if (inv.alive) {
          ctx.fillStyle = inv.y < 80 ? "#ff0" : inv.y < 120 ? "#0ff" : "#f0f";
          ctx.fillRect(inv.x, inv.y, 24, 20);
          ctx.fillStyle = "#000";
          ctx.fillRect(inv.x + 5, inv.y + 5, 4, 4);
          ctx.fillRect(inv.x + 15, inv.y + 5, 4, 4);
        }
      });

      bullets.current.forEach(b => { ctx.fillStyle = "#0f0"; ctx.fillRect(b.x - 2, b.y, 4, 10); });
      invaderBullets.current.forEach(b => { ctx.fillStyle = "#f00"; ctx.fillRect(b.x - 2, b.y, 4, 8); });

      ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
      ctx.fillText(`Score: ${score}  Lives: ${"❤️".repeat(Math.max(0, lives))}`, 10, 20);

      animationId = requestAnimationFrame(gameLoop);
    };
    animationId = requestAnimationFrame(gameLoop);
    return () => { window.removeEventListener("keydown", handleKey); cancelAnimationFrame(animationId); };
  }, [gameOver, lives, score, onGameEnd, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={400} className="border-2 border-green-500 rounded-lg" />
      {(gameOver || lives <= 0) && <div className={`text-2xl font-bold ${lives <= 0 ? "text-red-400" : "text-green-400"}`}>{lives <= 0 ? "GAME OVER" : "YOU WIN! 🎉"}</div>}
      <p className="text-gray-400 text-sm">← → to move, Space to shoot</p>
    </div>
  );
}
