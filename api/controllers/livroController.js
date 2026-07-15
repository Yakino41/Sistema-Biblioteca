const { Livro, Emprestimo } = require('../models');
const { Op } = require('sequelize');

module.exports = {

    async listar(req, res) {
        try {
            const { titulo, autor, categoria, isbn, status, busca, page = 1, limit = 10 } = req.query;
            const where = {};

            if (titulo)    where.titulo    = { [Op.iLike]: `%${titulo}%` };
            if (autor)     where.autor     = { [Op.iLike]: `%${autor}%` };
            if (categoria) where.categoria = { [Op.iLike]: `%${categoria}%` };
            if (isbn)      where.isbn      = { [Op.iLike]: `%${isbn}%` };
            if (status)    where.status    = status;

            if (busca) {
                where[Op.or] = [
                    { titulo:    { [Op.iLike]: `%${busca}%` } },
                    { autor:     { [Op.iLike]: `%${busca}%` } },
                    { categoria: { [Op.iLike]: `%${busca}%` } },
                    { isbn:      { [Op.iLike]: `%${busca}%` } }
                ];
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { count, rows } = await Livro.findAndCountAll({
                where,
                order: [['titulo', 'ASC']],
                limit:  parseInt(limit),
                offset
            });

            return res.status(200).json({
                total:       count,
                pagina:      parseInt(page),
                por_pagina:  parseInt(limit),
                total_paginas: Math.ceil(count / parseInt(limit)),
                livros:      rows
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao listar livros.' });
        }
    },

    async buscarPorId(req, res) {
        try {
            const livro = await Livro.findByPk(req.params.id);
            if (!livro) return res.status(404).json({ erro: 'Livro não encontrado.' });
            return res.status(200).json(livro);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao buscar livro.' });
        }
    },

    async criar(req, res) {
        try {
            const { titulo, autor, editora, ano_publicacao, categoria, isbn, quantidade_total, descricao } = req.body;

            const isbnExistente = await Livro.findOne({ where: { isbn } });
            if (isbnExistente) return res.status(409).json({ erro: 'ISBN já cadastrado.' });

            const livro = await Livro.create({
                titulo, autor, editora, ano_publicacao, categoria, isbn,
                quantidade_total,
                quantidade_disponivel: quantidade_total,
                descricao
            });

            return res.status(201).json({ mensagem: 'Livro cadastrado com sucesso.', livro });
        } catch (err) {
            console.error(err);
            if (err.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ erro: 'ISBN já cadastrado.' });
            }
            return res.status(500).json({ erro: 'Erro ao cadastrar livro.' });
        }
    },

    async atualizar(req, res) {
        try {
            const livro = await Livro.findByPk(req.params.id);
            if (!livro) return res.status(404).json({ erro: 'Livro não encontrado.' });

            const { titulo, autor, editora, ano_publicacao, categoria, isbn, quantidade_total, descricao } = req.body;

            let quantidade_disponivel = livro.quantidade_disponivel;
            if (quantidade_total !== undefined && quantidade_total !== livro.quantidade_total) {
                const diff = quantidade_total - livro.quantidade_total;
                quantidade_disponivel = Math.max(0, livro.quantidade_disponivel + diff);
            }

            await livro.update({ titulo, autor, editora, ano_publicacao, categoria, isbn, quantidade_total, quantidade_disponivel, descricao });
            return res.status(200).json({ mensagem: 'Livro atualizado com sucesso.', livro });
        } catch (err) {
            console.error(err);
            if (err.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ erro: 'ISBN já pertence a outro livro.' });
            }
            return res.status(500).json({ erro: 'Erro ao atualizar livro.' });
        }
    },

    async excluir(req, res) {
        try {
            const livro = await Livro.findByPk(req.params.id);
            if (!livro) return res.status(404).json({ erro: 'Livro não encontrado.' });

            const { EmprestimoLivro } = require('../models');
            const emprestimosAbertos = await EmprestimoLivro.count({
                include: [{
                    model: Emprestimo,
                    as: 'emprestimo',
                    where: { status: { [Op.in]: ['em_aberto', 'atrasado'] } }
                }],
                where: { livro_id: livro.id }
            });

            if (emprestimosAbertos > 0) {
                return res.status(409).json({
                    erro: `Não é possível excluir. Existem ${emprestimosAbertos} empréstimo(s) em aberto para este livro.`
                });
            }

            await livro.destroy();
            return res.status(200).json({ mensagem: 'Livro excluído com sucesso.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao excluir livro.' });
        }
    }
};
