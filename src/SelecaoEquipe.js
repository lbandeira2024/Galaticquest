import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAudio } from "./AudioManager";
import { useAuth } from "./AuthContext";
import axios from "axios";
import "./selecaoequipe.css";

// CORREÇÃO: Usar rota relativa para Proxy
const API_BASE_URL = "/api";

const SelecaoEquipe = () => {
  const [gifFinished, setGifFinished] = useState(false);
  const [showStaticImage, setShowStaticImage] = useState(true);
  const [showAnimatedGif, setShowAnimatedGif] = useState(false);
  const [showGif, setShowGif] = useState(true);
  const navigate = useNavigate();
  // CORREÇÃO: Adicionado playTrack
  const { playTrack, playSound } = useAudio();
  const canvasRef = useRef(null);

  const { user, login } = useAuth();

  const [selectedShip, setSelectedShip] = useState(null);
  const [shipConfirmed, setShipConfirmed] = useState(false);
  const [activeStep, setActiveStep] = useState(2);

  // CORREÇÃO: Hook para manter a música tocando
  useEffect(() => {
    const currentMusic = "/sounds/trilha_galatica_v1.mp3";
    playTrack(currentMusic, { loop: true, isPrimary: false });
  }, [playTrack]);

  const ships = [
    { id: 1, name: "Andrômeda-X", code: "NX-728", year: "2145", description: "Nave de exploração de longo alcance com sistemas avançados de mapeamento estelar.", speed: "0.8c", capacity: "8 tripulantes", fuel: "Núcleo de fusão ZPM", autonomy: "15 anos", note: "Equipada com escudos de última geração" },
  ];

  const teams = [
    { id: 1, code: "E1", description: "Equipe especializada em exploração", missions: 12, achievements: ["Primeira equipe a mapear o Cinturão de Asteroides X-47", "Desenvolveu sistema de navegação em ambientes de alta gravidade", "Recorde de permanência em ambientes hostis: 487 dias"], members: [{ role: "Coordenador Espacial", name: "Sisifo", experience: "45 anos", details: "Engenheiro Aeroespacial", country: "Espanha" }, { role: "Cientista", name: "Neo", experience: "39 anos", details: "Cientista de Recursos Naturais Raros e Astrobotânica", country: "Americano" }, { role: "Engenheira", name: "Tamara", experience: "32 anos", details: "Física e Engenheira Aero Espacial", country: "Americana" }, { role: "Engenheira", name: "Ares", experience: "39 anos", details: "Engenheira Aeronáutico, PhD em Sist. de Oxigenação sob condições adversas", country: "Espanha" }, { role: "Engenheira", name: "Mae", experience: "37 anos", details: "Engenheira Química, PhD", country: "Americana" }] },
    { id: 2, code: "E2", description: "Equipe especializada em diplomacia", missions: 18, achievements: ["Mediou conflito intercolonial em Marte (2147)", "Equipe com maior índice de resolução pacífica de incidentes", "Desenvolveu protocolos de comunicação intercultural"], members: [{ role: "Coordenadora Espacial", name: "Aletheia", experience: "40 anos", details: "Engenharia Aeronáutica", country: "Romena" }, { role: "Capitão", name: "Kirk", experience: "30 anos", details: "Ergo. Químico, PhD em Matemática e Pepito Espacial", country: "Americano" }, { role: "Cientista", name: "Maureen", experience: "43 anos", details: "Ergo. Astrofísica, PhD em Geometria Espacial", country: "Canadense" }, { role: "Piloto", name: "Hazza Ali", experience: "37 anos", details: "Piloto Militar", country: "Árabe" }, { role: "Engenheiro", name: "Ilia Ramon", experience: "49 anos", details: "Ergo. Aeronáutico e Piloto de Caça", country: "Israelense" }] },
    { id: 3, code: "E3", description: "Equipe especializada em combate", missions: 24, achievements: ["Defesa bem-sucedida da Base Lunar Alpha contra ataque de 2149", "Treinou 87% dos pilotos de combate ativos", "Desenvolveu táticas de defesa em gravidade zero"], members: [{ role: "Coordenador Espacial", name: "Kopenawa", experience: "55 anos", details: "Astrofísico e Engenheiro Espacial", country: "Mexicano" }, { role: "Médico", name: "Marek", experience: "47 anos", details: "Psiquiatra Psicanalista, PhD em Doenças Pós-Espaciais", country: "Tcheco" }, { role: "Nutricionista", name: "Farna", experience: "34 anos", details: "Nutricionista Espacial", country: "Polonesa" }, { role: "Biólogo", name: "Zachary", experience: "42 anos", details: "Biólogo e Infectologista, PhD", country: "Americano" }, { role: "Engenheiro", name: "Iuri", experience: "30 anos", details: "Ergo. Aeronáutico e músico", country: "Ítalo-russo" }, { role: "Tripulante convidada", name: "Zahy", experience: "35 anos", details: "Indígena brasileira", country: "Brasileira" }] },
    { id: 4, code: "E4", description: "Equipe especializada em pesquisa", missions: 15, achievements: ["Descoberta de 3 novos elementos em asteroides", "Desenvolveu sistema de análise de solo planetário em tempo real", "Publicou 47 artigos científicos em revistas de prestígio"], members: [{ role: "Coordenadora Espacial", name: "Deméter", experience: "42 anos", details: "Geóloga espacial, PhD", country: "Canadense" }, { role: "Engenheiro", name: "Semolek", experience: "40 anos", details: "Ergo. Especialista em Sist. de Sensores Espaciais e Aéreos", country: "Russo" }, { role: "Engenheira", name: "Nora", experience: "27 anos", details: "Engenheira Mecânica Especialista em Eventos Espaciais Atípicos", country: "Árabe" }, { role: "Física", name: "Liu", experience: "43 anos", details: "Física Nuclear", country: "Chinesa" }, { role: "Engenheiro", name: "Pétros", experience: "34 anos", details: "Engenheiro de Sistemas", country: "Grego" }] },
    { id: 5, code: "E5", description: "Equipe especializada em engenharia", missions: 21, achievements: ["Projetou o sistema de propulsão usado em 78% das naves atuais", "Recorde de reparos em órbita: 147 em missão única", "Desenvolveu materiais autoregenerativos para cascos de nave"], members: [{ role: "Coordenador Espacial", name: "Aguiles", experience: "35 anos", details: "Ergo. Mecânico Aero Espacial", country: "Italiano" }, { role: "Engenheiro", name: "Noguchi", experience: "38 anos", details: "Engenheiro Aeronáutico", country: "Japonês" }, { role: "Médica", name: "Chiaki", experience: "46 anos", details: "Médica, PhD em doenças espaciais", country: "Japonesa" }, { role: "Engenheiro", name: "Gorjah", experience: "32 anos", details: "Eng. Elétrico PhD em Logística Espacial", country: "Americano" }, { role: "Astrobiólogo", name: "Atena", experience: "38 anos", details: "Astrobiólogo, PhD", country: "Russa" }] }
  ];

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [hoveredTeam, setHoveredTeam] = useState(teams[0]);

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

  const handleConfirmation = async () => {
    if (selectedTeam) {
      if (!user) {
        alert("❌ Erro: Usuário não identificado. Por favor, faça o login novamente.");
        return navigate("/");
      }

      if (!user.grupo) {
        alert("❌ Erro: Grupo não definido. Por favor, retorne à tela de boas-vindas para nomear sua equipe.");
        navigate("/boasvindas");
        return;
      }

      try {
        const response = await axios.put(`${API_BASE_URL}/select-team`, {
          userId: user._id,
          teamCode: selectedTeam.code
        });

        if (response.data.success && response.data.user) {
          console.log("✅ Equipe salva com sucesso no banco de dados!");
          login(response.data.user);
          navigate("/CompraDeMaterial");
        } else {
          alert(`❌ Falha ao salvar a equipe: ${response.data.message}`);
        }
      } catch (error) {
        console.error("Erro na API ao selecionar equipe:", error);
        alert(`❌ Ocorreu um erro de comunicação ao salvar sua escolha: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleStepNavigation = (step) => {
    if ((step === 1 && !shipConfirmed) || (step === 2 && shipConfirmed) || (step === 3 && selectedTeam)) {
      setActiveStep(step);
      playSound("/sounds/02.ui-hover.mp3");
    }
  };

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    setHoveredTeam(team);
    playSound("/sounds/03.system-selection.mp3");
  };

  const handleTeamHover = (team) => {
    if (!selectedTeam) {
      setHoveredTeam(team);
    }
  };

  const handleTeamLeave = () => {
    if (!selectedTeam) {
      setHoveredTeam(teams[0]);
    }
  };

  const getMemberImage = (teamCode, index) => {
    switch (teamCode) {
      case 'E1': return index === 0 ? 'Sisifo' : index === 1 ? 'neo_steves' : index === 2 ? 'tamara' : index === 3 ? 'ares' : 'mae';
      case 'E2': return index === 0 ? 'Aletheia' : index === 1 ? 'Capitao_Kirk' : index === 2 ? 'Dr_Maureen' : index === 3 ? 'Hazza_Ali' : 'Illa_Ramon';
      case 'E3': return index === 0 ? 'Kopenawa' : index === 1 ? 'Marek' : index === 2 ? 'Farna' : index === 3 ? 'Zachary' : index === 4 ? 'Iuri' : 'Zahy';
      case 'E4': return index === 0 ? 'Demeter' : index === 1 ? 'Semolek' : index === 2 ? 'Nora' : index === 3 ? 'Liu' : 'Petros';
      case 'E5': return index === 0 ? 'Aquiles' : index === 1 ? 'Noguchi' : index === 2 ? 'dra_chiaki' : index === 3 ? 'Gorjah' : 'Atena';
      default: return index === 0 ? 'default1' : index === 1 ? 'default2' : index === 2 ? 'default3' : index === 3 ? 'default4' : 'default5';
    }
  };

  const getFlagImage = (country) => {
    const countryMap = { "Espanha": "spain", "Americano": "usa", "Americana": "usa", "Romena": "romania", "Canadense": "canada", "Árabe": "saudi-arabia", "Israelense": "israel", "Mexicano": "mexico", "Tcheco": "czech-republic", "Polonesa": "poland", "Brasileira": "brazil", "Russo": "russia", "Russa": "russia", "Chinesa": "china", "Grego": "greece", "Italiano": "italy", "Japonês": "japan", "Japonesa": "japan", "Ítalo-russo": "italy" };
    return countryMap[country] || "unknown";
  };

  return (
    <div className="background_equipe">
      <canvas ref={canvasRef} className="stars_equipe"></canvas>
      <div className="game-info_equipe">
        <h2>Seleção de Tripulação</h2>
        <p>
          Escolha cuidadosamente sua tripulação que vai seguir para a missão interestelar.
          Cada grupo possui experiências diferentes e características únicas.
        </p>
        <div className="mission-steps_equipe">
          <div className={`step-container_equipe step-inactive_equipe`} onClick={() => navigate('/selecaonave')}>
            <div className="step-circle_equipe">1</div>
            <div className="step-text_equipe">Seleção de Nave</div>
          </div>
          <div className="digital-arrow_equipe"></div>
          <div className={`step-container_equipe step-active_equipe`}>
            <div className="step-circle_equipe">2</div>
            <div className="step-text_equipe">Seleção de Tripulação</div>
          </div>
          <div className="digital-arrow_equipe"></div>
          <div className={`step-container_equipe step-inactive_equipe`}>
            <div className="step-circle_equipe">3</div>
            <div className="step-text_equipe">Loja & itens pessoais</div>
          </div>
          <div className="digital-arrow_equipe"></div>
          <div className={`step-container_equipe step-inactive_equipe`}>
            <div className="step-circle_equipe">4</div>
            <div className="step-text_equipe">Seleção de Rota Estelar</div>
          </div>
        </div>
      </div>
      <div className="selection-container_equipe">
        <div className="ship-details_equipe" style={{ width: '100%', padding: '20px', position: 'relative' }}>
          <h4>Seleção de Tripulação  <h3>Passe o mouse sobre uma equipe para ver seus detalhes</h3> </h4>
          <div className={`team-photo-container_equipe ${hoveredTeam ? 'visible_equipe' : ''}`}>
            {hoveredTeam && (
              <>
                <img src={`/images/Astronautas/E${hoveredTeam.id}/Equipe${hoveredTeam.id}.gif`} alt={`Equipe ${hoveredTeam.code}`} className="team-photo_equipe" />
                <div className="team-photo-caption_equipe">Equipe {hoveredTeam.code}</div>
              </>
            )}
          </div>
          <div className="team-definition_equipe">
            {hoveredTeam || selectedTeam ? (
              <>
                <h2>Equipe {(hoveredTeam || selectedTeam).code}</h2>
                <p><strong>Especialização:</strong> {(hoveredTeam || selectedTeam).description}</p>
                <p><strong>Missões completadas:</strong> {(hoveredTeam || selectedTeam).missions}</p>
                <p><strong>Experiência média:</strong> 7+ anos</p>
                <div className="team-achievements_equipe">
                  <strong>Principais Conquistas:</strong>
                  <ul>
                    {(hoveredTeam || selectedTeam).achievements.map((achievement, index) => (<li key={index}>{achievement}</li>))}
                  </ul>
                </div>
              </>
            ) : (
              <p>Passe o mouse sobre uma equipe para ver seus detalhes</p>
            )}
          </div>
          <div className="team-grid_equipe">
            {teams.map(team => (
              <div key={team.id} className={`team-column_equipe ${selectedTeam?.id === team.id ? "selected_equipe" : ""} ${!selectedTeam && hoveredTeam?.id === team.id ? "hovered_equipe" : ""}`} onMouseEnter={() => handleTeamHover(team)} onMouseLeave={handleTeamLeave} onClick={() => handleTeamSelect(team)}>
                <div className="team-header_equipe">{team.code}</div>
                {team.members.map((member, index) => (
                  <div key={index} className="team-member_equipe">
                    <img src={`/images/Astronautas/${team.code}/${getMemberImage(team.code, index)}.png`} alt={member.name} className="team-member-avatar" />
                    <div className="team-member-details">
                      <div className="team-member-role">{member.role}</div>
                      <div className="team-member-name-container">
                        <span>{member.name}</span>
                        <div className="member-flag-container">
                          <img src={`/images/flags/${getFlagImage(member.country)}.png`} alt={member.country} className="member-flag" />
                          <span className="member-flag-tooltip">{member.country}</span>
                        </div>
                      </div>
                      <div className="team-member-experience">{member.experience} -{member.details}  </div>
                    </div>
                  </div>
                ))}
                <button className="select-team-button_equipe" onClick={() => handleTeamSelect(team)} disabled={selectedTeam !== null && selectedTeam.id !== team.id}>
                  {selectedTeam?.id === team.id ? "Selecionado" : "Selecionar"}
                </button>
              </div>
            ))}
          </div>
          {selectedTeam && (
            <div className="continue-arrow-container_equipe">
              <div className="continue-arrow_equipe visible_equipe" onClick={handleConfirmation}>
                <span className="continue-text_equipe">Loja & Itens Pessoais</span>
                <svg className="arrow-icon_equipe" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelecaoEquipe;