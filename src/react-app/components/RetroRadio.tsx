import { useState, useRef, useEffect } from "react";
import { Radio, X, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, Music } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface RadioChannel {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  category: "ambient" | "electronic" | "anime" | "gaming" | "retro";
  artUrl?: string; // SomaFM art URL
}

interface NowPlaying {
  title?: string;
  artist?: string;
  album?: string;
  artUrl?: string;
}

const RADIO_CHANNELS: RadioChannel[] = [
  // SomaFM channels
  {
    id: "groovesalad",
    name: "Groove Salad",
    description: "Ambient/Downtempo",
    streamUrl: "https://ice1.somafm.com/groovesalad-128-mp3",
    category: "ambient",
    artUrl: "https://somafm.com/img3/groovesalad-400.jpg",
  },
  {
    id: "dronezone",
    name: "Drone Zone",
    description: "Atmospheric Ambient",
    streamUrl: "https://ice1.somafm.com/dronezone-128-mp3",
    category: "ambient",
    artUrl: "https://somafm.com/img3/dronezone-400.jpg",
  },
  {
    id: "spacestation",
    name: "Space Station",
    description: "Space Music",
    streamUrl: "https://ice1.somafm.com/spacestation-128-mp3",
    category: "ambient",
    artUrl: "https://somafm.com/img3/spacestation-400.jpg",
  },
  {
    id: "defcon",
    name: "DEF CON Radio",
    description: "Hacker Electronic",
    streamUrl: "https://ice1.somafm.com/defcon-128-mp3",
    category: "electronic",
    artUrl: "https://somafm.com/img3/defcon-400.jpg",
  },
  {
    id: "cliqhop",
    name: "cliqhop idm",
    description: "IDM & Glitch",
    streamUrl: "https://ice1.somafm.com/cliqhop-128-mp3",
    category: "electronic",
    artUrl: "https://somafm.com/img3/cliqhop-400.jpg",
  },
  {
    id: "vaporwaves",
    name: "Vaporwaves",
    description: "Vaporwave & Future Funk",
    streamUrl: "https://ice1.somafm.com/vaporwaves-128-mp3",
    category: "retro",
    artUrl: "https://somafm.com/img3/vaporwaves-400.jpg",
  },
  {
    id: "thetrip",
    name: "The Trip",
    description: "Progressive House",
    streamUrl: "https://ice1.somafm.com/thetrip-128-mp3",
    category: "electronic",
    artUrl: "https://somafm.com/img3/thetrip-400.jpg",
  },
  {
    id: "dubstep",
    name: "Dubstep Beyond",
    description: "Dubstep & Bass",
    streamUrl: "https://ice1.somafm.com/dubstep-128-mp3",
    category: "electronic",
    artUrl: "https://somafm.com/img3/dubstep-400.jpg",
  },
  // Listen.moe - Anime radio
  {
    id: "listenmoe",
    name: "LISTEN.moe",
    description: "J-Pop & Anime",
    streamUrl: "https://listen.moe/stream",
    category: "anime",
    artUrl: "https://listen.moe/public/images/icons/apple-touch-icon.png",
  },
  {
    id: "listenmoe-kpop",
    name: "LISTEN.moe K-Pop",
    description: "K-Pop Music",
    streamUrl: "https://listen.moe/kpop/stream",
    category: "anime",
    artUrl: "https://listen.moe/public/images/icons/apple-touch-icon.png",
  },
  // Chiptune/Gaming
  {
    id: "8bit",
    name: "8-Bit Paradise",
    description: "Chiptunes & Game Music",
    streamUrl: "https://ice1.somafm.com/8bitpoppy-128-mp3",
    category: "gaming",
    artUrl: "https://somafm.com/img3/8bitpoppy-400.jpg",
  },
];

