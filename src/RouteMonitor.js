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

  // Se for um S.O.S, devolve o ícone de emergência
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
    "Urano": "🧊", // Planeta gelado
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
    "Haumea": "🥚", // Forma ovalada
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

  // Se o nome não estiver na lista, devolve um ícone genérico (um planeta ou nave)
  return icons[name] || "🛸";
};

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

  return (
    <div className="route-monitor">
      <h4>Rota Atual</h4>
      <div className="route-box">

        {/* PONTO DE ORIGEM */}
        <div className="planet origin">
          <div style={{ fontSize: '2em', marginBottom: '5px' }}>
            {getEntityIcon(originPlanet)}
          </div>
          <span>{getDisplayName(originPlanet) || "Origem"}</span>
        </div>

        {/* LINHA DE ROTA E NAVE */}
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

        {/* PONTO DE DESTINO */}
        <div className="planet destination">
          <div style={{ fontSize: '2em', marginBottom: '5px' }}>
            {getEntityIcon(destinationPlanet)}
          </div>
          <span>{getDisplayName(destinationPlanet) || "Destino"}</span>
        </div>

      </div>
    </div>
  );
};

export default RouteMonitor;