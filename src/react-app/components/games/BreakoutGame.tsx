import { useState, useEffect, useCallback, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface BreakoutGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 60;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 36;
const BRICK_HEIGHT = 15;
const BRICK_PADDING = 3;
const BRICK_OFFSET_TOP = 40;
const BRICK_OFFSET_LEFT = 8;

const BRICK_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4"];

export default function BreakoutGame({ onGameEnd, onScoreUpdate }: BreakoutGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const sounds = useGameSounds();
  
  const gameStateRef = useRef({
    paddleX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT - 50,
    ballDX: 3,
    ballDY: -3,
    bricks: [] as { x: number; y: number; color: string; alive: boolean }[][],
    score: 0,
    lives: 3,
    running: false,
  });

  const initBricks = () => {
    const bricks: { x: number; y: number; color: string; alive: boolean }[][] = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      bricks[r] = [];
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks[r][c] = {
          x: BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING),
          y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
          color: BRICK_COLORS[r],
          alive: true,
        };
      }
    }
    return bricks;
  };

  const resetBall = () => {
    const state = gameStateRef.current;
    state.ballX = CANVAS_WIDTH / 2;
    state.ballY = CANVAS_HEIGHT - 50;
    state.ballDX = 3 * (Math.random() > 0.5 ? 1 : -1);
    state.ballDY = -3;
  };

  const initGame = () => {
    const state = gameStateRef.current;
    state.paddleX = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
    state.bricks = initBricks();
    state.score = 0;
    state.lives = 3;
    resetBall();
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;
    if (!state.running) return;

    // Clear
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw bricks
    state.bricks.forEach(row => {
      row.forEach(brick => {
        if (brick.alive) {
          ctx.fillStyle = brick.color;
          ctx.shadowColor = brick.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
          ctx.shadowBlur = 0;
        }
      });
    });

    // Move ball
    state.ballX += state.ballDX;
    state.ballY += state.ballDY;

    // Wall collisions
    if (state.ballX - BALL_RADIUS < 0 || state.ballX + BALL_RADIUS > CANVAS_WIDTH) {
      state.ballDX = -state.ballDX;
    }
    if (state.ballY - BALL_RADIUS < 0) {
      state.ballDY = -state.ballDY;
    }

    // Paddle collision
    if (
      state.ballY + BALL_RADIUS > CANVAS_HEIGHT - PADDLE_HEIGHT - 10 &&
      state.ballX > state.paddleX &&
      state.ballX < state.paddleX + PADDLE_WIDTH
    ) {
      state.ballDY = -Math.abs(state.ballDY);
      // Add angle based on where ball hits paddle
      const hitPos = (state.ballX - state.paddleX) / PADDLE_WIDTH;
      state.ballDX = (hitPos - 0.5) * 6;
      sounds.playBounce();
    }

    // Bottom - lose life
    if (state.ballY + BALL_RADIUS > CANVAS_HEIGHT) {
      state.lives--;
      setLives(state.lives);
      sounds.playError();
      
      if (state.lives <= 0) {
        state.running = false;
        setGameOver(true);
        sounds.playGameOver();
        onGameEnd(state.score);
        return;
      }
      resetBall();
    }

    // Brick collisions
    let allBroken = true;
    state.bricks.forEach(row => {
      row.forEach(brick => {
        if (brick.alive) {
          allBroken = false;
          if (
            state.ballX > brick.x &&
            state.ballX < brick.x + BRICK_WIDTH &&
            state.ballY > brick.y &&
            state.ballY < brick.y + BRICK_HEIGHT
          ) {
            state.ballDY = -state.ballDY;
            brick.alive = false;
            state.score += 10;
            setScore(state.score);
            onScoreUpdate(state.score);
            sounds.playHit();
          }
        }
      });
    });

    if (allBroken) {
      state.running = false;
      setWon(true);
      setGameOver(true);
      sounds.playWin();
      onGameEnd(state.score + 500); // Bonus for winning
      return;
    }

    // Draw ball
    ctx.beginPath();
    ctx.arc(state.ballX, state.ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#ec4899";
    ctx.shadowColor = "#ec4899";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;

    // Draw paddle
    ctx.fillStyle = "#8b5cf6";
    ctx.shadowColor = "#8b5cf6";
    ctx.shadowBlur = 10;
    ctx.fillRect(state.paddleX, CANVAS_HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.shadowBlur = 0;

    requestAnimationFrame(gameLoop);
  }, [onGameEnd, onScoreUpdate]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameStateRef.current.running = true;
      requestAnimationFrame(gameLoop);
    }
  }, [gameStarted, gameOver, gameLoop]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    gameStateRef.current.paddleX = Math.max(0, Math.min(mouseX - PADDLE_WIDTH / 2, CANVAS_WIDTH - PADDLE_WIDTH));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameStarted && e.key === " ") {
      e.preventDefault();
      setGameStarted(true);
      return;
    }

    const state = gameStateRef.current;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      e.preventDefault();
      state.paddleX = Math.max(0, state.paddleX - 20);
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      e.preventDefault();
      state.paddleX = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, state.paddleX + 20);
    }
  }, [gameStarted]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const restart = () => {
    initGame();
    setGameStarted(true);
    gameStateRef.current.running = true;
    requestAnimationFrame(gameLoop);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-pink-900/20 to-rose-900/20 p-4">
      {/* Stats */}
      <div className="flex gap-6 mb-3">
        <div className="text-center">
          <div className="text-pink-400 text-xs font-mono">SCORE</div>
          <div className="text-xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
            {score}
          </div>
        </div>
        <div className="text-center">
          <div className="text-pink-400 text-xs font-mono">LIVES</div>
          <div className="text-xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
            {"❤️".repeat(lives)}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          className="rounded-lg border-2 border-pink-500/30"
          style={{ boxShadow: "0 0 30px rgba(236, 72, 153, 0.2)" }}
        />

        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
            <div className="text-2xl font-bold text-pink-400 mb-4" style={{ fontFamily: "'VT323', monospace" }}>
              BRICK BREAKER
            </div>
            <button
              onClick={() => setGameStarted(true)}
              className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded transition-colors"
            >
              START
            </button>
            <div className="mt-4 text-gray-500 text-xs">Mouse or Arrow Keys to move</div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
            <div 
              className={`text-2xl font-bold mb-2 ${won ? "text-green-400" : "text-red-400"}`}
              style={{ fontFamily: "'VT323', monospace" }}
            >
              {won ? "🎉 YOU WIN!" : "GAME OVER"}
            </div>
            <div className="text-lg text-pink-400 mb-4">Score: {score}</div>
            <button
              onClick={restart}
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 text-gray-500 text-xs text-center">
        Move mouse or use arrow keys to control paddle
      </div>
    </div>
  );
}
