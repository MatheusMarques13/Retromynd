import { useState, useCallback } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface Connect4GameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function Connect4Game({ onGameEnd, onScoreUpdate }: Connect4GameProps) {
  const [board, setBoard] = useState<number[][]>(Array(6).fill(null).map(() => Array(7).fill(0)));
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const sounds = useGameSounds();

  const checkWin = useCallback((b: number[][], row: number, col: number, player: number) => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    
    for (const [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i, c = col + dc * i;
        if (r >= 0 && r < 6 && c >= 0 && c < 7 && b[r][c] === player) count++;
        else break;
      }
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i, c = col - dc * i;
        if (r >= 0 && r < 6 && c >= 0 && c < 7 && b[r][c] === player) count++;
        else break;
      }
      if (count >= 4) return true;
    }
    return false;
  }, []);

  const getAvailableRow = (b: number[][], col: number) => {
    for (let row = 5; row >= 0; row--) {
      if (b[row][col] === 0) return row;
    }
    return -1;
  };

  const aiMove = useCallback((b: number[][]) => {
    for (let col = 0; col < 7; col++) {
      const row = getAvailableRow(b, col);
      if (row !== -1) {
        b[row][col] = 2;
        if (checkWin(b, row, col, 2)) { b[row][col] = 0; return col; }
        b[row][col] = 0;
      }
    }
    for (let col = 0; col < 7; col++) {
      const row = getAvailableRow(b, col);
      if (row !== -1) {
        b[row][col] = 1;
        if (checkWin(b, row, col, 1)) { b[row][col] = 0; return col; }
        b[row][col] = 0;
      }
    }
    const center = getAvailableRow(b, 3);
    if (center !== -1) return 3;
    const available = [];
    for (let col = 0; col < 7; col++) {
      if (getAvailableRow(b, col) !== -1) available.push(col);
    }
    return available[Math.floor(Math.random() * available.length)];
  }, [checkWin]);

  const dropPiece = (col: number) => {
    if (gameOver || currentPlayer !== 1) return;
    
    const row = getAvailableRow(board, col);
    if (row === -1) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = 1;
    setBoard(newBoard);
    sounds.playDrop();

    if (checkWin(newBoard, row, col, 1)) {
      setWinner(1);
      setGameOver(true);
      const newScore = score + 100;
      setScore(newScore);
      onScoreUpdate(newScore);
      sounds.playWin();
      return;
    }

    if (newBoard.every(r => r.every(c => c !== 0))) {
      setGameOver(true);
      return;
    }

    setCurrentPlayer(2);
    setTimeout(() => {
      const aiCol = aiMove(newBoard);
      const aiRow = getAvailableRow(newBoard, aiCol);
      if (aiRow !== -1) {
        newBoard[aiRow][aiCol] = 2;
        setBoard([...newBoard.map(r => [...r])]);

        if (checkWin(newBoard, aiRow, aiCol, 2)) {
          setWinner(2);
          setGameOver(true);
          sounds.playGameOver();
          onGameEnd(score);
        } else {
          setCurrentPlayer(1);
        }
      }
    }, 500);
  };

  const resetGame = () => {
    setBoard(Array(6).fill(null).map(() => Array(7).fill(0)));
    setCurrentPlayer(1);
    setGameOver(false);
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-cyan-400 font-bold text-xl">Score: {score}</div>
      
      <div className="bg-blue-800 p-3 rounded-xl">
        {board.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((cell, ci) => (
              <button
                key={ci}
                onClick={() => dropPiece(ci)}
                className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center"
              >
                {cell !== 0 && (
                  <div
                    className={`w-10 h-10 rounded-full ${cell === 1 ? "bg-yellow-400" : "bg-red-500"}`}
                    style={{ boxShadow: `0 0 15px ${cell === 1 ? "#facc15" : "#ef4444"}` }}
                  />
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {!gameOver && (
        <div className={`text-lg ${currentPlayer === 1 ? "text-yellow-400" : "text-red-400"}`}>
          {currentPlayer === 1 ? "Your turn" : "AI thinking..."}
        </div>
      )}

      {gameOver && (
        <>
          <div className="text-2xl font-bold">
            {winner === 1 ? (
              <span className="text-yellow-400">You Win! 🎉</span>
            ) : winner === 2 ? (
              <span className="text-red-400">AI Wins! 🤖</span>
            ) : (
              <span className="text-gray-400">Draw!</span>
            )}
          </div>
          <button onClick={resetGame} className="px-6 py-2 bg-purple-600 rounded-lg text-white font-bold hover:bg-purple-500">
            Play Again
          </button>
        </>
      )}
    </div>
  );
}
