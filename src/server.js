// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("./config.json");
const path = require("path");
const fs = require("fs");

const app = express();

// ==================================================================
// CONFIGURAÇÃO DO EXPRESS
// ==================================================================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.url}`);
  next();
});

// ==========================================
//  CONEXÃO AO MONGODB
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado ao MongoDB"))
  .catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));


// ==========================================
//    CORREÇÃO NUCLEAR DE CACHE (Modelos)
// ==========================================
if (mongoose.models.Usuario) delete mongoose.models.Usuario;
if (mongoose.models.Grupo) delete mongoose.models.Grupo;
if (mongoose.models.Cliente) delete mongoose.models.Cliente;
if (mongoose.models.Regional) delete mongoose.models.Regional;
if (mongoose.models.CDS) delete mongoose.models.CDS;
if (mongoose.models.Game) delete mongoose.models.Game;


// ==========================================
//              DEFINIÇÃO DE SCHEMAS
// ==========================================

const UsuarioSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  senha: { type: String, required: true },
  nome: { type: String, required: true },
  empresa: { type: String, required: true },
  dataNascimento: { type: Date, required: true },
  setor: { type: String, required: true },
  regional: { type: String, required: true },
  cargo: { type: String, required: true },
  tempoLideranca: { type: String, required: true },
  numeroLiderados: { type: Number, required: false, default: 0 },
  autorizado: { type: Boolean, default: false },
  administrador: { type: Boolean, default: false },
  dataInicio: { type: Date, default: new Date('2025-06-30') },
  grupo: { type: mongoose.Schema.Types.ObjectId, ref: 'Grupo' },
  gameNumber: { type: Number },
  betatester: { type: Boolean, default: false } // <--- CAMPO BETATESTER ADICIONADO AQUI
}, { timestamps: true });

const Usuario = mongoose.model("Usuario", UsuarioSchema);

const InventoryItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  type: String,
  image: String,
  price: Number,
  description: String,
  quantity: { type: Number, default: 1 },
  effects: { type: mongoose.Schema.Types.Mixed, default: {} },
  purchasedAt: { type: Date, default: Date.now }
}, { _id: false });

const PersonalItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  image: String,
  description: String,
  size: Number
}, { _id: false });

const GrupoSchema = new mongoose.Schema({
  teamName: { type: String, required: true, unique: true, trim: true },
  normalizedTeamName: { type: String, unique: true, lowercase: true },
  membros: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
  naveEscolhida: String,
  equipeEscolhida: String,
  spaceCoins: { type: Number, min: 0, default: 1000000 },
  inventory: [InventoryItemSchema],
  personalInventory: [PersonalItemSchema],
  terabytes: { type: Number, default: 100000 },
  rotaPlanejada: [{ name: String, distance: Number, fuel: Number, from: String }],
  routeIndex: { type: Number, default: 0 },
  processadorO2: { type: Number, default: 0, min: 0 },
  // --- REGISTRO DE PROGRESSO GLOBAL ---
  corposCelestesVisitados: { type: Number, default: 0 },
  distanciaPercorridaKm: { type: Number, default: 0 },
  distanciaRestanteKm: { type: Number }, // <--- CAMPO DISTÂNCIA RESTANTE ADICIONADO AQUI
  missionTimeLeft: { type: Number, default: 12 * 60 * 60 }, // <--- TEMPO DE MISSÃO (segundos restantes) ADICIONADO AQUI
  // -----------------------------------------------------
  sosHistory: { type: [Number], default: [] },
  loginon: { type: Number, default: 0 },
  lastHeartbeat: { type: Date, default: Date.now },
  telemetryState: {
    oxygen: { type: Number, default: 100 },
    nuclearPropulsion: { type: Number, default: 100 },
    direction: { type: Number, default: 100 },
    stability: { type: Number, default: 100 },
    productivity: { type: Number, default: 100 },
    interdependence: { type: Number, default: 100 },
    engagement: { type: Number, default: 100 }
  },
  gameNumber: { type: Number },
  isLocked: { type: Boolean, default: false },
  photoUrl: { type: String }
}, { timestamps: true });

const Grupo = mongoose.model("Grupo", GrupoSchema);

const ClienteSchema = new mongoose.Schema({ nome: { type: String, required: true, unique: true } });
const Cliente = mongoose.model("Cliente", ClienteSchema);

const RegionalSchema = new mongoose.Schema({ nome: { type: String, required: true, unique: true } });
const Regional = mongoose.model("Regional", RegionalSchema);

const CDSSchema = new mongoose.Schema({
  grupo: { type: mongoose.Schema.Types.ObjectId, ref: 'Grupo' },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  desafioId: String,
  escolha: { id: String, texto: String },
  impactos: Object
}, { timestamps: true });
const CDS = mongoose.model("CDS", CDSSchema);

const GameSchema = new mongoose.Schema({
  gameNumber: { type: Number, unique: true },
  startDate: Date,
  endDate: Date,
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
  regionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Regional' },
  isPaused: { type: Boolean, default: false },
});
const Game = mongoose.model("Game", GameSchema);

const normalizeEmail = (req, res, next) => {
  if (req.body.email) req.body.email = req.body.email.toLowerCase().trim();
  next();
};

async function getGroupId(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("ID inválido.");
  const usuario = await Usuario.findById(userId);
  if (!usuario || !usuario.grupo) throw new Error("Usuário sem grupo.");
  return usuario.grupo;
}

// ==========================================
//   CÁLCULO DO ÍNDICE VIRTUS (IV)
//   Variação: 0,0 a 1,0
//   Composição: 70% respostas dos 25 CSD's (pesos nas 12 Virtudes)
//              + 20% distância (UA) a 9 corpos celestes específicos
//              + 10% Engajamento e Interdependência já existentes no jogo
// ==========================================

