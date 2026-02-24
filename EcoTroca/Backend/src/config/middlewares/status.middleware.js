// Middleware que bloqueia usuários desativados
import { execute } from '../config/database.js';

export default async (req, res, next) => {
  const [[usuario]] = await execute(
    'SELECT ativo FROM Usuario WHERE id_usuario = ?',
    [req.usuario.id]
  );

  if (!usuario || !usuario.ativo) {
    return res.status(403).json({ erro: 'Conta desativada' });
  }

  next();
};