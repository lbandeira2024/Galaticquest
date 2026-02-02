const express = require('express');
const router = express.Router();
const db = require('../models');
const User = db.User;

// Rota de registro
router.post('/register', async (req, res) => {
    try {
        // Normalizar e-mail (minúsculas, sem espaços)
        req.body.email = req.body.email.toLowerCase().trim();

        // Verificar se o e-mail já existe
        const existingUser = await User.findOne({ where: { email: req.body.email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Este e-mail já está em uso',
                details: 'Por favor, utilize outro endereço de e-mail ou faça login'
            });
        }

        // Criar novo usuário
        const newUser = await User.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            usuario: {
                id: newUser.id,
                nome: newUser.nome,
                email: newUser.email,
                empresa: newUser.empresa
            }
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar usuário',
            details: error.errors ? error.errors.map(e => e.message) : error.message
        });
    }
});

// Rota de login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas',
                details: 'E-mail não encontrado'
            });
        }

        // Comparar senhas (simplificado - na prática use bcrypt)
        if (user.senha !== senha) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas',
                details: 'Senha incorreta'
            });
        }

        res.json({
            success: true,
            message: 'Login bem-sucedido',
            usuario: {
                id: user.id,
                nome: user.nome,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer login',
            details: error.message
        });
    }
});

// Rota para verificar disponibilidade de e-mail
router.get('/check-email', async (req, res) => {
    try {
        const { email } = req.query;

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'E-mail inválido',
                available: false
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ where: { email: normalizedEmail } });

        res.json({
            success: true,
            available: !existingUser
        });
    } catch (error) {
        console.error('Erro ao verificar e-mail:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar e-mail',
            available: false
        });
    }
});

module.exports = router;