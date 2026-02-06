import { createContext, useContext, useRef, useEffect, useCallback, useState } from "react";
import { usePause } from "./PauseContext";

const AudioContext = createContext();

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
  const musicAudioRef = useRef(new Audio());
  const primaryAudioRef = useRef(new Audio());

  const isPrimaryActiveRef = useRef(false);
  const soundsRef = useRef([]);
  const [activeAudioEl, setActiveAudioEl] = useState(null);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  const [queuedMusic, setQueuedMusic] = useState(null);
  const [queuedPrimary, setQueuedPrimary] = useState(null);
  const [queuedSFX, setQueuedSFX] = useState(null);

  const { isPaused } = usePause();

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

  // ✅ NOVO: parar apenas a música de fundo
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

  const attachPrimaryDiagnostics = (audioEl, src) => {
    audioEl.onplay = () => console.log(`🚀 PRIMARY onplay: ${src}`);
    audioEl.onpause = () => console.log(`⏸ PRIMARY onpause: ${src}`);
    audioEl.oncanplaythrough = () =>
      console.log("✅ PRIMARY canplaythrough", src, "dur=", audioEl.duration);

    audioEl.onstalled = () => console.log("⚠️ PRIMARY stalled", src);
    audioEl.onwaiting = () => console.log("⚠️ PRIMARY waiting", src);

    audioEl.onerror = () => {
      console.error("❌ PRIMARY media error", src, audioEl.error);
    };
  };

  const playPrimaryNow = useCallback(
    (src, options) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (primário) ignorado:", src);
        return;
      }

      const target = primaryAudioRef.current;

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

      target.src = src;
      target.preload = "auto";
      target.loop = !!options.loop;
      target.volume = 1.0;
      target.muted = false;

      // ✅ regra: ao iniciar o primário, a música deve estar OFF
      isPrimaryActiveRef.current = true;
      stopMusic();

      attachPrimaryDiagnostics(target, src);

      target.onended = () => {
        console.log("🏁 Primário acabou.");
        isPrimaryActiveRef.current = false;
      };

      const originalOnError = target.onerror;
      target.onerror = () => {
        if (originalOnError) originalOnError();
        console.log("🧯 Primário falhou.");
        isPrimaryActiveRef.current = false;
      };

      setActiveAudioEl(target);

      target.load();
      const p = target.play();
      if (p !== undefined) {
        p.then(() => console.log("✅ primary play() ok:", src)).catch((e) => {
          console.error("❌ primary play() falhou:", e?.name, e);
          isPrimaryActiveRef.current = false;
        });
      }
    },
    [stopMusic]
  );

  const playMusicNow = useCallback((src, options) => {
    if (isBlockedSound(src)) {
      console.warn("🚫 Som bloqueado (música) ignorado:", src);
      return;
    }

    // ✅ Não iniciar música se o primário estiver ativo (decolagem)
    if (isPrimaryActiveRef.current) {
      console.log("🛡️ Música bloqueada: primário ativo.");
      return;
    }

    const target = musicAudioRef.current;

    const currentSrc = decodeURI(target.src || "");
    const newSrc = normalizeSrc(src);

    if (currentSrc.includes(newSrc) && !target.paused) {
      setActiveAudioEl(target);
      return;
    }

    target.src = src;
    target.preload = "auto";
    target.loop = !!options.loop;
    target.muted = false;
    target.volume = 1.0;

    setActiveAudioEl(target);

    const p = target.play();
    if (p !== undefined) {
      p.then(() => console.log(`🎵 Música iniciada (${src})`)).catch((e) => {
        if (e?.name !== "AbortError") console.error("⚠️ Erro música:", e?.name, e);
      });
    }
  }, []);

  const playTrack = useCallback(
    (src, options = { loop: true, isPrimary: false }) => {
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

      // ✅ Durante primário, não tocar SFX paralelo (empuxo.wav etc)
      if (isPrimaryActiveRef.current) {
        console.log("🚫 SFX bloqueado: primário ativo:", src);
        return;
      }

      if (!isAudioUnlocked) return;

      if (isPaused) {
        setQueuedSFX({ src, options: { loop: false, isPrimary: false } });
        console.log("⏸️ SFX em pausa — enfileirando:", src);
        return;
      }

      const sound = new Audio(src);
      sound.preload = "auto";
      sound.volume = 1.0;
      sound.muted = false;

      soundsRef.current.push(sound);

      const p = sound.play();
      if (p !== undefined) p.catch(() => { });

      sound.onended = () => {
        soundsRef.current = soundsRef.current.filter((s) => s !== sound);
      };
      sound.onerror = () => {
        soundsRef.current = soundsRef.current.filter((s) => s !== sound);
      };
    },
    [isAudioUnlocked, isPaused]
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

    setQueuedMusic(null);
    setQueuedPrimary(null);
    setQueuedSFX(null);
  }, []);

  // flush das filas (respeitando primário)
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
      if (!isBlockedSound(queuedSFX.src) && !isPrimaryActiveRef.current) {
        const s = new Audio(queuedSFX.src);
        s.preload = "auto";
        s.volume = 1.0;
        s.muted = false;
        const p = s.play();
        if (p !== undefined) p.catch(() => { });
      }
      setQueuedSFX(null);
    }
  }, [isAudioUnlocked, isPaused, queuedPrimary, queuedMusic, queuedSFX, playPrimaryNow, playMusicNow]);

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
    stopMusic, // ✅ EXPOSTO
    primaryAudioRef,
    musicAudioRef,
    isAudioUnlocked,
    activeAudioEl,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);
