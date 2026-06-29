import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Header } from "@/react-app/components/Header";
import { Footer } from "@/react-app/components/Footer";
import { Swords, Shield, Flame, Heart, Zap, Package, ArrowLeft, Play, Map, Globe, X } from "lucide-react";
import { useLanguage } from "@/react-app/contexts/LanguageContext";

// Character assets
const HUNTER_SPRITES = {
  idle: "/assets/hunter-idle.png",
  attack: "/assets/hunter-attack.png",
  hurt: "/assets/hunter-hurt.png",
  victory: "/assets/hunter-victory.png",
};

// Gameboy mascot icon component
function GameboyMascot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 140" className={className} fill="none">
      {/* Body */}
      <rect x="10" y="10" width="80" height="120" rx="10" fill="#E673AA" stroke="#C4609A" strokeWidth="3" />
      {/* Screen */}
      <rect x="20" y="20" width="60" height="45" rx="5" fill="#1a1a2e" stroke="#C4609A" strokeWidth="2" />
      {/* Screen content - starry sky */}
      <circle cx="30" cy="32" r="1.5" fill="#FFD700" />
      <circle cx="45" cy="28" r="1" fill="#fff" />
      <circle cx="55" cy="35" r="1.5" fill="#FFD700" />
      <circle cx="65" cy="30" r="1" fill="#fff" />
      <circle cx="38" cy="42" r="1" fill="#fff" />
      <circle cx="58" cy="45" r="1.5" fill="#FFD700" />
      <text x="50" y="55" textAnchor="middle" fill="#FFD700" fontSize="8" fontWeight="bold">RETRO</text>
      <text x="50" y="63" textAnchor="middle" fill="#FFD700" fontSize="8" fontWeight="bold">MYND</text>
      {/* D-pad */}
      <rect x="25" y="80" width="25" height="8" rx="2" fill="#4a4a4a" />
      <rect x="33" y="72" width="8" height="25" rx="2" fill="#4a4a4a" />
      {/* A/B buttons */}
      <circle cx="65" cy="82" r="8" fill="#FFD700" />
      <circle cx="78" cy="92" r="6" fill="#FFD700" />
      {/* Start/Select */}
      <rect x="35" y="105" width="12" height="4" rx="2" fill="#4a4a4a" />
      <rect x="52" y="105" width="12" height="4" rx="2" fill="#4a4a4a" />
      {/* Speaker lines */}
      <line x1="65" y1="110" x2="75" y2="110" stroke="#C4609A" strokeWidth="2" />
      <line x1="65" y1="115" x2="75" y2="115" stroke="#C4609A" strokeWidth="2" />
      <line x1="65" y1="120" x2="75" y2="120" stroke="#C4609A" strokeWidth="2" />
    </svg>
  );
}

// Game states
type GameScreen = "credits" | "menu" | "battle" | "victory" | "defeat" | "language";
type BattlePhase = "player_turn" | "player_action" | "enemy_turn" | "enemy_action";
type CharacterState = "idle" | "attack" | "hurt" | "victory";

interface Stats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
}

interface BattleLog {
  text: string;
  type: "player" | "enemy" | "system" | "critical";
}

interface Skill {
  name: string;
  mpCost: number;
  damage: number;
  icon: React.ReactNode;
  description: string;
}

// Available languages
const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "pt-BR", name: "Português", flag: "🇧🇷" },
];

// Skills
const SKILLS: Skill[] = [
  { name: "Cross Slash", mpCost: 10, damage: 35, icon: <Swords className="w-4 h-4" />, description: "A powerful X-shaped slash" },
  { name: "Shadow Strike", mpCost: 20, damage: 55, icon: <Zap className="w-4 h-4" />, description: "Strike from the shadows" },
  { name: "Crimson Fury", mpCost: 35, damage: 80, icon: <Flame className="w-4 h-4" />, description: "Unleash crimson flames" },
];

// Enemy data
const ENEMIES = [
  { name: "Shadow Wraith", hp: 120, attack: 18, defense: 8, color: "#4B0082" },
  { name: "Dark Knight", hp: 180, attack: 25, defense: 15, color: "#2F4F4F" },
  { name: "Nightmare Beast", hp: 250, attack: 30, defense: 12, color: "#8B0000" },
];

// Unlocked phases (would be saved to database in production)
// const UNLOCKED_PHASES = [1]; // Only phase 1 unlocked initially - TODO: implement phase system

export default function ShadowHunterPage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  
  const [gameScreen, setGameScreen] = useState<GameScreen>("credits");
  const [creditsOpacity, setCreditsOpacity] = useState(0);
  const [battlePhase, setBattlePhase] = useState<BattlePhase>("player_turn");
  const [playerState, setPlayerState] = useState<CharacterState>("idle");
  const [enemyState, setEnemyState] = useState<"idle" | "attack" | "hurt">("idle");
  
  const [playerStats, setPlayerStats] = useState<Stats>({
    hp: 100, maxHp: 100, mp: 50, maxMp: 50, attack: 25, defense: 12, speed: 15
  });
  
  const [currentEnemy, setCurrentEnemy] = useState(ENEMIES[0]);
  const [enemyHp, setEnemyHp] = useState(ENEMIES[0].hp);
  const [enemyLevel, setEnemyLevel] = useState(1);
  
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [showSkills, setShowSkills] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [potions, setPotions] = useState(3);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [damageNumber, setDamageNumber] = useState<{ value: number; target: "player" | "enemy" } | null>(null);

  // Credits animation
  useEffect(() => {
    if (gameScreen === "credits") {
      // Fade in
      const fadeIn = setTimeout(() => setCreditsOpacity(1), 100);
      // Show for 3 seconds then fade out
      const fadeOut = setTimeout(() => setCreditsOpacity(0), 3500);
      // Switch to menu
      const switchToMenu = setTimeout(() => {
        setGameScreen("menu");
      }, 4500);
      
      return () => {
        clearTimeout(fadeIn);
        clearTimeout(fadeOut);
        clearTimeout(switchToMenu);
      };
    }
  }, [gameScreen]);

  // Skip credits on click
  const skipCredits = () => {
    if (gameScreen === "credits") {
      setGameScreen("menu");
    }
  };

  // Add to battle log
  const addLog = useCallback((text: string, type: BattleLog["type"] = "system") => {
    setBattleLog(prev => [...prev.slice(-4), { text, type }]);
  }, []);

  // Calculate damage
  const calculateDamage = (attackPower: number, defense: number, _isSkill: boolean = false) => {
    const base = attackPower - defense / 2;
    const variance = Math.random() * 0.2 + 0.9;
    const criticalChance = Math.random();
    const isCritical = criticalChance < 0.15;
    let damage = Math.max(1, Math.floor(base * variance));
    if (isCritical) damage = Math.floor(damage * 1.5);
    return { damage, isCritical };
  };

  // Player attack
  const playerAttack = useCallback((skillDamage?: number) => {
    if (battlePhase !== "player_turn") return;
    setBattlePhase("player_action");
    setPlayerState("attack");
    setShowSkills(false);
    setShowItems(false);

    setTimeout(() => {
      const attackPower = skillDamage || playerStats.attack;
      const { damage, isCritical } = calculateDamage(attackPower, currentEnemy.defense, !!skillDamage);
      
      setEnemyState("hurt");
      setShakeEnemy(true);
      setDamageNumber({ value: damage, target: "enemy" });
      
      const newHp = Math.max(0, enemyHp - damage);
      setEnemyHp(newHp);
      
      if (isCritical) {
        addLog(`CRITICAL HIT! ${damage} damage!`, "critical");
      } else {
        addLog(`Hunter deals ${damage} damage!`, "player");
      }

      setTimeout(() => {
        setShakeEnemy(false);
        setDamageNumber(null);
        setEnemyState("idle");
        setPlayerState("idle");

        if (newHp <= 0) {
          setPlayerState("victory");
          setGameScreen("victory");
          addLog(`${currentEnemy.name} defeated!`, "system");
        } else {
          setBattlePhase("enemy_turn");
          setTimeout(() => enemyAttack(), 800);
        }
      }, 600);
    }, 400);
  }, [battlePhase, playerStats, currentEnemy, enemyHp, addLog]);

  // Use skill
  const useSkill = useCallback((skill: Skill) => {
    if (playerStats.mp < skill.mpCost) {
      addLog("Not enough MP!", "system");
      return;
    }
    setPlayerStats(prev => ({ ...prev, mp: prev.mp - skill.mpCost }));
    addLog(`Hunter uses ${skill.name}!`, "player");
    playerAttack(skill.damage);
  }, [playerStats.mp, playerAttack, addLog]);

  // Use potion
  const usePotion = useCallback(() => {
    if (potions <= 0) {
      addLog("No potions left!", "system");
      return;
    }
    if (playerStats.hp >= playerStats.maxHp) {
      addLog("HP is already full!", "system");
      return;
    }
    
    const healAmount = 40;
    setPotions(prev => prev - 1);
    setPlayerStats(prev => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + healAmount)
    }));
    addLog(`Healed ${healAmount} HP!`, "player");
    setShowItems(false);
    
    setBattlePhase("enemy_turn");
    setTimeout(() => enemyAttack(), 800);
  }, [potions, playerStats, addLog]);

  // Enemy attack
  const enemyAttack = useCallback(() => {
    setBattlePhase("enemy_action");
    setEnemyState("attack");
    
    setTimeout(() => {
      const { damage, isCritical } = calculateDamage(currentEnemy.attack, playerStats.defense);
      
      setPlayerState("hurt");
      setShakePlayer(true);
      setDamageNumber({ value: damage, target: "player" });
      
      const newHp = Math.max(0, playerStats.hp - damage);
      setPlayerStats(prev => ({ ...prev, hp: newHp }));
      
      if (isCritical) {
        addLog(`CRITICAL! ${currentEnemy.name} deals ${damage}!`, "critical");
      } else {
        addLog(`${currentEnemy.name} attacks for ${damage}!`, "enemy");
      }

      setTimeout(() => {
        setShakePlayer(false);
        setDamageNumber(null);
        setEnemyState("idle");
        setPlayerState("idle");

        if (newHp <= 0) {
          setPlayerState("hurt");
          setGameScreen("defeat");
          addLog("You have been defeated...", "system");
        } else {
          setBattlePhase("player_turn");
        }
      }, 600);
    }, 400);
  }, [currentEnemy, playerStats.defense, addLog]);

  // Start battle
  const startBattle = useCallback(() => {
    const enemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
    setCurrentEnemy(enemy);
    setEnemyHp(enemy.hp);
    setPlayerStats({ hp: 100, maxHp: 100, mp: 50, maxMp: 50, attack: 25, defense: 12, speed: 15 });
    setPotions(3);
    setBattleLog([]);
    setPlayerState("idle");
    setEnemyState("idle");
    setBattlePhase("player_turn");
    setGameScreen("battle");
    addLog(`A wild ${enemy.name} appears!`, "system");
  }, [addLog]);

  // Next battle
  const nextBattle = useCallback(() => {
    setEnemyLevel(prev => prev + 1);
    const enemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
    const scaledEnemy = {
      ...enemy,
      hp: Math.floor(enemy.hp * (1 + enemyLevel * 0.2)),
      attack: Math.floor(enemy.attack * (1 + enemyLevel * 0.15)),
    };
    setCurrentEnemy(scaledEnemy);
    setEnemyHp(scaledEnemy.hp);
    setPlayerStats(prev => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + 30),
      mp: Math.min(prev.maxMp, prev.mp + 15),
    }));
    setPotions(prev => Math.min(5, prev + 1));
    setBattleLog([]);
    setPlayerState("idle");
    setEnemyState("idle");
    setBattlePhase("player_turn");
    setGameScreen("battle");
    addLog(`Level ${enemyLevel + 1}: ${scaledEnemy.name} appears!`, "system");
  }, [enemyLevel, addLog]);

  // Exit game
  const exitGame = () => {
    navigate("/arcade");
  };

  // Preload images
  useEffect(() => {
    Object.values(HUNTER_SPRITES).forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* === CREDITS SCREEN === */}
      {gameScreen === "credits" && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-pointer"
          onClick={skipCredits}
        >
          <div 
            className="flex items-center gap-6 px-8 py-6 rounded-xl transition-opacity duration-1000"
            style={{ 
              opacity: creditsOpacity,
              border: "2px solid #EC4899",
              boxShadow: "0 0 30px rgba(236, 72, 153, 0.4), inset 0 0 30px rgba(236, 72, 153, 0.1)",
              background: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <GameboyMascot className="w-20 h-28" />
            <div className="text-center">
              <h1 
                className="text-3xl md:text-4xl font-bold text-white"
                style={{ fontFamily: "'VT323', monospace", letterSpacing: "0.1em" }}
              >
                retromynd team
              </h1>
            </div>
          </div>
          <p 
            className="absolute bottom-8 text-gray-500 text-sm animate-pulse"
            style={{ opacity: creditsOpacity }}
          >
            Click to skip
          </p>
        </div>
      )}

      {/* === MAIN MENU === */}
      {gameScreen === "menu" && (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0a0a15] via-[#1a1a2e] to-[#0a0a15]">
          <Header />
          <main className="flex-1 flex items-center justify-center p-4">
            <div 
              className="relative w-full max-w-2xl rounded-2xl overflow-hidden p-8"
              style={{
                background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)",
                boxShadow: "0 0 60px rgba(218, 165, 32, 0.2), inset 0 0 60px rgba(0,0,0,0.5)",
                border: "3px solid #DAA520",
              }}
            >
              {/* Golden corners */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#DAA520]" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#DAA520]" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#DAA520]" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#DAA520]" />

              {/* Title */}
              <h1 
                className="text-5xl md:text-6xl font-bold mb-8 text-center"
                style={{
                  fontFamily: "'VT323', monospace",
                  background: "linear-gradient(180deg, #FFD700 0%, #DAA520 50%, #8B4513 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 0 40px rgba(218, 165, 32, 0.5)",
                }}
              >
                SHADOW HUNTER
              </h1>

              {/* Character preview */}
              <div className="relative mb-8 mx-auto" style={{ maxWidth: "200px" }}>
                <img 
                  src={HUNTER_SPRITES.idle}
                  alt="Victorian Hunter"
                  className="w-full h-auto"
                  style={{ 
                    filter: "drop-shadow(0 0 30px rgba(139, 0, 0, 0.5))",
                    animation: "float 3s ease-in-out infinite",
                  }}
                />
              </div>

              {/* Menu buttons */}
              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                {/* Start */}
                <button
                  onClick={startBattle}
                  className="flex items-center justify-center gap-3 px-8 py-4 text-xl font-bold text-black rounded-xl transition-all hover:scale-105 active:scale-95"
                  style={{
                    fontFamily: "'VT323', monospace",
                    background: "linear-gradient(180deg, #FFD700 0%, #DAA520 100%)",
                    boxShadow: "0 4px 20px rgba(218, 165, 32, 0.5), inset 0 2px 0 rgba(255,255,255,0.3)",
                  }}
                >
                  <Play className="w-6 h-6" />
                  START
                </button>

                {/* Phases */}
                <button
                  className="flex items-center justify-center gap-3 px-8 py-4 text-xl font-bold rounded-xl transition-all hover:scale-105 active:scale-95 text-gray-400 cursor-not-allowed"
                  style={{
                    fontFamily: "'VT323', monospace",
                    background: "linear-gradient(180deg, #3a3a4a 0%, #2a2a3a 100%)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                  }}
                  disabled
                >
                  <Map className="w-6 h-6" />
                  PHASES
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">🔒</span>
                </button>

                {/* Language */}
                <button
                  onClick={() => setGameScreen("language")}
                  className="flex items-center justify-center gap-3 px-8 py-4 text-xl font-bold text-white rounded-xl transition-all hover:scale-105 active:scale-95"
                  style={{
                    fontFamily: "'VT323', monospace",
                    background: "linear-gradient(180deg, #4B0082 0%, #2D004D 100%)",
                    boxShadow: "0 4px 20px rgba(75, 0, 130, 0.5)",
                  }}
                >
                  <Globe className="w-6 h-6" />
                  {LANGUAGES.find(l => l.code === language)?.flag || "🌐"} LANGUAGE
                </button>

                {/* Exit */}
                <button
                  onClick={exitGame}
                  className="flex items-center justify-center gap-3 px-8 py-4 text-xl font-bold text-white rounded-xl transition-all hover:scale-105 active:scale-95"
                  style={{
                    fontFamily: "'VT323', monospace",
                    background: "linear-gradient(180deg, #8B0000 0%, #4A0000 100%)",
                    boxShadow: "0 4px 20px rgba(139, 0, 0, 0.5)",
                  }}
                >
                  <X className="w-6 h-6" />
                  EXIT
                </button>
              </div>

              <style>{`
                @keyframes float {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-10px); }
                }
              `}</style>
            </div>
          </main>
          <Footer />
        </div>
      )}

      {/* === LANGUAGE SELECTION === */}
      {gameScreen === "language" && (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0a0a15] via-[#1a1a2e] to-[#0a0a15]">
          <Header />
          <main className="flex-1 flex items-center justify-center p-4">
            <div 
              className="relative w-full max-w-lg rounded-2xl overflow-hidden p-8"
              style={{
                background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)",
                boxShadow: "0 0 60px rgba(75, 0, 130, 0.3)",
                border: "3px solid #8B5CF6",
              }}
            >
              <h2 
                className="text-3xl font-bold mb-6 text-center text-purple-400"
                style={{ fontFamily: "'VT323', monospace" }}
              >
                SELECT LANGUAGE
              </h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as "en" | "es" | "fr" | "de" | "ja" | "pt-BR");
                      setGameScreen("menu");
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all hover:scale-105 ${
                      language === lang.code
                        ? "bg-purple-600 text-white ring-2 ring-purple-400"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setGameScreen("menu")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold transition-all"
              >
                <ArrowLeft className="w-5 h-5" /> BACK
              </button>
            </div>
          </main>
          <Footer />
        </div>
      )}

      {/* === BATTLE SCREEN === */}
      {gameScreen === "battle" && (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0a0a15] via-[#1a1a2e] to-[#0a0a15]">
          <Header />
          <main className="flex-1 flex items-center justify-center p-4">
            <div 
              className="relative w-full max-w-5xl rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)",
                boxShadow: "0 0 60px rgba(218, 165, 32, 0.2), inset 0 0 60px rgba(0,0,0,0.5)",
                border: "3px solid #DAA520",
              }}
            >
              {/* Golden corners */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#DAA520]" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#DAA520]" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#DAA520]" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#DAA520]" />

              <div className="p-4 md:p-6">
                {/* Battle Arena */}
                <div 
                  className="relative h-[400px] md:h-[450px] rounded-xl mb-4 overflow-hidden"
                  style={{
                    background: "linear-gradient(180deg, #2a1a3a 0%, #1a1a2e 50%, #0f0f1a 100%)",
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: "radial-gradient(circle at 50% 0%, rgba(139,0,0,0.3) 0%, transparent 50%)",
                    }}
                  />

                  {/* Enemy section */}
                  <div className="absolute top-4 right-4 md:right-8 text-right z-10">
                    <p className="text-gray-400 text-sm">Level {enemyLevel}</p>
                    <h3 className="text-xl font-bold text-red-400" style={{ fontFamily: "'VT323', monospace" }}>
                      {currentEnemy.name}
                    </h3>
                    <div className="w-48 h-4 bg-black/60 rounded-full overflow-hidden border border-red-900/50 mt-1">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{ 
                          width: `${(enemyHp / currentEnemy.hp) * 100}%`,
                          background: "linear-gradient(90deg, #8B0000, #DC143C)",
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{enemyHp} / {currentEnemy.hp}</p>
                  </div>

                  {/* Enemy sprite */}
                  <div 
                    className={`absolute top-16 right-8 md:right-20 transition-all duration-200 ${shakeEnemy ? "animate-shake" : ""}`}
                    style={{ transform: enemyState === "attack" ? "translateX(-30px) scale(1.1)" : "scale(1)" }}
                  >
                    <div 
                      className="w-32 h-48 md:w-40 md:h-56 rounded-lg transition-all"
                      style={{
                        background: `linear-gradient(180deg, ${currentEnemy.color} 0%, #0a0a0f 100%)`,
                        boxShadow: `0 0 40px ${currentEnemy.color}`,
                        opacity: enemyState === "hurt" ? 0.5 : 1,
                        clipPath: "polygon(20% 0%, 80% 0%, 100% 20%, 100% 100%, 0% 100%, 0% 20%)",
                      }}
                    >
                      <div className="flex justify-center gap-4 pt-8">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                    {damageNumber && damageNumber.target === "enemy" && (
                      <div 
                        className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl font-bold text-red-400 animate-bounce"
                        style={{ fontFamily: "'VT323', monospace", textShadow: "0 0 10px #ff0000" }}
                      >
                        -{damageNumber.value}
                      </div>
                    )}
                  </div>

                  {/* Player sprite */}
                  <div 
                    className={`absolute bottom-4 left-4 md:left-12 transition-all duration-200 ${shakePlayer ? "animate-shake" : ""}`}
                    style={{ 
                      transform: playerState === "attack" ? "translateX(50px) scale(1.05)" : "scale(1)",
                    }}
                  >
                    <img 
                      src={HUNTER_SPRITES[playerState]}
                      alt="Hunter"
                      className="w-40 h-auto md:w-52 transition-all duration-300"
                      style={{ 
                        filter: playerState === "hurt" ? "brightness(1.5) saturate(0.5)" : "drop-shadow(0 0 20px rgba(139,0,0,0.5))",
                        transform: "scaleX(-1)",
                      }}
                    />
                    {damageNumber && damageNumber.target === "player" && (
                      <div 
                        className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl font-bold text-red-400 animate-bounce"
                        style={{ fontFamily: "'VT323', monospace", textShadow: "0 0 10px #ff0000" }}
                      >
                        -{damageNumber.value}
                      </div>
                    )}
                  </div>

                  {/* Player stats */}
                  <div className="absolute bottom-4 left-4 md:left-52">
                    <h3 className="text-lg font-bold text-yellow-400 mb-1" style={{ fontFamily: "'VT323', monospace" }}>
                      HUNTER
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <div className="w-32 h-3 bg-black/60 rounded-full overflow-hidden border border-red-900/30">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${(playerStats.hp / playerStats.maxHp) * 100}%`,
                            background: "linear-gradient(90deg, #DC143C, #FF6B6B)",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{playerStats.hp}/{playerStats.maxHp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <div className="w-32 h-3 bg-black/60 rounded-full overflow-hidden border border-blue-900/30">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${(playerStats.mp / playerStats.maxMp) * 100}%`,
                            background: "linear-gradient(90deg, #4169E1, #87CEEB)",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{playerStats.mp}/{playerStats.maxMp}</span>
                    </div>
                  </div>

                  {/* Battle phase indicator */}
                  <div className="absolute top-4 left-4">
                    <div 
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        battlePhase === "player_turn" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
                      }`}
                    >
                      {battlePhase === "player_turn" ? "YOUR TURN" : 
                       battlePhase === "enemy_turn" ? "ENEMY TURN" : "..."}
                    </div>
                  </div>
                </div>

                {/* Battle Log */}
                <div className="bg-black/40 rounded-lg p-3 mb-4 h-20 overflow-y-auto border border-gray-800">
                  {battleLog.map((log, i) => (
                    <p 
                      key={i}
                      className={`text-sm ${
                        log.type === "player" ? "text-green-400" :
                        log.type === "enemy" ? "text-red-400" :
                        log.type === "critical" ? "text-yellow-400 font-bold" :
                        "text-gray-400"
                      }`}
                    >
                      {log.text}
                    </p>
                  ))}
                </div>

                {/* Action Menu */}
                {battlePhase === "player_turn" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {!showSkills && !showItems && (
                      <>
                        <button
                          onClick={() => playerAttack()}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-b from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-bold transition-all border border-red-600/50"
                        >
                          <Swords className="w-5 h-5" /> ATTACK
                        </button>
                        <button
                          onClick={() => setShowSkills(true)}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-b from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold transition-all border border-blue-600/50"
                        >
                          <Flame className="w-5 h-5" /> SKILLS
                        </button>
                        <button
                          onClick={() => setShowItems(true)}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-b from-green-800 to-green-900 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold transition-all border border-green-600/50"
                        >
                          <Package className="w-5 h-5" /> ITEMS
                        </button>
                        <button
                          onClick={() => setGameScreen("menu")}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-bold transition-all border border-gray-600/50"
                        >
                          <Shield className="w-5 h-5" /> FLEE
                        </button>
                      </>
                    )}

                    {showSkills && (
                      <>
                        <button
                          onClick={() => setShowSkills(false)}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold transition-all"
                        >
                          <ArrowLeft className="w-5 h-5" /> BACK
                        </button>
                        {SKILLS.map((skill, i) => (
                          <button
                            key={i}
                            onClick={() => useSkill(skill)}
                            disabled={playerStats.mp < skill.mpCost}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all text-sm ${
                              playerStats.mp >= skill.mpCost
                                ? "bg-gradient-to-b from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-white border border-purple-600/50"
                                : "bg-gray-800 text-gray-500 cursor-not-allowed"
                            }`}
                            title={skill.description}
                          >
                            {skill.icon} {skill.name} ({skill.mpCost} MP)
                          </button>
                        ))}
                      </>
                    )}

                    {showItems && (
                      <>
                        <button
                          onClick={() => setShowItems(false)}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold transition-all"
                        >
                          <ArrowLeft className="w-5 h-5" /> BACK
                        </button>
                        <button
                          onClick={usePotion}
                          disabled={potions <= 0}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
                            potions > 0
                              ? "bg-gradient-to-b from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white border border-emerald-600/50"
                              : "bg-gray-800 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          <Heart className="w-5 h-5" /> Potion x{potions}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {(battlePhase === "player_action" || battlePhase === "enemy_action" || battlePhase === "enemy_turn") && (
                  <div className="text-center py-4">
                    <div className="inline-block w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                <style>{`
                  @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                  }
                  .animate-shake {
                    animation: shake 0.2s ease-in-out 2;
                  }
                `}</style>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      )}

      {/* === VICTORY SCREEN === */}
      {gameScreen === "victory" && (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0a0a15] via-[#1a1a2e] to-[#0a0a15]">
          <Header />
          <main className="flex-1 flex items-center justify-center p-4">
            <div 
              className="relative w-full max-w-xl rounded-2xl overflow-hidden p-8 text-center"
              style={{
                background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)",
                boxShadow: "0 0 60px rgba(218, 165, 32, 0.3)",
                border: "3px solid #DAA520",
              }}
            >
              <h2 
                className="text-4xl md:text-6xl font-bold mb-4 text-yellow-400"
                style={{ fontFamily: "'VT323', monospace", textShadow: "0 0 30px rgba(218, 165, 32, 0.8)" }}
              >
                VICTORY!
              </h2>
              
              <div className="relative mb-8 mx-auto" style={{ maxWidth: "200px" }}>
                <img 
                  src={HUNTER_SPRITES.victory}
                  alt="Victory"
                  className="w-full h-auto"
                  style={{ filter: "drop-shadow(0 0 30px rgba(218, 165, 32, 0.5))" }}
                />
              </div>

              <p className="text-gray-400 mb-6">Level {enemyLevel} completed!</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={nextBattle}
                  className="px-8 py-3 text-xl font-bold text-black rounded-xl transition-all hover:scale-105"
                  style={{
                    fontFamily: "'VT323', monospace",
                    background: "linear-gradient(180deg, #FFD700 0%, #DAA520 100%)",
                    boxShadow: "0 4px 20px rgba(218, 165, 32, 0.5)",
                  }}
                >
                  NEXT BATTLE
                </button>
                <button
                  onClick={() => setGameScreen("menu")}
                  className="px-8 py-3 text-xl font-bold text-white rounded-xl transition-all hover:scale-105 bg-gray-800 hover:bg-gray-700"
                  style={{ fontFamily: "'VT323', monospace" }}
                >
                  MAIN MENU
                </button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      )}

      {/* === DEFEAT SCREEN === */}
      {gameScreen === "defeat" && (
        <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0a0a15] via-[#1a1a2e] to-[#0a0a15]">
          <Header />
          <main className="flex-1 flex items-center justify-center p-4">
            <div 
              className="relative w-full max-w-xl rounded-2xl overflow-hidden p-8 text-center"
              style={{
                background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)",
                boxShadow: "0 0 60px rgba(139, 0, 0, 0.3)",
                border: "3px solid #8B0000",
              }}
            >
              <h2 
                className="text-4xl md:text-6xl font-bold mb-4 text-red-500"
                style={{ fontFamily: "'VT323', monospace", textShadow: "0 0 30px rgba(139, 0, 0, 0.8)" }}
              >
                DEFEAT
              </h2>
              
              <div className="relative mb-8 mx-auto opacity-60" style={{ maxWidth: "200px" }}>
                <img 
                  src={HUNTER_SPRITES.hurt}
                  alt="Defeat"
                  className="w-full h-auto grayscale"
                  style={{ filter: "drop-shadow(0 0 30px rgba(139, 0, 0, 0.5)) grayscale(50%)" }}
                />
              </div>

              <p className="text-gray-400 mb-6">You reached level {enemyLevel}</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setEnemyLevel(1);
                    startBattle();
                  }}
                  className="px-8 py-3 text-xl font-bold text-white rounded-xl transition-all hover:scale-105"
                  style={{
                    fontFamily: "'VT323', monospace",
                    background: "linear-gradient(180deg, #DC143C 0%, #8B0000 100%)",
                    boxShadow: "0 4px 20px rgba(139, 0, 0, 0.5)",
                  }}
                >
                  TRY AGAIN
                </button>
                <button
                  onClick={() => setGameScreen("menu")}
                  className="px-8 py-3 text-xl font-bold text-white rounded-xl transition-all hover:scale-105 bg-gray-800 hover:bg-gray-700"
                  style={{ fontFamily: "'VT323', monospace" }}
                >
                  MAIN MENU
                </button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      )}
    </div>
  );
}
