const Joi = require('joi');

const schemaEmprestimo = Joi.object({
    usuario_id: Joi.number().integer().min(1).required()
        .messages({
            'number.base':    'ID do leitor inválido.',
            'any.required':   'Leitor é obrigatório.'
        }),
    livros_ids: Joi.array().items(Joi.number().integer().min(1)).min(1).required()
        .messages({
            'array.base':   'livros_ids deve ser um array.',
            'array.min':    'Selecione ao menos um livro.',
            'any.required': 'Selecione ao menos um livro.'
        }),
    data_prevista_devolucao: Joi.string().isoDate().required()
        .messages({
            'string.empty':    'Data prevista de devolução é obrigatória.',
            'string.isoDate':  'Data deve estar no formato YYYY-MM-DD.',
            'any.required':    'Data prevista de devolução é obrigatória.'
        }),
    observacao: Joi.string().max(500).optional().allow('')
});

function validarEmprestimo(req, res, next) {
    const { error } = schemaEmprestimo.validate(req.body, { abortEarly: false });
    if (error) {
        const erros = error.details.map(e => e.message);
        return res.status(400).json({ erro: erros[0], erros });
    }
    next();
}

module.exports = validarEmprestimo;
