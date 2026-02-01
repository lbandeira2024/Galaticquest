import React, { useState, lazy, Suspense, useEffect } from 'react';
import './TelemetryDisplay.css';
import { usePause } from './PauseContext';
import { useAuth } from './AuthContext';
import { useSpaceCoins } from './SpaceCoinsContext'; // NOVO: Importa o hook do contexto

const StellarMapPlan = lazy(() => import('./Planejamento-Rota/StellarMapPlan').catch(() => ({
  default: () => <div className="map-fallback">Mapa Estelar Indisponível</div>
})));

const TelemetryDisplay = ({ data = {}, isPaused, showStellarMap, setShowStellarMap, isDobraAtivada }) => {
  const { user } = useAuth(); // Mantido para o user._id e outras lógicas

  // MODIFICADO: O estado dos SpaceCoins agora vem DIRETAMENTE do contexto.
  // Isso garante que quando o S.O.S. (em DecolagemMarte.js) chama setSpaceCoins,
  // este componente é atualizado automaticamente.
  const { spaceCoins, setSpaceCoins } = useSpaceCoins();

  // REMOVIDO: Este estado local é a causa do bug.
  // const [totalSpaceCoins, setTotalSpaceCoins] = useState(user?.grupo?.spaceCoins || 0);

  const [transferError, setTransferError] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmounts, setTransferAmounts] = useState({
    oberon: '',
    gaianova: '',
    strausv: '',
    neoEclipse: '',
  });
  const [rawTransferAmounts, setRawTransferAmounts] = useState({
    oberon: 0,
    gaianova: 0,
    strausv: 0,
    neoEclipse: 0,
  });

  // REMOVIDO: Este useEffect não é mais necessário.
  // useEffect(() => {
  //   setTotalSpaceCoins(user?.grupo?.spaceCoins || 0);
  // }, [user?.grupo?.spaceCoins]);


  const isStellarMapDisabled = isPaused || (data.velocity?.kmh ?? 0) < 60000 || isDobraAtivada;

  const getProgressBarClass = (value) => {
    if (value > 80) return 'blue';
    if (value >= 50) return 'orange';
    return 'red';
  };

  const ProgressBar = ({ value }) => {
    const progressClass = getProgressBarClass(value);
    return (
      <div className="progress-container">
        <div
          className={`progress-bar ${progressClass}`}
          style={{ width: `${value}%` }}
        ></div>
        <span className="progress-value">{value}%</span>
      </div>
    );
  };

  const formatSpaceCoins = (value) => {
    // MODIFICADO: `value` agora é `spaceCoins` (que pode ser null ou undefined)
    return (value || 0).toString()
      .padStart(9, '0')
      .replace(/(\d{3})(?=\d)/g, '$1.')
      .slice(0, 11);
  };

  const formatCurrencyInput = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleTransferChange = (ship, value) => {
    const formattedValue = formatCurrencyInput(value);
    const numericValue = value.replace(/[^0-9]/g, '') || '0';

    setTransferAmounts(prev => ({ ...prev, [ship]: formattedValue }));
    setRawTransferAmounts(prev => ({ ...prev, [ship]: parseInt(numericValue) || 0 }));
  };

  const handleTransfer = async () => {
    const totalToTransfer = Object.values(rawTransferAmounts).reduce((sum, amount) => sum + (amount || 0), 0);

    // MODIFICADO: Valida contra `spaceCoins` do contexto
    if (totalToTransfer > (spaceCoins || 0)) {
      setTransferError('Valor total excede o saldo disponível!');
      return;
    }
    if (totalToTransfer <= 0) {
      setTransferError('Por favor, insira um valor válido para transferência!');
      return;
    }
    if (!user?._id) {
      setTransferError('Erro: Usuário não identificado.');
      return;
    }

    setTransferError('');

    // MODIFICADO: Calcula o novo valor com base no contexto
    const newSpaceCoins = (spaceCoins || 0) - totalToTransfer;

    try {
      // MODIFICADO: A lógica de transferência agora usa o setSpaceCoins do contexto.
      // O contexto (SpaceCoinsContext.js) já cuida da atualização no servidor.
      // Fazer um fetch manual aqui e chamar login() estava quebrando a sincronia.
      setSpaceCoins(newSpaceCoins);

      console.log("✅ Transferência (via Contexto) iniciada!");

      setTransferAmounts({ oberon: '', gaianova: '', strausv: '', neoEclipse: '' });
      setRawTransferAmounts({ oberon: 0, gaianova: 0, strausv: 0, neoEclipse: 0 });
      setShowTransferModal(false);

    } catch (error) {
      console.error("❌ Erro ao iniciar transferência via contexto:", error);
      setTransferError("Houve um erro de comunicação. Tente novamente.");
    }
  };

  return (
    <div className="telemetry-display">
      {/* ==================== INÍCIO DA MODIFICAÇÃO ==================== */}
      {/* ATUALIZADO PARA USAR DADOS DINÂMICOS VINDOS DO ESTADO */}
      <div className="telemetry-nuclear-panel">
        <div className="nuclear-item">
          <span className="nuclear-label">PROPULSÃO NUCLEAR</span>
          <ProgressBar value={Math.round(data.propulsion?.powerOutput ?? 0)} />
        </div>
        <div className="nuclear-item">
          <span className="nuclear-label">DIREÇÃO</span>
          <ProgressBar value={Math.round(data.direction ?? 0)} />
        </div>
        <div className="nuclear-item">
          <span className="nuclear-label">ESTABILIDADE</span>
          <ProgressBar value={Math.round(data.stability ?? 0)} />
        </div>
        <div className="nuclear-item">
          <span className="nuclear-label">PRODUTIVIDADE</span>
          <ProgressBar value={Math.round(data.productivity ?? 0)} />
        </div>
        <div className="nuclear-item">
          <span className="nuclear-label">INTERDEPENDÊNCIA</span>
          <ProgressBar value={Math.round(data.interdependence ?? 0)} />
        </div>
        <div className="nuclear-item">
          <span className="nuclear-label">ENGAJAMENTO</span>
          <ProgressBar value={Math.round(data.engagement ?? 0)} />
        </div>
        <div className="nuclear-item">
          <span className="nuclear-label">OXIGÊNIO</span>
          <ProgressBar value={Math.round(data.atmosphere?.o2 ?? 0)} />
        </div>
        {/* ==================== FIM DA MODIFICAÇÃO ==================== */}
        <div className="nuclear-item">
          <span className="stellar-map-label">MAPA ESTELAR</span>
          <button
            className="stellar-map-button"
            onClick={() => !isStellarMapDisabled && setShowStellarMap(true)}
            disabled={isStellarMapDisabled}
          >
            ABRIR MAPA
          </button>
        </div>
      </div>
      {showStellarMap && (
        <div className="stellar-map-floating">
          <button
            className="close-stellar-map-button"
            onClick={() => setShowStellarMap(false)}
          >
            ×
          </button>
          <Suspense fallback={<div className="loading-map">Carregando Mapa Estelar...</div>}>
            <StellarMapPlan />
          </Suspense>
        </div>
      )}
      <div className="space-coins-panel">
        <img
          src="/images/SpaceCoin_ROTACIONA.gif"
          alt="Space Coins"
          className="space-coins-image"
        />
        {/* MODIFICADO: O valor agora vem de `spaceCoins` (do contexto) */}
        <span className="space-coins-value">{formatSpaceCoins(spaceCoins)}</span>
        <button
          className="botao-transferir"
          disabled={isPaused}
          onClick={() => !isPaused && setShowTransferModal(true)}
        >
          Transferir
        </button>
      </div>

      {showTransferModal && (
        <div className="transfer-modal">
          <button
            className="close-transfer-button"
            onClick={() => {
              setShowTransferModal(false);
              setTransferError('');
            }}
          >
            ×
          </button>

          <h2 className="transfer-title">TRANSFERÊNCIA DE VALORES</h2>
          {transferError && <div className="transfer-error">{transferError}</div>}
          <div className="origin-container">
            <img
              src="/images/Naves/01.Artemis1-transferencia.png"
              alt="Gaia Nova"
              className="ship-image"
            />
            <span className="origin-title">ARTEMIS I</span>
          </div>

          <div className="ships-grid">
            <div className="ship-item">
              <img
                src="/images/Naves/02.OberonX--transferencia.png"
                alt="Oberon"
                className="ship-image"
              />
              <span className="ship-name">OBERON</span>
              <input
                type="text"
                className="transfer-input"
                value={transferAmounts.oberon}
                onChange={(e) => handleTransferChange('oberon', e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="ship-item">
              <img
                src="/images/Naves/03.Gaia_Nova-transferencia.png"
                alt="Gaia Nova"
                className="ship-image"
              />
              <span className="ship-name">GAIA NOVA</span>
              <input
                type="text"
                className="transfer-input"
                value={transferAmounts.gaianova}
                onChange={(e) => handleTransferChange('gaianova', e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="ship-item">
              <img
                src="/images/Naves/04.StratusV-transferencia.png"
                alt="Stratus V"
                className="ship-image"
              />
              <span className="ship-name">STRATUS V</span>
              <input
                type="text"
                className="transfer-input"
                value={transferAmounts.strausv}
                onChange={(e) => handleTransferChange('strausv', e.target.value)}
                placeholder="0"
              />
            </div><div className="ship-item">
              <img
                src="/images/Naves/05.Neo_Eclipse-transferencia.png"
                alt="Neo Eclipse"
                className="ship-image"
              />
              <span className="ship-name">NEO ECLIPSE</span>
              <input
                type="text"
                className="transfer-input"
                value={transferAmounts.neoEclipse}
                onChange={(e) => handleTransferChange('neoEclipse', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="transfer-actions">
            <button
              className="transfer-button cancel-button"
              onClick={() => setShowTransferModal(false)}
            >
              Cancelar
            </button>
            <button
              className="transfer-button"
              onClick={handleTransfer} // MODIFICADO: handleTransfer agora usa o contexto
            >
              Confirmar Transferência
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelemetryDisplay;