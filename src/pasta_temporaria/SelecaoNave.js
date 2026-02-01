import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAudio } from "./AudioManager";
import { useAuth } from "./AuthContext";
import { useConfig } from './ConfigContext'; // ADIÇÃO: Importa o config
import axios from "axios";
import "./selecao.css";

// REMOÇÃO: A linha da API_BASE_URL foi removida daqui

const SelecaoNave = () => {
  // Animation control states
  const [gifFinished, setGifFinished] = useState(false);
  const [showStaticImage, setShowStaticImage] = useState(true);
  const [showAnimatedGif, setShowAnimatedGif] = useState(false);

  // Navigation and audio hooks
  const navigate = useNavigate();
  const { playSound } = useAudio();
  const { user, login } = useAuth();
  const { apiBaseUrl } = useConfig(); // ADIÇÃO: Obtém a URL do contexto
  const API_BASE_URL = apiBaseUrl;   // ADIÇÃO: Atribui à constante

  // Refs and ship selection states
  const canvasRef = useRef(null);
  const [selectedShip, setSelectedShip] = useState(null);
  const [shipConfirmed, setShipConfirmed] = useState(false);

  const ships = [
    { id: 1, code: "ARTEMIS1", name: "Artemis I", image: "/images/naves/01.Artemis1.png", year: "2104", description: "Primeira nave interestelar construída pela humanidade. Tecnologia antiga, mas extremamente confiável.", speed: "86.340.227 km/h (8% da velocidade da luz)", capacity: "100 tripulantes", fuel: "Excelente – usa reatores de fusão com reciclagem total de matéria.", autonomy: "2 anos", weightLimit: "500 toneladas", recommendedSpeed: "0.08c (24.000 km/s)", fuelCapacity: "200 toneladas", oxygenCapacity: "61.3 toneladas", provisionsCapacity: "109.5 toneladas", },
    { id: 2, code: "OBERONX", name: "Oberon X", image: "/images/naves/02.oberonX.png", year: "2135", description: "Projeto militar desativado, adaptado para exploração. Equilibrada e confiável.", speed: "129.510.342 km/h", capacity: "80 tripulantes", fuel: "Boa – utiliza células de antimatéria com controle automatizado.", autonomy: "4 anos", weightLimit: "300 toneladas", recommendedSpeed: "0.12c (36.000 km/s)", fuelCapacity: "150 toneladas", oxygenCapacity: "98.1 toneladas (4 anos)", provisionsCapacity: "175.2 toneladas (4 anos)" },
    { id: 3, code: "GAIANOVA", name: "Gaia Nova", image: "/images/naves/03.Gaia_Nova.png", year: "2158", description: "Nave de colonização com amplo espaço interno e sistema de IA agrícola.", speed: "107.925.585 km/h", capacity: "300 passageiros", fuel: "Razoável – compartimentos de reciclagem energéticos medianos.", autonomy: "3 anos", weightLimit: "1.000 toneladas", recommendedSpeed: "0.10c (30.000 km/s)", fuelCapacity: "400 toneladas", oxygenCapacity: "275.9 toneladas", provisionsCapacity: "492.8 toneladas" },
    { id: 4, code: "STRATUSV", name: "Stratus V", image: "/images/naves/04.StratusV.png", year: "2187", description: "Nave de luxo para viagens interestelares curtas. Mais conforto que eficiência.", speed: "194.266.053 km/h", capacity: "60 passageiros", fuel: "Ruim – consome energia rapidamente para manter suporte de vida e entretenimento.", autonomy: "1 ano", weightLimit: "200 toneladas", recommendedSpeed: "0.18c (54.000 km/s)", fuelCapacity: "80 toneladas", oxygenCapacity: "18.4 toneladas", provisionsCapacity: "32.9 toneladas" },
    { id: 5, code: "NEOECLIPSE", name: "Neon Eclipse", image: "/images/naves/05.Neo_Eclipse.png", year: "2213", description: "Nave mais recente, com motor de dobra parcial. Incrivelmente rápida, mas altamente ineficiente.", speed: "539.627.925 km/h (com impulsos breves de dobra espacial)", capacity: "20 passageiros", fuel: "Péssima – requer recarga constante de matéria exótica.", autonomy: "9 meses", weightLimit: "100 toneladas", recommendedSpeed: "0.5c (150.000 km/s)", fuelCapacity: "30 toneladas", oxygenCapacity: "4.5 toneladas", provisionsCapacity: "8.1 toneladas", }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const stars = Array.from({ length: 150 }, () => ({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, radius: Math.random() * 1.5, speed: Math.random() * 0.3 + 0.1, }));
    const animateStars = () => {
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
      requestAnimationFrame(animateStars);
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
    };
  }, []);

  useEffect(() => {
    const staticTimer = setTimeout(() => {
      setShowStaticImage(false);
      setShowAnimatedGif(true);
      const gifTimer = setTimeout(() => {
        setShowAnimatedGif(false);
        setGifFinished(true);
      }, 5000);
      return () => {
        clearTimeout(staticTimer);
        clearTimeout(gifTimer);
      };
    }, 5000);
    return () => clearTimeout(staticTimer);
  }, []);

  const handleShipSelect = (ship) => {
    if (!shipConfirmed) {
      setSelectedShip(ship);
    }
  };

  // **** INÍCIO DA CORREÇÃO ****
  const handleConfirmation = async () => {
    if (selectedShip && !shipConfirmed) {
      if (!user) {
        alert("❌ Erro: Usuário não identificado. Por favor, faça o login novamente.");
        navigate("/");
        return;
      }

      // Verifica se o usuário já tem um grupo. Se não, algo está errado no fluxo.
      if (!user.grupo) {
        alert("❌ Erro: Grupo não definido. Por favor, retorne à tela de boas-vindas para nomear sua equipe.");
        navigate("/boasvindas");
        return;
      }

      // ADIÇÃO: Verifica se a URL da API foi carregada
      if (!API_BASE_URL) {
        alert("❌ Erro de configuração: A URL da API não foi encontrada.");
        return;
      }

      try {
        playSound("/sounds/03.system-selection.mp3");
        // MODIFICAÇÃO: A URL agora vem do contexto
        const response = await axios.put(`${API_BASE_URL}/select-ship`, {
          userId: user._id,
          shipId: selectedShip.code
        });

        // A API agora retorna o usuário atualizado.
        if (response.data.success && response.data.user) {
          console.log("✅ Nave salva com sucesso no banco de dados!");
          // Atualiza o contexto com os dados mais recentes.
          login(response.data.user);
          setShipConfirmed(true);
        } else {
          alert(`❌ Falha ao salvar a nave: ${response.data.message}`);
        }
      } catch (error) {
        console.error("Erro na API ao selecionar a nave:", error);
        alert(`❌ Ocorreu um erro de comunicação ao salvar sua escolha: ${error.response?.data?.message || error.message}`);
      }
    } else if (shipConfirmed) {
      // Se a nave já está confirmada, o clique na seta leva para a próxima tela.
      navigate("/SelecaoEquipe");
    }
  };
  // **** FIM DA CORREÇÃO ****

  return (
    <div className="background">
      <canvas ref={canvasRef} className="stars"></canvas>

      <div className="game-info">
        <h3>Seleção de Nave</h3>
        <p>
          Escolha cuidadosamente sua nave para a missão interestelar.
          Cada nave tem características únicas que afetarão sua jornada através do cosmos.
        </p>

        <div className="mission-steps">
          <div className="step-container step-active">
            <div className="step-circle">1</div>
            <div className="step-text">Seleção de Nave</div>
          </div>
          <div className="digital-arrow"></div>
          <div className="step-container step-inactive">
            <div className="step-circle">2</div>
            <div className="step-text">Seleção de Tripulação</div>
          </div>
          <div className="digital-arrow"></div>
          <div className="step-container step-inactive">
            <div className="step-circle">3</div>
            <div className="step-text">Loja & itens pessoais</div>
          </div>
          <div className="digital-arrow"></div>
          <div className="step-container step-inactive">
            <div className="step-circle">4</div>
            <div className="step-text">Seleção de Rota Estelar</div>
          </div>
        </div>
      </div>

      <div className="selection-container">
        <div className="ships-section">
          <h2>Frota Disponível</h2>
          {ships.map((ship) => (
            <div
              key={ship.id}
              className={`ship-option ${selectedShip?.id === ship.id ? "selected" : ""} ${shipConfirmed ? "disabled" : ""}`}
              onClick={() => handleShipSelect(ship)}
            >
              <img src={ship.image} alt={ship.name} className="ship-image" />
              <div>
                <h3>{ship.name}</h3>
                <p><strong>Ano:</strong> {ship.year}</p>
                <p><strong>Velocidade:</strong> {ship.speed}</p>
                <p><strong>Capacidade:</strong> {ship.capacity}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="ship-details">
          {selectedShip ? (
            <>
              <h2>{selectedShip.name}</h2>
              <div className="ship-details-grid">
                <div className="ship-detail-item"><strong>ANO</strong><span>{selectedShip.year}</span></div>
                <div className="ship-detail-item"><strong>VELOCIDADE</strong><span>{selectedShip.speed}</span></div>
                <div className="ship-detail-item"><strong>CAPACIDADE</strong><span>{selectedShip.capacity}</span></div>
                <div className="ship-detail-item"><strong>PESO MÁXIMO</strong><span>{selectedShip.weightLimit}</span></div>
                <div className="ship-detail-item"><strong>COMBUSTÍVEL MÁXIMO</strong><span>{selectedShip.fuelCapacity}</span></div>
                <div className="ship-detail-item"><strong>OXIGÊNIO MÁXIMO</strong><span>{selectedShip.oxygenCapacity}</span></div>
                <div className="ship-detail-item"><strong>PROVISÕES MÁXIMO</strong><span>{selectedShip.provisionsCapacity}</span></div>
                <div className="ship-detail-item"><strong>AUTONOMIA</strong><span>{selectedShip.autonomy}</span></div>
              </div>
              <p className="ship-description">{selectedShip.description}</p>
              <button
                className="select-button"
                onClick={handleConfirmation}
                disabled={shipConfirmed}
              >
                {shipConfirmed ? "Nave Confirmada" : "Confirmar Nave"}
              </button>
              <div
                className={`continue-arrow ${shipConfirmed ? "visible" : ""}`}
                onClick={handleConfirmation}
              >
                <span className="continue-text">Tripulação</span>
                <svg className="arrow-icon" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </>
          ) : (
            <div className="no-ship-selected">
              <h3>Nenhuma nave selecionada</h3>
              <p>Clique em uma nave à esquerda para ver seus detalhes técnicos e capacidades.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelecaoNave;