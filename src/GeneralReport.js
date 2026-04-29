import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAudio } from './AudioManager';
import { useConfig } from './ConfigContext';
import './GeneralReport.css';

const GeneralReport = () => {
    const { gameNumber } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    // Contextos e Estados
    const { apiBaseUrl } = useConfig();
    const { musicAudioRef } = useAudio();
    const [isMuted, setIsMuted] = useState(musicAudioRef.current ? musicAudioRef.current.muted : false);
    const [isPaused, setIsPaused] = useState(false);
    const pauseChannel = useRef(new BroadcastChannel('pause_channel'));

    // ESTADO: Armazena as equipes do jogo atual
    const [teams, setTeams] = useState([]);

    // --- FUNÇÕES DOS BOTÕES DO CABEÇALHO ---
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

            // Notifica as outras abas/jogadores
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

    // Escuta mudanças de Pause de outras abas (ex: do GameConfig)
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

    // Busca o estado inicial de pause ao carregar a página
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

    // --- BUSCA: Nomes das Equipes do Jogo Atual ---
    useEffect(() => {
        const fetchTeams = async () => {
            if (!apiBaseUrl || !gameNumber) return;
            try {
                const response = await axios.get(`${apiBaseUrl}/games/${gameNumber}/groups-details`);
                if (response.data && response.data.success) {
                    // Mapeia apenas os nomes das equipes recebidas da API
                    const teamNames = response.data.groups.map(g => g.teamName);
                    setTeams(teamNames);
                }
            } catch (error) {
                console.error("Erro ao buscar equipes:", error);
            }
        };
        fetchTeams();
    }, [apiBaseUrl, gameNumber]);

    // Função auxiliar para exibir o nome da equipe ou um fallback seguro
    const getTeamName = (index) => {
        return teams[index] || `Equipe ${index + 1}`;
    };
    // ---------------------------------------------------

    // --- ANIMAÇÃO DE ESTRELAS ---
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
                        DESEMPENHO DAS EQUIPES - GAME {gameNumber || ''}
                    </h2>

                    <div className="rules-layout-grid">

                        <aside className="action-sidebar">
                            <button className="action-tab-btn active-neon">
                                VISUALIZAR PONTUAÇÃO
                            </button>
                        </aside>

                        <section className="config-quadrants">
                            <div className="table-wrapper">
                                <table className="score-table">
                                    <thead>
                                        <tr>
                                            <th>Parâmetros de<br />Jogabilidade:</th>
                                            {/* Cabeçalhos populados dinamicamente com os nomes das equipes */}
                                            <th>{getTeamName(0)}</th>
                                            <th>{getTeamName(1)}</th>
                                            <th>{getTeamName(2)}</th>
                                            <th>{getTeamName(3)}</th>
                                            <th>{getTeamName(4)}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="row-green">
                                            <td rowSpan="4" className="row-header">
                                                <strong>I- Número de Corpos<br />Celestes<br />Conquistados</strong>
                                                <div className="red-dot"></div>
                                                <small>Cases comuns<br />aos subgrupos</small>
                                            </td>
                                            <td>00</td><td>00</td><td>00</td><td>00</td><td>00</td>
                                        </tr>
                                        <tr className="row-green"><td>00</td><td>00</td><td>00</td><td>00</td><td>00</td></tr>
                                        <tr className="row-green"><td>00</td><td>00</td><td>00</td><td>00</td><td>00</td></tr>
                                        <tr className="row-green bold-row"><td>00</td><td>00</td><td>00</td><td>00</td><td>00</td></tr>

                                        <tr className="row-orange">
                                            <td rowSpan="4" className="row-header">
                                                <strong>II- Fluxo de Caixa<br /><small>(MM Spacecoin)</small></strong>
                                            </td>
                                            <td>000 MM</td><td>000 MM</td><td>000 MM</td><td>000 MM</td><td>000 MM</td>
                                        </tr>
                                        <tr className="row-orange"><td>000 MM</td><td>000 MM</td><td>000 MM</td><td>000 MM</td><td>000 MM</td></tr>
                                        <tr className="row-orange"><td>000 MM</td><td>000 MM</td><td>000 MM</td><td>000 MM</td><td>000 MM</td></tr>
                                        <tr className="row-orange bold-row"><td>000 MM</td><td>000 MM</td><td>000 MM</td><td>000 MM</td><td>000 MM</td></tr>

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
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default GeneralReport;