import { useState, useEffect, useCallback, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface AsteroidsGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Asteroid { x: number; y: number; size: number; vx: number; vy: number; }
interface Bullet { x: number; y: number; vx: number; vy: number; }

export default function AsteroidsGame({ onGameEnd, onScoreUpdate }: AsteroidsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const ship = useRef({ x: 200, y: 200, angle: 0, vx: 0, vy: 0 });
  const asteroids = useRef<Asteroid[]>([]);
  const bullets = useRef<Bullet[]>([]);
  const keys = useRef<Set<string>>(new Set());
  const sounds = useGameSounds();

  const spawnAsteroid = useCallback(() => {
    const side = Math.floor(Math.random() * 4);
    const pos = { x: 0, y: 0 };
    if (side === 0) { pos.x = Math.random() * 400; pos.y = -30; }
    else if (side === 1) { pos.x = 430; pos.y = Math.random() * 400; }
    else if (side === 2) { pos.x = Math.random() * 400; pos.y = 430; }
    else { pos.x = -30; pos.y = Math.random() * 400; }
    asteroids.current.push({ ...pos, size: 25 + Math.random() * 20, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3 });
  }, []);

  useEffect(() => {
    for (let i = 0; i < 5; i++) spawnAsteroid();
    const interval = setInterval(spawnAsteroid, 2000);
    return () => clearInterval(interval);
  }, [spawnAsteroid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => { keys.current.add(e.key); e.preventDefault(); };
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animationId: number;
    const gameLoop = () => {
      if (lives <= 0) { sounds.playGameOver(); onGameEnd(score); return; }
      const s = ship.current;
      
      if (keys.current.has("ArrowLeft")) s.angle -= 0.1;
      if (keys.current.has("ArrowRight")) s.angle += 0.1;
      if (keys.current.has("ArrowUp")) { s.vx += Math.cos(s.angle) * 0.2; s.vy += Math.sin(s.angle) * 0.2; }
      if (keys.current.has(" ") && bullets.current.length < 5) {
        bullets.current.push({ x: s.x, y: s.y, vx: Math.cos(s.angle) * 8, vy: Math.sin(s.angle) * 8 });
        keys.current.delete(" ");
        sounds.playShoot();
      }
      
      s.x += s.vx; s.y += s.vy; s.vx *= 0.99; s.vy *= 0.99;
      if (s.x < 0) s.x = 400; if (s.x > 400) s.x = 0;
      if (s.y < 0) s.y = 400; if (s.y > 400) s.y = 0;

      bullets.current = bullets.current.filter(b => { b.x += b.vx; b.y += b.vy; return b.x > 0 && b.x < 400 && b.y > 0 && b.y < 400; });
      asteroids.current.forEach(a => { a.x += a.vx; a.y += a.vy; if (a.x < -50) a.x = 450; if (a.x > 450) a.x = -50; if (a.y < -50) a.y = 450; if (a.y > 450) a.y = -50; });

      // Collision detection
      asteroids.current = asteroids.current.filter(a => {
        const hitBullet = bullets.current.find(b => Math.hypot(b.x - a.x, b.y - a.y) < a.size);
        if (hitBullet) { bullets.current = bullets.current.filter(b => b !== hitBullet); setScore(sc => { const n = sc + 10; onScoreUpdate(n); return n; }); sounds.playExplosion(); return false; }
        if (Math.hypot(s.x - a.x, s.y - a.y) < a.size + 10) { setLives(l => l - 1); s.x = 200; s.y = 200; s.vx = 0; s.vy = 0; sounds.playHit(); return false; }
        return true;
      });

      // Draw
      ctx.fillStyle = "#0a0015"; ctx.fillRect(0, 0, 400, 400);
      for (let i = 0; i < 50; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`; ctx.fillRect(Math.random() * 400, Math.random() * 400, 1, 1); }
      
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle);
      ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, -8); ctx.lineTo(-10, 8); ctx.closePath();
      ctx.fillStyle = "#00ffff"; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.stroke();
      ctx.restore();

      asteroids.current.forEach(a => { ctx.beginPath(); ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2); ctx.strokeStyle = "#888"; ctx.lineWidth = 2; ctx.stroke(); });
      bullets.current.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fillStyle = "#ff0"; ctx.fill(); });
      
      ctx.fillStyle = "#fff"; ctx.font = "16px monospace"; ctx.fillText(`Score: ${score}  Lives: ${"❤️".repeat(lives)}`, 10, 25);
      animationId = requestAnimationFrame(gameLoop);
    };
    animationId = requestAnimationFrame(gameLoop);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); cancelAnimationFrame(animationId); };
  }, [lives, score, onGameEnd, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={400} className="border-2 border-cyan-500 rounded-lg" />
      {lives <= 0 && <div className="text-red-400 text-2xl font-bold">GAME OVER</div>}
      <p className="text-gray-400 text-sm">Arrow keys to move, Space to shoot</p>
    </div>
  );
}
