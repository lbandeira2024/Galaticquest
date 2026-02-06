import { createContext, useContext, useRef, useEffect, useCallback, useState } from "react";
import { usePause } from "./PauseContext";

const AudioContext = createContext();

// 🔒 Bloqueio explícito do arquivo que está causando 404 e potencial efeito colateral
const BLOCKED_SOUNDS = new Set([
  "/sounds/02.ui-hover.mp3",
  "sounds/02.ui-hover.mp3",
  "02.ui-hover.mp3",
]);

const normalizeSrc = (src = "") => {
  try {
    // remove querystring para comparar
    return String(src).split("?")[0];
  } catch {
    return String(src || "");
  }
};

const isBlockedSound = (src = "") => {
  const clean = normalizeSrc(src);
  if (BLOCKED_SOUNDS.has(clean)) return true;
  // fallback: se a string contiver o nome, bloqueia também
  return clean.toLowerCase().includes("02.ui-hover.mp3");
};

export const AudioProvider = ({ children }) => {
  // Música de fundo
  const musicAudioRef = useRef(new Audio());

  // Primário (decolagem)
  const primaryAudioRef = useRef(new Audio());

  // Se o primário está ativo, baixamos música e protegemos contra “auto-up volume”
  const isPrimaryActiveRef = useRef(false);

  // SFX curtos
  const soundsRef = useRef([]);

  // opcional: depuração
  const [activeAudioEl, setActiveAudioEl] = useState(null);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  // Filas para quando estiver pausado ou antes de unlock
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

    // “ping” silencioso para destravar autoplay
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

  // util: baixar música
  const lowerMusic = useCallback(() => {
    const bg = musicAudioRef.current;
    if (bg && !bg.paused) {
      console.log("🔉 Baixando música para 20%.");
      bg.volume = 0.2;
    }
  }, []);

  // util: restaurar música
  const restoreMusic = useCallback(() => {
    const bg = musicAudioRef.current;
    if (!bg) return;
    if (!isPrimaryActiveRef.current) bg.volume = 1.0;
    else bg.volume = 0.2;
  }, []);

  // diagnóstico do primário
  const attachPrimaryDiagnostics = useCallback((audioEl, src) => {
    audioEl.onplay = () => console.log(`🚀 PRIMARY onplay: ${src}`);
    audioEl.onpause = () => console.log(`⏸ PRIMARY onpause: ${src}`);
    audioEl.oncanplaythrough = () =>
      console.log("✅ PRIMARY canplaythrough", src, "dur=", audioEl.duration);

    audioEl.onstalled = () => console.log("⚠️ PRIMARY stalled", src);
    audioEl.onwaiting = () => console.log("⚠️ PRIMARY waiting", src);

    audioEl.onerror = () => {
      console.error("❌ PRIMARY media error", src, audioEl.error);
    };

    setTimeout(() => {
      console.log("🎛 PRIMARY snapshot (200ms)", {
        src,
        paused: audioEl.paused,
        currentTime: audioEl.currentTime,
        duration: audioEl.duration,
        volume: audioEl.volume,
        muted: audioEl.muted,
        readyState: audioEl.readyState,
        networkState: audioEl.networkState,
      });
    }, 200);
  }, []);

  // ✅ tocar primário usando SEMPRE o mesmo elemento (mais estável)
  const playPrimaryNow = useCallback(
    (src, options) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (primário) ignorado:", src);
        return;
      }

      const target = primaryAudioRef.current;

      // intercepta pause() para descobrir QUEM está pausando
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

      // força audibilidade
      target.volume = 1.0;
      target.muted = false;

      // protege a música durante o primário
      isPrimaryActiveRef.current = true;
      lowerMusic();

      attachPrimaryDiagnostics(target, src);

      target.onended = () => {
        console.log("🏁 Primário acabou. Restaurando música.");
        isPrimaryActiveRef.current = false;
        restoreMusic();
      };

      const originalOnError = target.onerror;
      target.onerror = () => {
        if (originalOnError) originalOnError();
        console.log("🧯 Primário falhou. Restaurando música.");
        isPrimaryActiveRef.current = false;
        restoreMusic();
      };

      setActiveAudioEl(target);

      target.load();
      const p = target.play();
      if (p !== undefined) {
        p.then(() => console.log("✅ primary play() ok:", src)).catch((e) => {
          console.error("❌ primary play() falhou:", e?.name, e);
          isPrimaryActiveRef.current = false;
          restoreMusic();
        });
      }
    },
    [attachPrimaryDiagnostics, lowerMusic, restoreMusic]
  );

  // tocar música de fundo
  const playMusicNow = useCallback((src, options) => {
    if (isBlockedSound(src)) {
      console.warn("🚫 Som bloqueado (música) ignorado:", src);
      return;
    }

    const target = musicAudioRef.current;

    const currentSrc = decodeURI(target.src || "");
    const newSrc = normalizeSrc(src);

    // Se já é a mesma música, apenas ajuste volume respeitando primário
    if (currentSrc.includes(newSrc) && !target.paused) {
      if (!isPrimaryActiveRef.current) target.volume = 1.0;
      else {
        console.log("🛡️ Tentativa de aumentar música bloqueada pelo Primário.");
        target.volume = 0.2;
      }
      setActiveAudioEl(target);
      return;
    }

    target.src = src;
    target.preload = "auto";
    target.loop = !!options.loop;
    target.muted = false;

    target.volume = isPrimaryActiveRef.current ? 0.2 : 1.0;

    setActiveAudioEl(target);

    const p = target.play();
    if (p !== undefined) {
      p.then(() => console.log(`🎵 Música iniciada (${src})`)).catch((e) => {
        if (e?.name !== "AbortError") console.error("⚠️ Erro música:", e?.name, e);
      });
    }
  }, []);

  // API pública: playTrack (música ou primário)
  const playTrack = useCallback(
    (src, options = { loop: true, isPrimary: false }) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (track) ignorado:", src);
        return;
      }

      // 1) sem unlock: fila
      if (!isAudioUnlocked) {
        if (options.isPrimary) setQueuedPrimary({ src, options });
        else setQueuedMusic({ src, options });
        return;
      }

      // 2) se pausado: enfileira e não tenta tocar
      if (isPaused) {
        if (options.isPrimary) setQueuedPrimary({ src, options });
        else setQueuedMusic({ src, options });
        console.log("⏸️ Áudio em pausa — enfileirando:", src);
        return;
      }

      // 3) toca agora
      if (options.isPrimary) {
        playPrimaryNow(src, options);
        return;
      }

      playMusicNow(src, options);
    },
    [isAudioUnlocked, isPaused, playPrimaryNow, playMusicNow]
  );

  // API pública: playSound (SFX)
  const playSound = useCallback(
    (src) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (SFX) ignorado:", src);
        return;
      }

      if (!isAudioUnlocked) return;

      // se pausado: enfileira só o último SFX (para não spammar)
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

  // ✅ stopAllAudio com stack trace
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

  // Ao desbloquear e NÃO estar pausado: toca o que estiver na fila
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
      if (!isBlockedSound(queuedSFX.src)) {
        const s = new Audio(queuedSFX.src);
        s.preload = "auto";
        s.volume = 1.0;
        s.muted = false;
        const p = s.play();
        if (p !== undefined) p.catch(() => { });
      } else {
        console.warn("🚫 SFX bloqueado (fila) ignorado:", queuedSFX.src);
      }
      setQueuedSFX(null);
    }
  }, [isAudioUnlocked, isPaused, queuedPrimary, queuedMusic, queuedSFX, playPrimaryNow, playMusicNow]);

  // Se pausar, pausa tudo (sem limpar src aqui)
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
    primaryAudioRef,
    musicAudioRef,
    isAudioUnlocked,
    activeAudioEl,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);
