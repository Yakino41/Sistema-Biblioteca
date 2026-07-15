const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Emprestimo = sequelize.define('Emprestimo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' }
    },
    data_emprestimo: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    data_prevista_devolucao: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    data_real_devolucao: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('em_aberto', 'devolvido', 'atrasado'),
        allowNull: false,
        defaultValue: 'em_aberto'
    },
    observacao: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'emprestimos'
});

module.exports = Emprestimo;
