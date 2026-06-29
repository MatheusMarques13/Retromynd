import { useState, useCallback } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface SequenceGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function SequenceGame({ onGameEnd, onScoreUpdate }: SequenceGameProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showSequence, setShowSequence] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(-1);
  const { playBeep, playClick, playSuccess, playError, playGameOver } = useGameSounds();

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const generateSequence = useCallback((length: number) => {
    const seq: number[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(numbers[Math.floor(Math.random() * numbers.length)]);
    }
    return seq;
  }, []);

  const showSequenceAnimation = useCallback(async (seq: number[]) => {
    setShowSequence(true);
    for (let i = 0; i < seq.length; i++) {
      setDisplayIndex(i);
      playBeep();
      await new Promise(r => setTimeout(r, 800));
      setDisplayIndex(-1);
      await new Promise(r => setTimeout(r, 200));
    }
    setShowSequence(false);
  }, [playBeep]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setGameStarted(true);
    setGameOver(false);
    startRound(3);
  };

  const startRound = (length: number) => {
    const newSeq = generateSequence(length);
    setSequence(newSeq);
    setUserSequence([]);
    showSequenceAnimation(newSeq);
  };

  const handleNumberClick = (num: number) => {
    if (showSequence || gameOver) return;

    playClick();
    const newUserSeq = [...userSequence, num];
    setUserSequence(newUserSeq);

    const idx = newUserSeq.length - 1;
    if (num !== sequence[idx]) {
      playError();
      playGameOver();
      setGameOver(true);
      onGameEnd(score);
      return;
    }

    if (newUserSeq.length === sequence.length) {
      playSuccess();
      const points = level * 50;
      const newScore = score + points;
      setScore(newScore);
      onScoreUpdate(newScore);
      setLevel(l => l + 1);
      
      setTimeout(() => {
        startRound(sequence.length + 1);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-8 text-lg">
        <span className="text-cyan-400">Score: {score}</span>
        <span className="text-purple-400">Level: {level}</span>
        <span className="text-yellow-400">Length: {sequence.length}</span>
      </div>

      {!gameStarted && !gameOver && (
        <div className="text-center">
          <p className="text-gray-300 mb-4">Memorize and repeat the number sequence!</p>
          <button onClick={startGame} className="px-8 py-4 bg-purple-600 rounded-lg text-white font-bold text-xl hover:bg-purple-500">
            Start Game
          </button>
        </div>
      )}

      {gameStarted && (
        <>
          {showSequence && (
            <div className="h-24 flex items-center justify-center">
              <div className="text-6xl font-bold text-cyan-400 animate-pulse">
                {displayIndex >= 0 ? sequence[displayIndex] : ""}
              </div>
            </div>
          )}

          {!showSequence && !gameOver && (
            <>
              <div className="h-16 flex items-center gap-2">
                {userSequence.map((n, i) => (
                  <span key={i} className="text-2xl text-green-400">{n}</span>
                ))}
                {Array(sequence.length - userSequence.length).fill(0).map((_, i) => (
                  <span key={`empty-${i}`} className="text-2xl text-gray-600">_</span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {numbers.map(num => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white text-3xl font-bold hover:scale-105 transition-transform"
                    style={{ boxShadow: "0 0 20px rgba(168,85,247,0.4)" }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </>
          )}

          {showSequence && (
            <div className="text-yellow-400 text-lg animate-pulse">Memorize the sequence...</div>
          )}
        </>
      )}

      {gameOver && (
        <div className="text-center">
          <div className="text-3xl font-bold text-red-400 mb-2">Wrong!</div>
          <div className="text-xl text-white mb-1">Final Score: {score}</div>
          <div className="text-gray-300 mb-4">Reached Level {level} (Length: {sequence.length})</div>
          <button onClick={startGame} className="px-6 py-2 bg-purple-600 rounded-lg text-white font-bold hover:bg-purple-500">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
