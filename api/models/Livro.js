const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Livro = sequelize.define('Livro', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    titulo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    autor: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    editora: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    ano_publicacao: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1000,
            max: new Date().getFullYear()
        }
    },
    categoria: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    isbn: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    quantidade_total: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 0
        }
    },
    quantidade_disponivel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 0
        }
    },
    status: {
        type: DataTypes.ENUM('disponivel', 'indisponivel'),
        allowNull: false,
        defaultValue: 'disponivel'
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'livros',
    hooks: {
        beforeSave: (livro) => {
            if (livro.quantidade_disponivel === 0) {
                livro.status = 'indisponivel';
            } else {
                livro.status = 'disponivel';
            }
        }
    }
});

module.exports = Livro;
