import { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';
import { usePause } from './PauseContext';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const musicAudioRef = useRef(new Audio());   // Canal de Música (Fundo)
  const primaryAudioRef = useRef(new Audio()); // Canal Primário (Vozes/Eventos)
  const soundsRef = useRef([]);
  const [activeAudioRef, setActiveAudioRef] = useState(null);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [queuedMusic, setQueuedMusic] = useState(null);

  const unlockAudio = useCallback(() => {
    if (isAudioUnlocked) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const context = new AudioCtx();
      if (context.state === 'suspended') context.resume();
    }

    const silentSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    const playPromise = silentSound.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        silentSound.pause();
        console.log("✅ Contexto de Áudio desbloqueado.");
        setIsAudioUnlocked(true);
      }).catch(e => {
        console.warn("Aguardando interação...");
      });
    }
  }, [isAudioUnlocked]);

  useEffect(() => {
    if (isAudioUnlocked && queuedMusic) {
      console.log("Processando fila:", queuedMusic.src);
      playTrack(queuedMusic.src, queuedMusic.options);
      setQueuedMusic(null);
    }
  }, [isAudioUnlocked, queuedMusic]);

  const playTrack = useCallback((src, options = { loop: true, isPrimary: false }) => {
    if (!isAudioUnlocked) {
      console.warn("🔒 Na fila:", src);
      setQueuedMusic({ src, options });
      return;
    }

    const targetAudioRef = options.isPrimary ? primaryAudioRef : musicAudioRef;
    const otherAudioRef = options.isPrimary ? musicAudioRef : primaryAudioRef;

    // --- CORREÇÃO DA HIERARQUIA ---
    // A lógica antiga pausava cegamente o "outro" canal.
    // Nova lógica:
    // 1. Se sou Primário (Decolagem): MANDO NO PEDAÇO. Pauso a música de fundo.
    // 2. Se sou Música (Trilha): SOU HUMILDE. Toco junto, não pauso o Primário.

    if (options.isPrimary) {
      if (!otherAudioRef.current.paused) {
        console.log("🛑 Primário assumindo. Pausando música de fundo.");
        otherAudioRef.current.pause();
      }
    }
    // Se for música (else), NÃO pausamos o otherAudioRef (Primário). 
    // Assim, se a fila acordar atrasada, ela toca a trilha SEM cortar a decolagem.

    const currentFullSrc = decodeURI(targetAudioRef.current.src);
    const currentCleanSrc = currentFullSrc.split("?")[0];
    const newCleanSrc = src.split("?")[0];

    if (currentCleanSrc.endsWith(newCleanSrc) && !targetAudioRef.current.paused) {
      return;
    }

    targetAudioRef.current.src = src;
    targetAudioRef.current.loop = options.loop;

    const playPromise = targetAudioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'AbortError') return;
        console.error("Erro no playTrack:", error);
      });
    }

    setActiveAudioRef(targetAudioRef);

  }, [isAudioUnlocked]);

  const playSound = useCallback((src) => {
    if (!isAudioUnlocked) return;
    const sound = new Audio(src);
    soundsRef.current.push(sound);

    const playPromise = sound.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'AbortError') return;
        console.log('Erro som:', error);
      });
    }

    sound.onended = () => {
      soundsRef.current = soundsRef.current.filter(s => s !== sound);
    };
  }, [isAudioUnlocked]);

  const stopAllAudio = useCallback(() => {
    [musicAudioRef.current, primaryAudioRef.current].forEach(ref => {
      if (ref && !ref.paused) ref.pause();
    });
    soundsRef.current.forEach(s => !s.paused && s.pause());
    soundsRef.current = [];
  }, []);

  const { isPaused } = usePause();

  useEffect(() => {
    // Lógica de pausa global (Pausar Jogo)
    const refs = [primaryAudioRef.current, musicAudioRef.current];

    if (isPaused) {
      refs.forEach(ref => ref && !ref.paused && ref.pause());
      soundsRef.current.forEach(s => s.pause());
    } else {
      // Retomar apenas se estava tocando antes? 
      // Simplificação: Se desbloqueado, tenta retomar o que estava ativo
      if (isAudioUnlocked) {
        // Opcional: Você pode querer refinar isso para retomar só o que deveria tocar
      }
    }
  }, [isPaused, isAudioUnlocked]);

  const value = { unlockAudio, playTrack, playSound, stopAllAudio, primaryAudioRef, musicAudioRef, isAudioUnlocked };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);