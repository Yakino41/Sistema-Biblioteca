const Joi = require('joi');

const schemaUsuario = Joi.object({
    nome: Joi.string().min(2).max(150).required()
        .messages({
            'string.empty': 'Nome é obrigatório.',
            'string.min': 'Nome deve ter ao menos 2 caracteres.',
            'any.required': 'Nome é obrigatório.'
        }),
    email: Joi.string().email({ tlds: { allow: false } }).required()
        .messages({
            'string.empty': 'E-mail é obrigatório.',
            'string.email': 'E-mail inválido.',
            'any.required': 'E-mail é obrigatório.'
        }),
    senha: Joi.string().min(6).optional().allow('', null)
        .messages({
            'string.min': 'Senha deve ter ao menos 6 caracteres.'
        }),
    tipo: Joi.string().valid('administrador', 'bibliotecario', 'leitor').required()
        .messages({
            'any.only': 'Tipo deve ser administrador, bibliotecario ou leitor.',
            'any.required': 'Tipo é obrigatório.'
        }),
    cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).optional().allow('', null)
        .messages({
            'string.pattern.base': 'CPF deve estar no formato 000.000.000-00.'
        }),
    telefone: Joi.string().max(20).optional().allow('', null),
    endereco: Joi.string().max(255).optional().allow('', null),
    status: Joi.string().valid('ativo', 'inativo').optional()
        .messages({
            'any.only': 'Status deve ser ativo ou inativo.'
        })
});

function validarUsuario(req, res, next) {
    const { error } = schemaUsuario.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        const erros = error.details.map(e => e.message);
        return res.status(400).json({ erro: erros[0], erros });
    }
    next();
}

module.exports = validarUsuario;
