const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const autenticar = require('../middlewares/autenticar');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login no sistema
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email:
 *                 type: string
 *                 example: arthur@leitor.com
 *               senha:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login realizado, retorna token JWT
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/perfil:
 *   get:
 *     summary: Retorna os dados do usuário logado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário autenticado
 *       401:
 *         description: Não autenticado
 */
router.get('/perfil', autenticar, authController.perfil);

/**
 * @swagger
 * /auth/alterar-senha:
 *   put:
 *     summary: Altera a senha do usuário logado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [senhaAtual, novaSenha]
 *             properties:
 *               senhaAtual:
 *                 type: string
 *               novaSenha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       401:
 *         description: Senha atual incorreta
 */
router.put('/alterar-senha', autenticar, authController.alterarSenha);

module.exports = router;
