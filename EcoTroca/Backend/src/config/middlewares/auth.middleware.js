// Middleware de autenticação
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  // Se não houver token, bloqueia acesso
  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  try {
    // Decodifica o token
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next(); // continua
  } catch {
    return res.status(401).json({ erro: 'Token inválido' });
  }
};