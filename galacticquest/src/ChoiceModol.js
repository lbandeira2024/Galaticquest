import React from 'react';
import './ChoiceModal.css';

const ChoiceModal = ({ onContinue, onChangePlan }) => {
    return (
        <div className="choice-modal-overlay">
            <div className="choice-modal-content">
                <h2>Decisão de Rota</h2>
                <p>Sua jornada imediata neste sistema foi concluída. Você pode seguir para o próximo destino em sua rota ou abrir o mapa estelar para traçar um novo curso.</p>
                <div className="choice-modal-buttons">
                    <button onClick={onContinue} className="choice-button continue">
                        Continuar a Rota
                    </button>
                    <button onClick={onChangePlan} className="choice-button change-plan">
                        Mudar Plano de Voo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChoiceModal;