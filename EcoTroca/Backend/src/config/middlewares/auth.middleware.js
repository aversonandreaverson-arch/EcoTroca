import { verificarToken } from '../utils/jwt';

export default (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ erro: 'Token não fornecido' });

  try {
    const dados = verificarToken(token);
    req.usuario = dados;
    next();
  } catch {
    res.status(403).json({ erro: 'Token inválido ou expirado' });
  }
};