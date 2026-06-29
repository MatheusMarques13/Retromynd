import { useState, useCallback } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface BlackjackGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

type Card = { suit: string; value: string; numValue: number };

export default function BlackjackGame({ onGameEnd, onScoreUpdate }: BlackjackGameProps) {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<"betting" | "playing" | "dealer" | "ended">("betting");
  const [result, setResult] = useState("");
  const [score, setScore] = useState(100);
  const [bet, setBet] = useState(10);
  const sounds = useGameSounds();

  const suits = ["♠", "♥", "♦", "♣"];
  const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  const createDeck = useCallback(() => {
    const newDeck: Card[] = [];
    suits.forEach(suit => {
      values.forEach((value, i) => {
        const numValue = i === 0 ? 11 : Math.min(i + 1, 10);
        newDeck.push({ suit, value, numValue });
      });
    });
    return newDeck.sort(() => Math.random() - 0.5);
  }, []);

  const getHandValue = (hand: Card[]) => {
    let value = hand.reduce((sum, card) => sum + card.numValue, 0);
    let aces = hand.filter(c => c.value === "A").length;
    while (value > 21 && aces > 0) { value -= 10; aces--; }
    return value;
  };

  const startGame = () => {
    const newDeck = createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState("playing");
    setResult("");
    sounds.playFlip();
    
    if (getHandValue(pHand) === 21) {
      endGame(pHand, dHand, newDeck, "blackjack");
    }
  };

  const hit = () => {
    const newDeck = [...deck];
    const newHand = [...playerHand, newDeck.pop()!];
    setDeck(newDeck);
    setPlayerHand(newHand);
    sounds.playFlip();
    
    if (getHandValue(newHand) > 21) {
      endGame(newHand, dealerHand, newDeck, "bust");
    }
  };

  const stand = () => {
    let newDeck = [...deck];
    let dHand = [...dealerHand];
    
    while (getHandValue(dHand) < 17) {
      dHand.push(newDeck.pop()!);
    }
    
    setDeck(newDeck);
    setDealerHand(dHand);
    endGame(playerHand, dHand, newDeck, "compare");
  };

  const endGame = (pHand: Card[], dHand: Card[], _deck: Card[], type: string) => {
    const pValue = getHandValue(pHand);
    const dValue = getHandValue(dHand);
    let newScore = score;
    let resultText = "";

    if (type === "bust") {
      resultText = "BUST! You lose";
      newScore -= bet;
      sounds.playError();
    } else if (type === "blackjack") {
      resultText = "BLACKJACK! You win 1.5x";
      newScore += Math.floor(bet * 1.5);
      sounds.playWin();
    } else {
      if (dValue > 21) {
        resultText = "Dealer busts! You win!";
        newScore += bet;
        sounds.playWin();
      } else if (pValue > dValue) {
        resultText = "You win!";
        newScore += bet;
        sounds.playSuccess();
      } else if (pValue < dValue) {
        resultText = "Dealer wins";
        newScore -= bet;
        sounds.playError();
      } else {
        resultText = "Push - tie!";
        sounds.playTick();
      }
    }

    setScore(newScore);
    setResult(resultText);
    setGameState("ended");
    onScoreUpdate(newScore);
    
    if (newScore <= 0) {
      onGameEnd(0);
    }
  };

  const renderCard = (card: Card, hidden = false) => (
    <div className={`w-14 h-20 rounded-lg flex items-center justify-center font-bold text-lg ${
      hidden ? "bg-blue-600" : "bg-white"
    } ${card.suit === "♥" || card.suit === "♦" ? "text-red-500" : "text-black"}`}>
      {hidden ? "?" : `${card.value}${card.suit}`}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-cyan-400 font-bold text-xl">Chips: ${score}</div>
      
      {gameState === "betting" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {[5, 10, 25, 50].map(b => (
              <button
                key={b}
                onClick={() => setBet(Math.min(b, score))}
                className={`px-4 py-2 rounded-full font-bold ${bet === b ? "bg-yellow-500 text-black" : "bg-gray-700 text-white"}`}
              >
                ${b}
              </button>
            ))}
          </div>
          <button onClick={startGame} className="px-6 py-3 bg-green-600 rounded-lg text-white font-bold hover:bg-green-500">
            DEAL (Bet ${bet})
          </button>
        </div>
      )}

      {gameState !== "betting" && (
        <>
          <div className="text-gray-400">Dealer ({gameState === "ended" ? getHandValue(dealerHand) : "?"})</div>
          <div className="flex gap-2">
            {dealerHand.map((card, i) => (
              <div key={i}>{renderCard(card, i === 1 && gameState === "playing")}</div>
            ))}
          </div>
          
          <div className="text-gray-400">You ({getHandValue(playerHand)})</div>
          <div className="flex gap-2">
            {playerHand.map((card, i) => <div key={i}>{renderCard(card)}</div>)}
          </div>
          
          {gameState === "playing" && (
            <div className="flex gap-4">
              <button onClick={hit} className="px-6 py-2 bg-blue-600 rounded-lg text-white font-bold hover:bg-blue-500">HIT</button>
              <button onClick={stand} className="px-6 py-2 bg-red-600 rounded-lg text-white font-bold hover:bg-red-500">STAND</button>
            </div>
          )}
          
          {gameState === "ended" && (
            <>
              <div className={`text-2xl font-bold ${result.includes("win") || result.includes("BLACKJACK") ? "text-green-400" : result.includes("lose") || result.includes("Dealer") ? "text-red-400" : "text-yellow-400"}`}>
                {result}
              </div>
              <button onClick={() => setGameState("betting")} className="px-6 py-2 bg-purple-600 rounded-lg text-white font-bold hover:bg-purple-500">
                New Hand
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
