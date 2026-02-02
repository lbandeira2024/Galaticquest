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

  // Função para ser chamada na primeira interação do utilizador
  const unlockAudio = useCallback(() => {
    if (isAudioUnlocked) return;

    // Toca e pausa um som silencioso para "acordar" o contexto de áudio
    const silentSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silentSound.play().then(() => {
      silentSound.pause();
      console.log("✅ Contexto de Áudio desbloqueado pelo utilizador.");
      setIsAudioUnlocked(true);
    }).catch(e => console.error("Desbloqueio de áudio falhou", e));
  }, [isAudioUnlocked]);

  // Efeito que toca a música em fila assim que o áudio for desbloqueado
  useEffect(() => {
    if (isAudioUnlocked && queuedMusic) {
      playTrack(queuedMusic.src, queuedMusic.options);
      setQueuedMusic(null); // Limpa a fila
    }
  }, [isAudioUnlocked, queuedMusic]);


  const playTrack = useCallback((src, options = { loop: true, isPrimary: false }) => {
    // Se o áudio não estiver desbloqueado, coloca a música na fila e aguarda.
    if (!isAudioUnlocked) {
      console.warn("Áudio bloqueado. A colocar música na fila.");
      setQueuedMusic({ src, options });
      return;
    }

    const targetAudioRef = options.isPrimary ? primaryAudioRef : musicAudioRef;
    const otherAudioRef = options.isPrimary ? musicAudioRef : primaryAudioRef;

    otherAudioRef.current.pause();

    if (decodeURI(targetAudioRef.current.src).endsWith(src) && !targetAudioRef.current.paused) {
      return;
    }

    if (!decodeURI(targetAudioRef.current.src).endsWith(src)) {
      targetAudioRef.current.src = src;
    }

    targetAudioRef.current.loop = options.loop;
    targetAudioRef.current.play().catch(e => console.error("Audio play falhou", e));
    setActiveAudioRef(targetAudioRef);

  }, [isAudioUnlocked]);

  const playSound = useCallback((src) => {
    if (!isAudioUnlocked) return;
    const sound = new Audio(src);
    soundsRef.current.push(sound);
    sound.play().catch(error => console.log('Sound play prevented:', error));
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
      if (activeAudioEl && !activeAudioEl.paused) {
        activeAudioEl.pause();
      }
      soundsRef.current.forEach(s => s.pause());
    } else {
      if (activeAudioEl && activeAudioEl.paused && isAudioUnlocked) {
        activeAudioEl.play().catch(e => console.error("Audio resume falhou", e));
      }
    }
  }, [isPaused, activeAudioRef, isAudioUnlocked]);


  const value = {
    unlockAudio, // Exporta a nova função
    playTrack,
    playSound,
    stopAllAudio,
    primaryAudioRef,
    musicAudioRef // <--- NOVO: Exporta a referência da música
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);