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

    // CUSTO DINÂMICO:
    // Usa 'missionTime' (que receberá o travelTime do pai) para aumentar o valor.
    // Ajuste o divisor (ex: /10) se quiser que suba mais rápido ou (/100) mais devagar.
    const costX = Math.floor(missionTime / 10) + 150;
    const costY = Math.floor(missionTime / 10) + 50;

    const resetModalState = () => {
        setTimeUp(false);
        setShowReviewOptions(false);
        setTimeLeft(300);
    };

    const handleReviewAll = (e) => {
        e.stopPropagation(); // Previne conflitos de clique
        console.log(`Usuário escolheu 'Rever tudo', custo: ${costX}`);
        if (onSpendCoins) {
            onSpendCoins(costX, 'all');
        }
        resetModalState();
    };

    const handleReviewOptions = (e) => {
        e.stopPropagation(); // Previne conflitos de clique
        console.log(`Usuário escolheu 'Rever Opções', custo: ${costY}`);
        if (onSpendCoins) {
            onSpendCoins(costY, 'options');
        }
        resetModalState();
    };

    return (
        <>
            {/* Modal Principal (Fica "disabled" visualmente quando o tempo acaba) */}
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

            {/* Overlay de Revisão (SEPARADO e FORÇADO NO TOPO) */}
            {showReviewOptions && (
                <div
                    className="modal-review-options-overlay"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 999999, // Z-Index altíssimo para garantir prioridade
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        pointerEvents: 'auto' // Garante que aceita cliques
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
                                    pointerEvents: 'auto',
                                    background: 'linear-gradient(45deg, #00aaff, #0077cc)',
                                    border: 'none',
                                    borderRadius: '5px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
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
                                    pointerEvents: 'auto',
                                    background: 'linear-gradient(45deg, #ffaa00, #cc8800)',
                                    border: 'none',
                                    borderRadius: '5px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
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