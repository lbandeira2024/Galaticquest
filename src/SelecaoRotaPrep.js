import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAudio } from "./AudioManager";
import "./SelecaoRotaPrep.css";
import { useAuth } from './AuthContext';
import { useConfig } from './ConfigContext';

const StellarMapPlan = lazy(() => import('./Planejamento-Rota/StellarMapPlan').catch(() => ({
    default: () => <div className="map-fallback">Mapa Estelar Indisponível</div>
})));

const SelecaoRotaPrep = () => {
    const [plannedRoute, setPlannedRoute] = useState(null);
    const [routeConfirmed, setRouteConfirmed] = useState(false);
    const navigate = useNavigate();

    // IMPORTANTE: Trazemos o unlockAudio aqui
    const { playTrack, playSound, unlockAudio } = useAudio();

    const canvasRef = useRef(null);
    const [routePlanned, setRoutePlanned] = useState(false);

    const { user } = useAuth();
    const { apiBaseUrl } = useConfig();
    const API_BASE_URL = apiBaseUrl;

    // GUARDA: esta tela (Passo 4 — Planejamento de Rota) nunca verificava
    // se o jogador já tinha escolhido uma nave. Antes, dava pra chegar
    // aqui sem nave (ex.: via login.js, que mandava todo mundo direto pra
    // cá) e ainda planejar uma rota e "Iniciar Missão" sem nave nenhuma
    // selecionada. Redireciona pra Seleção de Nave se faltar esse passo,
    // não importa como o jogador chegou até aqui.
    useEffect(() => {
        let cancelled = false;
        const checkNaveEscolhida = async () => {
            if (!user?._id || !API_BASE_URL) return;
            try {
                const response = await fetch(`${API_BASE_URL}/${user._id}/game-data`);
                const data = await response.json();
                if (!cancelled && (!data.success || !data.naveEscolhida)) {
                    navigate('/selecaonave', { replace: true });
                }
            } catch (error) {
                console.error("Erro ao verificar nave escolhida:", error);
            }
        };
        checkNaveEscolhida();
        return () => { cancelled = true; };
    }, [user, API_BASE_URL, navigate]);

    useEffect(() => {
        const currentMusic = "/sounds/trilha_galatica_v1.mp3";
        playTrack(currentMusic, { loop: true, isPrimary: false, volume: 0.5 });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const stars = Array(200).fill().map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.1
        }));

        let animationFrameId;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
                star.y += star.speed;
                if (star.y > canvas.height) {
                    star.y = 0;
                    star.x = Math.random() * canvas.width;
                }
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [playTrack]);

    const handleResetRoute = () => {
        setRoutePlanned(false);
        setRouteConfirmed(false);
    };

    const handleConfirmRoute = (route) => {
        playSound("/sounds/03.system-selection.mp3");
        setRoutePlanned(true);
        setRouteConfirmed(true);
        setPlannedRoute(route);
    };

    const saveInitialRoute = async (route) => {
        if (!user?._id || !API_BASE_URL) {
            console.error("Usuário ou URL da API não definidos.");
            return false;
        }

        const dataToSave = {
            rotaPlanejada: route.steps,
            routeIndex: 0
        };

        try {
            const response = await fetch(`${API_BASE_URL}/${user._id}/update-gamedata`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave),
            });

            if (response.ok) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error("Erro de rede ao salvar rota inicial:", error);
            return false;
        }
    };

    const handleStartMission = async () => {
        if (routePlanned && plannedRoute?.steps?.length > 1) {

            // --- CRÍTICO PARA O AMPLIFY ---
            // Este clique libera o áudio para todo o domínio.
            // A próxima tela (Decolagem) herdará essa permissão.
            unlockAudio();

            const saveSuccess = await saveInitialRoute(plannedRoute);

            if (saveSuccess) {
                sessionStorage.removeItem('missionTime');
                navigate("/decolagem-marte");
            } else {
                alert("Erro ao salvar a rota no servidor. Tente novamente.");
            }
        }
    };

    const handleBack = () => {
        playSound("/sounds/03.system-selection.mp3");
        navigate("/SelecaoRota");
    };

    return (
        <div className="background_rota_prep">
            <canvas ref={canvasRef} className="stars_rota_prep"></canvas>
            <div className="game-info_rota_prep">
                <h3>Planejamento de Rota Estelar</h3>
                <p>Planeje cuidadosamente sua trajetória através do sistema solar para maximizar a eficiência da sua missão.</p>
                <div className="mission-steps_rota_prep">
                    <div className={`step-container_rota_prep step-inactive_rota_prep`}><div className="step-circle_rota_prep">1</div><div className="step-text_rota_prep">Seleção de Nave</div></div>
                    <div className="digital-arrow_rota_prep"></div>
                    <div className={`step-container_rota_prep step-inactive_rota_prep`}><div className="step-circle_rota_prep">2</div><div className="step-text_rota_prep">Seleção de Tripulação</div></div>
                    <div className="digital-arrow_rota_prep"></div>
                    <div className={`step-container_rota_prep step-inactive_rota_prep`}><div className="step-circle_rota_prep">3</div><div className="step-text_rota_prep">Loja & Itens Pessoais</div></div>
                    <div className="digital-arrow_rota_prep"></div>
                    <div className={`step-container_rota_prep step-active_rota_prep`}><div className="step-circle_rota_prep">4</div><div className="step-text_rota_prep">Seleção de Rota Estelar</div></div>
                </div>
            </div>
            <div className="selection-container_rota_prep">
                <div className="stellar-map-container">
                    <Suspense fallback={<div className="loading-map">Carregando Mapa Estelar...</div>}>
                        <StellarMapPlan
                            onRouteComplete={handleConfirmRoute}
                            onRouteReset={handleResetRoute}
                            allowSos={false}
                        />
                    </Suspense>
                </div>
                <div className="nav-buttons_rota_prep">
                    <button className="nav-button_rota_prep" onClick={handleBack}>Voltar</button>
                    <button className="nav-button_rota_prep" onClick={handleStartMission} disabled={!routeConfirmed}>
                        Iniciar Missão
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelecaoRotaPrep;