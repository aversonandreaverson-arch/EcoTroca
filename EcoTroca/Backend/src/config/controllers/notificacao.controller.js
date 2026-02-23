import { execute } from '../config/database';

// Listar notificações
export async function listar(req, res) {
  const [notificacoes] = await execute(
    'SELECT * FROM Notificacao WHERE id_usuario=?',
    [req.usuario.id]
  );

  res.json(notificacoes);
}