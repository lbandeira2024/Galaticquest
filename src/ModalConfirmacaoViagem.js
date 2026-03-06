import React from 'react';
import './ModalConfirmacaoViagem.css';

// Agora recebe a propriedade isArrivalWithoutChallenge para saber qual texto mostrar
const ModalConfirmacaoViagem = ({ onSeguirPlano, onMudarRota, hasRoute, isArrivalWithoutChallenge }) => {
    return (
        <div className="modal-confirmacao-overlay">
            <div
                className="modal-confirmacao-container"
                style={isArrivalWithoutChallenge ? { border: '2px solid #ff3333', boxShadow: '0 0 30px rgba(255, 50, 50, 0.5)' } : {}}
            >
                <h3 style={isArrivalWithoutChallenge ? { color: '#ff3333', textShadow: '0 0 15px red' } : {}}>
                    {isArrivalWithoutChallenge ? "ALERTA DO SISTEMA" : "DECISÃO REGISTRADA!"}
                </h3>

                <p style={isArrivalWithoutChallenge ? { color: '#ffaaaa', fontWeight: 'bold' } : {}}>
                    {isArrivalWithoutChallenge
                        ? "Atenção, atenção equipe, Protocolo ACEE-4765 de Defesa... Sair agora desta órbita, seguiremos a rota... Seguiremos viagem!"
                        : "Vamos continuar a viagem ou alterar o curso?"}
                </p>

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