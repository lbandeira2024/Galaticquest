// CompraDeMaterial.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAudio } from './AudioManager';
import { useAuth } from './AuthContext';
import { useConfig } from './ConfigContext';
import './CompraDeMaterial.css';

const CompraDeMaterial = () => {
    // 1. Configuração da API via Contexto
    const { apiBaseUrl } = useConfig();
    const API_BASE_URL = apiBaseUrl;

    const { user, login } = useAuth();
    const navigate = useNavigate();
    const { playSound } = useAudio();
    const canvasRef = useRef(null);

    // 2. Estados Iniciais com verificação de segurança
    const [spaceCoins, setSpaceCoins] = useState(user?.grupo?.spaceCoins || 0);
    const [terabytes, setTerabytes] = useState(user?.grupo?.terabytes || 0);
    const [inventory, setInventory] = useState(user?.grupo?.inventory || []);
    const [personalInventory, setPersonalInventory] = useState(user?.grupo?.personalInventory || []);

    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
    const [selectedPersonalItem, setSelectedPersonalItem] = useState(null);
    const [selectedPersonalInventoryItem, setSelectedPersonalInventoryItem] = useState(null);
    const [activeTab, setActiveTab] = useState('shop');

    // 3. Lista de Itens
    const itemsForSale = [
        { id: 1, name: "Reator de Fusão", image: "/images/reator.png", price: 250000, description: "Fornece energia limpa e eficiente para sistemas críticos da nave." },
        { id: 2, name: "Tanque de Combustível", image: "/images/tanque.png", price: 150000, description: "Armazenamento adicional para combustível de longa duração." },
        { id: 3, name: "Gerador de Oxigênio", image: "/images/oxigenio.png", price: 120000, description: "Mantém a atmosfera da nave estável por longos períodos." },
        { id: 4, name: "Câmaras Criogênicas", image: "/images/camara.png", price: 300000, description: "Preserva alimentos e suprimentos médicos por anos." },
        { id: 5, name: "Escudos Defensivos", image: "/images/escudo.png", price: 220000, description: "Proteção contra radiação e micrometeoritos." },
        { id: 6, name: "Drone de Reparo", image: "/images/drone.png", price: 175000, description: "Realiza reparos automáticos em áreas danificadas." },
    ];

    const personalItems = [
        { id: 7, name: "Acervo de fotos e vídeos", image: "/images/itensPessoais/fotos.png", description: "Memórias preciosas de família e amigos para sua jornada. (Meta Verso)", size: 15000 },
        { id: 8, name: "Livros físicos e digitais", image: "/images/itensPessoais/livros.png", description: "Conhecimento técnico e literatura para momentos de descanso.", size: 20000 },
        { id: 9, name: "Natureza e galáxias", image: "/images/itensPessoais/natureza.png", description: "Experiências imersivas da natureza e universo em imagens e sons. (Meta Verso)", size: 25000 },
        { id: 10, name: "Talismã", image: "/images/itensPessoais/talisma.png", description: "Objeto pessoal de significado especial para proteção.", size: 100 },
        { id: 11, name: "SpotSpace Music", image: "/images/itensPessoais/musica.png", description: "Coleção pessoal de músicas para todas as ocasiões.", size: 10000 },
        { id: 12, name: "Fauna & Flora", image: "/images/itensPessoais/animais.png", description: "Animais em seus habitats naturais para estudo e contemplação. (Meta Verso)", size: 18000 },
        { id: 13, name: "Diálogos culturais", image: "/images/itensPessoais/dialogos.png", description: "Interações enriquecedoras com diversas culturas (metaverso).", size: 12000 }
    ];

    // 4. Efeito para carregar dados do usuário
    useEffect(() => {
        if (user?.grupo) {
            setSpaceCoins(user.grupo.spaceCoins || 0);
            setTerabytes(user.grupo.terabytes || 0);
            setInventory(user.grupo.inventory || []);
            setPersonalInventory(user.grupo.personalInventory || []);
        }
    }, [user]);

    // 5. Função de Som Segura
    const safePlaySound = (path) => {
        try {
            playSound(path);
        } catch (error) {
            console.warn(`Áudio não reproduzido (${path}):`, error);
        }
    };

    // 6. HANDLERS DE AÇÃO

    // --- COMPRA DE EQUIPAMENTOS ---
    const handlePurchase = async () => {
        // CORREÇÃO: Uso de Number() para garantir comparação numérica correta
        if (selectedItem && Number(spaceCoins) >= selectedItem.price && inventory.length < 10) {
            safePlaySound("/sounds/03.system-selection.mp3");

            try {
                // Chama a rota específica de compra no servidor
                const response = await axios.post(`${API_BASE_URL}/${user._id}/comprar-item`, {
                    itemId: selectedItem.id,
                    itemName: selectedItem.name,
                    itemType: 'equipment',
                    price: selectedItem.price,
                    effects: {},
                    image: selectedItem.image
                });

                if (response.data.success) {
                    // Atualiza estado local com a resposta confirmada do servidor
                    setSpaceCoins(response.data.spaceCoins);
                    setInventory(response.data.inventory);
                    setSelectedItem(null);

                    // Atualiza o contexto global do usuário (agora recebendo o grupo corrigido)
                    if (response.data.user) {
                        login(response.data.user);
                    }
                    console.log("✅ Compra realizada com sucesso.");
                } else {
                    // Caso o servidor retorne success: false
                    alert(response.data.message || "Erro ao processar compra.");
                }
            } catch (error) {
                console.error("❌ Erro na compra:", error);
                alert("Erro ao processar compra. Tente novamente.");
            }
        }
    };

    // --- ADIÇÃO DE ITEM PESSOAL ---
    const handleAddPersonalItem = async () => {
        const alreadyHas = personalInventory.some(i => String(i.id) === String(selectedPersonalItem?.id));

        // CORREÇÃO: Uso de Number() para garantir comparação numérica correta
        if (selectedPersonalItem && Number(terabytes) >= selectedPersonalItem.size && !alreadyHas) {
            safePlaySound("/sounds/03.system-selection.mp3");

            try {
                // Chama a rota específica para itens pessoais
                const response = await axios.post(`${API_BASE_URL}/${user._id}/adicionar-item-pessoal`, {
                    item: selectedPersonalItem,
                    cost: selectedPersonalItem.size
                });

                if (response.data.success) {
                    setTerabytes(response.data.terabytes);
                    setPersonalInventory(response.data.personalInventory);
                    setSelectedPersonalItem(null);

                    if (response.data.user) {
                        login(response.data.user);
                    }
                    console.log("✅ Item pessoal adicionado com sucesso.");
                } else {
                    alert(response.data.message || "Erro ao adicionar item.");
                }
            } catch (error) {
                console.error("❌ Erro ao adicionar item pessoal:", error);
                alert("Erro ao adicionar item. Tente novamente.");
            }
        }
    };

    // --- REMOÇÃO DE ITEM (VENDA) ---
    const handleRemoveItem = async () => {
        if (selectedInventoryItem) {
            safePlaySound("/sounds/03.system-selection.mp3");

            const newSpaceCoins = spaceCoins + selectedInventoryItem.price;
            const newInventory = [...inventory];
            newInventory.splice(selectedInventoryItem.index, 1);

            setSpaceCoins(newSpaceCoins);
            setInventory(newInventory);
            setSelectedInventoryItem(null);

            // Sincroniza
            try {
                const response = await axios.post(`${API_BASE_URL}/${user._id}/update-gamedata`, {
                    spaceCoins: newSpaceCoins,
                    inventory: newInventory
                });
                if (response.data.success && response.data.user) {
                    login(response.data.user);
                }
            } catch (error) {
                console.error("Erro ao vender item:", error);
            }
        }
    };

    // --- REMOÇÃO DE ITEM PESSOAL ---
    const handleRemovePersonalItem = async () => {
        if (selectedPersonalInventoryItem) {
            safePlaySound("/sounds/03.system-selection.mp3");

            const newTerabytes = terabytes + selectedPersonalInventoryItem.size;
            const newPersonalInventory = [...personalInventory];
            newPersonalInventory.splice(selectedPersonalInventoryItem.index, 1);

            setTerabytes(newTerabytes);
            setPersonalInventory(newPersonalInventory);
            setSelectedPersonalInventoryItem(null);

            try {
                const response = await axios.post(`${API_BASE_URL}/${user._id}/update-gamedata`, {
                    terabytes: newTerabytes,
                    personalInventory: newPersonalInventory
                });
                if (response.data.success && response.data.user) {
                    login(response.data.user);
                }
            } catch (error) {
                console.error("Erro ao remover item pessoal:", error);
            }
        }
    };

    // 8. Efeito Visual (Estrelas)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const stars = Array.from({ length: 150 }, () => ({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, radius: Math.random() * 1.5, speed: Math.random() * 0.3 + 0.1, }));
        let animationFrameId;
        const animateStars = () => {
            if (!canvasRef.current) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            stars.forEach((star) => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();
                star.y += star.speed;
                if (star.y > window.innerHeight) {
                    star.y = 0;
                    star.x = Math.random() * window.innerWidth;
                }
            });
            animationFrameId = requestAnimationFrame(animateStars);
        };
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        animateStars();
        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // 9. Handlers de Seleção (UI)
    const handleItemSelect = (item) => {
        setSelectedItem(item);
        setSelectedInventoryItem(null);
        safePlaySound("/sounds/02.ui-hover.mp3");
    };
    const handleInventorySelect = (item, index) => {
        setSelectedInventoryItem({ ...item, index });
        setSelectedItem(null);
        safePlaySound("/sounds/02.ui-hover.mp3");
    };
    const handlePersonalItemSelect = (item) => {
        const alreadyHas = personalInventory.some(i => String(i.id) === String(item.id));
        if (terabytes >= item.size && !alreadyHas) {
            setSelectedPersonalItem(item);
            setSelectedPersonalInventoryItem(null);
            safePlaySound("/sounds/02.ui-hover.mp3");
        }
    };
    const handlePersonalInventorySelect = (item, index) => {
        setSelectedPersonalInventoryItem({ ...item, index });
        setSelectedPersonalItem(null);
        safePlaySound("/sounds/02.ui-hover.mp3");
    };

    return (
        <div className="background">
            <canvas ref={canvasRef} className="stars"></canvas>
            <div className="game-info">
                <h3>Compra de Materiais</h3>
                <p>
                    Adquira equipamentos e suprimentos essenciais para sua missão.
                    Gerencie seus recursos com sabedoria - cada decisão afetará sua jornada.
                </p>
                <div className="mission-steps">
                    <div className="step-container step-inactive" onClick={() => navigate('/selecaonave')}>
                        <div className="step-circle">1</div>
                        <div className="step-text">Seleção de Astronave</div>
                    </div>
                    <div className="digital-arrow"></div>
                    <div className="step-container step-inactive" onClick={() => navigate('/selecaoequipe')}>
                        <div className="step-circle">2</div>
                        <div className="step-text">Seleção de Tripulação</div>
                    </div>
                    <div className="digital-arrow"></div>
                    <div className="step-container step-active">
                        <div className="step-circle">3</div>
                        <div className="step-text">Loja & Itens Pessoais</div>
                    </div>
                    <div className="digital-arrow"></div>
                    <div className="step-container step-inactive">
                        <div className="step-circle">4</div>
                        <div className="step-text">Seleção de Rota Estelar</div>
                    </div>
                </div>
            </div>
            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === 'shop' ? 'active' : ''}`}
                    onClick={() => setActiveTab('shop')}
                >
                    Loja de Equipamentos
                </button>
                <button
                    className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                >
                    Itens Pessoais
                </button>
            </div>
            <div className={`purchase-container ${activeTab}`}>
                <div className="items-section">
                    <h2>{activeTab === 'shop' ? 'Equipamentos Disponíveis' : 'Itens Pessoais Disponíveis'}</h2>
                    {activeTab === 'shop' ? (
                        itemsForSale.map((item) => (
                            <div
                                key={item.id}
                                className={`item-option ${selectedItem?.id === item.id ? 'selected' : ''} ${spaceCoins < item.price ? 'disabled' : ''}`}
                                onClick={() => handleItemSelect(item)}
                            >
                                <img src={item.image} alt={item.name} className="item-image" />
                                <div className="item-details">
                                    <div className="item-name">{item.name}</div>
                                    <div className="item-price">{item.price.toLocaleString()} Space Coins</div>
                                    <div className="item-description">{item.description}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        personalItems.map((item) => {
                            const alreadyHas = personalInventory.some(i => String(i.id) === String(item.id));
                            return (
                                <div
                                    key={item.id}
                                    className={`item-option ${selectedPersonalItem?.id === item.id ? 'selected' : ''} 
                                               ${terabytes < item.size || alreadyHas ? 'disabled' : ''}`}
                                    onClick={() => handlePersonalItemSelect(item)}
                                >
                                    <img src={item.image} alt={item.name} className="item-image" />
                                    <div className="item-details">
                                        <div className="item-name">{item.name}</div>
                                        <div className="item-price">{item.size.toLocaleString()} TB</div>
                                        <div className="item-description">{item.description}</div>
                                        {alreadyHas && (
                                            <div className="item-added">✓ Já adicionado</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <div className="inventory-section">
                    <div className="inventory-header">
                        <h2>{activeTab === 'shop' ? `Inventário (${inventory.length}/10)` : 'Itens Selecionados'}</h2>
                        <div className="currency-display">
                            {activeTab === 'shop' ? `${spaceCoins.toLocaleString()} SC` : `${terabytes.toLocaleString()} TB`}
                        </div>
                    </div>
                    <div className="inventory-grid">
                        {activeTab === 'shop' ? (
                            Array.from({ length: 10 }, (_, index) => {
                                const item = inventory[index];
                                return (
                                    <div
                                        key={index}
                                        className={`inventory-item ${!item ? 'empty' : ''} ${selectedInventoryItem?.index === index ? 'selected' : ''}`}
                                        onClick={() => item && handleInventorySelect(item, index)}
                                    >
                                        {item ? (
                                            <>
                                                <img src={item.image} alt={item.name} />
                                                <div className="inventory-item-name">{item.name}</div>
                                                <div className="inventory-item-quantity">{item.price.toLocaleString()} SC</div>
                                            </>
                                        ) : (
                                            <div>Slot vazio</div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            personalInventory.map((item, index) => (
                                <div
                                    key={`${item.id}-${index}`}
                                    className={`inventory-item ${selectedPersonalInventoryItem?.index === index ? 'selected' : ''}`}
                                    onClick={() => handlePersonalInventorySelect(item, index)}
                                >
                                    <img src={item.image} alt={item.name} />
                                    <div className="inventory-item-name">{item.name}</div>
                                    <div className="inventory-item-quantity">{item.size.toLocaleString()} TB</div>
                                </div>
                            ))
                        )}
                    </div>
                    {activeTab === 'personal' && (
                        <div className="storage-info">
                            <div className="storage-stats">
                                <span>Espaço Usado:</span>
                                <span>{(100000 - terabytes).toLocaleString()} TB</span>
                            </div>
                            <div className="storage-stats">
                                <span>Espaço Disponível:</span>
                                <span>{terabytes.toLocaleString()} TB</span>
                            </div>
                        </div>
                    )}
                    <div className="inventory-actions">
                        {activeTab === 'shop' ? (
                            <>
                                <button
                                    className="purchase-button"
                                    onClick={handlePurchase}
                                    disabled={!selectedItem || spaceCoins < selectedItem?.price || inventory.length >= 10}
                                >
                                    {!selectedItem ? 'Selecione um item' :
                                        spaceCoins < selectedItem.price ? 'Fundos insuficientes' :
                                            inventory.length >= 10 ? 'Inventário cheio' : 'Comprar'}
                                </button>
                                <button
                                    className="remove-button"
                                    onClick={handleRemoveItem}
                                    disabled={!selectedInventoryItem}
                                >
                                    {selectedInventoryItem ? 'Vender' : 'Selecione para vender'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="purchase-button"
                                    onClick={handleAddPersonalItem}
                                    disabled={!selectedPersonalItem || terabytes < selectedPersonalItem?.size || personalInventory.some(i => String(i.id) === String(selectedPersonalItem?.id))}
                                >
                                    {!selectedPersonalItem ? 'Selecione um item' :
                                        terabytes < selectedPersonalItem.size ? 'Espaço insuficiente' :
                                            personalInventory.some(i => String(i.id) === String(selectedPersonalItem.id)) ? 'Já adicionado' : 'Adicionar'}
                                </button>
                                <button
                                    className="remove-button"
                                    onClick={handleRemovePersonalItem}
                                    disabled={!selectedPersonalInventoryItem}
                                >
                                    {selectedPersonalInventoryItem ? 'Remover' : 'Selecione para remover'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div style={{ position: 'absolute', bottom: '20px', right: '50%', transform: 'translateX(50%)', zIndex: 10 }}>
                <button
                    onClick={() => navigate("/SelecaoRota")}
                    style={{
                        padding: '15px 30px',
                        background: 'linear-gradient(to right, #ff9800, #ff5722)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 12px rgba(0, 0,0, 0.4)'; }}
                    onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)'; }}
                >
                    Continuar para Seleção de Rota
                </button>
            </div>
        </div>
    );
};

export default CompraDeMaterial;