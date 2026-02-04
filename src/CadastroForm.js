import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./CadastroForm.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useAudio } from "./AudioManager";
import { useAuth } from "./AuthContext";
import { useTranslation } from "react-i18next";
import { decryptData } from "./crypto";

const CadastroForm = () => {
  // Configuração da API relativa para funcionar com o Proxy do Amplify
  const API_BASE_URL = "/api";

  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { playTrack, unlockAudio } = useAudio();
  const { login } = useAuth();

  const [version, setVersion] = useState("");
  const languageMap = { pt: 'brazil', es: 'spain', en: 'usa', it: 'italy' };
  const [selectedLanguage, setSelectedLanguage] = useState(languageMap[i18n.language] || "brazil");

  const [loginData, setLoginData] = useState({ email: "", senha: "" });

  // Estados para as listas do Dropdown
  const [companiesList, setCompaniesList] = useState([]);
  const [regionalsList, setRegionalsList] = useState([]);

  const searchParams = new URLSearchParams(location.search);
  const encryptedData = searchParams.get("data");
  let decryptedParams = {};

  if (encryptedData) {
    const data = decryptData(encryptedData);
    if (data) decryptedParams = data;
  }

  const prefilledName = decryptedParams.nome || "";
  const prefilledEmail = decryptedParams.email || "";
  const prefilledRegional = decryptedParams.regional || "";
  const prefilledEmpresa = decryptedParams.empresa || "";
  const prefilledCargo = decryptedParams.cargo || "";
  const prefilledSetor = decryptedParams.setor || "";

  const isUpdateMode = !!prefilledEmail && prefilledName !== "";

  const [registerData, setRegisterData] = useState({
    nome: prefilledName,
    empresa: prefilledEmpresa,
    dataNascimento: "",
    email: prefilledEmail,
    senha: "",
    setor: prefilledSetor,
    regional: prefilledRegional,
    tempoLideranca: "",
    numeroLiderados: "",
    cargo: prefilledCargo,
  });

  const [confirmSenha, setConfirmSenha] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const isRegisteringFromUrl = searchParams.get("form") === "cadastro";
  const [isLaunching, setIsLaunching] = useState(false);
  const [isRegistering, setIsRegistering] = useState(isRegisteringFromUrl);
  const [usuarioCriado, setUsuarioCriado] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [emailChecked, setEmailChecked] = useState(false);
  const canvasRef = useRef(null);

  // --- NOVA FUNÇÃO: BUSCAR LISTAS ---
  useEffect(() => {
    const fetchLists = async () => {
      try {
        if (!API_BASE_URL) return;

        // Busca Empresas
        const compRes = await axios.get(`${API_BASE_URL}/companies/list`);
        if (compRes.data.success) {
          setCompaniesList(compRes.data.companies);
        }

        // Busca Regionais
        const regRes = await axios.get(`${API_BASE_URL}/regionals/list`);
        if (regRes.data.success) {
          setRegionalsList(regRes.data.regionals);
        }
      } catch (error) {
        console.error("Erro ao carregar listas:", error);
      }
    };

    // Só busca se estiver na tela de cadastro
    if (isRegistering) {
      fetchLists();
    }
  }, [isRegistering]);

  useEffect(() => {
    if (isUpdateMode) {
      setIsRegistering(true);
      const fetchUserData = async () => {
        try {
          if (!API_BASE_URL) return;
          const response = await axios.get(`${API_BASE_URL}/user-by-email?email=${encodeURIComponent(prefilledEmail)}`);
          const userData = response.data.usuario;

          if (userData) {
            setRegisterData(prev => ({
              ...prev,
              dataNascimento: userData.dataNascimento || "",
              setor: userData.setor || prefilledSetor,
              tempoLideranca: userData.tempoLideranca || "",
              numeroLiderados: userData.numeroLiderados || "",
            }));
            setEmailAvailable(false);
            setEmailChecked(true);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário para atualização:", error);
        }
      };
      fetchUserData();
    }
  }, [isUpdateMode, prefilledEmail, prefilledSetor, API_BASE_URL]);

  useEffect(() => {
    fetch('/version.json')
      .then(response => response.json())
      .then(data => setVersion(data.version))
      .catch(error => console.error("Erro ao buscar a versão:", error));
  }, []);

  useEffect(() => {
    const currentMusic = "/sounds/trilha_galatica_v1.mp3";
    playTrack(currentMusic, { loop: true, isPrimary: false });
  }, [playTrack]);

  useEffect(() => {
    if (isRegistering && confirmSenha && registerData.senha !== confirmSenha) {
      setPasswordError(t('passwordMismatch'));
    } else {
      setPasswordError("");
    }
  }, [registerData.senha, confirmSenha, isRegistering, t]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const stars = Array.from({ length: 100 }, () => ({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, radius: Math.random() * 2, speed: Math.random() * 0.3, }));
    let animationFrameId;
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
      animationFrameId = requestAnimationFrame(animateStars);
    };
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    animateStars();
    return () => {
      cancelAnimationFrame(animationFrameId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, []);

  const handleLanguageChange = (lng, flag) => {
    i18n.changeLanguage(lng);
    setSelectedLanguage(flag);
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    if (!isUpdateMode || !['nome', 'empresa', 'email', 'regional', 'cargo', 'setor'].includes(e.target.name)) {
      setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    }
  };

  const checkEmailAvailability = async (email) => {
    if (isUpdateMode) {
      setEmailAvailable(false);
      setEmailChecked(true);
      return;
    }
    if (!email || !email.includes("@") || !API_BASE_URL) {
      setEmailAvailable(false);
      setEmailChecked(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/check-email?email=${email}`);
      setEmailAvailable(response.data.available);
      setEmailChecked(true);
    } catch (error) {
      console.error("Erro ao verificar e-mail:", error);
      setEmailAvailable(false);
      setEmailChecked(false);
    }
  };

  const handleEmailBlur = () => {
    if (registerData.email) {
      checkEmailAvailability(registerData.email);
    }
  };

  const redirectToNextStep = (user) => {
    if (!user.autorizado) { navigate("/ContadorRegressivo"); return; }
    if (!user.grupo) { navigate("/BoasVindas"); return; }
    if (!user.grupo.naveEscolhida) { navigate("/SelecaoNave"); return; }
    if (!user.grupo.equipeEscolhida) { navigate("/SelecaoEquipe"); return; }
    navigate("/CompraDeMaterial");
  };

  const enterFullScreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) { element.requestFullscreen(); }
    else if (element.mozRequestFullScreen) { element.mozRequestFullScreen(); }
    else if (element.webkitRequestFullscreen) { element.webkitRequestFullscreen(); }
    else if (element.msRequestFullscreen) { element.msRequestFullscreen(); }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLaunching(true);
    try {
      if (!API_BASE_URL) throw new Error("API URL não configurada");
      const response = await axios.post(`${API_BASE_URL}/login`, loginData);
      if (response.data.success) {
        enterFullScreen();
        const loggedInUser = response.data.usuario;
        login(loggedInUser);
        if (loggedInUser.administrador === true) {
          navigate("/admin");
        } else {
          redirectToNextStep(loggedInUser);
        }
      } else {
        alert(`❌ ${response.data.message}`);
      }
    } catch (error) {
      alert(`❌ Erro ao fazer login!`);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerData.senha !== confirmSenha) {
      alert("❌ As senhas não coincidem.");
      return;
    }
    if (!emailChecked && !isUpdateMode) {
      await checkEmailAvailability(registerData.email);
    }
    if (!emailAvailable && !isUpdateMode) {
      alert("❌ E-mail já está em uso.");
      return;
    }

    const dataToSend = { ...registerData };

    try {
      if (!API_BASE_URL) throw new Error("API URL não configurada");
      let response;
      if (isUpdateMode) {
        response = await axios.put(`${API_BASE_URL}/update-user-by-email`, dataToSend);
        if (response.data.success) {
          alert("✅ Dados atualizados!");
          setIsRegistering(false);
        } else {
          alert(`❌ ${response.data.message}\n\n${response.data.details}`);
        }
      } else {
        response = await axios.post(`${API_BASE_URL}/register`, dataToSend);
        if (response.data.success) {
          setUsuarioCriado(response.data.usuario);
          alert("✅ Cadastro realizado com sucesso!");
          setIsRegistering(false);
        } else {
          alert(`❌ ${response.data.message}\n\n${response.data.details}`);
        }
      }
    } catch (error) {
      alert(`❌ Erro ao processar o registro!\n\n${error?.response?.data?.details || error.message}`);
    }
  };

  return (
    <div className="background" onClick={unlockAudio}>
      <canvas ref={canvasRef} className="stars"></canvas>
      <div className="language-selector">
        <img src="/images/flags/brazil.png" alt="Português" className={`flag ${selectedLanguage === 'brazil' ? 'active' : ''}`} onClick={() => handleLanguageChange('pt', 'brazil')} />
        <img src="/images/flags/spain.png" alt="Español" className={`flag ${selectedLanguage === 'spain' ? 'active' : ''}`} onClick={() => handleLanguageChange('es', 'spain')} />
        <img src="/images/flags/usa.png" alt="English" className={`flag ${selectedLanguage === 'usa' ? 'active' : ''}`} onClick={() => handleLanguageChange('en', 'usa')} />
        <img src="/images/flags/italy.png" alt="Italiano" className={`flag ${selectedLanguage === 'italy' ? 'active' : ''}`} onClick={() => handleLanguageChange('it', 'italy')} />
      </div>

      <img src="/images/logogalaticQuest.png" className="game-logo" alt="Galactic Quest" />
      <div className="solar-system">
        <img src="/images/Terra.png" className="planet earth" alt="Terra" />
        <img src="/images/mercury.png" className="planet mercury" alt="Mercúrio" />
        <img src="/images/venus.png" className="planet venus" alt="Vênus" />
        <img src="/images/sun.png" className="sun" alt="Sol" />
        <img src="/images/mars.png" className="planet mars" alt="Marte" />
      </div>

      <div className="game-info2">
        <h3>Galactic Quest</h3>
        <p>{t('gameDescription')}</p>
      </div>
      <p className="game-version">versão {version}</p>
      <div className="form-container">
        {!isRegistering ? (
          <form onSubmit={handleLoginSubmit} className="cadastro-form">
            <h2>{t('loginTitle')}</h2>
            <input type="email" name="email" placeholder={t('emailPlaceholder')} value={loginData.email} onChange={handleLoginChange} required />
            <input type="password" name="senha" placeholder={t('passwordPlaceholder')} value={loginData.senha} onChange={handleLoginChange} required />
            <br /><br />
            <button type="submit" className={isLaunching ? "launching" : ""}>
              {isLaunching ? "🚀" : t('loginButton')}
            </button>
            <p onClick={() => setIsRegistering(true)} className="toggle-form">
              {t('toggleToRegister')}
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="cadastro-form">
            <h2>{isUpdateMode ? 'Atualizar Dados' : t('registerTitle')}</h2>

            <input type="text" name="nome" placeholder={t('namePlaceholder')} value={registerData.nome} onChange={handleRegisterChange} readOnly={isUpdateMode} required />

            {/* --- CORREÇÃO: SELECT PARA EMPRESA --- */}
            {isUpdateMode ? (
              <input type="text" name="empresa" value={registerData.empresa} readOnly className="input-readonly" />
            ) : (
              <select name="empresa" value={registerData.empresa} onChange={handleRegisterChange} required className="terminal-select">
                <option value="" disabled>{t('companyPlaceholder') || "Selecione a Empresa"}</option>
                {companiesList.map(c => (
                  <option key={c._id || c.nome} value={c.nome}>{c.nome}</option>
                ))}
              </select>
            )}

            <input type="email" name="email" placeholder={t('emailPlaceholder')} value={registerData.email} onChange={handleRegisterChange} onBlur={handleEmailBlur} readOnly={isUpdateMode} required />

            {isUpdateMode && (
              <p style={{ color: 'yellow', fontSize: '12px', margin: '-5px 0 5px 0' }}>E-mail não pode ser alterado.</p>
            )}

            {/* --- CORREÇÃO: SELECT PARA REGIONAL --- */}
            {isUpdateMode ? (
              <input type="text" name="regional" value={registerData.regional} readOnly className="input-readonly" />
            ) : (
              <select name="regional" value={registerData.regional} onChange={handleRegisterChange} required className="terminal-select">
                <option value="" disabled>{t('regionalPlaceholder') || "Selecione a Regional"}</option>
                {regionalsList.map(r => (
                  <option key={r._id || r.nome} value={r.nome}>{r.nome}</option>
                ))}
              </select>
            )}

            <input type="text" name="cargo" placeholder={t('cargoPlaceholder')} value={registerData.cargo} onChange={handleRegisterChange} readOnly={isUpdateMode} required />
            <input type="text" name="setor" placeholder={t('sectorPlaceholder')} value={registerData.setor} onChange={handleRegisterChange} readOnly={isUpdateMode} required />
            <input type="date" name="dataNascimento" value={registerData.dataNascimento} onChange={handleRegisterChange} required />

            {!emailAvailable && emailChecked && !isUpdateMode && (
              <p style={{ color: 'red', fontSize: '12px', margin: '-5px 0 5px 0' }}>{t('emailInUse')}</p>
            )}

            <input type="password" name="senha" placeholder={t('passwordPlaceholder')} value={registerData.senha} onChange={handleRegisterChange} required />
            <input type="password" name="confirmSenha" placeholder={t('confirmPasswordPlaceholder')} value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} required />
            {passwordError && <p style={{ color: 'red', fontSize: '12px', margin: '-5px 0 5px 0' }}>{passwordError}</p>}

            <input type="text" name="tempoLideranca" placeholder={t('leadershipTimePlaceholder')} value={registerData.tempoLideranca} onChange={handleRegisterChange} required />
            <input type="number" name="numeroLiderados" placeholder={t('ledNumberPlaceholder')} value={registerData.numeroLiderados} onChange={handleRegisterChange} required />
            <br /><br />

            <button type="submit" disabled={(!emailAvailable && emailChecked && !isUpdateMode) || !!passwordError}>
              {isUpdateMode ? 'Atualizar Dados' : t('registerButton')}
            </button>
            <p onClick={() => setIsRegistering(false)} className="toggle-form">{t('toggleToLogin')}</p>
          </form>
        )}
      </div>
    </div>
  );
};
export default CadastroForm;