import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import "./FullscreenWarning.css";

// Componentes da Aplicação
import CadastroForm from "./CadastroForm";
import Login from "./login";
import TelaPlaneta from "./TelaPlaneta";
import DecolagemMarte from "./DecolagemMarte";
// import StellarMap from './stellar-map/StellarMap'; // <--- (COMENTADO PARA CORRIGIR ERRO)
import SelecaoNave from "./SelecaoNave";
import SelecaoEquipe from "./SelecaoEquipe";
import SelecaoRota from "./SelecaoRota";
import PlanejamentoRota from "./Planejamento-Rota/StellarMapPlan";
import MandalaVirtudes from "./MandalaVirtudes";
import Inventario from "./CompraDeMaterial";
import SelecaoRotaPrep from "./SelecaoRotaPrep";
import PlanejamentoRotaPrep from "./Planejamento-Rota/StellarMapPlanPrep";
import BoasVindas from "./BoasVindas";
import LobbyGrupos from "./LobbyGrupos";
import ContadorRegressivo from "./ContadorRegressivo";
import AdminPage from "./AdminPage";
import GameConfig from "./GameConfig";

// Context Providers
import { AudioProvider, useAudio } from "./AudioManager";
import { PauseProvider } from "./PauseContext";
import { AuthProvider } from "./AuthContext";
import { SpaceCoinsProvider } from "./SpaceCoinsContext";
import { ConfigProvider, useConfig } from "./ConfigContext";

/**
 * Novo componente Wrapper (Inicializador).
 */
function AppInitializer() {
  const { user } = useAuth();
  const { apiBaseUrl } = useConfig();
  const [currentUserGameNumber, setCurrentUserGameNumber] = useState(null);
  const [initialPauseState, setInitialPauseState] = useState(false);

  useEffect(() => {
    const fetchUserGameData = async () => {
      if (user && user._id && !user.administrador) {
        try {
          const response = await fetch(`${apiBaseUrl}/${user._id}/game-data`);
          const data = await response.json();

          if (data.success) {
            if (data.gameNumber) {
              setCurrentUserGameNumber(data.gameNumber);
            }
            if (data.isPaused) {
              setInitialPauseState(data.isPaused);
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados para o PauseContext:", error);
        }
      } else if (user && user.administrador) {
        setCurrentUserGameNumber(null);
      }
    };

    fetchUserGameData();
  }, [user, apiBaseUrl]);

  return (
    <PauseProvider
      gameNumber={currentUserGameNumber}
      apiBaseUrl={apiBaseUrl}
      initialPauseState={initialPauseState}
    >
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </PauseProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const { stopAllAudio, stopMusic } = useAudio();
  const { user } = useAuth();
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);

  const prevPathRef = useRef(location.pathname);

  const enterFullScreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (user && !document.fullscreenElement) {
        setShowFullscreenWarning(true);
      }
    };

    if (user) {
      document.addEventListener("fullscreenchange", handleFullscreenChange);
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [user]);

  const handleStay = () => {
    setShowFullscreenWarning(false);
    enterFullScreen();
  };

  const handleExit = () => {
    setShowFullscreenWarning(false);
  };

  useEffect(() => {
    const prev = prevPathRef.current;
    const curr = location.pathname;

    // Ao ENTRAR na decolagem: pare apenas a trilha (não mata o primário)
    if (curr === "/decolagem-marte" && prev !== "/decolagem-marte") {
      stopMusic();
    }

    // Ao SAIR da decolagem: limpa tudo para não vazar sons entre telas
    if (prev === "/decolagem-marte" && curr !== "/decolagem-marte") {
      stopAllAudio();
    }

    prevPathRef.current = curr;
  }, [location.pathname, stopAllAudio, stopMusic]);

  return (
    <>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/game/:gameNumber" element={<GameConfig />} />

        <Route path="/ContadorRegressivo" element={<ContadorRegressivo />} />
        <Route path="/BoasVindas" element={<BoasVindas />} />
        <Route path="/LobbyGrupos" element={<LobbyGrupos />} />

        <Route path="/StellarMapPlanPrep" element={<PlanejamentoRotaPrep />} />
        <Route path="/selecao-rota-prep" element={<SelecaoRotaPrep />} />
        <Route path="/CompraDeMaterial" element={<Inventario />} />
        <Route path="/mandala-virtudes" element={<MandalaVirtudes />} />
        <Route path="/stellar-map-Plan" element={<PlanejamentoRota />} />
        <Route path="/SelecaoRota" element={<SelecaoRota />} />
        <Route path="/SelecaoEquipe" element={<SelecaoEquipe />} />
        <Route path="/SelecaoNave" element={<SelecaoNave />} />

        {/* Rota temporariamente desativada pois o arquivo não foi encontrado */}
        {/* <Route path="/stellar-map" element={<StellarMap />} /> */}

        <Route path="/" element={<CadastroForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/telaplaneta" element={<TelaPlaneta />} />
        <Route path="/decolagem-marte" element={<DecolagemMarte />} />
        <Route path="*" element={<div>Página não encontrada</div>} />
      </Routes>

      {showFullscreenWarning && (
        <div className="fullscreen-warning-overlay">
          <div className="fullscreen-warning-box">
            <h2>Modo Janela Ativado</h2>
            <p>Para garantir a melhor imersão no jogo, recomendamos permanecer em tela cheia.</p>
            <div className="fullscreen-warning-buttons">
              <button onClick={handleExit} className="button-exit">
                Sair
              </button>
              <button onClick={handleStay} className="button-stay">
                Permanecer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <SpaceCoinsProvider>
          <Router>
            <AppInitializer />
          </Router>
        </SpaceCoinsProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
