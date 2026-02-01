import React from 'react';
import './DecolagemMarte.css';

const CockpitControls = ({ telemetry }) => {
  return (
    <div className="cockpit-controls">
      <div className="propulsion-panel">
        {/* Primeira linha - 4 indicadores */}
        <div className="propulsion-indicator">
          <h4>REATOR NUCLEAR</h4>
          <span className="propulsion-value">NOMINAL</span>
        </div>
        <div className="propulsion-indicator">
          <h4>TEMP. REATOR</h4>
          <span className="propulsion-value">845°C</span>
        </div>
        <div className="propulsion-indicator">
          <h4>PRESSÃO</h4>
          <span className="propulsion-value">4.2 MPa</span>
        </div>
        <div className="propulsion-indicator">
          <h4>FLUXO NÊUTRON</h4>
          <span className="propulsion-value">3.8e15</span>
        </div>

        {/* Segunda linha - 3 indicadores */}
        <div className="propulsion-indicator">
          <h4>POTÊNCIA</h4>
          <span className="propulsion-value">98%</span>
        </div>
        <div className="propulsion-indicator">
          <h4>BARRA CONTROLE</h4>
          <span className="propulsion-value">45%</span>
        </div>
        <div className="propulsion-indicator">
          <h4>VAPOR</h4>
          <span className="propulsion-value">320°C</span>
        </div>

        {/* Espaço vazio para manter o grid alinhado */}
        <div></div>
      </div>

      <div className="space-coins-panel">
        <span className="space-coins-title">SPACE COINS</span>
        <span className="space-coins-value">01.000.000</span>
      </div>
    </div>
  );
};

export default CockpitControls;