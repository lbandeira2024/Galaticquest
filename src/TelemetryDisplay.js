import React, { useState, lazy, Suspense, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import './TelemetryDisplay.css';
import { usePause } from './PauseContext';
import { useAuth } from './AuthContext';
import { useSpaceCoins } from './SpaceCoinsContext';
import { useConfig } from './ConfigContext';
import { useAudio } from './AudioManager';

const StellarMapPlan = lazy(() => import('./Planejamento-Rota/StellarMapPlan').catch(() => ({
  default: () => <div className="map-fallback">Mapa Estelar Indisponível</div>
})));

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const getProgressBarClass = (value) => {
  if (value > 80) return 'blue';
  if (value >= 50) return 'orange';
  return 'red';
};

const ProgressBar = ({ value: targetValue }) => {
  const [displayValue, setDisplayValue] = useState(targetValue);

  useEffect(() => {
    if (displayValue === targetValue) return;

    const start = displayValue;
    const end = targetValue;
    const diff = end - start;
    const duration = 1500;
    const frameRate = 20;
    const totalFrames = duration / frameRate;
    const step = diff / totalFrames;

    if (Math.abs(diff) < 1) {
      setDisplayValue(end);
      return;
    }

    const timer = setInterval(() => {
      setDisplayValue((prev) => {
        const next = prev + step;
        if ((step > 0 && next >= end) || (step < 0 && next <= end)) {
          clearInterval(timer);
          return end;
        }
        return next;
      });
    }, frameRate);

    return () => clearInterval(timer);
  }, [targetValue]);

  const finalValue = Math.round(displayValue);
  const progressClass = getProgressBarClass(finalValue);

  return (
    <div className="progress-container">
      <div className={`progress-bar ${progressClass}`} style={{ width: `${Math.min(100, Math.max(0, finalValue))}%` }}>
        <span className="progress-value">{finalValue}%</span>
      </div>
    </div>
  );
};

const TelemetryDisplay = ({
  data = {}, isPaused, showStellarMap, setShowStellarMap, isDobraAtivada,
  onRouteChanged, plannedRoute, routeIndex, isOxygenRefilled,
  lastImpactTimestamp, isForcedMapEdit = false, sosSignalData, distanceKm
}) => {
  const { user } = useAuth();
  const { apiBaseUrl } = useConfig();
  const { spaceCoins, setSpaceCoins, syncSpaceCoins } = useSpaceCoins();
  const { playSound } = useAudio();

  const userRef = useRef(user);
  const baseUrlRef = useRef(apiBaseUrl);
  const syncSpaceCoinsRef = useRef(syncSpaceCoins);

  useEffect(() => {
    userRef.current = user;
    baseUrlRef.current = apiBaseUrl;
    syncSpaceCoinsRef.current = syncSpaceCoins;
  }, [user, apiBaseUrl, syncSpaceCoins]);

  const [onlineShips, setOnlineShips] = useState([]);
  const [highlightedMetrics, setHighlightedMetrics] = useState({});
  const prevData = usePrevious(data);

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : 0, obj);
  };

  useEffect(() => {
    if (!prevData || lastImpactTimestamp === 0) return;
    const newHighlights = {};
    let hasChanges = false;
    const keysToCheck = [
      'propulsion.powerOutput', 'direction', 'stability',
      'productivity', 'interdependence', 'engagement', 'atmosphere.o2'
    ];

    keysToCheck.forEach(key => {
      const currentVal = Math.round(getNestedValue(data, key));
      const prevVal = Math.round(getNestedValue(prevData, key));
      if (currentVal !== prevVal) {
        newHighlights[key] = currentVal - prevVal;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      playSound('/sounds/data-updates-telemetry.mp3');
      setHighlightedMetrics(prev => ({ ...prev, ...newHighlights }));
      Object.keys(newHighlights).forEach(key => {
        setTimeout(() => {
          setHighlightedMetrics(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
        }, 15000);
      });
    }
  }, [lastImpactTimestamp]);

  const renderDelta = (key) => {
    const delta = highlightedMetrics[key];
    if (delta === undefined) return null;
    return <span className="delta-value">{delta > 0 ? '+' : ''}{delta}%</span>;
  };

  useEffect(() => {
    const executeHeartbeatCycle = async () => {
      const currentUser = userRef.current;
      const currentUrl = baseUrlRef.current;
      if (!currentUser?._id || !currentUser?.gameNumber || !currentUrl) return;

      try { await axios.post(`${currentUrl}/heartbeat`, { userId: currentUser._id }); } catch (e) { }
      try {
        const response = await axios.get(`${currentUrl}/games/${currentUser.gameNumber}/online-ships`);
        if (response.data.success) setOnlineShips(response.data.onlineShips);
      } catch (error) { }
      try {
        const myDataResponse = await axios.get(`${currentUrl}/${currentUser._id}/game-data`);
        if (myDataResponse.data.success && myDataResponse.data.spaceCoins !== undefined) {
          if (syncSpaceCoinsRef.current) syncSpaceCoinsRef.current(myDataResponse.data.spaceCoins);
        }
      } catch (error) { }
    };

    executeHeartbeatCycle();
    const intervalId = setInterval(executeHeartbeatCycle, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const shipDataMap = {
    ARTEMIS1: { id: 'ARTEMIS1', name: 'ARTEMIS I', imageTransferUrl: '/images/Naves/01.Artemis1-transferencia.png' },
    OBERONX: { id: 'OBERONX', name: 'OBERON', imageTransferUrl: '/images/Naves/02.OberonX--transferencia.png' },
    GAIANOVA: { id: 'GAIANOVA', name: 'GAIA NOVA', imageTransferUrl: '/images/Naves/03.Gaia_Nova-transferencia.png' },
    STRATUSV: { id: 'STRATUSV', name: 'STRATUS V', imageTransferUrl: '/images/Naves/04.StratusV-transferencia.png' },
    NEOECLIPSE: { id: 'NEOECLIPSE', name: 'NEO ECLIPSE', imageTransferUrl: '/images/Naves/05.Neo_Eclipse-transferencia.png' }
  };

  const [displayedCoins, setDisplayedCoins] = useState(null);
  const animationIntervalRef = useRef(null);

  useEffect(() => {
    if (spaceCoins === null || spaceCoins === undefined) return;
    const target = spaceCoins;
    if (displayedCoins === null) { setDisplayedCoins(target); return; }
    clearInterval(animationIntervalRef.current);
    const start = displayedCoins;
    if (target === start) return;
    const diff = target - start;
    const ticks = 750 / 25;
    let step = Math.round(diff / ticks);
    if (step === 0) step = diff > 0 ? 1 : -1;
    animationIntervalRef.current = setInterval(() => {
      setDisplayedCoins(prev => {
        const next = (prev || 0) + step;
        if ((step > 0 && next >= target) || (step < 0 && next <= target)) {
          clearInterval(animationIntervalRef.current);
          return target;
        }
        return next;
      });
    }, 25);
    return () => clearInterval(animationIntervalRef.current);
  }, [spaceCoins]);

  const [transferError, setTransferError] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmounts, setTransferAmounts] = useState({});
  const [rawTransferAmounts, setRawTransferAmounts] = useState({});

  const isStellarMapDisabled = isPaused || isDobraAtivada || (!isForcedMapEdit && (distanceKm <= 0 || (data.velocity?.kmh ?? 0) < 60000));

  const handleMapClose = (newRouteData) => {
    if (isForcedMapEdit && !newRouteData) return;
    setShowStellarMap(false);
    if (onRouteChanged) onRouteChanged(newRouteData);
  };

  const formatSpaceCoins = (value) => (Math.round(value || 0)).toString().padStart(9, '0').replace(/(\d{3})(?=\d)/g, '$1.').slice(0, 11);
  const formatCurrencyInput = (value) => value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const handleTransferChange = (teamNameKey, value) => {
    setTransferAmounts(prev => ({ ...prev, [teamNameKey]: formatCurrencyInput(value) }));
    setRawTransferAmounts(prev => ({ ...prev, [teamNameKey]: parseInt(value.replace(/[^0-9]/g, '')) || 0 }));
  };

  const handleTransfer = async () => {
    const totalToTransfer = Object.values(rawTransferAmounts).reduce((sum, amount) => sum + (amount || 0), 0);
    if (totalToTransfer > (spaceCoins || 0)) return setTransferError('Valor total excede o saldo disponível!');
    if (totalToTransfer <= 0) return setTransferError('Por favor, insira um valor válido para transferência!');
    if (!user?._id) return setTransferError('Erro: Usuário não identificado.');
    try {
      const response = await axios.post(`${apiBaseUrl}/transfer-funds`, { userId: user._id, transfers: rawTransferAmounts });
      if (response.data.success) {
        setSpaceCoins(response.data.newBalance);
        setTransferAmounts({});
        setRawTransferAmounts({});
        setShowTransferModal(false);
        setTransferError('');
        playSound('/sounds/ui-purchase.mp3');
      } else {
        setTransferError(response.data.message);
      }
    } catch (error) { setTransferError('Erro de comunicação com o servidor.'); }
  };

  const userTeamName = user?.grupo?.teamName;
  const otherOnlineShips = onlineShips.filter(ship => ship.name !== userTeamName).map(ship => ({
    ...ship, imageTransferUrl: shipDataMap[ship.id]?.imageTransferUrl, shipDisplayName: shipDataMap[ship.id]?.name || ship.id
  })).filter(ship => ship.imageTransferUrl);

  return (
    <div className="telemetry-display">
      <div className="telemetry-nuclear-panel">
        <div className={`nuclear-item ${highlightedMetrics['propulsion.powerOutput'] !== undefined ? 'highlight-changed' : ''}`}>
          <span className="nuclear-label">PROPULSÃO NUCLEAR</span>
          <ProgressBar value={Math.round(parseFloat(data.propulsion?.powerOutput) || 0)} />
          {renderDelta('propulsion.powerOutput')}
        </div>
        <div className={`nuclear-item ${highlightedMetrics['direction'] !== undefined ? 'highlight-changed' : ''}`}>
          <span className="nuclear-label">DIREÇÃO</span>
          <ProgressBar value={Math.round(data.direction ?? 0)} />
          {renderDelta('direction')}
        </div>
        <div className={`nuclear-item ${highlightedMetrics['stability'] !== undefined ? 'highlight-changed' : ''}`}>
          <span className="nuclear-label">ESTABILIDADE</span>
          <ProgressBar value={Math.round(data.stability ?? 0)} />
          {renderDelta('stability')}
        </div>
        <div className={`nuclear-item ${highlightedMetrics['productivity'] !== undefined ? 'highlight-changed' : ''}`}>
          <span className="nuclear-label">PRODUTIVIDADE</span>
          <ProgressBar value={Math.round(data.productivity ?? 0)} />
          {renderDelta('productivity')}
        </div>
        <div className={`nuclear-item ${highlightedMetrics['interdependence'] !== undefined ? 'highlight-changed' : ''}`}>
          <span className="nuclear-label">INTERDEPENDÊNCIA</span>
          <ProgressBar value={Math.round(data.interdependence ?? 0)} />
          {renderDelta('interdependence')}
        </div>
        <div className={`nuclear-item ${highlightedMetrics['engagement'] !== undefined ? 'highlight-changed' : ''}`}>
          <span className="nuclear-label">ENGAJAMENTO</span>
          <ProgressBar value={Math.round(data.engagement ?? 0)} />
          {renderDelta('engagement')}
        </div>
        <div className={`nuclear-item ${isOxygenRefilled ? 'oxygen-refill-active' : ''} ${highlightedMetrics['atmosphere.o2'] !== undefined ? 'highlight-changed' : ''}`}>
          <span className="nuclear-label">OXIGÊNIO</span>
          <ProgressBar value={Math.round(data.atmosphere?.o2 ?? 0)} />
          {renderDelta('atmosphere.o2')}
        </div>
        <div className="nuclear-item">
          <span className="nuclear-label">MAPA ESTELAR</span>
          <button className="stellar-map-button" onClick={() => !isStellarMapDisabled && setShowStellarMap(true)} disabled={isStellarMapDisabled}>
            ABRIR MAPA
          </button>
        </div>
      </div>

      {showStellarMap && createPortal(
        <div className="stellar-map-overlay-root">
          <div className="stellar-map-floating">
            <Suspense fallback={<div className="loading-map">Carregando Mapa Estelar...</div>}>
              <StellarMapPlan
                onCloseMap={handleMapClose}
                showCloseButton={!isForcedMapEdit}
                initialRoute={plannedRoute}
                currentIndex={routeIndex}
                sosSignalData={sosSignalData}
              />
            </Suspense>
          </div>
        </div>,
        document.body
      )}

      <div className="space-coins-panel">
        <img src="/images/SpaceCoin_ROTACIONA.gif" alt="Space Coins" className="space-coins-image" />
        <span className="space-coins-value">{formatSpaceCoins(displayedCoins)}</span>
        <button className="botao-transferir" disabled={isPaused} onClick={() => !isPaused && setShowTransferModal(true)}>Transferir</button>
      </div>

      {showTransferModal && (
        <div className="transfer-modal">
          <button className="close-transfer-button" onClick={() => { setShowTransferModal(false); setTransferError(''); }}>×</button>
          <h2 className="transfer-title">TRANSFERÊNCIA DE VALORES</h2>
          {transferError && <div className="transfer-error">{transferError}</div>}
          {(() => {
            const userShipData = shipDataMap[user?.grupo?.naveEscolhida];
            return userShipData ? (
              <div className="origin-container">
                <img src={userShipData.imageTransferUrl} alt={userShipData.name} className="ship-image" />
                <span className="origin-title">{userShipData.name.toUpperCase()}</span>
              </div>
            ) : (<div className="origin-container"><span className="origin-title">NAVE NÃO ENCONTRADA</span></div>);
          })()}
          <div className="ships-grid">
            {otherOnlineShips.length > 0 ? (
              otherOnlineShips.map(ship => (
                <div className="ship-item" key={ship.name}>
                  <img src={ship.imageTransferUrl} alt={ship.shipDisplayName} className="ship-image" />
                  <span className="ship-name">{ship.shipDisplayName.toUpperCase()}</span>
                  <input type="text" className="transfer-input" value={transferAmounts[ship.name] || ''} onChange={(e) => handleTransferChange(ship.name, e.target.value)} placeholder="0" />
                </div>
              ))
            ) : (<p className="no-ships-online" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Nenhuma outra nave online.</p>)}
          </div>
          <div className="transfer-actions">
            <button className="transfer-button cancel-button" onClick={() => setShowTransferModal(false)}>Cancelar</button>
            <button className="transfer-button" onClick={handleTransfer}>Confirmar Transferência</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelemetryDisplay;