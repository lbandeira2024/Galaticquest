import { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';
import { usePause } from './PauseContext';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  // Música de fundo
  const musicAudioRef = useRef(new Audio());

  // Som primário (ex.: decolagem)
  const primaryAudioRef = useRef(new Audio());

  // Trava para impedir que a música volte ao volume cheio durante o primário
  const isPrimaryActiveRef = useRef(false);

  // SFX avulsos (curtos)
  const soundsRef = useRef([]);

  // Elemento de áudio ativo (para debug/inspeção, se necessário)
  const [activeAudioEl, setActiveAudioEl] = useState(null);

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

    // “Ping” silencioso para destravar autoplay em navegadores
    const silentSound = new Audio(
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
    );

    silentSound.play()
      .then(() => {
        silentSound.pause();
        console.log('✅ Contexto de Áudio desbloqueado.');
        setIsAudioUnlocked(true);
      })
      .catch(() => {
        console.warn('Aguardando clique para desbloquear...');
      });
  }, [isAudioUnlocked]);

  useEffect(() => {
    if (!isAudioUnlocked) return;

    if (queuedMusic) {
      playTrack(queuedMusic.src, queuedMusic.options);
      setQueuedMusic(null);
    }

    if (queuedSFX) {
      playTrack(queuedSFX.src, queuedSFX.options);
      setQueuedSFX(null);
    }
  }, [isAudioUnlocked, queuedMusic, queuedSFX]);

  const attachPrimaryDiagnostics = (audioEl, src) => {
    audioEl.oncanplaythrough = () =>
      console.log('✅ PRIMARY canplaythrough', src, 'dur=', audioEl.duration);

    audioEl.onstalled = () => console.log('⚠️ PRIMARY stalled', src);
    audioEl.onwaiting = () => console.log('⚠️ PRIMARY waiting', src);

    audioEl.onplay = () => console.log(`🚀 PRIMARY onplay: ${src}`);
    audioEl.onpause = () => console.log(`⏸ PRIMARY onpause: ${src}`);

    audioEl.onerror = () => {
      // MediaError: 1 aborted, 2 network, 3 decode, 4 src not supported
      console.error('❌ PRIMARY media error', src, audioEl.error);
    };

    // Snapshot curto depois de tentar play (muito útil quando “toca mas não ouve”)
    setTimeout(() => {
      console.log('🎛 PRIMARY snapshot (200ms)', {
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

  const safeLowerMusic = () => {
    const bg = musicAudioRef.current;
    if (bg && !bg.paused) {
      console.log('🔉 Baixando música para 20%.');
      bg.volume = 0.2;
    }
  };

  const safeRestoreMusic = () => {
    const bg = musicAudioRef.current;
    if (!bg) return;
    if (!isPrimaryActiveRef.current) {
      bg.volume = 1.0;
    } else {
      // Se por algum motivo ainda estiver marcado como primário ativo,
      // nunca deixe a música subir aqui.
      bg.volume = 0.2;
    }
  };

  const playTrack = useCallback(
    (src, options = { loop: true, isPrimary: false }) => {
      if (!isAudioUnlocked) {
        if (options.isPrimary) setQueuedSFX({ src, options });
        else setQueuedMusic({ src, options });
        return;
      }

      // =========================
      // SOM PRIMÁRIO (DECOLAGEM)
      // =========================
      if (options.isPrimary) {
        isPrimaryActiveRef.current = true;

        // encerra instância anterior do primário
        if (primaryAudioRef.current) {
          primaryAudioRef.current.pause();
          primaryAudioRef.current.currentTime = 0;
          primaryAudioRef.current.src = '';
        }

        console.log('🆕 Iniciando Som Primário:', src);

        const target = new Audio(src);
        target.preload = 'auto';
        target.loop = !!options.loop;

        // força audibilidade
        target.volume = 1.0;
        target.muted = false;
        target.currentTime = 0;

        // abaixa a música imediatamente
        safeLowerMusic();

        // listeners + diagnóstico
        attachPrimaryDiagnostics(target, src);

        // ao terminar, restaura música e solta trava
        target.onended = () => {
          console.log('🏁 Primário acabou. Restaurando música.');
          isPrimaryActiveRef.current = false;
          safeRestoreMusic();
        };

        // se der erro, também restaura música e solta trava
        const originalOnError = target.onerror;
        target.onerror = () => {
          if (originalOnError) originalOnError();
          console.log('🧯 Primário falhou. Restaurando música.');
          isPrimaryActiveRef.current = false;
          safeRestoreMusic();
        };

        primaryAudioRef.current = target;
        setActiveAudioEl(target);

        target.load();
        const p = target.play();
        if (p !== undefined) {
          p.then(() => console.log('✅ primary play() ok:', src))
            .catch((e) => {
              // NotAllowedError é o clássico de autoplay/política de gesto
              console.error('❌ primary play() falhou:', e?.name, e);
              // Se falhou, solte trava e restaure para não ficar música presa em 20%
              isPrimaryActiveRef.current = false;
              safeRestoreMusic();
            });
        }
        return;
      }

      // =========================
      // MÚSICA DE FUNDO
      // =========================
      const target = musicAudioRef.current;

      const currentSrc = decodeURI(target.src || '');
      const newSrc = (src || '').split('?')[0];

      // Se já está tocando a mesma música, só ajusta volume respeitando o primário
      if (currentSrc.includes(newSrc) && !target.paused) {
        if (!isPrimaryActiveRef.current) target.volume = 1.0;
        else {
          console.log('🛡️ Tentativa de aumentar música bloqueada pelo Primário.');
          target.volume = 0.2;
        }
        setActiveAudioEl(target);
        return;
      }

      target.src = src;
      target.preload = 'auto';
      target.loop = !!options.loop;

      // respeita o primário ao iniciar
      target.volume = isPrimaryActiveRef.current ? 0.2 : 1.0;
      target.muted = false;

      setActiveAudioEl(target);

      const p = target.play();
      if (p !== undefined) {
        p.then(() => console.log(`🎵 Música iniciada (${src})`))
          .catch((e) => {
            if (e?.name !== 'AbortError') console.error('⚠️ Erro música:', e?.name, e);
          });
      }
    },
    [isAudioUnlocked]
  );

  const playSound = useCallback(
    (src) => {
      if (!isAudioUnlocked) return;

      const sound = new Audio(src);
      sound.preload = 'auto';
      sound.volume = 1.0;
      sound.muted = false;

      soundsRef.current.push(sound);

      const p = sound.play();
      if (p !== undefined) {
        p.catch(() => {
          // SFX normalmente você não quer poluir logs, mas pode logar se quiser
        });
      }

      sound.onended = () => {
        soundsRef.current = soundsRef.current.filter((s) => s !== sound);
      };

      sound.onerror = () => {
        soundsRef.current = soundsRef.current.filter((s) => s !== sound);
      };
    },
    [isAudioUnlocked]
  );

  const stopAllAudio = useCallback(() => {
    const bg = musicAudioRef.current;
    const primary = primaryAudioRef.current;

    [bg, primary].forEach((el) => {
      if (!el) return;
      try {
        el.pause();
        el.currentTime = 0;
        // limpar src ajuda a evitar estados “travados” entre rotas
        el.src = '';
      } catch { }
    });

    isPrimaryActiveRef.current = false;

    soundsRef.current.forEach((s) => {
      try {
        s.pause();
        s.currentTime = 0;
        s.src = '';
      } catch { }
    });
    soundsRef.current = [];
  }, []);

  const { isPaused } = usePause();

  useEffect(() => {
    const bg = musicAudioRef.current;
    const primary = primaryAudioRef.current;

    if (isPaused) {
      [bg, primary].forEach((el) => el && !el.paused && el.pause());
      soundsRef.current.forEach((s) => s.pause());
      return;
    }

    // Se quiser retomar automaticamente ao despausar,
    // implemente aqui de forma explícita para não “surpreender” o usuário.
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
