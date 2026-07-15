const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    senha: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    tipo: {
        type: DataTypes.ENUM('administrador', 'bibliotecario', 'leitor'),
        allowNull: false,
        defaultValue: 'leitor'
    },
    cpf: {
        type: DataTypes.STRING(14),
        allowNull: true,
        unique: true
    },
    telefone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    endereco: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('ativo', 'inativo'),
        defaultValue: 'ativo',
        allowNull: false
    }
}, {
    tableName: 'usuarios',
    hooks: {
        beforeCreate: async (usuario) => {
            if (usuario.senha) {
                usuario.senha = await bcrypt.hash(usuario.senha, 10);
            }
        },
        beforeUpdate: async (usuario) => {
            if (usuario.changed('senha')) {
                usuario.senha = await bcrypt.hash(usuario.senha, 10);
            }
        }
    }
});

Usuario.prototype.verificarSenha = async function (senha) {
    return bcrypt.compare(senha, this.senha);
};

module.exports = Usuario;
