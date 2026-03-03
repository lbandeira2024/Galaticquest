import React, { useState, useEffect } from 'react';
import './RouteMonitor.css';

// --- DICIONÁRIO DE NOMES PARA EXIBIÇÃO (VISUAL APENAS) ---
const displayNames = {
  "Mercurio": "Mercúrio",
  "Venus": "Vênus",
  "Jupiter": "Júpiter",
  "Plutao": "Plutão",
  "Tritao": "Tritão",
  "Titania": "Titânia",
  "Encelado": "Encélado",
  "Eris": "Éris",
  "Proxima Centauri b": "Próxima Centauri b",
  "Cinturão": "Cinturão de Asteroides",
  "Kuiper": "Cinturão de Kuiper"
};

const getDisplayName = (name) => {
  if (!name) return "";
  if (name.includes("S.O.S próximo a ")) {
    const host = name.replace("S.O.S próximo a ", "");
    return `S.O.S próximo a ${displayNames[host] || host}`;
  }
  return displayNames[name] || name;
};

// --- DICIONÁRIO DE ÍCONES POR CORPO CELESTE ---
const getEntityIcon = (name) => {
  if (!name) return "🌍";
  if (name.includes("S.O.S")) return "🆘";

  const icons = {
    // Estrela e Planetas Principais (Representação Esférica)
    "Sol": "☀️",
    "Mercurio": "🌑",
    "Venus": "🟡",
    "Terra": "🌍",
    "Marte": "🔴",
    "Jupiter": "🟠",
    "Saturno": "🪐",
    "Urano": "🌐",
    "Netuno": "🔵",

    // Luas (Representadas como esferas ou globos lunares)
    "Lua": "🌕",
    "Fobos": "🌑",
    "Deimos": "🌑",
    "Io": "🟡",
    "Europa": "⚪",
    "Ganímedes": "🌖",
    "Calisto": "🌑",
    "Titã": "🟠",
    "Encelado": "⚪",
    "Mimas": "🌑",
    "Titania": "🌑",
    "Oberon": "🌑",
    "Tritao": "🔵",
    "Proteu": "🌑",
    "Caronte": "🌑",

    // Planetas Anões e Corpos Menores
    "Ceres": "⚪",
    "Plutao": "❄️",
    "Haumea": "🥚",
    "Makemake": "🔴",
    "Eris": "⚪",
    "Vesta": "🌑",
    "Pallas": "🌑",
    "Cinturão": "☄️",
    "Kuiper": "☄️",

    // Exoplanetas
    "Proxima Centauri b": "🌌",
    "TRAPPIST-1e": "🌌",
    "Kepler186f": "🌌",

    // ESTAÇÕES ESPACIAIS (As exceções mecânicas)
    "ACEE": "🛰️",
    "Salyut": "🛰️",
    "Delfos": "🛰️",
    "Mol": "🛰️",
    "Skylab": "🛰️",
    "Almaz": "🛰️",
    "Tiangong": "🛰️",
    "Boctok": "🛰️"
  };

  return icons[name] || "🛸";
};

const RouteMonitor = ({ distanceKm, progress, currentSpeed, isDobraAtivada, originPlanet, destinationPlanet, mainDisplayState = 'stars' }) => {
  const [initialDistance, setInitialDistance] = useState(distanceKm);
  const [isTrackingActive, setIsTrackingActive] = useState(false);

  useEffect(() => {
    if (distanceKm > initialDistance || mainDisplayState === 'acee') {
      setInitialDistance(distanceKm);
    }
  }, [distanceKm, mainDisplayState, initialDistance]);

  useEffect(() => {
    let timer;
    if (mainDisplayState === 'stars') {
      timer = setTimeout(() => {
        setIsTrackingActive(true);
      }, 20000);
    } else {
      setIsTrackingActive(false);
    }
    return () => clearTimeout(timer);
  }, [mainDisplayState]);

  const displayDistance = isTrackingActive ? distanceKm : initialDistance;
  const displayProgress = isTrackingActive ? progress : 0;
  const discreteProgress = Math.floor(displayProgress / 10) * 10;

  const visualProgress = isDobraAtivada && isTrackingActive
    ? discreteProgress + (currentSpeed / 1000000)
    : discreteProgress;

  const clampedProgress = Math.min(visualProgress, 100);

  return (
    <div className="route-monitor">
      <h4>Rota Atual</h4>
      <div className="route-box">

        {/* PONTO DE ORIGEM */}
        <div className="planet origin">
          <div className="planet-icon">{getEntityIcon(originPlanet)}</div>
          <span>{getDisplayName(originPlanet) || "Origem"}</span>
        </div>

        {/* LINHA DE ROTA E NAVE */}
        <div className="route-line">
          <div
            className="current-position"
            style={{
              left: `${clampedProgress}%`,
              transition: isDobraAtivada ? 'left 0.2s linear' : 'left 0.5s ease-out',
              opacity: isTrackingActive ? 1 : 0.6
            }}
          >
            <span>Atual</span>
            <div className={`pulse-dot ${!isTrackingActive ? 'pulse-fast' : ''}`}></div>
          </div>
          <div className="distance-readout">
            {Math.max(0, displayDistance).toLocaleString()} km
          </div>
        </div>

        {/* PONTO DE DESTINO */}
        <div className="planet destination">
          <div className="planet-icon">{getEntityIcon(destinationPlanet)}</div>
          <span>{getDisplayName(destinationPlanet) || "Destino"}</span>
        </div>

      </div>
    </div>
  );
};

export default RouteMonitor;