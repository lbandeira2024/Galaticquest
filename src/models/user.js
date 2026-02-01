const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const UserSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, "O nome é obrigatório"],
    trim: true,
    maxlength: [100, "O nome não pode ter mais que 100 caracteres"]
  },
  empresa: {
    type: String,
    required: [true, "A empresa é obrigatória"],
    trim: true
  },
  dataNascimento: {
    type: Date,
    required: [true, "A data de nascimento é obrigatória"],
    validate: {
      validator: function (value) {
        return value < new Date();
      },
      message: "A data de nascimento deve ser no passado"
    }
  },
  email: {
    type: String,
    required: [true, "O e-mail é obrigatório"],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: "Por favor, forneça um e-mail válido"
    }
  },
  senha: {
    type: String,
    required: [true, "A senha é obrigatória"],
    minlength: [8, "A senha deve ter no mínimo 8 caracteres"],
    select: false // Não retorna a senha em consultas
  },
  setor: {
    type: String,
    required: [true, "O setor é obrigatório"],
    enum: {
      values: ["TI", "RH", "Financeiro", "Operações", "Vendas", "Marketing"],
      message: "Setor inválido"
    }
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  ultimoAcesso: Date,
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  versionKey: false, // Remove o campo __v
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware para hash da senha antes de salvar
UserSchema.pre("save", async function (next) {
  if (!this.isModified("senha")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
UserSchema.methods.compararSenha = async function (senhaDigitada) {
  return await bcrypt.compare(senhaDigitada, this.senha);
};

// Índices para melhor performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ empresa: 1, setor: 1 });

// Virtual para idade do usuário
UserSchema.virtual("idade").get(function () {
  const diff = Date.now() - this.dataNascimento.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

const User = mongoose.model("User", UserSchema);

module.exports = User;