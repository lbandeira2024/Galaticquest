import React from 'react';
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
    "Sol": "☀️", "Mercurio": "🌑", "Venus": "🟡", "Terra": "🌍", "Marte": "🔴",
    "Jupiter": "🟠", "Saturno": "🪐", "Urano": "🔵", "Netuno": "🔵",
    "Lua": "🌕", "Fobos": "🌑", "Deimos": "🌑", "Io": "🟡", "Europa": "⚪",
    "Ganímedes": "🌖", "Calisto": "🌑", "Titã": "🟠", "Encelado": "⚪",
    "Mimas": "🌑", "Titania": "🌑", "Oberon": "🌑", "Tritao": "🔵",
    "Proteu": "🌑", "Caronte": "🌑", "Ceres": "⚪", "Plutao": "🟤",
    "Haumea": "🥚", "Makemake": "🔴", "Eris": "⚪", "Vesta": "🌑",
    "Pallas": "🌑", "Cinturão": "☄️", "Kuiper": "☄️",
    "Proxima Centauri b": "🟣", "Trappist1e": "🟢", "Kepler186f": "🟢",
    "ACEE": "🛰️", "Salyut": "🛰️", "Delfos": "🛰️", "Mol": "🛰️",
    "Skylab": "🛰️", "Almaz": "🛰️", "Tiangong": "🛰️", "Boctok": "🛰️"
  };
  return icons[name] || "🛸";
};

const RouteMonitor = ({ distanceKm, progress, isDobraAtivada, originPlanet, destinationPlanet }) => {
  // Mantém a precisão decimal, removendo arredondamentos bruscos
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

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
              transition: isDobraAtivada ? 'left 0.2s linear' : 'left 0.5s ease-out'
            }}
          >
            <span>Atual</span>
            <div className="pulse-dot"></div>
          </div>
          <div className="distance-readout">
            {Math.max(0, distanceKm).toLocaleString('pt-BR')} km
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