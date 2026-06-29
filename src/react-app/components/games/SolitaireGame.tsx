import { useState, useCallback, useEffect } from "react";
import useGameSounds from "@/react-app/hooks/useGameSounds";

interface SolitaireGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

type Card = { suit: string; value: number; faceUp: boolean };
type Pile = Card[];

const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export default function SolitaireGame({ onGameEnd, onScoreUpdate }: SolitaireGameProps) {
  const [tableau, setTableau] = useState<Pile[]>([[], [], [], [], [], [], []]);
  const [foundations, setFoundations] = useState<Pile[]>([[], [], [], []]);
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [selected, setSelected] = useState<{ pile: number; index: number; source: string } | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const sounds = useGameSounds();

  const createDeck = useCallback(() => {
    const deck: Card[] = [];
    SUITS.forEach(suit => {
      for (let i = 1; i <= 13; i++) {
        deck.push({ suit, value: i, faceUp: false });
      }
    });
    return deck.sort(() => Math.random() - 0.5);
  }, []);

  const initGame = useCallback(() => {
    const deck = createDeck();
    const newTableau: Pile[] = [[], [], [], [], [], [], []];
    
    for (let i = 0; i < 7; i++) {
      for (let j = i; j < 7; j++) {
        const card = deck.pop()!;
        card.faceUp = j === i;
        newTableau[j].push(card);
      }
    }
    
    setTableau(newTableau);
    setFoundations([[], [], [], []]);
    setStock(deck);
    setWaste([]);
    setSelected(null);
    setScore(0);
    setMoves(0);
  }, [createDeck]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const isRed = (suit: string) => suit === "♥" || suit === "♦";

  const canPlaceOnTableau = (card: Card, targetPile: Pile) => {
    if (targetPile.length === 0) return card.value === 13;
    const topCard = targetPile[targetPile.length - 1];
    return topCard.faceUp && isRed(card.suit) !== isRed(topCard.suit) && card.value === topCard.value - 1;
  };

  const canPlaceOnFoundation = (card: Card, foundationIndex: number) => {
    const foundation = foundations[foundationIndex];
    if (foundation.length === 0) return card.value === 1;
    const topCard = foundation[foundation.length - 1];
    return card.suit === topCard.suit && card.value === topCard.value + 1;
  };

  const drawCard = () => {
    if (stock.length === 0) {
      setStock(waste.map(c => ({ ...c, faceUp: false })).reverse());
      setWaste([]);
    } else {
      const card = { ...stock[stock.length - 1], faceUp: true };
      setStock(stock.slice(0, -1));
      setWaste([...waste, card]);
      sounds.playFlip();
    }
    setMoves(m => m + 1);
  };

  const handleTableauClick = (pileIndex: number, cardIndex: number) => {
    const pile = tableau[pileIndex];
    if (cardIndex < 0 || !pile[cardIndex]?.faceUp) return;

    if (selected) {
      if (selected.source === "tableau" && selected.pile === pileIndex) {
        setSelected(null);
        return;
      }

      let cardsToMove: Card[] = [];
      if (selected.source === "tableau") {
        cardsToMove = tableau[selected.pile].slice(selected.index);
      } else if (selected.source === "waste") {
        cardsToMove = [waste[waste.length - 1]];
      }

      if (cardsToMove.length > 0 && canPlaceOnTableau(cardsToMove[0], pile)) {
        const newTableau = tableau.map(p => [...p]);
        if (selected.source === "tableau") {
          newTableau[selected.pile] = newTableau[selected.pile].slice(0, selected.index);
          if (newTableau[selected.pile].length > 0) {
            newTableau[selected.pile][newTableau[selected.pile].length - 1].faceUp = true;
          }
        }
        newTableau[pileIndex] = [...newTableau[pileIndex], ...cardsToMove];
        setTableau(newTableau);

        if (selected.source === "waste") {
          setWaste(waste.slice(0, -1));
        }

        const newScore = score + 5;
        setScore(newScore);
        onScoreUpdate(newScore);
        setMoves(m => m + 1);
        sounds.playMove();
      }
      setSelected(null);
    } else {
      setSelected({ pile: pileIndex, index: cardIndex, source: "tableau" });
      sounds.playClick();
    }
  };

  const handleEmptyTableauClick = (pileIndex: number) => {
    if (!selected) return;
    
    let cardsToMove: Card[] = [];
    if (selected.source === "tableau") {
      cardsToMove = tableau[selected.pile].slice(selected.index);
    } else if (selected.source === "waste") {
      cardsToMove = [waste[waste.length - 1]];
    }

    if (cardsToMove.length > 0 && cardsToMove[0].value === 13) {
      const newTableau = tableau.map(p => [...p]);
      if (selected.source === "tableau") {
        newTableau[selected.pile] = newTableau[selected.pile].slice(0, selected.index);
        if (newTableau[selected.pile].length > 0) {
          newTableau[selected.pile][newTableau[selected.pile].length - 1].faceUp = true;
        }
      }
      newTableau[pileIndex] = cardsToMove;
      setTableau(newTableau);
      if (selected.source === "waste") setWaste(waste.slice(0, -1));
      setMoves(m => m + 1);
    }
    setSelected(null);
  };

  const handleFoundationClick = (foundationIndex: number) => {
    if (!selected) return;

    let card: Card | null = null;
    if (selected.source === "tableau") {
      const pile = tableau[selected.pile];
      if (selected.index === pile.length - 1) {
        card = pile[selected.index];
      }
    } else if (selected.source === "waste" && waste.length > 0) {
      card = waste[waste.length - 1];
    }

    if (card && canPlaceOnFoundation(card, foundationIndex)) {
      const newFoundations = foundations.map(f => [...f]);
      newFoundations[foundationIndex].push({ ...card, faceUp: true });
      setFoundations(newFoundations);

      if (selected.source === "tableau") {
        const newTableau = tableau.map(p => [...p]);
        newTableau[selected.pile].pop();
        if (newTableau[selected.pile].length > 0) {
          newTableau[selected.pile][newTableau[selected.pile].length - 1].faceUp = true;
        }
        setTableau(newTableau);
      } else {
        setWaste(waste.slice(0, -1));
      }

      const newScore = score + 10;
      setScore(newScore);
      onScoreUpdate(newScore);
      setMoves(m => m + 1);

      const totalFoundation = newFoundations.reduce((sum, f) => sum + f.length, 0);
      if (totalFoundation === 52) {
        sounds.playWin();
        onGameEnd(newScore + 500);
      } else {
        sounds.playSuccess();
      }
    }
    setSelected(null);
  };

  const handleWasteClick = () => {
    if (waste.length > 0) {
      setSelected({ pile: 0, index: waste.length - 1, source: "waste" });
    }
  };

  const renderCard = (card: Card, isSelected: boolean = false) => (
    <div className={`w-12 h-16 rounded border-2 flex items-center justify-center text-sm font-bold ${
      card.faceUp
        ? `bg-white ${isRed(card.suit) ? "text-red-500" : "text-black"} ${isSelected ? "ring-2 ring-yellow-400" : ""}`
        : "bg-gradient-to-br from-blue-600 to-purple-600"
    }`}>
      {card.faceUp ? `${VALUES[card.value - 1]}${card.suit}` : ""}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3 p-2 scale-90">
      <div className="flex gap-4 text-sm">
        <span className="text-cyan-400">Score: {score}</span>
        <span className="text-gray-400">Moves: {moves}</span>
      </div>

      <div className="flex gap-2">
        <div onClick={drawCard} className="w-12 h-16 rounded border-2 border-dashed border-gray-500 flex items-center justify-center cursor-pointer hover:border-cyan-400">
          {stock.length > 0 ? <div className="w-10 h-14 rounded bg-gradient-to-br from-blue-600 to-purple-600" /> : "↺"}
        </div>
        <div onClick={handleWasteClick} className="w-12 h-16">
          {waste.length > 0 && renderCard(waste[waste.length - 1], selected?.source === "waste")}
        </div>
        <div className="w-8" />
        {foundations.map((f, i) => (
          <div key={i} onClick={() => handleFoundationClick(i)} className="w-12 h-16 rounded border-2 border-gray-600 flex items-center justify-center cursor-pointer hover:border-green-400">
            {f.length > 0 ? renderCard(f[f.length - 1]) : SUITS[i]}
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        {tableau.map((pile, pileIndex) => (
          <div key={pileIndex} className="w-14 min-h-[200px]" onClick={() => pile.length === 0 && handleEmptyTableauClick(pileIndex)}>
            {pile.length === 0 ? (
              <div className="w-12 h-16 rounded border-2 border-dashed border-gray-600" />
            ) : (
              <div className="relative">
                {pile.map((card, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="absolute cursor-pointer"
                    style={{ top: cardIndex * 18 }}
                    onClick={(e) => { e.stopPropagation(); handleTableauClick(pileIndex, cardIndex); }}
                  >
                    {renderCard(card, selected?.source === "tableau" && selected.pile === pileIndex && cardIndex >= selected.index)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={initGame} className="px-4 py-1 bg-pink-600 rounded text-white text-sm hover:bg-pink-500">
        New Game
      </button>
    </div>
  );
}
