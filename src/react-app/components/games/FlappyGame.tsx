import { useState, useEffect, useCallback, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface FlappyGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;
const BIRD_SIZE = 24;
const PIPE_WIDTH = 50;
const PIPE_GAP = 140;
const GRAVITY = 0.4;
const JUMP_FORCE = -7;
const PIPE_SPEED = 2.5;

export default function FlappyGame({ onGameEnd, onScoreUpdate }: FlappyGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const sounds = useGameSounds();
  
  const gameStateRef = useRef({
    birdY: CANVAS_HEIGHT / 2,
    birdVelocity: 0,
    pipes: [] as { x: number; topHeight: number; scored: boolean }[],
    score: 0,
    running: false,
    frameCount: 0,
  });

  const spawnPipe = () => {
    const minHeight = 60;
    const maxHeight = CANVAS_HEIGHT - PIPE_GAP - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    gameStateRef.current.pipes.push({
      x: CANVAS_WIDTH + 50,
      topHeight,
      scored: false,
    });
  };

  const resetGame = () => {
    const state = gameStateRef.current;
    state.birdY = CANVAS_HEIGHT / 2;
    state.birdVelocity = 0;
    state.pipes = [];
    state.score = 0;
    state.frameCount = 0;
    setScore(0);
    setGameOver(false);
  };

  const jump = useCallback(() => {
    if (gameOver) return;
    
    if (!gameStarted) {
      setGameStarted(true);
      gameStateRef.current.running = true;
      return;
    }
    
    gameStateRef.current.birdVelocity = JUMP_FORCE;
    sounds.playJump();
  }, [gameStarted, gameOver]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;
    if (!state.running) return;

    state.frameCount++;

    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(0.5, "#1e1b4b");
    gradient.addColorStop(1, "#312e81");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 30; i++) {
      const x = (i * 47 + state.frameCount * 0.2) % CANVAS_WIDTH;
      const y = (i * 31) % (CANVAS_HEIGHT * 0.6);
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spawn pipes
    if (state.frameCount % 100 === 0) {
      spawnPipe();
    }

    // Update bird
    state.birdVelocity += GRAVITY;
    state.birdY += state.birdVelocity;

    // Check bounds
    if (state.birdY < 0 || state.birdY > CANVAS_HEIGHT - BIRD_SIZE) {
      state.running = false;
      setGameOver(true);
      sounds.playGameOver();
      if (state.score > highScore) setHighScore(state.score);
      onGameEnd(state.score);
      return;
    }

    // Update and draw pipes
    state.pipes = state.pipes.filter(pipe => pipe.x > -PIPE_WIDTH);
    
    for (const pipe of state.pipes) {
      pipe.x -= PIPE_SPEED;

      // Draw pipes with neon glow
      ctx.fillStyle = "#22c55e";
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 15;
      
      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.topHeight - PIPE_GAP);
      
      ctx.shadowBlur = 0;

      // Pipe caps
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(pipe.x - 3, pipe.topHeight - 15, PIPE_WIDTH + 6, 15);
      ctx.fillRect(pipe.x - 3, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 6, 15);

      // Check collision
      const birdLeft = CANVAS_WIDTH / 4;
      const birdRight = birdLeft + BIRD_SIZE;
      const birdTop = state.birdY;
      const birdBottom = state.birdY + BIRD_SIZE;

      if (
        birdRight > pipe.x &&
        birdLeft < pipe.x + PIPE_WIDTH
      ) {
        if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
          state.running = false;
          setGameOver(true);
          sounds.playGameOver();
          if (state.score > highScore) setHighScore(state.score);
          onGameEnd(state.score);
          return;
        }
      }

      // Score
      if (!pipe.scored && pipe.x + PIPE_WIDTH < CANVAS_WIDTH / 4) {
        pipe.scored = true;
        state.score++;
        setScore(state.score);
        onScoreUpdate(state.score * 10);
        sounds.playScore();
      }
    }

    // Draw bird
    const birdX = CANVAS_WIDTH / 4;
    const rotation = Math.min(Math.max(state.birdVelocity * 3, -30), 90);
    
    ctx.save();
    ctx.translate(birdX + BIRD_SIZE / 2, state.birdY + BIRD_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Bird body
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(7, -4, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(18, 3);
    ctx.lineTo(10, 6);
    ctx.closePath();
    ctx.fill();
    
    // Wing
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.ellipse(-4, 2 + Math.sin(state.frameCount * 0.3) * 3, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    // Draw ground
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
    ctx.fillStyle = "#15803d";
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      ctx.fillRect(i, CANVAS_HEIGHT - 20, 10, 5);
    }

    requestAnimationFrame(gameLoop);
  }, [onGameEnd, onScoreUpdate, highScore]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameStateRef.current.running = true;
      requestAnimationFrame(gameLoop);
    }
  }, [gameStarted, gameOver, gameLoop]);

  const handleClick = () => jump();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === " " || e.key === "ArrowUp") {
      e.preventDefault();
      jump();
    }
  }, [jump]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const restart = () => {
    resetGame();
    setGameStarted(true);
    gameStateRef.current.running = true;
    requestAnimationFrame(gameLoop);
  };

  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(0.5, "#1e1b4b");
    gradient.addColorStop(1, "#312e81");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw bird
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-2">
      {/* Stats */}
      <div className="flex gap-6 mb-2">
        <div className="text-center">
          <div className="text-yellow-400 text-xs font-mono">SCORE</div>
          <div className="text-2xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
            {score}
          </div>
        </div>
        <div className="text-center">
          <div className="text-yellow-400 text-xs font-mono">BEST</div>
          <div className="text-2xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
            {highScore}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleClick}
          className="rounded-lg border-2 border-yellow-500/30 cursor-pointer"
          style={{ boxShadow: "0 0 30px rgba(251, 191, 36, 0.2)" }}
        />

        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
            <div className="text-2xl font-bold text-yellow-400 mb-4" style={{ fontFamily: "'VT323', monospace" }}>
              PIXEL BIRD
            </div>
            <div className="text-4xl mb-4">🐤</div>
            <button
              onClick={() => { setGameStarted(true); }}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded transition-colors"
            >
              TAP TO FLY
            </button>
            <div className="mt-4 text-gray-400 text-xs">Click or press SPACE</div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
            <div className="text-2xl font-bold text-red-400 mb-2" style={{ fontFamily: "'VT323', monospace" }}>
              GAME OVER
            </div>
            <div className="text-lg text-yellow-400 mb-1">Score: {score}</div>
            {score >= highScore && score > 0 && (
              <div className="text-sm text-green-400 mb-2">🎉 New High Score!</div>
            )}
            <button
              onClick={restart}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 text-gray-500 text-xs text-center">
        Click or SPACE to flap wings
      </div>
    </div>
  );
}
