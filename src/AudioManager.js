import { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';
import { usePause } from './PauseContext';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const musicAudioRef = useRef(new Audio());
  const primaryAudioRef = useRef(new Audio());

  // Ref para saber se o som primário está ATIVO no momento
  const isPrimaryActiveRef = useRef(false);

  // Ref para saber se existe um som primário PENDENTE (na fila, aguardando unlock)
  const isPrimaryPendingRef = useRef(false);

  const soundsRef = useRef([]);
  const [activeAudioRef, setActiveAudioRef] = useState(null);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [queuedMusic, setQueuedMusic] = useState(null);
  const [queuedSFX, setQueuedSFX] = useState(null);

  // Ref espelho do queuedMusic para uso em callbacks (onended)
  const queuedMusicRef = useRef(null);
  useEffect(() => {
    queuedMusicRef.current = queuedMusic;
  }, [queuedMusic]);

  const unlockAudio = useCallback(() => {
    if (isAudioUnlocked) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const context = new AudioCtx();
      if (context.state === 'suspended') context.resume();
    }

    const silentSound = new Audio(
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
    );

    silentSound
      .play()
      .then(() => {
        silentSound.pause();
        console.log('✅ Contexto de Áudio desbloqueado.');
        setIsAudioUnlocked(true);
      })
      .catch(() => {
        console.warn('Aguardando clique para desbloquear.');
      });
  }, [isAudioUnlocked]);

  /**
   * Regra do flush:
   * - Se houver PRIMARY na fila (queuedSFX com isPrimary), toca ele primeiro
   *   e NÃO inicia música de fundo em paralelo.
   * - A música (queuedMusic) fica guardada para depois.
   */
  useEffect(() => {
    if (!isAudioUnlocked) return;

    // 1) Se tem primário na fila, ele tem prioridade absoluta
    if (queuedSFX?.options?.isPrimary) {
      playTrack(queuedSFX.src, queuedSFX.options);
      setQueuedSFX(null);
      // Não toca queuedMusic agora (evita trilha em paralelo na decolagem)
      return;
    }

    // 2) Se não tem primário pendente, toca a música de fundo se houver
    if (queuedMusic) {
      playTrack(queuedMusic.src, queuedMusic.options);
      setQueuedMusic(null);
    }

    // 3) Se sobrou algum SFX não-primário na fila, pode tocar (opcional)
    if (queuedSFX) {
      playTrack(queuedSFX.src, queuedSFX.options);
      setQueuedSFX(null);
    }
  }, [isAudioUnlocked, queuedMusic, queuedSFX]); // playTrack é estável via useCallback (abaixo)

  const playTrack = useCallback(
    (src, options = { loop: true, isPrimary: false }) => {
      // BLOQUEIO: se primário está ativo ou pendente, não deixe música/SFX não-primário iniciar
      const primaryLock = isPrimaryActiveRef.current || isPrimaryPendingRef.current;

      if (options.isPrimary) {
        // Se é primário, ele SEMPRE pode entrar (mesmo com lock) — ele é o lock
      } else {
        if (primaryLock) {
          console.log('🛡️ Som bloqueado por PRIMARY (Track) ignorado:', src);
          return;
        }
      }

      // Se áudio ainda não foi desbloqueado, enfileira
      if (!isAudioUnlocked) {
        if (options.isPrimary) {
          // Marca primário como pendente para bloquear qualquer outro som até tocar
          isPrimaryPendingRef.current = true;
          setQueuedSFX({ src, options });
        } else {
          setQueuedMusic({ src, options });
        }
        return;
      }

      // === LÓGICA DE SOM PRIMÁRIO (DECOLAGEM) ===
      if (options.isPrimary) {
        isPrimaryPendingRef.current = false;
        isPrimaryActiveRef.current = true;

        // Cria nova instância para garantir som limpo
        if (primaryAudioRef.current) {
          primaryAudioRef.current.pause();
          primaryAudioRef.current.src = '';
        }

        console.log('🆕 Iniciando Som Primário:', src);
        primaryAudioRef.current = new Audio(src);

        const target = primaryAudioRef.current;
        target.volume = 1.0;
        target.loop = !!options.loop;

        // Abaixa a música imediatamente (se existir)
        if (musicAudioRef.current && !musicAudioRef.current.paused) {
          console.log('🔉 Baixando música para 20%.');
          musicAudioRef.current.volume = 0.2;
        }

        // Listeners
        target.onplay = () => console.log(`🚀 PRIMARY onplay: ${src}`);
        target.onwaiting = () => console.log(`⚠️ PRIMARY waiting ${src}`);
        target.oncanplaythrough = () =>
          console.log(`✅ PRIMARY canplaythrough ${src} dur=`, target.duration);

        target.onerror = (e) => {
          console.error('❌ PRIMARY media error', src, e);
          // Solta travas ao falhar
          isPrimaryActiveRef.current = false;
          isPrimaryPendingRef.current = false;
          // Se havia música em fila, permite tocar depois
        };

        target.onended = () => {
          console.log('🏁 Primário acabou. Restaurando música.');
          isPrimaryActiveRef.current = false;
          isPrimaryPendingRef.current = false;

          if (musicAudioRef.current) {
            musicAudioRef.current.volume = 1.0;
          }

          // Se a música foi deixada na fila (por prioridade do primário), retoma aqui
          const qm = queuedMusicRef.current;
          if (qm && isAudioUnlocked) {
            console.log('🎶 Retomando queuedMusic após PRIMARY:', qm.src);
            playTrack(qm.src, qm.options);
            setQueuedMusic(null);
          }
        };

        target.load();

        const p = target.play();
        if (p !== undefined) {
          p.then(() => console.log(`✅ primary play() ok: ${src}`)).catch((e) => {
            console.error('❌ primary play() falhou:', e?.name, e);
            // Solta travas ao falhar
            isPrimaryActiveRef.current = false;
            isPrimaryPendingRef.current = false;
          });
        }

        setActiveAudioRef(primaryAudioRef);
        return;
      }

      // === LÓGICA DE MÚSICA DE FUNDO ===
      const target = musicAudioRef.current;
      const currentSrc = decodeURI(target.src || '');
      const newSrc = src.split('?')[0];

      // Se já está tocando a mesma música, apenas ajusta volume e sai
      if (currentSrc.includes(newSrc) && !target.paused) {
        if (!isPrimaryActiveRef.current && !isPrimaryPendingRef.current) {
          target.volume = 1.0;
        } else {
          console.log('🛡️ Tentativa de aumentar música bloqueada pela Decolagem.');
        }
        return;
      }

      target.pause();
      target.currentTime = 0;
      target.src = src;
      target.loop = !!options.loop;

      // Se primário está ativo, música fica baixa
      target.volume = isPrimaryActiveRef.current ? 0.2 : 1.0;

      const p = target.play();
      if (p !== undefined) {
        p.then(() => console.log(`🎵 Música iniciada (${src})`)).catch((e) => {
          if (e.name !== 'AbortError') console.error('⚠️ Erro música:', e);
        });
      }

      setActiveAudioRef(musicAudioRef);
    },
    [isAudioUnlocked]
  );

  const playSound = useCallback(
    (src) => {
      if (!isAudioUnlocked) return;

      // BLOQUEIO: se primário está ativo ou pendente, ignora SFX (empuxo, hover etc.)
      if (isPrimaryActiveRef.current || isPrimaryPendingRef.current) {
        console.log('🚫 Som bloqueado (SFX) ignorado:', src);
        return;
      }

      const sound = new Audio(src);
      soundsRef.current.push(sound);
      sound.volume = 1.0;

      sound.play().catch(() => { });
      sound.onended = () => {
        soundsRef.current = soundsRef.current.filter((s) => s !== sound);
      };
    },
    [isAudioUnlocked]
  );

  const stopAllAudio = useCallback(() => {
    [musicAudioRef.current, primaryAudioRef.current].forEach((ref) => {
      if (ref && !ref.paused) {
        ref.pause();
        ref.currentTime = 0;
      }
    });

    isPrimaryActiveRef.current = false;
    isPrimaryPendingRef.current = false;

    soundsRef.current.forEach((s) => s.pause());
    soundsRef.current = [];

    // IMPORTANTÍSSIMO: limpa filas para não “renascer” trilha ao desbloquear
    setQueuedMusic(null);
    setQueuedSFX(null);
  }, []);

  const { isPaused } = usePause();

  useEffect(() => {
    const refs = [musicAudioRef.current, primaryAudioRef.current];
    if (isPaused) {
      refs.forEach((ref) => ref && !ref.paused && ref.pause());
      soundsRef.current.forEach((s) => s.pause());
    } else if (isAudioUnlocked) {
      // opcional: retomar áudio se desejar
    }
  }, [isPaused, isAudioUnlocked]);

  const value = {
    unlockAudio,
    playTrack,
    playSound,
    stopAllAudio,
    primaryAudioRef,
    musicAudioRef,
    isAudioUnlocked,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);
