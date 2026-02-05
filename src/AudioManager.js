import { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';
import { usePause } from './PauseContext';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const musicAudioRef = useRef(new Audio());
  const primaryAudioRef = useRef(new Audio());

  // Ref para saber se o som primário está ATIVO no momento
  const isPrimaryActiveRef = useRef(false);

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
        playTrack(queuedMusic.src, queuedMusic.options);
        setQueuedMusic(null);
      }
      if (queuedSFX) {
        playTrack(queuedSFX.src, queuedSFX.options);
        setQueuedSFX(null);
      }
    }
  }, [isAudioUnlocked, queuedMusic, queuedSFX]);

  const playTrack = useCallback((src, options = { loop: true, isPrimary: false }) => {
    if (!isAudioUnlocked) {
      if (options.isPrimary) {
        setQueuedSFX({ src, options });
      } else {
        setQueuedMusic({ src, options });
      }
      return;
    }

    // === LÓGICA DE SOM PRIMÁRIO (DECOLAGEM) ===
    if (options.isPrimary) {
      isPrimaryActiveRef.current = true; // ATIVA A TRAVA

      // Cria nova instância para garantir som limpo
      if (primaryAudioRef.current) {
        primaryAudioRef.current.pause();
        primaryAudioRef.current.src = "";
      }
      console.log("🆕 Iniciando Som Primário:", src);
      primaryAudioRef.current = new Audio(src);

      const target = primaryAudioRef.current;
      target.volume = 1.0;
      target.loop = options.loop;

      // Abaixa a música imediatamente
      if (musicAudioRef.current && !musicAudioRef.current.paused) {
        console.log("🔉 Baixando música para 20%.");
        musicAudioRef.current.volume = 0.2;
      }

      // Listeners
      target.onplay = () => console.log(`🚀 DECOLAGEM TOCANDO: ${src}`);
      target.onerror = (e) => console.error(`❌ ERRO NA DECOLAGEM:`, e);
      target.onended = () => {
        console.log("🏁 Decolagem acabou. Restaurando música.");
        isPrimaryActiveRef.current = false; // SOLTA A TRAVA
        if (musicAudioRef.current) musicAudioRef.current.volume = 1.0;
      };

      target.load();
      const p = target.play();
      if (p !== undefined) {
        p.catch(e => {
          if (e.name !== 'AbortError') console.error("⚠️ Erro play primário:", e);
        });
      }
      setActiveAudioRef(primaryAudioRef);
      return;
    }

    // === LÓGICA DE MÚSICA DE FUNDO ===
    // Se chegou aqui, é música.
    const target = musicAudioRef.current;
    const currentSrc = decodeURI(target.src);
    const newSrc = src.split("?")[0];

    // Se já está tocando a mesma música, apenas ajusta volume e sai
    if (currentSrc.includes(newSrc) && !target.paused) {
      // SÓ AUMENTA O VOLUME SE NÃO TIVER DECOLAGEM ROLANDO
      if (!isPrimaryActiveRef.current) {
        target.volume = 1.0;
      } else {
        console.log("🛡️ Tentativa de aumentar música bloqueada pela Decolagem.");
        target.volume = 0.2;
      }
      return;
    }

    target.src = src;
    target.loop = options.loop;

    // Respeita a Decolagem ao iniciar
    target.volume = isPrimaryActiveRef.current ? 0.2 : 1.0;

    const p = target.play();
    if (p !== undefined) {
      p.then(() => console.log(`🎵 Música iniciada (${src})`))
        .catch(e => { if (e.name !== 'AbortError') console.error("⚠️ Erro música:", e); });
    }

  }, [isAudioUnlocked]);

  const playSound = useCallback((src) => {
    if (!isAudioUnlocked) return;
    const sound = new Audio(src);
    soundsRef.current.push(sound);
    sound.volume = 1.0;
    sound.play().catch(e => { });
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
    isPrimaryActiveRef.current = false; // Reseta trava ao parar tudo
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
      // Opcional: Retomar áudio se desejar
    }
  }, [isPaused, isAudioUnlocked]);

  const value = { unlockAudio, playTrack, playSound, stopAllAudio, primaryAudioRef, musicAudioRef, isAudioUnlocked };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);