import React from 'react';
import './RouteMonitor.css';

// MODIFICADO: A assinatura da função aceita originPlanet e destinationPlanet para maior clareza.
const RouteMonitor = ({ distanceKm, progress, currentSpeed, isDobraAtivada, originPlanet, destinationPlanet }) => {
  // Calcula o progresso em degraus estritos de 10%
  const discreteProgress = Math.floor(progress / 10) * 10;

  // Aplica efeito de dobra sem alterar a posição discreta
  const visualProgress = isDobraAtivada
    ? discreteProgress + (currentSpeed / 1000000)
    : discreteProgress;

  // Garante que não ultrapasse 100%
  const clampedProgress = Math.min(visualProgress, 100);

  // MODIFICADO: O mapa de emojis agora inclui a Terra para quando for a origem.
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
        {/* MODIFICADO: A origem agora é dinâmica, baseada na prop originPlanet. */}
        <div className="planet origin">
          {planetEmojis[originPlanet] || "🌍"}
          <span>{originPlanet || "Origem"}</span>
        </div>
        <div className="route-line">
          <div
            className="current-position"
            style={{
              left: `${clampedProgress}%`,
              transition: isDobraAtivada ? 'left 0.2s linear' : 'left 0.5s ease-out'
            }}
          >
            <span>Atual</span>
            <div className="pulse-dot"></div>
          </div>
          <div className="distance-readout">
            {Math.max(0, distanceKm).toLocaleString()} km
          </div>
        </div>
        {/* MODIFICADO: O destino usa a prop destinationPlanet para maior clareza. */}
        <div className="planet destination">
          {planetEmojis[destinationPlanet] || "🪐"}
          <span>{destinationPlanet || "Destino"}</span>
        </div>
      </div>
    </div>
  );
};

export default RouteMonitor;