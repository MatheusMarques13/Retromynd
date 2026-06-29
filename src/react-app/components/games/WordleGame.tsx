import { useState, useCallback, useEffect } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface WordleGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const WORDS = ["REACT", "GAMES", "PIXEL", "RETRO", "NEONS", "CYBER", "LOGIC", "BRAIN", "SMART", "QUICK", "POWER", "SPEED", "BLAST", "STORM", "FLASH"];

export default function WordleGame({ onGameEnd, onScoreUpdate }: WordleGameProps) {
  const [target] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const sounds = useGameSounds();

  const handleKey = useCallback((key: string) => {
    if (gameOver) return;
    
    if (key === "ENTER" && current.length === 5) {
      if (current === target) {
        setGuesses([...guesses, current]);
        setWon(true);
        setGameOver(true);
        sounds.playWin();
        onScoreUpdate((6 - guesses.length) * 20);
        onGameEnd((6 - guesses.length) * 20);
      } else if (guesses.length < 5) {
        setGuesses([...guesses, current]);
        setCurrent("");
        sounds.playFlip();
      } else {
        setGuesses([...guesses, current]);
        setGameOver(true);
        sounds.playGameOver();
        onGameEnd(0);
      }
    } else if (key === "BACK" && current.length > 0) {
      setCurrent(current.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && current.length < 5) {
      setCurrent(current + key);
      sounds.playTick();
    } else if (key === "ENTER" && current.length < 5) {
      setShake(true);
      sounds.playError();
      setTimeout(() => setShake(false), 500);
    }
  }, [current, guesses, target, gameOver, onGameEnd, onScoreUpdate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleKey("ENTER");
      else if (e.key === "Backspace") handleKey("BACK");
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const getColor = (guess: string, i: number) => {
    const letter = guess[i];
    if (target[i] === letter) return "bg-green-500";
    if (target.includes(letter)) return "bg-yellow-500";
    return "bg-gray-600";
  };

  const getKeyColor = (key: string) => {
    for (const guess of guesses) {
      const idx = guess.indexOf(key);
      if (idx >= 0) {
        if (target[idx] === key) return "bg-green-500";
        if (target.includes(key)) return "bg-yellow-500";
        return "bg-gray-700";
      }
    }
    return "bg-gray-500";
  };

  const rows = [...guesses, ...(gameOver ? [] : [current.padEnd(5, " ")]), ...Array(Math.max(0, 5 - guesses.length)).fill("     ")].slice(0, 6);
  const keyboard = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`grid gap-1 ${shake ? "animate-shake" : ""}`}>
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.split("").map((letter: string, li: number) => (
              <div
                key={li}
                className={`w-12 h-12 flex items-center justify-center text-2xl font-bold rounded transition-all ${
                  ri < guesses.length ? getColor(guesses[ri], li) : "bg-gray-700 border-2 border-gray-600"
                } ${letter !== " " ? "text-white" : ""}`}
              >
                {letter !== " " ? letter : ""}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <div className="flex flex-col gap-1">
        {keyboard.map((row, ri) => (
          <div key={ri} className="flex gap-1 justify-center">
            {ri === 2 && (
              <button onClick={() => handleKey("ENTER")} className="px-3 py-3 bg-purple-600 text-white text-sm font-bold rounded hover:bg-purple-500">
                ENTER
              </button>
            )}
            {row.split("").map(key => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className={`w-8 h-10 ${getKeyColor(key)} text-white font-bold rounded hover:opacity-80 transition-all`}
              >
                {key}
              </button>
            ))}
            {ri === 2 && (
              <button onClick={() => handleKey("BACK")} className="px-3 py-3 bg-gray-600 text-white text-sm font-bold rounded hover:bg-gray-500">
                ⌫
              </button>
            )}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className={`text-2xl font-bold ${won ? "text-green-400" : "text-red-400"}`}>
          {won ? `YOU WIN! 🎉 ${(6 - guesses.length) * 20} pts` : `The word was: ${target}`}
        </div>
      )}
    </div>
  );
}
