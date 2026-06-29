import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { 
  Download, 
  Upload, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Video, 
  X,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Info,
  ShieldAlert,
  Share2,
  Copy,
  Check,
  Instagram,
  Twitter
} from "lucide-react";
import html2canvas from "html2canvas";
import { useLanguage } from "@/react-app/contexts/LanguageContext";
import { useAdmin } from "@/react-app/hooks/useAdmin";
import { Header } from "@/react-app/components/Header";
import { Footer } from "@/react-app/components/Footer";

type ContentType = "video" | "image";
type AspectRatio = "9:16" | "1:1" | "4:5";

export default function RetroLab() {
  const { t } = useLanguage();
  const { isAdmin, isPending } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Demo mode for preview testing
  const isDemoMode = location.pathname.includes("/retrolab/demo");

  useEffect(() => {
    if (!isDemoMode && !isPending && !isAdmin) {
      navigate("/");
    }
  }, [isPending, isAdmin, navigate, isDemoMode]);
  
  const [contentType, setContentType] = useState<ContentType>("video");
  const [contentUrl, setContentUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastCapturedBlob, setLastCapturedBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // 4K dimensions for high quality export
  const aspectDimensions: Record<AspectRatio, { width: number; height: number; label: string }> = {
    "9:16": { width: 2160, height: 3840, label: "Reels/TikTok" },
    "1:1": { width: 2160, height: 2160, label: "Feed Square" },
    "4:5": { width: 2160, height: 2700, label: "Feed Portrait" }
  };

  const currentContent = uploadedFile || contentUrl;

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedFile(url);
      setContentType(file.type.startsWith("video") ? "video" : "image");
    }
  }, []);

  const clearContent = useCallback(() => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile);
    }
    setUploadedFile(null);
    setContentUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [uploadedFile]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  }, []);

  const resetVideo = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play();
      setIsPlaying(true);
    }
  }, []);

  // Capture current frame using html2canvas - captures preview exactly as shown
  const captureFrame = useCallback(async () => {
    if (!currentContent || !previewContainerRef.current) return;
    
    setIsCapturing(true);
    
    try {
      const dims = aspectDimensions[aspectRatio];
      const targetWidth = dims.width;
      const targetHeight = dims.height;
      
      // Get current preview dimensions
      const previewElement = previewContainerRef.current;
      const previewRect = previewElement.getBoundingClientRect();
      
      // Calculate scale factor to reach 4K
      const scaleX = targetWidth / previewRect.width;
      const scaleY = targetHeight / previewRect.height;
      const scale = Math.max(scaleX, scaleY);
      
      // Capture the preview container exactly as it appears using html2canvas
      const capturedCanvas = await html2canvas(previewElement, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#1a0a1e",
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Remove any animations in the cloned document
          const clonedElement = clonedDoc.querySelector('[data-preview-container]');
          if (clonedElement) {
            const animatedElements = clonedElement.querySelectorAll('.animate-pulse');
            animatedElements.forEach(el => {
              (el as HTMLElement).style.animation = 'none';
            });
          }
        }
      });
      
      // Create final canvas at exact 4K dimensions
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = targetWidth;
      finalCanvas.height = targetHeight;
      const ctx = finalCanvas.getContext("2d");
      
      if (!ctx) throw new Error("Cannot get canvas context");
      
      // Fill background
      ctx.fillStyle = "#1a0a1e";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      
      // Calculate position to center the captured content
      const capturedAspect = capturedCanvas.width / capturedCanvas.height;
      const targetAspect = targetWidth / targetHeight;
      
      let drawWidth: number, drawHeight: number, drawX: number, drawY: number;
      
      if (capturedAspect > targetAspect) {
        // Captured is wider - fit by width
        drawWidth = targetWidth;
        drawHeight = targetWidth / capturedAspect;
        drawX = 0;
        drawY = (targetHeight - drawHeight) / 2;
      } else {
        // Captured is taller - fit by height
        drawHeight = targetHeight;
        drawWidth = targetHeight * capturedAspect;
        drawX = (targetWidth - drawWidth) / 2;
        drawY = 0;
      }
      
      // Draw the captured canvas onto the final canvas
      ctx.drawImage(capturedCanvas, drawX, drawY, drawWidth, drawHeight);
      
      // Convert to blob for sharing
      finalCanvas.toBlob((blob) => {
        if (blob) {
          setLastCapturedBlob(blob);
        }
      }, "image/png", 1.0);
      
      // Download
      const link = document.createElement("a");
      link.download = `retromynd-4K-${aspectRatio}-${Date.now()}.png`;
      link.href = finalCanvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (error) {
      console.error("Failed to capture:", error);
      alert("Erro ao capturar. Verifique se o conteúdo está carregado.");
    } finally {
      setIsCapturing(false);
    }
  }, [aspectRatio, currentContent]);

  // Record video with TV frame
  const startRecording = useCallback(async () => {
    if (!previewContainerRef.current) return;
    
    try {
      // Create a canvas to capture the preview
      const html2canvas = (await import("html2canvas")).default;
      
      setIsRecording(true);
      setRecordingProgress(0);
      recordedChunksRef.current = [];
      
      // Get the video duration or default to 10 seconds
      const videoDuration = videoRef.current?.duration || 10;
      const recordDuration = Math.min(videoDuration, 30) * 1000; // Max 30 seconds
      
      // Create a temporary canvas for recording
      const captureCanvas = document.createElement("canvas");
      const dims = aspectDimensions[aspectRatio];
      captureCanvas.width = dims.width;
      captureCanvas.height = dims.height;
      const ctx = captureCanvas.getContext("2d");
      
      if (!ctx) throw new Error("Cannot get canvas context");
      
      // Start the stream from canvas
      const stream = captureCanvas.captureStream(30); // 30 FPS
      
      // Add audio if video has audio and not muted
      if (videoRef.current && !isMuted) {
        try {
          const audioCtx = new AudioContext();
          const source = audioCtx.createMediaElementSource(videoRef.current);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          source.connect(audioCtx.destination);
          stream.addTrack(dest.stream.getAudioTracks()[0]);
        } catch {
          console.log("Could not capture audio");
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9"
      });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        setLastCapturedBlob(blob);
        
        // Download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `retromynd-${aspectRatio}-${Date.now()}.webm`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        
        setIsRecording(false);
        setRecordingProgress(0);
      };
      
      // Reset video to start
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
      
      mediaRecorder.start(100);
      
      // Capture frames
      const startTime = Date.now();
      const captureLoop = async () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;
        
        const elapsed = Date.now() - startTime;
        setRecordingProgress(Math.min((elapsed / recordDuration) * 100, 100));
        
        if (elapsed >= recordDuration) {
          mediaRecorderRef.current.stop();
          return;
        }
        
        try {
          const containerWidth = previewContainerRef.current!.offsetWidth || 400;
          const containerHeight = previewContainerRef.current!.offsetHeight || 600;
          const scaleX = dims.width / containerWidth;
          const scaleY = dims.height / containerHeight;
          const captureScale = Math.max(scaleX, scaleY);
          
          const capturedCanvas = await html2canvas(previewContainerRef.current!, {
            backgroundColor: "#1a0a1e",
            scale: captureScale,
            useCORS: true,
            allowTaint: true,
            width: containerWidth,
            height: containerHeight,
            logging: false
          });
          
          // Draw with proper scaling and centering
          ctx.fillStyle = "#1a0a1e";
          ctx.fillRect(0, 0, dims.width, dims.height);
          
          const sourceAspect = capturedCanvas.width / capturedCanvas.height;
          const targetAspect = dims.width / dims.height;
          
          let drawWidth: number, drawHeight: number, drawX: number, drawY: number;
          
          if (sourceAspect > targetAspect) {
            drawWidth = dims.width;
            drawHeight = dims.width / sourceAspect;
            drawX = 0;
            drawY = (dims.height - drawHeight) / 2;
          } else {
            drawHeight = dims.height;
            drawWidth = dims.height * sourceAspect;
            drawX = (dims.width - drawWidth) / 2;
            drawY = 0;
          }
          
          ctx.drawImage(capturedCanvas, drawX, drawY, drawWidth, drawHeight);
        } catch (err) {
          console.error("Frame capture error:", err);
        }
        
        requestAnimationFrame(captureLoop);
      };
      
      captureLoop();
      
    } catch (error) {
      console.error("Recording failed:", error);
      alert("Erro ao gravar. Seu navegador pode não suportar esta função. Tente gravar a tela manualmente.");
      setIsRecording(false);
    }
  }, [aspectRatio, isMuted]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Share functionality
  const handleShare = useCallback(async () => {
    if (!lastCapturedBlob) {
      // Capture first
      if (!previewContainerRef.current) return;
      
      try {
        const html2canvas = (await import("html2canvas")).default;
        const dims = aspectDimensions[aspectRatio];
        const currentWidth = previewContainerRef.current.offsetWidth;
        const currentHeight = previewContainerRef.current.offsetHeight;
        const scaleX = dims.width / currentWidth;
        const scaleY = dims.height / currentHeight;
        const captureScale = Math.max(scaleX, scaleY);
        
        const canvas = await html2canvas(previewContainerRef.current, {
          backgroundColor: "#1a0a1e",
          scale: captureScale,
          useCORS: true,
          allowTaint: true,
          width: currentWidth,
          height: currentHeight,
          logging: false
        });
        
        // Create final canvas at target dimensions
        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = dims.width;
        finalCanvas.height = dims.height;
        const ctx = finalCanvas.getContext("2d");
        
        if (ctx) {
          ctx.fillStyle = "#1a0a1e";
          ctx.fillRect(0, 0, dims.width, dims.height);
          
          const sourceAspect = canvas.width / canvas.height;
          const targetAspect = dims.width / dims.height;
          
          let drawWidth: number, drawHeight: number, drawX: number, drawY: number;
          
          if (sourceAspect > targetAspect) {
            drawWidth = dims.width;
            drawHeight = dims.width / sourceAspect;
            drawX = 0;
            drawY = (dims.height - drawHeight) / 2;
          } else {
            drawHeight = dims.height;
            drawWidth = dims.height * sourceAspect;
            drawX = (dims.width - drawWidth) / 2;
            drawY = 0;
          }
          
          ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);
        }
        
        finalCanvas.toBlob(async (blob) => {
          if (blob) {
            setLastCapturedBlob(blob);
            await shareBlob(blob);
          }
        }, "image/png", 1.0);
      } catch {
        setShowShareModal(true);
      }
    } else {
      await shareBlob(lastCapturedBlob);
    }
  }, [lastCapturedBlob, aspectRatio]);

  const shareBlob = async (blob: Blob) => {
    // Check if Web Share API is available
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], `retromynd-${Date.now()}.${blob.type.includes("video") ? "webm" : "png"}`, { type: blob.type });
      
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "RetroMynd Content",
            text: "Criado com RetroLab 📺✨"
          });
          return;
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            console.error("Share failed:", err);
          }
        }
      }
    }
    
    // Fallback to modal
    setShowShareModal(true);
  };

  const copyToClipboard = useCallback(async () => {
    if (lastCapturedBlob && lastCapturedBlob.type.includes("image")) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ [lastCapturedBlob.type]: lastCapturedBlob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        alert("Não foi possível copiar. Baixe o arquivo manualmente.");
      }
    }
  }, [lastCapturedBlob]);

  // Get dimensions based on aspect ratio
  const getPreviewStyle = () => {
    const base = aspectDimensions[aspectRatio];
    // Scale down to fit screen
    const maxHeight = 600;
    const scale = maxHeight / base.height;
    return {
      width: base.width * scale,
      height: maxHeight,
    };
  };

  const previewStyle = getPreviewStyle();

  // Loading state
  if (!isDemoMode && isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0a1e] via-[#0f0f1a] to-[#1a0a1e]">
        <div className="bg-gray-900/80 border border-pink-500/30 rounded-lg p-8 text-center">
          <div className="animate-pulse text-pink-400 font-mono">{t("common.loading") || "Verificando acesso..."}</div>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isDemoMode && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0a1e] via-[#0f0f1a] to-[#1a0a1e]">
        <div className="bg-gray-900/80 border border-red-500/30 rounded-lg p-8 text-center max-w-md">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold text-white mb-2">{t("admin.accessDenied") || "Acesso Restrito"}</h1>
          <p className="text-gray-400 mb-4">
            {t("retrolab.adminOnly") || "O RetroLab é uma ferramenta exclusiva para administradores."}
          </p>
          <Link to="/" className="inline-block px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-bold hover:opacity-90 transition-opacity">
            {t("common.backToStore") || "Voltar para a loja"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a0a1e] via-[#0f0f1a] to-[#1a0a1e]">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            RetroLab
          </h1>
          <p className="text-gray-400 text-lg">
            Crie conteúdos temáticos com o template da TV retrô
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Content Type Selector */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-pink-400" />
                Tipo de Conteúdo
              </h3>
              
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setContentType("video")}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                    ${contentType === "video" 
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white" 
                      : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                >
                  <Video className="w-5 h-5" />
                  Vídeo
                </button>
                <button
                  onClick={() => setContentType("image")}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                    ${contentType === "image" 
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white" 
                      : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                >
                  <ImageIcon className="w-5 h-5" />
                  Imagem
                </button>
              </div>

              {/* URL Input */}
              <div className="mb-4">
                <label className="text-gray-400 text-sm mb-2 block">URL do conteúdo</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={contentUrl}
                      onChange={(e) => {
                        setContentUrl(e.target.value);
                        setUploadedFile(null);
                      }}
                      placeholder="https://exemplo.com/video.mp4"
                      className="w-full bg-black/30 border border-white/20 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  {currentContent && (
                    <button
                      onClick={clearContent}
                      className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Ou faça upload</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={contentType === "video" ? "video/*" : "image/*"}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:border-pink-500 hover:text-pink-400 cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Selecionar arquivo
                </label>
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                Formato
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(aspectDimensions) as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-3 px-2 rounded-lg font-medium transition-all text-center
                      ${aspectRatio === ratio 
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white" 
                        : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                  >
                    <div className="text-lg font-bold">{ratio}</div>
                    <div className="text-xs opacity-75">{aspectDimensions[ratio].label}</div>
                  </button>
                ))}
              </div>
              
              <div className="mt-3 text-center text-sm text-gray-500">
                <span className="text-cyan-400 font-bold">4K</span> • {aspectDimensions[aspectRatio].width} × {aspectDimensions[aspectRatio].height}px
              </div>
            </div>

            {/* Video Controls */}
            {contentType === "video" && currentContent && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-400" />
                  Controles do Vídeo
                </h3>
                
                <div className="flex gap-3">
                  <button
                    onClick={togglePlay}
                    className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isPlaying ? "Pausar" : "Play"}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="py-3 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={resetVideo}
                    className="py-3 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Download Actions */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-green-400" />
                Exportar
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  onClick={captureFrame}
                  disabled={!currentContent || isCapturing}
                  className="py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-5 h-5" />
                  {isCapturing ? "..." : "PNG"}
                </button>
                
                {contentType === "video" ? (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!currentContent}
                    className={`py-3 px-4 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 ${
                      isRecording 
                        ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                        : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700"
                    } disabled:cursor-not-allowed`}
                  >
                    <Video className="w-5 h-5" />
                    {isRecording ? t("retrolab.stopRecording") : t("retrolab.recordVideo")}
                  </button>
                ) : (
                  <button
                    onClick={handleShare}
                    disabled={!currentContent}
                    className="py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Compartilhar
                  </button>
                )}
              </div>
              
              {/* Recording Progress */}
              {isRecording && (
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Gravando...</span>
                    <span>{Math.round(recordingProgress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all"
                      style={{ width: `${recordingProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Share button for video */}
              {contentType === "video" && (
                <button
                  onClick={handleShare}
                  disabled={!lastCapturedBlob}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  {lastCapturedBlob ? "Compartilhar" : "Exporte primeiro para compartilhar"}
                </button>
              )}
              
              <button
                onClick={() => setShowInstructions(true)}
                className="w-full mt-3 py-3 px-6 bg-white/10 hover:bg-white/20 rounded-xl text-gray-300 font-medium transition-all flex items-center justify-center gap-2"
              >
                <Info className="w-5 h-5" />
                {t("retrolab.recordingTips")}
              </button>
            </div>

            {/* Static Template Download */}
            <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl p-5 border border-pink-500/30">
              <h3 className="text-white font-semibold mb-3">📥 {t("retrolab.staticTemplate")}</h3>
              <p className="text-gray-400 text-sm mb-4">
                {t("retrolab.staticTemplateDesc")}
              </p>
              <a
                href="/assets/tv-template-vertical.png"
                download="retromynd-tv-template.png"
                className="inline-flex items-center gap-2 py-2 px-4 bg-pink-500 hover:bg-pink-600 rounded-lg text-white font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                {t("retrolab.downloadTemplate916")}
              </a>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex flex-col items-center">
            <div className="sticky top-4">
              <h3 className="text-white font-semibold mb-4 text-center flex items-center justify-center gap-2">
                <Monitor className="w-5 h-5 text-cyan-400" />
                Preview
              </h3>
              
              {/* TV Preview Container */}
              <div 
                ref={previewContainerRef}
                data-preview-container
                className="relative mx-auto"
                style={{
                  width: previewStyle.width,
                  height: previewStyle.height,
                  background: "#1a0a1e"
                }}
              >
                {/* TV Frame - identical to RetroTV component but vertical */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="relative w-full h-full max-w-[90%]">
                    {/* TV Frame - outer shell */}
                    <div 
                      className="relative h-full rounded-2xl p-3"
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
                        className="relative h-full rounded-xl p-2 flex flex-col"
                        style={{
                          background: 'linear-gradient(180deg, #3d3d3d 0%, #2d2d2d 100%)',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                        }}
                      >
                        {/* Screen frame */}
                        <div 
                          className="relative flex-1 overflow-hidden"
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
                          
                          {/* Content */}
                          {currentContent ? (
                            contentType === "video" ? (
                              <video
                                ref={videoRef}
                                src={currentContent}
                                autoPlay
                                loop
                                muted={isMuted}
                                playsInline
                                className="w-full h-full object-cover bg-black"
                                style={{
                                  filter: 'contrast(1.1) saturate(1.2) brightness(0.95)'
                                }}
                              />
                            ) : (
                              <img
                                src={currentContent}
                                alt="Preview"
                                className="w-full h-full object-cover bg-black"
                                style={{
                                  filter: 'contrast(1.1) saturate(1.2) brightness(0.95)'
                                }}
                              />
                            )
                          ) : (
                            <div className="w-full h-full bg-black flex items-center justify-center">
                              <div className="text-center text-gray-600">
                                <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">{t("retrolab.addContent")}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Screen reflection */}
                          <div 
                            className="absolute inset-0 pointer-events-none z-20"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, transparent 100%)',
                              borderRadius: '8px'
                            }}
                          />
                        </div>
                        
                        {/* Bottom panel */}
                        <div className="mt-2 flex items-center justify-between px-1">
                          <div 
                            className="px-2 py-0.5 rounded font-bold tracking-wider text-[10px]"
                            style={{
                              background: 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)',
                              color: '#333',
                              boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.5), inset -1px -1px 2px rgba(0,0,0,0.3)'
                            }}
                          >
                            RETROMYND
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-8 h-4 rounded"
                              style={{
                                background: `repeating-linear-gradient(90deg, #1a1a1a 0px, #1a1a1a 2px, #2a2a2a 2px, #2a2a2a 4px)`,
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
                              }}
                            />
                            <div 
                              className="w-2 h-2 rounded-full animate-pulse"
                              style={{
                                background: 'radial-gradient(circle, #00ff00 0%, #00aa00 100%)',
                                boxShadow: '0 0 4px #00ff00'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Decorative knobs */}
                      <div className="absolute -right-1 top-1/4 space-y-3">
                        {[1, 2].map((i) => (
                          <div 
                            key={i}
                            className="w-3 h-3 rounded-full"
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
                        className="w-1/4 h-2 rounded-b-lg"
                        style={{
                          background: 'linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-gray-500 text-sm mt-4">
                Preview em escala reduzida • Export em alta resolução
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-2xl p-6 max-w-lg w-full border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Share2 className="w-6 h-6 text-cyan-400" />
                {t("retrolab.share")}
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={copyToClipboard}
                className="py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                {copied ? t("retrolab.copied") : t("retrolab.copyImage")}
              </button>
              
              <button
                onClick={() => {
                  if (lastCapturedBlob) {
                    const url = URL.createObjectURL(lastCapturedBlob);
                    const link = document.createElement("a");
                    link.download = `retromynd-${Date.now()}.${lastCapturedBlob.type.includes("video") ? "webm" : "png"}`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                disabled={!lastCapturedBlob}
                className="py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {t("retrolab.download")}
              </button>
            </div>
            
            {/* Social Media Instructions */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm">{t("retrolab.shareOnSocials")}</h4>
              
              <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg p-4 border border-pink-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <Instagram className="w-6 h-6 text-pink-400" />
                  <span className="text-white font-medium">{t("retrolab.instaTiktok")}</span>
                </div>
                <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                  <li>{t("retrolab.instaTiktokStep1")}</li>
                  <li>{t("retrolab.instaTiktokStep2")}</li>
                  <li>{t("retrolab.instaTiktokStep3")}</li>
                  <li>{t("retrolab.instaTiktokStep4")}</li>
                </ol>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <Twitter className="w-6 h-6 text-blue-400" />
                  <span className="text-white font-medium">{t("retrolab.twitterX")}</span>
                </div>
                <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                  <li>{t("retrolab.twitterStep1")}</li>
                  <li>{t("retrolab.twitterStep2")}</li>
                  <li>{t("retrolab.twitterStep3")}</li>
                </ol>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">
                  💡 <strong>{t("retrolab.tip").split(":")[0]}:</strong> {t("retrolab.shareTip")}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-semibold"
            >
              {t("retrolab.close")}
            </button>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-2xl p-6 max-w-lg w-full border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{t("retrolab.howToRecord")}</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4 text-gray-300">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-pink-400 mb-2">📱 {t("retrolab.mobileTitle")}</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>{t("retrolab.mobileStep1")}</li>
                  <li>{t("retrolab.mobileStep2")}</li>
                  <li>{t("retrolab.mobileStep3")}</li>
                  <li>{t("retrolab.mobileStep4")}</li>
                </ol>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-cyan-400 mb-2">💻 {t("retrolab.computerTitle")}</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>{t("retrolab.computerStep1")}</li>
                  <li>{t("retrolab.computerStep2")}</li>
                  <li>{t("retrolab.computerStep3")}</li>
                </ol>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-purple-400 mb-2">🎬 {t("retrolab.externalEditTitle")}</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>{t("retrolab.externalStep1")}</li>
                  <li>{t("retrolab.externalStep2")}</li>
                  <li>{t("retrolab.externalStep3")}</li>
                  <li>{t("retrolab.externalStep4")}</li>
                </ol>
              </div>
            </div>
            
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-semibold"
            >
              {t("retrolab.gotIt")}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
