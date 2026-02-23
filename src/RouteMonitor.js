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
    // Estrela
    "Sol": "☀️",

    // Planetas Principais
    "Mercurio": "🟤",
    "Venus": "🟡",
    "Terra": "🌍",
    "Marte": "🔴",
    "Jupiter": "🟠",
    "Saturno": "🪐",
    "Urano": "🧊",
    "Netuno": "🔵",

    // Luas Principais
    "Lua": "🌕",
    "Fobos": "🪨",
    "Deimos": "🪨",
    "Io": "🟡",
    "Europa": "❄️",
    "Ganímedes": "🌖",
    "Calisto": "🌑",
    "Titã": "🟠",
    "Encelado": "❄️",
    "Mimas": "🌑",
    "Titania": "🌑",
    "Oberon": "🌑",
    "Tritao": "🧊",
    "Proteu": "🪨",
    "Caronte": "🌑",

    // Planetas Anões e Asteroides
    "Ceres": "🪨",
    "Plutao": "❄️",
    "Haumea": "🥚",
    "Makemake": "🔴",
    "Eris": "⚪",
    "Vesta": "🪨",
    "Pallas": "🪨",
    "Cinturão": "☄️",
    "Kuiper": "☄️",

    // Exoplanetas
    "Proxima Centauri b": "🌌",
    "TRAPPIST-1e": "🌌",
    "Kepler-186f": "🌌",

    // Estações Espaciais
    "ACEE": "🛰️",
    "Salyut": "🛰️",
    "Delfos": "🛰️",
    "Mol": "🛰️",
    "Skylab": "🛰️",
    "Almaz": "🛰️",
    "Tiangong": "🛰️",
    "Boktok": "🛰️"
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
      {/* Forçamos o padding menor no container para garantir espaço */}
      <div className="route-box" style={{ padding: '10px 20px', justifyContent: 'space-evenly' }}>

        {/* PONTO DE ORIGEM */}
        <div className="planet origin" style={{ margin: 0 }}>
          <div style={{ fontSize: '24px', lineHeight: '1', marginBottom: '2px' }}>
            {getEntityIcon(originPlanet)}
          </div>
          <span style={{ margin: 0 }}>{getDisplayName(originPlanet) || "Origem"}</span>
        </div>

        {/* LINHA DE ROTA E NAVE - Forçamos margens muito menores para não estourar a caixa */}
        <div className="route-line" style={{ margin: '20px 0', width: '90%' }}>
          <div
            className="current-position"
            style={{
              left: `${clampedProgress}%`,
              transition: isDobraAtivada ? 'left 0.2s linear' : 'left 0.5s ease-out',
              opacity: isTrackingActive ? 1 : 0.6
            }}
          >
            <span>Atual</span>
            {/* Margem do ponto reduzida de 25px para 10px */}
            <div className={`pulse-dot ${!isTrackingActive ? 'pulse-fast' : ''}`} style={{ marginBottom: '10px' }}></div>
          </div>
          {/* Margem da distância reduzida de 25px para 10px */}
          <div className="distance-readout" style={{ marginTop: '10px' }}>
            {Math.max(0, displayDistance).toLocaleString()} km
          </div>
        </div>

        {/* PONTO DE DESTINO */}
        <div className="planet destination" style={{ margin: 0 }}>
          <div style={{ fontSize: '24px', lineHeight: '1', marginBottom: '2px' }}>
            {getEntityIcon(destinationPlanet)}
          </div>
          <span style={{ margin: 0 }}>{getDisplayName(destinationPlanet) || "Destino"}</span>
        </div>

      </div>
    </div>
  );
};

export default RouteMonitor;