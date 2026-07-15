require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, Usuario, Livro, Emprestimo } = require('../models');

async function seed() {
    try {
        console.log('Conectando ao banco de dados...');
        await sequelize.authenticate();

        console.log('Sincronizando tabelas...');
        await sequelize.sync({ alter: true });

        // ──────────── Usuários ────────────
        const usuariosExistentes = await Usuario.count();
        if (usuariosExistentes === 0) {
            console.log('Criando usuários iniciais...');
            await Usuario.bulkCreate([  // individualHooks: true garante que o beforeCreate rode e faça o hash bcrypt
                {
                    nome: 'Administrador',
                    email: 'admin@biblioteca.com',
                    senha: '123456',
                    tipo: 'administrador',
                    cpf: '311.883.450-10',
                    telefone: '(43) 99999-0001',
                    status: 'ativo'
                },
                {
                    nome: 'Lavinia Bibliotecária',
                    email: 'lavinia@biblioteca.com',
                    senha: '123456',
                    tipo: 'bibliotecario',
                    cpf: '855.541.720-16',
                    telefone: '(43) 99999-0002',
                    status: 'ativo'
                },
                {
                    nome: 'Arthur Stellato',
                    email: 'arthur@leitor.com',
                    senha: '123456',
                    tipo: 'leitor',
                    cpf: '132.080.080-74',
                    telefone: '(43) 99999-0003',
                    endereco: 'Rua das Flores, 100',
                    status: 'ativo'
                },
                {
                    nome: 'Conrado',
                    email: 'conrado@leitor.com',
                    senha: '123456',
                    tipo: 'leitor',
                    cpf: '772.001.620-35',
                    telefone: '(43) 99999-0004',
                    endereco: 'Av. Brasil, 200',
                    status: 'ativo'
                }
            ], { individualHooks: true });
            console.log('Usuários criados (senha padrão: 123456)');
        } else {
            console.log('Usuários já existem, pulando.');
        }

        // ──────────── Livros ────────────
        const livrosExistentes = await Livro.count();
        if (livrosExistentes === 0) {
            console.log('Criando livros iniciais...');
            await Livro.bulkCreate([
                {
                    titulo: 'Clean Code: Código Limpo',
                    autor: 'Robert C. Martin',
                    editora: 'Prentice Hall',
                    ano_publicacao: 2008,
                    categoria: 'Programação',
                    isbn: '978-0132350884',
                    quantidade_total: 3,
                    quantidade_disponivel: 3,
                    descricao: 'Guia sobre boas práticas de escrita de código.'
                },
                {
                    titulo: 'O Senhor dos Anéis',
                    autor: 'J.R.R. Tolkien',
                    editora: 'HarperCollins',
                    ano_publicacao: 1954,
                    categoria: 'Literatura Fantástica',
                    isbn: '978-0618640157',
                    quantidade_total: 2,
                    quantidade_disponivel: 2,
                    descricao: 'Épica história da Terra Média.'
                },
                {
                    titulo: 'Dom Casmurro',
                    autor: 'Machado de Assis',
                    editora: 'Penguin',
                    ano_publicacao: 1899,
                    categoria: 'Literatura Brasileira',
                    isbn: '978-8572328197',
                    quantidade_total: 4,
                    quantidade_disponivel: 4,
                    descricao: 'Clássico da literatura brasileira.'
                },
                {
                    titulo: 'Design Patterns',
                    autor: 'Gang of Four',
                    editora: 'Addison-Wesley',
                    ano_publicacao: 1994,
                    categoria: 'Programação',
                    isbn: '978-0201633610',
                    quantidade_total: 2,
                    quantidade_disponivel: 2,
                    descricao: 'Padrões de projeto de software reutilizáveis.'
                },
                {
                    titulo: 'Sapiens: Uma Breve História da Humanidade',
                    autor: 'Yuval Noah Harari',
                    editora: 'L&PM',
                    ano_publicacao: 2011,
                    categoria: 'História',
                    isbn: '978-8525432186',
                    quantidade_total: 3,
                    quantidade_disponivel: 3,
                    descricao: 'Uma viagem pela história da humanidade.'
                }
            ]);
            console.log(' Livros criados.');
        } else {
            console.log(' Livros já existem, pulando.');
        }

        console.log('\nSeed concluído com sucesso!');
        console.log('──────────────────────────────────────────────────');
        console.log('Credenciais para login:');
        console.log('  Administrador:  admin@biblioteca.com  / 123456');
        console.log('  Bibliotecário:  lavinia@biblioteca.com  / 123456');
        console.log('  Leitor 1:       arthur@leitor.com     / 123456');
        console.log('  Leitor 2:       conrado@leitor.com    / 123456');
        console.log('──────────────────────────────────────────────────');
        console.log('\nExemplo de empréstimo com MÚLTIPLOS livros:');
        console.log('POST /emprestimos');
        console.log(JSON.stringify({
            usuario_id: 3,
            livros_ids: [1, 2],
            data_prevista_devolucao: "2025-08-01",
            observacao: "Empréstimo de dois livros"
        }, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Erro no seed:', err.message);
        process.exit(1);
    }
}

seed();