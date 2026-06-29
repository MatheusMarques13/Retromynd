import { useState, useCallback, useEffect } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface ReversiGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

type Cell = 0 | 1 | 2; // 0=empty, 1=black, 2=white
type Board = Cell[][];

export default function ReversiGame({ onGameEnd, onScoreUpdate }: ReversiGameProps) {
  const [board, setBoard] = useState<Board>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState({ black: 2, white: 2 });
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [message, setMessage] = useState("");
  const sounds = useGameSounds();

  const DIRECTIONS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  const initGame = useCallback(() => {
    const newBoard: Board = Array(8).fill(null).map(() => Array(8).fill(0));
    newBoard[3][3] = 2; newBoard[3][4] = 1;
    newBoard[4][3] = 1; newBoard[4][4] = 2;
    setBoard(newBoard);
    setCurrentPlayer(1);
    setGameOver(false);
    setScores({ black: 2, white: 2 });
    setMessage("");
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const getFlips = useCallback((b: Board, row: number, col: number, player: Cell): [number, number][] => {
    if (b[row][col] !== 0) return [];
    const opponent = player === 1 ? 2 : 1;
    const allFlips: [number, number][] = [];

    for (const [dr, dc] of DIRECTIONS) {
      const flips: [number, number][] = [];
      let r = row + dr, c = col + dc;

      while (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r][c] === opponent) {
        flips.push([r, c]);
        r += dr; c += dc;
      }

      if (flips.length > 0 && r >= 0 && r < 8 && c >= 0 && c < 8 && b[r][c] === player) {
        allFlips.push(...flips);
      }
    }
    return allFlips;
  }, []);

  const getValidMoves = useCallback((b: Board, player: Cell): [number, number][] => {
    const moves: [number, number][] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (getFlips(b, r, c, player).length > 0) {
          moves.push([r, c]);
        }
      }
    }
    return moves;
  }, [getFlips]);

  useEffect(() => {
    if (board.length > 0) {
      setValidMoves(getValidMoves(board, currentPlayer));
    }
  }, [board, currentPlayer, getValidMoves]);

  const countPieces = (b: Board) => {
    let black = 0, white = 0;
    for (const row of b) {
      for (const cell of row) {
        if (cell === 1) black++;
        if (cell === 2) white++;
      }
    }
    return { black, white };
  };

  const makeMove = (row: number, col: number) => {
    if (gameOver || currentPlayer !== 1) return;
    
    const flips = getFlips(board, row, col, 1);
    if (flips.length === 0) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = 1;
    flips.forEach(([r, c]) => { newBoard[r][c] = 1; });
    setBoard(newBoard);
    sounds.playClick();

    const newScores = countPieces(newBoard);
    setScores(newScores);
    onScoreUpdate(newScores.black * 10);

    setTimeout(() => aiMove(newBoard), 500);
  };

  const aiMove = (currentBoard: Board) => {
    const moves = getValidMoves(currentBoard, 2);
    
    if (moves.length === 0) {
      const playerMoves = getValidMoves(currentBoard, 1);
      if (playerMoves.length === 0) {
        endGame(currentBoard);
      } else {
        setCurrentPlayer(1);
        setMessage("AI has no moves. Your turn again!");
      }
      return;
    }

    // Simple AI: prefer corners, then edges, then most flips
    const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
    const cornerMove = moves.find(([r, c]) => corners.some(([cr, cc]) => cr === r && cc === c));
    
    let bestMove = cornerMove || moves[0];
    if (!cornerMove) {
      let maxFlips = 0;
      for (const [r, c] of moves) {
        const flips = getFlips(currentBoard, r, c, 2).length;
        if (flips > maxFlips) {
          maxFlips = flips;
          bestMove = [r, c];
        }
      }
    }

    const [row, col] = bestMove;
    const flips = getFlips(currentBoard, row, col, 2);
    const newBoard = currentBoard.map(r => [...r]);
    newBoard[row][col] = 2;
    flips.forEach(([r, c]) => { newBoard[r][c] = 2; });
    setBoard(newBoard);

    const newScores = countPieces(newBoard);
    setScores(newScores);

    const playerMoves = getValidMoves(newBoard, 1);
    if (playerMoves.length === 0) {
      const aiMoves = getValidMoves(newBoard, 2);
      if (aiMoves.length === 0) {
        endGame(newBoard);
      } else {
        setMessage("You have no moves. AI plays again...");
        setTimeout(() => aiMove(newBoard), 500);
      }
    } else {
      setCurrentPlayer(1);
      setMessage("");
    }
  };

  const endGame = (finalBoard: Board) => {
    const final = countPieces(finalBoard);
    setScores(final);
    setGameOver(true);
    
    if (final.black > final.white) {
      setMessage(`You win! ${final.black}-${final.white}`);
      sounds.playWin();
      onGameEnd(final.black * 10 + 100);
    } else if (final.white > final.black) {
      setMessage(`AI wins! ${final.white}-${final.black}`);
      sounds.playGameOver();
      onGameEnd(final.black * 10);
    } else {
      setMessage("It's a tie!");
      sounds.playTick();
      onGameEnd(final.black * 10 + 50);
    }
  };

  const isValidMove = (row: number, col: number) => {
    return validMoves.some(([r, c]) => r === row && c === col);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-8 text-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-900 border-2 border-gray-600" />
          <span className="text-white">{scores.black}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-400" />
          <span className="text-white">{scores.white}</span>
        </div>
      </div>

      <div className="bg-green-700 p-1 rounded-lg">
        {board.map((row, ri) => (
          <div key={ri} className="flex">
            {row.map((cell, ci) => (
              <div
                key={ci}
                onClick={() => makeMove(ri, ci)}
                className={`w-10 h-10 border border-green-900 flex items-center justify-center cursor-pointer ${
                  isValidMove(ri, ci) ? "bg-green-500/50" : ""
                }`}
              >
                {cell !== 0 && (
                  <div
                    className={`w-8 h-8 rounded-full transition-all ${
                      cell === 1 ? "bg-gray-900" : "bg-white"
                    }`}
                    style={{ boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.3)" }}
                  />
                )}
                {cell === 0 && isValidMove(ri, ci) && (
                  <div className="w-3 h-3 rounded-full bg-gray-400/50" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {message && (
        <div className={`text-lg font-bold ${message.includes("win") ? "text-yellow-400" : "text-gray-300"}`}>
          {message}
        </div>
      )}

      {!gameOver && currentPlayer === 2 && (
        <div className="text-pink-400 animate-pulse">AI is thinking...</div>
      )}

      {gameOver && (
        <button onClick={initGame} className="px-6 py-2 bg-green-600 rounded-lg text-white font-bold hover:bg-green-500">
          Play Again
        </button>
      )}

      <p className="text-gray-400 text-sm">You are Black. Click highlighted squares to play.</p>
    </div>
  );
}
