import { useState, useEffect, useCallback } from 'react';
import { Swords, Shield, Sparkles, Flame, Droplets, Wind, Mountain, Zap, Moon, Heart, X } from 'lucide-react';

// Card Types
type CardType = 'monster' | 'spell' | 'trap';
type Element = 'fire' | 'water' | 'wind' | 'earth' | 'light' | 'dark';
type MonsterPosition = 'attack' | 'defense' | 'facedown';

interface Card {
  id: string;
  name: string;
  type: CardType;
  element?: Element;
  level?: number;
  atk?: number;
  def?: number;
  effect?: string;
  image: string;
}

interface FieldCard {
  card: Card;
  position: MonsterPosition;
  canAttack: boolean;
  hasAttacked: boolean;
}

interface GameState {
  turn: number;
  currentPlayer: 1 | 2;
  phase: 'draw' | 'main' | 'battle' | 'end';
  player1: PlayerState;
  player2: PlayerState;
  lastAction?: string;
  winner?: 1 | 2;
}

interface PlayerState {
  lp: number;
  hand: Card[];
  deck: Card[];
  field: (FieldCard | null)[];
  spellTrap: (FieldCard | null)[];
  graveyard: Card[];
  hasNormalSummoned: boolean;
  hasDrawn: boolean;
}

// Sample Card Database
const CARD_DATABASE: Card[] = [
  // Monsters - Fire
  { id: 'fire_knight', name: 'Flame Knight', type: 'monster', element: 'fire', level: 4, atk: 1800, def: 1200, effect: 'A warrior engulfed in flames.', image: '🔥⚔️' },
  { id: 'fire_dragon', name: 'Inferno Dragon', type: 'monster', element: 'fire', level: 6, atk: 2400, def: 2000, effect: 'Requires 1 tribute to summon.', image: '🐉🔥' },
  { id: 'fire_spirit', name: 'Ember Spirit', type: 'monster', element: 'fire', level: 2, atk: 800, def: 600, effect: 'A small but fierce fire elemental.', image: '👻🔥' },
  
  // Monsters - Water
  { id: 'water_mage', name: 'Aqua Sorceress', type: 'monster', element: 'water', level: 4, atk: 1600, def: 1400, effect: 'Master of water magic.', image: '🧙‍♀️💧' },
  { id: 'water_serpent', name: 'Sea Serpent', type: 'monster', element: 'water', level: 5, atk: 2100, def: 1600, effect: 'Requires 1 tribute to summon.', image: '🐍💧' },
  { id: 'water_fish', name: 'Deep Diver', type: 'monster', element: 'water', level: 3, atk: 1200, def: 1000, effect: 'Swift underwater hunter.', image: '🐟💧' },
  
  // Monsters - Wind
  { id: 'wind_bird', name: 'Storm Hawk', type: 'monster', element: 'wind', level: 4, atk: 1700, def: 1100, effect: 'Rides the fierce winds.', image: '🦅💨' },
  { id: 'wind_ninja', name: 'Shadow Ninja', type: 'monster', element: 'wind', level: 3, atk: 1400, def: 800, effect: 'Strikes from the shadows.', image: '🥷💨' },
  
  // Monsters - Earth
  { id: 'earth_golem', name: 'Stone Golem', type: 'monster', element: 'earth', level: 4, atk: 1500, def: 2000, effect: 'An immovable defender.', image: '🗿🏔️' },
  { id: 'earth_beast', name: 'Terra Beast', type: 'monster', element: 'earth', level: 5, atk: 2000, def: 1800, effect: 'Requires 1 tribute to summon.', image: '🦁🏔️' },
  
  // Monsters - Light
  { id: 'light_angel', name: 'Divine Angel', type: 'monster', element: 'light', level: 4, atk: 1600, def: 1500, effect: 'Blessed by holy light.', image: '👼✨' },
  { id: 'light_paladin', name: 'Holy Paladin', type: 'monster', element: 'light', level: 6, atk: 2300, def: 2100, effect: 'Requires 1 tribute to summon.', image: '🛡️✨' },
  
  // Monsters - Dark
  { id: 'dark_demon', name: 'Shadow Demon', type: 'monster', element: 'dark', level: 4, atk: 1900, def: 1000, effect: 'Born from darkness.', image: '😈🌑' },
  { id: 'dark_reaper', name: 'Soul Reaper', type: 'monster', element: 'dark', level: 6, atk: 2500, def: 1700, effect: 'Requires 1 tribute to summon.', image: '💀🌑' },
  { id: 'dark_bat', name: 'Night Bat', type: 'monster', element: 'dark', level: 2, atk: 900, def: 500, effect: 'Hunts in the moonlight.', image: '🦇🌑' },
  
  // Spells
  { id: 'spell_boost', name: 'Power Surge', type: 'spell', effect: 'Increase one monster ATK by 500 this turn.', image: '⚡📜' },
  { id: 'spell_heal', name: 'Life Essence', type: 'spell', effect: 'Restore 1000 LP.', image: '💚📜' },
  { id: 'spell_destroy', name: 'Dark Hole', type: 'spell', effect: 'Destroy all monsters on the field.', image: '🕳️📜' },
  { id: 'spell_draw', name: 'Card Draw', type: 'spell', effect: 'Draw 2 cards from your deck.', image: '🃏📜' },
  
  // Traps
  { id: 'trap_mirror', name: 'Mirror Force', type: 'trap', effect: 'When attacked: Destroy all attacking monsters.', image: '🪞📜' },
  { id: 'trap_negate', name: 'Counter Trap', type: 'trap', effect: 'Negate the activation of a spell card.', image: '🚫📜' },
  { id: 'trap_damage', name: 'Damage Reflect', type: 'trap', effect: 'When you take damage: Deal same damage to opponent.', image: '↩️📜' },
];

