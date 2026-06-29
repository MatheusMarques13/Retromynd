import { useRef, useCallback, useEffect, useState } from "react";
import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";

interface RetroTVProps {
  videoUrl: string;
  className?: string;
}

export function RetroTV({ videoUrl, className = "" }: RetroTVProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Initialize video on mount
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().catch(() => {});
    }
  }, []);

  // Handle body overflow for fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  }, []);

  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFullscreen(prev => !prev);
  }, []);

  return (
    <>
      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[9998]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(20,10,30,0.98) 0%, rgba(0,0,0,0.99) 100%)'
          }}
          onClick={() => toggleFullscreen()}
        />
      )}
      
      {/* Single TV container that transforms for fullscreen */}
      <div 
        ref={containerRef}
        className={
          isFullscreen 
            ? 'fixed inset-0 z-[9999] flex items-center justify-center p-6 sm:p-12' 
            : `relative ${className}`
        }
      >
        {/* Close button for fullscreen */}
        {isFullscreen && (
          <button
            onClick={() => toggleFullscreen()}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          >
            <Minimize2 className="w-6 h-6 text-white" />
          </button>
        )}
        
        <div className={`relative ${isFullscreen ? 'w-full max-w-5xl' : 'w-full'}`}>
          {/* TV Frame - outer shell */}
          <div 
            className={`relative rounded-2xl ${isFullscreen ? 'p-4 sm:p-6' : 'p-3 sm:p-4'}`}
            style={{
              background: 'linear-gradient(145deg, #4a4a4a 0%, #2a2a2a 50%, #1a1a1a 100%)',
              boxShadow: `
                inset 2px 2px 4px rgba(255,255,255,0.1),
                inset -2px -2px 4px rgba(0,0,0,0.3),
                0 8px 32px rgba(0,0,0,0.4),
                0 2px 8px rgba(0,0,0,0.3)
              `
            }}
          >
            {/* Inner bezel */}
            <div 
              className={`relative rounded-xl ${isFullscreen ? 'p-3 sm:p-4' : 'p-2 sm:p-3'}`}
              style={{
                background: 'linear-gradient(180deg, #3d3d3d 0%, #2d2d2d 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {/* Screen frame */}
              <div 
                className="relative overflow-hidden"
                style={{
                  borderRadius: '8px',
                  boxShadow: `
                    inset 0 0 20px rgba(0,0,0,0.8),
                    inset 0 0 60px rgba(0,0,0,0.4)
                  `
                }}
              >
                {/* CRT curvature overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{
                    background: `radial-gradient(ellipse 120% 120% at 50% 50%, transparent 50%, rgba(0,0,0,0.3) 100%)`,
                    borderRadius: '8px'
                  }}
                />
                
                {/* Scanlines */}
                <div 
                  className="absolute inset-0 pointer-events-none z-10 opacity-30"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
                    mixBlendMode: 'multiply'
                  }}
                />
                
                {/* Screen glow */}
                <div 
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    boxShadow: 'inset 0 0 30px rgba(100,200,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                
                {/* Single video element - never recreated */}
                <video
                  ref={videoRef}
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full aspect-[4/3] object-cover bg-black"
                  style={{
                    filter: 'contrast(1.1) saturate(1.2) brightness(0.95)'
                  }}
                />
                
                {/* Screen reflection */}
                <div 
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, transparent 100%)',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>
            
            {/* Bottom panel */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className={`px-3 py-1 rounded font-bold tracking-wider ${isFullscreen ? 'text-sm' : 'text-xs'}`}
                  style={{
                    background: 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)',
                    color: '#333',
                    boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.5), inset -1px -1px 2px rgba(0,0,0,0.3)'
                  }}
                >
                  RETROMYND
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className={`p-2 rounded transition-all hover:bg-white/10 flex items-center gap-1 ${isFullscreen ? 'px-3' : ''}`}
                  style={{
                    background: 'linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%)',
                    boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.2), inset -1px -1px 2px rgba(0,0,0,0.3)'
                  }}
                  title={isMuted ? "Ligar som" : "Desligar som"}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} text-gray-400`} />
                      {isFullscreen && <span className="text-gray-400 text-sm">OFF</span>}
                    </>
                  ) : (
                    <>
                      <Volume2 className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} text-green-400`} />
                      {isFullscreen && <span className="text-green-400 text-sm">ON</span>}
                    </>
                  )}
                </button>
                
                <div 
                  className={`${isFullscreen ? 'w-16 h-8' : 'w-12 h-6'} rounded`}
                  style={{
                    background: `repeating-linear-gradient(90deg, #1a1a1a 0px, #1a1a1a 2px, #2a2a2a 2px, #2a2a2a 4px)`,
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
                  }}
                />
                
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded transition-all hover:bg-white/10"
                  style={{
                    background: 'linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%)',
                    boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.2), inset -1px -1px 2px rgba(0,0,0,0.3)'
                  }}
                  title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                >
                  {isFullscreen ? (
                    <Minimize2 className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} text-gray-300`} />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-gray-300" />
                  )}
                </button>
                
                <div 
                  className={`${isFullscreen ? 'w-3 h-3' : 'w-2 h-2'} rounded-full animate-pulse`}
                  style={{
                    background: 'radial-gradient(circle, #00ff00 0%, #00aa00 100%)',
                    boxShadow: '0 0 4px #00ff00'
                  }}
                />
              </div>
            </div>
            
            {/* Decorative knobs */}
            <div className="hidden sm:block absolute -right-2 top-1/4 space-y-4">
              {[1, 2].map((i) => (
                <div 
                  key={i}
                  className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} rounded-full`}
                  style={{
                    background: 'linear-gradient(145deg, #4a4a4a 0%, #2a2a2a 100%)',
                    boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)'
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* TV Stand */}
          <div className="flex justify-center mt-1">
            <div 
              className={`${isFullscreen ? 'w-1/4 h-4' : 'w-1/3 h-3'} rounded-b-lg`}
              style={{
                background: 'linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
