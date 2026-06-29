import { useCallback, useRef, useEffect } from 'react';

// Audio context singleton to avoid creating multiple contexts
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export interface GameSounds {
  playMove: () => void;
  playScore: () => void;
  playMerge: () => void;
  playGameOver: () => void;
  playWin: () => void;
  playClick: () => void;
  playHit: () => void;
  playJump: () => void;
  playCollect: () => void;
  playShoot: () => void;
  playExplosion: () => void;
  playPowerUp: () => void;
  playError: () => void;
  playTick: () => void;
  playSuccess: () => void;
  playDrop: () => void;
  playFlip: () => void;
  playBounce: () => void;
  playBeep: (frequency?: number) => void;
}

export default function useGameSounds(enabled: boolean = true): GameSounds {
  const volumeRef = useRef(0.3);

  // Resume audio context on user interaction
  useEffect(() => {
    const resumeContext = () => {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    };
    
    document.addEventListener('click', resumeContext, { once: true });
    document.addEventListener('keydown', resumeContext, { once: true });
    document.addEventListener('touchstart', resumeContext, { once: true });
    
    return () => {
      document.removeEventListener('click', resumeContext);
      document.removeEventListener('keydown', resumeContext);
      document.removeEventListener('touchstart', resumeContext);
    };
  }, []);

  // Helper to create oscillator with envelope
  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    volume: number = volumeRef.current,
    decay: boolean = true
  ) => {
    if (!enabled) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      if (decay) {
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      }
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Silently fail if audio not available
    }
  }, [enabled]);

  // Helper for frequency sweep
  const playSweep = useCallback((
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume: number = volumeRef.current
  ) => {
    if (!enabled) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Silently fail
    }
  }, [enabled]);

  // Noise generator for explosions/hits
  const playNoise = useCallback((duration: number, volume: number = volumeRef.current) => {
    if (!enabled) return;
    
    try {
      const ctx = getAudioContext();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      noise.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + duration);
    } catch (e) {
      // Silently fail
    }
  }, [enabled]);

  // Sound effects
  const playMove = useCallback(() => {
    playTone(200, 0.05, 'square', 0.15);
  }, [playTone]);

  const playScore = useCallback(() => {
    playTone(523, 0.1, 'square', 0.2);
    setTimeout(() => playTone(659, 0.1, 'square', 0.2), 50);
  }, [playTone]);

  const playMerge = useCallback(() => {
    playSweep(300, 600, 0.15, 'square', 0.25);
  }, [playSweep]);

  const playGameOver = useCallback(() => {
    playSweep(400, 100, 0.5, 'sawtooth', 0.3);
  }, [playSweep]);

  const playWin = useCallback(() => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'square', 0.25), i * 100);
    });
  }, [playTone]);

  const playClick = useCallback(() => {
    playTone(800, 0.03, 'square', 0.15);
  }, [playTone]);

  const playHit = useCallback(() => {
    playNoise(0.1, 0.25);
    playTone(150, 0.1, 'square', 0.2);
  }, [playNoise, playTone]);

  const playJump = useCallback(() => {
    playSweep(200, 600, 0.15, 'square', 0.2);
  }, [playSweep]);

  const playCollect = useCallback(() => {
    playTone(880, 0.08, 'square', 0.2);
    setTimeout(() => playTone(1100, 0.08, 'square', 0.2), 50);
  }, [playTone]);

  const playShoot = useCallback(() => {
    playSweep(800, 200, 0.1, 'square', 0.2);
  }, [playSweep]);

  const playExplosion = useCallback(() => {
    playNoise(0.3, 0.35);
    playSweep(200, 50, 0.3, 'sawtooth', 0.25);
  }, [playNoise, playSweep]);

  const playPowerUp = useCallback(() => {
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, 'square', 0.2), i * 60);
    });
  }, [playTone]);

  const playError = useCallback(() => {
    playTone(200, 0.15, 'sawtooth', 0.25);
    setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.25), 100);
  }, [playTone]);

  const playTick = useCallback(() => {
    playTone(1000, 0.02, 'square', 0.1);
  }, [playTone]);

  const playSuccess = useCallback(() => {
    playTone(523, 0.12, 'square', 0.2);
    setTimeout(() => playTone(784, 0.15, 'square', 0.25), 100);
  }, [playTone]);

  const playDrop = useCallback(() => {
    playSweep(400, 100, 0.12, 'square', 0.2);
  }, [playSweep]);

  const playFlip = useCallback(() => {
    playTone(600, 0.05, 'square', 0.15);
    setTimeout(() => playTone(800, 0.05, 'square', 0.15), 40);
  }, [playTone]);

  const playBounce = useCallback(() => {
    playSweep(300, 500, 0.08, 'square', 0.2);
  }, [playSweep]);

  const playBeep = useCallback((frequency: number = 440) => {
    playTone(frequency, 0.1, 'square', 0.2);
  }, [playTone]);

  return {
    playMove,
    playScore,
    playMerge,
    playGameOver,
    playWin,
    playClick,
    playHit,
    playJump,
    playCollect,
    playShoot,
    playExplosion,
    playPowerUp,
    playError,
    playTick,
    playSuccess,
    playDrop,
    playFlip,
    playBounce,
    playBeep,
  };
}
