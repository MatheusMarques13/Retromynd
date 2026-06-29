import { useState, useCallback } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface SudokuGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const PUZZLES = [
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
  "020030090000907000900208005004806500607000208003102900800605009000309000030080070",
];
const SOLUTIONS = [
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
  "425631897168957432973248615294876351657314298813592746742165983586793124139428576",
];

export default function SudokuGame({ onGameEnd, onScoreUpdate }: SudokuGameProps) {
  const [puzzleIndex] = useState(() => Math.floor(Math.random() * PUZZLES.length));
  const [grid, setGrid] = useState(() => PUZZLES[puzzleIndex].split("").map(c => parseInt(c)));
  const [selected, setSelected] = useState<number | null>(null);
  const [errors, setErrors] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const sounds = useGameSounds();

  const original = PUZZLES[puzzleIndex].split("").map(c => parseInt(c));
  const solution = SOLUTIONS[puzzleIndex].split("").map(c => parseInt(c));

  const handleInput = useCallback((num: number) => {
    if (selected === null || original[selected] !== 0 || won) return;
    
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[selected] = num;
      
      // Check if correct
      if (num === solution[selected]) {
        setErrors(e => { const n = new Set(e); n.delete(selected); return n; });
        const newScore = score + 10;
        setScore(newScore);
        onScoreUpdate(newScore);
        sounds.playSuccess();
        
        // Check win
        if (newGrid.every((v, i) => v === solution[i])) {
          setWon(true);
          sounds.playWin();
          onGameEnd(newScore + 100);
        }
      } else if (num !== 0) {
        setErrors(e => new Set(e).add(selected));
        sounds.playError();
      }
      
      return newGrid;
    });
  }, [selected, original, solution, score, won, onGameEnd, onScoreUpdate]);

  const getBoxIndex = (i: number) => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-cyan-400 font-bold text-xl">Score: {score}</div>
      <div className="grid grid-cols-9 gap-0 bg-gray-800 p-1 rounded-lg">
        {grid.map((value, i) => {
          const row = Math.floor(i / 9);
          const col = i % 9;
          const isSelected = selected === i;
          const isOriginal = original[i] !== 0;
          const isError = errors.has(i);
          const box = getBoxIndex(i);
          
          return (
            <button
              key={i}
              onClick={() => !won && setSelected(i)}
              className={`w-9 h-9 text-lg font-bold flex items-center justify-center transition-all
                ${isSelected ? "bg-purple-600 text-white" : ""}
                ${!isSelected && box % 2 === 0 ? "bg-gray-700" : !isSelected ? "bg-gray-600" : ""}
                ${isOriginal ? "text-gray-300" : isError ? "text-red-400" : "text-cyan-400"}
                ${col === 2 || col === 5 ? "border-r-2 border-gray-500" : ""}
                ${row === 2 || row === 5 ? "border-b-2 border-gray-500" : ""}
                hover:bg-purple-500/50
              `}
            >
              {value !== 0 ? value : ""}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleInput(num)}
            className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            {num}
          </button>
        ))}
      </div>
      <button
        onClick={() => handleInput(0)}
        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
      >
        Clear
      </button>
      {won && (
        <div className="text-green-400 text-2xl font-bold animate-pulse">
          PUZZLE COMPLETE! 🧩
        </div>
      )}
    </div>
  );
}
