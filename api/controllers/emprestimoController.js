const dayjs = require('dayjs');
const { Emprestimo, Usuario, Livro, EmprestimoLivro } = require('../models');
const { Sequelize, Op } = require('sequelize');

// Atualiza automaticamente empréstimos com data vencida para "atrasado"
async function atualizarAtrasados() {
    const hoje = dayjs().format('YYYY-MM-DD');
    await Emprestimo.update(
        { status: 'atrasado' },
        {
            where: {
                status: 'em_aberto',
                data_prevista_devolucao: { [Op.lt]: hoje }
            }
        }
    );
}

// Include padrão: popula usuario e lista de livros do empréstimo
const include = [
    { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email', 'cpf'] },
    { model: Livro, as: 'livros', attributes: ['id', 'titulo', 'autor', 'isbn', 'quantidade_disponivel'], through: { attributes: [] } }
];

module.exports = {

    // Listar empréstimos com filtros
    async listar(req, res) {
        try {
            await atualizarAtrasados();

            const { status, usuario_id, livro_id, data_inicio, data_fim } = req.query;
            const where = {};

            // Leitor só vê seus próprios empréstimos
            if (req.usuario.tipo === 'leitor') {
                where.usuario_id = req.usuario.id;
            } else {
                if (usuario_id) where.usuario_id = usuario_id;
            }

            if (status)  where.status   = status;

            if (data_inicio || data_fim) {
                where.data_emprestimo = {};
                if (data_inicio) where.data_emprestimo[Op.gte] = data_inicio;
                if (data_fim)    where.data_emprestimo[Op.lte] = data_fim;
            }

            const includeComFiltro = [
                {
                    model: Livro,
                    as: 'livros',
                    attributes: ['id', 'titulo', 'autor', 'isbn'],
                    through: { attributes: [] },
                    ...(livro_id ? { where: { id: livro_id }, required: true } : {})
                },
                { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email', 'cpf'] }
            ];

            const emprestimos = await Emprestimo.findAll({
                where,
                include: includeComFiltro,
                order: [['data_emprestimo', 'DESC']]
            });

            // Adiciona dias de atraso em cada empréstimo atrasado
            const resultado = emprestimos.map(e => {
                const obj = e.toJSON();
                if (obj.status === 'atrasado') {
                    obj.dias_atraso = dayjs().diff(dayjs(obj.data_prevista_devolucao), 'day');
                } else {
                    obj.dias_atraso = 0;
                }
                return obj;
            });

            return res.status(200).json(resultado);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao listar empréstimos.' });
        }
    },

    // Buscar empréstimo por ID
    async buscarPorId(req, res) {
        try {
            await atualizarAtrasados();
            const emprestimo = await Emprestimo.findByPk(req.params.id, { include });

            if (!emprestimo) {
                return res.status(404).json({ erro: 'Empréstimo não encontrado.' });
            }

            if (req.usuario.tipo === 'leitor' && emprestimo.usuario_id !== req.usuario.id) {
                return res.status(403).json({ erro: 'Acesso negado.' });
            }

            const obj = emprestimo.toJSON();
            if (obj.status === 'atrasado') {
                obj.dias_atraso = dayjs().diff(dayjs(obj.data_prevista_devolucao), 'day');
            } else {
                obj.dias_atraso = 0;
            }

            return res.status(200).json(obj);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao buscar empréstimo.' });
        }
    },

    // Registrar novo empréstimo com um ou mais livros
    async criar(req, res) {
        try {
            const { usuario_id, livros_ids, data_prevista_devolucao, observacao } = req.body;

            // Verifica leitor
            const usuario = await Usuario.findByPk(usuario_id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Leitor não encontrado.' });
            }
            if (usuario.tipo !== 'leitor') {
                return res.status(400).json({ erro: 'O empréstimo deve ser associado a um usuário com perfil de leitor.' });
            }
            if (usuario.status === 'inativo') {
                return res.status(400).json({ erro: 'Leitor inativo não pode realizar empréstimo.' });
            }

            // Verifica todos os livros
            const livros = await Livro.findAll({ where: { id: { [Op.in]: livros_ids } } });

            if (livros.length !== livros_ids.length) {
                return res.status(404).json({ erro: 'Um ou mais livros não foram encontrados.' });
            }

            const indisponiveis = livros.filter(l => l.quantidade_disponivel <= 0);
            if (indisponiveis.length > 0) {
                return res.status(400).json({
                    erro: 'Os seguintes livros não têm exemplares disponíveis.',
                    livros: indisponiveis.map(l => ({ id: l.id, titulo: l.titulo }))
                });
            }

            // Valida que a data prevista é futura
            const hoje = dayjs().format('YYYY-MM-DD');
            if (data_prevista_devolucao <= hoje) {
                return res.status(400).json({ erro: 'A data prevista de devolução deve ser posterior à data atual.' });
            }

            // Cria o empréstimo
            const emprestimo = await Emprestimo.create({
                usuario_id,
                data_emprestimo: hoje,
                data_prevista_devolucao,
                status: 'em_aberto',
                observacao
            });

            // Associa os livros e decrementa estoque
            await emprestimo.addLivros(livros);
            for (const livro of livros) {
                await livro.update({ quantidade_disponivel: livro.quantidade_disponivel - 1 });
            }

            const resultado = await Emprestimo.findByPk(emprestimo.id, { include });
            return res.status(201).json({ mensagem: 'Empréstimo registrado com sucesso.', emprestimo: resultado });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao registrar empréstimo.' });
        }
    },

    // Registrar devolução
    async registrarDevolucao(req, res) {
        try {
            const { id } = req.params;
            const { observacao } = req.body || {};

            const emprestimo = await Emprestimo.findByPk(id, { include });
            if (!emprestimo) {
                return res.status(404).json({ erro: 'Empréstimo não encontrado.' });
            }
            if (emprestimo.status === 'devolvido') {
                return res.status(400).json({ erro: 'Este empréstimo já foi devolvido.' });
            }

            const hoje = dayjs().format('YYYY-MM-DD');

            // Calcula se houve atraso na devolução
            const atrasado = dayjs(hoje).isAfter(dayjs(emprestimo.data_prevista_devolucao));
            const diasAtraso = atrasado
                ? dayjs(hoje).diff(dayjs(emprestimo.data_prevista_devolucao), 'day')
                : 0;

            await emprestimo.update({
                data_real_devolucao: hoje,
                status: 'devolvido',
                observacao: observacao || emprestimo.observacao
            });

            // Incrementa estoque de cada livro devolvido
            for (const livro of emprestimo.livros) {
                await livro.update({ quantidade_disponivel: livro.quantidade_disponivel + 1 });
            }

            const resultado = await Emprestimo.findByPk(id, { include });
            return res.status(200).json({
                mensagem: 'Devolução registrada com sucesso.',
                devolvido_com_atraso: atrasado,
                dias_atraso: diasAtraso,
                emprestimo: resultado
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao registrar devolução.' });
        }
    },

    // Listar empréstimos atrasados
    async listarAtrasados(req, res) {
        try {
            await atualizarAtrasados();
            const emprestimos = await Emprestimo.findAll({
                where: { status: 'atrasado' },
                include,
                order: [['data_prevista_devolucao', 'ASC']]
            });

            // Adiciona dias de atraso em cada registro
            const resultado = emprestimos.map(e => {
                const obj = e.toJSON();
                obj.dias_atraso = dayjs().diff(dayjs(obj.data_prevista_devolucao), 'day');
                return obj;
            });

            return res.status(200).json(resultado);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao listar empréstimos atrasados.' });
        }
    },

    // Histórico de um leitor específico
    async historicoPorLeitor(req, res) {
        try {
            await atualizarAtrasados();
            const { id } = req.params;

            if (req.usuario.tipo === 'leitor' && req.usuario.id !== parseInt(id)) {
                return res.status(403).json({ erro: 'Acesso negado.' });
            }

            const usuario = await Usuario.findByPk(id, { attributes: { exclude: ['senha'] } });
            if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

            const emprestimos = await Emprestimo.findAll({
                where: { usuario_id: id },
                include: [
                    { model: Livro, as: 'livros', attributes: ['id', 'titulo', 'autor', 'isbn'], through: { attributes: [] } }
                ],
                order: [['data_emprestimo', 'DESC']]
            });

            // Adiciona dias de atraso onde aplicável
            const resultado = emprestimos.map(e => {
                const obj = e.toJSON();
                if (obj.status === 'atrasado') {
                    obj.dias_atraso = dayjs().diff(dayjs(obj.data_prevista_devolucao), 'day');
                } else {
                    obj.dias_atraso = 0;
                }
                return obj;
            });

            return res.status(200).json({
                usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
                emprestimos: resultado
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao buscar histórico.' });
        }
    },

    // Relatório geral (inclui dados prontos para os gráficos do dashboard)
    async relatorio(req, res) {
        try {
            await atualizarAtrasados();

            const totalEmprestimos  = await Emprestimo.count();
            const emAberto          = await Emprestimo.count({ where: { status: 'em_aberto' } });
            const atrasados         = await Emprestimo.count({ where: { status: 'atrasado' } });
            const devolvidos        = await Emprestimo.count({ where: { status: 'devolvido' } });
            const totalLivros       = await Livro.count();
            const livrosDisponiveis = await Livro.count({ where: { status: 'disponivel' } });
            const totalLeitores     = await Usuario.count({ where: { tipo: 'leitor' } });
            const leitoresAtivos    = await Usuario.count({ where: { tipo: 'leitor', status: 'ativo' } });

            // ── Gráfico: quantidade de livros por categoria ──
            const livrosPorCategoriaRaw = await Livro.findAll({
                attributes: ['categoria', [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']],
                group: ['categoria'],
                order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
                raw: true
            });
            const livrosPorCategoria = livrosPorCategoriaRaw.map(l => ({
                categoria: l.categoria,
                total: parseInt(l.total)
            }));

            // ── Gráfico: top 5 livros mais emprestados (histórico completo) ──
            const maisEmprestadosRaw = await EmprestimoLivro.findAll({
                attributes: ['livro_id', [Sequelize.fn('COUNT', Sequelize.col('EmprestimoLivro.id')), 'total']],
                include: [{ model: Livro, as: 'livro', attributes: ['titulo'] }],
                group: ['livro_id', 'livro.id', 'livro.titulo'],
                order: [[Sequelize.fn('COUNT', Sequelize.col('EmprestimoLivro.id')), 'DESC']],
                limit: 5
            });
            const maisEmprestados = maisEmprestadosRaw.map(m => ({
                titulo: m.livro.titulo,
                total: parseInt(m.get('total'))
            }));

            // ── Gráfico: empréstimos por mês (últimos 6 meses, com zero nos meses sem registro) ──
            const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
            const inicioJanela = dayjs().subtract(5, 'month').startOf('month');

            const porMesRaw = await Emprestimo.findAll({
                attributes: [
                    [Sequelize.fn('TO_CHAR', Sequelize.col('data_emprestimo'), 'YYYY-MM'), 'mes'],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
                ],
                where: { data_emprestimo: { [Op.gte]: inicioJanela.format('YYYY-MM-DD') } },
                group: ['mes'],
                raw: true
            });
            // Mapa rápido "YYYY-MM" -> total, vindo do banco
            const mapaPorMes = {};
            porMesRaw.forEach(m => { mapaPorMes[m.mes] = parseInt(m.total); });

            // Preenche os 6 meses da janela, mesmo os que não tiveram nenhum empréstimo
            const emprestimosPorMes = [];
            for (let i = 0; i < 6; i++) {
                const mesRef = inicioJanela.add(i, 'month');
                const chave  = mesRef.format('YYYY-MM');
                emprestimosPorMes.push({
                    mes: MESES_PT[mesRef.month()] + '/' + mesRef.format('YY'),
                    total: mapaPorMes[chave] || 0
                });
            }

            return res.status(200).json({
                gerado_em: dayjs().format('DD/MM/YYYY HH:mm:ss'),
                emprestimos: { total: totalEmprestimos, em_aberto: emAberto, atrasados, devolvidos },
                livros:  { total: totalLivros, disponiveis: livrosDisponiveis, indisponiveis: totalLivros - livrosDisponiveis },
                leitores: { total: totalLeitores, ativos: leitoresAtivos, inativos: totalLeitores - leitoresAtivos },
                graficos: {
                    statusEmprestimos: [
                        { nome: 'Em aberto',  total: emAberto },
                        { nome: 'Atrasados',  total: atrasados },
                        { nome: 'Devolvidos', total: devolvidos }
                    ],
                    livrosPorCategoria,
                    maisEmprestados,
                    emprestimosPorMes
                }
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao gerar relatório.' });
        }
    }
};