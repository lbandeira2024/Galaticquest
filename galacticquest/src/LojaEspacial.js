import React, { useState, useRef, useLayoutEffect } from 'react';
import './LojaEspacial.css';
import { useAudio } from './AudioManager';
import { useAuth } from './AuthContext';
import { useConfig } from './ConfigContext';
import { useSpaceCoins } from './SpaceCoinsContext';

const itemsForSale = [
    {
        id: 'o2_generator',
        name: 'Gerador de Oxigênio',
        description: 'Mantém a atmosfera da nave estável por longos períodos. Aumenta 100% o oxigênio.',
        price: 120000,
        image: '/images/oxigenio.png',
        type: 'mantimentos',
        telemetryField: 'atmosphere.o2',
        value: 100,
    },
    {
        id: 'fuel_tank',
        name: 'Tanque de Combustível',
        description: 'Armazenamento adicional para combustível de longa duração. Aumenta 100% da propulsão nuclear.',
        price: 150000,
        image: '/images/tanque.png',
        type: 'mantimentos',
        telemetryField: 'propulsion.fuel',
        value: 100,
    },
    {
        id: 'provisions',
        name: 'Provisões da Tripulação',
        description: 'Ração especial e lazer. Recupera 10% de Produtividade e 10% de Engajamento.',
        price: 15000,
        image: '/images/Provisoes.png',
        type: 'mantimentos',
        effects: [
            { field: 'productivity', value: 10 },
            { field: 'engagement', value: 10 }
        ]
    },
    // --- DESAFIO SKYLAB ---
    {
        id: 'challenge_skylab',
        name: 'Estação Skylab',
        description: 'Nesta curiosa Estação Skylab uma grande festa está ocorrendo. Ela é chamada de Porto da alegria pela maioria dos astronautas. Esta estação pode ser uma boa opção para aqueles que gostam de arte e cultura. Ela permite entre outras coisas, que astronautas se alimentem de significados para suas existências, e incentivar a jornada. Nela se ouve, se canta e se expressa naturalmente como a alma pede. E dizem que as boas energias se renovam para quem vai depois continuar a missão. Lembre-se: descansar e divertir-se é tão importante quanto trabalhar. Vocês folgarão para esta festa?',
        price: 0,
        image: '/images/DesafioSkylab.png',
        type: 'desafios',
        risk: 'low',
        reward: 'morale_boost',
        effects: [
            { field: 'engagement', value: 15 },
            { field: 'productivity', value: 10 },
            { field: 'interdependence', value: 10 }
        ]
    },
    // --- DESAFIO SALYUT ---
    {
        id: 'challenge_salyut',
        name: 'Estação Salyut',
        description: `Nesta Estação Espacial da Salyut, entre outras coisas ultra modernas que ela possui, podemos nos familiarizar também com a gastronomia regional. Os astronautas podem se deliciar com a comida de seu país de origem, para que consigam preservar os costumes da boa culinária.

Imaginem pratos da Rússia, China, Brasil, EUA, Espanha, Grécia, Canadá, Alemanha, Israel, França, Itália, República Tcheca, Romênia, Japão, Países Árabes e muitos outros.

Pousem aqui a sua espaçonave e invistam nesta paixão que é a gula. A boa gastronomia faz parte da preservação de nossa memória afetiva.

Aliás, em tempos de gastronomia, qual é mesmo sua comida favorita?`,
        price: 0,
        image: '/images/imagem-desafio-saylut.png',
        type: 'desafios',
        risk: 'low',
        reward: 'gastronomy_boost',
        effects: [
            { field: 'engagement', value: 10 },
            { field: 'productivity', value: 5 },
            { field: 'interdependence', value: 10 }
        ]
    },
    // --- DESAFIO TIANGONG ---
    {
        id: 'challenge_tiangong',
        name: 'Estação Tiangong',
        description: `Às vezes, nos sentimos perdidos, sedentos de uma orientação que pode envolver aspectos profissionais e pessoais.

Quando estas questões nos afligem profundamente, e que nem sempre nosso líder dá conta poderíamos falar com um coach ou mentor nesta Estação Espacial de Tiangong, para que ele nos ajude a enxergá-las na jornada e, então, nos apoie a trilhar um caminho. Que tal?`,
        price: 0,
        image: '/images/imagem-desafio-Tiangong.png',
        type: 'desafios',
        risk: 'low',
        reward: 'mentorship_boost',
        effects: [
            { field: 'engagement', value: 15 },
            { field: 'productivity', value: 15 },
            { field: 'interdependence', value: 15 }
        ]
    },
    // --- DESAFIO BOCTOK ---
    {
        id: 'challenge_boctok',
        name: 'Estação Boctok',
        description: `Em uma parada na Estação Boctok, a equipe já pode contar com um time de astronautas-especialistas, que trabalha na reutilização de foguetes e naves menores de acoplamento.

O time local quer nos presentar com uma demonstração de um software de regulagem energética extensivo, que contribui para a economia da energia circulante em todos os compartimentos e com mais autonomia.

Nos disseram que a demonstração-teste e a aquisição do software nos dá um aumento das reservas de energia.`,
        price: 30000,
        image: '/images/imagem-desafio-Boctok.png',
        type: 'desafios',
        risk: 'medium',
        reward: 'energy_boost',
        effects: [
            { field: 'stability', value: -15 },
            { field: 'nuclearPropulsion', value: 25 }
        ]
    },
    // --- DESAFIO MOL ---
    {
        id: 'challenge_mol',
        name: 'Estação MOL',
        description: `Nesta Estação de Mol que é vista como a do saber e da aprendizagem contínua, os astronautas realizam treinamentos técnicos e comportamentais para melhorar a performance, e para que tenham seus repertórios aprimorados para enfrentarem os desafios inerentes a exploração espacial.

Há muitas reflexões do líder caminhante nesta fascinante estação, além de conviver com tecnologias avançadas de ensino para se crescer.

Com um pequeno desvio de rota, podemos avançar nossos conhecimentos e realizarmos programas de ensino.`,
        price: 45000,
        image: '/images/imagem-desafio-mol.png',
        type: 'desafios',
        risk: 'medium',
        reward: 'knowledge_boost',
        effects: [
            { field: 'nuclearPropulsion', value: -20 },
            { field: 'productivity', value: 15 },
            { field: 'engagement', value: 15 },
            { field: 'interdependence', value: 15 }
        ]
    },
    // --- DESAFIO DELFOS ---
    {
        id: 'challenge_delfos',
        name: 'Estação Delfos',
        description: `Você chegou na Estação de Delfos que muitos a chamam de a Estação da família e da amizade ou do afago virtual, porque é nele que através da tecnologia 6D, com alguns recursos de holografia de última geração, podemos conviver com pessoas queridas de nossas vidas como se estivessem ao nosso lado.

Nela as pessoas falam, se olham, riem e se alimentam de vínculos duradouros e sensíveis, espantando de vez a síndrome da solidão espacial.

Agora, é importante observar o uso destes equipamentos em que se gasta muita energia para usá-los.`,
        price: 0,
        image: '/images/imagem-desafio-delfos.png',
        type: 'desafios',
        risk: 'low',
        reward: 'connection_boost',
        effects: [
            { field: 'nuclearPropulsion', value: -25 },
            { field: 'engagement', value: 12 },
            { field: 'productivity', value: 10 },
            { field: 'interdependence', value: 8 }
        ]
    },
    // --- DESAFIO ALMAZ ---
    {
        id: 'challenge_almaz',
        name: 'Estação Almaz',
        description: `Na Estação Espacial de Almaz que atracamos, o Centro de Saúde do  Astronauta nos ofereceu amostras de suplementos especiais de última geração que combatem os efeitos adversos da prolongada estadia no espaço.

Eles mantém imune o corpo do astronauta diante de reações a certos objetos estranhos e outros gases naturais, antes considerados letais.

A amostra equivale a 5% de nossas reservas alimentares, mas se quisermos levar o pacote integral nossas reservas aumentarão quatro vezes.`,
        price: 30000,
        image: '/images/imagem-desafio-almaz.png',
        type: 'desafios',
        risk: 'medium',
        reward: 'health_boost',
        effects: [
            { field: 'productivity', value: 30 }
        ]
    }
];

