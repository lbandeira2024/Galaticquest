import { createContext, useContext, useRef, useEffect, useCallback, useState } from "react";
import { usePause } from "./PauseContext";

const AudioContext = createContext();

// Bloqueios simples para evitar 404 e ruídos indesejados
const BLOCKED_SOUNDS = new Set([
  "/sounds/02.ui-hover.mp3",
  "sounds/02.ui-hover.mp3",
  "02.ui-hover.mp3",
]);

// Remove query params (?t=...)
const normalizeSrc = (src = "") => String(src).split("?")[0];

// Converte caminho relativo para absoluto para comparação segura
const toAbsolute = (src) => {
  if (!src) return "";
  try {
    return new URL(src, window.location.href).href;
  } catch (e) {
    return src;
  }
};

const isBlockedSound = (src = "") => {
  const clean = normalizeSrc(src);
  if (BLOCKED_SOUNDS.has(clean)) return true;
  return clean.toLowerCase().includes("02.ui-hover.mp3");
};

export const AudioProvider = ({ children }) => {
  // Música de fundo
  const musicAudioRef = useRef(new Audio());
  // Som primário (decolagem)
  const primaryAudioRef = useRef(new Audio());
  // Músicas sendo desvanecidas (Fade Out)
  const fadingAudiosRef = useRef([]);

  // Controle
  const isPrimaryActiveRef = useRef(false);
  const soundsRef = useRef([]);
  const [activeAudioEl, setActiveAudioEl] = useState(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  // Filas (antes do unlock / pausa)
  const [queuedMusic, setQueuedMusic] = useState(null);
  const [queuedPrimary, setQueuedPrimary] = useState(null);
  const [queuedSFX, setQueuedSFX] = useState(null);

  // Pedidos feitos durante o primário
  const queuedMusicAfterPrimaryRef = useRef(null);
  const queuedSfxAfterPrimaryRef = useRef([]);

  // Preloader simples
  const preloadedRef = useRef(new Map());

  // Callback do primário
  const primaryEndedCallbackRef = useRef(null);

  const { isPaused } = usePause();

  const preloadAudio = useCallback((src) => {
    const key = normalizeSrc(src);
    if (!key) return;
    if (preloadedRef.current.has(key)) return;

    try {
      const a = new Audio();
      a.preload = "auto";
      a.src = src;
      a.loop = false;
      a.load();
      preloadedRef.current.set(key, a);
      console.log("📦 Preload iniciado:", src);
    } catch {
      // silencioso
    }
  }, []);

  const warmBackgroundForAfterPrimary = useCallback((src, options = { loop: true }) => {
    const bg = musicAudioRef.current;
    if (!bg) return;

    const currentAbs = toAbsolute(normalizeSrc(bg.src || ""));
    const incomingAbs = toAbsolute(normalizeSrc(src));

    if (currentAbs !== incomingAbs) {
      try {
        bg.pause();
      } catch { }
      bg.src = src;
      bg.preload = "auto";
      bg.loop = !!options.loop;
      bg.volume = 0;
      bg.muted = true;
      try {
        bg.load();
      } catch { }
      console.log("🔥 Warmup BG iniciado:", src);
    }
  }, []);

  const unlockAudio = useCallback(() => {
    if (isAudioUnlocked) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const context = new AudioCtx();
      if (context.state === "suspended") context.resume();
    }

    const silentSound = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
    );

    silentSound
      .play()
      .then(() => {
        silentSound.pause();
        console.log("✅ Contexto de Áudio desbloqueado.");
        setIsAudioUnlocked(true);
      })
      .catch(() => {
        console.warn("Aguardando clique para desbloquear...");
      });
  }, [isAudioUnlocked]);

  const stopMusic = useCallback(() => {
    const bg = musicAudioRef.current;
    if (bg) {
      try {
        bg.pause();
        bg.currentTime = 0;
        bg.src = "";
      } catch { }
    }

    // Para imediatamente qualquer música que estava no meio do fade
    fadingAudiosRef.current.forEach(a => {
      try { a.pause(); a.src = ""; } catch { }
    });
    fadingAudiosRef.current = [];

    console.log("🛑 Música de fundo parada (stopMusic).");
  }, []);

  const playSfxNow = useCallback((src) => {
    const sound = new Audio(src);
    sound.preload = "auto";
    sound.volume = 1.0;
    sound.muted = false;
    sound.loop = false;

    soundsRef.current.push(sound);

    const p = sound.play();
    if (p !== undefined) p.catch(() => { });

    const cleanup = () => {
      soundsRef.current = soundsRef.current.filter((s) => s !== sound);
    };

    sound.onended = cleanup;
    sound.onerror = cleanup;
  }, []);

  const playMusicNow = useCallback(
    (src, options = {}) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (música) ignorado:", src);
        return;
      }

      // Configurações Padrão
      const isLoop = options.loop !== undefined ? options.loop : true;
      const targetVolume = options.volume !== undefined ? options.volume : 1.0;
      const useFade = !!options.fade;

      if (isPrimaryActiveRef.current) {
        preloadAudio(src);
        warmBackgroundForAfterPrimary(src, options);

        if (!queuedMusicAfterPrimaryRef.current) {
          queuedMusicAfterPrimaryRef.current = { src, options };
          console.log("🧾 Música enfileirada para pós-primário (first-wins):", src);
        }
        return;
      }

      let target = musicAudioRef.current;
      const currentAbs = toAbsolute(normalizeSrc(target.src || ""));
      const newAbs = toAbsolute(normalizeSrc(src));
      const alreadySame = currentAbs === newAbs && newAbs !== "";

      // Se é a mesma música, só ajusta propriedades e garante que está tocando
      if (alreadySame) {
        target.loop = isLoop;
        target.volume = targetVolume;

        if (target.paused && !isPaused) {
          const p = target.play();
          if (p !== undefined) p.catch(() => { });
        }
        return;
      }

      // --- LÓGICA DE FADE IN/OUT (CROSSFADE) ---
      if (useFade && !target.paused && target.src) {
        const oldAudio = target;
        fadingAudiosRef.current.push(oldAudio);

        // Fade out da música velha
        const fadeOutTimer = setInterval(() => {
          if (oldAudio.volume > 0.05) {
            oldAudio.volume = Math.max(0, oldAudio.volume - 0.05);
          } else {
            oldAudio.pause();
            oldAudio.src = "";
            fadingAudiosRef.current = fadingAudiosRef.current.filter(a => a !== oldAudio);
            clearInterval(fadeOutTimer);
          }
        }, 100);

        // Criar um NOVO elemento de áudio para a música que está entrando
        target = new Audio();
        musicAudioRef.current = target;
      } else {
        // Sem fade, troca bruta
        try {
          target.pause();
          target.currentTime = 0;
        } catch { }
      }

      target.src = src;
      target.preload = "auto";
      target.loop = isLoop;
      target.muted = false;

      setActiveAudioEl(target);

      if (useFade) {
        target.volume = 0; // Começa mudo
        const p = target.play();
        if (p !== undefined) p.catch(() => { });

        // Fade in da música nova
        const fadeInTimer = setInterval(() => {
          if (target.volume < targetVolume - 0.05) {
            target.volume = Math.min(targetVolume, target.volume + 0.05);
          } else {
            target.volume = targetVolume;
            clearInterval(fadeInTimer);
          }
        }, 100);
      } else {
        target.volume = targetVolume;
        const p = target.play();
        if (p !== undefined) {
          p.then(() => console.log(`🎵 Música iniciada (${src})`)).catch((e) => {
            if (e?.name !== "AbortError") console.error("⚠️ Erro música:", e?.name, e);
          });
        }
      }
    },
    [preloadAudio, warmBackgroundForAfterPrimary, isPaused]
  );

  const flushAfterPrimary = useCallback(() => {
    const qm = queuedMusicAfterPrimaryRef.current;
    queuedMusicAfterPrimaryRef.current = null;

    if (qm) {
      playMusicNow(qm.src, qm.options || { loop: true, isPrimary: false });
    }

    const sfxQueue = queuedSfxAfterPrimaryRef.current;
    queuedSfxAfterPrimaryRef.current = [];

    if (sfxQueue.length) {
      sfxQueue.forEach((s) => playSfxNow(s));
    }
  }, [playMusicNow, playSfxNow]);

  const attachPrimaryDiagnostics = (audioEl, src) => {
    audioEl.onplay = () => console.log(`🚀 PRIMARY onplay: ${src}`);
    audioEl.onpause = () => console.log(`⏸ PRIMARY onpause: ${src}`);
    audioEl.onwaiting = () => console.log(`⚠️ PRIMARY waiting ${src}`);
    audioEl.oncanplaythrough = () => console.log("✅ PRIMARY canplaythrough", src, "dur=", audioEl.duration);
    audioEl.onerror = () => console.error("❌ PRIMARY media error", src, audioEl.error);
  };

  const playPrimaryNow = useCallback(
    (src, options = { loop: false, isPrimary: true, onEnded: null }) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (primário) ignorado:", src);
        return;
      }

      const target = primaryAudioRef.current;

      if (!target.__pauseIntercepted) {
        const originalPause = target.pause.bind(target);
        target.pause = () => {
          return originalPause();
        };
        target.__pauseIntercepted = true;
      }

      try {
        target.pause();
        target.currentTime = 0;
      } catch { }

      console.log("🆕 Iniciando Som Primário:", src);

      primaryEndedCallbackRef.current = typeof options?.onEnded === "function" ? options.onEnded : null;

      target.src = src;
      target.preload = "auto";
      target.loop = !!options.loop;
      target.volume = 1.0;
      target.muted = false;

      isPrimaryActiveRef.current = true;
      stopMusic();

      attachPrimaryDiagnostics(target, src);

      const handlePrimaryFinish = () => {
        try {
          if (primaryEndedCallbackRef.current) primaryEndedCallbackRef.current();
        } catch (e) {
          console.error("⚠️ Erro callback onEnded do primário:", e);
        } finally {
          primaryEndedCallbackRef.current = null;
        }

        isPrimaryActiveRef.current = false;
        flushAfterPrimary();
      };

      target.onended = () => {
        console.log("🏁 Primário acabou.");
        handlePrimaryFinish();
      };

      const originalOnError = target.onerror;
      target.onerror = () => {
        if (originalOnError) originalOnError();
        console.log("🧯 Primário falhou.");
        handlePrimaryFinish();
      };

      setActiveAudioEl(target);

      target.load();
      const p = target.play();
      if (p !== undefined) {
        p.then(() => console.log("✅ primary play() ok:", src)).catch((e) => {
          console.error("❌ primary play() falhou:", e?.name, e);
          isPrimaryActiveRef.current = false;
          flushAfterPrimary();
        });
      }
    },
    [stopMusic, flushAfterPrimary]
  );

  const playTrack = useCallback(
    (src, options = {}) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (track) ignorado:", src);
        return;
      }

      if (!isAudioUnlocked) {
        if (options.isPrimary) setQueuedPrimary({ src, options });
        else setQueuedMusic({ src, options });
        return;
      }

      if (isPaused) {
        if (options.isPrimary) setQueuedPrimary({ src, options });
        else setQueuedMusic({ src, options });
        console.log("⏸️ Áudio em pausa — enfileirando:", src);
        return;
      }

      if (options.isPrimary) {
        playPrimaryNow(src, options);
        return;
      }

      playMusicNow(src, options);
    },
    [isAudioUnlocked, isPaused, playPrimaryNow, playMusicNow]
  );

  const playSound = useCallback(
    (src) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (SFX) ignorado:", src);
        return;
      }

      if (!isAudioUnlocked) return;

      if (isPrimaryActiveRef.current) {
        queuedSfxAfterPrimaryRef.current.push(src);
        console.log("🧾 SFX enfileirado para pós-primário:", src);
        return;
      }

      if (isPaused) {
        setQueuedSFX({ src, options: { loop: false, isPrimary: false } });
        console.log("⏸️ SFX em pausa — enfileirando:", src);
        return;
      }

      playSfxNow(src);
    },
    [isAudioUnlocked, isPaused, playSfxNow]
  );

  const stopAllAudio = useCallback(() => {
    console.trace("🛑 stopAllAudio() chamado. Stack:");

    const bg = musicAudioRef.current;
    const primary = primaryAudioRef.current;

    [bg, primary].forEach((el) => {
      if (!el) return;
      try {
        el.pause();
        el.currentTime = 0;
        el.src = "";
      } catch { }
    });

    fadingAudiosRef.current.forEach(a => {
      try { a.pause(); a.src = ""; } catch { }
    });
    fadingAudiosRef.current = [];

    soundsRef.current.forEach((s) => {
      try {
        s.pause();
        s.currentTime = 0;
        s.src = "";
      } catch { }
    });

    soundsRef.current = [];
    isPrimaryActiveRef.current = false;

    queuedMusicAfterPrimaryRef.current = null;
    queuedSfxAfterPrimaryRef.current = [];

    setQueuedMusic(null);
    setQueuedPrimary(null);
    setQueuedSFX(null);
  }, []);

  useEffect(() => {
    if (!isAudioUnlocked) return;
    if (isPaused) return;

    if (queuedPrimary) {
      playPrimaryNow(queuedPrimary.src, queuedPrimary.options);
      setQueuedPrimary(null);
      return;
    }

    if (queuedMusic) {
      playMusicNow(queuedMusic.src, queuedMusic.options);
      setQueuedMusic(null);
    }

    if (queuedSFX) {
      if (isPrimaryActiveRef.current) {
        queuedSfxAfterPrimaryRef.current.push(queuedSFX.src);
        console.log("🧾 SFX enfileirado (fila unlock) para pós-primário:", queuedSFX.src);
      } else {
        playSfxNow(queuedSFX.src);
      }
      setQueuedSFX(null);
    }
  }, [isAudioUnlocked, isPaused, queuedPrimary, queuedMusic, queuedSFX, playPrimaryNow, playMusicNow, playSfxNow]);

  // CORREÇÃO APLICADA NESTE USEEFFECT
  useEffect(() => {
    const bg = musicAudioRef.current;
    const primary = primaryAudioRef.current;

    if (isPaused) {
      // Pausa todos os áudios quando o estado muda para pausado
      if (bg && !bg.paused) bg.pause();
      if (primary && !primary.paused) primary.pause();

      fadingAudiosRef.current.forEach((s) => s.pause());
      soundsRef.current.forEach((s) => s.pause());
    } else {
      // Retoma os áudios exatamente do ponto onde pararam ao sair da pausa
      if (bg && bg.paused && bg.src) {
        const p = bg.play();
        if (p !== undefined) p.catch(() => { });
      }
      if (primary && primary.paused && primary.src) {
        const p = primary.play();
        if (p !== undefined) p.catch(() => { });
      }

      fadingAudiosRef.current.forEach((s) => {
        if (s.paused && s.src) {
          const p = s.play();
          if (p !== undefined) p.catch(() => { });
        }
      });
      soundsRef.current.forEach((s) => {
        if (s.paused && s.src) {
          const p = s.play();
          if (p !== undefined) p.catch(() => { });
        }
      });
    }
  }, [isPaused]);

  const value = {
    unlockAudio,
    playTrack,
    playSound,
    stopAllAudio,
    stopMusic,
    preloadAudio,
    warmBackgroundForAfterPrimary,
    primaryAudioRef,
    musicAudioRef,
    isAudioUnlocked,
    activeAudioEl,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);