import { createContext, useContext, useRef, useEffect, useCallback, useState } from "react";
import { usePause } from "./PauseContext";

const AudioContext = createContext();

// Bloqueio explícito de assets inexistentes/indesejados (evita 404 + efeitos colaterais)
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
  // Música de fundo (trilha)
  const musicAudioRef = useRef(new Audio());

  // Som primário (decolagem)
  const primaryAudioRef = useRef(new Audio());

  // Estado/refs de controle
  const isPrimaryActiveRef = useRef(false);

  // SFX curtos
  const soundsRef = useRef([]);

  const [activeAudioEl, setActiveAudioEl] = useState(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  // Filas gerais (antes de unlock / em pausa)
  const [queuedMusic, setQueuedMusic] = useState(null);
  const [queuedPrimary, setQueuedPrimary] = useState(null);
  const [queuedSFX, setQueuedSFX] = useState(null);

  // ✅ Fila pós-primário (o que foi pedido durante a decolagem)
  // - Música pós-primário: first-wins (preserva a música do SpaceView)
  const queuedMusicAfterPrimaryRef = useRef(null);
  // - SFX pós-primário: mantém ordem de chegada
  const queuedSfxAfterPrimaryRef = useRef([]);

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

  // ✅ Para apenas a trilha (sem interferir no primário)
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

  // Debug do primário
  const attachPrimaryDiagnostics = (audioEl, src) => {
    audioEl.onplay = () => console.log(`🚀 PRIMARY onplay: ${src}`);
    audioEl.onpause = () => console.log(`⏸ PRIMARY onpause: ${src}`);
    audioEl.onwaiting = () => console.log(`⚠️ PRIMARY waiting ${src}`);
    audioEl.oncanplaythrough = () =>
      console.log("✅ PRIMARY canplaythrough", src, "dur=", audioEl.duration);
    audioEl.onerror = () => console.error("❌ PRIMARY media error", src, audioEl.error);
  };

  // ✅ SFX: sempre sem loop
  const playSfxNow = useCallback((src) => {
    const sound = new Audio(src);
    sound.preload = "auto";
    sound.volume = 1.0;
    sound.muted = false;
    sound.loop = false;

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

  // ✅ Música: toca agora (se primário ativo, enfileira para pós-primário)
  const playMusicNow = useCallback((src, options) => {
    if (isBlockedSound(src)) {
      console.warn("🚫 Som bloqueado (música) ignorado:", src);
      return;
    }

    if (isPrimaryActiveRef.current) {
      // ✅ first-wins: preserva a primeira música pedida (SpaceView)
      if (!queuedMusicAfterPrimaryRef.current) {
        queuedMusicAfterPrimaryRef.current = { src, options };
        console.log("🧾 Música enfileirada para pós-primário (first-wins):", src);
      } else {
        console.log("🧾 Música ignorada (já existe música pós-primário):", src);
      }
      return;
    }

    const target = musicAudioRef.current;
    const currentSrc = decodeURI(target.src || "");
    const newSrc = normalizeSrc(src);

    // já está tocando a mesma trilha
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

  // ✅ Flush pós-primário: música primeiro, depois SFX enfileirados
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

  // ✅ Primário (decolagem) — desliga trilha ao iniciar; ao terminar libera flush
  const playPrimaryNow = useCallback(
    (src, options) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (primário) ignorado:", src);
        return;
      }

      const target = primaryAudioRef.current;

      // Intercepta pause para rastrear chamadas externas (debug)
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

      // Regra: ao entrar em decolagem, trilha deve parar
      isPrimaryActiveRef.current = true;
      stopMusic();

      attachPrimaryDiagnostics(target, src);

      target.onended = () => {
        console.log("🏁 Primário acabou.");
        isPrimaryActiveRef.current = false;
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

  // API pública: playTrack (música/trilha ou primário)
  const playTrack = useCallback(
    (src, options = { loop: true, isPrimary: false }) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (track) ignorado:", src);
        return;
      }

      // Se ainda não desbloqueou, enfileira
      if (!isAudioUnlocked) {
        if (options.isPrimary) setQueuedPrimary({ src, options });
        else setQueuedMusic({ src, options });
        return;
      }

      // Se pausado, enfileira
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

  // API pública: playSound (SFX one-shot)
  const playSound = useCallback(
    (src) => {
      if (isBlockedSound(src)) {
        console.warn("🚫 Som bloqueado (SFX) ignorado:", src);
        return;
      }

      if (!isAudioUnlocked) return;

      // Se primário está ativo: NÃO perde o evento — enfileira para tocar depois
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
    primaryAudioRef,
    musicAudioRef,
    isAudioUnlocked,
    activeAudioEl,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);
