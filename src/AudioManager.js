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
    const silentSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silentSound.play().then(() => {
      silentSound.pause();
      console.log("✅ Contexto de Áudio desbloqueado.");
      setIsAudioUnlocked(true);
    }).catch(e => console.error("Desbloqueio falhou", e));
  }, [isAudioUnlocked]);

  useEffect(() => {
    if (isAudioUnlocked && queuedMusic) {
      playTrack(queuedMusic.src, queuedMusic.options);
      setQueuedMusic(null);
    }
  }, [isAudioUnlocked, queuedMusic]);

  const playTrack = useCallback((src, options = { loop: true, isPrimary: false }) => {
    if (!isAudioUnlocked) {
      console.warn("🔒 Áudio bloqueado. Na fila:", src);
      setQueuedMusic({ src, options });
      return;
    }

    const targetAudioRef = options.isPrimary ? primaryAudioRef : musicAudioRef;
    const otherAudioRef = options.isPrimary ? musicAudioRef : primaryAudioRef;

    // Pausa o outro canal (ex: se tocar música primária, pausa a secundária)
    otherAudioRef.current.pause();

    // =========================================================
    // LÓGICA DE CONTINUIDADE INTELIGENTE (COM LOGS)
    // =========================================================

    // 1. URL atual que está a tocar (limpa de ?t=...)
    const currentFullSrc = decodeURI(targetAudioRef.current.src);
    const currentCleanSrc = currentFullSrc.split("?")[0];

    // 2. Nova URL pedida (limpa de ?t=...)
    const newCleanSrc = src.split("?")[0];

    // LOG DE DEBUG (Para vermos no Console o que está a acontecer)
    console.log(`🎵 [AudioManager] Comparando:
      TOCANDO AGORA: "${currentCleanSrc}"
      NOVO PEDIDO:   "${newCleanSrc}"
      ESTÁ PAUSADO?: ${targetAudioRef.current.paused}`);

    // 3. A comparação
    // Verifica se a URL atual TERMINA com a nova URL (ignora http://localhost...)
    // E verifica se NÃO está pausado.
    if (currentCleanSrc.endsWith(newCleanSrc) && !targetAudioRef.current.paused) {
      console.log("✅ [AudioManager] Música igual detectada. Mantendo a atual.");
      return; // SAAI DA FUNÇÃO, MANTÉM A MÚSICA
    }

    console.warn("🔄 [AudioManager] Música diferente (ou pausada). Reiniciando...");

    // Se chegou aqui, troca a música
    targetAudioRef.current.src = src; // Usa o src original
    targetAudioRef.current.loop = options.loop;
    targetAudioRef.current.play().catch(e => console.error("Erro ao tocar:", e));
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

  const value = { unlockAudio, playTrack, playSound, stopAllAudio, primaryAudioRef, musicAudioRef };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);