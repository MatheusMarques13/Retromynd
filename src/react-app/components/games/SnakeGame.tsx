import { useState, useEffect, useCallback, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface SnakeGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

type Position = { x: number; y: number };
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

const GRID_SIZE = 20;
const CELL_SIZE = 16;
const INITIAL_SPEED = 150;

export default function SnakeGame({ onGameEnd, onScoreUpdate }: SnakeGameProps) {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const directionRef = useRef(direction);
  const gameLoopRef = useRef<number | null>(null);
  const sounds = useGameSounds();

  const generateFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakeBody.some(s => s.x === newFood.x && s.y === newFood.y));
    return newFood;
  }, []);

  const checkCollision = (head: Position, body: Position[]): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    return body.slice(1).some(s => s.x === head.x && s.y === head.y);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead: Position = { ...head };

      switch (directionRef.current) {
        case "UP": newHead.y -= 1; break;
        case "DOWN": newHead.y += 1; break;
        case "LEFT": newHead.x -= 1; break;
        case "RIGHT": newHead.x += 1; break;
      }

      if (checkCollision(newHead, prevSnake)) {
        setGameOver(true);
        sounds.playGameOver();
        onGameEnd(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        onScoreUpdate(newScore);
        setFood(generateFood(newSnake));
        sounds.playCollect();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, gameOver, isPaused, gameStarted, score, onGameEnd, onScoreUpdate, generateFood]);

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      const speed = Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 10);
      gameLoopRef.current = window.setInterval(moveSnake, speed);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, gameStarted, gameOver, isPaused, score]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameStarted && e.key === " ") {
      e.preventDefault();
      setGameStarted(true);
      return;
    }

    if (e.key === " ") {
      e.preventDefault();
      setIsPaused(p => !p);
      return;
    }

    const keyMap: Record<string, Direction> = {
      ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
      w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT",
      W: "UP", S: "DOWN", A: "LEFT", D: "RIGHT",
    };

    const newDir = keyMap[e.key];
    if (newDir) {
      e.preventDefault();
      const opposites: Record<Direction, Direction> = {
        UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT"
      };
      if (opposites[newDir] !== directionRef.current) {
        setDirection(newDir);
      }
    }
  }, [gameStarted]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const restart = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood([{ x: 10, y: 10 }]));
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-green-900/20 to-emerald-900/20 p-4">
      {/* Score */}
      <div className="mb-3 text-center">
        <div className="text-green-400 text-sm font-mono mb-1">SCORE</div>
        <div className="text-3xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
          {score}
        </div>
      </div>

      {/* Game Board */}
      <div className="relative">
        <div 
          className="relative bg-black/60 rounded-lg border-2 border-green-500/30"
          style={{ 
            width: GRID_SIZE * CELL_SIZE, 
            height: GRID_SIZE * CELL_SIZE,
            boxShadow: "0 0 30px rgba(34, 197, 94, 0.2)"
          }}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(GRID_SIZE)].map((_, i) => (
              <div key={`v-${i}`} className="absolute h-full w-px bg-green-500" style={{ left: i * CELL_SIZE }} />
            ))}
            {[...Array(GRID_SIZE)].map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full h-px bg-green-500" style={{ top: i * CELL_SIZE }} />
            ))}
          </div>

          {/* Snake */}
          {snake.map((segment, index) => (
            <div
              key={index}
              className="absolute rounded-sm transition-all duration-75"
              style={{
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                width: CELL_SIZE - 1,
                height: CELL_SIZE - 1,
                backgroundColor: index === 0 ? "#22c55e" : "#4ade80",
                boxShadow: index === 0 ? "0 0 10px #22c55e" : "none",
              }}
            />
          ))}

          {/* Food */}
          <div
            className="absolute rounded-full animate-pulse"
            style={{
              left: food.x * CELL_SIZE + 2,
              top: food.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              backgroundColor: "#ef4444",
              boxShadow: "0 0 15px #ef4444",
            }}
          />

          {/* Start Screen */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <div className="text-2xl font-bold text-green-400 mb-4" style={{ fontFamily: "'VT323', monospace" }}>
                CYBER SNAKE
              </div>
              <button
                onClick={() => setGameStarted(true)}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded transition-colors"
              >
                START
              </button>
              <div className="mt-4 text-gray-500 text-xs">Press SPACE or click to start</div>
            </div>
          )}

          {/* Pause Overlay */}
          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <div className="text-2xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'VT323', monospace" }}>
                PAUSED
              </div>
              <div className="text-gray-500 text-xs">Press SPACE to continue</div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <div className="text-2xl font-bold text-red-400 mb-2" style={{ fontFamily: "'VT323', monospace" }}>
                GAME OVER
              </div>
              <div className="text-lg text-green-400 mb-4">Score: {score}</div>
              <button
                onClick={restart}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls hint */}
      <div className="mt-4 text-gray-500 text-xs text-center">
        Arrow keys or WASD to move • SPACE to pause
      </div>
    </div>
  );
}
