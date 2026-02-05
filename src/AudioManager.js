import { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';
import { usePause } from './PauseContext';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  // Canais separados para evitar conflitos
  const musicAudioRef = useRef(new Audio());   // Apenas Música de fundo
  const primaryAudioRef = useRef(new Audio()); // Vozes e Efeitos Importantes (Decolagem)

  const soundsRef = useRef([]); // Efeitos sonoros "tiros/interface" (fire and forget)
  const [activeAudioRef, setActiveAudioRef] = useState(null);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  // Filas separadas: Música e SFX não devem competir pelo mesmo slot
  const [queuedMusic, setQueuedMusic] = useState(null);
  const [queuedSFX, setQueuedSFX] = useState(null);

  const unlockAudio = useCallback(() => {
    if (isAudioUnlocked) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const context = new AudioCtx();
      if (context.state === 'suspended') context.resume();
    }

    // Toca som silencioso para liberar o navegador
    const silentSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silentSound.play().then(() => {
      silentSound.pause();
      console.log("✅ Contexto de Áudio desbloqueado.");
      setIsAudioUnlocked(true);
    }).catch(e => {
      console.warn("Aguardando clique para desbloquear...");
    });
  }, [isAudioUnlocked]);

  // Efeito que processa a fila assim que desbloqueia
  useEffect(() => {
    if (isAudioUnlocked) {
      // 1. Se tiver música na fila, toca
      if (queuedMusic) {
        console.log("🎵 Fila Música processada:", queuedMusic.src);
        playTrack(queuedMusic.src, queuedMusic.options);
        setQueuedMusic(null);
      }
      // 2. Se tiver efeito importante (Decolagem) na fila, toca também
      if (queuedSFX) {
        console.log("🚀 Fila SFX processada:", queuedSFX.src);
        playTrack(queuedSFX.src, queuedSFX.options);
        setQueuedSFX(null);
      }
    }
  }, [isAudioUnlocked, queuedMusic, queuedSFX]); // Adicionado queuedSFX e playTrack removido do deps para evitar loop

  const playTrack = useCallback((src, options = { loop: true, isPrimary: false }) => {
    // Se estiver bloqueado, salva na fila correta
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

    // === LÓGICA DE DUCKING (BAIXAR VOLUME) ===
    // Em vez de pausar a música (que causa erro), baixamos o volume dela
    if (options.isPrimary) {
      if (!otherAudioRef.current.paused) {
        console.log("🔉 Baixando volume da música para som Primário.");
        // Baixa o volume da música suavemente
        otherAudioRef.current.volume = 0.2;
      }
    } else {
      // Se for música tocando, garante volume normal
      targetAudioRef.current.volume = 1.0;
    }

    const currentFullSrc = decodeURI(targetAudioRef.current.src);
    const newCleanSrc = src.split("?")[0];

    // Evita reiniciar se for a mesma trilha
    if (currentFullSrc.includes(newCleanSrc) && !targetAudioRef.current.paused) {
      // Se for a música voltando e o volume estava baixo, restaura
      if (!options.isPrimary) targetAudioRef.current.volume = 1.0;
      return;
    }

    targetAudioRef.current.src = src;
    targetAudioRef.current.loop = options.loop;

    const playPromise = targetAudioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'AbortError') return; // Ignora erros de interrupção
        console.error("Erro no playTrack:", error);
      });
    }

    // Se o som primário acabar, restaura o volume da música
    if (options.isPrimary) {
      targetAudioRef.current.onended = () => {
        console.log("🔊 Restaurando volume da música.");
        musicAudioRef.current.volume = 1.0;
      };
    }

    setActiveAudioRef(targetAudioRef);

  }, [isAudioUnlocked]); // Remove playTrack da dependência do useEffect para evitar re-render loops

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
    } else if (isAudioUnlocked) {
      // Tenta retomar se não estiver pausado manualmente
      // (Lógica simplificada para evitar complexidade)
    }
  }, [isPaused, isAudioUnlocked]);

  const value = { unlockAudio, playTrack, playSound, stopAllAudio, primaryAudioRef, musicAudioRef, isAudioUnlocked };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);