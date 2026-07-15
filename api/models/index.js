const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Livro = require('./Livro');
const Emprestimo = require('./Emprestimo');
const EmprestimoLivro = require('./EmprestimoLivro');

// Usuario -> Emprestimos
Usuario.hasMany(Emprestimo, { foreignKey: 'usuario_id', as: 'emprestimos' });
Emprestimo.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Emprestimo <-> Livro (N:N via EmprestimoLivro)
Emprestimo.belongsToMany(Livro, {
    through: EmprestimoLivro,
    foreignKey: 'emprestimo_id',
    otherKey: 'livro_id',
    as: 'livros'
});
Livro.belongsToMany(Emprestimo, {
    through: EmprestimoLivro,
    foreignKey: 'livro_id',
    otherKey: 'emprestimo_id',
    as: 'emprestimos'
});

// Associações diretas da tabela de junção (usadas em queries com include)
EmprestimoLivro.belongsTo(Emprestimo, { foreignKey: 'emprestimo_id', as: 'emprestimo' });
EmprestimoLivro.belongsTo(Livro,      { foreignKey: 'livro_id',      as: 'livro' });

module.exports = {
    sequelize,
    Usuario,
    Livro,
    Emprestimo,
    EmprestimoLivro
};
