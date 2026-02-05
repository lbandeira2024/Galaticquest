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
        console.log("🎵 Processando Fila Música:", queuedMusic.src);
        playTrack(queuedMusic.src, queuedMusic.options);
        setQueuedMusic(null);
      }
      if (queuedSFX) {
        console.log("🚀 Processando Fila SFX:", queuedSFX.src);
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

    const targetAudioRef = options.isPrimary ? primaryAudioRef : musicAudioRef;
    const otherAudioRef = options.isPrimary ? musicAudioRef : primaryAudioRef;

    // === LÓGICA DE DUCKING (Prioridade) ===
    if (options.isPrimary) {
      // Se for Decolagem, abaixa a música
      if (!otherAudioRef.current.paused) {
        console.log("🔉 Baixando volume da música.");
        otherAudioRef.current.volume = 0.2;
      }
      // Garante volume máximo para a Decolagem
      targetAudioRef.current.volume = 1.0;
    } else {
      targetAudioRef.current.volume = 1.0;
    }

    const currentFullSrc = decodeURI(targetAudioRef.current.src);
    const newCleanSrc = src.split("?")[0];

    // Se for música e já estiver tocando, ignora. 
    // SE FOR PRIMARY (Decolagem), SEMPRE TOCA DE NOVO (removemos o return)
    if (!options.isPrimary && currentFullSrc.includes(newCleanSrc) && !targetAudioRef.current.paused) {
      targetAudioRef.current.volume = 1.0;
      return;
    }

    // --- CONFIGURAÇÃO AGRESSIVA DE PLAYBACK ---
    targetAudioRef.current.src = src;
    targetAudioRef.current.loop = options.loop;
    targetAudioRef.current.currentTime = 0; // Reseta o tempo para o início

    // Listeners para diagnóstico no console
    const handlePlay = () => console.log(`▶️ TENTANDO TOCAR: ${newCleanSrc}`);
    const handleError = (e) => console.error(`❌ ERRO FATAL no arquivo: ${newCleanSrc}`, e);

    // Limpa listeners antigos para não acumular
    targetAudioRef.current.onplay = handlePlay;
    targetAudioRef.current.onerror = handleError;

    // FORÇA O CARREGAMENTO (Isso resolve 99% dos casos de "som fantasma")
    targetAudioRef.current.load();

    const playPromise = targetAudioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`🔊 SUCESSO: Áudio tocando (${newCleanSrc})`);
      }).catch(error => {
        if (error.name === 'AbortError') return;
        console.error(`⚠️ Falha na Promessa de Áudio (${newCleanSrc}):`, error);
      });
    }

    // Quando acabar o som primário, restaura o volume da música
    if (options.isPrimary) {
      targetAudioRef.current.onended = () => {
        console.log("🔊 Restaurando volume da música.");
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
    sound.currentTime = 0;

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