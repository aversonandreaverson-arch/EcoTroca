export default (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.tipo_usuario)) {
      return res.status(403).json({ erro: 'Acesso não autorizado' });
    }
    next();
  };
};