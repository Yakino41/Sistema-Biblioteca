require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUI = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const { sequelize } = require('./models');


const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const livroRoutes = require('./routes/livroRoutes');
const emprestimoRoutes = require('./routes/emprestimoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Segurança ────────────────────────────────────────────────────────────────
app.use(helmet());

// ─── Log ──────────────────────────────────────────────────────────────────────
app.use(morgan('dev'));

// ─── Compressão ───────────────────────────────────────────────────────────────
app.use(compression());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors());

// ─── Rate limit geral ─────────────────────────────────────────────────────────
const limiteGeral = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Muitas requisições. Tente novamente em alguns minutos.' }
});
app.use(limiteGeral);

// ─── Rate limit do login ──────────────────────────────────────────────────────
const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' }
});
app.use('/auth/login', limiteLogin);

// ─── JSON ─────────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Swagger ──────────────────────────────────────────────────────────────────
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Sistema de Biblioteca',
            description: `
API REST completa para gerenciamento de biblioteca.

**Como autenticar:**
1. Faça POST em \`/auth/login\` com email e senha
2. Copie o token JWT retornado
3. Clique em **Authorize** e informe: \`Bearer SEU_TOKEN\`
            `,
            version: '1.0.0'
        },
        servers: [
            { url: `http://localhost:${PORT}`, description: 'Servidor Local' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec, {
    customSiteTitle: 'Biblioteca API Docs'
}));

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/livros', livroRoutes);
app.use('/emprestimos', emprestimoRoutes);

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        sistema: 'API Sistema de Biblioteca',
        versao: '1.0.0',
        documentacao: `http://localhost:${PORT}/api-docs`
    });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ erro: `Rota ${req.method} ${req.path} não encontrada.` });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
});

// ─── Inicialização ────────────────────────────────────────────────────────────
sequelize.authenticate()
    .then(() => {
        console.log('Banco de dados conectado.');
        return sequelize.sync({ alter: true });
    })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`\nServidor rodando em http://localhost:${PORT}`);
            console.log(`Documentação em http://localhost:${PORT}/api-docs\n`);
        });
    })
    .catch(err => {
        console.error('Erro ao conectar ao banco:', err.message);
        process.exit(1);
    });
