import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useAudio } from './AudioManager';
import { encryptData } from './crypto';
import './GameConfig.css';
import { useConfig } from './ConfigContext';

// ... (Funções auxiliares formatDate, parseDate, dateToInputFormat) ...
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
    } catch (e) {
        return 'Formato Inválido';
    }
};

const parseDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return null;
};

const dateToInputFormat = (date) => {
    if (!date) return '';
    try {
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    } catch (e) {
        return '';
    }
};


// ... (Componente PlayersTable) ...
const PlayersTable = ({ players, onDelete, onCopyLink, setPlayerMessage }) => {
    const { frontendUrl } = useConfig();

    const handleCopyClick = async (player) => {
        const baseUrl = frontendUrl || 'http://localhost:3000/';
        const paramsObject = {
            nome: player.nome || '',
            email: player.email || '',
            regional: player.regional || '',
            empresa: player.empresa || '',
            setor: player.setor || '',
            cargo: player.cargo || '',
        };
        const encryptedData = encryptData(paramsObject);
        const link = `${baseUrl}?form=cadastro&data=${encryptedData}`;

        try {
            await onCopyLink(link);
            setPlayerMessage({
                type: 'success',
                text: `Link de acesso para ${player.nome} copiado para a área de transferência!`
            });
            setTimeout(() => setPlayerMessage({ type: '', text: '' }), 5000);
        } catch (error) {
            console.error("Falha ao copiar o link (capturado pelo componente filho):", error);
        }
    };

    if (players.length === 0) {
        return <p className="player-list-placeholder">Nenhum jogador cadastrado para este cliente.</p>;
    }

    return (
        <div className="player-list-container">
            <table className="player-table">
                <thead>
                    <tr>
                        <th className="column-nome">Nome</th>
                        <th>E-mail</th>
                        <th>Setor</th>
                        <th>Regional</th>
                        <th>Cargo</th>
                        <th className="actions-header">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((player) => (
                        <tr key={player.email}>
                            <td className="column-nome-data">{player.nome}</td>
                            <td>{player.email}</td>
                            <td>{player.setor}</td>
                            <td>{player.regional}</td>
                            <td>{player.cargo || 'N/A'}</td>
                            <td className="player-actions-cell">
                                <button
                                    onClick={() => handleCopyClick(player)}
                                    className="action-button copy-link-button"
                                    title="Copiar Link de Cadastro"
                                >
                                    🔗 Link
                                </button>
                                <button
                                    onClick={() => onDelete(player.email, player.nome)}
                                    className="action-button delete-button"
                                    title="Deletar Registro"
                                >
                                    🗑️ Deletar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// ... (Componente MiniCalendar) ...
const MiniCalendar = ({ currentDate, scheduledGames, onDateSelect, selectedDates, onMonthChange, title }) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

    const calendarData = useMemo(() => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) { days.push(null); }
        for (let i = 1; i <= daysInMonth; i++) { days.push(i); }
        return days;
    }, [currentDate, firstDayOfMonth, daysInMonth]);

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="mini-calendar">
            <div className="calendar-title">{title}</div>
            <div className="calendar-header">
                <button onClick={() => onMonthChange(-1)}>&lt;</button>
                <h2>{monthNames[month]} {year}</h2>
                <button onClick={() => onMonthChange(1)}>&gt;</button>
            </div>
            <div className="calendar-weekdays">
                {weekDays.map((day, index) => <div key={index} className="weekday">{day}</div>)}
            </div>
            <div className="calendar-days">
                {calendarData.map((day, index) => {
                    if (!day) return <div key={index} className="day-cell empty"></div>;
                    const date = new Date(year, month, day);
                    date.setHours(0, 0, 0, 0);
                    const isScheduled = scheduledGames.some(game => {
                        const gameStart = new Date(game.startDate.getTime());
                        gameStart.setHours(0, 0, 0, 0);
                        const gameEnd = new Date(game.endDate.getTime());
                        gameEnd.setHours(0, 0, 0, 0);
                        return date >= gameStart && date <= gameEnd;
                    });
                    const isPast = date < today;
                    const isDisabled = isScheduled || isPast;
                    let isSelected = false;
                    if (selectedDates.length > 0) {
                        isSelected = selectedDates.some(d => d && d.getTime() === date.getTime());
                    }
                    return (
                        <div
                            key={index}
                            className={`day-cell ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isScheduled ? 'scheduled' : ''}`}
                            onClick={() => !isDisabled && onDateSelect(date)}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const GameConfig = () => {
    const { apiBaseUrl } = useConfig();
    const { gameNumber } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { musicAudioRef } = useAudio();
    const [isMuted, setIsMuted] = useState(musicAudioRef.current ? musicAudioRef.current.muted : false);

    const [isPaused, setIsPaused] = useState(false);
    const pauseChannel = useRef(new BroadcastChannel('pause_channel'));

    const canvasRef = useRef(null);
    const [clientList, setClientList] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [isLoadingClients, setIsLoadingClients] = useState(true);

    const [currentClientName, setCurrentClientName] = useState('');
    const [currentRegionalName, setCurrentRegionalName] = useState('');
    const [gameStartDate, setGameStartDate] = useState('');
    const [gameEndDate, setGameEndDate] = useState('');
    const [isAddingNewClient, setIsAddingNewClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [isAddingNewRegional, setIsAddingNewRegional] = useState(false);
    const [newRegionalName, setNewRegionalName] = useState('');
    const [regionalList, setRegionalList] = useState([]);
    const [selectedRegional, setSelectedRegional] = useState('');
    const [clientMessage, setClientMessage] = useState({ type: '', text: '' });
    const [isEditingDates, setIsEditingDates] = useState(false);
    const [newStartDate, setNewStartDate] = useState(null);
    const [newEndDate, setNewEndDate] = useState(null);
    const [showCalendar, setShowCalendar] = useState(null);
    const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [scheduledGames, setScheduledGames] = useState([]);
    const [isAddingNewPlayer, setIsAddingNewPlayer] = useState(false);

    // --- CORREÇÃO 1: Adicionado numeroLiderados ao estado ---
    const [newPlayerForm, setNewPlayerForm] = useState({
        nome: '',
        email: '',
        senha: 'changeme',
        setor: '',
        cargo: '',
        tempoLideranca: '',
        numeroLiderados: '', // Novo campo obrigatório
    });

    const [playerMessage, setPlayerMessage] = useState({ type: '', text: '' });
    const [playersList, setPlayersList] = useState([]);


    const fetchGames = async () => {
        if (!apiBaseUrl) return;
        try {
            const response = await axios.get(`${apiBaseUrl}/games`);
            if (response.data.success) {
                const gamesWithDates = response.data.games.map(game => ({
                    ...game,
                    startDate: new Date(game.startDate),
                    endDate: new Date(game.endDate)
                }));
                const filteredGames = gamesWithDates.filter(g => g.gameNumber !== Number(gameNumber));
                setScheduledGames(filteredGames);
            }
        } catch (error) {
            console.error("Erro ao buscar jogos agendados:", error);
        }
    };

    const fetchPlayers = useCallback(async (clientName) => {
        if (!clientName || !apiBaseUrl) {
            setPlayersList([]);
            return;
        }
        try {
            const response = await axios.get(`${apiBaseUrl}/users/by-company?company=${encodeURIComponent(clientName)}`);
            if (response.data.success) {
                const playersWithCompany = response.data.users.map(player => ({
                    ...player,
                    empresa: clientName
                }));
                setPlayersList(playersWithCompany || []);
            } else {
                setPlayersList([]);
            }
        } catch (error) {
            console.error("Erro ao buscar lista de jogadores:", error);
            setPlayersList([]);
        }
    }, [apiBaseUrl]);

    const fetchClients = useCallback(async () => {
        if (!apiBaseUrl) return;
        setIsLoadingClients(true);
        setClientMessage({ type: '', text: '' });
        setCurrentClientName('');
        setCurrentRegionalName('');
        setGameStartDate('');
        setGameEndDate('');
        setSelectedRegional('');

        try {
            const responseCompanies = await axios.get(`${apiBaseUrl}/companies/list`);
            const companies = responseCompanies.data.companies;
            const fullList = [{ _id: '', nome: "Insira novo cliente" }, ...companies];
            setClientList(fullList);

            const responseRegionals = await axios.get(`${apiBaseUrl}/regionals/list`);
            const regionals = responseRegionals.data.regionals;
            const fullRegionalList = [{ _id: '', nome: "Insira nova regional" }, ...regionals];
            setRegionalList(fullRegionalList);

            const gameConfigResponse = await axios.get(`${apiBaseUrl}/games/${gameNumber}/config`);
            const { clienteId, regionalId, startDate, endDate, isPaused: gamePaused } = gameConfigResponse.data;

            setIsPaused(gamePaused || false);

            let clientName = '';
            let regionalName = '';
            if (clienteId) {
                const configuredClient = companies.find(c => c._id === clienteId);
                if (configuredClient) {
                    clientName = configuredClient.nome;
                    setCurrentClientName(clientName);
                    setSelectedClient(clienteId);
                }
            } else {
                setSelectedClient('');
            }
            if (regionalId) {
                const configuredRegional = regionals.find(r => r._id === regionalId);
                if (configuredRegional) {
                    regionalName = configuredRegional.nome;
                    setCurrentRegionalName(regionalName);
                    setSelectedRegional(regionalId);
                }
            } else {
                setSelectedRegional('');
            }
            if (startDate && endDate) {
                setGameStartDate(formatDate(startDate));
                setGameEndDate(formatDate(endDate));
            }
            if (clientName) {
                await fetchPlayers(clientName);
            } else {
                setPlayersList([]);
            }

        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            setClientList([{ _id: '', nome: "Insira novo cliente" }, { _id: 'error', nome: "Falha ao carregar lista" }]);
            setRegionalList([{ _id: '', nome: "Insira nova regional" }, { _id: 'error', nome: "Falha ao carregar regionais" }]);
            setClientMessage({ type: 'error', text: 'Erro ao carregar lista de clientes/regionais e configuração.' });
        } finally {
            setIsLoadingClients(false);
        }
    }, [gameNumber, fetchPlayers, apiBaseUrl]);

    useEffect(() => {
        fetchClients();
        fetchGames();
    }, [fetchClients]);

    useEffect(() => {
        if (!user || !user.administrador) {
            navigate('/');
        }
    }, [user, navigate]);

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

        return () => {
            channel.removeEventListener('message', handleChannelMessage);
        };
    }, [gameNumber]);

    const handleDeletePlayer = async (email, nome) => {
        if (!window.confirm(`Tem certeza que deseja DELETAR o registro do jogador ${nome} (${email})? Esta ação é irreversível.`)) {
            return;
        }
        if (!apiBaseUrl) return;
        try {
            await axios.delete(`${apiBaseUrl}/users/${encodeURIComponent(email)}`);
            setPlayersList(prevList => prevList.filter(p => p.email !== email));
            setPlayerMessage({
                type: 'success',
                text: `Registro de ${nome} excluído com sucesso.`
            });
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Erro ao deletar o registro do jogador.";
            setPlayerMessage({ type: 'error', text: errorMessage });
        }
    };

    const handleCopyLink = async (link) => {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(link);
                return;
            } catch (err) {
                console.warn('Falha ao copiar com navigator.clipboard, tentando fallback:', err);
            }
        }
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            const successful = document.execCommand('copy');
            if (!successful) {
                throw new Error('document.execCommand retornou "false"');
            }
        } catch (err) {
            console.error('Falha ao copiar com document.execCommand:', err);
            setPlayerMessage({
                type: 'error',
                text: 'Falha ao copiar o link. A cópia automática pode estar bloqueada.'
            });
            throw err;
        } finally {
            document.body.removeChild(textArea);
        }
    };

    const handleAddNewClientClick = () => {
        setIsAddingNewClient(true);
        setNewClientName('');
        setClientMessage({ type: '', text: '' });
    };

    const handleSaveNewClient = async () => {
        if (!newClientName.trim()) {
            setClientMessage({ type: 'error', text: 'O nome da empresa não pode ser vazio.' });
            return;
        }
        if (!apiBaseUrl) return;
        try {
            const response = await axios.post(`${apiBaseUrl}/companies`, { nome: newClientName.trim() });
            setClientMessage({ type: 'success', text: response.data.message });
            const companies = response.data.companies;
            const fullList = [{ _id: '', nome: "Insira novo cliente" }, ...companies];
            setClientList(fullList);
            setSelectedClient(response.data.newClientId);
            setCurrentClientName(newClientName.trim());
            setIsAddingNewClient(false);
            setNewClientName('');
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Erro ao salvar o novo cliente.";
            setClientMessage({ type: 'error', text: errorMessage });
        }
    };

    const handleAddNewRegionalClick = () => {
        setIsAddingNewRegional(true);
        setNewRegionalName('');
        setClientMessage({ type: '', text: '' });
    };

    const handleSaveNewRegional = async () => {
        if (!newRegionalName.trim()) {
            setClientMessage({ type: 'error', text: 'O nome da regional não pode ser vazio.' });
            return;
        }
        if (!apiBaseUrl) return;
        try {
            const response = await axios.post(`${apiBaseUrl}/regionals`, { nome: newRegionalName.trim() });
            setClientMessage({ type: 'success', text: response.data.message });
            const regionals = response.data.regionals;
            const fullList = [{ _id: '', nome: "Insira nova regional" }, ...regionals];
            setRegionalList(fullList);
            setSelectedRegional(response.data.newRegionalId);
            setCurrentRegionalName(newRegionalName.trim());
            setIsAddingNewRegional(false);
            setNewRegionalName('');
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Erro ao salvar a nova regional.";
            setClientMessage({ type: 'error', text: errorMessage });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!apiBaseUrl) return;
        if (!selectedClient || selectedClient === '' || selectedClient === 'Insira novo cliente' || selectedClient === 'error') {
            setClientMessage({ type: 'error', text: 'Por favor, selecione um cliente válido antes de salvar.' });
            return;
        }
        if (!selectedRegional || selectedRegional === '' || selectedRegional === 'Insira nova regional' || selectedRegional === 'error') {
            setClientMessage({ type: 'error', text: 'Por favor, selecione uma regional válida antes de salvar.' });
            return;
        }
        try {
            const response = await axios.put(`${apiBaseUrl}/games/${gameNumber}/config`, {
                clienteId: selectedClient,
                regionalId: selectedRegional,
            });
            setClientMessage({ type: 'success', text: response.data.message });
            await fetchClients();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Erro ao salvar a configuração do jogo.";
            setClientMessage({ type: 'error', text: errorMessage });
        }
    };

    const handleChangeClient = () => {
        setCurrentClientName('');
        setCurrentRegionalName('');
        setSelectedClient('');
        setSelectedRegional('');
        setClientMessage({ type: '', text: 'Selecione o novo cliente e regional para este período.' });
        setPlayersList([]);
    }

    const handleCancelGame = async () => {
        if (!window.confirm(`Tem certeza que deseja CANCELAR o GAME ${gameNumber}? O agendamento será deletado.`)) {
            return;
        }
        if (!apiBaseUrl) return;
        try {
            await axios.delete(`${apiBaseUrl}/games/${gameNumber}`);
            setClientMessage({ type: 'success', text: `GAME ${gameNumber} cancelado com sucesso. Redirecionando...` });
            setTimeout(() => {
                navigate('/admin');
            }, 2000);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Erro ao cancelar o jogo.";
            setClientMessage({ type: 'error', text: errorMessage });
        }
    };

    const handleStartGame = async () => {
        if (!window.confirm(`Tem certeza que deseja INICIAR o GAME ${gameNumber}? \n\nIsso autorizará o acesso de todos os jogadores cadastrados para este Jogo.`)) {
            return;
        }
        if (!apiBaseUrl) {
            setClientMessage({ type: 'error', text: 'URL da API não configurada.' });
            return;
        }
        setClientMessage({ type: 'info', text: 'Iniciando o jogo e autorizando jogadores...' });
        try {
            const response = await axios.post(`${apiBaseUrl}/users/authorize-by-game`, {
                gameNumber: Number(gameNumber)
            });
            let successMessage = response.data.message || `Jogo ${gameNumber} iniciado com sucesso.`;
            if (response.data.updatedCount !== undefined) {
                successMessage += ` ${response.data.updatedCount} jogadores foram autorizados.`;
            }
            setClientMessage({ type: 'success', text: successMessage });
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Erro ao iniciar o jogo ou autorizar jogadores.";
            setClientMessage({ type: 'error', text: errorMessage });
        }
    };

    const handleStartEditDates = () => {
        setIsEditingDates(true);
        setNewStartDate(gameStartDate ? new Date(parseDate(gameStartDate)) : null);
        setNewEndDate(gameEndDate ? new Date(parseDate(gameEndDate)) : null);
        setCalendarMonth(gameStartDate ? new Date(parseDate(gameStartDate)) : new Date());
        setClientMessage({ type: '', text: 'Selecione as novas datas nos campos abaixo.' });
    }

    const handleSaveDates = async () => {
        if (!newStartDate || !newEndDate) {
            setClientMessage({ type: 'error', text: 'Ambas as datas de início e fim são obrigatórias.' });
            return;
        }
        if (!apiBaseUrl) return;
        const start = new Date(newStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(newEndDate);
        end.setHours(0, 0, 0, 0);
        if (start.getTime() > end.getTime()) {
            setClientMessage({ type: 'error', text: 'A data de início deve ser anterior ou igual à data de fim.' });
            return;
        }
        const dayDifference = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
        if (dayDifference !== 1) {
            setClientMessage({ type: 'error', text: 'As datas devem ser sequenciais (diferença de exatamente 1 dia).' });
            return;
        }
        try {
            const response = await axios.put(`${apiBaseUrl}/games/${gameNumber}/dates`, {
                startDate: start,
                endDate: end
            });
            setClientMessage({ type: 'success', text: response.data.message });
            setIsEditingDates(false);
            await fetchClients();
            await fetchGames();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Erro ao salvar as novas datas.";
            setClientMessage({ type: 'error', text: errorMessage });
        }
    };

    const handleCalendarDateSelect = (date) => {
        date.setHours(0, 0, 0, 0);
        if (showCalendar === 'start') {
            setNewStartDate(date);
            if (newEndDate) {
                const dayDifference = (newEndDate.getTime() - date.getTime()) / (1000 * 3600 * 24);
                if (dayDifference < 1) {
                    setNewEndDate(null);
                    setClientMessage({ type: 'error', text: 'A data de fim foi redefinida. Selecione o dia seguinte ao início.' });
                } else if (dayDifference > 1) {
                    setClientMessage({ type: 'error', text: 'A data de fim está incorreta. O jogo dura apenas 2 dias sequenciais.' });
                }
            }
            setShowCalendar(null);
        } else if (showCalendar === 'end') {
            if (newStartDate) {
                const dayDifference = (date.getTime() - newStartDate.getTime()) / (1000 * 3600 * 24);
                if (dayDifference !== 1) {
                    setClientMessage({ type: 'error', text: 'A data de fim deve ser o dia seguinte à data de início.' });
                    return;
                }
            } else {
                setClientMessage({ type: 'error', text: 'Selecione a data de início primeiro.' });
                return;
            }
            setNewEndDate(date);
            setShowCalendar(null);
        }
        setClientMessage({ type: '', text: '' });
    };

    const handleMonthChange = (direction) => {
        setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
    };

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

    const handlePauseToggle = async () => {
        const newPauseState = !isPaused;
        const actionText = newPauseState ? "PAUSAR" : "RETOMAR";

        if (!window.confirm(`Tem certeza que deseja ${actionText} o GAME ${gameNumber} para todos os jogadores?`)) {
            return;
        }

        if (!apiBaseUrl) {
            setClientMessage({ type: 'error', text: 'URL da API não configurada.' });
            return;
        }

        setClientMessage({ type: 'info', text: `${newPauseState ? 'Pausando' : 'Retomando'} o jogo...` });

        try {
            const response = await axios.post(`${apiBaseUrl}/games/${gameNumber}/toggle-pause`, {
                isPaused: newPauseState
            });

            setIsPaused(newPauseState);
            setClientMessage({
                type: 'success',
                text: response.data.message || `Jogo ${newPauseState ? 'pausado' : 'retomado'} com sucesso.`
            });

            pauseChannel.current.postMessage({
                gameNumber: Number(gameNumber),
                isPaused: newPauseState,
                controllerId: newPauseState ? 'ADMIN_PAUSE' : null
            });

        } catch (error) {
            const errorMessage = error.response?.data?.message || `Erro ao ${actionText.toLowerCase()} o jogo.`;
            setClientMessage({ type: 'error', text: errorMessage });
        }
    };

    const handlePlayerFormChange = (e) => {
        setNewPlayerForm({ ...newPlayerForm, [e.target.name]: e.target.value });
    };

    const handleSaveNewPlayer = async (e) => {
        e.preventDefault();
        setPlayerMessage({ type: '', text: '' });
        if (!apiBaseUrl) return;

        // --- CORREÇÃO 2: Validação atualizada com numeroLiderados ---
        if (!newPlayerForm.nome || !newPlayerForm.email || !newPlayerForm.setor || !newPlayerForm.cargo || !newPlayerForm.tempoLideranca || !newPlayerForm.numeroLiderados) {
            setPlayerMessage({ type: 'error', text: 'Por favor, preencha todos os campos obrigatórios.' });
            return;
        }
        if (!currentRegionalName) {
            setPlayerMessage({ type: 'error', text: 'Erro: A Regional do Game deve ser configurada antes de adicionar jogadores.' });
            return;
        }

        const registrationData = {
            nome: newPlayerForm.nome,
            email: newPlayerForm.email,
            senha: newPlayerForm.senha,
            setor: newPlayerForm.setor,
            cargo: newPlayerForm.cargo,
            tempoLideranca: newPlayerForm.tempoLideranca,
            numeroLiderados: Number(newPlayerForm.numeroLiderados), // Conversão para número
            regional: currentRegionalName,
            empresa: currentClientName,
            autorizado: false,
            gameNumber: Number(gameNumber),
        };

        try {
            const response = await axios.post(`${apiBaseUrl}/register`, registrationData);
            const newUser = response.data.usuario;
            const playerToAdd = {
                nome: newUser.nome,
                email: newUser.email,
                setor: newUser.setor,
                regional: newUser.regional,
                cargo: newUser.cargo,
                tempoLideranca: newUser.tempoLideranca,
                empresa: currentClientName,
            };
            setPlayersList(prevList => [...prevList, playerToAdd]);
            setPlayerMessage({
                type: 'success',
                text: `${newUser.nome} registrado com sucesso! (Senha: ${newPlayerForm.senha})`
            });

            // --- CORREÇÃO 3: Reset do estado incluindo numeroLiderados ---
            setNewPlayerForm({
                nome: '',
                email: '',
                senha: 'changeme',
                setor: '',
                cargo: '',
                tempoLideranca: '',
                numeroLiderados: '',
            });
            setIsAddingNewPlayer(false);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data?.details || "Erro ao registrar o novo jogador.";
            setPlayerMessage({ type: 'error', text: errorMessage });
        }
    };

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

    const isGameConfigured = currentClientName && currentRegionalName && gameStartDate && gameEndDate;

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
                                <span className="user-name">Configuração do Jogo</span>
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

                        {isGameConfigured && (
                            <button
                                onClick={handlePauseToggle}
                                className={`audio-toggle-button pause-toggle-button ${isPaused ? 'paused' : 'active'}`}
                                title={isPaused ? "Retomar Jogo" : "Pausar Jogo"}
                            >
                                {isPaused ? '▶️' : '⏸️'}
                            </button>
                        )}

                        <button onClick={() => navigate('/admin')} className="logout-button">Voltar</button>
                        <button onClick={handleLogout} className="logout-button">Sair</button>
                    </div>
                </header>

                <div className="admin-main-content config-content">
                    <main className="game-config-panel">
                        <div className="game-header-actions">
                            <h2 className="game-title-inline">GAME {gameNumber}</h2>
                            {isGameConfigured && (
                                <div className="game-control-buttons">
                                    <button
                                        type="button"
                                        onClick={handleStartGame}
                                        className="game-action-button start-button"
                                    >
                                        INICIAR
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/reports/${gameNumber}`)}
                                        className="game-action-button report-button"
                                    >
                                        REPORTS
                                    </button>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="config-form">
                            {clientMessage.text && (
                                <p className={`client-message ${clientMessage.type}`}>
                                    {clientMessage.text}
                                </p>
                            )}

                            <div className="form-group-inline">
                                {(!currentClientName || !currentRegionalName || !gameStartDate) && !isEditingDates && (
                                    <label htmlFor="client-select">Cliente</label>
                                )}
                                {isGameConfigured ? (
                                    <div className="configured-client-info">
                                        {isEditingDates ? (
                                            <div className="dates-edit-group">
                                                <div className="date-input-wrapper">
                                                    <label htmlFor="new-start-date" className="info-label">Início:</label>
                                                    <input
                                                        id="new-start-date"
                                                        type="text"
                                                        className="terminal-input date-input"
                                                        value={dateToInputFormat(newStartDate)}
                                                        onFocus={() => {
                                                            setShowCalendar('start');
                                                            setCalendarMonth(newStartDate || new Date());
                                                        }}
                                                        readOnly
                                                        placeholder="DD/MM/AAAA"
                                                    />
                                                </div>
                                                <div className="date-input-wrapper">
                                                    <label htmlFor="new-end-date" className="info-label">Fim:</label>
                                                    <input
                                                        id="new-end-date"
                                                        type="text"
                                                        className="terminal-input date-input"
                                                        value={dateToInputFormat(newEndDate)}
                                                        onFocus={() => {
                                                            setShowCalendar('end');
                                                            setCalendarMonth(newEndDate || newStartDate || new Date());
                                                        }}
                                                        readOnly
                                                        placeholder="DD/MM/AAAA"
                                                    />
                                                </div>
                                                <div className="date-edit-actions">
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveDates}
                                                        className="save-new-client-button"
                                                        disabled={!newStartDate || !newEndDate}
                                                    >
                                                        Salvar Datas
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsEditingDates(false);
                                                            setClientMessage({ type: '', text: '' });
                                                        }}
                                                        className="cancel-new-client-button"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>

                                                {showCalendar && (
                                                    <div className="calendar-overlay" onClick={() => setShowCalendar(null)}>
                                                        <div className="calendar-popup" onClick={(e) => e.stopPropagation()}>
                                                            <MiniCalendar
                                                                currentDate={calendarMonth}
                                                                scheduledGames={scheduledGames}
                                                                onDateSelect={handleCalendarDateSelect}
                                                                selectedDates={[newStartDate, newEndDate]}
                                                                onMonthChange={(dir) => handleMonthChange(dir)}
                                                                title={showCalendar === 'start' ? 'Início do Jogo' : 'Fim do Jogo'}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="client-data-display">
                                                    <p className="client-display">
                                                        <span className="info-label">Cliente:</span>
                                                        <span className="info-value client-name">{currentClientName}</span>
                                                    </p>
                                                    <p className="regional-display">
                                                        <span className="info-label">Regional:</span>
                                                        <span className="info-value regional-name">{currentRegionalName}</span>
                                                    </p>
                                                    <p className="date-display">
                                                        <span className="info-label">Data do Jogo:</span>
                                                        <span className="info-value date-range">{`${gameStartDate} a ${gameEndDate}`}</span>
                                                    </p>
                                                </div>
                                                <div className="config-actions-buttons">
                                                    <button
                                                        type="button"
                                                        onClick={handleStartEditDates}
                                                        className="change-period-button"
                                                    >
                                                        Alterar Período
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleChangeClient}
                                                        className="change-client-button"
                                                    >
                                                        Alterar Configuração
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelGame}
                                                        className="cancel-game-button"
                                                    >
                                                        Cancelar Jogo
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="config-selection-group">
                                        <div className="client-select-wrapper">
                                            <label htmlFor="client-select">Cliente</label>
                                            <select
                                                id="client-select"
                                                className="terminal-select"
                                                value={selectedClient}
                                                onChange={(e) => setSelectedClient(e.target.value)}
                                                disabled={isLoadingClients || isAddingNewClient || isAddingNewRegional || isEditingDates}
                                            >
                                                <option value="" disabled>
                                                    {isLoadingClients ? 'Carregando clientes...' : 'Selecione um cliente'}
                                                </option>
                                                {clientList.map((client) => (
                                                    <option
                                                        key={client._id || client.nome}
                                                        value={client._id || client.nome}
                                                        disabled={client._id === '' || client._id === 'error'}
                                                    >
                                                        {client.nome}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                className="new-client-button"
                                                onClick={handleAddNewClientClick}
                                                disabled={isAddingNewPlayer || isEditingDates || isAddingNewRegional}
                                            >
                                                Novo
                                            </button>
                                        </div>

                                        <div className="regional-select-wrapper">
                                            <label htmlFor="regional-select" className="regional-label">Regional</label>
                                            <select
                                                id="regional-select"
                                                className="terminal-select"
                                                value={selectedRegional}
                                                onChange={(e) => setSelectedRegional(e.target.value)}
                                                disabled={isLoadingClients || isAddingNewRegional || isAddingNewClient || isEditingDates}
                                            >
                                                <option value="" disabled>
                                                    {isLoadingClients ? 'Carregando regionais...' : 'Selecione uma regional'}
                                                </option>
                                                {regionalList.map((regional) => (
                                                    <option
                                                        key={regional._id || regional.nome}
                                                        value={regional._id || regional.nome}
                                                        disabled={regional._id === '' || regional._id === 'error'}
                                                    >
                                                        {regional.nome}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                className="new-client-button new-regional-button"
                                                onClick={handleAddNewRegionalClick}
                                                disabled={isAddingNewPlayer || isEditingDates || isAddingNewClient}
                                            >
                                                Novo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isAddingNewClient && (
                                <div className="new-client-form-group">
                                    <label htmlFor="new-client-name">Novo Cliente</label>
                                    <div className="client-input-group">
                                        <input
                                            id="new-client-name"
                                            type="text"
                                            className="terminal-input"
                                            value={newClientName}
                                            onChange={(e) => setNewClientName(e.target.value)}
                                            placeholder="Insira o nome da nova empresa"
                                        />
                                        <button
                                            type="button"
                                            className="save-new-client-button"
                                            onClick={handleSaveNewClient}
                                        >
                                            Salvar
                                        </button>
                                        <button
                                            type="button"
                                            className="cancel-new-client-button"
                                            onClick={() => setIsAddingNewClient(false)}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isAddingNewRegional && (
                                <div className="new-client-form-group">
                                    <label htmlFor="new-regional-name">Nova Regional</label>
                                    <div className="client-input-group">
                                        <input
                                            id="new-regional-name"
                                            type="text"
                                            className="terminal-input"
                                            value={newRegionalName}
                                            onChange={(e) => setNewRegionalName(e.target.value)}
                                            placeholder="Insira o nome da nova regional"
                                        />
                                        <button
                                            type="button"
                                            className="save-new-client-button"
                                            onClick={handleSaveNewRegional}
                                        >
                                            Salvar
                                        </button>
                                        <button
                                            type="button"
                                            className="cancel-new-client-button"
                                            onClick={() => setIsAddingNewRegional(false)}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="config-buttons-footer">
                                <button
                                    type="submit"
                                    className="save-config-button"
                                    disabled={
                                        isAddingNewClient ||
                                        isAddingNewRegional ||
                                        isEditingDates ||
                                        !selectedClient || selectedClient === '' || selectedClient === 'Insira novo cliente' ||
                                        !selectedRegional || selectedRegional === '' || selectedRegional === 'Insira nova regional' ||
                                        isGameConfigured
                                    }
                                >
                                    {isGameConfigured ? 'Configuração Finalizada' : 'Salvar Configuração'}
                                </button>
                            </div>
                        </form>

                        {isGameConfigured && (
                            <div className="players-section">
                                <div className="players-header-actions">
                                    <h3 className="players-title">JOGADORES</h3>
                                    <button
                                        type="button"
                                        className="new-player-button"
                                        onClick={() => {
                                            setIsAddingNewPlayer(true);
                                            setPlayerMessage({ type: '', text: '' });
                                        }}
                                        disabled={isAddingNewPlayer || isEditingDates}
                                    >
                                        Inserir Novo Jogador
                                    </button>
                                </div>

                                {playerMessage.text && (
                                    <p className={`client-message ${playerMessage.type}`}>
                                        {playerMessage.text}
                                    </p>
                                )}

                                {isAddingNewPlayer && (
                                    <form onSubmit={handleSaveNewPlayer} className="new-player-form">
                                        <h4>Novo Jogador para {currentClientName} (Regional: {currentRegionalName})</h4>
                                        <div className="form-row">
                                            <div className="form-field">
                                                <input id="nome" name="nome" type="text" className="terminal-input" value={newPlayerForm.nome} onChange={handlePlayerFormChange} placeholder="Nome *" />
                                            </div>
                                            <div className="form-field">
                                                <input id="email" name="email" type="email" className="terminal-input" value={newPlayerForm.email} onChange={handlePlayerFormChange} placeholder="E-mail *" />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-field">
                                                <input id="setor" name="setor" type="text" className="terminal-input" value={newPlayerForm.setor} onChange={handlePlayerFormChange} placeholder="Setor *" />
                                            </div>
                                            <div className="form-field">
                                                <p className="form-note">Regional: **{currentRegionalName}** (Definida no Game)</p>
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-field">
                                                <input id="cargo" name="cargo" type="text" className="terminal-input" value={newPlayerForm.cargo} onChange={handlePlayerFormChange} placeholder="Cargo *" />
                                            </div>
                                            <div className="form-field">
                                                <input id="tempoLideranca" name="tempoLideranca" type="text" className="terminal-input" value={newPlayerForm.tempoLideranca} onChange={handlePlayerFormChange} placeholder="Tempo de Liderança *" />
                                            </div>
                                            {/* --- CORREÇÃO 4: Input visual para Nº Liderados --- */}
                                            <div className="form-field">
                                                <input
                                                    id="numeroLiderados"
                                                    name="numeroLiderados"
                                                    type="number"
                                                    className="terminal-input"
                                                    value={newPlayerForm.numeroLiderados}
                                                    onChange={handlePlayerFormChange}
                                                    placeholder="Nº Liderados *"
                                                />
                                            </div>
                                        </div>
                                        <div className="player-form-actions">
                                            <button type="submit" className="save-new-client-button">
                                                Salvar Jogador
                                            </button>
                                            <button
                                                type="button"
                                                className="cancel-new-client-button"
                                                onClick={() => setIsAddingNewPlayer(false)}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {!isAddingNewPlayer && (
                                    <PlayersTable
                                        players={playersList}
                                        onDelete={handleDeletePlayer}
                                        onCopyLink={handleCopyLink}
                                        setPlayerMessage={setPlayerMessage}
                                    />
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default GameConfig;