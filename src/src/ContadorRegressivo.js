import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./CadastroForm.css";
import axios from "axios"; // 1. IMPORTADO: Necessário para chamadas à API
import { useConfig } from "./ConfigContext"; // 2. IMPORTADO: Para obter a URL base da API

const ContadorRegressivo = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { apiBaseUrl } = useConfig(); // 3. OBTIDO: URL da API do contexto

    const [gameStartDate, setGameStartDate] = useState(null); // 4. ADICIONADO: Estado para a data de início do jogo
    const [tempoRestante, setTempoRestante] = useState(null); // 5. MODIFICADO: Inicia como null
    const canvasRef = useRef(null);

    // 6. REMOVIDO: A função calculaTempoRestante() foi movida para dentro de um useEffect

    // 7. ADICIONADO: Efeito para buscar a data de início do jogo
    useEffect(() => {
        // Só busca se tivermos o gameNumber do usuário e a URL da API
        if (user?.gameNumber && apiBaseUrl) {
            const fetchGameData = async () => {
                try {
                    // Busca os dados do jogo específico do usuário
                    const response = await axios.get(`${apiBaseUrl}/games/${user.gameNumber}/config`);
                    if (response.data.success) {
                        setGameStartDate(response.data.startDate); // Armazena a data de início
                    } else {
                        console.error("Não foi possível buscar a data do jogo.");
                    }
                } catch (error) {
                    console.error("Erro ao buscar dados do jogo:", error);
                }
            };
            fetchGameData();
        }
    }, [user, apiBaseUrl]); // Depende do usuário e da URL da API

    // Efeito para animação das estrelas (sem alteração)
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const stars = Array.from({ length: 100 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            radius: Math.random() * 2,
            speed: Math.random() * 0.3,
        }));

        const animateStars = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";

            stars.forEach((star) => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();
                star.y += star.speed;
                if (star.y > window.innerHeight) star.y = 0;
            });

            requestAnimationFrame(animateStars);
        };

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        animateStars();

        return () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
    }, []);

    // 8. MODIFICADO: Efeito do timer
    useEffect(() => {
        // Só inicia o timer DEPOIS que a data do jogo foi carregada (gameStartDate não é null)
        if (!gameStartDate) {
            return;
        }

        // Função de cálculo agora vive aqui e usa a data do jogo
        const calculaTempoRestante = () => {
            const agora = new Date();
            const dataInicio = new Date(gameStartDate); // <-- USA A DATA DO JOGO
            const diferenca = dataInicio - agora;

            if (diferenca <= 0) {
                // Se o tempo acabou, zera e para o timer
                clearInterval(timerId); // Para o timer
                return { dias: 0, horas: 0, minutos: 0, segundos: 0 };
            }

            return {
                dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
                horas: Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutos: Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60)),
                segundos: Math.floor((diferenca % (1000 * 60)) / 1000)
            };
        };

        // Define o tempo inicial assim que a data é carregada
        setTempoRestante(calculaTempoRestante());

        // Inicia o intervalo
        const timerId = setInterval(() => {
            setTempoRestante(calculaTempoRestante());
        }, 1000);

        // Limpa o intervalo quando o componente for desmontado ou a data do jogo mudar
        return () => clearInterval(timerId);

    }, [gameStartDate]); // Depende do gameStartDate

    // 9. MODIFICADO: Efeito de redirecionamento
    useEffect(() => {
        // Se o usuário for autorizado, ele não deve estar nesta tela
        if (user?.autorizado) {
            navigate("/BoasVindas");
        }
    }, [user, navigate]);

    return (
        <div className="background">
            <canvas ref={canvasRef} className="stars"></canvas>

            <img src="/images/logogalaticQuest.png" className="game-logo" alt="Galactic Quest" />

            <div className="form-container">
                <div className="contador-regressivo">
                    <h2>Início da Missão</h2>

                    {/* 10. ADICIONADO: Condicional para mostrar "Carregando" ou o contador */}
                    {tempoRestante ? (
                        <div className="contador-numeros">
                            <div className="contador-bloco">
                                <span>{tempoRestante.dias}</span>
                                <small>Dias</small>
                            </div>

                            <div className="contador-bloco">
                                <span>{tempoRestante.horas}</span>
                                <small>Horas</small>
                            </div>

                            <div className="contador-bloco">
                                <span>{tempoRestante.minutos}</span>
                                <small>Minutos</small>
                            </div>

                            <div className="contador-bloco">
                                <span>{Math.floor(tempoRestante.segundos)}</span>
                                <small>Segundos</small>
                            </div>
                        </div>
                    ) : (
                        <div className="contador-loading">
                            <p>Carregando data da missão...</p>
                        </div>
                    )}

                    <p>Prepare-se para a jornada cósmica!</p>
                </div>
            </div>
        </div>
    );
};

export default ContadorRegressivo;