import { useState, useEffect, useRef, useCallback } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface DinoGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Obstacle { x: number; type: "cactus" | "bird"; height: number; }

export default function DinoGame({ onGameEnd, onScoreUpdate }: DinoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const dino = useRef({ y: 280, vy: 0, ducking: false });
  const obstacles = useRef<Obstacle[]>([]);
  const speed = useRef(6);
  const sounds = useGameSounds();

  const jump = useCallback(() => {
    if (dino.current.y >= 280 && !dino.current.ducking) {
      dino.current.vy = -15;
      sounds.playJump();
    }
  }, [sounds]);

  const duck = useCallback((isDucking: boolean) => {
    if (dino.current.y >= 280) {
      dino.current.ducking = isDucking;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === " " || e.key === "ArrowUp") && !gameOver) {
        if (!gameStarted) setGameStarted(true);
        jump();
      }
      if (e.key === "ArrowDown") duck(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") duck(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let frame = 0;
    let animationId: number;
    const gameLoop = () => {
      if (gameOver) return;
      frame++;

      const d = dino.current;
      
      if (gameStarted) {
        // Physics
        d.vy += 0.8;
        d.y += d.vy;
        if (d.y > 280) { d.y = 280; d.vy = 0; }

        // Spawn obstacles
        if (frame % Math.max(60, 120 - Math.floor(score / 5)) === 0) {
          const type = Math.random() > 0.7 && score > 50 ? "bird" : "cactus";
          obstacles.current.push({
            x: 420,
            type,
            height: type === "bird" ? (Math.random() > 0.5 ? 260 : 230) : 280
          });
        }

        // Move obstacles
        obstacles.current = obstacles.current.filter(o => {
          o.x -= speed.current;
          return o.x > -50;
        });

        // Collision detection
        const dinoBox = d.ducking 
          ? { x: 50, y: d.y + 20, w: 40, h: 30 }
          : { x: 50, y: d.y, w: 30, h: 50 };

        for (const o of obstacles.current) {
          const obsBox = o.type === "cactus"
            ? { x: o.x, y: o.height - 40, w: 20, h: 40 }
            : { x: o.x, y: o.height, w: 30, h: 25 };

          if (dinoBox.x < obsBox.x + obsBox.w && dinoBox.x + dinoBox.w > obsBox.x &&
              dinoBox.y < obsBox.y + obsBox.h && dinoBox.y + dinoBox.h > obsBox.y) {
            setGameOver(true);
            sounds.playGameOver();
            onGameEnd(score);
            return;
          }
        }

        // Update score
        if (frame % 5 === 0) {
          setScore(s => { const n = s + 1; onScoreUpdate(n); return n; });
        }
        
        // Increase speed
        speed.current = 6 + Math.floor(score / 100);
      }

      // Draw
      ctx.fillStyle = "#f7f7f7";
      ctx.fillRect(0, 0, 400, 350);

      // Ground
      ctx.strokeStyle = "#535353";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 330);
      ctx.lineTo(400, 330);
      ctx.stroke();

      // Dino
      ctx.fillStyle = "#535353";
      if (d.ducking) {
        ctx.fillRect(50, d.y + 20, 45, 30);
        ctx.fillRect(90, d.y + 25, 10, 10);
      } else {
        ctx.fillRect(50, d.y, 30, 50);
        ctx.fillRect(75, d.y + 5, 15, 15);
        ctx.fillRect(50, d.y + 45, 10, 10);
        ctx.fillRect(70, d.y + 45, 10, 10);
      }
      // Eye
      ctx.fillStyle = "#fff";
      ctx.fillRect(d.ducking ? 88 : 80, d.y + (d.ducking ? 28 : 10), 5, 5);

      // Obstacles
      obstacles.current.forEach(o => {
        ctx.fillStyle = "#535353";
        if (o.type === "cactus") {
          ctx.fillRect(o.x, o.height - 40, 20, 40);
          ctx.fillRect(o.x - 8, o.height - 25, 8, 15);
          ctx.fillRect(o.x + 20, o.height - 30, 8, 15);
        } else {
          // Bird
          ctx.beginPath();
          ctx.moveTo(o.x, o.height + 12);
          ctx.lineTo(o.x + 15, o.height);
          ctx.lineTo(o.x + 30, o.height + 12);
          ctx.lineTo(o.x + 15, o.height + 25);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Score
      ctx.fillStyle = "#535353";
      ctx.font = "bold 20px monospace";
      ctx.fillText(score.toString().padStart(5, "0"), 320, 30);

      if (!gameStarted) {
        ctx.fillStyle = "#535353";
        ctx.font = "18px monospace";
        ctx.fillText("Press SPACE to start", 100, 180);
      }

      animationId = requestAnimationFrame(gameLoop);
    };
    animationId = requestAnimationFrame(gameLoop);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); cancelAnimationFrame(animationId); };
  }, [gameOver, gameStarted, score, jump, duck, onGameEnd, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={400} height={350} className="border-2 border-gray-400 rounded-lg" />
      {gameOver && (
        <div className="text-gray-600 text-2xl font-bold">GAME OVER - Score: {score}</div>
      )}
      <p className="text-gray-400 text-sm">Space/↑ to jump, ↓ to duck</p>
    </div>
  );
}
