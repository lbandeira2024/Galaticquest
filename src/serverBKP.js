require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ Conectado ao MongoDB"))
  .catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));

// Criar esquema do usuário
const UsuarioSchema = new mongoose.Schema({
  nome: String,
  empresa: String,
  dataNascimento: Date,
  email: String,
  senha: String,
  setor: String,
});

const Usuario = mongoose.model("users", UsuarioSchema); // Tabela "users"



// Rota para registrar usuário
app.post("/register", async (req, res) => {
  try {

    console.log("Recebido no backend:", req.body); //novo

    const novoUsuario = new Usuario(req.body);
    await novoUsuario.save();
    res.json({ message: "Usuário cadastrado com sucesso!" });
  } catch (error) {
    console.error("❌ ERRO DETALHADO:", error);
    res.status(500).json({ error: "Erro ao cadastrar usuário!", details: error.message });
  }
});

// Rota para login (exemplo de validação simples)
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email, senha });

    if (!usuario) {
      return res.status(401).json({ message: "E-mail ou senha inválidos." });
    }

    res.json({ message: "Login realizado com sucesso!" });
  } catch (error) {
    console.error("❌ ERRO DETALHADO:", error);
    res.status(500).json({ error: "Erro ao fazer login!", details: error.message });
  }
});



// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
