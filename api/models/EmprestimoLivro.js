const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabela de junção: associa múltiplos livros a um único empréstimo
const EmprestimoLivro = sequelize.define('EmprestimoLivro', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    emprestimo_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'emprestimos', key: 'id' }
    },
    livro_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'livros', key: 'id' }
    }
}, {
    tableName: 'emprestimo_livros',
    timestamps: false
});

module.exports = EmprestimoLivro;
