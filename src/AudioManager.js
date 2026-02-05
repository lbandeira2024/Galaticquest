import { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';
import { usePause } from './PauseContext';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const musicAudioRef = useRef(new Audio());
  const primaryAudioRef = useRef(new Audio());
  const soundsRef = useRef([]);
  const [activeAudioRef, setActiveAudioRef] = useState(null);

  // --- LÓGICA DE DESBLOQUEIO DE ÁUDIO ---
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [queuedMusic, setQueuedMusic] = useState(null);

  const unlockAudio = useCallback(() => {
    if (isAudioUnlocked) return;

    // Tenta retomar o AudioContext do navegador se estiver suspenso (comum em produção/HTTPS)
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const context = new AudioCtx();
      if (context.state === 'suspended') {
        context.resume();
      }
    }

    // Toca um som silencioso para forçar o desbloqueio
    const silentSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silentSound.play().then(() => {
      silentSound.pause();
      console.log("✅ Contexto de Áudio desbloqueado com sucesso.");
      setIsAudioUnlocked(true);
    }).catch(e => console.error("O navegador bloqueou o desbloqueio automático. Requer clique.", e));
  }, [isAudioUnlocked]);

  useEffect(() => {
    if (isAudioUnlocked && queuedMusic) {
      console.log("Reproduzindo música da fila:", queuedMusic.src);
      playTrack(queuedMusic.src, queuedMusic.options);
      setQueuedMusic(null);
    }
  }, [isAudioUnlocked, queuedMusic]);

  const playTrack = useCallback((src, options = { loop: true, isPrimary: false }) => {
    // Se não estiver desbloqueado, coloca na fila e espera
    if (!isAudioUnlocked) {
      console.warn("🔒 Áudio bloqueado. Adicionado à fila:", src);
      setQueuedMusic({ src, options });
      return;
    }

    const targetAudioRef = options.isPrimary ? primaryAudioRef : musicAudioRef;
    const otherAudioRef = options.isPrimary ? musicAudioRef : primaryAudioRef;

    // Pausa o outro canal
    otherAudioRef.current.pause();

    // =========================================================
    // LÓGICA DE CONTINUIDADE INTELIGENTE
    // =========================================================
    const currentFullSrc = decodeURI(targetAudioRef.current.src);
    const currentCleanSrc = currentFullSrc.split("?")[0];
    const newCleanSrc = src.split("?")[0];

    // Verifica se é a mesma música e se está tocando
    if (currentCleanSrc.endsWith(newCleanSrc) && !targetAudioRef.current.paused) {
      return;
    }

    targetAudioRef.current.src = src;
    targetAudioRef.current.loop = options.loop;
    targetAudioRef.current.play().catch(e => console.error("Erro ao tocar trilha:", e));
    setActiveAudioRef(targetAudioRef);

  }, [isAudioUnlocked]);

  const playSound = useCallback((src) => {
    if (!isAudioUnlocked) return;
    const sound = new Audio(src);
    soundsRef.current.push(sound);
    sound.play().catch(error => console.log('Erro som:', error));
    sound.onended = () => {
      soundsRef.current = soundsRef.current.filter(s => s !== sound);
    };
  }, [isAudioUnlocked]);

  const stopAllAudio = useCallback(() => {
    musicAudioRef.current.pause();
    primaryAudioRef.current.pause();
    soundsRef.current.forEach(sound => sound.pause());
    soundsRef.current = [];
    setActiveAudioRef(null);
  }, []);

  const { isPaused } = usePause();
  useEffect(() => {
    const activeAudioEl = activeAudioRef?.current;
    if (isPaused) {
      if (activeAudioEl && !activeAudioEl.paused) activeAudioEl.pause();
      soundsRef.current.forEach(s => s.pause());
    } else {
      if (activeAudioEl && activeAudioEl.paused && isAudioUnlocked) {
        activeAudioEl.play().catch(e => console.error("Resume falhou", e));
      }
    }
  }, [isPaused, activeAudioRef, isAudioUnlocked]);

  // Exportamos unlockAudio e isAudioUnlocked para uso nos componentes
  const value = { unlockAudio, playTrack, playSound, stopAllAudio, primaryAudioRef, musicAudioRef, isAudioUnlocked };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);