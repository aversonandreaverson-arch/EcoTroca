// Middleware que valida o tipo de usuário
export default (tiposPermitidos) => {
  return (req, res, next) => {
    if (!tiposPermitidos.includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    next();
  };
};