// Helper functions
const getElementIcon = (element?: Element) => {
  switch (element) {
    case 'fire': return <Flame className="w-3 h-3 text-orange-500" />;
    case 'water': return <Droplets className="w-3 h-3 text-blue-500" />;
    case 'wind': return <Wind className="w-3 h-3 text-cyan-400" />;
    case 'earth': return <Mountain className="w-3 h-3 text-amber-600" />;
    case 'light': return <Zap className="w-3 h-3 text-yellow-400" />;
    case 'dark': return <Moon className="w-3 h-3 text-purple-500" />;
    default: return null;
  }
};

const getElementColor = (element?: Element) => {
  switch (element) {
    case 'fire': return 'from-orange-600 to-red-700';
    case 'water': return 'from-blue-500 to-cyan-600';
    case 'wind': return 'from-cyan-400 to-teal-500';
    case 'earth': return 'from-amber-600 to-yellow-700';
    case 'light': return 'from-yellow-400 to-amber-500';
    case 'dark': return 'from-purple-600 to-indigo-800';
    default: return 'from-gray-600 to-gray-700';
  }
};

const shuffleDeck = (cards: Card[]): Card[] => {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const createDeck = (): Card[] => {
  // Create a deck with duplicates of some cards
  const deck: Card[] = [];
  CARD_DATABASE.forEach(card => {
    deck.push({ ...card, id: `${card.id}_1` });
    if (card.type === 'monster' && (card.level || 0) <= 4) {
      deck.push({ ...card, id: `${card.id}_2` });
    }
  });
  return shuffleDeck(deck);
};

interface AnimeCardBattleProps {
  gameState: GameState;
  isYourTurn: boolean;
  playerNumber: 1 | 2;
  onMove: (move: object) => void;
  disabled?: boolean;
}

export function AnimeCardBattle({ 
  gameState, 
  playerNumber, 
  onMove, 
  disabled 
}: AnimeCardBattleProps) {
  const [selectedHandCard, setSelectedHandCard] = useState<number | null>(null);
  const [selectedFieldCard, setSelectedFieldCard] = useState<number | null>(null);
  const [attackTarget, setAttackTarget] = useState<number | null>(null);
  const [showCardDetail, setShowCardDetail] = useState<Card | null>(null);

  const myState = playerNumber === 1 ? gameState.player1 : gameState.player2;
  const oppState = playerNumber === 1 ? gameState.player2 : gameState.player1;
  const isMyTurn = gameState.currentPlayer === playerNumber;

  const canNormalSummon = isMyTurn && gameState.phase === 'main' && !myState.hasNormalSummoned;
  const canAttack = isMyTurn && gameState.phase === 'battle';

  // Reset selections when turn changes
  useEffect(() => {
    setSelectedHandCard(null);
    setSelectedFieldCard(null);
    setAttackTarget(null);
  }, [gameState.turn, gameState.phase]);

  const handleDrawCard = useCallback(() => {
    if (!isMyTurn || gameState.phase !== 'draw' || myState.hasDrawn) return;
    onMove({ action: 'draw' });
  }, [isMyTurn, gameState.phase, myState.hasDrawn, onMove]);

  const handleSummon = useCallback((handIndex: number, position: 'attack' | 'defense') => {
    if (!canNormalSummon || selectedHandCard === null) return;
    const card = myState.hand[handIndex];
    if (card.type !== 'monster') return;
    
    // Check tribute requirements
    const level = card.level || 1;
    const monstersOnField = myState.field.filter(f => f !== null).length;
    
    if (level >= 5 && level <= 6 && monstersOnField < 1) {
      alert('You need 1 tribute for this monster!');
      return;
    }
    if (level >= 7 && monstersOnField < 2) {
      alert('You need 2 tributes for this monster!');
      return;
    }

    onMove({ 
      action: 'summon', 
      handIndex, 
      position,
      tribute: level >= 5 ? 0 : undefined // Index of monster to tribute
    });
    setSelectedHandCard(null);
  }, [canNormalSummon, selectedHandCard, myState.hand, myState.field, onMove]);

  const handleSetCard = useCallback((handIndex: number) => {
    if (!isMyTurn || gameState.phase !== 'main') return;
    const card = myState.hand[handIndex];
    
    if (card.type === 'monster') {
      // Set monster in facedown defense
      if (myState.hasNormalSummoned) return;
      onMove({ action: 'set_monster', handIndex });
    } else {
      // Set spell/trap
      onMove({ action: 'set_spelltrap', handIndex });
    }
    setSelectedHandCard(null);
  }, [isMyTurn, gameState.phase, myState.hand, myState.hasNormalSummoned, onMove]);

  const handleActivateSpell = useCallback((handIndex: number) => {
    if (!isMyTurn || gameState.phase !== 'main') return;
    const card = myState.hand[handIndex];
    if (card.type !== 'spell') return;
    
    onMove({ action: 'activate_spell', handIndex });
    setSelectedHandCard(null);
  }, [isMyTurn, gameState.phase, myState.hand, onMove]);

  const handleAttack = useCallback((attackerIndex: number, targetIndex: number | 'direct') => {
    if (!canAttack) return;
    onMove({ action: 'attack', attackerIndex, targetIndex });
    setSelectedFieldCard(null);
    setAttackTarget(null);
  }, [canAttack, onMove]);

  const handleNextPhase = useCallback(() => {
    if (!isMyTurn) return;
    onMove({ action: 'next_phase' });
  }, [isMyTurn, onMove]);

  const handleEndTurn = useCallback(() => {
    if (!isMyTurn) return;
    onMove({ action: 'end_turn' });
  }, [isMyTurn, onMove]);

  // Card component
  const CardDisplay = ({ 
    card, 
    fieldCard,
    isOpponent = false,
    isSelected = false,
    onClick,
    size = 'normal'
  }: { 
    card?: Card | null;
    fieldCard?: FieldCard | null;
    isOpponent?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
    size?: 'small' | 'normal' | 'large';
  }) => {
    if (!card && !fieldCard) {
      return (
        <div className={`
          ${size === 'small' ? 'w-12 h-16' : size === 'large' ? 'w-24 h-32' : 'w-16 h-22'}
          rounded border-2 border-dashed border-gray-600/50 bg-gray-900/30
        `} />
      );
    }

    const displayCard = fieldCard?.card || card;
    const isFacedown = fieldCard?.position === 'facedown';
    const isDefense = fieldCard?.position === 'defense';

    if (isFacedown && isOpponent) {
      return (
        <div 
          className={`
            ${size === 'small' ? 'w-12 h-16' : size === 'large' ? 'w-24 h-32' : 'w-16 h-22'}
            rounded border-2 border-purple-500/50 bg-gradient-to-br from-purple-900 to-indigo-900
            flex items-center justify-center cursor-pointer hover:border-purple-400
            ${isDefense ? 'rotate-90' : ''}
          `}
          onClick={onClick}
        >
          <span className="text-2xl">🎴</span>
        </div>
      );
    }

    if (!displayCard) return null;

    const isMonster = displayCard.type === 'monster';
    const bgGradient = isMonster 
      ? getElementColor(displayCard.element)
      : displayCard.type === 'spell' 
        ? 'from-green-600 to-emerald-700'
        : 'from-pink-600 to-rose-700';

    return (
      <div 
        className={`
          ${size === 'small' ? 'w-12 h-16' : size === 'large' ? 'w-24 h-32' : 'w-16 h-22'}
          rounded border-2 transition-all cursor-pointer
          ${isSelected ? 'border-yellow-400 shadow-lg shadow-yellow-400/50 scale-110 z-10' : 'border-gray-500/50 hover:border-gray-400'}
          ${isDefense ? 'rotate-90' : ''}
          bg-gradient-to-br ${bgGradient}
          relative overflow-hidden
        `}
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowCardDetail(displayCard);
        }}
      >
        {/* Card content */}
        <div className="absolute inset-0.5 flex flex-col items-center justify-center p-0.5">
          <span className={`${size === 'large' ? 'text-3xl' : 'text-lg'}`}>{displayCard.image}</span>
          {isMonster && size !== 'small' && (
            <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-between text-[8px] font-bold text-white">
              <span className="flex items-center gap-0.5">
                <Swords className="w-2 h-2" />{displayCard.atk}
              </span>
              <span className="flex items-center gap-0.5">
                <Shield className="w-2 h-2" />{displayCard.def}
              </span>
            </div>
          )}
          {isMonster && (
            <div className="absolute top-0.5 right-0.5">
              {getElementIcon(displayCard.element)}
            </div>
          )}
          {displayCard.level && (
            <div className="absolute top-0.5 left-0.5 flex">
              {Array.from({ length: Math.min(displayCard.level, 4) }).map((_, i) => (
                <span key={i} className="text-[6px] text-yellow-400">★</span>
              ))}
            </div>
          )}
        </div>
        
        {/* Can attack indicator */}
        {fieldCard && !fieldCard.hasAttacked && canAttack && !isOpponent && isMyTurn && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
    );
  };

  // Phase indicator
  const PhaseIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {['draw', 'main', 'battle', 'end'].map((phase) => (
        <button
          key={phase}
          onClick={() => phase === 'battle' && isMyTurn && gameState.phase === 'main' && handleNextPhase()}
          className={`
            px-3 py-1 rounded text-xs font-mono uppercase transition-all
            ${gameState.phase === phase 
              ? 'bg-cyan-500 text-black font-bold' 
              : 'bg-gray-800 text-gray-500'}
            ${phase === 'battle' && isMyTurn && gameState.phase === 'main' 
              ? 'cursor-pointer hover:bg-cyan-600' 
              : 'cursor-default'}
          `}
        >
          {phase}
        </button>
      ))}
    </div>
  );

  if (gameState.winner) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className={`text-6xl mb-4 ${gameState.winner === playerNumber ? 'animate-bounce' : ''}`}>
          {gameState.winner === playerNumber ? '🏆' : '💀'}
        </div>
        <h2 className="text-3xl font-bold mb-2" style={{ 
          color: gameState.winner === playerNumber ? '#00ff88' : '#ff4466',
          textShadow: `0 0 20px ${gameState.winner === playerNumber ? '#00ff88' : '#ff4466'}`
        }}>
          {gameState.winner === playerNumber ? 'VICTORY!' : 'DEFEAT'}
        </h2>
        <p className="text-gray-400 font-mono">
          {gameState.winner === playerNumber 
            ? "You've proven your worth as a duelist!" 
            : "Your opponent was too powerful this time."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a0612] via-[#1a0a2e] to-[#0a0612] p-4 rounded-lg relative overflow-hidden">
      {/* Anime-style background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500 rounded-full blur-[100px]" />
      </div>

      {/* Turn indicator */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">TURN {gameState.turn}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            isMyTurn ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'
          }`}>
            {isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN"}
          </span>
        </div>
        {gameState.lastAction && (
          <span className="text-xs text-gray-500 font-mono">{gameState.lastAction}</span>
        )}
      </div>

      <PhaseIndicator />

      {/* Opponent's side */}
      <div className="flex flex-col items-center mb-4 relative z-10">
        {/* Opponent LP */}
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-red-500" />
          <div className="w-32 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
              style={{ width: `${(oppState.lp / 8000) * 100}%` }}
            />
          </div>
          <span className="text-red-400 font-mono text-sm font-bold">{oppState.lp}</span>
        </div>

        {/* Opponent's field */}
        <div className="flex gap-1 mb-2">
          {oppState.field.map((fieldCard, i) => (
            <div 
              key={i}
              onClick={() => {
                if (canAttack && selectedFieldCard !== null) {
                  setAttackTarget(i);
                }
              }}
              className={attackTarget === i ? 'ring-2 ring-red-500 rounded' : ''}
            >
              <CardDisplay 
                fieldCard={fieldCard} 
                isOpponent 
                size="small"
                onClick={() => fieldCard && setShowCardDetail(fieldCard.card)}
              />
            </div>
          ))}
        </div>

        {/* Opponent's spell/trap */}
        <div className="flex gap-1">
          {oppState.spellTrap.map((fieldCard, i) => (
            <CardDisplay key={i} fieldCard={fieldCard} isOpponent size="small" />
          ))}
        </div>

        {/* Opponent's deck/grave */}
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span>Deck: {oppState.deck.length}</span>
          <span>Hand: {oppState.hand.length}</span>
          <span>Grave: {oppState.graveyard.length}</span>
        </div>
      </div>

      {/* Center divider */}
      <div className="flex items-center justify-center my-2">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <Sparkles className="w-5 h-5 text-purple-400 mx-2" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      </div>

      {/* My side */}
      <div className="flex flex-col items-center relative z-10">
        {/* My spell/trap */}
        <div className="flex gap-1 mb-2">
          {myState.spellTrap.map((fieldCard, i) => (
            <CardDisplay key={i} fieldCard={fieldCard} size="small" />
          ))}
        </div>

        {/* My field */}
        <div className="flex gap-1 mb-2">
          {myState.field.map((fieldCard, i) => (
            <div 
              key={i}
              onClick={() => {
                if (canAttack && fieldCard && !fieldCard.hasAttacked) {
                  setSelectedFieldCard(selectedFieldCard === i ? null : i);
                }
              }}
            >
              <CardDisplay 
                fieldCard={fieldCard}
                isSelected={selectedFieldCard === i}
                size="small"
              />
            </div>
          ))}
        </div>

        {/* My LP */}
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-green-500" />
          <div className="w-32 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all"
              style={{ width: `${(myState.lp / 8000) * 100}%` }}
            />
          </div>
          <span className="text-green-400 font-mono text-sm font-bold">{myState.lp}</span>
        </div>

        {/* My deck/grave */}
        <div className="flex gap-4 text-xs text-gray-500 mb-2">
          <span>Deck: {myState.deck.length}</span>
          <span>Grave: {myState.graveyard.length}</span>
        </div>
      </div>

      {/* My hand */}
      <div className="flex justify-center gap-1 mt-auto mb-2 overflow-x-auto pb-2 relative z-10">
        {myState.hand.map((card, i) => (
          <div
            key={card.id + i}
            className={`transition-transform ${selectedHandCard === i ? '-translate-y-4' : ''}`}
          >
            <CardDisplay 
              card={card}
              isSelected={selectedHandCard === i}
              onClick={() => setSelectedHandCard(selectedHandCard === i ? null : i)}
            />
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-2 relative z-10">
        {/* Draw phase */}
        {isMyTurn && gameState.phase === 'draw' && !myState.hasDrawn && (
          <button
            onClick={handleDrawCard}
            disabled={disabled}
            className="px-4 py-2 bg-cyan-500 text-black font-bold rounded hover:bg-cyan-400 disabled:opacity-50"
          >
            Draw Card
          </button>
        )}

        {/* Main phase - summon options */}
        {isMyTurn && gameState.phase === 'main' && selectedHandCard !== null && (
          <>
            {myState.hand[selectedHandCard].type === 'monster' && canNormalSummon && (
              <>
                <button
                  onClick={() => handleSummon(selectedHandCard, 'attack')}
                  disabled={disabled}
                  className="px-3 py-2 bg-orange-500 text-black font-bold rounded hover:bg-orange-400 disabled:opacity-50 text-sm"
                >
                  <Swords className="w-4 h-4 inline mr-1" /> Summon ATK
                </button>
                <button
                  onClick={() => handleSummon(selectedHandCard, 'defense')}
                  disabled={disabled}
                  className="px-3 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-400 disabled:opacity-50 text-sm"
                >
                  <Shield className="w-4 h-4 inline mr-1" /> Summon DEF
                </button>
              </>
            )}
            {myState.hand[selectedHandCard].type === 'monster' && (
              <button
                onClick={() => handleSetCard(selectedHandCard)}
                disabled={disabled || myState.hasNormalSummoned}
                className="px-3 py-2 bg-purple-500 text-white font-bold rounded hover:bg-purple-400 disabled:opacity-50 text-sm"
              >
                Set
              </button>
            )}
            {myState.hand[selectedHandCard].type === 'spell' && (
              <>
                <button
                  onClick={() => handleActivateSpell(selectedHandCard)}
                  disabled={disabled}
                  className="px-3 py-2 bg-green-500 text-white font-bold rounded hover:bg-green-400 disabled:opacity-50 text-sm"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleSetCard(selectedHandCard)}
                  disabled={disabled}
                  className="px-3 py-2 bg-purple-500 text-white font-bold rounded hover:bg-purple-400 disabled:opacity-50 text-sm"
                >
                  Set
                </button>
              </>
            )}
            {myState.hand[selectedHandCard].type === 'trap' && (
              <button
                onClick={() => handleSetCard(selectedHandCard)}
                disabled={disabled}
                className="px-3 py-2 bg-pink-500 text-white font-bold rounded hover:bg-pink-400 disabled:opacity-50 text-sm"
              >
                Set Trap
              </button>
            )}
          </>
        )}

        {/* Battle phase - attack */}
        {isMyTurn && gameState.phase === 'battle' && selectedFieldCard !== null && (
          <>
            {oppState.field.some(f => f !== null) ? (
              <span className="text-sm text-gray-400">Select target to attack</span>
            ) : (
              <button
                onClick={() => handleAttack(selectedFieldCard, 'direct')}
                disabled={disabled}
                className="px-4 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-400 disabled:opacity-50"
              >
                Direct Attack!
              </button>
            )}
            {attackTarget !== null && (
              <button
                onClick={() => handleAttack(selectedFieldCard, attackTarget)}
                disabled={disabled}
                className="px-4 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-400 disabled:opacity-50"
              >
                Attack!
              </button>
            )}
          </>
        )}

        {/* Phase controls */}
        {isMyTurn && gameState.phase === 'main' && (
          <button
            onClick={handleNextPhase}
            disabled={disabled}
            className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
          >
            → Battle Phase
          </button>
        )}
        {isMyTurn && (gameState.phase === 'main' || gameState.phase === 'battle') && (
          <button
            onClick={handleEndTurn}
            disabled={disabled}
            className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
          >
            End Turn
          </button>
        )}
      </div>

      {/* Card detail modal */}
      {showCardDetail && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowCardDetail(null)}
        >
          <div 
            className={`w-64 p-4 rounded-lg border-2 bg-gradient-to-br ${
              showCardDetail.type === 'monster' 
                ? getElementColor(showCardDetail.element)
                : showCardDetail.type === 'spell'
                  ? 'from-green-600 to-emerald-700'
                  : 'from-pink-600 to-rose-700'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-white font-bold">{showCardDetail.name}</h3>
              <button onClick={() => setShowCardDetail(null)}>
                <X className="w-5 h-5 text-white/70 hover:text-white" />
              </button>
            </div>
            
            <div className="text-6xl text-center my-4">{showCardDetail.image}</div>
            
            {showCardDetail.type === 'monster' && (
              <div className="flex justify-between text-white text-sm mb-2">
                <span className="flex items-center gap-1">
                  {getElementIcon(showCardDetail.element)}
                  {showCardDetail.element?.toUpperCase()}
                </span>
                <span>Level {showCardDetail.level}</span>
              </div>
            )}
            
            <p className="text-white/80 text-sm mb-3">{showCardDetail.effect}</p>
            
            {showCardDetail.type === 'monster' && (
              <div className="flex justify-between text-white font-bold">
                <span className="flex items-center gap-1">
                  <Swords className="w-4 h-4" /> ATK {showCardDetail.atk}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4" /> DEF {showCardDetail.def}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Initialize game state
export function createCardBattleState(): GameState {
  const deck1 = createDeck();
  const deck2 = createDeck();
  
  return {
    turn: 1,
    currentPlayer: 1,
    phase: 'draw',
    player1: {
      lp: 8000,
      hand: deck1.splice(0, 5),
      deck: deck1,
      field: [null, null, null, null, null],
      spellTrap: [null, null, null, null, null],
      graveyard: [],
      hasNormalSummoned: false,
      hasDrawn: false,
    },
    player2: {
      lp: 8000,
      hand: deck2.splice(0, 5),
      deck: deck2,
      field: [null, null, null, null, null],
      spellTrap: [null, null, null, null, null],
      graveyard: [],
      hasNormalSummoned: false,
      hasDrawn: false,
    },
  };
}

// Process game moves
export function processCardBattleMove(state: GameState, move: any, playerNumber: 1 | 2): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const currentPlayer = newState.currentPlayer;
  
  if (currentPlayer !== playerNumber) return state;
  
  const myState = currentPlayer === 1 ? newState.player1 : newState.player2;
  const oppState = currentPlayer === 1 ? newState.player2 : newState.player1;

  switch (move.action) {
    case 'draw': {
      if (myState.deck.length > 0 && !myState.hasDrawn) {
        myState.hand.push(myState.deck.shift()!);
        myState.hasDrawn = true;
        newState.phase = 'main';
        newState.lastAction = 'Drew a card';
      }
      break;
    }
    
    case 'summon': {
      const card = myState.hand[move.handIndex];
      if (!card || card.type !== 'monster') break;
      
      const emptySlot = myState.field.findIndex(f => f === null);
      if (emptySlot === -1) break;
      
      myState.hand.splice(move.handIndex, 1);
      myState.field[emptySlot] = {
        card,
        position: move.position,
        canAttack: newState.turn > 1, // Can't attack on first turn
        hasAttacked: false,
      };
      myState.hasNormalSummoned = true;
      newState.lastAction = `Summoned ${card.name}`;
      break;
    }
    
    case 'set_monster': {
      const card = myState.hand[move.handIndex];
      if (!card || card.type !== 'monster') break;
      
      const emptySlot = myState.field.findIndex(f => f === null);
      if (emptySlot === -1) break;
      
      myState.hand.splice(move.handIndex, 1);
      myState.field[emptySlot] = {
        card,
        position: 'facedown',
        canAttack: false,
        hasAttacked: false,
      };
      myState.hasNormalSummoned = true;
      newState.lastAction = 'Set a monster';
      break;
    }
    
    case 'set_spelltrap': {
      const card = myState.hand[move.handIndex];
      if (!card || (card.type !== 'spell' && card.type !== 'trap')) break;
      
      const emptySlot = myState.spellTrap.findIndex(f => f === null);
      if (emptySlot === -1) break;
      
      myState.hand.splice(move.handIndex, 1);
      myState.spellTrap[emptySlot] = {
        card,
        position: 'facedown',
        canAttack: false,
        hasAttacked: false,
      };
      newState.lastAction = 'Set a card';
      break;
    }
    
    case 'activate_spell': {
      const card = myState.hand[move.handIndex];
      if (!card || card.type !== 'spell') break;
      
      // Process spell effect
      switch (card.id.split('_')[1]) {
        case 'heal':
          myState.lp = Math.min(8000, myState.lp + 1000);
          break;
        case 'draw':
          if (myState.deck.length >= 2) {
            myState.hand.push(myState.deck.shift()!);
            myState.hand.push(myState.deck.shift()!);
          }
          break;
        case 'destroy':
          // Destroy all monsters
          myState.field.forEach((f, i) => {
            if (f) {
              myState.graveyard.push(f.card);
              myState.field[i] = null;
            }
          });
          oppState.field.forEach((f, i) => {
            if (f) {
              oppState.graveyard.push(f.card);
              oppState.field[i] = null;
            }
          });
          break;
      }
      
      myState.hand.splice(move.handIndex, 1);
      myState.graveyard.push(card);
      newState.lastAction = `Activated ${card.name}`;
      break;
    }
    
    case 'attack': {
      const attacker = myState.field[move.attackerIndex];
      if (!attacker || attacker.hasAttacked) break;
      
      if (move.targetIndex === 'direct') {
        // Direct attack
        oppState.lp -= attacker.card.atk || 0;
        newState.lastAction = `${attacker.card.name} attacks directly for ${attacker.card.atk}!`;
      } else {
        const target = oppState.field[move.targetIndex];
        if (!target) break;
        
        const attackerAtk = attacker.card.atk || 0;
        const targetValue = target.position === 'defense' ? (target.card.def || 0) : (target.card.atk || 0);
        
        if (target.position === 'facedown') {
          target.position = 'defense'; // Flip face-up
        }
        
        if (target.position === 'defense') {
          // Attack defense position
          if (attackerAtk > targetValue) {
            oppState.graveyard.push(target.card);
            oppState.field[move.targetIndex] = null;
            newState.lastAction = `${attacker.card.name} destroyed ${target.card.name}!`;
          } else if (attackerAtk < targetValue) {
            myState.lp -= (targetValue - attackerAtk);
            newState.lastAction = `${attacker.card.name} attacked ${target.card.name} but took ${targetValue - attackerAtk} damage!`;
          }
        } else {
          // Battle
          if (attackerAtk > targetValue) {
            oppState.lp -= (attackerAtk - targetValue);
            oppState.graveyard.push(target.card);
            oppState.field[move.targetIndex] = null;
            newState.lastAction = `${attacker.card.name} destroyed ${target.card.name}! ${attackerAtk - targetValue} damage!`;
          } else if (attackerAtk < targetValue) {
            myState.lp -= (targetValue - attackerAtk);
            myState.graveyard.push(attacker.card);
            myState.field[move.attackerIndex] = null;
            newState.lastAction = `${target.card.name} destroyed ${attacker.card.name}! ${targetValue - attackerAtk} damage!`;
          } else {
            // Tie - both destroyed
            myState.graveyard.push(attacker.card);
            oppState.graveyard.push(target.card);
            myState.field[move.attackerIndex] = null;
            oppState.field[move.targetIndex] = null;
            newState.lastAction = `${attacker.card.name} and ${target.card.name} destroyed each other!`;
          }
        }
      }
      
      attacker.hasAttacked = true;
      
      // Check win condition
      if (oppState.lp <= 0) {
        newState.winner = currentPlayer;
      }
      break;
    }
    
    case 'next_phase': {
      if (newState.phase === 'main') {
        newState.phase = 'battle';
        newState.lastAction = 'Entered Battle Phase';
      }
      break;
    }
    
    case 'end_turn': {
      // Reset for next turn
      const nextPlayer = currentPlayer === 1 ? 2 : 1;
      const nextPlayerState = nextPlayer === 1 ? newState.player1 : newState.player2;
      
      nextPlayerState.hasNormalSummoned = false;
      nextPlayerState.hasDrawn = false;
      nextPlayerState.field.forEach(f => {
        if (f) {
          f.hasAttacked = false;
          f.canAttack = true;
        }
      });
      
      newState.currentPlayer = nextPlayer;
      newState.phase = 'draw';
      newState.turn += currentPlayer === 2 ? 1 : 0;
      newState.lastAction = `Player ${currentPlayer} ended their turn`;
      break;
    }
  }
  
  return newState;
}

export default AnimeCardBattle;
