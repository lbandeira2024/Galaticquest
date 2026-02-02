import React from 'react';
import './DecolagemMarte.css';

const SpeedGauge = ({ currentSpeed, maxSpeed, isBoosting, isDobraAtivada }) => {
    const GAUGE_VISUAL_MAX = 60000;
    const percentage = Math.min((currentSpeed / GAUGE_VISUAL_MAX) * 100, 100);
    const speedMarks = [0, 12000, 24000, 36000, 48000, 60000];

    return (
        <div className={`left-panel-speed-gauge ${isDobraAtivada ? 'is-dobra-active' : ''}`}>
            <div className="speed-gauge-header">
                <span className="speed-gauge-title">VELOCIDADE</span>
                <span className="speed-gauge-value">
                    {Math.round(currentSpeed).toLocaleString()} km/h
                </span>
            </div>
            <div className="speed-gauge-bar">
                <div
                    className={`speed-gauge-fill ${isBoosting ? 'is-boosting' : ''} ${isDobraAtivada ? 'is-dobra-active' : ''}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="speed-gauge-marks">
                {speedMarks.map((mark) => (
                    <span key={mark}>{mark / 1000}k</span>
                ))}
            </div>
            <div className="speed-gauge-unit">
                {isDobraAtivada ? 'VELOCIDADE DE DOBRA' : 'KILOMETROS POR HORA'}
            </div>
        </div>
    );
};

export default SpeedGauge;