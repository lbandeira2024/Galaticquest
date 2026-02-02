import React, { useEffect, useState } from 'react';
import './MissionTimer.css';
import { usePause } from './PauseContext';

const MissionTimer = () => {
  const { isPaused } = usePause();

  // Função para obter o tempo inicial do sessionStorage ou definir um padrão
  const getInitialTime = () => {
    const savedTime = sessionStorage.getItem('missionTime');
    // Se um tempo estiver salvo no sessionStorage, usa ele. Senão, inicia com 12 horas.
    return savedTime ? parseInt(savedTime, 10) : 12 * 60 * 60;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTime);

  // Efeito para rodar o contador
  useEffect(() => {
    if (isPaused) {
      return; // Se estiver pausado, não faz nada
    }

    // Inicia um intervalo que diminui o tempo a cada segundo
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(prev - 1, 0));
    }, 1000);

    // Limpa o intervalo quando o componente é desmontado ou quando isPaused muda
    return () => clearInterval(interval);
  }, [isPaused]); // A dependência é 'isPaused'

  // Efeito para salvar o tempo no sessionStorage sempre que ele for alterado
  useEffect(() => {
    // Não salva se o tempo for o inicial para evitar escritas desnecessárias
    if (timeLeft !== 12 * 60 * 60) {
      sessionStorage.setItem('missionTime', timeLeft.toString());
    }
  }, [timeLeft]); // A dependência é 'timeLeft'


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