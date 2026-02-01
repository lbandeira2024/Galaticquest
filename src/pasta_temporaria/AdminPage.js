import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminPage.css';
import { useAuth } from './AuthContext';
import { useAudio } from './AudioManager';
import { useConfig } from './ConfigContext'; // 1. IMPORTAR O HOOK

const AdminPage = () => {
    const { apiBaseUrl } = useConfig(); // 2. OBTER A URL DA API DO CONTEXTO
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { musicAudioRef } = useAudio();
    const canvasRef = useRef(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState([]);
    const [nextGameNumber, setNextGameNumber] = useState(null);
    const [isLoadingGameNumber, setIsLoadingGameNumber] = useState(false);
    const [scheduledGames, setScheduledGames] = useState([]);
    const [isMuted, setIsMuted] = useState(musicAudioRef.current ? musicAudioRef.current.muted : false);
    const [pastDateError, setPastDateError] = useState(false);

    const handleLogout = () => {
        if (logout) {
            logout();
        }
        navigate('/');
    };

    const handleMuteToggle = () => {
        if (musicAudioRef.current) {
            const newMutedState = !musicAudioRef.current.muted;
            musicAudioRef.current.muted = newMutedState;
            setIsMuted(newMutedState);
        }
    };

    const fetchGames = async () => {
        if (!apiBaseUrl) return; // Garante que a URL foi carregada
        try {
            // 3. USAR A URL DA API
            const response = await axios.get(`${apiBaseUrl}/games`);
            if (response.data.success) {
                const gamesWithDates = response.data.games.map(game => ({
                    ...game,
                    startDate: new Date(game.startDate),
                    endDate: new Date(game.endDate)
                }));
                setScheduledGames(gamesWithDates);
            }
        } catch (error) {
            console.error("Erro ao buscar jogos agendados:", error);
        }
    };

    useEffect(() => {
        fetchGames();
    }, [apiBaseUrl]); // 4. Adicionar apiBaseUrl como dependência para refazer a chamada se a URL mudar

    const todayFormatted = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const [instructionText, setInstructionText] = useState('');
    const [showCursor, setShowCursor] = useState(false);
    const fullInstructionText = "Selecione as sessoes de jogos, lembrando que sao sempre dois dias.";

    useEffect(() => {
        setInstructionText('');
        setShowCursor(false);
        const typingInterval = setInterval(() => {
            setInstructionText((prev) => {
                if (prev.length < fullInstructionText.length) {
                    return fullInstructionText.substring(0, prev.length + 1);
                } else {
                    clearInterval(typingInterval);
                    setShowCursor(true);
                    return prev;
                }
            });
        }, 50);
        return () => clearInterval(typingInterval);
    }, []);

    useEffect(() => {
        if (!user || !user.administrador) {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const stars = Array.from({ length: 200 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            radius: Math.random() * 1.5,
            speed: Math.random() * 0.3 + 0.1,
        }));
        let animationFrameId;

        const animateStars = () => {
            if (!ctx) return;
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
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        animateStars();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    useEffect(() => {
        const fetchNextGameNumber = async () => {
            if (selectedDates.length === 2 && apiBaseUrl) { // Garante que a URL foi carregada
                setIsLoadingGameNumber(true);
                try {
                    // 5. USAR A URL DA API
                    const response = await axios.get(`${apiBaseUrl}/games/next-number`);
                    if (response.data.success) {
                        setNextGameNumber(response.data.nextGameNumber);
                    }
                } catch (error) {
                    console.error("Erro ao buscar o próximo número do jogo", error);
                } finally {
                    setIsLoadingGameNumber(false);
                }
            }
        };

        fetchNextGameNumber();
    }, [selectedDates, apiBaseUrl]); // 6. Adicionar apiBaseUrl como dependência

    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) { days.push(null); }
        for (let i = 1; i <= daysInMonth; i++) { days.push(i); }
        return { year, month, days };
    }, [currentDate]);

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

    const isPrevMonthDisabled = false;

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const handleDayClick = (day) => {
        if (!day) return;

        const newDate = new Date(calendarData.year, calendarData.month, day);
        newDate.setHours(0, 0, 0, 0);

        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        if (newDate < todayMidnight) {
            setPastDateError(true);
            return;
        }

        setPastDateError(false);

        if (selectedDates.length === 0 || selectedDates.length === 2) {
            setSelectedDates([newDate]);
            setNextGameNumber(null);
        } else if (selectedDates.length === 1) {
            const startDate = selectedDates[0];
            if (newDate.getTime() === startDate.getTime()) {
                setSelectedDates([]);
            } else if (newDate < startDate) {
                setSelectedDates([newDate]);
            } else {
                setSelectedDates([startDate, newDate]);
            }
        }
    };

    const handleSaveGame = async (e) => {
        e.preventDefault();
        if (selectedDates.length !== 2 || !apiBaseUrl) return; // Garante que a URL foi carregada
        try {
            // 7. USAR A URL DA API
            const response = await axios.post(`${apiBaseUrl}/games`, {
                startDate: selectedDates[0],
                endDate: selectedDates[1]
            });
            if (response.data.success) {
                alert(response.data.message);
                setSelectedDates([]);
                setNextGameNumber(null);
                fetchGames();
                setPastDateError(false);
            }
        } catch (error) {
            console.error("Erro ao salvar o jogo:", error);
            const errorMessage = error.response?.data?.message || "Não foi possível salvar o jogo.";
            alert(`❌ Erro: ${errorMessage}`);
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="admin-background">
            <canvas ref={canvasRef} className="admin-stars"></canvas>
            <div className="admin-container">
                <header className="admin-header">
                    <div className="header-content">
                        <img src="/images/ACEE.png" alt="ACEE Logo" className="admin-logo" />
                        <div>
                            <h1>Painel Administrativo</h1>
                            <p className="welcome-message">
                                Bem-vindo(a), <strong className="user-name">{user?.nome}</strong>. Hoje é {todayFormatted}.
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
                        <button onClick={handleLogout} className="logout-button">Sair</button>
                    </div>
                </header>

                <div className="admin-main-content">
                    <div className="side-panel left-panel">
                        <h3>Sessões de Jogos</h3>
                        <p className={`terminal-text ${showCursor ? 'blinking-cursor' : ''}`}>
                            {instructionText}
                        </p>
                    </div>

                    <main className="admin-panel">
                        <div className="custom-calendar">
                            <div className="calendar-header">
                                <button onClick={handlePrevMonth} disabled={isPrevMonthDisabled}>&lt;</button>
                                <h2>{monthNames[calendarData.month]} {calendarData.year}</h2>
                                <button onClick={handleNextMonth}>&gt;</button>
                            </div>
                            <div className="calendar-weekdays">
                                {weekDays.map((day, index) => <div key={index} className="weekday">{day}</div>)}
                            </div>
                            <div className="calendar-days">
                                {calendarData.days.map((day, index) => {
                                    if (!day) return <div key={index} className="day-cell empty"></div>;

                                    const date = new Date(calendarData.year, calendarData.month, day);
                                    date.setHours(0, 0, 0, 0);

                                    const isToday = day === today.getDate() && calendarData.month === today.getMonth() && calendarData.year === today.getFullYear();

                                    let isScheduled = false;
                                    let isPast = false;
                                    let gameInfoForIcon = null;
                                    let isFullyConfigured = false;

                                    for (const game of scheduledGames) {
                                        const gameStart = new Date(game.startDate.getTime());
                                        gameStart.setHours(0, 0, 0, 0);
                                        const gameEnd = new Date(game.endDate.getTime());
                                        gameEnd.setHours(0, 0, 0, 0);

                                        if (date >= gameStart && date <= gameEnd) {
                                            isScheduled = true;
                                            if (gameEnd < today) {
                                                isPast = true;
                                            }
                                            if (game.clienteId && game.regionalId) {
                                                isFullyConfigured = true;
                                            }

                                            if (date.getTime() === gameEnd.getTime()) {
                                                gameInfoForIcon = {
                                                    isPast: isPast,
                                                    gameNumber: game.gameNumber,
                                                    isFullyConfigured: isFullyConfigured
                                                };
                                            }
                                            break;
                                        }
                                    }

                                    let isSelected = false, isStartDate = false, isEndDate = false, isInRange = false;
                                    if (selectedDates.length > 0) {
                                        const startDate = selectedDates[0];
                                        isStartDate = date.getTime() === startDate.getTime();
                                        isSelected = isStartDate;
                                        if (selectedDates.length === 2) {
                                            const endDate = selectedDates[1];
                                            isEndDate = date.getTime() === endDate.getTime();
                                            isInRange = date > startDate && date < endDate;
                                            isSelected = isSelected || isEndDate;
                                        }
                                    }

                                    let iconElement = null;
                                    let iconClass = '';
                                    if (gameInfoForIcon) {
                                        const isPastGame = gameInfoForIcon.isPast;
                                        const isConfigured = gameInfoForIcon.isFullyConfigured;

                                        let icon;
                                        let tooltip;

                                        if (isPastGame) {
                                            icon = '🔍';
                                            tooltip = 'Visualizar';
                                            iconClass = 'game-icon view-icon';
                                        } else if (isConfigured) {
                                            icon = '🔍';
                                            tooltip = 'Gerenciar';
                                            iconClass = 'game-icon view-icon';
                                        } else {
                                            icon = '⚙️';
                                            tooltip = 'Configurar';
                                            iconClass = 'game-icon config-icon';
                                        }

                                        iconElement = (
                                            <div
                                                className={iconClass}
                                                title={tooltip}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const gameNumber = gameInfoForIcon.gameNumber || 'Agendado';
                                                    navigate(`/admin/game/${gameNumber}`);
                                                }}
                                            >
                                                {icon}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={index}
                                            className={`day-cell ${isToday ? 'today' : ''} ${isScheduled ? 'scheduled' : ''} ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''} ${isStartDate ? 'start-date' : ''} ${isEndDate ? 'end-date' : ''} ${isInRange ? 'in-range' : ''}`}
                                            onClick={() => handleDayClick(day)}
                                        >
                                            {day}
                                            {iconElement}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {pastDateError && (
                            <p className="restriction-message">
                                ❌ Não é possível agendar jogos em datas passadas.
                            </p>
                        )}
                    </main>

                    <div className="side-panel right-panel">
                        {selectedDates.length === 2 && (
                            <form onSubmit={handleSaveGame} className="game-form">
                                <h3>Agendar Novo Jogo</h3>
                                <div className="form-group">
                                    <label>Período Selecionado</label>
                                    <input
                                        type="text"
                                        value={`${selectedDates[0].toLocaleDateString('pt-BR')} - ${selectedDates[1].toLocaleDateString('pt-BR')}`}
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nome do Jogo</label>
                                    <input
                                        type="text"
                                        value={isLoadingGameNumber ? "Calculando..." : (nextGameNumber ? `Game ${nextGameNumber}` : "Erro")}
                                        disabled
                                    />
                                </div>
                                <button type="submit">Salvar Jogo</button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;