import React from 'react';
import './ModalConfirmacaoViagem.css';

// Removido o default "true" de hasRoute. 
// Agora, se hasRoute não for passado, o botão "Seguir Plano" não aparece.
const ModalConfirmacaoViagem = ({ onSeguirPlano, onMudarRota, hasRoute }) => {
    return (
        <div className="modal-confirmacao-overlay">
            <div className="modal-confirmacao-container">
                <h3>Decisão registrada!</h3>
                <p>Vamos continuar a viagem ou alterar o curso?</p>
                <div className="confirmacao-buttons-container">
                    <button className="confirmacao-button mudar-rota" onClick={onMudarRota}>
                        MUDAR ROTA
                    </button>
                    {/* O botão só renderiza se hasRoute for explicitamente true */}
                    {hasRoute && (
                        <button className="confirmacao-button seguir-plano" onClick={onSeguirPlano}>
                            SEGUIR PLANO
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalConfirmacaoViagem;