import { ArrowRight, Volume2, Star as StarIcon } from "lucide-react";
import { Link } from "react-router";
import { RetroTV } from "./RetroTV";
import { useLanguage } from "@/react-app/contexts/LanguageContext";

// Blue diamond SVG component with rotation
function BlueDiamond({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="none"
    >
      {/* Diamond shape with gradient */}
      <defs>
        <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="30%" stopColor="#0099ff" />
          <stop offset="60%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#66e0ff" />
        </linearGradient>
        <linearGradient id="diamondShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Main diamond body */}
      <polygon 
        points="12,2 22,9 12,22 2,9" 
        fill="url(#diamondGradient)"
        stroke="#00d4ff"
        strokeWidth="0.5"
      />
      {/* Top facet */}
      <polygon 
        points="12,2 22,9 12,9 2,9" 
        fill="url(#diamondGradient)"
        opacity="0.9"
      />
      {/* Shine highlight */}
      <polygon 
        points="12,2 7,9 12,9" 
        fill="url(#diamondShine)"
      />
      {/* Inner facet lines */}
      <line x1="12" y1="2" x2="12" y2="22" stroke="#66e0ff" strokeWidth="0.3" opacity="0.5" />
      <line x1="2" y1="9" x2="22" y2="9" stroke="#66e0ff" strokeWidth="0.3" opacity="0.5" />
      <line x1="12" y1="9" x2="22" y2="9" stroke="#ffffff" strokeWidth="0.3" opacity="0.3" />
    </svg>
  );
}



export function HeroBanner() {
  const { t } = useLanguage();
  return (
    <section className="py-6 lg:py-8">
      <div className="container mx-auto px-4">
        {/* Main hero panel */}
        <div className="panel-raised p-0 overflow-hidden">
          {/* Title bar like Windows 95 */}
          <div className="title-bar">
            <div className="flex items-center gap-2">
              <Volume2 size={14} />
              <span>{t("hero.titleBar")}</span>
            </div>
            <div className="flex gap-1">
              <button className="w-4 h-4 bg-retro-panel border border-retro-darker text-xs leading-none">_</button>
              <button className="w-4 h-4 bg-retro-panel border border-retro-darker text-xs leading-none">□</button>
              <button className="w-4 h-4 bg-retro-panel border border-retro-darker text-xs leading-none">×</button>
            </div>
          </div>
          
          {/* Content area */}
          <div className="p-5 lg:p-8">
            <div className="grid lg:grid-cols-2 gap-6 items-center">
              {/* Text content */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 btn-gold px-3 py-1.5 mb-4">
                  <StarIcon size={14} />
                  <span className="text-xs font-bold">{t("hero.asSeenOnTv")}</span>
                </div>
                
                {/* Two side-by-side Windows 95 panels */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-4" style={{ overflow: 'visible' }}>
                  {/* Level Up Your Life panel */}
                  <div className="panel-raised flex-1">
                    <div className="title-bar py-1 px-2">
                      <span className="text-xs">message.exe</span>
                    </div>
                    <div className="p-3 flex flex-col items-center justify-center">
                      <span className="font-pixel text-xl sm:text-2xl font-bold text-retro-black text-center">
                        {t("hero.blastOff")}
                      </span>
                      <span className="font-pixel text-xl sm:text-2xl font-bold text-retro-black text-center">
                        {t("hero.intoStyle")}
                      </span>
                    </div>
                  </div>
                  
                  {/* Join the Crew panel with particle effects */}
                  <Link to="/retropass" className="flex-1 group relative" style={{ overflow: 'visible' }}>
                    {/* Comet tail particles that exit the panel */}
                    <span className="absolute inset-0 pointer-events-none z-10" style={{ overflow: 'visible' }}>
                      {/* Main comet trail */}
                      <span 
                        className="absolute h-[3px] rounded-full"
                        style={{
                          width: '80px',
                          top: '50%',
                          right: '-20px',
                          transform: 'translateY(-50%)',
                          background: 'linear-gradient(to right, rgba(0, 212, 255, 0.8), rgba(0, 153, 255, 0.4), transparent)',
                          animation: 'cometTail 1.5s ease-out infinite',
                          boxShadow: '0 0 10px rgba(0, 212, 255, 0.6), 0 0 20px rgba(0, 153, 255, 0.4)',
                        }}
                      />
                      {/* Sparkle particles exiting right */}
                      <span 
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          top: '35%',
                          right: '-10px',
                          background: 'radial-gradient(circle, #00d4ff 0%, transparent 70%)',
                          animation: 'sparkleExit 2s ease-out infinite',
                          boxShadow: '0 0 8px 2px rgba(0, 212, 255, 0.9)',
                        }}
                      />
                      <span 
                        className="absolute w-3 h-3 rounded-full"
                        style={{
                          top: '55%',
                          right: '-15px',
                          background: 'radial-gradient(circle, #66e0ff 0%, transparent 70%)',
                          animation: 'sparkleExit 2s ease-out infinite 0.3s',
                          boxShadow: '0 0 10px 3px rgba(102, 224, 255, 0.8)',
                        }}
                      />
                      <span 
                        className="absolute w-1.5 h-1.5 rounded-full"
                        style={{
                          top: '45%',
                          right: '-8px',
                          background: 'radial-gradient(circle, #ffffff 0%, #00d4ff 50%, transparent 70%)',
                          animation: 'sparkleExit 2s ease-out infinite 0.6s',
                          boxShadow: '0 0 6px 2px rgba(255, 255, 255, 0.9)',
                        }}
                      />
                      <span 
                        className="absolute w-2.5 h-2.5 rounded-full"
                        style={{
                          top: '65%',
                          right: '-12px',
                          background: 'radial-gradient(circle, #0099ff 0%, transparent 70%)',
                          animation: 'sparkleExit 2s ease-out infinite 0.9s',
                          boxShadow: '0 0 8px 2px rgba(0, 153, 255, 0.8)',
                        }}
                      />
                    </span>
                    
                    {/* Outer glow pulse */}
                    <span 
                      className="absolute inset-0 rounded pointer-events-none"
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.4) 0%, transparent 70%)',
                        animation: 'glowPulse 2s ease-in-out infinite',
                      }}
                    />
                    
                    <div 
                      className="panel-raised h-full transition-transform hover:scale-[1.02] relative"
                      style={{
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3)',
                      }}
                    >
                      <div className="title-bar py-1 px-2" style={{ background: 'linear-gradient(90deg, #ffd700, #ffb347)' }}>
                        <span className="text-xs text-black font-bold">retropass.exe</span>
                      </div>
                      <div 
                        className="py-8 px-3 flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 25%, #ffd700 50%, #fff8dc 75%, #ffd700 100%)',
                          backgroundSize: '200% 200%',
                          animation: 'shimmer 3s ease-in-out infinite',
                        }}
                      >
                        <span style={{ filter: 'drop-shadow(0 0 6px rgba(0, 212, 255, 1))' }}>
                          <BlueDiamond className="w-5 h-5 sm:w-6 sm:h-6" />
                        </span>
                        <span className="font-pixel text-xl sm:text-2xl font-bold text-black text-center" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                          {t("hero.joinTheCrew") || "JOIN THE CREW"}
                        </span>
                        <span style={{ filter: 'drop-shadow(0 0 6px rgba(0, 212, 255, 1))' }}>
                          <BlueDiamond className="w-5 h-5 sm:w-6 sm:h-6" />
                        </span>
                      </div>
                    </div>
                    
                    {/* CSS Keyframes */}
                    <style>{`
                      @keyframes shimmer {
                        0%, 100% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                      }
                      @keyframes glowPulse {
                        0%, 100% { opacity: 0.4; transform: scale(1); }
                        50% { opacity: 0.7; transform: scale(1.05); }
                      }
                      @keyframes cometTail {
                        0% { opacity: 0; width: 0; right: -20px; }
                        20% { opacity: 1; width: 60px; }
                        80% { opacity: 0.8; width: 100px; }
                        100% { opacity: 0; width: 120px; right: -140px; }
                      }
                      @keyframes sparkleExit {
                        0% { opacity: 0; transform: translateX(0) scale(0); }
                        10% { opacity: 1; transform: translateX(0) scale(1); }
                        80% { opacity: 0.8; }
                        100% { opacity: 0; transform: translateX(80px) scale(0.3); }
                      }
                    `}</style>
                  </Link>
                </div>
                
                {/* Subtitle in panel */}
                <div className="panel-inset p-3 mb-5">
                  <p className="text-sm text-retro-black">
                    {t("hero.discover")}
                  </p>
                </div>
                
                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-2 justify-center lg:justify-start flex-wrap">
                  <Link to="/shop" className="btn-gold px-6 py-3 font-bold text-base flex items-center justify-center gap-2">
                    {t("hero.loadInventory") || "LOAD INVENTORY"}
                    <ArrowRight size={18} />
                  </Link>
                  <button className="btn-retro px-6 py-3 font-bold text-base">
                    {t("hero.viewLookbook")}
                  </button>
                </div>
                
              </div>
              
              {/* Hero TV area */}
              <div className="relative flex items-center justify-center">
                <RetroTV 
                  videoUrl="https://i.imgur.com/Qy4zMit.mp4"
                  className="w-full max-w-sm"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Call now banner */}
        <div className="mt-6 panel-raised">
          <div className="title-bar text-center justify-center">
            <span className="animate-blink">📞</span>
            <span className="mx-4">{t("hero.callNow")}</span>
            <span className="animate-blink">📞</span>
          </div>
        </div>
      </div>
    </section>
  );
}
