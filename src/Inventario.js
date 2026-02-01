import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAudio } from './AudioManager';
import './Inventario.css';
import { useAuth } from './AuthContext';
import { useConfig } from './ConfigContext';

const Inventario = ({ onClose, onUpdateTelemetry }) => {
    const { playSound } = useAudio();
    const { user, login } = useAuth();
    const { apiBaseUrl } = useConfig();
    const API_BASE_URL = apiBaseUrl;

    const [inventory, setInventory] = useState([]);
    const [personalItems, setPersonalItems] = useState([]);

    // Estado mantido para lógica interna, mas não será exibido visualmente neste modal
    const [spaceCoins, setSpaceCoins] = useState(0);

    const [activeTab, setActiveTab] = useState('storage');
    const [isLoading, setIsLoading] = useState(true);

    const [cooldowns, setCooldowns] = useState(() => {
        const savedCooldowns = localStorage.getItem('inventoryCooldowns');
        return savedCooldowns ? JSON.parse(savedCooldowns) : {};
    });

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const modalRef = useRef(null);

    useEffect(() => {
        const fetchLatestInventory = async () => {
            if (!user?._id || !API_BASE_URL) return;

            try {
                setIsLoading(true);
                const response = await fetch(`${API_BASE_URL}/${user._id}/game-data?t=${Date.now()}`);
                const data = await response.json();

                if (data.success) {
                    setInventory(data.inventory || []);
                    setPersonalItems(data.personalInventory || []);
                    setSpaceCoins(data.spaceCoins || 0);
                    console.log("📦 Inventário sincronizado. Itens:", data.inventory?.length);
                }
            } catch (error) {
                console.error("Erro ao buscar inventário atualizado:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLatestInventory();
    }, [user, API_BASE_URL]);

    useEffect(() => {
        const initialX = (window.innerWidth - Math.min(950, window.innerWidth * 0.85)) / 2;
        const initialY = (window.innerHeight - (window.innerHeight * 0.85)) / 2;
        setPosition({ x: initialX, y: initialY });
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleMouseDown = (e) => {
        if (modalRef.current) {
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
            setIsDragging(true);
        }
    };

    useEffect(() => {
        localStorage.setItem('inventoryCooldowns', JSON.stringify(cooldowns));
    }, [cooldowns]);

    const handleUseItem = async (index) => {
        const itemToUse = inventory[index];
        const updatedInventory = [...inventory];

        if (itemToUse.quantity && itemToUse.quantity > 1) {
            updatedInventory[index] = { ...itemToUse, quantity: itemToUse.quantity - 1 };
        } else {
            updatedInventory.splice(index, 1);
        }

        setInventory(updatedInventory);

        let updatesForParent = {};
        let currentTelemetry = user?.grupo?.telemetryState || {
            oxygen: 100, nuclearPropulsion: 100, direction: 100,
            stability: 100, productivity: 100, interdependence: 100, engagement: 100
        };
        let newTelemetryDB = { ...currentTelemetry };

        if (itemToUse.image.includes('tanque.png')) {
            updatesForParent.nuclearPropulsion = 100;
            newTelemetryDB.nuclearPropulsion = 100;
            playSound('/sounds/inventory-use.mp3');
        } else if (itemToUse.image.includes('oxigenio.png')) {
            updatesForParent.oxygen = 100;
            newTelemetryDB.oxygen = 100;
            playSound('/sounds/inventory-use.mp3');
        } else if (itemToUse.image.includes('provision.png') || itemToUse.image.includes('Provisoes.png')) {
            // Lógica ajustada para +10 conforme solicitado e compatível com LojaEspacial.js
            const newProd = Math.min(100, (currentTelemetry.productivity || 0) + 10);
            const newEng = Math.min(100, (currentTelemetry.engagement || 0) + 10);

            updatesForParent.productivity = newProd;
            updatesForParent.engagement = newEng;
            newTelemetryDB.productivity = newProd;
            newTelemetryDB.engagement = newEng;
            playSound('/sounds/inventory-use.mp3');
        } else {
            playSound('/sounds/inventory-use.mp3');
        }

        if (onUpdateTelemetry) {
            onUpdateTelemetry(updatesForParent);
        }

        if (!user?._id || !API_BASE_URL) return;

        try {
            const response = await fetch(`${API_BASE_URL}/${user._id}/update-gamedata`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inventory: updatedInventory,
                    telemetryState: newTelemetryDB
                }),
            });
            const data = await response.json();
            if (response.ok && data.user) {
                login(data.user);
            }
        } catch (err) {
            console.error("❌ Erro ao atualizar inventário:", err);
        }
    };

    const handleActivateItem = (index) => {
        playSound('/sounds/inventory-use.mp3');
        const item = personalItems[index];
        setCooldowns(prev => ({ ...prev, [item.id]: Date.now() }));
    };

    const isItemOnCooldown = (itemId) => {
        if (!cooldowns[itemId]) return false;
        const now = Date.now();
        return (now - cooldowns[itemId]) < 600000;
    };

    const getCooldownRemaining = (itemId) => {
        if (!cooldowns[itemId]) return 0;
        const now = Date.now();
        const elapsed = now - cooldowns[itemId];
        const remainingSeconds = Math.max(0, Math.ceil((600000 - elapsed) / 1000));
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleCloseSafe = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
    };

    const modalContent = (
        <div className="inventory-modal-overlay">
            <div
                className="inventory-modal-container"
                ref={modalRef}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="close-inventory-button"
                    onClick={handleCloseSafe}
                    type="button"
                >
                    ×
                </button>

                <div className="inventory-header" onMouseDown={handleMouseDown}>
                    <h2>INVENTÁRIO DA NAVE</h2>

                    <div className="inventory-tabs">
                        <button
                            className={`tab-button ${activeTab === 'storage' ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setActiveTab('storage'); }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            ARMAZENAMENTO
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setActiveTab('personal'); }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            ITENS PESSOAIS
                        </button>
                    </div>
                </div>

                {isLoading && (
                    <div style={{ color: '#ff9800', textAlign: 'center', padding: '20px' }}>
                        Carregando inventário...
                    </div>
                )}

                {!isLoading && activeTab === 'storage' && (
                    <div className="inventory-items-list">
                        {inventory.length > 0 ? (
                            inventory.map((item, index) => (
                                <div key={`storage-${index}`} className="inventory-list-item">
                                    <img src={item.image} alt={item.name} className="inventory-list-image" onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.png'; }} />
                                    <div className="inventory-list-details">
                                        <div className="inventory-list-name">
                                            {item.name} {item.quantity && item.quantity > 1 ? ` (${item.quantity})` : ''}
                                        </div>
                                        <div className="inventory-list-description">{item.description}</div>
                                    </div>
                                    <button className="use-button" onClick={() => handleUseItem(index)}>
                                        USAR
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="empty-inventory-message">Seu armazenamento está vazio</p>
                        )}
                    </div>
                )}
                {!isLoading && activeTab === 'personal' && (
                    <div className="inventory-items-list">
                        {personalItems.length > 0 ? (
                            personalItems.map((item, index) => {
                                const isOnCooldown = isItemOnCooldown(item.id);
                                const cooldownRemaining = getCooldownRemaining(item.id);
                                return (
                                    <div key={`personal-${index}`} className="inventory-list-item">
                                        <img src={item.image} alt={item.name} className="inventory-list-image" onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.png'; }} />
                                        <div className="inventory-list-details">
                                            <div className="inventory-list-name">{item.name}</div>
                                            <div className="inventory-list-description">
                                                {item.description}
                                                {isOnCooldown && (
                                                    <div className="cooldown-text">Recarregando: {cooldownRemaining}</div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            className={`activate-button ${isOnCooldown ? 'disabled' : ''}`}
                                            onClick={() => !isOnCooldown && handleActivateItem(index)}
                                            disabled={isOnCooldown}
                                        >
                                            {isOnCooldown ? `AGUARDE` : `ATIVAR`}
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="empty-inventory-message">Nenhum item pessoal adicionado.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default Inventario;