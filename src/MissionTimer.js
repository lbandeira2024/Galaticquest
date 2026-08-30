import React, { useEffect, useRef, useState } from 'react';
import './MissionTimer.css';
import { usePause } from './PauseContext';
import { useAuth } from './AuthContext';
import { useConfig } from './ConfigContext';

const DEFAULT_MISSION_TIME = 12 * 60 * 60; // 12 horas em segundos

const MissionTimer = () => {
  const { isPaused } = usePause();
  const { user } = useAuth();
  const { apiBaseUrl } = useConfig();
  const userId = user?._id;
  const API_BASE_URL = apiBaseUrl;

  // Função para obter um valor inicial "de exibição" imediato (evita mostrar
  // 12:00:00 piscando enquanto o valor real ainda não voltou do servidor).
  // O valor definitivo, porém, só vale depois que isLoaded virar true.
  const getInitialDisplayTime = () => {
    const savedTime = sessionStorage.getItem('missionTime');
    return savedTime ? parseInt(savedTime, 10) : DEFAULT_MISSION_TIME;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialDisplayTime);
  // [RETOMADA] Só começa a contar/salvar depois de confirmar o valor real
  // vindo do servidor — assim não sobrescrevemos o progresso salvo com o
  // valor padrão de 12h enquanto o fetch ainda está em andamento.
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs espelhando o estado mais recente, para os callbacks de auto-save e
  // de saída (pagehide/beforeunload) não lerem valores "presos" (stale).
  const timeLeftRef = useRef(timeLeft);
  const isLoadedRef = useRef(false);

  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { isLoadedRef.current = isLoaded; }, [isLoaded]);

  // ========================================================
  // [RETOMADA] Busca o tempo de missão salvo no Grupo (servidor) ao montar
  // ========================================================
  useEffect(() => {
    if (!userId || !API_BASE_URL) return;
    let cancelled = false;

    fetch(`${API_BASE_URL}/${userId}/game-data`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        console.log("[RETOMADA] MissionTimer - tempo recebido do servidor:", data.missionTimeLeft);
        if (typeof data.missionTimeLeft === 'number' && !Number.isNaN(data.missionTimeLeft)) {
          setTimeLeft(data.missionTimeLeft);
        }
        setIsLoaded(true);
      })
      .catch(err => {
        console.error("[RETOMADA] MissionTimer - erro ao buscar tempo salvo:", err);
        // Mesmo com erro, libera o contador pra rodar com o valor local
        // (sessionStorage/padrão) em vez de travar o timer pra sempre.
        setIsLoaded(true);
      });

    return () => { cancelled = true; };
  }, [userId, API_BASE_URL]);

  // Efeito para rodar o contador (só depois de carregar o valor salvo)
  useEffect(() => {
    if (isPaused || !isLoaded) {
      return; // Se estiver pausado ou ainda carregando o valor do servidor, não faz nada
    }

    // Inicia um intervalo que diminui o tempo a cada segundo
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(prev - 1, 0));
    }, 1000);

    // Limpa o intervalo quando o componente é desmontado ou quando isPaused/isLoaded muda
    return () => clearInterval(interval);
  }, [isPaused, isLoaded]);

  // Efeito para salvar o tempo no sessionStorage sempre que ele for alterado
  // (mantido só como cache local de exibição imediata — quem manda de
  // verdade agora é o servidor, ver auto-save abaixo).
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem('missionTime', timeLeft.toString());
    }
  }, [timeLeft, isLoaded]);

  // ========================================================
  // [RETOMADA] AUTO-SAVE DO TEMPO DE MISSÃO NO SERVIDOR (15s)
  // ========================================================
  useEffect(() => {
    if (isPaused || !isLoaded || !userId || !API_BASE_URL) return;

    const autoSaveInterval = setInterval(() => {
      console.log("[RETOMADA] MissionTimer - Auto-save (15s) disparando com:", timeLeftRef.current);
      fetch(`${API_BASE_URL}/${userId}/update-gamedata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionTimeLeft: timeLeftRef.current }),
      }).then(res => res.json()).then(json => {
        console.log("[RETOMADA] MissionTimer - Auto-save (15s) resposta do servidor (grupo gravado):", {
          success: json.success,
          missionTimeLeft: json.user?.grupo?.missionTimeLeft,
        });
      }).catch(err => console.error("Erro no auto-save do tempo de missão:", err));
    }, 15000);

    return () => clearInterval(autoSaveInterval);
  }, [isPaused, isLoaded, userId, API_BASE_URL]);

  // ========================================================
  // SALVAMENTO GARANTIDO AO FECHAR A ABA/NAVEGADOR
  // (mesmo mecanismo já usado para a rota/distância: não existe botão de
  // "Sair", o jogador só fecha o navegador, então isso funciona como o
  // "logout" do jogo — sem isso, até 15s de contagem do auto-save acima
  // podem se perder.)
  // ========================================================
  useEffect(() => {
    const flushMissionTimeOnExit = () => {
      if (!userId || !API_BASE_URL || !isLoadedRef.current) return;
      const payload = { missionTimeLeft: timeLeftRef.current };
      const url = `${API_BASE_URL}/${userId}/update-gamedata`;
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
        } else {
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => { });
        }
      } catch (e) {
        console.error("Erro ao salvar tempo de missão antes de sair:", e);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushMissionTimeOnExit();
    };

    window.addEventListener('pagehide', flushMissionTimeOnExit);
    window.addEventListener('beforeunload', flushMissionTimeOnExit);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', flushMissionTimeOnExit);
      window.removeEventListener('beforeunload', flushMissionTimeOnExit);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, API_BASE_URL]);

  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="mission-timer">
      <div className="timer-label">TEMPO DE MISSÃO</div>
      <div className="timer-display">
        {formatTime(timeLeft)}
      </div>
    </div>
  );
};

export default MissionTimer;