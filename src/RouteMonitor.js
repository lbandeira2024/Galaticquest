import React, { useState, useEffect } from 'react';
import './RouteMonitor.css';

const RouteMonitor = ({ distanceKm, progress, currentSpeed, isDobraAtivada, originPlanet, destinationPlanet, mainDisplayState = 'stars' }) => {
  // Guarda a distância inicial para travar a tela durante a decolagem
  const [initialDistance, setInitialDistance] = useState(distanceKm);

  useEffect(() => {
    // Atualiza a distância inicial se mudar de rota ou se a viagem não tiver começado (acee)
    if (distanceKm > initialDistance || mainDisplayState === 'acee') {
      setInitialDistance(distanceKm);
    }
  }, [distanceKm, mainDisplayState, initialDistance]);

  // Verifica se a nave já está no espaço
  const isInSpace = mainDisplayState === 'stars';

  // Define os valores que aparecem na tela (Travados na decolagem, reais no espaço)
  const displayDistance = isInSpace ? distanceKm : initialDistance;
  const displayProgress = isInSpace ? progress : 0;

  // Calcula o progresso em degraus estritos de 10%
  const discreteProgress = Math.floor(displayProgress / 10) * 10;

  // Aplica efeito de dobra sem alterar a posição discreta
  const visualProgress = isDobraAtivada && isInSpace
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
              opacity: isInSpace ? 1 : 0.6 // Fica mais apagado durante a decolagem
            }}
          >
            {/* Texto dinâmico removido, fica "Atual" sempre */}
            <span>Atual</span>
            <div className={`pulse-dot ${!isInSpace ? 'pulse-fast' : ''}`}></div>
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