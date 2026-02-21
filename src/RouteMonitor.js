import React, { useState, useEffect } from 'react';
import './RouteMonitor.css';

const RouteMonitor = ({ distanceKm, progress, currentSpeed, isDobraAtivada, originPlanet, destinationPlanet, mainDisplayState = 'stars' }) => {
  // Guarda a distância inicial para travar a tela
  const [initialDistance, setInitialDistance] = useState(distanceKm);

  // Estado que controla se o monitor já deve exibir a contagem
  const [isTrackingActive, setIsTrackingActive] = useState(false);

  useEffect(() => {
    // Atualiza a distância inicial se mudar de rota ou se a viagem não tiver começado (acee)
    if (distanceKm > initialDistance || mainDisplayState === 'acee') {
      setInitialDistance(distanceKm);
    }
  }, [distanceKm, mainDisplayState, initialDistance]);

  useEffect(() => {
    let timer;
    // Só ativa o monitor 20 segundos (20000 ms) depois que as estrelas (stars) iniciam
    if (mainDisplayState === 'stars') {
      timer = setTimeout(() => {
        setIsTrackingActive(true);
      }, 20000);
    } else {
      // Bloqueia a contagem nas fases anteriores (nuvens, estática, acee)
      setIsTrackingActive(false);
    }

    // Limpa o timer para evitar bugs se o componente desmontar
    return () => clearTimeout(timer);
  }, [mainDisplayState]);

  // Define os valores que aparecem na tela (Travados até passar os 20s nas estrelas)
  const displayDistance = isTrackingActive ? distanceKm : initialDistance;
  const displayProgress = isTrackingActive ? progress : 0;

  // Calcula o progresso em degraus estritos de 10%
  const discreteProgress = Math.floor(displayProgress / 10) * 10;

  // Aplica efeito de dobra sem alterar a posição discreta
  const visualProgress = isDobraAtivada && isTrackingActive
    ? discreteProgress + (currentSpeed / 1000000)
    : discreteProgress;

  // Garante que não ultrapasse 100%
  const clampedProgress = Math.min(visualProgress, 100);

  const planetEmojis = {
    "Terra": "🌍",
    "Marte": "🔴",
    "Lua": "🌕",
    "Mercurio": "🪐",
    "Venus": "🌖",
    "Jupiter": "🪐",
    "Saturno": "🪐",
    "Urano": "🪐",
    "Netuno": "🪐",
    "Ceres": "🌑",
  };

  return (
    <div className="route-monitor">
      <h4>Rota Atual</h4>
      <div className="route-box">
        <div className="planet origin">
          {planetEmojis[originPlanet] || "🌍"}
          <span>{originPlanet || "Origem"}</span>
        </div>
        <div className="route-line">
          <div
            className="current-position"
            style={{
              left: `${clampedProgress}%`,
              transition: isDobraAtivada ? 'left 0.2s linear' : 'left 0.5s ease-out',
              opacity: isTrackingActive ? 1 : 0.6 // Fica mais apagado durante a espera inicial
            }}
          >
            <span>Atual</span>
            <div className={`pulse-dot ${!isTrackingActive ? 'pulse-fast' : ''}`}></div>
          </div>
          <div className="distance-readout">
            {Math.max(0, displayDistance).toLocaleString()} km
          </div>
        </div>
        <div className="planet destination">
          {planetEmojis[destinationPlanet] || "🪐"}
          <span>{destinationPlanet || "Destino"}</span>
        </div>
      </div>
    </div>
  );
};

export default RouteMonitor;