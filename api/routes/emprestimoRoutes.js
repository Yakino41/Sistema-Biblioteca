const express = require('express');
const router = express.Router();
const emprestimoController = require('../controllers/emprestimoController');
const autenticar = require('../middlewares/autenticar');
const autorizar  = require('../middlewares/autorizar');
const validarEmprestimo = require('../validators/emprestimoValidator');

router.use(autenticar);

/**
 * @swagger
 * /emprestimos:
 *   get:
 *     summary: Listar empréstimos
 *     tags: [Empréstimos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [em_aberto, devolvido, atrasado]
 *       - in: query
 *         name: usuario_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: livro_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de empréstimos
 */
router.get('/', emprestimoController.listar);

/**
 * @swagger
 * /emprestimos/atrasados:
 *   get:
 *     summary: Listar empréstimos atrasados (Admin ou Bibliotecário)
 *     tags: [Empréstimos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empréstimos atrasados
 */
router.get('/atrasados', autorizar('administrador', 'bibliotecario'), emprestimoController.listarAtrasados);

/**
 * @swagger
 * /emprestimos/relatorio:
 *   get:
 *     summary: Relatório geral (somente Administrador)
 *     tags: [Empréstimos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Totais do sistema
 */
router.get('/relatorio', autorizar('administrador'), emprestimoController.relatorio);

/**
 * @swagger
 * /emprestimos/historico/{id}:
 *   get:
 *     summary: Histórico de empréstimos de um leitor (leitor só acessa o próprio; Admin/Bibliotecário acessam qualquer um)
 *     tags: [Empréstimos]
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
 *         description: Histórico do leitor
 *       403:
 *         description: Leitor tentando acessar histórico de outro usuário
 */
router.get('/historico/:id', emprestimoController.historicoPorLeitor);

/**
 * @swagger
 * /emprestimos/{id}:
 *   get:
 *     summary: Buscar empréstimo por ID
 *     tags: [Empréstimos]
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
 *         description: Dados do empréstimo
 */
router.get('/:id', emprestimoController.buscarPorId);

/**
 * @swagger
 * /emprestimos:
 *   post:
 *     summary: Registrar empréstimo com um ou mais livros (Admin ou Bibliotecário)
 *     tags: [Empréstimos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario_id, livros_ids, data_prevista_devolucao]
 *             properties:
 *               usuario_id:
 *                 type: integer
 *                 example: 3
 *               livros_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               data_prevista_devolucao:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-31"
 *               observacao:
 *                 type: string
 *     responses:
 *       201:
 *         description: Empréstimo registrado com sucesso
 *       400:
 *         description: Dados inválidos ou livro indisponível
 */
router.post('/', autorizar('administrador', 'bibliotecario'), validarEmprestimo, emprestimoController.criar);

/**
 * @swagger
 * /emprestimos/{id}/devolucao:
 *   patch:
 *     summary: Registrar devolução (Admin ou Bibliotecário)
 *     tags: [Empréstimos]
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
 *         description: Devolução registrada com sucesso
 */
router.patch('/:id/devolucao', autorizar('administrador', 'bibliotecario'), emprestimoController.registrarDevolucao);

module.exports = router;