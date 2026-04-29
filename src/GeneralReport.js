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

    const [activeTab, setActiveTab] = useState('pontuacao');

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
    // ---------------------------------------

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

    const handleTagClick = (e) => {
        e.target.classList.toggle('active');
    };

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

                    {/* ADIÇÃO DOS BOTÕES AQUI */}
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
                        {activeTab === 'pontuacao' ? 'DESEMPENHO DAS 5 EQUIPES' : 'REGRAS E PONTUAÇÃO'} - GAME {gameNumber || ''}
                    </h2>

                    <div className="rules-layout-grid">

                        <aside className="action-sidebar">
                            <button
                                className={`action-tab-btn ${activeTab === 'pontuacao' ? 'active-neon' : ''}`}
                                onClick={() => setActiveTab('pontuacao')}
                            >
                                VISUALIZAR PONTUAÇÃO
                            </button>
                            <button
                                className={`action-tab-btn ${activeTab === 'regras' ? 'active-neon' : ''}`}
                                onClick={() => setActiveTab('regras')}
                            >
                                ALTERAR REGRAS
                            </button>
                        </aside>

                        <section className="config-quadrants">

                            {activeTab === 'pontuacao' ? (
                                <div className="table-wrapper">
                                    <table className="score-table">
                                        <thead>
                                            <tr>
                                                <th>Parâmetros de<br />Jogabilidade:</th>
                                                <th>"Guerreiros<br />do Espaço"</th>
                                                <th>"Piratas Sideral"</th>
                                                <th>"Star Group"</th>
                                                <th>"Os Imbatíveis"</th>
                                                <th>"Não Tem<br />Pra Ninguém"</th>
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
                            ) : (
                                <>
                                    <div className="cyber-card">
                                        <h3 className="card-title">BÁSICO</h3>
                                        <div className="form-row">
                                            <label>Modo de jogo</label>
                                            <select className="terminal-dropdown">
                                                <option>Standard</option>
                                                <option>Customizado</option>
                                            </select>
                                        </div>
                                        <div className="form-row">
                                            <label>Dificuldade</label>
                                            <select className="terminal-dropdown" defaultValue="Normal">
                                                <option>Easy</option>
                                                <option>Normal</option>
                                                <option>Hard</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="cyber-card">
                                        <h3 className="card-title">MAPA</h3>
                                        <div className="form-row">
                                            <label>Biomas de início</label>
                                            <div className="tags-container">
                                                <span className="cyber-tag active" onClick={handleTagClick}>Pradaria</span>
                                                <span className="cyber-tag active" onClick={handleTagClick}>Gelo</span>
                                                <span className="cyber-tag active" onClick={handleTagClick}>Pântano</span>
                                                <span className="cyber-tag active" onClick={handleTagClick}>Água</span>
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <label>Recursos (Água)</label>
                                            <label className="cyber-switch">
                                                <input type="checkbox" defaultChecked />
                                                <span className="switch-slider"></span>
                                            </label>
                                        </div>
                                        <div className="form-row">
                                            <label>Recursos (Minério)</label>
                                            <select className="terminal-dropdown">
                                                <option>Abundante</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="cyber-card">
                                        <h3 className="card-title">UNIDADES</h3>
                                        <div className="form-row">
                                            <label>Velocidade</label>
                                            <input type="range" className="cyber-range" min="0" max="100" defaultValue="50" />
                                        </div>
                                        <div className="form-row">
                                            <label>Ataque</label>
                                            <input type="number" className="terminal-input-num" defaultValue="25" />
                                        </div>
                                    </div>

                                    <div className="cyber-card">
                                        <h3 className="card-title">ECONOMIA</h3>
                                        <div className="form-row">
                                            <label>Gasto de Ouro</label>
                                            <input type="range" className="cyber-range" defaultValue="30" />
                                        </div>
                                        <div className="form-row">
                                            <label>Gasto de Comida</label>
                                            <input type="number" className="terminal-input-num" defaultValue="15" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </section>

                        <nav className="side-nav-menu">
                            <button className="nav-menu-item">VISÃO GERAL</button>
                            <button className="nav-menu-item">BÁSICO</button>
                            <button className="nav-menu-item active-nav">REGRAS</button>
                            <button className="nav-menu-item">EQUIPES</button>
                            <button className="nav-menu-item">VANTAGENS</button>
                            <button className="nav-menu-item">MUNDO</button>
                        </nav>
                    </div>

                    {activeTab === 'regras' && (
                        <div className="footer-actions">
                            <button className="neon-btn primary-neon" onClick={() => alert('Regras salvas com sucesso!')}>
                                SALVAR REGRAS
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default GeneralReport;