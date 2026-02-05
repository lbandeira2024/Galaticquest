import { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';
import { usePause } from './PauseContext';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const musicAudioRef = useRef(new Audio());
  const primaryAudioRef = useRef(new Audio());

  const soundsRef = useRef([]);
  const [activeAudioRef, setActiveAudioRef] = useState(null);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [queuedMusic, setQueuedMusic] = useState(null);
  const [queuedSFX, setQueuedSFX] = useState(null);

  const unlockAudio = useCallback(() => {
    if (isAudioUnlocked) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const context = new AudioCtx();
      if (context.state === 'suspended') context.resume();
    }

    const silentSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silentSound.play().then(() => {
      silentSound.pause();
      console.log("✅ Contexto de Áudio desbloqueado.");
      setIsAudioUnlocked(true);
    }).catch(e => {
      console.warn("Aguardando clique para desbloquear...");
    });
  }, [isAudioUnlocked]);

  useEffect(() => {
    if (isAudioUnlocked) {
      if (queuedMusic) {
        console.log("🎵 Fila Música processada:", queuedMusic.src);
        playTrack(queuedMusic.src, queuedMusic.options);
        setQueuedMusic(null);
      }
      if (queuedSFX) {
        console.log("🚀 Fila SFX processada:", queuedSFX.src);
        playTrack(queuedSFX.src, queuedSFX.options);
        setQueuedSFX(null);
      }
    }
  }, [isAudioUnlocked, queuedMusic, queuedSFX]);

  const playTrack = useCallback((src, options = { loop: true, isPrimary: false }) => {
    if (!isAudioUnlocked) {
      if (options.isPrimary) {
        console.warn("🔒 Decolagem/Primário na fila:", src);
        setQueuedSFX({ src, options });
      } else {
        console.warn("🔒 Música na fila:", src);
        setQueuedMusic({ src, options });
      }
      return;
    }

    const targetAudioRef = options.isPrimary ? primaryAudioRef : musicAudioRef;
    const otherAudioRef = options.isPrimary ? musicAudioRef : primaryAudioRef;

    // === LÓGICA DE DUCKING E VOLUME ===
    if (options.isPrimary) {
      // Garante que a Decolagem esteja no volume MÁXIMO
      targetAudioRef.current.volume = 1.0;

      if (!otherAudioRef.current.paused) {
        console.log("🔉 Baixando volume da música para som Primário.");
        otherAudioRef.current.volume = 0.2;
      }
    } else {
      // Se for música, volume normal
      targetAudioRef.current.volume = 1.0;
    }

    const currentFullSrc = decodeURI(targetAudioRef.current.src);
    const newCleanSrc = src.split("?")[0];

    if (currentFullSrc.includes(newCleanSrc) && !targetAudioRef.current.paused) {
      if (!options.isPrimary) targetAudioRef.current.volume = 1.0;
      return;
    }

    targetAudioRef.current.src = src;
    targetAudioRef.current.loop = options.loop;

    // --- DIAGNÓSTICO E PREPARAÇÃO ---
    // Adiciona listeners para sabermos a verdade no console
    targetAudioRef.current.onplay = () => console.log(`▶️ Iniciou reprodução: ${newCleanSrc}`);
    targetAudioRef.current.onerror = (e) => console.error(`❌ Erro no arquivo: ${newCleanSrc}`, e);

    // Força o carregamento para limpar buffer antigo
    targetAudioRef.current.load();

    const playPromise = targetAudioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'AbortError') return;
        console.error("Erro no playTrack:", error);
      });
    }

    // Restaura volume da música ao fim do som primário
    if (options.isPrimary) {
      targetAudioRef.current.onended = () => {
        console.log("🔊 Fim do Primário. Restaurando música.");
        musicAudioRef.current.volume = 1.0;
      };
    }

    setActiveAudioRef(targetAudioRef);

  }, [isAudioUnlocked]);

  const playSound = useCallback((src) => {
    if (!isAudioUnlocked) return;
    const sound = new Audio(src);
    soundsRef.current.push(sound);
    sound.volume = 1.0;

    sound.play().catch(e => { if (e.name !== 'AbortError') console.error("Erro SFX:", e); });

    sound.onended = () => {
      soundsRef.current = soundsRef.current.filter(s => s !== sound);
    };
  }, [isAudioUnlocked]);

  const stopAllAudio = useCallback(() => {
    [musicAudioRef.current, primaryAudioRef.current].forEach(ref => {
      if (ref && !ref.paused) ref.pause();
    });
    soundsRef.current.forEach(s => s.pause());
    soundsRef.current = [];
  }, []);

  const { isPaused } = usePause();

  useEffect(() => {
    const refs = [musicAudioRef.current, primaryAudioRef.current];
    if (isPaused) {
      refs.forEach(ref => ref && !ref.paused && ref.pause());
      soundsRef.current.forEach(s => s.pause());
    }
  }, [isPaused]);

  const value = { unlockAudio, playTrack, playSound, stopAllAudio, primaryAudioRef, musicAudioRef, isAudioUnlocked };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);