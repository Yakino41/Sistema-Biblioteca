const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const autenticar  = require('../middlewares/autenticar');
const autorizar   = require('../middlewares/autorizar');
const validarUsuario = require('../validators/usuarioValidator');

router.use(autenticar);

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Listar usuários
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [administrador, bibliotecario, leitor]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativo, inativo]
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
router.get('/', autorizar('administrador', 'bibliotecario'), usuarioController.listar);

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Buscar usuário por ID
 *     tags: [Usuários]
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
 *         description: Dados do usuário
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id', usuarioController.buscarPorId);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Cadastrar usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email, senha, tipo]
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "João da Silva"
 *               email:
 *                 type: string
 *                 example: "joao@email.com"
 *               senha:
 *                 type: string
 *                 example: "123456"
 *               tipo:
 *                 type: string
 *                 enum: [administrador, bibliotecario, leitor]
 *               cpf:
 *                 type: string
 *                 example: "123.456.789-09"
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: E-mail ou CPF já cadastrado
 */
router.post('/', autorizar('administrador', 'bibliotecario'), validarUsuario, usuarioController.criar);

/**
 * @swagger
 * /usuarios/{id}:
 *   patch:
 *     summary: Atualizar usuário
 *     tags: [Usuários]
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
 *         description: Usuário atualizado com sucesso
 */
router.patch('/:id', autorizar('administrador', 'bibliotecario'), validarUsuario, usuarioController.atualizar);

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Excluir usuário (somente Administrador)
 *     tags: [Usuários]
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
 *         description: Usuário excluído com sucesso
 */
router.delete('/:id', autorizar('administrador'), usuarioController.excluir);

module.exports = router;