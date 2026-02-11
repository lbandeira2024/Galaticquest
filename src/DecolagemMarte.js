import React, { useEffect, useRef, useState, lazy, Suspense, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import './DecolagemMarte.css';
import './LojaEspacial.css';
import TelemetryDisplay from './TelemetryDisplay';
import SpaceView from './SpaceView';
import { useAudio } from './AudioManager';
import RouteMonitor from './RouteMonitor';
import MissionTimer from './MissionTimer';
import SpeedGauge from './SpeedGauge';
import MandalaVirtudes from './MandalaVirtudes';
import { usePause } from './PauseContext';
import Inventario from './Inventario';
import { useLocation, useNavigate } from 'react-router-dom';
import desafiosData from './desafios.json';
import ModalEscolha from './ModalEscolha';
import { useSpaceCoins } from './SpaceCoinsContext';
import ModalDesafio from './ModalDesafio';
import ModalConfirmacaoViagem from './ModalConfirmacaoViagem';
import { useConfig } from './ConfigContext';
import LojaEspacial from './LojaEspacial';

// --- DEFINIÇÃO INTERNA DO COMPONENTE SOS SURPRESA ---
const SosSurpriseModal = ({ event, onClose, onMudarRota, onSeguirPlano }) => {
  if (!event) return null;

  const getRiskColor = (id) => {
    switch (id) {
      case 1: return '#ff4444'; // Piratas
      case 2: return '#ffaa00'; // Astronauta
      case 3: return '#00ccff'; // Nave
      default: return '#aaaaaa'; // Alien
    }
  };

  const riskColor = getRiskColor(event.id);

  return (
    <div className="store-modal-overlay main-display-overlay">
      <div className="store-modal-container" style={{ borderColor: riskColor, boxShadow: `0 0 30px ${riskColor}66` }}>
        <div className="store-header" style={{ borderBottomColor: `${riskColor}4D` }}>
          <h2 style={{ color: riskColor, textShadow: `0 0 8px ${riskColor}80` }}>
            RELATÓRIO DE S.O.S
          </h2>
        </div>
        <div className="store-grid challenges-mode" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <div className="store-item" style={{ width: '100%', maxWidth: '800px', borderColor: riskColor, flexDirection: 'row', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <img
              src={event.image}
              alt={event.name}
              className="store-item-image"
              style={{ width: '200px', height: '200px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
              onError={(e) => { e.target.src = '/images/ACEE.png'; }}
            />
            <div className="store-item-details" style={{ textAlign: 'left' }}>
              <div className="store-item-name" style={{ color: riskColor, fontSize: '2rem', marginBottom: '15px' }}>
                {event.name}
              </div>
              <div className="description-wrapper">
                <div className="store-item-description" style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#eee' }}>
                  {event.description}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="store-action-buttons" style={{ position: 'relative', justifyContent: 'center', marginTop: '20px', bottom: 'auto', right: 'auto' }}>
          <button className="buy-button action-button-mudar" onClick={onMudarRota} style={{ padding: '15px 30px', fontSize: '1.1rem' }}>
            MUDAR ROTA
          </button>
          <button className="buy-button action-button-seguir" onClick={onSeguirPlano} style={{ padding: '15px 30px', fontSize: '1.1rem' }}>
            SEGUIR PLANO
          </button>
        </div>
      </div>
    </div>
  );
};
// -------------------------------------------------------------------------------

const GalacticVirtudesPage = lazy(() => import('./GalacticVirtudesPage').catch(() => ({
  default: () => <div className="map-fallback">Glossário Indisponível</div>
})));

// Dados para gerar o SOS
const PLANET_DATA_FOR_SOS = [
  { name: "Mercurio", orbitRadius: 20 },
  { name: "Venus", orbitRadius: 30 },
  { name: "Terra", orbitRadius: 40 },
  { name: "Marte", orbitRadius: 50 },
  { name: "Jupiter", orbitRadius: 80 },
  { name: "Saturno", orbitRadius: 100 },
  { name: "Urano", orbitRadius: 120 },
  { name: "Netuno", orbitRadius: 140 },
  { name: "Plutao", orbitRadius: 150 },
  { name: "Ceres", orbitRadius: 60 },
  { name: "Eris", orbitRadius: 165 }
];

// LISTA DE EVENTOS SOS SURPRESA
const SOS_EVENTS_LIST = [
  { id: 1, name: 'Piratas Espaciais', description: 'ALERTA! O sinal era uma isca. Piratas interceptaram a nave. Prepare-se para um possível confronto ou negociação hostil.', image: '/images/pirates.png' },
  { id: 2, name: 'Astronauta Morto', description: 'Encontramos um traje à deriva. Infelizmente, não há sinais vitais. Podemos recuperar equipamentos e dados da missão dele.', image: '/images/dead_astronaut.png' },
  { id: 3, name: 'Nave Destruída', description: 'Destroços de uma antiga batalha ou acidente. Há muita sucata valiosa e contêineres que podem conter recursos úteis.', image: '/images/destroyed_ship.png' },
  { id: 4, name: 'Objeto Alienígena', description: 'Identificamos um artefato de origem desconhecida emitindo o sinal. Sua tecnologia parece avançada e fora dos padrões da ACEE.', image: '/images/static_signal.png' }
];

const hasWaterList = new Set([
  "Marte", "Mercúrio", "Ceres", "Plutão", "Haumea", "Eris", "Makemake",
  "Lua", "Europa", "Ganímedes", "Calisto", "Titã", "Encelado", "Tritão",
  "Caronte", "Titania", "Oberon", "Vesta", "TRAPPIST-1e", "Kepler-186f",
  "Terra", "Proxima Centauri b"
]);

const degradationRates = {
  default: { nuclearPropulsion: 8.75, oxygen: 10, stability: 10, direction: 10, productivity: 11.25, interdependence: 11.25, engagement: 11.25 },
  ARTEMIS1: { nuclearPropulsion: 15, oxygen: 10, stability: 13.75, direction: 13.75, productivity: 11.25, interdependence: 11.25, engagement: 11.25 },
  OBERONX: { nuclearPropulsion: 11.25, oxygen: 16.25, stability: 17.5, direction: 17.5, productivity: 15, interdependence: 15, engagement: 15 },
  GAIANOVA: { nuclearPropulsion: 8.75, oxygen: 12.5, stability: 10, direction: 10, productivity: 18.75, interdependence: 18.75, engagement: 18.75 },
  STRATUSV: { nuclearPropulsion: 6.25, oxygen: 7.5, stability: 8.75, direction: 8.75, productivity: 7.5, interdependence: 7.5, engagement: 7.5 },
  NEOECLIPSE: { nuclearPropulsion: 3.75, oxygen: 5, stability: 6.25, direction: 6.25, productivity: 8.75, interdependence: 8.75, engagement: 8.75 }
};

const accelerationRates = {
  default: { perTick: 336 }, GAIANOVA: { perTick: 200 }, ARTEMIS1: { perTick: 270 },
  OBERONX: { perTick: 336 }, STRATUSV: { perTick: 500 }, NEOECLIPSE: { perTick: 840 },
};

const takeoffDegradation = {
  default: { propulsion: 2, direction: 1, stability: 2 },
  NEOECLIPSE: { propulsion: 4, direction: 3, stability: 5 },
  STRATUSV: { propulsion: 3, direction: 2, stability: 4 },
  GAIANOVA: { propulsion: 3, direction: 2, stability: 3 },
  ARTEMIS1: { propulsion: 2, direction: 1, stability: 2 },
  OBERONX: { propulsion: 1, direction: 0, stability: 1 },
};

const highlightKeywords = (text, keywords) => {
  if (!keywords || keywords.length === 0 || !text) return text;
  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, index) =>
    keywords.some(keyword => keyword.toLowerCase() === part.toLowerCase())
      ? <span key={index} className="palavra-chave">{part}</span>
      : part
  );
};

const DecolagemMarte = () => {
  const { user } = useAuth();
  const { apiBaseUrl } = useConfig();
  const API_BASE_URL = apiBaseUrl;

  const { spaceCoins, setSpaceCoins, syncSpaceCoins } = useSpaceCoins();
  const alarmAudio = useMemo(() => new Audio('/sounds/evacuation-alarm.mp3'), []);

  const [speed, setSpeed] = useState(0);
  const wasPaused = useRef(false);
  const [isDialogueFinished, setIsDialogueFinished] = useState(false);
  const [showEscolhaModal, setShowEscolhaModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [isOxygenRefilled, setIsOxygenRefilled] = useState(false);
  const [lastImpactTimestamp, setLastImpactTimestamp] = useState(0);
  const userId = user?._id;
  const [showMandala, setShowMandala] = useState(false);
  const [minervaImage, setMinervaImage] = useState('/images/Minerva/Minerva_Active.gif');
  const [isDobraEnabled, setIsDobraEnabled] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [missionTime, setMissionTime] = useState(12 * 60 * 60);
  const [travelStarted, setTravelStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [arrivedAtMars, setArrivedAtMars] = useState(false);
  const [isDobraAtivada, setIsDobraAtivada] = useState(false);
  const [monitorState, setMonitorState] = useState('on');
  const [mainDisplayState, setMainDisplayState] = useState('acee');
  const [staticScreenSeed, setStaticScreenSeed] = useState(Math.random());
  const [plannedRoute, setPlannedRoute] = useState([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [selectedPlanet, setSelectedPlanet] = useState({ nome: 'Carregando Rota...' });
  const [distanceKm, setDistanceKm] = useState(0);
  const [originPlanet, setOriginPlanet] = useState({ nome: 'Terra' });
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [chosenShip, setChosenShip] = useState(null);
  const [showWarpDisabledMessage, setShowWarpDisabledMessage] = useState(false);
  const [dobraCooldownEnd, setDobraCooldownEnd] = useState(0);
  const [isTransmissionStarting, setIsTransmissionStarting] = useState(false);
  const [activeChallengeData, setActiveChallengeData] = useState(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isBoostingTo60k, setIsBoostingTo60k] = useState(false);
  const [isFinalApproach, setIsFinalApproach] = useState(false);
  const [showDesafioModal, setShowDesafioModal] = useState(false);
  const [modalEscolhaKey, setModalEscolhaKey] = useState(0);
  const [showStellarMap, setShowStellarMap] = useState(false);
  const [showConfirmacaoModal, setShowConfirmacaoModal] = useState(false);
  const [isDeparting, setIsDeparting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [showMinervaOnMonitor, setShowMinervaOnMonitor] = useState(false);
  const minervaEventTriggered = useRef(false);
  const hideMinervaTimerRef = useRef(null);
  const boostTimerRef = useRef(null);
  const approachSoundPlayed = useRef(false);
  const minervaTimeoutRef = useRef(null);
  const dobraTimerRef = useRef(null);
  const [groupId, setGroupId] = useState(null);
  const [isMinervaHighlighted, setIsMinervaHighlighted] = useState(false);
  const takeoffApplied = useRef(false);
  const [isCooldownOver, setIsCooldownOver] = useState(true);
  const [isForcedMapEdit, setIsForcedMapEdit] = useState(false);
  const routeChangeLockRef = useRef(false);

  const [isWarpCooldown, setIsWarpCooldown] = useState(false);
  const [showCriticalWarpFail, setShowCriticalWarpFail] = useState(false);

  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosCost, setSosCost] = useState(0);
  const [isRestoringSOS, setIsRestoringSOS] = useState(false);
  const restoreIntervalRef = useRef(null);
  const [processadorO2, setProcessadorO2] = useState(0);
  const [travelTime, setTravelTime] = useState(0);
  const [teamPhotoUrl, setTeamPhotoUrl] = useState(null);
  const [isSosMinervaActive, setIsSosMinervaActive] = useState(false);
  const [activeSosSignal, setActiveSosSignal] = useState(null);

  const [showO2Modal, setShowO2Modal] = useState(false);

  const [sosSurpriseEvent, setSosSurpriseEvent] = useState(null);
  const [showSosSurprise, setShowSosSurprise] = useState(false);

  const telemetryRef = useRef({
    velocity: { kmh: 0, ms: 0, rel: '0.0c' },
    altitude: 0,
    orbitalPosition: '0.00, 0.00, 0.00',
    orientation: { pitch: 0, yaw: 0, roll: 0 },
    coordinates: { x: 0, y: 0, z: 0 },
    battery: 100,
    powerConsumption: 0,
    powerDistribution: { lifeSupport: 40, propulsion: 50, comms: 10 },
    cabinPressure: 101.3,
    atmosphere: { o2: 100, co2: 0.4, n2: 78.3 },
    temperature: 22.1,
    humidity: 45,
    propulsion: { reactorTemp: 845, reactorPressure: 4.2, neutronFlux: '3.8e15', powerOutput: 100, controlRods: 45, steamTemp: 320 },
    comms: { status: 'ACTIVE', signalStrength: 92, antennaDirection: 'EARTH', telemetry: { sent: 1280, received: 980 } },
    sensors: { alerts: [], structuralIntegrity: 100, radiation: 0.12, nearbyObjects: 0 },
    direction: 100, stability: 100, productivity: 100, interdependence: 100, engagement: 100
  });

  const [telemetry, setTelemetry] = useState(telemetryRef.current);
  const cockpitRef = useRef(null);

  const { playTrack, playSound, stopAllAudio, unlockAudio } = useAudio();
  const { isPaused, togglePause } = usePause();

  const triggerMinervaInterplanetarySpeed = useCallback(() => {
    minervaEventTriggered.current = true;

    setShowMinervaOnMonitor(true);
    playSound('/sounds/Mineva-VelInterplanetaria.mp3');

    setTimeout(() => {
      setShowMinervaOnMonitor(false);
    }, 5000);

    setTimeout(() => {
      setIsBoostingTo60k(true);
      playSound('/sounds/empuxo.wav');
    }, 2000);
  }, [playSound]);

  useEffect(() => {
    const audioPreload = new Audio('/sounds/04.Dobra_Espacial_Becoming_one_with_Neytiri.mp3');
    audioPreload.preload = 'auto';

    // PRÉ-CARREGAMENTO DO SOM DE DESATIVAÇÃO DA DOBRA PARA EVITAR TRAVAMENTO
    const audioPowerDown = new Audio('/sounds/power-down-Warp.mp3');
    audioPowerDown.preload = 'auto';
  }, []);

  const constructPhotoUrl = (gameNumber, teamName) => {
    if (!gameNumber || !teamName) return null;
    const safeGame = `game_${gameNumber}`;
    const safeTeam = teamName.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `/images/grupos/${safeGame}/${safeTeam}/registro_equipe_${safeTeam}.jpg`;
  };

  const handleInventoryTelemetryUpdate = useCallback((updates) => {
    if (updates.nuclearPropulsion !== undefined) telemetryRef.current.propulsion.powerOutput = updates.nuclearPropulsion;
    if (updates.oxygen !== undefined) telemetryRef.current.atmosphere.o2 = updates.oxygen;
    if (updates.productivity !== undefined) telemetryRef.current.productivity = updates.productivity;
    if (updates.engagement !== undefined) telemetryRef.current.engagement = updates.engagement;
    if (updates.interdependence !== undefined) telemetryRef.current.interdependence = updates.interdependence;
    if (updates.stability !== undefined) telemetryRef.current.stability = updates.stability;
    if (updates.direction !== undefined) telemetryRef.current.direction = updates.direction;
    setTelemetry({ ...telemetryRef.current });
    setLastImpactTimestamp(Date.now());
  }, []);

  const saveTelemetryData = useCallback(async () => {
    if (!userId || !API_BASE_URL) return;
    const dataToSave = {
      telemetryState: {
        oxygen: telemetryRef.current.atmosphere.o2,
        nuclearPropulsion: telemetryRef.current.propulsion.powerOutput,
        direction: telemetryRef.current.direction,
        stability: telemetryRef.current.stability,
        productivity: telemetryRef.current.productivity,
        interdependence: telemetryRef.current.interdependence,
        engagement: telemetryRef.current.engagement
      }
    };
    try {
      await fetch(`${API_BASE_URL}/${userId}/update-gamedata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
    } catch (error) {
      console.error("ERRO: Falha ao salvar dados de telemetria:", error);
    }
  }, [userId, API_BASE_URL]);

  const saveCurrentProgress = useCallback(async (currentIndex) => {
    if (!userId || !API_BASE_URL) return;
    try {
      await fetch(`${API_BASE_URL}/${userId}/update-gamedata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeIndex: currentIndex }),
      });
    } catch (error) {
      console.error("ERRO: Falha ao salvar progresso da rota:", error);
    }
  }, [userId, API_BASE_URL]);

  const saveNewRouteAndProgress = useCallback(async (currentIndex, newRouteArray) => {
    if (!userId || !API_BASE_URL) return;
    const dataToSave = { routeIndex: currentIndex, rotaPlanejada: newRouteArray };
    try {
      await fetch(`${API_BASE_URL}/${userId}/update-gamedata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
    } catch (error) {
      console.error("ERRO: Falha ao salvar nova rota:", error);
    }
  }, [userId, API_BASE_URL]);

  const handleStoreChallengeImpact = useCallback((item) => {
    playSound('/sounds/data-updates-telemetry.mp3');
    if (item.effects || item.value) {
      const impactos = item.effects ? item.effects.reduce((acc, effect) => ({ ...acc, [effect.field]: effect.value }), {}) : { [item.telemetryField]: item.value };
      const applyImpact = (currentVal, change) => Math.max(0, Math.min(100, currentVal + (change || 0)));
      if (impactos.nuclearPropulsion !== undefined) telemetryRef.current.propulsion.powerOutput = applyImpact(telemetryRef.current.propulsion.powerOutput, impactos.nuclearPropulsion);
      if (impactos.oxygen !== undefined) telemetryRef.current.atmosphere.o2 = applyImpact(telemetryRef.current.atmosphere.o2, impactos.oxygen);
      if (impactos.direction !== undefined) telemetryRef.current.direction = applyImpact(telemetryRef.current.direction, impactos.direction);
      if (impactos.stability !== undefined) telemetryRef.current.stability = applyImpact(telemetryRef.current.stability, impactos.stability);
      if (impactos.productivity !== undefined) telemetryRef.current.productivity = applyImpact(telemetryRef.current.productivity, impactos.productivity);
      if (impactos.engagement !== undefined) telemetryRef.current.engagement = applyImpact(telemetryRef.current.engagement, impactos.engagement);
      if (impactos.interdependence !== undefined) telemetryRef.current.interdependence = applyImpact(telemetryRef.current.interdependence, impactos.interdependence);
      setTelemetry({ ...telemetryRef.current });
      setLastImpactTimestamp(Date.now()); saveTelemetryData();
    }
  }, [playSound, saveTelemetryData]);

  const handleSosDetected = useCallback(() => {
    if (!travelStarted && routeIndex === 0) return;

    setIsSosMinervaActive(true);
    setTimeout(() => {
      setIsSosMinervaActive(false);
    }, 5000);
  }, [travelStarted, routeIndex]);

  const handleChallengeEnd = useCallback(() => {
  }, []);

  const handleMudarRota = () => {
    setShowConfirmacaoModal(false);
    setShowStoreModal(false);

    setShowSosSurprise(false);
    setSosSurpriseEvent(null);

    setIsForcedMapEdit(true);
    setShowStellarMap(true);
  };

  const handleSeguirPlano = () => {
    if (dobraTimerRef.current) clearTimeout(dobraTimerRef.current);
    setShowConfirmacaoModal(false);
    setShowStoreModal(false);

    setShowSosSurprise(false);
    setSosSurpriseEvent(null);

    playSound('/sounds/empuxo.wav');
    setIsDeparting(true);

    setTimeout(async () => {
      setDistanceKm(300000000);

      setProgress(0);
      setArrivedAtMars(false);
      setIsFinalApproach(false);
      approachSoundPlayed.current = false;
      minervaEventTriggered.current = true;

      triggerMinervaInterplanetarySpeed();

      setActiveChallengeData(null);
      setIsDialogueFinished(false);
      setTravelStarted(true);
      setDobraCooldownEnd(0);
      setProcessadorO2(0);
      setRefetchTrigger(prev => prev + 1);
      setIsDeparting(false);
    }, 4000);
  };

  const handleRouteChanged = useCallback((newRouteData) => {
    if (!newRouteData || !newRouteData.newPlannedRoute || newRouteData.newRouteIndex === undefined) {
      if (!isForcedMapEdit) {
        setShowStellarMap(false);
      }
      return;
    }

    setIsForcedMapEdit(false);
    setShowStellarMap(false);

    setShowSosSurprise(false);
    setSosSurpriseEvent(null);

    const { newPlannedRoute, newRouteIndex } = newRouteData;
    const isInFlight = !arrivedAtMars && travelStarted;

    if (isInFlight) {
      routeChangeLockRef.current = true;

      saveNewRouteAndProgress(newRouteIndex, newPlannedRoute);
      setPlannedRoute(newPlannedRoute);
      setRouteIndex(newRouteIndex);
      const newOriginStep = newPlannedRoute[newRouteIndex];
      const newDestinationStep = newPlannedRoute[newRouteIndex + 1];

      if (newOriginStep && newDestinationStep) {
        setOriginPlanet({ nome: newOriginStep.name });
        setSelectedPlanet({ nome: newDestinationStep.name });

        const newDist = newDestinationStep.distance || 300000000;
        setDistanceKm(newDist);
      }

      setArrivedAtMars(false);
      setIsFinalApproach(false);

      triggerMinervaInterplanetarySpeed();

    } else {
      playSound('/sounds/empuxo.wav'); setIsDeparting(true); setShowStoreModal(false);
      setTimeout(async () => {
        setDistanceKm(300000000);

        await saveNewRouteAndProgress(newRouteIndex, newPlannedRoute);
        setProgress(0);
        setArrivedAtMars(false);
        setIsFinalApproach(false);
        approachSoundPlayed.current = false;
        minervaEventTriggered.current = true;

        triggerMinervaInterplanetarySpeed();

        setActiveChallengeData(null);
        setIsDialogueFinished(false);
        setTravelStarted(true);
        setDobraCooldownEnd(0);
        setProcessadorO2(0);
        setRefetchTrigger(prev => prev + 1);
        setIsDeparting(false);
      }, 4000);
    }
  }, [saveNewRouteAndProgress, playSound, arrivedAtMars, travelStarted, routeIndex, plannedRoute, distanceKm, isForcedMapEdit, triggerMinervaInterplanetarySpeed]);

  const handleEscolha = async (opcao, desafioId, impactos) => {
    setIsTransmissionStarting(false); setIsDialogueFinished(false);
    const coinsReward = Number(opcao.spaceCoins || 0);
    const currentCoins = Number(spaceCoins) || 0;
    const newBalance = currentCoins + coinsReward;
    if (coinsReward !== 0) setSpaceCoins(newBalance);
    if (impactos) {
      const applyImpact = (currentVal, change) => Math.max(0, Math.min(100, currentVal + (change || 0)));
      if (impactos.nuclearPropulsion !== undefined) telemetryRef.current.propulsion.powerOutput = applyImpact(telemetryRef.current.propulsion.powerOutput, impactos.nuclearPropulsion);
      if (impactos.oxygen !== undefined) telemetryRef.current.atmosphere.o2 = applyImpact(telemetryRef.current.atmosphere.o2, impactos.oxygen);
      if (impactos.direction !== undefined) telemetryRef.current.direction = applyImpact(telemetryRef.current.direction, impactos.direction);
      if (impactos.stability !== undefined) telemetryRef.current.stability = applyImpact(telemetryRef.current.stability, impactos.stability);
      if (impactos.productivity !== undefined) telemetryRef.current.productivity = applyImpact(telemetryRef.current.productivity, impactos.productivity);
      if (impactos.engagement !== undefined) telemetryRef.current.engagement = applyImpact(telemetryRef.current.engagement, impactos.engagement);
      if (impactos.interdependence !== undefined) telemetryRef.current.interdependence = applyImpact(telemetryRef.current.interdependence, impactos.interdependence);
      setTelemetry(prev => ({
        ...prev, propulsion: { ...prev.propulsion, powerOutput: telemetryRef.current.propulsion.powerOutput },
        atmosphere: { ...prev.atmosphere, o2: telemetryRef.current.atmosphere.o2 },
        direction: telemetryRef.current.direction, stability: telemetryRef.current.stability, productivity: telemetryRef.current.productivity, engagement: telemetryRef.current.engagement, interdependence: telemetryRef.current.interdependence
      }));
      setLastImpactTimestamp(Date.now()); saveTelemetryData();
    }
    if (!userId || !desafioId || !API_BASE_URL) return;
    try {
      await fetch(`${API_BASE_URL}/record-choice`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, desafioId, escolha: opcao, impactos: impactos, newBalance: newBalance }),
      });
    } catch (error) { console.error("ERRO: Falha ao registrar escolha:", error); }
    setShowEscolhaModal(false); setShowConfirmacaoModal(true);
  };

  const handleDobraEspacial = () => {
    if (!isDobraEnabled || isDobraAtivada || isPaused) return;

    if (telemetryRef.current.atmosphere.o2 <= 0 || telemetryRef.current.propulsion.powerOutput <= 0) {
      playSound('/sounds/ui-click.mp3');
      setShowCriticalWarpFail(true);
      setTimeout(() => setShowCriticalWarpFail(false), 7000);
      return;
    }

    stopAllAudio();
    setIsDobraAtivada(true);
    setIsDobraEnabled(false);

    setMinervaImage('/images/Minerva/Minerva-Vluz.gif');

    playSound('/sounds/05.Dobra-Active.mp3');

    playTrack('/sounds/04.Dobra_Espacial_Becoming_one_with_Neytiri.mp3', {
      loop: true,
      isPrimary: true
    });

    const COOLDOWN_IN_MS = 3 * 60 * 1000;
    setDobraCooldownEnd(Date.now() + COOLDOWN_IN_MS);
    const DOBRA_DURATION_IN_MS = 130 * 1000;

    if (dobraTimerRef.current) clearTimeout(dobraTimerRef.current);
    dobraTimerRef.current = setTimeout(() => {
      // 1. TOCA O SOM DE DESATIVAÇÃO PRIMEIRO (LEVE)
      playSound('/sounds/power-down-Warp.mp3');

      // 2. AGUARDA 100MS PARA PROCESSAR A TROCA PESADA (EVITA O TRAVAMENTO)
      setTimeout(() => {
        isDobraAtivadaRef.current = false;
        setIsDobraAtivada(false); // Troca visual pesada (Canvas)
        saveTelemetryData();
        stopAllAudio(); // Para o loop da música da dobra

        setIsWarpCooldown(true);
        setTimeout(() => { setIsWarpCooldown(false); }, 20000);

        setShowWarpDisabledMessage(true);
        setMinervaImage('/images/Minerva/Minerva_Active.gif');
        setTimeout(() => setShowWarpDisabledMessage(false), 10000);

        const isMoon = selectedPlanet?.nome?.toLowerCase() === 'lua';
        const approachDistanceThreshold = 800000;

        if (!isMoon && distanceKm <= approachDistanceThreshold && !isFinalApproachRef.current) {
          setIsFinalApproach(true);
          setIsBoostingTo60k(false);
          approachSoundPlayed.current = true;
        } else {
          setIsBoostingTo60k(true);
        }
      }, 100);

    }, DOBRA_DURATION_IN_MS);

    if (minervaTimeoutRef.current) clearTimeout(minervaTimeoutRef.current);
    minervaTimeoutRef.current = setTimeout(() => { setMinervaImage('/images/Minerva/Minerva_Active.gif'); }, DOBRA_DURATION_IN_MS + 3000);
  };

  const handleInventory = () => { if (!isPaused) { setShowInventory(true); playSound('/sounds/inventory-open.mp3'); } };

  const handleTransferO2 = async () => {
    if (isPaused || processadorO2 === 0 || !userId || !API_BASE_URL) return;

    const amountToAdd = processadorO2;
    const currentO2 = telemetryRef.current.atmosphere.o2;
    const newO2 = Math.min(100, currentO2 + amountToAdd);

    telemetryRef.current.atmosphere.o2 = newO2;

    setTelemetry(prev => ({
      ...prev,
      atmosphere: {
        ...prev.atmosphere,
        o2: newO2
      }
    }));

    setLastImpactTimestamp(Date.now());

    playSound('/sounds/data-updates-telemetry.mp3');

    try {
      await fetch(`${API_BASE_URL}/${userId}/update-gamedata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processadorO2: 0,
          telemetryState: {
            ...telemetryRef.current,
            oxygen: newO2,
            nuclearPropulsion: telemetryRef.current.propulsion.powerOutput,
            direction: telemetryRef.current.direction,
            stability: telemetryRef.current.stability,
            productivity: telemetryRef.current.productivity,
            interdependence: telemetryRef.current.interdependence,
            engagement: telemetryRef.current.engagement
          }
        }),
      });
      setProcessadorO2(0);
    } catch (error) {
      console.error("ERRO: Falha ao transferir O2 e salvar dados:", error);
    }
  };

  const handleMinervaClick = () => { if (!isPaused) { setShowMandala(true); if (isMinervaHighlighted) setIsMinervaHighlighted(false); } };

  const handleOpenO2Modal = () => {
    if (isPaused || processadorO2 === 0) return;
    setShowO2Modal(true);
    playSound('/sounds/ui-click.mp3');
  };

  const isO2TransferDisabled = isPaused || processadorO2 === 0;

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const hasStartedAudioRef = useRef(false);

  useEffect(() => {
    if (isLoadingRoute) return;

    if (routeIndex > 0) {
      setMainDisplayState('stars');
      setMonitorState('on');
      setTravelStarted(true);
      hasStartedAudioRef.current = true;
      return;
    }

    unlockAudio();

    if (!hasStartedAudioRef.current) {
      hasStartedAudioRef.current = true;
      const audioUrl = `/sounds/decolagem.mp3?t=${Date.now()}`;
      playTrack(audioUrl, {
        loop: false,
        isPrimary: true
      });
    }

    const monitorTimer1 = setTimeout(() => {
      if (!isPausedRef.current) {
        setMainDisplayState('clouds');
        setTravelStarted(true);
      }
    }, 13000);

    const monitorTimer2 = setTimeout(() => {
      if (!isPausedRef.current) {
        setMainDisplayState('static');
        setMonitorState('static');
      }
    }, 23000);

    const monitorTimer3 = setTimeout(() => {
      if (!isPausedRef.current) {
        stopAllAudio();
        setMainDisplayState('stars');
        setMonitorState('on');
      }
    }, 45000);

    return () => {
      clearTimeout(monitorTimer1);
      clearTimeout(monitorTimer2);
      clearTimeout(monitorTimer3);
    };
  }, [isLoadingRoute, routeIndex]);

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  const isDobraAtivadaRef = useRef(isDobraAtivada);
  useEffect(() => { isDobraAtivadaRef.current = isDobraAtivada; }, [isDobraAtivada]);

  useEffect(() => {
    if (telemetry.velocity.kmh >= 59500 && !isDobraEnabled && !isDobraAtivada && distanceKm > 500000 && !isWarpCooldown) {
      setIsDobraEnabled(true);
      playSound('/sounds/05.Dobra-Active.mp3');
    }
  }, [telemetry.velocity.kmh, isDobraEnabled, isDobraAtivada, distanceKm, playSound, isWarpCooldown]);

  useEffect(() => {
    if (!travelStarted && routeIndex === 0) return;
    const triggerSosEvent = () => {
      if (isDobraAtivadaRef.current) return;

      const audio = new Audio('/sounds/minervaSOS.mp3');
      audio.play().catch(e => console.log("Erro ao tocar áudio SOS:", e));
      setIsSosMinervaActive(true);
      setTimeout(() => { setIsSosMinervaActive(false); }, 5000);
      const randomPlanet = PLANET_DATA_FOR_SOS[Math.floor(Math.random() * PLANET_DATA_FOR_SOS.length)];
      const offsetRadius = randomPlanet.orbitRadius + (Math.random() > 0.5 ? 4 : -4);
      const offsetAngle = Math.random() * 360;
      const newSignal = { name: `S.O.S próximo a ${randomPlanet.name}`, hostName: randomPlanet.name, angle: offsetAngle, orbitRadius: offsetRadius, distanceText: `Desconhecido` };
      setActiveSosSignal(newSignal);
      setTimeout(() => { setActiveSosSignal(null); }, 300000);
    };
    const interval = setInterval(triggerSosEvent, 180000);
    return () => clearInterval(interval);
  }, [travelStarted, routeIndex]);

  const isBoostingTo60kRef = useRef(isBoostingTo60k);
  useEffect(() => { isBoostingTo60kRef.current = isBoostingTo60k; }, [isBoostingTo60k]);

  const isFinalApproachRef = useRef(isFinalApproach);
  useEffect(() => { isFinalApproachRef.current = isFinalApproach; }, [isFinalApproach]);

  const animationFrameId = useRef();
  const lastUpdateTime = useRef(0);
  const telemetryInterval = 100;

  useEffect(() => {
    const saveIndexForCorrection = async (currentIndex) => {
      if (!userId || !API_BASE_URL) return;
      try {
        await fetch(`${API_BASE_URL}/${userId}/update-gamedata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ routeIndex: currentIndex }),
        });
      } catch (error) {
        console.error("ERRO: Falha ao salvar correção de rota:", error);
      }
    };

    const fetchGameData = async () => {
      if (!userId || !API_BASE_URL) return;
      setIsLoadingRoute(true);
      try {
        const response = await fetch(`${API_BASE_URL}/${userId}/game-data?t=${Date.now()}`);
        const data = await response.json();
        if (data.success) {
          if (data._id) setGroupId(data._id);
          if (data.naveEscolhida) setChosenShip(data.naveEscolhida);
          if (data.spaceCoins !== undefined) syncSpaceCoins(data.spaceCoins);
          if (data.processadorO2 !== undefined) setProcessadorO2(data.processadorO2);

          let photo = data.photoUrl;
          if (!photo && user && user.gameNumber && data.teamName) {
            photo = constructPhotoUrl(user.gameNumber, data.teamName);
          }
          if (photo) setTeamPhotoUrl(photo);

          const currentRouteIndex = data.routeIndex || 0;
          if (data.rotaPlanejada && data.rotaPlanejada.length > 1) {
            const routeFromDB = data.rotaPlanejada;
            const originStep = routeFromDB[currentRouteIndex];
            const nextStep = routeFromDB[currentRouteIndex + 1];
            if (!originStep || !nextStep) {
              await saveIndexForCorrection(0);
              setRefetchTrigger(prev => prev + 1);
              return;
            }
            setRouteIndex(currentRouteIndex);
            setPlannedRoute(routeFromDB);
            setOriginPlanet({ nome: originStep.name });
            setSelectedPlanet({ nome: nextStep.name });
            setDistanceKm(nextStep.distance || 0);
          } else {
            setSelectedPlanet({ nome: "Erro de Rota" });
          }
          if (data.telemetryState) {
            telemetryRef.current.atmosphere.o2 = data.telemetryState.oxygen ?? 100;
            telemetryRef.current.propulsion.powerOutput = data.telemetryState.nuclearPropulsion ?? 100;
            telemetryRef.current.direction = data.telemetryState.direction ?? 100;
            telemetryRef.current.stability = data.telemetryState.stability ?? 100;
            telemetryRef.current.productivity = data.telemetryState.productivity ?? 100;
            telemetryRef.current.interdependence = data.telemetryState.interdependence ?? 100;
            telemetryRef.current.engagement = data.telemetryState.engagement ?? 100;
            setTelemetry({ ...telemetryRef.current });
          }
        } else {
          setSelectedPlanet({ nome: "Erro de Rota" });
        }
      } catch (error) {
        console.error("ERRO: Falha no fetchGameData:", error);
        setSelectedPlanet({ nome: "Erro de Conexão" });
      } finally {
        setIsLoadingRoute(false);
      }
    };
    fetchGameData();
  }, [userId, API_BASE_URL, syncSpaceCoins, refetchTrigger]);

  useEffect(() => {
    if (isPaused || !chosenShip || isDobraAtivada) return;
    const rates = degradationRates[chosenShip] || degradationRates.default;
    const intervals = [];
    const createInterval = (key, telemetryPath, rateInMinutes) => {
      const intervalId = setInterval(() => {
        let currentValue = telemetryPath.split('.').reduce((o, i) => o[i], telemetryRef.current);
        const newValue = Math.max(0, currentValue - 1);
        let refPath = telemetryRef.current;
        const pathParts = telemetryPath.split('.');
        for (let i = 0; i < pathParts.length - 1; i++) {
          refPath = refPath[pathParts[i]];
        }
        refPath[pathParts.length - 1] = newValue;
        setTelemetry(prev => ({ ...prev, ...telemetryRef.current }));
      }, rateInMinutes * 60 * 1000);
      intervals.push(intervalId);
    };
    createInterval('nuclearPropulsion', 'propulsion.powerOutput', rates.nuclearPropulsion);
    createInterval('oxygen', 'atmosphere.o2', rates.oxygen);
    createInterval('direction', 'direction', rates.direction);
    createInterval('stability', 'stability', rates.stability);
    createInterval('productivity', 'productivity', rates.productivity);
    createInterval('interdependence', 'interdependence', rates.interdependence);
    createInterval('engagement', 'engagement', rates.engagement);
    return () => intervals.forEach(clearInterval);
  }, [isPaused, chosenShip, isDobraAtivada]);

  useEffect(() => {
    if (!isDobraAtivada || isPaused) return;
    const warpConsumptionInterval = setInterval(() => {
      const newPropulsion = Math.max(0, telemetryRef.current.propulsion.powerOutput - 1);
      const newO2 = Math.max(0, telemetryRef.current.atmosphere.o2 - 1);

      telemetryRef.current.propulsion.powerOutput = newPropulsion;
      telemetryRef.current.atmosphere.o2 = newO2;
      setTelemetry(prev => ({ ...prev, ...telemetryRef.current }));

      if (newPropulsion <= 0 || newO2 <= 0) {
        if (dobraTimerRef.current) clearTimeout(dobraTimerRef.current);
        isDobraAtivadaRef.current = false;
        setIsDobraAtivada(false);
        stopAllAudio();

        setShowCriticalWarpFail(true);
        setTimeout(() => setShowCriticalWarpFail(false), 7000);
      }

    }, 20000);
    return () => clearInterval(warpConsumptionInterval);
  }, [isDobraAtivada, isPaused]);

  useEffect(() => {
    let delayTimer, takeoffInterval;
    if (chosenShip && originPlanet.nome === 'Terra' && !takeoffApplied.current) {
      takeoffApplied.current = true;
      delayTimer = setTimeout(() => {
        const ratesForShip = takeoffDegradation[chosenShip] || takeoffDegradation.default;
        const takeoffDurationInSeconds = 66;
        const lossPerSecond = {
          propulsion: ratesForShip.propulsion / takeoffDurationInSeconds,
          direction: ratesForShip.direction / takeoffDurationInSeconds,
          stability: ratesForShip.stability / takeoffDurationInSeconds,
        };
        let ticks = 0;
        takeoffInterval = setInterval(() => {
          if (ticks >= takeoffDurationInSeconds) { clearInterval(takeoffInterval); return; }
          const currentPropulsion = telemetryRef.current.propulsion.powerOutput;
          telemetryRef.current.propulsion.powerOutput = Math.max(0, currentPropulsion - lossPerSecond.propulsion);
          telemetryRef.current.direction = Math.max(0, telemetryRef.current.direction - lossPerSecond.direction);
          telemetryRef.current.stability = Math.max(0, telemetryRef.current.stability - lossPerSecond.stability);
          setTelemetry(prev => ({ ...prev, ...telemetryRef.current }));
          ticks++;
        }, 1000);
      }, 11000);
    }
    return () => { clearTimeout(delayTimer); clearInterval(takeoffInterval); };
  }, [chosenShip, originPlanet.nome]);

  useEffect(() => {
    if (!groupId || isPaused || isMinervaHighlighted || !API_BASE_URL) return;
    const checkMinervaHighlight = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/group/${groupId}/check-recent-cds`);
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const data = await response.json();
        if (data.success && data.hasRecentEntry) setIsMinervaHighlighted(true);
      } catch (error) {
        console.error("ERRO: Falha ao verificar destaque da Minerva:", error);
      }
    };
    checkMinervaHighlight();
    const interval = setInterval(checkMinervaHighlight, 60000);
    return () => clearInterval(interval);
  }, [groupId, isPaused, isMinervaHighlighted, API_BASE_URL]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => { if (travelStarted) setTravelTime(prev => prev + 1); }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, travelStarted]);

  useEffect(() => {
    if (isPaused || !travelStarted || minervaEventTriggered.current) return;
    if (travelTime >= 60) {
      minervaEventTriggered.current = true;
      setShowMinervaOnMonitor(true);
      playSound('/sounds/Mineva-VelInterplanetaria.mp3');
      hideMinervaTimerRef.current = setTimeout(() => {
        setShowMinervaOnMonitor(false);
        boostTimerRef.current = setTimeout(() => {
          if (!isPaused) { playSound('/sounds/empuxo.wav'); setIsBoostingTo60k(true); }
        }, 5000);
      }, 5000);
    }
  }, [travelTime, travelStarted, isPaused, playSound]);

  useEffect(() => {
    if (isPaused || isDobraAtivada || isLoadingRoute) return;

    const isMoon = selectedPlanet.nome.toLowerCase() === 'lua';
    const approachDistanceThreshold = 800000;

    if (distanceKm <= 1000 && distanceKm > 0 && !isFinalApproachRef.current) {
      setIsFinalApproach(true);
      setIsBoostingTo60k(false);
    }

    if (!isMoon && distanceKm <= approachDistanceThreshold && !approachSoundPlayed.current) {
      playSound('/sounds/empuxo.wav');
      approachSoundPlayed.current = true;
    }
  }, [distanceKm, isDobraAtivada, selectedPlanet.nome, playSound, isPaused, isLoadingRoute]);

  useEffect(() => {
    if (isPaused) return;
    let animationId;
    const targetOffset = { x: 0, y: 0 };
    const currentOffset = { x: 0, y: 0 };
    const animateCockpit = () => {
      const friction = 0.05;
      currentOffset.x += (targetOffset.x - currentOffset.x) * friction;
      currentOffset.y += (targetOffset.y - currentOffset.y) * friction;
      if (cockpitRef.current) {
        const x = currentOffset.x;
        const y = currentOffset.y;
        cockpitRef.current.style.transform =
          `perspective(1500px) rotateX(${y * 0.1}deg) rotateY(${-x * 0.1}deg) translateX(${-x * 0.5}px) translateY(${y * 0.5}px)`;
      }
      animationId = requestAnimationFrame(animateCockpit);
    };
    animationId = requestAnimationFrame(animateCockpit);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  // VARIÁVEIS DEFINIDAS NO ESCOPO CORRETO PARA EVITAR ERRO DE REFERÊNCIA
  const isSystemCritical = telemetry.atmosphere.o2 <= 20 || telemetry.propulsion.powerOutput <= 20 || telemetry.direction <= 20 || telemetry.stability <= 20 || telemetry.productivity <= 20 || telemetry.interdependence <= 20 || telemetry.engagement <= 20;

  const hasFundsForSOS = (spaceCoins || 0) > 0;
  const isSOSActive = isSystemCritical && !isPaused && !isDobraAtivada && !isRestoringSOS && hasFundsForSOS;

  const handleSOS = () => {
    if (!isSOSActive) return;
    const minutesPlayed = travelTime / 60;
    const calculatedCost = Math.floor(minutesPlayed) + 5000000;
    const finalCost = Math.min(calculatedCost, spaceCoins || 0);
    setSosCost(finalCost);
    setShowSOSModal(true);
    playSound('/sounds/ui-click.mp3');
  };

  const handleConfirmSOS = () => {
    setSpaceCoins(prev => (prev || 0) - sosCost);
    setIsRestoringSOS(true);
    playSound('/sounds/ui-click.mp3');
    setShowSOSModal(false);
  };

  const handleCancelSOS = () => setShowSOSModal(false);

  useEffect(() => {
    const isCritical = (telemetry.atmosphere.o2 <= 20 || telemetry.propulsion.powerOutput <= 20 || telemetry.direction <= 20 || telemetry.stability <= 20 || telemetry.productivity <= 20 || telemetry.interdependence <= 20 || telemetry.engagement <= 20) && !isRestoringSOS;
    alarmAudio.loop = true;
    if (isCritical && !isPaused) {
      alarmAudio.play().catch(e => console.log("Erro ao tocar alarme:", e));
    } else {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
    }
    return () => {
      alarmAudio.pause();
    };
  }, [telemetry, isPaused, isRestoringSOS, alarmAudio]);

  useEffect(() => {
    if (isRestoringSOS && !isPaused) {
      restoreIntervalRef.current = setInterval(() => {
        let anyChanged = false;
        let allFull = true;
        const restoreValue = (currentVal) => {
          if (currentVal < 100) { anyChanged = true; allFull = false; return Math.min(100, currentVal + 2); }
          return currentVal;
        };
        telemetryRef.current.atmosphere.o2 = restoreValue(telemetryRef.current.atmosphere.o2);
        telemetryRef.current.propulsion.powerOutput = restoreValue(telemetryRef.current.propulsion.powerOutput);
        telemetryRef.current.direction = restoreValue(telemetryRef.current.direction);
        telemetryRef.current.stability = restoreValue(telemetryRef.current.stability);
        telemetryRef.current.productivity = restoreValue(telemetryRef.current.productivity);
        telemetryRef.current.interdependence = restoreValue(telemetryRef.current.interdependence);
        telemetryRef.current.engagement = restoreValue(telemetryRef.current.engagement);
        if (anyChanged) setTelemetry(prev => ({ ...prev, ...telemetryRef.current }));
        if (allFull) { clearInterval(restoreIntervalRef.current); setIsRestoringSOS(false); saveTelemetryData(); }
      }, 50);
    } else if (isPaused && restoreIntervalRef.current) { clearInterval(restoreIntervalRef.current); }
    return () => { if (restoreIntervalRef.current) clearInterval(restoreIntervalRef.current); };
  }, [isRestoringSOS, isPaused, saveTelemetryData]);

  useEffect(() => {
    const gameLoop = (timestamp) => {
      if (isPaused) { lastUpdateTime.current = timestamp; animationFrameId.current = requestAnimationFrame(gameLoop); return; }
      if (lastUpdateTime.current === 0) lastUpdateTime.current = timestamp;
      const deltaTime = timestamp - lastUpdateTime.current;

      if (deltaTime >= telemetryInterval) {
        lastUpdateTime.current = timestamp - (deltaTime % telemetryInterval);
        const dobraAtiva = isDobraAtivadaRef.current;
        let maxSpeed = dobraAtiva ? 100000000 : (isBoostingTo60kRef.current ? 60000 : (isFinalApproachRef.current ? 45000 : 45000));
        const accelConfig = accelerationRates[chosenShip] || accelerationRates.default;
        let speedChange = accelConfig.perTick;
        let newKmh;
        const currentSpeed = telemetryRef.current.velocity.kmh;
        if (dobraAtiva) {
          newKmh = currentSpeed + 2260;
        } else if (currentSpeed > maxSpeed) {
          // CORREÇÃO: Lógica diferenciada para saída de dobra vs. aproximação suave
          if (currentSpeed > 62000) {
            // Se estiver saindo da dobra ou muito rápido, freia bruscamente
            newKmh = Math.max(currentSpeed - 200000, maxSpeed);
          } else {
            // Se estiver apenas ajustando velocidade de cruzeiro (60k) para pouso (45k), freia suave
            // ~250 km/h por tick dá um efeito visual agradável de desaceleração
            newKmh = Math.max(currentSpeed - 250, maxSpeed);
          }
        } else {
          newKmh = Math.min(currentSpeed + speedChange, maxSpeed);
        }

        if (travelStarted) {
          const SPEED_OF_LIGHT_KMH = 1079252848.8;
          telemetryRef.current = { ...telemetryRef.current, velocity: { kmh: newKmh, ms: newKmh / 3.6, rel: `${(newKmh / SPEED_OF_LIGHT_KMH).toFixed(7)}c` } };
          setTelemetry({ ...telemetryRef.current });
        }
      }
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };
    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [isPaused, travelStarted, chosenShip]);

  useEffect(() => {
    if (!travelStarted || isPaused) return;

    const interval = setInterval(() => {

      if (routeChangeLockRef.current) {
        routeChangeLockRef.current = false;
        return;
      }

      let distanceToDecrease;
      const currentSpeedKmh = telemetryRef.current.velocity.kmh;
      if (currentSpeedKmh >= 60000) distanceToDecrease = (currentSpeedKmh * 9172) / 3000;
      else distanceToDecrease = 7172;

      const newDistance = distanceKm > 0 ? distanceKm - Math.round(distanceToDecrease) : 0;
      setDistanceKm(newDistance);

      const isSosDestination = selectedPlanet && selectedPlanet.nome && selectedPlanet.nome.startsWith("S.O.S");

      if (isSosDestination && !isForcedMapEdit) {
        if (newDistance <= 1000 && newDistance > 0 && !sosSurpriseEvent) {
          const randIndex = Math.floor(Math.random() * 4);
          setSosSurpriseEvent(SOS_EVENTS_LIST[randIndex]);
        }

        if (newDistance <= 0 && !arrivedAtMars) {
          setArrivedAtMars(true);
          setSpeed(0);

          if (!sosSurpriseEvent) {
            const randIndex = Math.floor(Math.random() * 4);
            setSosSurpriseEvent(SOS_EVENTS_LIST[randIndex]);
          }

          setShowSosSurprise(true);
          return;
        }
      }

      if (newDistance <= 150000 && isDobraAtivada) {
        if (dobraTimerRef.current) clearTimeout(dobraTimerRef.current);
        stopAllAudio();
        isDobraAtivadaRef.current = false;
        setIsDobraAtivada(false);

        setIsFinalApproach(true);
        setIsBoostingTo60k(false);
        approachSoundPlayed.current = true;

        saveTelemetryData();
        setShowWarpDisabledMessage(true);
        setMinervaImage('/images/Minerva/Minerva_Active.gif');

        playSound('/sounds/power-down-Warp.mp3');
        setTimeout(() => playSound('/sounds/empuxo.wav'), 800);

        setTimeout(() => setShowWarpDisabledMessage(false), 10000);

        setIsWarpCooldown(true);
        setTimeout(() => { setIsWarpCooldown(false); }, 20000);

      } else if (newDistance <= 0 && !arrivedAtMars && !isForcedMapEdit) {
        setArrivedAtMars(true); setSpeed(45000);

        const normalizeName = (str) => str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
        const targetName = normalizeName(selectedPlanet.nome);

        const desafioEncontrado = desafiosData.desafios?.find(d =>
          normalizeName(d.planeta) === targetName ||
          d.id === selectedPlanet.desafioId
        );

        if (desafioEncontrado) {
          setActiveChallengeData(desafioEncontrado);
          setShowDesafioModal(true);
        }

        let newProcessadorO2Value = processadorO2;
        const planetNameInput = selectedPlanet?.nome || '';
        const hasWater = Array.from(hasWaterList).some(p => p.toLowerCase() === planetNameInput.toLowerCase().trim());
        if (hasWater) { const o2Bonus = Math.floor(Math.random() * 5) + 1; newProcessadorO2Value = Math.min(5, processadorO2 + o2Bonus); }
        const newRouteIndex = routeIndex + 1;
        const saveArrival = async () => {
          await saveCurrentProgress(newRouteIndex);
          try {
            await fetch(`${API_BASE_URL}/${userId}/update-gamedata`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                routeIndex: newRouteIndex,
                processadorO2: newProcessadorO2Value,
                telemetryState: { oxygen: telemetryRef.current.atmosphere.o2, nuclearPropulsion: telemetryRef.current.propulsion.powerOutput, direction: telemetryRef.current.direction, stability: telemetryRef.current.stability, productivity: telemetryRef.current.productivity, interdependence: telemetryRef.current.interdependence, engagement: telemetryRef.current.engagement }
              }),
            });
          } catch (error) { console.error("ERRO: Falha ao salvar chegada:", error); }
          setProcessadorO2(newProcessadorO2Value); setRouteIndex(newRouteIndex); handleChallengeEnd();
        };
        saveArrival();
      }

      const destinationStepIndex = routeIndex + 1;
      const initialDistanceForLeg = (plannedRoute && plannedRoute[destinationStepIndex] ? plannedRoute[destinationStepIndex].distance : null) || newDistance || 1;
      const distanceTraveled = initialDistanceForLeg - newDistance;
      const progressPercentage = Math.min(Math.floor((distanceTraveled / initialDistanceForLeg) * 100), 100);
      setProgress(progressPercentage);
    }, 1000);
    return () => clearInterval(interval);
  }, [travelStarted, arrivedAtMars, isDobraAtivada, isPaused, playSound, distanceKm, plannedRoute, routeIndex, handleChallengeEnd, saveTelemetryData, selectedPlanet, saveCurrentProgress, API_BASE_URL, userId, processadorO2, stopAllAudio, sosSurpriseEvent, isForcedMapEdit]);

  useEffect(() => {
    if ((monitorState !== 'static' && mainDisplayState !== 'static') || isPaused) return;
    const interval = setInterval(() => { setStaticScreenSeed(Math.random()); }, 100);
    return () => clearInterval(interval);
  }, [monitorState, mainDisplayState, isPaused]);

  const currentMaxSpeed = useMemo(() => {
    if (isDobraAtivada) return 100000000;
    if (isBoostingTo60k) return 60000;
    if (isFinalApproach) return 45000;
    return 45000;
  }, [isDobraAtivada, isBoostingTo60k, isFinalApproach]);

  const isPauseButtonDisabled = telemetry.velocity.kmh < 60000 || isDobraAtivada || distanceKm <= 0;
  const currentDialogueStep = activeChallengeData?.dialogo?.[dialogueIndex];
  const currentCharacterId = currentDialogueStep?.personagemId;
  const currentCharacterData = currentCharacterId ? desafiosData.personagens[currentCharacterId] : null;

  const handleCloseEscolhaModal = useCallback(() => {
    setShowEscolhaModal(false);
  }, []);

  const handleSpendCoins = useCallback((amount) => {
    setSpaceCoins(prev => (prev || 0) - amount);
  }, [setSpaceCoins]);

  const handleReplayDialogue = () => {
    if (activeChallengeData) {
      setDialogueIndex(0);
      setIsTransmissionStarting(true);
      setIsDialogueFinished(false);
    }
  };

  const handleNextDialogue = useCallback(() => {
    if (!activeChallengeData || !activeChallengeData.dialogo) return;

    if (dialogueIndex < activeChallengeData.dialogo.length - 1) {
      setDialogueIndex(prev => prev + 1);
      playSound('/sounds/ui-click.mp3');
    } else {
      setIsTransmissionStarting(false);
      setIsDialogueFinished(true);
      setShowEscolhaModal(true);
      setDialogueIndex(0);
    }
  }, [activeChallengeData, dialogueIndex, playSound]);

  useEffect(() => {
    if (!isTransmissionStarting || !activeChallengeData || !activeChallengeData.dialogo) return;

    const currentStep = activeChallengeData.dialogo[dialogueIndex];
    if (!currentStep) return;

    const duration = currentStep.duracao || (currentStep.texto.length * 50 + 2000);

    const timer = setTimeout(() => {
      handleNextDialogue();
    }, duration);

    return () => clearTimeout(timer);
  }, [dialogueIndex, isTransmissionStarting, activeChallengeData, handleNextDialogue]);

  const handleToggleMap = useCallback((show) => {
    if (show) {
      if (distanceKm <= 0 && !isForcedMapEdit) {
        playSound('/sounds/error.mp3');
        return;
      }
    }
    setShowStellarMap(show);
  }, [distanceKm, isForcedMapEdit, playSound]);


  if (isLoadingRoute) return <div className="tela-decolagem" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5em', color: '#00aaff', textShadow: '0 0 10px #00aaff' }}>Buscando dados da missão...</div>;

  return (
    <div className={`tela-decolagem ${isShaking ? 'shaking' : ''}`}>
      <div ref={cockpitRef} className="cockpit-container">
        <div className="left-panel-3d">
          <div style={{ marginTop: '-30px' }}>
            <RouteMonitor distanceKm={distanceKm} progress={progress} currentSpeed={telemetry.velocity.kmh} isDobraAtivada={isDobraAtivada} originPlanet={originPlanet.nome} destinationPlanet={selectedPlanet.nome} />
          </div>
          <div className="dobra-buttons-container">
            <div className="dobra-btn-wrapper">
              <button className={`ativar-de-btn ${isDobraAtivada ? 'active' : ''} ${!isDobraEnabled || isPaused || distanceKm <= 0 ? 'disabled' : ''}`} onClick={handleDobraEspacial} disabled={!isDobraEnabled || isPaused || distanceKm <= 0}>
                {isDobraAtivada ? <>Dobra<br />Ativa</> : <>Dobra<br />Espacial</>}
              </button>
            </div>
            <div className="dobra-btn-wrapper"><button className="inventory-btn" onClick={handleInventory} disabled={isPaused}>Inventário</button></div>
          </div>
          <SpeedGauge currentSpeed={telemetry.velocity.kmh} maxSpeed={currentMaxSpeed} isBoosting={isBoostingTo60k} isDobraAtivada={isDobraAtivada} />
          <div className="minerva-section">
            <div className={`minerva-title ${isMinervaHighlighted ? 'highlighted' : ''}`} onClick={handleMinervaClick} style={{ cursor: isPaused ? 'not-allowed' : 'pointer', zIndex: 10, position: 'relative' }}>MINERVA I.A.</div>
            <div className="minerva-container"><img src={minervaImage} alt="Minerva Status" className="minerva-image" /></div>
          </div>
          <div className="o2-processor-display">
            <span className="o2-processor-label">PROCESSADOR O2</span>
            <div className="o2-meter-visual">{[1, 2, 3, 4, 5].map(unit => (<div key={unit} className={`o2-unit ${processadorO2 >= unit ? 'filled' : ''}`}></div>))}</div>
            <button className={`o2-transfer-button ${isO2TransferDisabled ? 'disabled' : ''}`} onClick={handleOpenO2Modal} disabled={isO2TransferDisabled} style={{ zIndex: 100 }}>TRANSFERIR ({processadorO2})</button>
          </div>
        </div>
        <div className="right-panel-3d" style={{ zIndex: 50 }}>
          <MissionTimer isPaused={isPaused} />

          {/* MONITOR SUPERIOR */}
          <div className="right-monitor-container" style={{ marginTop: '80px' }}>
            <div className="monitor-controls">
              <span className={`rec-label ${isTransmissionStarting ? 'blinking-rec' : 'inactive-rec'}`}>REC</span>
              <button className={`play-button ${isDialogueFinished ? 'pulsing-play' : ''}`} onClick={handleReplayDialogue} disabled={!isDialogueFinished || isPaused}>Play</button>
            </div>
            <div className="monitor-screen">
              {isSosMinervaActive ? (
                <img
                  src="/images/Minerva/Minerva-Informando-velocidade.gif"
                  alt="Alerta S.O.S Minerva"
                  className="monitor-image"
                />
              ) : showCriticalWarpFail ? (
                <div className="monitor-text-display" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: 'rgba(30, 0, 0, 0.9)', flexDirection: 'column', padding: '10px' }}>
                  <h3 style={{ color: '#ff3333', margin: '0 0 10px 0', textShadow: '0 0 10px red', fontSize: '1.1rem', textAlign: 'center' }}>⚠ FALHA CRÍTICA ⚠</h3>
                  <p style={{ color: '#ffaaaa', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', lineHeight: '1.4', margin: 0 }}>
                    Elementos base para a dobra escassos.<br />
                    Recursos direcionados para<br />suporte à vida.
                  </p>
                </div>
              ) : isForcedMapEdit ? (
                <div className="monitor-text-display" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: 'rgba(50, 0, 0, 0.5)' }}>
                  <p style={{ color: '#ffcc00', textAlign: 'center', fontWeight: 'bold', textShadow: '0 0 5px red' }}>
                    ⚠ ATENÇÃO ⚠<br /><br />
                    Edite o Mapa Estelar e mude a rota para fechar.
                  </p>
                </div>
              ) : isTransmissionStarting && currentCharacterData?.imagem ? (
                <img src={currentCharacterData.imagem} alt={currentCharacterData.nome} className="monitor-image" />
              ) : (
                <>
                  {showWarpDisabledMessage ? (<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#ff0', textAlign: 'center', padding: '10px', fontSize: '0.9em', textShadow: '0 0 5px rgba(255, 255, 0, 0.7)' }}>Distancia Orbital máxima alcançada.<br />Dobra desativada!</div>) : showMinervaOnMonitor ? (<img src="/images/Minerva/Minerva-Informando-velocidade.gif" alt="Aviso de Velocidade" className="monitor-image" />) : (
                    <>
                      {monitorState === 'on' && <img src="/images/ACEE.png" alt="Ecrã do Monitor" className="monitor-image" />}
                      {monitorState === 'static' && <img src={`/images/No_Signal.png?seed=${staticScreenSeed}`} alt="Ecrã do Monitor" className="monitor-image" style={{ filter: 'brightness(1.2) contrast(1.5)', animation: 'staticFlicker 0.1s infinite alternate' }} />}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* MONITOR INFERIOR */}
          <div className="right-monitor-container" style={{ marginTop: '10px' }}>
            <div
              className="monitor-screen"
              onClick={isTransmissionStarting ? handleNextDialogue : undefined}
              style={{ cursor: isTransmissionStarting ? 'pointer' : 'default' }}
            >
              {isTransmissionStarting && currentDialogueStep && currentCharacterData ? (
                <div className="monitor-text-display">
                  <p>
                    <span className="dialogue-character-name" style={{ color: '#00aaff' }}>
                      {currentCharacterData.nome}:
                    </span>
                    {' '}
                    {highlightKeywords(currentDialogueStep.texto, currentDialogueStep.palavras_chave)}
                  </p>
                  <div style={{ textAlign: 'right', fontSize: '0.8em', color: '#00aaff', animation: 'blink 1s infinite' }}>
                    ▼
                  </div>
                </div>
              ) : (
                <>
                  {monitorState === 'on' && <img src="/images/ACEE.png" alt="Ecrã do Monitor" className="monitor-image" />}
                  {monitorState === 'static' && <img src={`/images/No_Signal.png?seed=${staticScreenSeed}`} alt="Ecrã do Monitor" className="monitor-image" style={{ filter: 'brightness(1.2) contrast(1.5)', animation: 'staticFlicker 0.1s infinite alternate' }} />}
                </>
              )}
            </div>
          </div>

          <div className="glossary-button-container" style={{ marginTop: '20px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button className="glossary-button" onClick={() => !isPaused && setShowGlossary(true)} disabled={isPaused}>GLOSSÁRIO</button>
              <button className="bolsa-button" onClick={handleInventory} disabled={true} title="Bolsa Espacial (Indisponível)" style={{ opacity: 0.5, cursor: 'not-allowed' }}><img src="/images/BolsaEspacial.png" alt="Bolsa Espacial" /></button>
            </div>
          </div>

          {teamPhotoUrl && (
            <div className="team-photo-frame">
              <div className="team-photo-header">TRIPULAÇÃO</div>
              <img
                src={`${API_BASE_URL}${teamPhotoUrl}`}
                alt="Equipe"
                className="team-photo-img"
                onError={(e) => {
                  console.log("Erro ao carregar foto, escondendo elemento...");
                  e.target.style.display = 'none';
                }}
              />
              <div className="team-photo-overlay"></div>
            </div>
          )}

          <div className="floating-buttons-container">
            <button
              className={`sos-button ${isSOSActive ? 'active' : ''}`}
              onClick={handleSOS}
              disabled={!isSOSActive}
              title={
                isSOSActive ? "Ativar S.O.S." :
                  !hasFundsForSOS ? "Sem SpaceCoins para S.O.S." :
                    "S.O.S. indisponível"
              }
            >
              S.O.S.
            </button>
            <button onClick={togglePause} disabled={isPauseButtonDisabled || isRestoringSOS} className={`pause-button ${isPaused ? 'paused' : ''}`} title={isRestoringSOS ? "Não é possível pausar durante a restauração S.O.S." : ""}>{isPaused ? 'Continuar Jogo' : 'Pausar Jogo'}</button>
          </div>
        </div>
        <div className="cockpit-overlay"></div>
        <div className="main-display">
          {mainDisplayState === 'acee' && (<img src="/images/ACEE.png" alt="ACEE" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />)}
          {mainDisplayState === 'clouds' && (<video src="/images/clouds.webm" className="cloud-animation-video" autoPlay muted loop playsInline preload="auto" />)}
          {mainDisplayState === 'static' && <div className="static-animation"></div>}
          {isDobraAtivada ? (<video src="/images/Vluz-Dobra.webm" autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (mainDisplayState === 'stars' && (<SpaceView distance={distanceKm} forceLarge={arrivedAtMars} isWarpActive={false} isPaused={isPaused} selectedPlanet={selectedPlanet} onChallengeEnd={handleChallengeEnd} isDeparting={isDeparting} />))}

          {showStoreModal && <LojaEspacial
            onClose={() => setShowStoreModal(false)}
            currentTelemetry={telemetry}
            onSeguirPlano={handleSeguirPlano}
            onMudarRota={handleMudarRota}
            onChallengeAccepted={handleStoreChallengeImpact}
            isMainDisplayModal={true}
            currentStation={selectedPlanet?.nome}
            hasRoute={plannedRoute && (routeIndex + 1) < plannedRoute.length}
          />}

          {showSosSurprise && sosSurpriseEvent && (
            <SosSurpriseModal
              event={sosSurpriseEvent}
              onMudarRota={handleMudarRota}
              onSeguirPlano={handleSeguirPlano}
            />
          )}

        </div>
        <TelemetryDisplay
          data={telemetry}
          isPaused={isPaused}
          showStellarMap={showStellarMap}
          setShowStellarMap={handleToggleMap}
          onRouteChanged={handleRouteChanged}
          isDobraAtivada={isDobraAtivada}
          plannedRoute={plannedRoute}
          routeIndex={routeIndex}
          isOxygenRefilled={isOxygenRefilled}
          lastImpactTimestamp={lastImpactTimestamp}
          isForcedMapEdit={isForcedMapEdit}
          onSosDetected={handleSosDetected}
          distanceKm={distanceKm}
          sosSignalData={(distanceKm > 0 || isForcedMapEdit) ? activeSosSignal : null}
        />
      </div>
      {showMandala && (<div className="modal-overlay"><div className="modal-content"><MandalaVirtudes onClose={() => setShowMandala(false)} groupId={groupId} /></div></div>)}
      {showGlossary && (<div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="modal-content" style={{ backgroundColor: 'rgba(0, 30, 60, 0.97)', padding: '20px', borderRadius: '8px', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflow: 'auto', position: 'relative' }}><Suspense fallback={<div>Carregando...</div>}><GalacticVirtudesPage onClose={() => setShowGlossary(false)} /></Suspense></div></div>)}
      {showInventory && <Inventario onClose={() => setShowInventory(false)} onUpdateTelemetry={handleInventoryTelemetryUpdate} />}
      {showDesafioModal && activeChallengeData && <ModalDesafio desafio={activeChallengeData} onClose={() => { setShowDesafioModal(false); setIsTransmissionStarting(true); }} className="main-display-modal" showTimer={true} />}
      {showEscolhaModal && activeChallengeData && <ModalEscolha key={modalEscolhaKey} desafio={activeChallengeData} onClose={handleCloseEscolhaModal} onEscolha={handleEscolha} missionTime={missionTime} onSpendCoins={handleSpendCoins} showTimer={!isReviewing} />}

      {showConfirmacaoModal && (
        <ModalConfirmacaoViagem
          onSeguirPlano={handleSeguirPlano}
          onMudarRota={handleMudarRota}
          hasRoute={plannedRoute && (routeIndex + 1) < plannedRoute.length}
        />
      )}

      {showSOSModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'center', fontFamily: "'Courier New', monospace" }}>
            <h3 style={{ color: '#fff' }}>S.O.S. RECOVERY SYSTEM</h3>
            <p style={{ color: '#fff', fontSize: '1.1em', lineHeight: '1.5' }}>Para recuperar a integridade de <strong style={{ color: '#00ff00' }}> TODOS OS SISTEMAS </strong> da nave, custará o valor de <strong style={{ color: 'yellow', fontSize: '1.1em' }}> {sosCost.toLocaleString('pt-BR')} SpaceCoins</strong>.</p>
            <p style={{ color: '#fff', fontSize: '1.1em', lineHeight: '1.5' }}>Você aceita?</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '30px' }}>
              <button onClick={handleCancelSOS} style={{ padding: '10px 20px', background: 'linear-gradient(145deg, #ff8c00, #e67300)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontWeight: 'bold', fontSize: '1em' }}>Cancelar</button>
              <button onClick={handleConfirmSOS} style={{ padding: '10px 20px', background: 'linear-gradient(145deg, #00a800, #008500)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontWeight: 'bold', fontSize: '1em' }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {showO2Modal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'center', fontFamily: "'Courier New', monospace", color: '#fff', border: '2px solid #0bf', boxShadow: '0 0 20px #0bf' }}>
            <h3 style={{ textShadow: '0 0 10px #0bf' }}>TRANSFERÊNCIA DE OXIGÊNIO</h3>
            <p style={{ fontSize: '1.1em', margin: '20px 0' }}>
              Deseja transferir <strong style={{ color: '#0bf' }}>{processadorO2} unidades</strong> do Processador de O2 para o suporte de vida da nave?
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '30px' }}>
              <button
                onClick={() => setShowO2Modal(false)}
                style={{ padding: '10px 20px', background: '#444', color: 'white', border: '1px solid #777', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontWeight: 'bold' }}
              >
                CANCELAR
              </button>
              <button
                onClick={() => {
                  handleTransferO2();
                  setShowO2Modal(false);
                }}
                style={{ padding: '10px 20px', background: 'linear-gradient(145deg, #0055ff, #0033cc)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontWeight: 'bold', boxShadow: '0 0 10px #0055ff' }}
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecolagemMarte;