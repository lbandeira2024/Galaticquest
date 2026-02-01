import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // 1. Importar o useAuth

const Login = () => {
  const [formData, setFormData] = useState({ email: "", senha: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const auth = useAuth(); // 2. Obter o contexto de autenticação

  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const stars = Array.from({ length: 100 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 2,
      speed: Math.random() * 0.5,
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
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await axios.post("http://localhost:5000/login", formData);
      setMessage(response.data.message);

      if (response.data.success) {
        // 3. Usar a função de login do contexto para salvar os dados
        auth.login(response.data.usuario);
        console.log("Usuário salvo no contexto:", response.data.usuario);

        navigate("/selecao-rota-prep");
      }

    } catch (error) {
      setMessage("❌ Login falhou! Verifique seus dados.");
      console.error("Erro no login:", error);
    } finally {
      setTimeout(() => {
        setIsLoggingIn(false);
      }, 2000);
    }
  };

  return (
    <div className="background">
      <canvas ref={canvasRef} className="stars"></canvas>
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input type="password" name="senha" placeholder="Senha" value={formData.senha} onChange={handleChange} required />
        <button type="submit" className={isLoggingIn ? "logging-in" : ""}>
          {isLoggingIn ? "🚀" : "Entrar"}
        </button>
        <p>{message}</p>
      </form>
    </div>
  );
};

export default Login;