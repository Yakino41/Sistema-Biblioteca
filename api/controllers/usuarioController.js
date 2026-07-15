const { Usuario } = require('../models');
const { Op } = require('sequelize');

const semSenha = { attributes: { exclude: ['senha'] } };

// ── Validação de CPF ─────────────────────────────
function validarCPF(cpf) {
    // Remove pontos, traço e espaços — pega só os dígitos
    const numeros = cpf.replace(/\D/g, '');

    // Precisa ter exatamente 11 dígitos
    if (numeros.length !== 11) return false;

    // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(numeros)) return false;

    // Calcula o primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(numeros[i]) * (10 - i);
    }
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;

    // Calcula o segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(numeros[i]) * (11 - i);
    }
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;

    // Compara com os dígitos reais do CPF
    return (
        digito1 === parseInt(numeros[9]) &&
        digito2 === parseInt(numeros[10])
    );
}

module.exports = {

    // Listar todos os usuários
    async listar(req, res) {
        try {
            const { tipo, status, busca } = req.query;
            const where = {};

            // Bibliotecário só pode ver leitores — ignora qualquer tipo enviado na query
            if (req.usuario.tipo === 'bibliotecario') {
                where.tipo = 'leitor';
            } else if (tipo) {
                where.tipo = tipo;
            }

            if (status) where.status = status;
            if (busca) {
                where[Op.or] = [
                    { nome:  { [Op.iLike]: `%${busca}%` } },
                    { email: { [Op.iLike]: `%${busca}%` } },
                    { cpf:   { [Op.iLike]: `%${busca}%` } },
                ];
            }

            const usuarios = await Usuario.findAll({ where, ...semSenha, order: [['nome', 'ASC']] });
            return res.status(200).json(usuarios);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao listar usuários.' });
        }
    },

    // Buscar usuário por ID
    async buscarPorId(req, res) {
        try {
            const { id } = req.params;

            if (req.usuario.tipo === 'leitor' && req.usuario.id !== parseInt(id)) {
                return res.status(403).json({ erro: 'Acesso negado.' });
            }

            const usuario = await Usuario.findByPk(id, semSenha);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }

            return res.status(200).json(usuario);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao buscar usuário.' });
        }
    },

    // Cadastrar usuário
    async criar(req, res) {
        try {
            const { nome, email, senha, tipo, cpf, telefone, endereco, status } = req.body;

            // Campos básicos obrigatórios
            if (!nome || !email || !senha) {
                return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
            }

            // Bibliotecário só pode criar leitor
            if (req.usuario.tipo === 'bibliotecario' && tipo && tipo !== 'leitor') {
                return res.status(403).json({ erro: 'Bibliotecário só pode cadastrar leitores.' });
            }

            const tipoFinal = tipo || 'leitor';

            // Leitor precisa de CPF
            if (tipoFinal === 'leitor') {
                if (!cpf) {
                    return res.status(400).json({ erro: 'CPF é obrigatório para leitores.' });
                }
                if (!validarCPF(cpf)) {
                    return res.status(400).json({ erro: 'CPF inválido.' });
                }
            }

            const emailExistente = await Usuario.findOne({ where: { email } });
            if (emailExistente) {
                return res.status(409).json({ erro: 'E-mail já cadastrado.' });
            }

            const usuario = await Usuario.create({
                nome, email, senha,
                tipo: tipoFinal,
                cpf: cpf || null,
                telefone, endereco,
                status: status || 'ativo'
            });

            const { senha: _, ...usuarioSemSenha } = usuario.toJSON();
            return res.status(201).json({ mensagem: 'Usuário criado com sucesso.', usuario: usuarioSemSenha });
        } catch (err) {
            console.error(err);
            if (err.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ erro: 'CPF ou e-mail já cadastrado.' });
            }
            return res.status(500).json({ erro: 'Erro ao criar usuário.' });
        }
    },

    // Editar usuário
    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const { nome, email, senha, tipo, cpf, telefone, endereco, status } = req.body;

            const usuario = await Usuario.findByPk(id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }

            // Bibliotecário só pode editar leitores e não pode mudar tipo
            if (req.usuario.tipo === 'bibliotecario') {
                if (usuario.tipo !== 'leitor') {
                    return res.status(403).json({ erro: 'Bibliotecário só pode editar leitores.' });
                }
                if (tipo && tipo !== usuario.tipo) {
                    return res.status(403).json({ erro: 'Bibliotecário não pode alterar o tipo do usuário.' });
                }
            }

            const tipoFinal = tipo || usuario.tipo;

            // Se é leitor (atual ou novo), valida CPF
            if (tipoFinal === 'leitor') {
                const cpfFinal = cpf || usuario.cpf;
                if (!cpfFinal) {
                    return res.status(400).json({ erro: 'CPF é obrigatório para leitores.' });
                }
                // Só valida matematicamente se um novo CPF foi enviado
                if (cpf && !validarCPF(cpf)) {
                    return res.status(400).json({ erro: 'CPF inválido.' });
                }
            }

            await usuario.update({ nome, email, senha, tipo, cpf, telefone, endereco, status });

            const atualizado = await Usuario.findByPk(id, semSenha);
            return res.status(200).json({ mensagem: 'Usuário atualizado com sucesso.', usuario: atualizado });
        } catch (err) {
            console.error(err);
            if (err.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ erro: 'CPF ou e-mail já pertence a outro usuário.' });
            }
            return res.status(500).json({ erro: 'Erro ao atualizar usuário.' });
        }
    },

    // Excluir usuário (somente admin)
    async excluir(req, res) {
        try {
            const { id } = req.params;

            if (req.usuario.id === parseInt(id)) {
                return res.status(400).json({ erro: 'Não é possível excluir o próprio usuário.' });
            }

            const usuario = await Usuario.findByPk(id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }

            await usuario.destroy();
            return res.status(200).json({ mensagem: 'Usuário excluído com sucesso.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao excluir usuário.' });
        }
    }
};