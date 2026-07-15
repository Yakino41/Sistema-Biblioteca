/*
  Middleware para verificar se o usuário possui o(s) perfil(s) necessário(s).
  Uso: autorizar('administrador') ou autorizar('administrador', 'bibliotecario')
 */
function autorizar(...perfisPermitidos) {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ erro: 'Não autenticado.' });
        }

        const { tipo } = req.usuario;

        if (!perfisPermitidos.includes(tipo)) {
            return res.status(403).json({
                erro: `Acesso negado. Requer perfil: ${perfisPermitidos.join(' ou ')}.`
            });
        }

        next();
    };
}

module.exports = autorizar;