export function RetroRadio() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<RadioChannel>(RADIO_CHANNELS[0]);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showChannels, setShowChannels] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [showInvite, setShowInvite] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    
    audioRef.current.addEventListener("playing", () => {
      setIsLoading(false);
      setIsPlaying(true);
    });
    
    audioRef.current.addEventListener("waiting", () => {
      setIsLoading(true);
    });
    
    audioRef.current.addEventListener("error", () => {
      setIsLoading(false);
      setIsPlaying(false);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Fetch now playing info for SomaFM channels
  useEffect(() => {
    if (!isPlaying || !currentChannel.id.startsWith("listenmoe")) {
      // For SomaFM, use the channel art as default
      if (currentChannel.artUrl) {
        setNowPlaying({ artUrl: currentChannel.artUrl });
      }
    }
    
    // For Listen.moe, we could add WebSocket support for real-time track info
    // but for now we'll just show the station logo
  }, [isPlaying, currentChannel]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      setShowInvite(false); // Hide invite once user interacts
      audioRef.current.src = currentChannel.streamUrl;
      audioRef.current.play().catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
      });
    }
  };

  const changeChannel = (channel: RadioChannel) => {
    setCurrentChannel(channel);
    setShowChannels(false);
    setNowPlaying(channel.artUrl ? { artUrl: channel.artUrl } : null);
    
    if (audioRef.current && isPlaying) {
      setIsLoading(true);
      audioRef.current.src = channel.streamUrl;
      audioRef.current.play().catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
      });
    }
  };

  const getCategoryColor = (category: RadioChannel["category"]) => {
    switch (category) {
      case "ambient": return "bg-emerald-500";
      case "electronic": return "bg-blue-500";
      case "anime": return "bg-pink-500";
      case "gaming": return "bg-yellow-500";
      case "retro": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getCategoryLabel = (category: RadioChannel["category"]) => {
    switch (category) {
      case "ambient": return t("radio.categoryAmbient") || "Ambient";
      case "electronic": return t("radio.categoryElectronic") || "Electronic";
      case "anime": return t("radio.categoryAnime") || "Anime";
      case "gaming": return t("radio.categoryGaming") || "Gaming";
      case "retro": return t("radio.categoryRetro") || "Retro";
      default: return category;
    }
  };

  const handleOpenPlayer = () => {
    setIsOpen(true);
    setShowInvite(false);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">
        {/* Friendly invite message */}
        {showInvite && (
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                       px-4 py-2 rounded-lg shadow-lg text-sm font-medium
                       cursor-pointer hover:from-purple-600 hover:to-pink-600
                       transition-all duration-300 flex items-center gap-2"
            onClick={handleOpenPlayer}
            style={{ animation: 'gentleBounce 2s ease-in-out infinite' }}
          >
            <Music className="w-4 h-4" />
            <span>{t("radio.invite") || "How about some music?"}</span>
          </div>
        )}
        
        {/* Play button with purple bg and orange icon */}
        <button
          onClick={handleOpenPlayer}
          className="p-3 rounded-lg 
                     bg-gradient-to-br from-purple-500 to-pink-500 
                     text-yellow-400 shadow-lg hover:shadow-xl 
                     transition-all duration-300 hover:scale-105
                     border-2 border-purple-300/50"
          title={t("radio.title") || "Retro Radio"}
        >
          <Play className="w-6 h-6" fill="currentColor" />
          {isPlaying && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          )}
        </button>
        
        {/* Gentle bounce animation */}
        <style>{`
          @keyframes gentleBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 w-80">
      {/* Main Player */}
      <div className="bg-[#1a1a2e] border-2 border-[#4a4a6a] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div 
          className="px-4 py-2 flex items-center justify-between"
          style={{ background: "linear-gradient(90deg, hsl(330 80% 55%), hsl(280 70% 50%))" }}
        >
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm font-mono">
              {t("radio.title") || "RETRO RADIO"}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Channel Display with Album Art */}
        <div className="p-4 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a]">
          <div className="bg-black/50 rounded-lg p-3 border border-[#3a3a5a]">
            <div className="flex gap-3">
              {/* Album Art */}
              {(nowPlaying?.artUrl || currentChannel.artUrl) && (
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-[#3a3a5a]">
                  <img 
                    src={nowPlaying?.artUrl || currentChannel.artUrl} 
                    alt={currentChannel.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(currentChannel.category)} text-white font-mono`}>
                    {getCategoryLabel(currentChannel.category)}
                  </span>
                  {isLoading && (
                    <span className="text-xs text-yellow-400 animate-pulse font-mono">
                      {t("radio.loading") || "Loading..."}
                    </span>
                  )}
                  {isPlaying && !isLoading && (
                    <span className="text-xs text-green-400 flex items-center gap-1 font-mono">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      {t("radio.live") || "LIVE"}
                    </span>
                  )}
                </div>
                <h3 className="text-white font-bold text-base font-mono truncate">{currentChannel.name}</h3>
                <p className="text-gray-400 text-xs font-mono truncate">{currentChannel.description}</p>
              </div>
            </div>
          </div>

          {/* Visualizer */}
          {isPlaying && !isLoading && (
            <div className="flex items-end justify-center gap-1 h-8 mt-3">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-gradient-to-t from-orange-500 to-amber-400 rounded-t"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animation: `equalizer 0.5s ease-in-out ${i * 0.05}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 
                         flex items-center justify-center text-white shadow-lg
                         hover:shadow-orange-500/30 transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         border-2 border-orange-400/30"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 flex-1 ml-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-gradient-to-br
                           [&::-webkit-slider-thumb]:from-orange-500
                           [&::-webkit-slider-thumb]:to-amber-500"
              />
            </div>
          </div>

          {/* Channel Selector Toggle */}
          <button
            onClick={() => setShowChannels(!showChannels)}
            className="w-full mt-4 py-2 px-3 bg-[#2a2a4a] rounded-lg
                       flex items-center justify-between text-gray-300 hover:text-white
                       hover:bg-[#3a3a5a] transition-all duration-300 font-mono text-sm"
          >
            <span>{t("radio.channels") || "Channels"}</span>
            {showChannels ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Channel List */}
        {showChannels && (
          <div className="max-h-64 overflow-y-auto bg-[#0f0f1a] border-t border-[#3a3a5a]">
            {(["ambient", "electronic", "anime", "gaming", "retro"] as const).map((category) => {
              const channelsInCategory = RADIO_CHANNELS.filter((c) => c.category === category);
              if (channelsInCategory.length === 0) return null;

              return (
                <div key={category}>
                  <div className={`px-3 py-1 text-xs font-mono text-white/80 ${getCategoryColor(category)} bg-opacity-30`}>
                    {getCategoryLabel(category)}
                  </div>
                  {channelsInCategory.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => changeChannel(channel)}
                      className={`w-full px-4 py-2 flex items-center gap-3 
                                  hover:bg-[#2a2a4a] transition-colors
                                  ${currentChannel.id === channel.id ? "bg-orange-900/30 border-l-2 border-orange-500" : ""}`}
                    >
                      {/* Channel thumbnail */}
                      {channel.artUrl && (
                        <img 
                          src={channel.artUrl} 
                          alt={channel.name}
                          className="w-8 h-8 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      {!channel.artUrl && (
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${getCategoryColor(channel.category)}`}>
                          <Music className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-white text-sm font-mono truncate">{channel.name}</div>
                        <div className="text-gray-500 text-xs font-mono truncate">{channel.description}</div>
                      </div>
                      {currentChannel.id === channel.id && isPlaying && (
                        <span className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CSS for equalizer animation */}
      <style>{`
        @keyframes equalizer {
          0% { height: 20%; }
          100% { height: 100%; }
        }
      `}</style>
    </div>
  );
}
