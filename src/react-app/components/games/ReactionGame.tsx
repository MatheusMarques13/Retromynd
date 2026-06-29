import { useState, useRef, useCallback } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface ReactionGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

export default function ReactionGame({ onGameEnd, onScoreUpdate }: ReactionGameProps) {
  const [state, setState] = useState<"waiting" | "ready" | "go" | "result" | "early">("waiting");
  const [reactionTime, setReactionTime] = useState(0);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const startTime = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { playClick, playBeep, playSuccess, playError, playGameOver } = useGameSounds();

  const startRound = useCallback(() => {
    setState("ready");
    playTick();
    const delay = 2000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      setState("go");
      playBeep();
      startTime.current = Date.now();
    }, delay);
  }, [playBeep]);
  
  const { playTick } = useGameSounds();

  const handleClick = () => {
    if (state === "waiting") {
      playClick();
      setAttempts([]);
      setRound(1);
      startRound();
    } else if (state === "ready") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      playError();
      setState("early");
    } else if (state === "go") {
      const time = Date.now() - startTime.current;
      setReactionTime(time);
      const newAttempts = [...attempts, time];
      setAttempts(newAttempts);
      setState("result");
      playSuccess();
      
      if (newAttempts.length >= 5) {
        const avg = Math.round(newAttempts.reduce((a, b) => a + b, 0) / newAttempts.length);
        const score = Math.max(0, 1000 - avg);
        onScoreUpdate(score);
        playGameOver();
        onGameEnd(score);
      }
    } else if (state === "result" || state === "early") {
      if (attempts.length < 5) {
        setRound(round + 1);
        startRound();
      }
    }
  };

  const getAverage = () => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-cyan-400 font-bold text-xl">
        Round {round}/5 | Average: {getAverage()}ms
      </div>

      <button
        onClick={handleClick}
        className={`w-80 h-80 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${
          state === "waiting" ? "bg-blue-600 hover:bg-blue-500" :
          state === "ready" ? "bg-red-600" :
          state === "go" ? "bg-green-500" :
          state === "result" ? "bg-blue-600" :
          "bg-orange-600"
        }`}
        style={{
          boxShadow: state === "go" ? "0 0 50px #22c55e" : "none"
        }}
      >
        {state === "waiting" && "Click to Start"}
        {state === "ready" && "Wait for green..."}
        {state === "go" && "CLICK NOW!"}
        {state === "result" && `${reactionTime}ms\nClick to continue`}
        {state === "early" && "Too early!\nClick to retry"}
      </button>

      <div className="flex gap-2">
        {attempts.map((t, i) => (
          <div key={i} className={`px-3 py-1 rounded text-sm ${
            t < 250 ? "bg-green-600" : t < 350 ? "bg-yellow-600" : "bg-red-600"
          }`}>
            {t}ms
          </div>
        ))}
        {Array(5 - attempts.length).fill(0).map((_, i) => (
          <div key={`empty-${i}`} className="px-3 py-1 rounded text-sm bg-gray-700">---</div>
        ))}
      </div>

      {attempts.length >= 5 && (
        <div className="text-center">
          <div className="text-yellow-400 text-2xl font-bold">Final Average: {getAverage()}ms</div>
          <div className="text-gray-400">
            {getAverage() < 200 ? "Incredible! 🚀" :
             getAverage() < 250 ? "Excellent! ⚡" :
             getAverage() < 300 ? "Good! 👍" :
             getAverage() < 350 ? "Average 😐" : "Keep practicing! 💪"}
          </div>
          <button onClick={() => { setState("waiting"); setAttempts([]); setRound(0); }} className="mt-4 px-6 py-2 bg-purple-600 rounded-lg text-white font-bold hover:bg-purple-500">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
