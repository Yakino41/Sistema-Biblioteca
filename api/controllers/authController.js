require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const JWT_SECRET     = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

module.exports = {

    async login(req, res) {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
            }

            const usuario = await Usuario.findOne({ where: { email } });

            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }

            if (usuario.status === 'inativo') {
                return res.status(403).json({ erro: 'Usuário inativo. Contate o administrador.' });
            }

            const senhaValida = await usuario.verificarSenha(senha);
            if (!senhaValida) {
                return res.status(401).json({ erro: 'Senha incorreta.' });
            }

            const token = jwt.sign(
                { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            return res.status(200).json({
                mensagem: 'Login realizado com sucesso.',
                token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo: usuario.tipo
                }
            });

        } catch (err) {
            console.error('Erro no login:', err);
            return res.status(500).json({ erro: 'Erro interno ao realizar login.' });
        }
    },

    async alterarSenha(req, res) {
        try {
            const { senhaAtual, novaSenha } = req.body;

            if (!senhaAtual || !novaSenha) {
                return res.status(400).json({ erro: 'Senha atual e nova senha são obrigatórias.' });
            }
            if (novaSenha.length < 6) {
                return res.status(400).json({ erro: 'A nova senha deve ter ao menos 6 caracteres.' });
            }

            const usuario = await Usuario.findByPk(req.usuario.id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }

            const senhaValida = await usuario.verificarSenha(senhaAtual);
            if (!senhaValida) {
                return res.status(401).json({ erro: 'Senha atual incorreta.' });
            }

            usuario.senha = novaSenha;
            await usuario.save(); // o hook beforeUpdate faz o hash automaticamente

            return res.status(200).json({ mensagem: 'Senha alterada com sucesso.' });
        } catch (err) {
            console.error('Erro ao alterar senha:', err);
            return res.status(500).json({ erro: 'Erro interno ao alterar senha.' });
        }
    },

    async perfil(req, res) {
        try {
            const usuario = await Usuario.findByPk(req.usuario.id, {
                attributes: { exclude: ['senha'] }
            });

            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }

            return res.status(200).json(usuario);
        } catch (err) {
            console.error('Erro ao buscar perfil:', err);
            return res.status(500).json({ erro: 'Erro interno ao buscar perfil.' });
        }
    }
};