// ModalDesafio.js
import React, { useState, useEffect, useRef } from 'react';
import './ModalDesafio.css';

// ALTERAÇÃO: Adicionada a prop 'showTimer' com valor padrão 'true'.
const ModalDesafio = ({ desafio, onClose, className = '', showTimer = true }) => {
    const [timeLeft, setTimeLeft] = useState(10 * 60);
    const contentRef = useRef(null);
    const [hasOverflow, setHasOverflow] = useState(false);

    // ALTERAÇÃO: O timer só é iniciado se 'showTimer' for verdadeiro.
    useEffect(() => {
        if (!showTimer) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [showTimer]);

    // ALTERAÇÃO: O fechamento automático só ocorre se o timer estiver ativo.
    useEffect(() => {
        if (showTimer && timeLeft === 0) {
            onClose();
        }
    }, [timeLeft, onClose, showTimer]);

    useEffect(() => {
        if (contentRef.current) {
            const isOverflowing = contentRef.current.scrollHeight > contentRef.current.clientHeight;
            setHasOverflow(isOverflowing);
        }
    }, [desafio?.descricao]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`modal-desafio-container ${className}`}>
            <div className="modal-desafio-header">
                <div className="modal-desafio-title">{desafio.nome}</div>
                {/* ALTERAÇÃO: O cronômetro só é renderizado se 'showTimer' for verdadeiro. */}
                {showTimer && <div className="modal-desafio-timer">{formatTime(timeLeft)}</div>}
                <button
                    className="close-desafio-button"
                    onClick={onClose}
                    aria-label="Fechar modal"
                >
                    ×
                </button>
            </div>
            <div
                ref={contentRef}
                className={`modal-desafio-content ${hasOverflow ? 'has-overflow' : ''}`}
            >
                {desafio.descricao.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                ))}
            </div>
            <div className="modal-desafio-footer">
                {/* Space for additional buttons */}
            </div>
        </div>
    );
};

export default ModalDesafio;