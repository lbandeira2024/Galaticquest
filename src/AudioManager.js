import { createContext, useContext, useRef, useEffect, useCallback, useState } from "react";
import { usePause } from "./PauseContext";

const AudioContext = createContext();

// Bloqueios simples para evitar 404 e ruídos indesejados
const BLOCKED_SOUNDS = new Set([
  "/sounds/02.ui-hover.mp3",
  "sounds/02.ui-hover.mp3",
  "02.ui-hover.mp3",
]);

const normalizeSrc = (src = "") => String(src).split("?")[0];

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

  // Controle
  const isPrimaryActiveRef = useRef(false);
  const soundsRef = useRef([]);
  const [activeAudioEl, setActiveAudioEl] = useState(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  // Filas (antes do unlock / pausa)
  const [queuedMusic, setQueuedMusic] = useState(null);
  const [queuedPrimary, setQueuedPrimary] = useState(null);
  const [queuedSFX, setQueuedSFX] = useState(null);

  // ✅ Pedidos feitos durante o primário
  // Música pós-primário: first-wins (SpaceView geralmente é a primeira)
  const queuedMusicAfterPrimaryRef = useRef(null);
  // SFX pós-primário: mantém ordem
  const queuedSfxAfterPrimaryRef = useRef([]);

  // ✅ Preloader simples (cache warming)
  const preloadedRef = useRef(new Map());

  // ✅ Callback do primário (para sincronizar lógica/UX sem timeout fixo)
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

  // ✅ Warmup mais forte: usa o PRÓPRIO player de música (musicAudioRef) para baixar buffer
  // sem tocar (muted + volume 0). Isso reduz MUITO o gap pós-decolagem.
  const warmBackgroundForAfterPrimary = useCallback((src, options = { loop: true }) => {
    const bg = musicAudioRef.current;
    if (!bg) return;

    const current = normalizeSrc(bg.src || "");
    const incoming = normalizeSrc(src);

    // Só aquece se ainda não está com a mesma fonte
    if (current !== incoming) {
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
    if (!bg) return;

    try {
      bg.pause();
      bg.currentTime = 0;
      bg.src = "";
    } catch { }

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
    (src, options = { loop: true, isPrimary: false }) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (música) ignorado:", src);
        return;
      }

      // Se primário ativo, NÃO toca agora — enfileira + aquece o buffer do BG
      if (isPrimaryActiveRef.current) {
        preloadAudio(src);
        warmBackgroundForAfterPrimary(src, options);

        if (!queuedMusicAfterPrimaryRef.current) {
          queuedMusicAfterPrimaryRef.current = { src, options };
          console.log("🧾 Música enfileirada para pós-primário (first-wins):", src);
        } else {
          console.log("🧾 Música ignorada (já existe música pós-primário):", src);
        }
        return;
      }

      const target = musicAudioRef.current;
      const currentClean = normalizeSrc(decodeURI(target.src || ""));
      const newClean = normalizeSrc(src);

      // Se já é a mesma fonte e já tem buffer, não reseta (evita perder o warmup)
      const alreadySame = currentClean === newClean;
      const hasBuffer = target.readyState >= 3; // HAVE_FUTURE_DATA

      if (!alreadySame) {
        try {
          target.pause();
          target.currentTime = 0;
        } catch { }
        target.src = src;
        target.preload = "auto";
      } else {
        // garante que começa do início sem trocar src
        try {
          target.currentTime = 0;
        } catch { }
      }

      target.loop = !!options.loop;
      target.muted = false;
      target.volume = 1.0;

      setActiveAudioEl(target);

      const p = target.play();
      if (p !== undefined) {
        p.then(() => console.log(`🎵 Música iniciada (${src})${alreadySame && hasBuffer ? " [warm]" : ""}`)).catch((e) => {
          if (e?.name !== "AbortError") console.error("⚠️ Erro música:", e?.name, e);
        });
      }
    },
    [preloadAudio, warmBackgroundForAfterPrimary]
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

      // Intercepta pause para debug de aborts
      if (!target.__pauseIntercepted) {
        const originalPause = target.pause.bind(target);
        target.pause = () => {
          console.trace("⛔ primary.pause() foi chamado. Stack:");
          return originalPause();
        };
        target.__pauseIntercepted = true;
      }

      try {
        target.pause();
        target.currentTime = 0;
      } catch { }

      console.log("🆕 Iniciando Som Primário:", src);

      // Guarda callback de finalização (para sincronizar eventos sem setTimeout)
      primaryEndedCallbackRef.current = typeof options?.onEnded === "function" ? options.onEnded : null;

      target.src = src;
      target.preload = "auto";
      target.loop = !!options.loop;
      target.volume = 1.0;
      target.muted = false;

      // Regra: durante primário, música deve estar off
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
          // falhou => libera fluxo
          isPrimaryActiveRef.current = false;
          flushAfterPrimary();
        });
      }
    },
    [stopMusic, flushAfterPrimary]
  );

  // API pública (música/trilha ou primário)
  const playTrack = useCallback(
    (src, options = { loop: true, isPrimary: false, onEnded: null }) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (track) ignorado:", src);
        return;
      }

      // Sem unlock: fila
      if (!isAudioUnlocked) {
        if (options.isPrimary) setQueuedPrimary({ src, options });
        else setQueuedMusic({ src, options });
        return;
      }

      // Pausado: fila
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

  // API pública (SFX)
  const playSound = useCallback(
    (src) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (SFX) ignorado:", src);
        return;
      }

      if (!isAudioUnlocked) return;

      // Se primário ativo: enfileira para pós-primário (mantém ordem, sem tocar agora)
      if (isPrimaryActiveRef.current) {
        queuedSfxAfterPrimaryRef.current.push(src);
        console.log("🧾 SFX enfileirado para pós-primário:", src);
        return;
      }

      // Se pausado: fila simples
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

  // Flush das filas pós-unlock (respeitando primário)
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

  // Pausa global
  useEffect(() => {
    if (!isPaused) return;

    const bg = musicAudioRef.current;
    const primary = primaryAudioRef.current;

    if (bg && !bg.paused) bg.pause();
    if (primary && !primary.paused) primary.pause();

    soundsRef.current.forEach((s) => s.pause());
  }, [isPaused]);

  const value = {
    unlockAudio,
    playTrack,
    playSound,
    stopAllAudio,
    stopMusic,
    preloadAudio,
    warmBackgroundForAfterPrimary, // ✅ exposto opcionalmente
    primaryAudioRef,
    musicAudioRef,
    isAudioUnlocked,
    activeAudioEl,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);
