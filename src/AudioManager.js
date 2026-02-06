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

// Heurística simples: se for "música de navegação" você quer tocar como trilha (não como SFX).
// Ajuste nomes aqui se quiser.
const isNavigationMusic = (src = "") => {
  const s = normalizeSrc(src).toLowerCase();
  return (
    s.includes("velinterplanetaria") ||
    s.includes("minerva") ||
    s.includes("mineva-velinterplanetaria")
  );
};

export const AudioProvider = ({ children }) => {
  const musicAudioRef = useRef(new Audio());
  const primaryAudioRef = useRef(new Audio());

  const isPrimaryActiveRef = useRef(false);
  const soundsRef = useRef([]);

  const [activeAudioEl, setActiveAudioEl] = useState(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  // Filas (antes do unlock/pausa)
  const [queuedMusic, setQueuedMusic] = useState(null);
  const [queuedPrimary, setQueuedPrimary] = useState(null);
  const [queuedSFX, setQueuedSFX] = useState(null);

  // ✅ NOVO: Fila pós-primário (sons que chegaram enquanto decolagem estava tocando)
  const queuedMusicAfterPrimaryRef = useRef(null); // guarda 1 trilha (a última solicitada)
  const queuedSfxAfterPrimaryRef = useRef([]);     // guarda SFX na ordem

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

  // ✅ toca música (trilha)
  const playMusicNow = useCallback((src, options) => {
    if (isBlockedSound(src)) {
      console.warn("🚫 Som bloqueado (música) ignorado:", src);
      return;
    }

    // Se primário ainda ativo, enfileira para pós-primário
    if (isPrimaryActiveRef.current) {
      queuedMusicAfterPrimaryRef.current = { src, options };
      console.log("🧾 Música enfileirada para pós-primário:", src);
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

  // ✅ toca SFX
  const playSfxNow = useCallback((src) => {
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
  }, []);

  // ✅ flush pós-primário: música primeiro, depois SFX na ordem
  const flushAfterPrimary = useCallback(() => {
    const qm = queuedMusicAfterPrimaryRef.current;
    if (qm) {
      queuedMusicAfterPrimaryRef.current = null;
      playMusicNow(qm.src, qm.options || { loop: true, isPrimary: false });
    }

    const sfxQueue = queuedSfxAfterPrimaryRef.current;
    if (sfxQueue.length) {
      queuedSfxAfterPrimaryRef.current = [];
      sfxQueue.forEach((s) => playSfxNow(s));
    }
  }, [playMusicNow, playSfxNow]);

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

      // Regra: ao iniciar primário, música deve estar OFF
      isPrimaryActiveRef.current = true;
      stopMusic();

      attachPrimaryDiagnostics(target, src);

      target.onended = () => {
        console.log("🏁 Primário acabou.");
        isPrimaryActiveRef.current = false;

        // ✅ Ao terminar o primário: toca a música de navegação e depois libera SFX
        flushAfterPrimary();
      };

      const originalOnError = target.onerror;
      target.onerror = () => {
        if (originalOnError) originalOnError();
        console.log("🧯 Primário falhou.");
        isPrimaryActiveRef.current = false;
        flushAfterPrimary();
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

  // API pública: playTrack (música ou primário)
  const playTrack = useCallback(
    (src, options = { loop: true, isPrimary: false }) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (track) ignorado:", src);
        return;
      }

      // sem unlock: fila
      if (!isAudioUnlocked) {
        if (options.isPrimary) setQueuedPrimary({ src, options });
        else setQueuedMusic({ src, options });
        return;
      }

      // pausado: fila
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

      // ✅ música normal: se primário ativo, enfileira pós-primário
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

      // ✅ Se primário ativo:
      // - se for "música de navegação" chamada via playSound, trate como trilha pós-primário
      // - caso contrário, enfileire SFX pós-primário na ordem
      if (isPrimaryActiveRef.current) {
        if (isNavigationMusic(src)) {
          queuedMusicAfterPrimaryRef.current = { src, options: { loop: true, isPrimary: false } };
          console.log("🧾 Navegação enfileirada (via playSound) para pós-primário:", src);
        } else {
          queuedSfxAfterPrimaryRef.current.push(src);
          console.log("🧾 SFX enfileirado para pós-primário:", src);
        }
        return;
      }

      if (isPaused) {
        setQueuedSFX({ src, options: { loop: false, isPrimary: false } });
        console.log("⏸️ SFX em pausa — enfileirando:", src);
        return;
      }

      // tocar agora
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

  // flush das filas pós-unlock (respeitando primário)
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
      // se primário ativo, vira pós-primário; senão toca agora
      if (isPrimaryActiveRef.current) {
        queuedSfxAfterPrimaryRef.current.push(queuedSFX.src);
        console.log("🧾 SFX enfileirado (fila unlock) para pós-primário:", queuedSFX.src);
      } else {
        playSfxNow(queuedSFX.src);
      }
      setQueuedSFX(null);
    }
  }, [isAudioUnlocked, isPaused, queuedPrimary, queuedMusic, queuedSFX, playPrimaryNow, playMusicNow, playSfxNow]);

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
    primaryAudioRef,
    musicAudioRef,
    isAudioUnlocked,
    activeAudioEl,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);
