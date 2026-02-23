import { execute } from '../config/database';

// Banir usuário
export async function banir(req, res) {
  await execute(
    'UPDATE Usuario SET ativo=FALSE WHERE id_usuario=?',
    [req.params.id]
  );

  res.json({ mensagem: 'Usuário desativado' });
}