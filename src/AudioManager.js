import { createContext, useContext, useRef, useEffect, useCallback, useState } from "react";
import { usePause } from "./PauseContext";

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const musicAudioRef = useRef(new Audio());
  const primaryAudioRef = useRef(new Audio());

  // Ref para saber se o som primário está ATIVO no momento
  const isPrimaryActiveRef = useRef(false);

  const soundsRef = useRef([]);
  const [activeAudioEl, setActiveAudioEl] = useState(null);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  // Filas: se pedir play durante pausa / antes de unlock
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
        console.warn("Aguardando clique para desbloquear.");
      });
  }, [isAudioUnlocked]);

  // Util: abaixa música
  const lowerMusic = () => {
    const bg = musicAudioRef.current;
    if (bg && !bg.paused) {
      console.log("🔉 Baixando música para 20%.");
      bg.volume = 0.2;
    }
  };

  // Util: restaura música (se não houver primário ativo)
  const restoreMusic = () => {
    const bg = musicAudioRef.current;
    if (!bg) return;
    if (!isPrimaryActiveRef.current) bg.volume = 1.0;
    else bg.volume = 0.2;
  };

  // Util: diagnóstico do primário
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
  };

  const playPrimaryNow = useCallback(
    (src, options) => {
      // encerra instância anterior do primário
      if (primaryAudioRef.current) {
        try {
          primaryAudioRef.current.pause();
          primaryAudioRef.current.currentTime = 0;
          primaryAudioRef.current.src = "";
        } catch { }
      }

      console.log("🆕 Iniciando Som Primário:", src);

      const target = new Audio(src);
      target.preload = "auto";
      target.loop = !!options.loop;

      // força audibilidade
      target.volume = 1.0;
      target.muted = false;
      target.currentTime = 0;

      // baixa música imediatamente
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

      primaryAudioRef.current = target;
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
    [lowerMusic]
  );

  const playMusicNow = useCallback((src, options) => {
    const target = musicAudioRef.current;

    const currentSrc = decodeURI(target.src || "");
    const newSrc = (src || "").split("?")[0];

    // Se já está tocando a mesma música, apenas ajusta volume e sai
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

    // respeita primário
    target.volume = isPrimaryActiveRef.current ? 0.2 : 1.0;

    setActiveAudioEl(target);

    const p = target.play();
    if (p !== undefined) {
      p.then(() => console.log(`🎵 Música iniciada (${src})`)).catch((e) => {
        if (e?.name !== "AbortError") console.error("⚠️ Erro música:", e?.name, e);
      });
    }
  }, []);

  // API pública
  const playTrack = useCallback(
    (src, options = { loop: true, isPrimary: false }) => {
      // 1) sem unlock: fila
      if (!isAudioUnlocked) {
        if (options.isPrimary) setQueuedPrimary({ src, options });
        else setQueuedMusic({ src, options });
        return;
      }

      // 2) se pausado: NÃO tente tocar (evita AbortError); fila
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

  const playSound = useCallback(
    (src) => {
      if (!isAudioUnlocked) return;

      // Se pausado, você pode escolher: ignorar ou enfileirar.
      // Aqui eu enfileiro 1 SFX (último), para não spammar.
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

  // Quando desbloquear, tenta tocar o que estava na fila (se não estiver pausado)
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
      const s = new Audio(queuedSFX.src);
      s.preload = "auto";
      s.volume = 1.0;
      s.muted = false;
      const p = s.play();
      if (p !== undefined) p.catch(() => { });
      setQueuedSFX(null);
    }
  }, [isAudioUnlocked, isPaused, queuedPrimary, queuedMusic, queuedSFX, playPrimaryNow, playMusicNow]);

  // Se pausar, pausa tudo (mas sem “quebrar” o estado; não limpa src aqui)
  useEffect(() => {
    const refs = [musicAudioRef.current, primaryAudioRef.current];

    if (isPaused) {
      refs.forEach((ref) => ref && !ref.paused && ref.pause());
      soundsRef.current.forEach((s) => s.pause());
    }
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