const StoreItem = ({ item, spaceCoins, onTransaction, isChallengeMode, isAccepted }) => {
    const descriptionRef = useRef(null);
    const [showArrows, setShowArrows] = useState(false);

    useLayoutEffect(() => {
        if (isChallengeMode && descriptionRef.current) {
            const { scrollHeight, clientHeight } = descriptionRef.current;
            if (scrollHeight > clientHeight + 1) {
                setShowArrows(true);
            } else {
                setShowArrows(false);
            }
        } else {
            setShowArrows(false);
        }
    }, [isChallengeMode, item.description]);

    const handleScroll = (direction) => {
        if (descriptionRef.current) {
            const scrollAmount = 60;
            descriptionRef.current.scrollBy({
                top: direction === 'up' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    let buttonText;
    if (isAccepted) {
        buttonText = 'DESAFIO ACEITO';
    } else if (isChallengeMode) {
        buttonText = 'ACEITAR DESAFIO';
    } else {
        buttonText = 'COMPRAR';
    }

    return (
        <div className="store-item">
            <img src={item.image} alt={item.name} className="store-item-image" />
            <div className="store-item-details">
                <div className="store-item-name">{item.name}</div>
                <div className="description-wrapper">
                    {showArrows && <div className="scroll-arrow arrow-up" onClick={() => handleScroll('up')}></div>}
                    <div className="store-item-description" ref={descriptionRef} style={{ whiteSpace: 'pre-wrap' }}>
                        {item.description}
                    </div>
                    {showArrows && <div className="scroll-arrow arrow-down" onClick={() => handleScroll('down')}></div>}
                </div>
                {!isChallengeMode && <div className="store-item-price">{item.price.toLocaleString('pt-BR')} SC</div>}
            </div>

            <button
                className={`buy-button ${isChallengeMode ? 'challenge-button' : ''}`}
                onClick={() => onTransaction(item)}
                disabled={isAccepted || (!isChallengeMode && (spaceCoins || 0) < item.price)}
            >
                {buttonText}
            </button>
        </div>
    );
};

const LojaEspacial = ({
    onClose,
    onSeguirPlano,
    onMudarRota,
    isMainDisplayModal,
    onChallengeAccepted,
    currentStation,
    hasRoute // Removido o default value "true"
}) => {
    const { playSound } = useAudio();
    const { user, login } = useAuth();
    const { apiBaseUrl } = useConfig();
    const { spaceCoins, setSpaceCoins, syncSpaceCoins } = useSpaceCoins();
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('mantimentos');
    const [acceptedChallenges, setAcceptedChallenges] = useState([]);

    const API_BASE_URL = apiBaseUrl;
    const userId = user?._id;

    // Normaliza o nome da estação atual para comparar com o ID dos desafios
    const normalizedStation = (currentStation || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');

    // Filtra itens: mantimentos normais OU desafios que correspondem à estação atual
    const filteredItems = itemsForSale.filter(item => {
        if (item.type !== activeTab) return false;

        if (activeTab === 'desafios') {
            // Verifica se o ID do desafio contém o nome da estação atual
            return item.id.includes(normalizedStation);
        }

        return true;
    });

    const isChallengeMode = activeTab === 'desafios';

    const handleTransaction = async (item) => {
        // --- Lógica para DESAFIOS ---
        if (item.type === 'desafios') {

            if (item.price > 0) {
                const currentBalance = spaceCoins || 0;
                let deduction = item.price;
                if (currentBalance < item.price) {
                    deduction = currentBalance;
                }
                setSpaceCoins(prev => (prev || 0) - deduction);
            }

            playSound('/sounds/ui-confirm.mp3');

            if (onChallengeAccepted) {
                onChallengeAccepted(item);
            }

            setMessage(`Situação "${item.name}" aceita! Verifique o painel.`);
            setAcceptedChallenges(prev => [...prev, item.id]);
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        // --- Lógica para COMPRA (MANTIMENTOS) ---
        playSound('/sounds/ui-purchase.mp3');
        if ((spaceCoins || 0) < item.price) {
            setMessage('SpaceCoins insuficientes!');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        try {
            const itemEffects = item.effects ? item.effects : { field: item.telemetryField, value: item.value };
            const response = await fetch(`${API_BASE_URL}/${userId}/comprar-item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: item.id, itemName: item.name, itemType: item.type, price: item.price, effects: itemEffects, image: item.image }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Erro no servidor.");

            if (data.spaceCoins !== undefined) syncSpaceCoins(data.spaceCoins);
            else if (data.newBalance !== undefined) syncSpaceCoins(data.newBalance);
            else setSpaceCoins(prev => (prev || 0) - item.price);

            if (data.user) login(data.user);
            setMessage(`Compra efetuada! ${item.name} enviado ao Inventário.`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Erro ao processar a compra.');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className={`store-modal-overlay ${isMainDisplayModal ? 'main-display-overlay' : ''}`}>
            <div className="store-modal-container">
                <button className="close-store-button" onClick={onClose}>×</button>
                <div className="store-header"><h2>LOJA ESPACIAL</h2></div>
                <div className="store-tabs">
                    <button className={`tab-button ${activeTab === 'mantimentos' ? 'active' : ''}`} onClick={() => setActiveTab('mantimentos')}>MANTIMENTOS</button>
                    <button className={`tab-button ${activeTab === 'desafios' ? 'active' : ''}`} onClick={() => setActiveTab('desafios')}>DESAFIOS / SITUAÇÕES</button>
                </div>
                {message && <div className="store-message">{message}</div>}
                <div className={`store-grid ${isChallengeMode ? 'challenges-mode' : ''}`}>
                    {filteredItems.map((item) => (
                        <StoreItem
                            key={item.id}
                            item={item}
                            spaceCoins={spaceCoins}
                            onTransaction={handleTransaction}
                            isChallengeMode={isChallengeMode}
                            isAccepted={acceptedChallenges.includes(item.id)}
                        />
                    ))}
                    {filteredItems.length === 0 && <p className="empty-store-message">Nenhum item disponível nesta categoria.</p>}
                </div>
                {isMainDisplayModal && (
                    <div className="store-action-buttons">
                        <button className="buy-button action-button-mudar" onClick={() => { onClose(); onMudarRota(); }}>MUDAR ROTA</button>
                        {/* O botão só aparece se hasRoute for passado como true pelo componente pai */}
                        {hasRoute && (
                            <button className="buy-button action-button-seguir" onClick={() => { onClose(); onSeguirPlano(); }}>SEGUIR PLANO</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LojaEspacial;