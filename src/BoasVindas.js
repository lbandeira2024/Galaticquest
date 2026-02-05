import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./BoasVindas.css";
import axios from "axios";

// CORREÇÃO: Usar rota relativa para funcionar com o Proxy (HTTPS)
// Isso evita o erro de Mixed Content que ocorria ao chamar http://IP:5000 diretamente
const API_URL = "/api";

const BoasVindas = () => {
    const navigate = useNavigate();
    const { user, login, saveTeamName } = useAuth();
    const canvasRef = useRef(null);
    const [teamName, setTeamName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (user?.grupo) {
            console.log("Redirect: Usuário já tem grupo. Saindo de BoasVindas -> /LobbyGrupos");
            navigate("/LobbyGrupos");
        }
    }, [user, navigate]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const stars = Array.from({ length: 150 }, () => ({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, radius: Math.random() * 1.5, speed: Math.random() * 0.3 + 0.1, }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!teamName.trim()) {
            setErrorMessage("Por favor, insira um nome válido para a equipe");
            return;
        }

        console.log(`Tentando registrar o nome da equipe: "${teamName}"`);

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            // A URL agora será /api/save-team-name, que o proxy redireciona corretamente
            const response = await axios.post(
                `${API_URL}/save-team-name`,
                { userId: user._id, teamName },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data.success) {
                login(response.data.user);

                if (response.data.user?.grupo?.teamName) {
                    saveTeamName(response.data.user.grupo.teamName);
                    navigate("/LobbyGrupos");
                } else {
                    console.error("Inconsistência de dados: O servidor indicou sucesso mas os dados do grupo estão ausentes.", response.data);
                    setErrorMessage("Não foi possível obter os detalhes do seu grupo. Tente fazer login novamente para atualizar seus dados.");
                }
            } else {
                setErrorMessage(response.data.message || "Ocorreu um erro ao salvar o nome do grupo.");
            }
        } catch (error) {
            console.error("Erro ao salvar nome do grupo:", error);
            // Tenta pegar a mensagem de erro específica do nosso servidor.
            // Se não houver (ex: falha de rede), exibe uma mensagem genérica.
            const message = error.response?.data?.message || "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
            setErrorMessage(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (user?.grupo) {
        return (
            <div className="background">
                <canvas ref={canvasRef} className="stars"></canvas>
                <div className="welcome-container">
                    <h2>Você já faz parte de um grupo.</h2>
                    <p>Aguarde, estamos redirecionando você para a próxima etapa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="background">
            <canvas ref={canvasRef} className="stars"></canvas>
            <div className="welcome-container">
                <div className="logo-section">
                    <img src="/images/clientes/santander.png" alt="Santander Logo" className="logo-image logo-client" />
                    <div className="title-container"><h2>Missão Interestelar ACEE</h2></div>
                    <img src="/images/ACEE.png" alt="ACEE Logo" className="logo-image logo-acee" />
                </div>
                <div className="welcome-content">
                    <h2>Bem-vindos, Astronautas!</h2>
                    <div className="welcome-text">
                        <p>Em nome da Algencia Central de Exploração Espacial (ACEE)), é um prazer recebê-los a bordo deste Programa de Desenvolvimento de Líderes.</p>
                        <p>Informamos que esta missão simulada foi projetada para desenvolver a sua liderança, em termos de análise e tomada de decisão no trabalho em equipe.</p>
                        <p>O ambiente se dá através de desafios interestelares em uma jornada onde vocês terão de enfrentar situações críticas que exigirão perspicácia, intuição e a observância de virtudes essenciais, que faz parte de um líder que cumpre a sua jornada com qualidade.</p>
                        <p>Aproveitamos para declarar nossa Missão, Visão e Valores a todos vocês:</p>
                        <p><strong>Missão:</strong>Empreender voos espaciais, com foco na visitação e exploração de corpos celestiais, visando a construção de novas colônias para preservação da espécie humana e do seu bem-estar, abrangendo toda comunidade do planeta Terra. </p>
                        <p><strong>Visão:</strong> Ser uma referência respeitada pelos terráqueos e empreendedores do segmento de tecnologia espacial, traduzida pela inteligência e fidelização das agências espaciais à ACEE, gerando a satisfação de stakeholders: governos, órgãos internacionais, investidores, comunidade científica e cidadãos de todo mundo</p>
                        <p><strong>Valores:</strong></p>
                        <ul>
                            <li>Ética, respeito à ciência e à diversidade</li>
                            <li>Cuidados ilimitados com o meio ambiente espacial</li>
                            <li>Sincronicidade entre as estações espaciais e agências estrangeiras, com espírito de equipe</li>
                            <li>Tudo pela vida, paixão pelo ser humano</li>
                            <li>Responsabilidade social, pensando o futuro que é agora</li>
                            <li>Transparência: a informação é chave para tudo, assim como sua comunicação direta</li>
                        </ul>
                        <p>À equipe de jogadores do Galactic Quest, desejamos boa sorte e que vocês voltem em segurança! </p>
                    </div>
                    <div className="signature-section">
                        <img src="/images/Astronautas/Bill_Dale.png" alt="Bill Dale" className="signature-image" />
                        <div>
                            <div className="signature-text">"A liderança não é sobre estar no comando, mas sobre cuidar daqueles sob seu comando."</div>
                            <div className="signature-name">BILL DALE, Presidente e Cientista Chefe ACEE</div>
                        </div>
                    </div>
                </div>
                <div className="team-name-section">
                    <h3>Qual nome escolherá para sua equipe?</h3>
                    <form onSubmit={handleSubmit} className="team-name-input">
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => {
                                setTeamName(e.target.value);
                                if (errorMessage) setErrorMessage("");
                            }}
                            placeholder="Digite o nome da sua equipe..."
                            required
                        />
                        <button type="submit" className="submit-button" disabled={isSubmitting}>
                            {isSubmitting ? "Enviando..." : "Prosseguir"}
                        </button>
                    </form>
                    {errorMessage && <p style={{ color: '#ffb3b3', marginTop: '10px', textShadow: '0 0 5px #000' }}>{errorMessage}</p>}
                </div>
            </div>
        </div>
    );
};

export default BoasVindas;