import { useState, useCallback } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface TicTacToeGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function TicTacToeGame({ onGameEnd, onScoreUpdate }: TicTacToeGameProps) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState("");
  const [score, setScore] = useState(0);
  const [wins, setWins] = useState(0);
  const sounds = useGameSounds();

  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const checkWinner = useCallback((b: (string | null)[]) => {
    for (const pattern of winPatterns) {
      const [a, c, d] = pattern;
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    return b.every(cell => cell) ? "tie" : null;
  }, []);

  const minimax = useCallback((b: (string | null)[], isMax: boolean): number => {
    const winner = checkWinner(b);
    if (winner === "O") return 10;
    if (winner === "X") return -10;
    if (winner === "tie") return 0;

    const scores = [];
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = isMax ? "O" : "X";
        scores.push(minimax(b, !isMax));
        b[i] = null;
      }
    }
    return isMax ? Math.max(...scores) : Math.min(...scores);
  }, [checkWinner]);

  const aiMove = useCallback((b: (string | null)[]) => {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = "O";
        const score = minimax(b, false);
        b[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }, [minimax]);

  const handleClick = (index: number) => {
    if (board[index] || gameOver || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    sounds.playClick();

    const winner = checkWinner(newBoard);
    if (winner) {
      handleGameEnd(winner);
      return;
    }

    setIsPlayerTurn(false);
    setTimeout(() => {
      const aiIndex = aiMove([...newBoard]);
      if (aiIndex !== -1) {
        newBoard[aiIndex] = "O";
        setBoard([...newBoard]);
        
        const aiWinner = checkWinner(newBoard);
        if (aiWinner) {
          handleGameEnd(aiWinner);
        } else {
          setIsPlayerTurn(true);
        }
      }
    }, 500);
  };

  const handleGameEnd = (winner: string) => {
    setGameOver(true);
    if (winner === "X") {
      setResult("You Win! 🎉");
      const newWins = wins + 1;
      setWins(newWins);
      const newScore = score + 100;
      setScore(newScore);
      onScoreUpdate(newScore);
      sounds.playWin();
    } else if (winner === "O") {
      setResult("AI Wins! 🤖");
      sounds.playGameOver();
      onGameEnd(score);
    } else {
      setResult("It's a Tie! 🤝");
      const newScore = score + 25;
      setScore(newScore);
      onScoreUpdate(newScore);
      sounds.playTick();
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameOver(false);
    setResult("");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-8 text-lg">
        <span className="text-cyan-400">Score: {score}</span>
        <span className="text-green-400">Wins: {wins}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 p-4 bg-purple-900/30 rounded-xl">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={`w-20 h-20 rounded-lg text-4xl font-bold transition-all ${
              cell === "X" ? "bg-cyan-600 text-white" :
              cell === "O" ? "bg-pink-600 text-white" :
              "bg-gray-700 hover:bg-gray-600"
            }`}
            style={{ boxShadow: cell ? `0 0 20px ${cell === "X" ? "#0ff" : "#f0f"}` : "none" }}
          >
            {cell}
          </button>
        ))}
      </div>

      {!isPlayerTurn && !gameOver && (
        <div className="text-pink-400 animate-pulse">AI thinking...</div>
      )}

      {gameOver && (
        <>
          <div className="text-2xl font-bold text-yellow-400">{result}</div>
          <button onClick={resetGame} className="px-6 py-2 bg-purple-600 rounded-lg text-white font-bold hover:bg-purple-500">
            Play Again
          </button>
        </>
      )}

      <p className="text-gray-400 text-sm">You are X, AI is O</p>
    </div>
  );
}
