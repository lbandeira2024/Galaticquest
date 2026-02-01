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

        // Passa também 'opcao.impactos' para que o Pai possa calcular o novo estado
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

    const costX = Math.floor(missionTime / 100) + 150;
    const costY = Math.floor(missionTime / 100) + 50;

    const handleReviewAll = () => {
        console.log(`Usuário escolheu 'Rever tudo', custo: ${costX}`);
        onSpendCoins(costX, 'all');
    };

    const handleReviewOptions = () => {
        console.log(`Usuário escolheu 'Rever Opções', custo: ${costY}`);
        onSpendCoins(costY, 'options');
    };


    return (
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

            {showReviewOptions && (
                <div className="modal-review-options-overlay">
                    <div className="modal-review-options-container">
                        <h3>O tempo para avaliação terminou!</h3>
                        <p>Você pode usar suas Spacecoins para ter uma nova chance.</p>
                        <div className="review-buttons-container">
                            <button className="review-button" onClick={handleReviewAll}>
                                Rever tudo - {costX} Spacecoins
                            </button>
                            <button className="review-button" onClick={handleReviewOptions}>
                                Rever Opções - {costY} Spacecoins
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModalEscolha;