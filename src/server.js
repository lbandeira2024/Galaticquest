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
  gameNumber: { type: Number }
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
    await Grupo.findByIdAndUpdate(groupId, { $set: updateData }, { new: true });
    const user = await Usuario.findById(req.params.userId).populate('grupo');
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ success: false }); }
});

// --- ROTA CORRIGIDA PARA EVITAR 404 NO CONSOLE ---
app.get("/:userId/game-data", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.userId).populate('grupo');

    // Se não achar o usuário, aí sim é 404
    if (!usuario) return res.status(404).json({ success: false, message: "Usuário não encontrado" });

    let isPaused = false;
    if (usuario.gameNumber) {
      const game = await Game.findOne({ gameNumber: usuario.gameNumber });
      if (game) isPaused = game.isPaused;
    }

    // Se o usuário não tem grupo (ex: Admin ou recém-criado), retorna sucesso com dados nulos
    // Isso evita o erro vermelho "404" no console do navegador
    if (!usuario.grupo) {
      return res.json({ success: true, isPaused, group: null, noGroup: true });
    }

    // Se tiver grupo, retorna os dados normais
    res.json({ success: true, ...usuario.grupo.toObject(), isPaused });
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
      isLocked: false
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
    await Grupo.findByIdAndUpdate(groupId, { naveEscolhida: shipId });
    const user = await Usuario.findById(userId).populate('grupo');
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ success: false }); }
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
    res.json({ success: true, challenges: desafios.map(d => ({ desafioId: d.desafioId, escolhaIdLetter: d.escolha.id, timestamp: d.timestamp })) });
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
    res.status(201).json({ success: true, data: novaEscolha });
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

// --- ROTA CORRIGIDA: INCLUSÃO DE gameNumber e numeroLiderados NO SELECT ---
app.get("/users/by-company", async (req, res) => {
  try {
    const { company } = req.query;
    if (!company) return res.status(400).json({ success: false, message: "Empresa obrigatória." });
    // Adicionado gameNumber e numeroLiderados para o frontend conseguir filtrar
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