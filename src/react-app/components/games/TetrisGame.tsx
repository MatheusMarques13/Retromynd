import { useState, useEffect, useCallback, useRef } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface TetrisGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 16;

const PIECES = {
  I: { shape: [[1, 1, 1, 1]], color: "#06b6d4" },
  O: { shape: [[1, 1], [1, 1]], color: "#eab308" },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: "#a855f7" },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: "#22c55e" },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: "#ef4444" },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: "#3b82f6" },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: "#f97316" },
};

type PieceType = keyof typeof PIECES;
type Board = (string | null)[][];

interface Piece {
  type: PieceType;
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

export default function TetrisGame({ onGameEnd, onScoreUpdate }: TetrisGameProps) {
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<PieceType>("I");
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const gameLoopRef = useRef<number | null>(null);
  const sounds = useGameSounds();

  function createEmptyBoard(): Board {
    return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
  }

  function getRandomPiece(): PieceType {
    const types = Object.keys(PIECES) as PieceType[];
    return types[Math.floor(Math.random() * types.length)];
  }

  function createPiece(type: PieceType): Piece {
    const p = PIECES[type];
    return {
      type,
      shape: p.shape.map(row => [...row]),
      x: Math.floor((BOARD_WIDTH - p.shape[0].length) / 2),
      y: 0,
      color: p.color,
    };
  }

  function spawnPiece() {
    const piece = createPiece(nextPiece);
    setNextPiece(getRandomPiece());
    
    if (checkCollision(piece, board)) {
      setGameOver(true);
      sounds.playGameOver();
      onGameEnd(score);
      return;
    }
    
    setCurrentPiece(piece);
  }

  function checkCollision(piece: Piece, b: Board): boolean {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x;
          const newY = piece.y + y;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true;
          if (newY >= 0 && b[newY][newX]) return true;
        }
      }
    }
    return false;
  }

  function rotatePiece(piece: Piece): Piece {
    const newShape = piece.shape[0].map((_, i) => 
      piece.shape.map(row => row[i]).reverse()
    );
    return { ...piece, shape: newShape };
  }

  function mergePiece(piece: Piece, b: Board): Board {
    const newBoard = b.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] && piece.y + y >= 0) {
          newBoard[piece.y + y][piece.x + x] = piece.color;
        }
      }
    }
    return newBoard;
  }

  function clearLines(b: Board): { newBoard: Board; linesCleared: number } {
    const newBoard = b.filter(row => row.some(cell => !cell));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    return { newBoard, linesCleared };
  }

  const moveDown = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    const newPiece = { ...currentPiece, y: currentPiece.y + 1 };
    
    if (checkCollision(newPiece, board)) {
      const newBoard = mergePiece(currentPiece, board);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      
      if (linesCleared > 0) {
        const lineScores = [0, 100, 300, 500, 800];
        const newScore = score + (lineScores[linesCleared] || 0) * level;
        const newLines = lines + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        
        setScore(newScore);
        setLines(newLines);
        setLevel(newLevel);
        onScoreUpdate(newScore);
        sounds.playMerge();
        if (linesCleared >= 4) sounds.playPowerUp();
      } else {
        sounds.playDrop();
      }
      
      setBoard(clearedBoard);
      setCurrentPiece(null);
    } else {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, board, score, lines, level, gameOver, isPaused, onScoreUpdate]);

  useEffect(() => {
    if (!currentPiece && gameStarted && !gameOver) {
      spawnPiece();
    }
  }, [currentPiece, gameStarted, gameOver]);

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      const speed = Math.max(100, 500 - (level - 1) * 50);
      gameLoopRef.current = window.setInterval(moveDown, speed);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveDown, gameStarted, gameOver, isPaused, level]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameStarted && e.key === " ") {
      e.preventDefault();
      setGameStarted(true);
      return;
    }

    if (e.key === " " && gameStarted) {
      e.preventDefault();
      setIsPaused(p => !p);
      return;
    }

    if (!currentPiece || gameOver || isPaused) return;

    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A": {
        e.preventDefault();
        const newPiece = { ...currentPiece, x: currentPiece.x - 1 };
        if (!checkCollision(newPiece, board)) setCurrentPiece(newPiece);
        break;
      }
      case "ArrowRight":
      case "d":
      case "D": {
        e.preventDefault();
        const newPiece = { ...currentPiece, x: currentPiece.x + 1 };
        if (!checkCollision(newPiece, board)) setCurrentPiece(newPiece);
        break;
      }
      case "ArrowDown":
      case "s":
      case "S": {
        e.preventDefault();
        moveDown();
        break;
      }
      case "ArrowUp":
      case "w":
      case "W": {
        e.preventDefault();
        const rotated = rotatePiece(currentPiece);
        if (!checkCollision(rotated, board)) setCurrentPiece(rotated);
        break;
      }
    }
  }, [currentPiece, board, gameOver, isPaused, gameStarted, moveDown]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function restart() {
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setNextPiece(getRandomPiece());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
  }

  const renderBoard = () => {
    const display = board.map(row => [...row]);
    
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] && currentPiece.y + y >= 0) {
            display[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
          }
        }
      }
    }
    
    return display;
  };

  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-2">
      <div className="flex gap-4">
        {/* Game Board */}
        <div className="relative">
          <div 
            className="bg-black/60 rounded-lg border-2 border-cyan-500/30 p-1"
            style={{ boxShadow: "0 0 30px rgba(6, 182, 212, 0.2)" }}
          >
            <div 
              className="grid gap-px"
              style={{ 
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px)`,
              }}
            >
              {renderBoard().map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${y}-${x}`}
                    className="rounded-sm"
                    style={{
                      backgroundColor: cell || "rgba(255,255,255,0.05)",
                      boxShadow: cell ? `0 0 5px ${cell}` : "none",
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Start Screen */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <div className="text-2xl font-bold text-cyan-400 mb-4" style={{ fontFamily: "'VT323', monospace" }}>
                NEON BLOCKS
              </div>
              <button
                onClick={() => setGameStarted(true)}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded transition-colors"
              >
                START
              </button>
            </div>
          )}

          {isPaused && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'VT323', monospace" }}>
                PAUSED
              </div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <div className="text-2xl font-bold text-red-400 mb-2" style={{ fontFamily: "'VT323', monospace" }}>
                GAME OVER
              </div>
              <div className="text-lg text-cyan-400 mb-4">Score: {score}</div>
              <button
                onClick={restart}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Stats Panel */}
        <div className="flex flex-col gap-3">
          <div className="bg-black/60 rounded-lg border border-cyan-500/30 p-3 text-center">
            <div className="text-cyan-400 text-xs font-mono mb-1">SCORE</div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
              {score}
            </div>
          </div>
          <div className="bg-black/60 rounded-lg border border-cyan-500/30 p-3 text-center">
            <div className="text-cyan-400 text-xs font-mono mb-1">LINES</div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
              {lines}
            </div>
          </div>
          <div className="bg-black/60 rounded-lg border border-cyan-500/30 p-3 text-center">
            <div className="text-cyan-400 text-xs font-mono mb-1">LEVEL</div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: "'VT323', monospace" }}>
              {level}
            </div>
          </div>
          <div className="bg-black/60 rounded-lg border border-cyan-500/30 p-3 text-center">
            <div className="text-cyan-400 text-xs font-mono mb-1">NEXT</div>
            <div className="flex justify-center mt-1">
              {PIECES[nextPiece].shape.map((row, y) => (
                <div key={y} className="flex">
                  {row.map((cell, x) => (
                    <div
                      key={x}
                      className="w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor: cell ? PIECES[nextPiece].color : "transparent",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
