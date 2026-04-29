import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAudio } from './AudioManager';
import { useConfig } from './ConfigContext';
import './GeneralReport.css';

// --- LISTA DE ESTAÇÕES (Baseada no seu SpaceView.js) ---
const STATIONS_LIST = ['acee', 'almaz', 'mol', 'tiangong', 'skylab', 'salyut', 'delfos', 'boctok'];

const GeneralReport = () => {
    const { gameNumber } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    // Contextos e Estados
    const { apiBaseUrl } = useConfig();
    const { musicAudioRef } = useAudio();
    const [isMuted, setIsMuted] = useState(musicAudioRef.current ? musicAudioRef.current.muted : false);
    const [isPaused, setIsPaused] = useState(false);
    const [activeTab, setActiveTab] = useState('geral');
    const pauseChannel = useRef(new BroadcastChannel('pause_channel'));

    // ESTADO: Armazena os objetos completos das equipes
    const [groups, setGroups] = useState([]);

    // Estilo solicitado: Negrito e fonte 30% maior
    // (O cursor help agora fica no tooltip-container)
    const highlightedStyle = {
        fontWeight: 'bold',
        fontSize: '1.3em'
    };

    // --- FUNÇÕES DE CONTROLE ---
    const handleMuteToggle = () => {
        if (musicAudioRef.current) {
            const newMutedState = !musicAudioRef.current.muted;
            musicAudioRef.current.muted = newMutedState;
            setIsMuted(newMutedState);
        }
    };

    const handlePauseToggle = async () => {
        const newPauseState = !isPaused;
        const actionText = newPauseState ? "PAUSAR" : "RETOMAR";

        if (!window.confirm(`Tem certeza que deseja ${actionText} o GAME ${gameNumber} para todos os jogadores?`)) {
            return;
        }

        if (!apiBaseUrl) {
            alert('Erro: URL da API não configurada.');
            return;
        }

        try {
            const response = await axios.post(`${apiBaseUrl}/games/${gameNumber}/toggle-pause`, {
                isPaused: newPauseState
            });

            setIsPaused(newPauseState);
            alert(response.data.message || `Jogo ${newPauseState ? 'pausado' : 'retomado'} com sucesso.`);

            pauseChannel.current.postMessage({
                gameNumber: Number(gameNumber),
                isPaused: newPauseState,
                controllerId: newPauseState ? 'ADMIN_PAUSE' : null
            });

        } catch (error) {
            const errorMessage = error.response?.data?.message || `Erro ao ${actionText.toLowerCase()} o jogo.`;
            alert(errorMessage);
        }
    };

    useEffect(() => {
        const channel = pauseChannel.current;
        const handleChannelMessage = (event) => {
            if (typeof event.data.isPaused === 'boolean' && event.data.gameNumber !== undefined) {
                if (event.data.gameNumber == gameNumber) {
                    setIsPaused(event.data.isPaused);
                }
            }
        };
        channel.addEventListener('message', handleChannelMessage);
        return () => channel.removeEventListener('message', handleChannelMessage);
    }, [gameNumber]);

    useEffect(() => {
        const fetchInitialPauseState = async () => {
            if (!apiBaseUrl) return;
            try {
                const response = await axios.get(`${apiBaseUrl}/games/${gameNumber}/config`);
                if (response.data && typeof response.data.isPaused === 'boolean') {
                    setIsPaused(response.data.isPaused);
                }
            } catch (error) {
                console.error("Erro ao buscar estado de pause:", error);
            }
        };
        fetchInitialPauseState();
    }, [apiBaseUrl, gameNumber]);

    // --- BUSCA DINÂMICA: Dados dos Grupos (Nomes e Saldo) ---
    useEffect(() => {
        const fetchGroupsData = async () => {
            if (!apiBaseUrl || !gameNumber) return;
            try {
                const response = await axios.get(`${apiBaseUrl}/games/${gameNumber}/groups-details`); //
                if (response.data && response.data.success) {
                    setGroups(response.data.groups);
                }
            } catch (error) {
                console.error("Erro ao buscar dados dos grupos:", error);
            }
        };
        fetchGroupsData();
    }, [apiBaseUrl, gameNumber]);

    // Helpers para exibição segura de dados
    const getTeamName = (index) => groups[index]?.teamName || `Equipe ${index + 1}`;

    const getTeamCoins = (index) => {
        const coins = groups[index]?.spaceCoins || 0; //
        // Formata para milhões (MM) se necessário ou exibe o valor bruto
        return `${(coins / 1000000).toFixed(1)} MM`;
    };

    // --- NOVA FUNÇÃO: Calcula corpos celestes em comum e prepara o tooltip ---
    const getCommonCelestialBodiesData = () => {
        if (!groups || groups.length === 0) {
            return { countStr: "00", tooltip: "Nenhum corpo celeste comum visitado." };
        }

        // Mapeamento para guardar o nome original (ex: "Marte" em vez de "marte")
        const originalNamesMap = {};

        // Extrai o histórico deduzido para cada grupo
        const allGroupsVisited = groups.map(g => {
            const rota = g.rotaPlanejada || [];
            const indexAtual = g.routeIndex || 0;

            // Pega os locais desde o início da rota até o ponto atual
            const locaisVisitados = rota.slice(0, indexAtual + 1);

            return locaisVisitados
                .map(local => {
                    const rawName = local.name || '';
                    const nomeLimpo = rawName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');

                    // Salva o nome original caso ainda não exista no mapa
                    if (nomeLimpo && !originalNamesMap[nomeLimpo]) {
                        originalNamesMap[nomeLimpo] = rawName;
                    }
                    return nomeLimpo;
                })
                .filter(nomeLimpo => {
                    // Ignora estações, vazio e também a TERRA
                    return nomeLimpo !== '' && nomeLimpo !== 'terra' && !STATIONS_LIST.includes(nomeLimpo);
                });
        });

        // Verificação de segurança: se algum grupo não visitou nada (ou a lista ficou vazia)
        if (allGroupsVisited.length === 0 || allGroupsVisited.some(arr => arr.length === 0)) {
            return { countStr: "00", tooltip: "Nenhum corpo celeste comum visitado." };
        }

        // Achar a intersecção: nomes que aparecem na rota percorrida de TODOS os grupos
        const commonOnes = allGroupsVisited.reduce((acc, currentList) => {
            return acc.filter(nome => currentList.includes(nome));
        });

        // Garante que não conte planetas repetidos
        const uniqueCommonOnes = [...new Set(commonOnes)];

        // Formata as saídas
        const countStr = uniqueCommonOnes.length.toString().padStart(2, '0');

        // Monta a string do Tooltip pegando os nomes originais de volta
        const namesList = uniqueCommonOnes.map(limpo => originalNamesMap[limpo]).join(', ');
        const tooltip = uniqueCommonOnes.length > 0
            ? `Corpos Visitados: ${namesList}`
            : "Nenhum corpo celeste comum visitado.";

        return { countStr, tooltip };
    };

    // --- ANIMAÇÃO DE FUNDO ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let stars = Array.from({ length: 200 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            radius: Math.random() * 1.5,
            speed: Math.random() * 0.3 + 0.1
        }));
        const animateStars = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            stars.forEach(star => {
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
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        animateStars();
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Chama a função uma vez por renderização para usar na tabela
    const commonBodiesData = getCommonCelestialBodiesData();

    return (
        <div className="report-body">
            <canvas ref={canvasRef} className="cosmic-bg"></canvas>
            <div className="cyber-container">
                <header className="admin-header">
                    <div className="header-content">
                        <img src="/images/ACEE.png" alt="ACEE Logo" className="admin-logo" />
                        <div>
                            <h1>Painel Administrativo</h1>
                            <p className="welcome-message">
                                <span className="user-name">Relatórios do Jogo</span>
                            </p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button
                            onClick={handleMuteToggle}
                            className={`audio-toggle-button ${isMuted ? 'muted' : 'active'}`}
                            title={isMuted ? "Desmutar Áudio" : "Mutar Áudio"}
                        >
                            {isMuted ? '🔇' : '🔊'}
                        </button>
                        <button
                            onClick={handlePauseToggle}
                            className={`audio-toggle-button pause-toggle-button ${isPaused ? 'paused' : 'active'}`}
                            title={isPaused ? "Retomar Jogo" : "Pausar Jogo"}
                        >
                            {isPaused ? '▶️' : '⏸️'}
                        </button>
                        <button onClick={() => navigate(-1)} className="logout-button">Voltar</button>
                        <button onClick={() => navigate('/')} className="logout-button">Sair</button>
                    </div>
                </header>

                <main className="neon-panel-wrapper">
                    <h2 className="panel-main-title">
                        {activeTab === 'geral' ? 'DESEMPENHO DAS EQUIPES' : 'RANKING DO JOGO'} - GAME {gameNumber || ''}
                    </h2>

                    <div className="rules-layout-grid">
                        <aside className="action-sidebar">
                            <button
                                className={`action-tab-btn ${activeTab === 'geral' ? 'active-neon' : ''}`}
                                onClick={() => setActiveTab('geral')}
                            >
                                VISÃO GERAL
                            </button>
                            <button
                                className={`action-tab-btn ${activeTab === 'ranking' ? 'active-neon' : ''}`}
                                onClick={() => setActiveTab('ranking')}
                            >
                                RANKING
                            </button>
                        </aside>

                        <section className="config-quadrants">
                            {activeTab === 'geral' ? (
                                <div className="table-wrapper">
                                    <table className="score-table">
                                        <thead>
                                            <tr>
                                                <th>Parâmetros de<br />Jogabilidade:</th>
                                                <th>{getTeamName(0)}</th>
                                                <th>{getTeamName(1)}</th>
                                                <th>{getTeamName(2)}</th>
                                                <th>{getTeamName(3)}</th>
                                                <th>{getTeamName(4)}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Bloco I: Número de Corpos Celestes Conquistados com Custom Tooltip Cyber/Neon */}
                                            <tr className="row-green">
                                                <td className="row-header">
                                                    <strong>I- Número de Corpos<br />Celestes<br />Conquistados</strong>
                                                    <div className="red-dot"></div>
                                                    <small>Cases comuns<br />aos subgrupos</small>
                                                </td>
                                                <td style={highlightedStyle}>
                                                    <div className="cyber-tooltip-container">
                                                        {commonBodiesData.countStr}
                                                        <span className="cyber-tooltip-text">{commonBodiesData.tooltip}</span>
                                                    </div>
                                                </td>
                                                <td style={highlightedStyle}>
                                                    <div className="cyber-tooltip-container">
                                                        {commonBodiesData.countStr}
                                                        <span className="cyber-tooltip-text">{commonBodiesData.tooltip}</span>
                                                    </div>
                                                </td>
                                                <td style={highlightedStyle}>
                                                    <div className="cyber-tooltip-container">
                                                        {commonBodiesData.countStr}
                                                        <span className="cyber-tooltip-text">{commonBodiesData.tooltip}</span>
                                                    </div>
                                                </td>
                                                <td style={highlightedStyle}>
                                                    <div className="cyber-tooltip-container">
                                                        {commonBodiesData.countStr}
                                                        <span className="cyber-tooltip-text">{commonBodiesData.tooltip}</span>
                                                    </div>
                                                </td>
                                                <td style={highlightedStyle}>
                                                    <div className="cyber-tooltip-container">
                                                        {commonBodiesData.countStr}
                                                        <span className="cyber-tooltip-text">{commonBodiesData.tooltip}</span>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Bloco II: Fluxo de Caixa */}
                                            <tr className="row-orange">
                                                <td className="row-header">
                                                    <strong>II- Fluxo de Caixa<br /><small>(MM Spacecoin)</small></strong>
                                                </td>
                                                <td style={highlightedStyle}>{getTeamCoins(0)}</td>
                                                <td style={highlightedStyle}>{getTeamCoins(1)}</td>
                                                <td style={highlightedStyle}>{getTeamCoins(2)}</td>
                                                <td style={highlightedStyle}>{getTeamCoins(3)}</td>
                                                <td style={highlightedStyle}>{getTeamCoins(4)}</td>
                                            </tr>

                                            {/* Bloco III: Virtus */}
                                            <tr className="row-yellow">
                                                <td rowSpan="4" className="row-header">
                                                    <strong>III- Virtus – Índice de<br />Virtudes Humanas<br />Aplicado à Liderança<br /></strong>
                                                    <small>(Variação: 0,0 a 1,0)</small>
                                                </td>
                                                <td>0,0</td><td>0,0</td><td>0,0</td><td>0,0</td><td>0,0</td>
                                            </tr>
                                            <tr className="row-yellow"><td>0,0</td><td>0,0</td><td>0,0</td><td>0,0</td><td>0,0</td></tr>
                                            <tr className="row-yellow"><td>0,0</td><td>0,0</td><td>0,0</td><td>0,0</td><td>0,0</td></tr>
                                            <tr className="row-yellow bold-row"><td>0,0</td><td>0,0</td><td>0,0</td><td>0,0</td><td>0,0</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="cyber-card" style={{ textAlign: 'center', padding: '50px' }}>
                                    <h3 className="card-title">RANKING GLOBAL</h3>
                                    <p style={{ color: '#fff' }}>O processamento do Ranking das equipes está sendo calculado.</p>
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default GeneralReport;