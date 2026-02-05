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
        console.log("🎵 Fila Música:", queuedMusic.src);
        playTrack(queuedMusic.src, queuedMusic.options);
        setQueuedMusic(null);
      }
      if (queuedSFX) {
        console.log("🚀 Fila SFX:", queuedSFX.src);
        playTrack(queuedSFX.src, queuedSFX.options);
        setQueuedSFX(null);
      }
    }
  }, [isAudioUnlocked, queuedMusic, queuedSFX]);

  const playTrack = useCallback((src, options = { loop: true, isPrimary: false }) => {
    if (!isAudioUnlocked) {
      if (options.isPrimary) {
        console.warn("🔒 Decolagem na fila:", src);
        setQueuedSFX({ src, options });
      } else {
        console.warn("🔒 Música na fila:", src);
        setQueuedMusic({ src, options });
      }
      return;
    }

    // === MUDANÇA CRÍTICA AQUI ===
    // Se for som Primário (Decolagem), NÃO reutilizamos o ref. Criamos um novo.
    if (options.isPrimary) {
      // Mata o anterior se existir
      if (primaryAudioRef.current) {
        primaryAudioRef.current.pause();
        primaryAudioRef.current.src = "";
      }
      // Cria um player novinho em folha
      console.log("🆕 Criando nova instância de áudio para:", src);
      primaryAudioRef.current = new Audio(src);
    }

    // Referências atualizadas
    const targetAudioRef = options.isPrimary ? primaryAudioRef : musicAudioRef;
    const otherAudioRef = options.isPrimary ? musicAudioRef : primaryAudioRef;

    // === LÓGICA DE DUCKING ===
    if (options.isPrimary) {
      targetAudioRef.current.volume = 1.0; // Garante volume máx
      if (!otherAudioRef.current.paused) {
        console.log("🔉 Baixando volume da música.");
        otherAudioRef.current.volume = 0.2;
      }
    } else {
      // Se for música
      if (targetAudioRef.current.src !== src) {
        targetAudioRef.current.src = src;
      }
      targetAudioRef.current.volume = 1.0;
    }

    const currentCleanSrc = src.split("?")[0];

    targetAudioRef.current.loop = options.loop;

    // Listeners
    targetAudioRef.current.onplay = () => console.log(`▶️ PLAY INICIADO: ${currentCleanSrc}`);
    targetAudioRef.current.onerror = (e) => console.error(`❌ ERRO NO PLAYER: ${currentCleanSrc}`, e);

    // Tenta tocar
    const playPromise = targetAudioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`🔊 SUCESSO ABSOLUTO: Ouvindo ${currentCleanSrc}`);
      }).catch(error => {
        if (error.name === 'AbortError') return;
        console.error(`⚠️ Falha na Promessa (${currentCleanSrc}):`, error);
      });
    }

    // Restaura música ao fim
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
      if (ref && !ref.paused) {
        ref.pause();
        ref.currentTime = 0;
      }
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