import React, { useState, useEffect } from 'react';
import './ModalEscolha.css';

const ModalEscolha = ({ desafio, onClose, onEscolha, missionTime, onSpendCoins, showTimer = true }) => {
    const [timeLeft, setTimeLeft] = useState(300);
    const [timeUp, setTimeUp] = useState(false);
    const [showReviewOptions, setShowReviewOptions] = useState(false);

    useEffect(() => {
        if (!showTimer || timeUp) return;

        const timer = setInterval(() => {
            setTimeLeft(prevTimeLeft => {
                if (prevTimeLeft <= 1) {
                    clearInterval(timer);
                    setTimeUp(true);
                    setShowReviewOptions(true);
                    return 0;
                }
                return prevTimeLeft - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeUp, showTimer]);


    const handleOptionClick = (opcao) => {
        if (timeUp) return;
        onEscolha(opcao, desafio.id, opcao.impactos);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!desafio || !desafio.opcoes || desafio.opcoes.length === 0) {
        return null;
    }

    const costX = Math.floor(missionTime / 10) + 150;
    const costY = Math.floor(missionTime / 10) + 50;

    const resetModalState = () => {
        setTimeUp(false);
        setShowReviewOptions(false);
        setTimeLeft(300);
    };

    // ALTERAÇÃO: 'Rever tudo' agora fecha este modal e sinaliza ao pai para abrir o ModalDesafio
    const handleReviewAll = (e) => {
        e.stopPropagation();
        if (onSpendCoins) {
            // Enviamos 'all' para o pai saber que deve reabrir o desafio completo
            onSpendCoins(costX, 'all');
        }
        // Fechamos o ModalEscolha atual para que o pai possa renderizar o ModalDesafio
        onClose();
    };

    // ALTERAÇÃO: 'Rever Opções' apenas reseta o timer e mantém o usuário aqui
    const handleReviewOptions = (e) => {
        e.stopPropagation();
        if (onSpendCoins) {
            // Enviamos 'options' apenas para debitar as moedas
            onSpendCoins(costY, 'options');
        }
        resetModalState();
    };

    return (
        <>
            <div className="modal-escolha-overlay">
                <div className={`modal-escolha-container ${timeUp ? 'disabled' : ''}`}>
                    <div className="modal-escolha-header">
                        <div className="modal-escolha-title">{desafio.nome}</div>
                        {showTimer && <div className="modal-escolha-timer">{formatTime(timeLeft)}</div>}
                    </div>
                    <div className="modal-escolha-content">
                        <p>Qual a sua avaliação sobre a situação-problema?</p>
                    </div>
                    <div className="modal-escolha-footer">
                        {desafio.opcoes.map((opcao) => (
                            <button
                                key={opcao.id}
                                className="modal-escolha-button"
                                onClick={() => handleOptionClick(opcao)}
                                disabled={timeUp}
                            >
                                <span>{opcao.id})</span> {opcao.texto}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {showReviewOptions && (
                <div
                    className="modal-review-options-overlay"
                    style={{
                        position: 'fixed',
                        top: 0, left: 0,
                        width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 999999,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        pointerEvents: 'auto'
                    }}
                >
                    <div
                        className="modal-review-options-container"
                        style={{
                            position: 'relative',
                            zIndex: 1000000,
                            pointerEvents: 'auto',
                            background: '#1a1a1a',
                            padding: '30px',
                            borderRadius: '10px',
                            border: '2px solid #00aaff',
                            textAlign: 'center',
                            color: 'white',
                            maxWidth: '500px'
                        }}
                    >
                        <h3 style={{ marginBottom: '20px', color: '#ff4444' }}>O tempo para avaliação terminou!</h3>
                        <p style={{ marginBottom: '30px' }}>Você pode usar suas Spacecoins para ter uma nova chance.</p>

                        <div className="review-buttons-container" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                            <button
                                className="review-button"
                                onClick={handleReviewAll}
                                style={{
                                    padding: '15px 25px',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(45deg, #00aaff, #0077cc)',
                                    border: 'none', borderRadius: '5px',
                                    color: 'white', fontWeight: 'bold', fontSize: '1rem'
                                }}
                            >
                                Rever tudo - {costX} Spacecoins
                            </button>
                            <button
                                className="review-button"
                                onClick={handleReviewOptions}
                                style={{
                                    padding: '15px 25px',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(45deg, #ffaa00, #cc8800)',
                                    border: 'none', borderRadius: '5px',
                                    color: 'white', fontWeight: 'bold', fontSize: '1rem'
                                }}
                            >
                                Rever Opções - {costY} Spacecoins
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ModalEscolha;