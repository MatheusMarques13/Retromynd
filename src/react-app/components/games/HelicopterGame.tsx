import { useState, useEffect, useCallback, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface HelicopterGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function HelicopterGame({ onGameEnd, onScoreUpdate }: HelicopterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const heliY = useRef(200);
  const velocity = useRef(0);
  const obstacles = useRef<{ x: number; gapY: number; passed: boolean }[]>([]);
  const animationRef = useRef<number>(0);
  const pressing = useRef(false);
  const sounds = useGameSounds();

  const resetGame = useCallback(() => {
    heliY.current = 200;
    velocity.current = 0;
    obstacles.current = [];
    setScore(0);
    setGameOver(false);
    setStarted(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleDown = () => { pressing.current = true; if (!started) setStarted(true); };
    const handleUp = () => { pressing.current = false; };

    canvas.addEventListener("mousedown", handleDown);
    canvas.addEventListener("mouseup", handleUp);
    canvas.addEventListener("touchstart", handleDown);
    canvas.addEventListener("touchend", handleUp);

    const gameLoop = () => {
      if (gameOver) return;

      if (started) {
        velocity.current += pressing.current ? -0.5 : 0.3;
        heliY.current += velocity.current;
        
        if (Math.random() < 0.02) {
          obstacles.current.push({ x: 420, gapY: 100 + Math.random() * 200, passed: false });
        }
        
        obstacles.current = obstacles.current.filter(o => o.x > -50);
        obstacles.current.forEach(o => {
          o.x -= 3;
          if (!o.passed && o.x < 50) {
            o.passed = true;
            setScore(s => { const ns = s + 10; onScoreUpdate(ns); return ns; });
            sounds.playScore();
          }
        });
        
        if (heliY.current < 0 || heliY.current > 380) {
          setGameOver(true);
          sounds.playExplosion();
          onGameEnd(score);
        }
        
        obstacles.current.forEach(o => {
          if (o.x < 70 && o.x > 20) {
            if (heliY.current < o.gapY - 40 || heliY.current > o.gapY + 40) {
              setGameOver(true);
              sounds.playExplosion();
              onGameEnd(score);
            }
          }
        });
      }

      ctx.fillStyle = "#0a001a";
      ctx.fillRect(0, 0, 400, 400);
      
      ctx.strokeStyle = "#ff00ff22";
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 20);
        ctx.lineTo(400, i * 20);
        ctx.stroke();
      }
      
      obstacles.current.forEach(o => {
        ctx.fillStyle = "#00ffff";
        ctx.fillRect(o.x, 0, 30, o.gapY - 50);
        ctx.fillRect(o.x, o.gapY + 50, 30, 400 - o.gapY - 50);
      });
      
      ctx.fillStyle = "#ffff00";
      ctx.beginPath();
      ctx.moveTo(30, heliY.current);
      ctx.lineTo(60, heliY.current - 15);
      ctx.lineTo(60, heliY.current + 15);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ffff00";
      ctx.fill();
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      canvas.removeEventListener("mousedown", handleDown);
      canvas.removeEventListener("mouseup", handleUp);
      canvas.removeEventListener("touchstart", handleDown);
      canvas.removeEventListener("touchend", handleUp);
      cancelAnimationFrame(animationRef.current!);
    };
  }, [gameOver, started, score, onGameEnd, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-cyan-400 font-bold text-xl">Score: {score}</div>
      <canvas ref={canvasRef} width={400} height={400} className="border-2 border-purple-500 rounded-lg cursor-pointer" />
      {!started && !gameOver && (
        <div className="text-yellow-400 text-lg">Click/tap and hold to fly!</div>
      )}
      {gameOver && (
        <>
          <div className="text-red-400 text-2xl font-bold">CRASH! Score: {score}</div>
          <button onClick={resetGame} className="px-4 py-2 bg-pink-600 rounded-lg text-white hover:bg-pink-500">
            Try Again
          </button>
        </>
      )}
    </div>
  );
}
