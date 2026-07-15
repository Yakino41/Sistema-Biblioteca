const express = require('express');
const router = express.Router();
const livroController = require('../controllers/livroController');
const autenticar = require('../middlewares/autenticar');
const autorizar  = require('../middlewares/autorizar');
const validarLivro = require('../validators/livroValidator');

router.use(autenticar);

/**
 * @swagger
 * /livros:
 *   get:
 *     summary: Listar livros com filtros
 *     tags: [Livros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [disponivel, indisponivel]
 *     responses:
 *       200:
 *         description: Lista de livros
 */
router.get('/', livroController.listar);

/**
 * @swagger
 * /livros/{id}:
 *   get:
 *     summary: Buscar livro por ID
 *     tags: [Livros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do livro
 *       404:
 *         description: Livro não encontrado
 */
router.get('/:id', livroController.buscarPorId);

/**
 * @swagger
 * /livros:
 *   post:
 *     summary: Cadastrar livro (Admin ou Bibliotecário)
 *     tags: [Livros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, autor, editora, ano_publicacao, categoria, isbn, quantidade_total]
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: "Clean Code"
 *               autor:
 *                 type: string
 *                 example: "Robert C. Martin"
 *               editora:
 *                 type: string
 *                 example: "Prentice Hall"
 *               ano_publicacao:
 *                 type: integer
 *                 example: 2008
 *               categoria:
 *                 type: string
 *                 example: "Programação"
 *               isbn:
 *                 type: string
 *                 example: "978-0132350884"
 *               quantidade_total:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       201:
 *         description: Livro cadastrado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: ISBN já cadastrado
 */
router.post('/', autorizar('administrador', 'bibliotecario'), validarLivro, livroController.criar);

/**
 * @swagger
 * /livros/{id}:
 *   patch:
 *     summary: Atualizar livro (Admin ou Bibliotecário)
 *     tags: [Livros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Livro atualizado com sucesso
 */
router.patch('/:id', autorizar('administrador', 'bibliotecario'), validarLivro, livroController.atualizar);

/**
 * @swagger
 * /livros/{id}:
 *   delete:
 *     summary: Excluir livro (somente Administrador)
 *     tags: [Livros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Livro excluído com sucesso
 *       409:
 *         description: Existem empréstimos em aberto
 */
router.delete('/:id', autorizar('administrador'), livroController.excluir);

module.exports = router;
