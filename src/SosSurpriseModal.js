import React from 'react';
import './LojaEspacial.css'; // Reutiliza o CSS da loja para consistência visual

const SosSurpriseModal = ({ event, onClose, onMudarRota, onSeguirPlano }) => {
    if (!event) return null;

    // Determina a cor baseada no tipo de evento para feedback visual
    const getRiskColor = (id) => {
        switch (id) {
            case 1: return '#ff4444'; // Piratas (Vermelho)
            case 2: return '#ffaa00'; // Astronauta (Laranja)
            case 3: return '#00ccff'; // Nave Destruída (Azul)
            default: return '#aaaaaa'; // Fantasma (Cinza)
        }
    };

    const riskColor = getRiskColor(event.id);

    return (
        <div className="store-modal-overlay main-display-overlay">
            <div className="store-modal-container" style={{ borderColor: riskColor, boxShadow: `0 0 30px ${riskColor}66` }}>

                {/* Header diferenciado para SOS */}
                <div className="store-header" style={{ borderBottomColor: `${riskColor}4D` }}>
                    <h2 style={{ color: riskColor, textShadow: `0 0 8px ${riskColor}80` }}>
                        RELATÓRIO DE S.O.S
                    </h2>
                </div>

                {/* Área central reutilizando o grid da loja para centralizar o item */}
                <div className="store-grid challenges-mode" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <div className="store-item" style={{ width: '100%', maxWidth: '800px', borderColor: riskColor, flexDirection: 'row', display: 'flex', gap: '20px', alignItems: 'center' }}>

                        {/* Imagem do Evento */}
                        <img
                            src={event.image}
                            alt={event.name}
                            className="store-item-image"
                            style={{ width: '200px', height: '200px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
                            onError={(e) => { e.target.src = '/images/ACEE.png'; }} // Fallback
                        />

                        <div className="store-item-details" style={{ textAlign: 'left' }}>
                            <div className="store-item-name" style={{ color: riskColor, fontSize: '2rem', marginBottom: '15px' }}>
                                {event.name}
                            </div>

                            <div className="description-wrapper">
                                <div className="store-item-description" style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#eee' }}>
                                    {event.description}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="store-action-buttons" style={{ position: 'relative', justifyContent: 'center', marginTop: '20px', bottom: 'auto', right: 'auto' }}>
                    <button
                        className="buy-button action-button-mudar"
                        onClick={onMudarRota}
                        style={{ padding: '15px 30px', fontSize: '1.1rem' }}
                    >
                        MUDAR ROTA
                    </button>

                    <button
                        className="buy-button action-button-seguir"
                        onClick={onSeguirPlano}
                        style={{ padding: '15px 30px', fontSize: '1.1rem' }}
                    >
                        SEGUIR PLANO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SosSurpriseModal;