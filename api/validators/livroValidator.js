const Joi = require('joi');

const schemaLivro = Joi.object({
    titulo: Joi.string().min(2).max(255).required()
        .messages({
            'string.empty': 'Título é obrigatório.',
            'string.min':   'Título deve ter ao menos 2 caracteres.',
            'any.required': 'Título é obrigatório.'
        }),
    autor: Joi.string().min(2).max(150).required()
        .messages({
            'string.empty': 'Autor é obrigatório.',
            'any.required': 'Autor é obrigatório.'
        }),
    editora: Joi.string().min(2).max(150).required()
        .messages({
            'string.empty': 'Editora é obrigatória.',
            'any.required': 'Editora é obrigatória.'
        }),
    ano_publicacao: Joi.number().integer()
        .min(1000).max(new Date().getFullYear()).required()
        .messages({
            'number.base':    'Ano de publicação deve ser um número.',
            'number.min':     'Ano de publicação inválido.',
            'number.max':     `Ano de publicação não pode ser maior que ${new Date().getFullYear()}.`,
            'any.required':   'Ano de publicação é obrigatório.'
        }),
    categoria: Joi.string().min(2).max(100).required()
        .messages({
            'string.empty': 'Categoria é obrigatória.',
            'any.required': 'Categoria é obrigatória.'
        }),
    isbn: Joi.string().min(10).max(20).required()
        .messages({
            'string.empty': 'ISBN é obrigatório.',
            'any.required': 'ISBN é obrigatório.'
        }),
    quantidade_total: Joi.number().integer().min(1).required()
        .messages({
            'number.base':    'Quantidade total deve ser um número.',
            'number.min':     'Quantidade total deve ser ao menos 1.',
            'any.required':   'Quantidade total é obrigatória.'
        }),
    descricao: Joi.string().max(1000).allow('', null).optional()
        .messages({
            'string.max': 'Descrição não pode ter mais que 1000 caracteres.'
        })
});

function validarLivro(req, res, next) {
    const { error } = schemaLivro.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        const erros = error.details.map(e => e.message);
        return res.status(400).json({ erro: erros[0], erros });
    }
    next();
}

module.exports = validarLivro;