import { verificarToken } from '../utils/jwt.js';
import pool from '../config/database.js';

export default async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ erro: 'Token não fornecido' });

  try {
    const dados = verificarToken(token);
    req.usuario = dados;

    // Verifica se a conta ainda está activa na BD
    // Isto garante que suspensões e bloqueios têm efeito imediato
    const [[usuario]] = await pool.query(
      'SELECT ativo, suspenso_ate, bloqueado_permanente FROM usuario WHERE id_usuario = ?',
      [dados.id_usuario]
    );

    if (!usuario) {
      return res.status(401).json({ erro: 'Conta não encontrada.' });
    }

    if (!usuario.ativo || usuario.bloqueado_permanente) {
      return res.status(403).json({ erro: 'A tua conta foi bloqueada. Contacta o suporte.' });
    }

    if (usuario.suspenso_ate && new Date(usuario.suspenso_ate) > new Date()) {
      const dataFim = new Date(usuario.suspenso_ate).toLocaleDateString('pt-AO', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
      return res.status(403).json({ erro: `A tua conta está suspensa até ${dataFim}.` });
    }

    next();
  } catch {
    res.status(403).json({ erro: 'Token inválido ou expirado' });
  }
};