// Remove acentos/hífens/espaços pra comparar nomes de forma robusta
// (ex: "Trappist-1e" no conceito vs "Trappist1e" salvo na rota).
function normalizeVirtusName(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Corpos que contam pro componente de 20% (distância), em 3 grupos com
// peso diferente dentro do índice total (10% + 5% + 5% = 20%). "Distância"
// aqui é medida pelo próprio avanço da equipe na SUA rota planejada
// (rotaPlanejada) — cada corpo só conta se ele estiver na rota da equipe E
// já tiver sido alcançado (routeIndex já passou daquele trecho). Não
// depende de nenhuma distância "real" em UA fixa, porque a distância de
// cada trecho já é definida pela própria rota do jogo
// (rotaPlanejada[i].distance).
//
// ATUALIZADO em 2026-09-04 (3x):
// 1) Lista original tinha só 9 corpos (todos do sistema solar externo/
//    exoplanetas); rotas pelo sistema solar interno nunca pontuavam aqui
//    (bug reportado por jogador — ver PTT de 04/09).
// 2) Restrita a só planetas e luas (sem estações, sem anões/asteroides).
// 3) Por instrução do Wagner: passa a incluir também asteroides e
//    planetas-anões — mas SÓ os corpos que têm CSD explícito em
//    `desafios.json` (front-end). Conferido 1:1 contra os 25 `planeta` de
//    `desafios.json` nesta data: os 25 CSDs cobrem exatamente 25 corpos
//    distintos, então a lista abaixo passou a ser literalmente essa lista
//    de 25, reorganizada em 3 grupos por região. Isso tira da lista
//    Calisto, Encélado e Titânia (que estavam na versão "só planetas e
//    luas" mas não têm CSD nenhum) e acrescenta Fobos, Deimos (luas de
//    Marte), Ceres, Vesta, Pallas (cinturão de asteroides) e Plutão,
//    Haumea, Makemake, Eris (planetas-anões) — todos com CSD.
//    IMPORTANTE: se `desafios.json` ganhar/perder um CSD (ou trocar o
//    `planeta` de algum), esta lista precisa ser atualizada manualmente
//    em conjunto — não há sincronização automática entre os dois arquivos.
const VIRTUS_GRUPOS_DISTANCIA = [
  {
    peso: 0.10, // sistema solar interno: planetas, luas de Marte e cinturão de asteroides
    corpos: [
      'mercurio', 'venus', 'lua', 'marte',
      'fobos', 'deimos',
      'ceres', 'vesta', 'pallas',
    ],
  },
  {
    peso: 0.05, // gigantes gasosos/gelados e suas luas com CSD
    corpos: [
      'jupiter', 'europa', 'ganimedes',
      'saturno', 'tita',
      'urano', 'oberon',
      'netuno', 'tritao',
    ],
  },
  {
    peso: 0.05, // planetas-anões do cinturão de Kuiper + exoplanetas
    corpos: [
      'plutao', 'haumea', 'makemake', 'eris',
      'trappist1e', 'kepler186f', 'proximacentaurib',
    ],
  },
];

function calcularScoreDistanciaVirtus(rotaPlanejada, routeIndex) {
  if (!Array.isArray(rotaPlanejada) || rotaPlanejada.length === 0) return 0;

  // Nomes normalizados de todos os corpos já alcançados pela equipe
  // (ignora o índice 0, que é o planeta/estação de origem).
  const alcancados = new Set();
  const idx = typeof routeIndex === 'number' ? routeIndex : 0;
  for (let i = 1; i <= idx && i < rotaPlanejada.length; i++) {
    const nome = rotaPlanejada[i] && rotaPlanejada[i].name;
    if (nome) alcancados.add(normalizeVirtusName(nome));
  }

  let score = 0;
  for (const grupo of VIRTUS_GRUPOS_DISTANCIA) {
    const alcancadosNoGrupo = grupo.corpos.filter(c => alcancados.has(c)).length;
    score += grupo.peso * (alcancadosNoGrupo / grupo.corpos.length);
  }
  return score; // já em fração do índice total (0 a 0.20)
}

// --- Dados portados de MandalaVirtudes.js (12 Virtudes e tabela de regras por escolha) ---
// Mantidos em sincronia manual com o front-end: mesmas 12 Virtudes e a mesma
// VIRTUE_RULES usada para colorir a Mandala (red/special/green por CSD-Letra).
const VIRTUES = [
  { id: 'simplicidade', name: 'Simplicidade' },
  { id: 'protagonismo', name: 'Protagonismo' },
  { id: 'respeito-diversidade', name: 'Respeito à diversidade' },
  { id: 'conhecer-si', name: 'Conhecer a si mesmo' },
  { id: 'ter-proposito', name: 'Ter um propósito' },
  { id: 'agir-verdade', name: 'Agir com a verdade' },
  { id: 'coragem', name: 'Coragem' },
  { id: 'disciplina', name: 'Disciplina' },
  { id: 'perseveranca', name: 'Perseverança' },
  { id: 'humildade', name: 'Humildade' },
  { id: 'generosidade', name: 'Generosidade' },
  { id: 'paixao-pessoas', name: 'Paixão por Pessoas' }
];
const ALL_VIRTUE_IDS = VIRTUES.map(v => v.id);

const VIRTUE_RULES = {
  'CSD1-A': {
    special: ['agir-verdade', 'humildade', 'generosidade', 'paixao-pessoas', 'simplicidade', 'protagonismo', 'respeito-diversidade'],
    green: ['perseveranca', 'disciplina', 'coragem', 'ter-proposito', 'conhecer-si'],
  },
  'CSD1-B': {
    special: ['conhecer-si', 'disciplina', 'agir-verdade', 'humildade', 'generosidade', 'paixao-pessoas', 'simplicidade', 'protagonismo', 'respeito-diversidade'],
    green: ['perseveranca', 'coragem', 'ter-proposito'], showImage: true
  },

  'CSD1-C': {
    special: ['disciplina', 'ter-proposito'],
    green: ['coragem', 'perseveranca', 'protagonismo'],
    red: ['conhecer-si', 'humildade', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'respeito-diversidade', 'generosidade'],
  },
  'CSD1-D': {
    special: ['respeito-diversidade'],
    red: ['conhecer-si', 'coragem', 'humildade', 'disciplina', 'paixao-pessoas', 'agir-verdade', 'perseveranca', 'simplicidade', 'ter-proposito', 'generosidade', 'protagonismo'],
  },
  'CSD2-A': {
    red: ['humildade'],
    green: ['respeito-diversidade', 'conhecer-si', 'coragem', 'humildade', 'disciplina', 'paixao-pessoas', 'agir-verdade', 'perseveranca', 'simplicidade', 'ter-proposito', 'generosidade', 'protagonismo'], showImage: true
  },
  'CSD2-B': {
    red: ['conhecer-si'],
    green: ['humildade', 'respeito-diversidade', 'coragem', 'humildade', 'disciplina', 'paixao-pessoas', 'agir-verdade', 'perseveranca', 'simplicidade', 'ter-proposito', 'generosidade', 'protagonismo'],
  },

  'CSD2-C': {
    special: ['disciplina', 'agir-verdade', 'ter-proposito', 'conhecer-si', 'simplicidade', 'respeito-diversidade'],
    red: ['humildade', 'generosidade'],
    green: ['coragem', 'paixao-pessoas', 'perseveranca', 'protagonismo'],
  },
  'CSD2-D': {
    special: ['ter-proposito'],
    red: ALL_VIRTUE_IDS.filter(id => id !== 'ter-proposito'),
  },
  'CSD3-A': {
    special: ['coragem', 'generosidade', 'paixao-pessoas', 'protagonismo', 'respeito-diversidade'],
    red: ['simplicidade', 'perseveranca', 'ter-proposito'],
    green: ['conhecer-si', 'humildade', 'disciplina', 'agir-verdade'],
  },
  'CSD3-B': {
    special: ['humildade', 'protagonismo', 'disciplina', 'coragem', 'agir-verdade', 'ter-proposito'],
    red: ['conhecer-si', 'paixao-pessoas', 'perseveranca', 'simplicidade', 'respeito-diversidade', 'generosidade'],
  },
  'CSD3-C': { green: ALL_VIRTUE_IDS, showImage: true },

  'CSD3-D': {
    special: ['humildade', 'agir-verdade', 'conhecer-si'],
    red: ['coragem', 'protagonismo', 'respeito-diversidade', 'generosidade', 'paixao-pessoas', 'disciplina', 'perseveranca', 'simplicidade', 'ter-proposito'],
  },

  'CSD4-A': {
    green: ['perseveranca', 'coragem', 'ter-proposito', 'protagonismo'],
    red: ['conhecer-si', 'humildade', 'disciplina', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'respeito-diversidade', 'generosidade'],
  },
  'CSD4-B': {
    green: ALL_VIRTUE_IDS.filter(id => id !== 'simplicidade'),
    red: ['simplicidade'], showImage: true
  },
  'CSD4-C': {
    special: ['perseveranca', 'coragem', 'ter-proposito'],
    red: ['conhecer-si', 'humildade', 'disciplina', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'respeito-diversidade', 'generosidade', 'protagonismo'],
  },

  'CSD4-D': {
    special: ['coragem', 'ter-proposito'],
    red: ['perseveranca', 'conhecer-si', 'humildade', 'disciplina', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'respeito-diversidade', 'generosidade', 'protagonismo'],
  },

  'CSD5-A': {
    green: ['disciplina', 'ter-proposito'],
    red: ['coragem', 'perseveranca', 'conhecer-si', 'humildade', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'respeito-diversidade', 'generosidade', 'protagonismo'],
  },

  'CSD5-B': {
    green: ['protagonismo'],
    special: ['disciplina', 'simplicidade'],
    red: ['ter-proposito', 'coragem', 'perseveranca', 'conhecer-si', 'humildade', 'paixao-pessoas', 'agir-verdade', 'respeito-diversidade', 'generosidade', 'protagonismo'],
  },

  'CSD5-C': {
    special: ['agir-verdade', 'respeito-diversidade', 'generosidade'],
    red: ['ter-proposito', 'coragem', 'perseveranca', 'conhecer-si', 'humildade', 'paixao-pessoas', 'protagonismo', 'disciplina', 'simplicidade'], showImage: true
  },

  'CSD5-D': {
    special: ['agir-verdade', 'paixao-pessoas', 'generosidade'],
    red: ['respeito-diversidade', 'ter-proposito', 'coragem', 'perseveranca', 'conhecer-si', 'humildade', 'protagonismo', 'disciplina', 'simplicidade'],
  },

  'CSD6-A': {
    special: ['coragem', 'disciplina', 'ter-proposito', 'protagonismo'],
    red: ['agir-verdade', 'paixao-pessoas', 'generosidade', 'respeito-diversidade', 'perseveranca', 'conhecer-si', 'humildade', 'simplicidade'],
  },

  'CSD6-B': {
    special: ['coragem', 'ter-proposito'],
    red: ['protagonismo', 'disciplina', 'agir-verdade', 'paixao-pessoas', 'generosidade', 'respeito-diversidade', 'perseveranca', 'conhecer-si', 'humildade', 'simplicidade'],
  },

  'CSD6-C': {
    red: ['humildade', 'paixao-pessoas', 'simplicidade', 'agir-verdade', 'respeito-diversidade'],
    green: ['coragem', 'ter-proposito', 'protagonismo', 'disciplina', 'generosidade', 'perseveranca', 'conhecer-si'],
  },

  'CSD6-D': {
    red: ['paixao-pessoas', 'generosidade', 'disciplina'],
    green: ['humildade', 'coragem', 'ter-proposito', 'protagonismo', 'perseveranca', 'conhecer-si', 'simplicidade', 'agir-verdade', 'respeito-diversidade'],
  },

  'CSD7-A': {
    special: ['coragem', 'agir-verdade', 'ter-proposito', 'protagonismo', 'perseveranca'],
    green: ['disciplina'],
    red: ['humildade', 'conhecer-si', 'simplicidade', 'respeito-diversidade', 'paixao-pessoas', 'generosidade'],
  },

  'CSD7-B': {
    special: ['disciplina', 'coragem', 'protagonismo', 'perseveranca', 'generosidade', 'ter-proposito'],
    red: ['humildade', 'conhecer-si', 'simplicidade', 'respeito-diversidade', 'paixao-pessoas', 'agir-verdade'], showImage: true
  },

  'CSD7-C': {
    special: ['paixao-pessoas', 'generosidade', 'ter-proposito', 'conhecer-si'],
    red: ['disciplina', 'coragem', 'protagonismo', 'perseveranca', 'humildade', 'simplicidade', 'respeito-diversidade', 'agir-verdade'],
  },

  'CSD7-D': {
    special: ['ter-proposito', 'perseveranca', 'disciplina', 'protagonismo'],
    green: ['coragem'],
    red: ['paixao-pessoas', 'generosidade', 'conhecer-si', 'humildade', 'simplicidade', 'respeito-diversidade', 'agir-verdade'],
  },


  'CSD8-A': {
    special: ['protagonismo', 'respeito-diversidade'],
    green: ['conhecer-si', 'humildade', 'ter-proposito', 'perseveranca', 'coragem'],
    red: ['paixao-pessoas', 'generosidade', 'simplicidade', 'agir-verdade', 'disciplina',],
  },

  'CSD8-B': {
    special: ['protagonismo', 'generosidade', 'respeito-diversidade', 'conhecer-si', 'ter-proposito', 'agir-verdade'],
    green: ['humildade', 'paixao-pessoas'],
    red: ['simplicidade', 'disciplina', 'perseveranca', 'coragem'],
  },

  'CSD8-C': {
    green: ['disciplina', 'perseveranca', 'coragem', 'protagonismo', 'generosidade', 'respeito-diversidade', 'conhecer-si', 'ter-proposito', 'agir-verdade'],
    red: ['simplicidade', 'humildade', 'paixao-pessoas'],
  },

  'CSD8-D': { green: ALL_VIRTUE_IDS, showImage: true },

  'CSD9-A': {
    special: ['humildade', 'agir-verdade'],
    red: ['conhecer-si', 'paixao-pessoas', 'generosidade'],
    green: ['protagonismo', 'respeito-diversidade', 'ter-proposito', 'simplicidade', 'disciplina', 'perseveranca', 'coragem'],
  },

  'CSD9-B': {
    special: ['paixao-pessoas'],
    red: ['humildade', 'conhecer-si', 'generosidade', 'simplicidade'],
    green: ['agir-verdade', 'protagonismo', 'respeito-diversidade', 'ter-proposito', 'disciplina', 'perseveranca', 'coragem'],
  },

  'CSD9-C': {
    special: ['humildade'],
    red: ['conhecer-si'],
    green: ['generosidade', 'simplicidade', 'paixao-pessoas', 'agir-verdade', 'protagonismo', 'respeito-diversidade', 'ter-proposito', 'disciplina', 'perseveranca', 'coragem'], showImage: true
  },

  'CSD9-D': {
    special: ['humildade', 'paixao-pessoas', 'disciplina', 'agir-verdade'],
    red: ['conhecer-si', 'generosidade', 'simplicidade'],
    green: ['protagonismo', 'respeito-diversidade', 'ter-proposito', 'perseveranca', 'coragem'],
  },

  'CSD10-A': {
    special: ['humildade', 'paixao-pessoas', 'generosidade', 'respeito-diversidade', 'disciplina', 'perseveranca', 'agir-verdade'],
    red: ['conhecer-si', 'simplicidade'],
    green: ['protagonismo', 'ter-proposito', 'coragem'],
  },

  'CSD10-B': {
    special: ['paixao-pessoas', 'generosidade', 'respeito-diversidade', 'disciplina', 'conhecer-si', 'simplicidade'],
    red: ['agir-verdade'],
    green: ['protagonismo', 'humildade', 'perseveranca', 'ter-proposito', 'coragem'], showImage: true
  },

  'CSD10-C': {
    special: ['respeito-diversidade', 'conhecer-si', 'ter-proposito'],
    red: ['agir-verdade', 'disciplina', 'humildade', 'paixao-pessoas', 'generosidade', 'simplicidade'],
    green: ['protagonismo', 'perseveranca', 'coragem'],
  },

  'CSD10-D': {
    special: ['perseveranca', 'disciplina', 'respeito-diversidade'],
    red: ['agir-verdade', 'humildade', 'paixao-pessoas', 'generosidade', 'simplicidade', 'conhecer-si', 'ter-proposito'],
    green: ['protagonismo', 'coragem'],
  },

  'CSD11-A': {
    special: ['coragem'],
    red: ['agir-verdade', 'simplicidade', 'conhecer-si', 'ter-proposito', 'protagonismo', 'perseveranca', 'disciplina', 'respeito-diversidade'],
    green: ['humildade', 'generosidade', 'paixao-pessoas'],
  },

  'CSD11-B': {
    red: ['simplicidade', 'conhecer-si'],
    green: ['coragem', 'agir-verdade', 'humildade', 'generosidade', 'paixao-pessoas', 'ter-proposito', 'protagonismo', 'perseveranca', 'disciplina', 'respeito-diversidade'],
  },

  'CSD11-C': {
    red: ['simplicidade', 'disciplina'],
    green: ['humildade', 'generosidade', 'paixao-pessoas', 'agir-verdade', 'coragem', 'conhecer-si', 'ter-proposito', 'protagonismo', 'perseveranca', 'respeito-diversidade'],
  },

  'CSD11-D': { green: ALL_VIRTUE_IDS, showImage: true },

  'CSD12-A': {
    red: ['disciplina', 'generosidade', 'simplicidade'],
    green: ['coragem', 'respeito-diversidade', 'humildade', 'paixao-pessoas', 'agir-verdade', 'conhecer-si', 'ter-proposito', 'protagonismo', 'perseveranca'], showImage: true,
  },

  'CSD12-B': {
    special: ['disciplina'],
    red: ['conhecer-si', 'generosidade'],
    green: ['humildade', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'ter-proposito', 'protagonismo', 'perseveranca', 'respeito-diversidade', 'coragem'],
  },

  'CSD12-C': {
    red: ['conhecer-si', 'disciplina'],
    green: ['generosidade', 'humildade', 'paixao-pessoas', 'agir-verdade', 'simplicidade', 'ter-proposito', 'protagonismo', 'perseveranca', 'respeito-diversidade', 'coragem'],
  },

  'CSD12-D': {
    special: ['disciplina', 'coragem', 'agir-verdade', 'respeito-diversidade'],
    red: ['conhecer-si', 'generosidade', 'humildade', 'paixao-pessoas', 'simplicidade', 'perseveranca'],
    green: ['ter-proposito', 'protagonismo'],
  },

  'CSD13-A': {
    special: ['disciplina', 'generosidade', 'simplicidade'],
    green: ['ter-proposito', 'protagonismo', 'conhecer-si', 'humildade', 'paixao-pessoas', 'perseveranca', 'coragem', 'agir-verdade', 'respeito-diversidade'],
  },

  'CSD13-B': {
    special: ['conhecer-si'],
    red: ['disciplina', 'agir-verdade', 'generosidade', 'paixao-pessoas', 'simplicidade'],
    green: ['ter-proposito', 'protagonismo', 'coragem', 'respeito-diversidade', 'humildade', 'perseveranca'],
  },

  'CSD13-C': {
    special: ['disciplina', 'conhecer-si'],
    red: ['humildade'],
    green: ['ter-proposito', 'protagonismo', 'generosidade', 'paixao-pessoas', 'simplicidade', 'perseveranca', 'coragem', 'agir-verdade', 'respeito-diversidade'], showImage: true,
  },

  'CSD13-D': {
    special: ['disciplina', 'perseveranca', 'agir-verdade', 'ter-proposito', 'protagonismo'],
    red: ['generosidade', 'paixao-pessoas', 'simplicidade', 'respeito-diversidade', 'humildade', 'conhecer-si'],
    green: ['coragem'],
  },

  'CSD14-A': {
    special: ['conhecer-si'],
    red: ['coragem', 'generosidade', 'paixao-pessoas', 'simplicidade', 'respeito-diversidade', 'humildade', 'disciplina', 'perseveranca', 'agir-verdade', 'ter-proposito', 'protagonismo'],
  },

  'CSD14-B': {
    special: ['generosidade', 'simplicidade'],
    green: ['humildade', 'disciplina', 'conhecer-si', 'ter-proposito', 'protagonismo', 'paixao-pessoas', 'perseveranca', 'coragem', 'agir-verdade', 'respeito-diversidade'], showImage: true,
  },

  'CSD14-C': {
    special: ['agir-verdade', 'ter-proposito', 'respeito-diversidade'],
    red: ['disciplina', 'perseveranca', 'generosidade', 'paixao-pessoas', 'simplicidade', 'humildade', 'conhecer-si', 'coragem'],
    green: ['protagonismo'],
  },

  'CSD14-D': {
    special: ['generosidade', 'paixao-pessoas', 'protagonismo', 'agir-verdade', 'perseveranca', 'ter-proposito', 'humildade', 'conhecer-si'],
    green: ['disciplina', 'coragem', 'simplicidade', 'respeito-diversidade'],
  },

  'CSD15-A': {
    special: ['simplicidade'],
    red: ['generosidade', 'humildade', 'paixao-pessoas', 'conhecer-si', 'perseveranca', 'respeito-diversidade'],
    green: ['protagonismo', 'disciplina', 'coragem', 'agir-verdade', 'ter-proposito'],
  },

  'CSD15-B': {
    special: ['generosidade', 'disciplina', 'agir-verdade', 'ter-proposito'],
    red: ['simplicidade', 'humildade', 'conhecer-si', 'perseveranca'],
    green: ['protagonismo', 'coragem', 'paixao-pessoas', 'respeito-diversidade'],
  },

  'CSD15-C': {
    green: ALL_VIRTUE_IDS, showImage: true
  },

  'CSD15-D': {
    special: ['generosidade', 'disciplina', 'agir-verdade', 'ter-proposito', 'conhecer-si', 'perseveranca', 'simplicidade', 'paixao-pessoas', 'respeito-diversidade'],
    red: ['humildade'],
    green: ['protagonismo', 'coragem'],
  },

  'CSD16-A': {
    green: ['protagonismo', 'coragem', 'generosidade', 'disciplina', 'agir-verdade', 'ter-proposito', 'conhecer-si', 'perseveranca', 'simplicidade', 'paixao-pessoas', 'respeito-diversidade'],
    red: ['humildade'], showImage: true
  },

  'CSD16-B': {
    special: ['disciplina', 'perseveranca', 'simplicidade', 'respeito-diversidade'],
    red: ['humildade', 'generosidade', 'agir-verdade', 'conhecer-si', 'paixao-pessoas'],
    green: ['protagonismo', 'coragem', 'ter-proposito'],
  },

  'CSD16-C': {
    special: ['simplicidade'],
    red: ['coragem', 'humildade', 'generosidade', 'agir-verdade', 'conhecer-si', 'paixao-pessoas', 'disciplina', 'perseveranca', 'respeito-diversidade'],
    green: ['protagonismo', 'ter-proposito'],
  },

  'CSD16-D': {
    special: ['paixao-pessoas', 'ter-proposito'],
    red: ['simplicidade', 'humildade', 'generosidade', 'agir-verdade', 'conhecer-si', 'disciplina', 'perseveranca', 'respeito-diversidade'],
    green: ['protagonismo', 'coragem'],
  },

  'CSD17-A': {
    green: ['protagonismo', 'coragem', 'paixao-pessoas', 'ter-proposito', 'simplicidade', 'humildade', 'generosidade', 'agir-verdade', 'disciplina', 'respeito-diversidade'],
    red: ['conhecer-si', 'perseveranca'],
  },

  'CSD17-B': { green: ALL_VIRTUE_IDS, showImage: true },

  'CSD17-C': {
    special: ['coragem', 'ter-proposito', 'agir-verdade', 'protagonismo'],
    red: ['paixao-pessoas', 'simplicidade', 'humildade', 'generosidade', 'conhecer-si', 'disciplina', 'perseveranca', 'respeito-diversidade'],
  },

  'CSD17-D': {
    special: ['agir-verdade', 'ter-proposito', 'protagonismo', 'disciplina'],
    red: ['paixao-pessoas', 'humildade', 'generosidade', 'simplicidade'],
    green: ['conhecer-si', 'perseveranca', 'respeito-diversidade', 'coragem'],
  },

  'CSD18-A': { green: ALL_VIRTUE_IDS, showImage: true },

  'CSD18-B': {
    green: ['humildade', 'respeito-diversidade', 'conhecer-si'],
    red: ['agir-verdade', 'ter-proposito', 'protagonismo', 'disciplina', 'paixao-pessoas', 'perseveranca', 'coragem', 'generosidade', 'simplicidade'],
  },

  'CSD18-C': {
    red: ['respeito-diversidade', 'conhecer-si', 'ter-proposito',],
    green: ['humildade', 'agir-verdade', 'protagonismo', 'disciplina', 'paixao-pessoas', 'perseveranca', 'coragem', 'generosidade', 'simplicidade'],
  },

  'CSD18-D': {
    red: ['agir-verdade', 'disciplina', 'paixao-pessoas', 'humildade', 'generosidade', 'simplicidade', 'conhecer-si', 'perseveranca', 'respeito-diversidade',],
    green: ['coragem', 'ter-proposito', 'protagonismo'],
  },

  'CSD19-A': {
    red: ALL_VIRTUE_IDS
  },

  'CSD19-B': {
    special: ['ter-proposito', 'coragem', 'simplicidade', 'protagonismo'],
    red: ['agir-verdade', 'paixao-pessoas', 'humildade', 'generosidade', 'disciplina', 'conhecer-si', 'perseveranca', 'respeito-diversidade'],
  },

  'CSD19-C': {
    special: ['ter-proposito', 'perseveranca', 'protagonismo'],
    red: ['agir-verdade', 'paixao-pessoas', 'humildade', 'generosidade', 'disciplina', 'conhecer-si', 'respeito-diversidade', 'coragem', 'simplicidade'],
  },

  'CSD19-D': { green: ALL_VIRTUE_IDS, showImage: true },

  'CSD20-A': {
    special: ['ter-proposito', 'perseveranca', 'coragem', 'protagonismo', 'simplicidade'],
    red: ['agir-verdade', 'paixao-pessoas', 'humildade', 'generosidade', 'disciplina', 'conhecer-si', 'respeito-diversidade'],
  },

  'CSD20-B': {
    red: ['humildade', 'conhecer-si'],
    green: ['ter-proposito', 'perseveranca', 'coragem', 'protagonismo', 'simplicidade', 'agir-verdade', 'paixao-pessoas', 'generosidade', 'disciplina', 'respeito-diversidade'], showImage: true
  },

  'CSD20-C': {
    special: ['agir-verdade', 'protagonismo'],
    red: ['conhecer-si', 'paixao-pessoas', 'humildade', 'generosidade', 'respeito-diversidade'],
    green: ['perseveranca', 'coragem', 'disciplina', 'simplicidade', 'ter-proposito'],
  },

  'CSD20-D': {
    red: ['coragem', 'agir-verdade', 'simplicidade', 'conhecer-si', 'protagonismo'],
    green: ['perseveranca', 'disciplina', 'ter-proposito', 'paixao-pessoas', 'humildade', 'generosidade', 'respeito-diversidade'],
  },

  'CSD21-A': {
    red: ['humildade', 'generosidade', 'respeito-diversidade'],
    green: ['perseveranca', 'disciplina', 'ter-proposito', 'paixao-pessoas', 'coragem', 'agir-verdade', 'simplicidade', 'conhecer-si', 'protagonismo'],
  },

  'CSD21-B': {
    special: ['agir-verdade', 'respeito-diversidade', 'protagonismo'],
    red: ['conhecer-si', 'paixao-pessoas', 'generosidade', 'perseveranca', 'coragem', 'disciplina', 'simplicidade', 'ter-proposito'],
    green: ['humildade'],
  },

  'CSD21-C': {
    green: ALL_VIRTUE_IDS, showImage: true
  },

  'CSD21-D': {
    red: ['agir-verdade', 'disciplina', 'respeito-diversidade', 'conhecer-si'],
    green: ['coragem', 'simplicidade', 'protagonismo', 'perseveranca', 'ter-proposito', 'paixao-pessoas', 'humildade', 'generosidade'],
  },

  'CSD22-A': {
    green: ALL_VIRTUE_IDS, showImage: true
  },

  'CSD22-B': {
    special: ['simplicidade'],
    red: ['paixao-pessoas', 'generosidade', 'respeito-diversidade'],
    green: ['humildade', 'conhecer-si', 'perseveranca', 'coragem', 'disciplina', 'ter-proposito', 'agir-verdade', 'protagonismo'],
  },

  'CSD22-C': {
    special: ['agir-verdade'],
    red: ['humildade', 'conhecer-si', 'perseveranca', 'coragem', 'disciplina', 'ter-proposito', 'protagonismo', 'simplicidade', 'paixao-pessoas', 'generosidade', 'respeito-diversidade'],
  },

  'CSD22-D': {
    special: ['humildade', 'perseveranca', 'coragem', 'disciplina', 'ter-proposito', 'protagonismo', 'generosidade'],
    red: ['agir-verdade', 'conhecer-si', 'respeito-diversidade', 'simplicidade', 'paixao-pessoas'],
  },

  'CSD23-A': {
    special: ['conhecer-si', 'simplicidade', 'humildade', 'perseveranca', 'coragem', 'disciplina', 'ter-proposito', 'protagonismo'],
    red: ['paixao-pessoas', 'generosidade', 'respeito-diversidade', 'agir-verdade'],
  },

  'CSD23-B': {
    green: ['conhecer-si', 'humildade', 'perseveranca', 'coragem', 'disciplina', 'ter-proposito', 'protagonismo', 'paixao-pessoas', 'generosidade', 'respeito-diversidade', 'agir-verdade'],
    red: ['simplicidade'],
  },

  'CSD23-C': { green: ALL_VIRTUE_IDS, showImage: true },

  'CSD23-D': { red: ALL_VIRTUE_IDS },

  'CSD24-A': {

    red: ['paixao-pessoas', 'generosidade', 'humildade', 'simplicidade', 'respeito-diversidade', 'disciplina'],
    special: ['conhecer-si', 'perseveranca', 'coragem', 'ter-proposito', 'agir-verdade', 'protagonismo'],
  },

  'CSD24-B': {

    red: ['conhecer-si', 'disciplina', 'simplicidade', 'paixao-pessoas', 'generosidade', 'respeito-diversidade'],
    green: ['humildade', 'perseveranca', 'coragem', 'ter-proposito', 'agir-verdade', 'protagonismo'],
  },

  'CSD24-C': {
    red: ALL_VIRTUE_IDS
  },

  'CSD24-D': {
    green: ALL_VIRTUE_IDS, showImage: true
  },

  'CSD25-A': {
    green: ALL_VIRTUE_IDS, showImage: true
  },

  'CSD25-B': {
    red: ['humildade', 'conhecer-si'],
    special: ['perseveranca', 'coragem', 'disciplina', 'ter-proposito', 'agir-verdade', 'protagonismo', 'paixao-pessoas', 'generosidade', 'respeito-diversidade', 'simplicidade'],
  },

  'CSD25-C': {
    special: ['disciplina', 'ter-proposito', 'simplicidade', 'generosidade'],
    red: ['agir-verdade', 'humildade', 'conhecer-si', 'perseveranca', 'coragem', 'protagonismo', 'paixao-pessoas', 'respeito-diversidade'],
  },

  'CSD25-D': {
    red: ALL_VIRTUE_IDS,
  },
};

// [VIRTUS 70%] Respostas dos 25 CSD's, com pesos impactando as 12 Virtudes.
// Para cada um dos 25 CSDs, se o grupo já respondeu, busca a regra
// VIRTUE_RULES["<desafioId>-<letra>"] (mesma chave usada na Mandala) e
// converte a classificação categórica de cada uma das 12 Virtudes em nota:
//   green (sustenta a virtude)  -> 1
//   special (vício/alerta)      -> 0.5
//   red (fere a virtude)        -> 0
// A nota do desafio é a média das 12 virtudes. CSDs ainda não respondidos
// contam como 0 (o índice cresce conforme a equipe avança nos 25 desafios).
// O resultado final é a média das 25 notas, escalada para 0–0.70.
async function calcularScoreCSDVirtus(groupId) {
  if (!groupId) return 0;

  const registros = await CDS.find({ grupo: groupId }).lean();

  // Mantém apenas a resposta mais recente de cada CSD (caso o grupo tenha
  // respondido o mesmo desafio mais de uma vez).
  const respostaPorDesafio = new Map();
  for (const r of registros) {
    if (!r.desafioId || !r.escolha || !r.escolha.id) continue;
    respostaPorDesafio.set(r.desafioId, r.escolha.id);
  }

  const TOTAL_CSDS = 25;
  let somaNotas = 0;

  for (let n = 1; n <= TOTAL_CSDS; n++) {
    const desafioId = `CSD${n}`;
    const letra = respostaPorDesafio.get(desafioId);
    if (!letra) continue; // ainda não respondido -> nota 0

    const rule = VIRTUE_RULES[`${desafioId}-${letra}`];
    if (!rule) continue; // resposta sem regra mapeada -> nota 0 (não deveria ocorrer)

    const redIds = rule.red || [];
    const specialIds = rule.special || [];

    let somaVirtudes = 0;
    ALL_VIRTUE_IDS.forEach(id => {
      if (redIds.includes(id)) somaVirtudes += 0;
      else if (specialIds.includes(id)) somaVirtudes += 0.5;
      else somaVirtudes += 1; // green (aplica-se / sustenta a virtude)
    });

    somaNotas += somaVirtudes / ALL_VIRTUE_IDS.length; // nota do desafio, 0 a 1
  }

  const mediaGeral = somaNotas / TOTAL_CSDS; // 0 a 1
  return 0.70 * mediaGeral;
}

// [VIRTUS 10%] Engajamento e Interdependência, já existentes no telemetryState.
function calcularScoreClimaVirtus(telemetryState) {
  if (!telemetryState) return 0;
  const engajamento = typeof telemetryState.engagement === 'number' ? telemetryState.engagement : 100;
  const interdependencia = typeof telemetryState.interdependence === 'number' ? telemetryState.interdependence : 100;
  const media = (engajamento + interdependencia) / 2; // escala 0 a 100
  const mediaNormalizada = Math.max(0, Math.min(1, media / 100));
  return 0.10 * mediaNormalizada;
}

async function calcularVirtusIndex(grupo) {
  if (!grupo) return 0;

  // O componente de "clima" (engajamento/interdependência) usa os valores de
  // telemetryState, que começam em 100/100 por padrão (medidores cheios,
  // igual O2/propulsão/etc. no HUD). Sem essa checagem, uma equipe que ainda
  // não respondeu nenhum CSD já começaria com Virtus = 0,100 em vez de
  // 0,000, só por causa desse valor padrão. Por isso só contamos o clima
  // (e o índice como um todo) depois que a equipe respondeu pelo menos 1 CSD.
  const respostas = await CDS.countDocuments({ grupo: grupo._id });
  if (respostas === 0) return 0;

  const scoreCSD = await calcularScoreCSDVirtus(grupo._id);
  const scoreDist = calcularScoreDistanciaVirtus(grupo.rotaPlanejada, grupo.routeIndex);
  const scoreClima = calcularScoreClimaVirtus(grupo.telemetryState);
  const total = scoreCSD + scoreDist + scoreClima;
  return Math.max(0, Math.min(1, total));
}


// ==========================================
//                  ROTAS
// ==========================================

app.post("/login", normalizeEmail, async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await Usuario.findOne({ email }).populate('grupo');
    if (!usuario || usuario.senha !== senha) return res.status(401).json({ success: false });
    if (usuario.grupo) await Grupo.findByIdAndUpdate(usuario.grupo._id, { loginon: 1, lastHeartbeat: new Date() });
    res.json({ success: true, usuario });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post("/heartbeat", async (req, res) => {
  try {
    const { userId } = req.body;
    if (userId) {
      const usuario = await Usuario.findById(userId);
      if (usuario?.grupo) await Grupo.findByIdAndUpdate(usuario.grupo, { lastHeartbeat: new Date(), loginon: 1 });
    }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post("/:userId/comprar-item", async (req, res) => {
  try {
    const { itemId, itemName, itemType, price, effects, image } = req.body;
    const groupId = await getGroupId(req.params.userId);
    const groupCheck = await Grupo.findById(groupId);
    if (groupCheck.spaceCoins < Number(price)) throw new Error("Saldo insuficiente.");

    const newItem = { id: String(itemId), name: itemName, type: itemType || 'equipment', image, price: Number(price), effects: effects || {}, quantity: 1, purchasedAt: new Date() };
    const updatedGroup = await Grupo.findByIdAndUpdate(groupId, { $inc: { spaceCoins: -Math.abs(Number(price)) }, $push: { inventory: newItem } }, { new: true });

    let user = await Usuario.findById(req.params.userId).lean();
    if (user) user.grupo = updatedGroup;
    res.json({ success: true, spaceCoins: updatedGroup.spaceCoins, inventory: updatedGroup.inventory, user });
  } catch (error) { res.status(200).json({ success: false, message: error.message }); }
});

app.post("/:userId/adicionar-item-pessoal", async (req, res) => {
  try {
    const { item, cost } = req.body;
    const groupId = await getGroupId(req.params.userId);
    const groupCheck = await Grupo.findById(groupId);
    if (groupCheck.terabytes < Number(cost)) throw new Error("Espaço insuficiente.");

    const newItem = { id: String(item.id), name: item.name, image: item.image, description: item.description, size: Number(item.size) };
    const updatedGroup = await Grupo.findByIdAndUpdate(groupId, { $inc: { terabytes: -Math.abs(Number(cost)) }, $push: { personalInventory: newItem } }, { new: true });

    let user = await Usuario.findById(req.params.userId).lean();
    if (user) user.grupo = updatedGroup;
    res.json({ success: true, terabytes: updatedGroup.terabytes, personalInventory: updatedGroup.personalInventory, user });
  } catch (e) { res.status(200).json({ success: false, message: e.message }); }
});

app.post("/:userId/update-gamedata", async (req, res) => {
  try {
    const groupId = await getGroupId(req.params.userId);
    const updateData = { ...req.body, lastHeartbeat: new Date(), loginon: 1 };
    // [RETOMADA-SERVER] diagnóstico temporário: confirmar groupId usado e payload recebido
    console.log("[RETOMADA-SERVER] POST update-gamedata userId=%s groupId=%s payload=%o",
      req.params.userId, groupId?.toString(),
      {
        routeIndex: updateData.routeIndex,
        distanciaRestanteKm: updateData.distanciaRestanteKm,
        distanciaPercorridaKm: updateData.distanciaPercorridaKm,
        missionTimeLeft: updateData.missionTimeLeft,
      }
    );
    const updated = await Grupo.findByIdAndUpdate(groupId, { $set: updateData }, { new: true });
    // [RETOMADA-SERVER] diagnóstico temporário: confirmar o que realmente ficou gravado no documento
    console.log("[RETOMADA-SERVER] POST update-gamedata GRAVADO no Grupo _id=%s ->", updated?._id?.toString(),
      {
        routeIndex: updated?.routeIndex,
        distanciaRestanteKm: updated?.distanciaRestanteKm,
        distanciaPercorridaKm: updated?.distanciaPercorridaKm,
        missionTimeLeft: updated?.missionTimeLeft,
      }
    );
    const user = await Usuario.findById(req.params.userId).populate('grupo');
    res.json({ success: true, user });
  } catch (error) {
    console.error("[RETOMADA-SERVER] ERRO update-gamedata:", error);
    res.status(500).json({ success: false });
  }
});

app.post("/:userId/record-sos-history", async (req, res) => {
  try {
    const { sosId } = req.body;
    if (sosId === undefined) return res.status(400).json({ success: false, message: "sosId é obrigatório" });

    const groupId = await getGroupId(req.params.userId);
    await Grupo.findByIdAndUpdate(groupId, {
      $addToSet: { sosHistory: Number(sosId) }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/:userId/game-data", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.userId).populate('grupo');

    if (!usuario) return res.status(404).json({ success: false, message: "Usuário não encontrado" });

    let isPaused = false;
    if (usuario.gameNumber) {
      const game = await Game.findOne({ gameNumber: usuario.gameNumber });
      if (game) isPaused = game.isPaused;
    }

    if (!usuario.grupo) {
      // [RETOMADA-SERVER] diagnóstico temporário
      console.log("[RETOMADA-SERVER] GET game-data userId=%s -> usuario SEM grupo!", req.params.userId);
      return res.json({ success: true, isPaused, group: null, noGroup: true });
    }

    // [RETOMADA-SERVER] diagnóstico temporário: confirmar groupId usado na leitura e valores lidos
    console.log("[RETOMADA-SERVER] GET game-data userId=%s groupId=%s ->", req.params.userId, usuario.grupo._id?.toString(),
      {
        routeIndex: usuario.grupo.routeIndex,
        distanciaRestanteKm: usuario.grupo.distanciaRestanteKm,
        distanciaPercorridaKm: usuario.grupo.distanciaPercorridaKm,
        missionTimeLeft: usuario.grupo.missionTimeLeft,
      }
    );

    const virtusIndex = await calcularVirtusIndex(usuario.grupo);

    res.json({ success: true, ...usuario.grupo.toObject(), isPaused, virtusIndex });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro interno" });
  }
});

app.get("/games/:gameNumber/online-ships", async (req, res) => {
  try {
    const { gameNumber } = req.params;
    const threshold = new Date(Date.now() - 3600000);
    const usersInGame = await Usuario.find({ gameNumber: parseInt(gameNumber) }, 'grupo');
    const groupIds = usersInGame.map(u => u.grupo).filter(g => g);

    const onlineGroups = await Grupo.find({
      _id: { $in: groupIds },
      naveEscolhida: { $exists: true, $ne: null },
      $or: [{ lastHeartbeat: { $gt: threshold } }, { loginon: 1 }]
    }).select('naveEscolhida teamName');

    const onlineShips = onlineGroups.map(g => ({ id: g.naveEscolhida, name: g.teamName }));
    res.json({ success: true, onlineShips });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post("/transfer-funds", async (req, res) => {
  try {
    const { userId, transfers } = req.body;
    const senderGroupId = await getGroupId(userId);
    const senderGroup = await Grupo.findById(senderGroupId);

    let totalAmount = 0;
    const validTransfers = [];
    for (const [teamName, amountStr] of Object.entries(transfers)) {
      const amount = parseInt(amountStr);
      if (amount > 0) { totalAmount += amount; validTransfers.push({ teamName, amount }); }
    }

    if (senderGroup.spaceCoins < totalAmount) return res.status(400).json({ success: false, message: "Saldo insuficiente." });

    senderGroup.spaceCoins -= totalAmount;
    await senderGroup.save();

    for (const transfer of validTransfers) {
      await Grupo.findOneAndUpdate({ teamName: transfer.teamName }, { $inc: { spaceCoins: transfer.amount } });
    }
    res.json({ success: true, message: "Sucesso!", newBalance: senderGroup.spaceCoins });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get("/games", async (req, res) => { const games = await Game.find({}); res.json({ success: true, games }); });

app.get("/companies/list", async (req, res) => { const c = await Cliente.find({}); res.json({ success: true, companies: c }); });

app.get("/regionals/list", async (req, res) => { const r = await Regional.find({}); res.json({ success: true, regionals: r }); });

app.post("/companies", async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ success: false, message: "Nome obrigatório" });
    const existe = await Cliente.findOne({ nome });
    if (existe) return res.status(400).json({ success: false, message: "Empresa já existe." });
    const novaEmpresa = new Cliente({ nome });
    await novaEmpresa.save();
    const todas = await Cliente.find({});
    res.json({ success: true, message: "Cliente adicionado!", newClientId: novaEmpresa._id, companies: todas });
  } catch (error) { res.status(500).json({ success: false, message: "Erro ao criar empresa." }); }
});

app.post("/regionals", async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ success: false, message: "Nome obrigatório" });
    const existe = await Regional.findOne({ nome });
    if (existe) return res.status(400).json({ success: false, message: "Regional já existe." });
    const novaRegional = new Regional({ nome });
    await novaRegional.save();
    const todas = await Regional.find({});
    res.json({ success: true, message: "Regional adicionada!", newRegionalId: novaRegional._id, regionals: todas });
  } catch (error) { res.status(500).json({ success: false, message: "Erro ao criar regional." }); }
});

app.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || !email.includes("@")) return res.status(400).json({ available: false });
    const exists = await Usuario.findOne({ email: email.toLowerCase().trim() });
    res.json({ available: !exists });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post("/register", normalizeEmail, async (req, res) => {
  try {
    if (await Usuario.findOne({ email: req.body.email })) return res.status(400).json({ success: false, message: "E-mail em uso" });
    const novoUsuario = new Usuario({ ...req.body, dataNascimento: req.body.dataNascimento || new Date('1900-01-01'), autorizado: false });
    const referencia = await Usuario.findOne({ empresa: novoUsuario.empresa, setor: novoUsuario.setor, regional: novoUsuario.regional, grupo: { $exists: true } });
    if (referencia) {
      novoUsuario.grupo = referencia.grupo;
      await Grupo.findByIdAndUpdate(referencia.grupo, { $addToSet: { membros: novoUsuario._id } });
    }
    await novoUsuario.save();
    const finalUser = await Usuario.findById(novoUsuario._id).populate('grupo');
    res.status(201).json({ success: true, usuario: finalUser });
  } catch (error) { res.status(500).json({ success: false, details: error.message }); }
});

app.post("/save-team-name", async (req, res) => {
  try {
    const { userId, teamName } = req.body;
    if (!teamName) return res.status(400).json({ success: false });

    const criador = await Usuario.findById(userId);
    if (!criador) return res.status(404).json({ success: false });
    if (criador.grupo) {
      const u = await Usuario.findById(userId).populate('grupo');
      return res.json({ success: true, user: u });
    }

    const membros = await Usuario.find({ empresa: criador.empresa, setor: criador.setor, regional: criador.regional, grupo: { $exists: false } });
    const ids = membros.map(u => u._id);
    const tName = teamName.trim();

    const novoGrupo = await Grupo.create({
      teamName: tName,
      normalizedTeamName: tName.toLowerCase(),
      membros: ids,
      loginon: 1,
      isLocked: false,
      gameNumber: criador.gameNumber
    });

    await Usuario.updateMany({ _id: { $in: ids } }, { $set: { grupo: novoGrupo._id } });
    const finalUser = await Usuario.findById(userId).populate('grupo');
    res.json({ success: true, user: finalUser });

  } catch (error) {
    console.error("ERRO CRÍTICO SAVE TEAM:", error);
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Nome em uso." });
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/select-ship", async (req, res) => {
  try {
    const { userId, shipId } = req.body;
    const groupId = await getGroupId(userId);

    const grupoAtual = await Grupo.findById(groupId);
    if (!grupoAtual) {
      return res.status(404).json({ success: false, message: "Grupo não encontrado." });
    }

    const currentGameNumber = grupoAtual.gameNumber;

    const naveJaEscolhida = await Grupo.findOne({
      gameNumber: currentGameNumber,
      naveEscolhida: shipId,
      _id: { $ne: groupId }
    });

    if (naveJaEscolhida) {
      return res.status(400).json({
        success: false,
        message: `Tarde demais! A nave já foi capturada pela equipe ${naveJaEscolhida.teamName}.`
      });
    }

    await Grupo.findByIdAndUpdate(groupId, { naveEscolhida: shipId });
    const user = await Usuario.findById(userId).populate('grupo');

    res.json({ success: true, user });

  } catch (error) {
    console.error("Erro ao selecionar nave:", error);
    res.status(500).json({ success: false, message: "Erro interno do servidor ao selecionar nave." });
  }
});

app.put("/select-team", async (req, res) => {
  try {
    const { userId, teamCode } = req.body;
    const groupId = await getGroupId(userId);
    await Grupo.findByIdAndUpdate(groupId, { equipeEscolhida: teamCode });
    const user = await Usuario.findById(userId).populate('grupo');
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post("/save-planned-route", async (req, res) => {
  try {
    const { userId, routeSteps } = req.body;
    const groupId = await getGroupId(userId);
    await Grupo.findByIdAndUpdate(groupId, { rotaPlanejada: routeSteps });
    const user = await Usuario.findById(userId).populate('grupo');
    res.json({ success: true, usuario: user });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get('/group/:groupId/all-cds-challenges', async (req, res) => {
  try {
    const desafios = await CDS.find({ grupo: req.params.groupId });

    res.json({
      success: true,
      challenges: desafios.map(d => ({
        desafioId: d.desafioId,
        escolhaIdLetter: d.escolha.id,
        texto: d.escolha.texto,
        timestamp: d.timestamp
      }))
    });

  } catch (error) { res.status(500).json({ success: false }); }
});

app.get('/group/:groupId/check-recent-cds', async (req, res) => {
  try {
    const recent = await CDS.findOne({ grupo: req.params.groupId, createdAt: { $gte: new Date(Date.now() - 86400000) } });
    res.json({ success: true, hasRecentEntry: !!recent });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post("/record-choice", async (req, res) => {
  try {
    const { userId, desafioId, escolha, impactos, newBalance } = req.body;
    const user = await Usuario.findById(userId);
    const novaEscolha = new CDS({ grupo: user.grupo, usuario: user._id, desafioId, escolha: { id: escolha.id, texto: escolha.texto }, impactos });
    await novaEscolha.save();
    if (newBalance !== undefined) await Grupo.findByIdAndUpdate(user.grupo, { spaceCoins: newBalance });

    // [VIRTUS] Recalcula e devolve o índice já atualizado nesta mesma
    // resposta, para o front poder refletir o impacto da escolha na hora
    // (sem esperar o próximo fetch de game-data). Busca o grupo de novo
    // depois do update de spaceCoins/impactos acima para pegar o estado
    // mais recente (telemetryState pode já ter sido salvo por outra
    // chamada em paralelo, ex.: saveTelemetryData).
    const grupoAtualizado = await Grupo.findById(user.grupo);
    const virtusIndex = await calcularVirtusIndex(grupoAtualizado);

    res.status(201).json({ success: true, data: novaEscolha, virtusIndex });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get("/games/next-number", async (req, res) => {
  try {
    const last = await Game.findOne().sort({ gameNumber: -1 });
    res.json({ success: true, nextGameNumber: (last ? last.gameNumber : 0) + 1 });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post("/games", async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const last = await Game.findOne().sort({ gameNumber: -1 });
    const newGame = new Game({ gameNumber: (last ? last.gameNumber : 0) + 1, startDate, endDate });
    await newGame.save();
    res.status(201).json({ success: true, game: newGame });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.put("/games/:gameNumber/config", async (req, res) => {
  try {
    const { gameNumber } = req.params;
    const { clienteId, regionalId } = req.body;
    const updateFields = { clienteId };
    if (regionalId) updateFields.regionalId = regionalId;
    const game = await Game.findOneAndUpdate({ gameNumber }, { $set: updateFields }, { new: true });
    if (!game) return res.status(404).json({ success: false });
    res.json({ success: true, game });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get("/games/:gameNumber/config", async (req, res) => {
  try {
    const { gameNumber } = req.params;
    const game = await Game.findOne({ gameNumber });
    if (!game) return res.status(404).json({ success: false });
    res.json({ success: true, ...game.toObject() });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.put("/games/:gameNumber/dates", async (req, res) => {
  try {
    const { gameNumber } = req.params;
    const { startDate, endDate } = req.body;
    const game = await Game.findOneAndUpdate({ gameNumber }, { $set: { startDate, endDate } }, { new: true });
    res.json({ success: true, game });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.delete("/games/:gameNumber", async (req, res) => {
  try {
    const result = await Game.findOneAndDelete({ gameNumber: req.params.gameNumber });
    if (!result) return res.status(404).json({ success: false });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post("/games/:gameNumber/toggle-pause", async (req, res) => {
  try {
    const { isPaused } = req.body;
    const game = await Game.findOneAndUpdate({ gameNumber: req.params.gameNumber }, { $set: { isPaused } }, { new: true });
    if (!game) return res.status(404).json({ success: false });
    res.json({ success: true, isPaused: game.isPaused });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get("/games/:gameNumber/pause-status", async (req, res) => {
  try {
    const game = await Game.findOne({ gameNumber: req.params.gameNumber }, 'isPaused');
    if (!game) return res.status(404).json({ success: false });
    res.json({ success: true, isPaused: game.isPaused });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.delete("/users/:email", async (req, res) => {
  try {
    const emailToDelete = req.params.email.toLowerCase().trim();
    const result = await Usuario.findOneAndDelete({ email: emailToDelete });
    if (!result) return res.status(404).json({ success: false, message: "Usuário não encontrado." });
    if (result.grupo) await Grupo.findByIdAndUpdate(result.grupo, { $pull: { membros: result._id } });
    res.json({ success: true, message: "Usuário deletado." });
  } catch (error) { res.status(500).json({ success: false, message: "Erro interno." }); }
});

app.get("/users/by-company", async (req, res) => {
  try {
    const { company } = req.query;
    if (!company) return res.status(400).json({ success: false, message: "Empresa obrigatória." });
    const users = await Usuario.find({ empresa: company }, 'nome email setor regional cargo tempoLideranca gameNumber numeroLiderados').lean();
    res.json({ success: true, users });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get("/user-by-email", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false });
    const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() }).select('-senha').lean();
    if (!usuario) return res.status(404).json({ success: false });
    res.json({ success: true, usuario });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.put("/update-user-by-email", normalizeEmail, async (req, res) => {
  try {
    const { email, ...updateFields } = req.body;
    if (!email) return res.status(400).json({ success: false });
    Object.keys(updateFields).forEach(key => (updateFields[key] == null) && delete updateFields[key]);
    const updatedUser = await Usuario.findOneAndUpdate({ email: email }, { $set: updateFields }, { new: true, runValidators: true }).select('-senha');
    if (!updatedUser) return res.status(404).json({ success: false });
    res.json({ success: true, message: "Atualizado.", usuario: updatedUser });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post("/users/authorize-by-game", async (req, res) => {
  console.log("🚀 [AUTORIZAR] Iniciando autorização...");
  try {
    const { gameNumber } = req.body;
    if (!gameNumber) return res.status(400).json({ success: false, message: "Número do jogo inválido." });
    const game = await Game.findOne({ gameNumber });
    if (!game || !game.clienteId || !game.regionalId) return res.status(400).json({ success: false, message: "Jogo sem Cliente/Regional configurados." });
    const cliente = await Cliente.findById(game.clienteId);
    const regional = await Regional.findById(game.regionalId);
    if (!cliente || !regional) return res.status(400).json({ success: false, message: "Cliente ou Regional não existem no banco." });
    const nomeEmpresa = cliente.nome.trim();
    const nomeRegional = regional.nome.trim();
    const query = { empresa: { $regex: new RegExp(nomeEmpresa, 'i') }, regional: { $regex: new RegExp(nomeRegional, 'i') } };
    const countCheck = await Usuario.countDocuments(query);
    if (countCheck === 0) return res.json({ success: false, message: `⚠️ Nenhum jogador encontrado!` });
    const resUpdate = await Usuario.updateMany(query, { $set: { autorizado: true, gameNumber: gameNumber } });
    res.json({ success: true, updatedCount: resUpdate.modifiedCount, message: `✅ Sucesso! ${resUpdate.modifiedCount} jogadores encontrados e autorizados!` });
  } catch (error) { res.status(500).json({ success: false, message: "Erro interno no servidor." }); }
});

app.post("/group/save-photo", async (req, res) => {
  try {
    const { gameNumber, teamName, image } = req.body;
    if (!gameNumber || !teamName || !image) return res.status(400).json({ success: false, message: "Dados incompletos." });
    const safeGameFolder = `game_${gameNumber}`;
    const safeTeamName = teamName.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const dirPath = path.join(__dirname, 'public', 'images', 'grupos', safeGameFolder, safeTeamName);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `registro_equipe_${safeTeamName}.jpg`;
    fs.writeFileSync(path.join(dirPath, fileName), buffer);
    const photoUrl = `/images/grupos/${safeGameFolder}/${safeTeamName}/${fileName}`;
    await Grupo.findOneAndUpdate({ teamName: teamName }, { photoUrl });
    res.json({ success: true, url: photoUrl });
  } catch (error) { res.status(500).json({ success: false, message: "Erro ao salvar imagem no servidor." }); }
});

app.post("/group/toggle-lock", async (req, res) => {
  try {
    const { groupId } = req.body;
    const grupo = await Grupo.findById(groupId);
    if (!grupo) return res.status(404).json({ success: false, message: "Grupo não encontrado" });
    grupo.isLocked = !grupo.isLocked;
    await grupo.save();
    res.json({ success: true, isLocked: grupo.isLocked });
  } catch (e) { res.status(500).json({ success: false }); }
});

app.post("/group/move-member", async (req, res) => {
  try {
    const { memberId, targetGroupId } = req.body;
    const targetGroup = await Grupo.findById(targetGroupId);
    if (targetGroup.isLocked) return res.status(400).json({ success: false, message: "O grupo de destino está trancado." });
    const user = await Usuario.findById(memberId);
    const sourceGroup = await Grupo.findById(user.grupo);
    if (sourceGroup.isLocked) return res.status(400).json({ success: false, message: "O grupo de origem está trancado." });
    await Grupo.findByIdAndUpdate(sourceGroup._id, { $pull: { membros: memberId } });
    await Grupo.findByIdAndUpdate(targetGroupId, { $addToSet: { membros: memberId } });
    await Usuario.findByIdAndUpdate(memberId, { grupo: targetGroupId });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: "Erro ao mover membro." }); }
});

app.get("/games/:gameNumber/groups-details", async (req, res) => {
  try {
    const { gameNumber } = req.params;
    const usersInGame = await Usuario.find({ gameNumber: parseInt(gameNumber) }).select('_id');
    const userIds = usersInGame.map(u => u._id);
    const groups = await Grupo.find({ membros: { $in: userIds } }).populate('membros');
    res.json({ success: true, groups: groups });
  } catch (error) { res.status(500).json({ success: false }); }
});


const PORT = process.env.PORT || config.serverPort || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Servidor rodando na porta ${PORT}`));