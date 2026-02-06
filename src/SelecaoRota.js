import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAudio } from "./AudioManager";
import { useConfig } from "./ConfigContext"; // <--- NOVO IMPORT
import "./selecaorota.css";
import distanceData from './Planejamento-Rota/fixed_transfer_distances.json';

const SelecaoRota = () => {
  const navigate = useNavigate();
  const { playTrack, playSound } = useAudio();

  // <--- CORREÇÃO 1: Usando a URL dinâmica da configuração global
  const { apiBaseUrl } = useConfig();

  const canvasRef = useRef(null);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [showRouteSelection, setShowRouteSelection] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Mantendo a correção de sessionStorage para localStorage
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser._id) {
      setUserId(storedUser._id);
    }
  }, []);

  const transferTypes = [
    {
      name: "Transferência de Hohmann",
      color: "laranja",
      description: "Trajetória orbital mais eficiente em termos de energia para viajar entre duas órbitas circulares no mesmo plano."
    },
    {
      name: "Transferência direta",
      color: "azul",
      description: "Trajetória mais rápida diretamente ao alvo, consumindo mais combustível."
    },
    {
      name: "Assistência gravitacional",
      color: "purpura",
      description: "Uso da gravidade de um planeta para alterar a velocidade e direção da nave, economizando combustível."
    }
  ];

  const planetas = [
    { id: 1, nome: "Marte", imagem: "/images/Planets/marte.png", cor: "laranja", descricao: "Marte, o Planeta Vermelho, possui condições relativamente favoráveis para estabelecimento humano.", transferencia: "Transferência de Hohmann" },
    { id: 2, nome: "Mercurio", imagem: "/images/Planets/mercurio.png", cor: "purpura", descricao: "Mercúrio oferece desafios extremos de temperatura mas recursos minerais valiosos.", transferencia: "Assistência gravitacional" },
    { id: 3, nome: "Venus", imagem: "/images/Planets/venus.png", cor: "laranja", descricao: "Vênus representa um desafio científico e tecnológico com sua atmosfera densa.", transferencia: "Transferência de Hohmann" },
    { id: 4, nome: "Lua", imagem: "/images/Planets/lua.png", cor: "azul", descricao: "Nossa Lua serve como base para missões mais distantes.", transferencia: "Transferência direta" }
  ];

  const handlePlanetSelect = (planeta) => {
    playSound("/sounds/03.system-selection.mp3");
    setSelectedPlanet(planeta);
  };

  const estimateFuel = (distance, transferType) => {
    const transferTypeMap = {
      'Transferência de Hohmann': 'hohmann',
      'Transferência direta': 'direct',
      'Assistência gravitacional': 'gravity-assist'
    };
    const typeKey = transferTypeMap[transferType] || 'hohmann';

    const fuelFactors = {
      'direct': 0.5,
      'hohmann': 1.0,
      'gravity-assist': 1.8
    };
    const baseFuel = distance / 5000;
    return Math.round(baseFuel * fuelFactors[typeKey]);
  };

  // <--- CORREÇÃO 2: Função agora retorna true/false para controlar fluxo
  const saveInitialRoute = async (routeSteps) => {
    if (!userId) {
      console.error("User ID não disponível. Não é possível salvar a rota.");
      return false;
    }

    if (!apiBaseUrl) {
      console.error("API URL não definida.");
      return false;
    }

    try {
      // Substituído localhost por apiBaseUrl
      const response = await fetch(`${apiBaseUrl}/save-planned-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, routeSteps }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Rota inicial salva com sucesso no banco de dados:", data.usuario.rotaPlanejada);
        return true; // Sucesso
      } else {
        console.error("Erro ao salvar rota inicial:", data.message);
        return false; // Falha lógica
      }
    } catch (error) {
      console.error("Erro de rede ao salvar rota inicial:", error);
      return false; // Falha de rede
    }
  };

  const handleStartMission = async () => {
    if (selectedPlanet && userId) {
      const distanceKey = `Terra_${selectedPlanet.nome.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const distanceKm = distanceData[distanceKey] || 0;
      const fuel = estimateFuel(distanceKm, selectedPlanet.transferencia);

      const routeSteps = [
        { name: "Terra", distance: 0, fuel: 0, from: "Origem" },
        { name: selectedPlanet.nome, distance: distanceKm, fuel: fuel, from: "Terra" }
      ];

      // <--- CORREÇÃO 3: Aguarda (await) a confirmação do banco antes de mudar de tela
      const saveSuccess = await saveInitialRoute(routeSteps);

      if (saveSuccess) {
        // Limpa o tempo da missão anterior antes de iniciar uma nova.
        sessionStorage.removeItem('missionTime');

        // Só navega se salvou com sucesso
        navigate("/decolagem-marte", { state: { selectedPlanet, distanceKm } });
      } else {
        alert("Houve um erro ao salvar sua rota. Tente novamente.");
      }

    } else {
      console.error("É necessário selecionar um planeta e estar logado para iniciar a missão.");
    }
  };

  const handlePlanRoute = () => {
    playSound("/sounds/03.system-selection.mp3");
    navigate("/selecao-rota-prep");
  };

  const handleSkipRoutePlanning = () => {
    playSound("/sounds/03.system-selection.mp3");
    setShowRouteSelection(true);
  };

  useEffect(() => {
    const currentMusic = "/sounds/trilha_galatica_v1.mp3";
    playTrack(currentMusic, { loop: true, isPrimary: false });

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

  return (
    <div className="background_equipe">
      <canvas ref={canvasRef} className="stars_equipe"></canvas>

      {!showRouteSelection ? (
        <div className="initial-route-screen">
          <div className="initial-route-container">
            <h3>Plano de Viagem</h3>
            <p>Você deseja planejar sua rota estelar agora ou partir e planejar durante a viagem?</p>
            <div className="route-options">
              <button className="route-option-button" onClick={handlePlanRoute}>Planejar Rota</button>
              <button className="route-option-button" onClick={handleSkipRoutePlanning}>Partir e planejar Rota depois</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="game-info_equipe">
            <h3>Seleção de Rota Estelar</h3>
            <p>Escolha cuidadosamente a rota inicial para maximizar a eficiência da sua equipe nesta corrida espacial.</p>
            <div className="mission-steps_equipe">
              <div className={`step-container_equipe step-inactive_equipe`}><div className="step-circle_equipe">1</div><div className="step-text_equipe">Seleção de Nave</div></div>
              <div className="digital-arrow_equipe"></div>
              <div className={`step-container_equipe step-inactive_equipe`}><div className="step-circle_equipe">2</div><div className="step-text_equipe">Seleção de Tripulação</div></div>
              <div className="digital-arrow_equipe"></div>
              <div className={`step-container_equipe step-inactive_equipe`}><div className="step-circle_equipe">3</div><div className="step-text_equipe">Loja & Itens Pessoais</div></div>
              <div className="digital-arrow_equipe"></div>
              <div className={`step-container_equipe step-active_equipe`}><div className="step-circle_equipe">4</div><div className="step-text_equipe">Seleção de Rota Estelar</div></div>
            </div>
          </div>

          <div className="selection-container_equipe">
            <div className="container-rota">
              <h1 className="titulo-rota">Seleção de Rota Estelar</h1>
              <div className="planet-routes">
                {planetas.map(planeta => (
                  <div key={planeta.id} className={`rota-card ${selectedPlanet && selectedPlanet.id !== planeta.id ? "disabled" : ""}`} onClick={() => handlePlanetSelect(planeta)}>
                    <div className={`transfer-bar ${planeta.cor}`}></div>
                    <div className="card-content">
                      <div className="planet-image-container"><img src={planeta.imagem} alt={planeta.nome} className="planet-image" /></div>
                      <h3>{planeta.nome}</h3>
                      <button className={`select-planet-button ${selectedPlanet?.id === planeta.id ? "selected" : ""}`} disabled={selectedPlanet && selectedPlanet.id !== planeta.id}>
                        {selectedPlanet?.id === planeta.id ? "Selecionado" : "Selecionar"}
                      </button>
                    </div>
                    <div className="planet-description"><p>{planeta.descricao}</p></div>
                  </div>
                ))}
              </div>
              <div className="legend-container">
                {transferTypes.map((type) => (
                  <div className="legend-item" key={type.color}>
                    <div className={`legend-color ${type.color}`}></div>
                    <div className="legend-tooltip">
                      <span className="legend-text">{type.name}</span>
                      <div className="legend-description">{type.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedPlanet && (<button className="start-mission-button" onClick={handleStartMission}>Iniciar Missão</button>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SelecaoRota;