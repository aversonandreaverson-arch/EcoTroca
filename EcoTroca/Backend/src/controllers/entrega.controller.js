import { execute } from '../config/database.js';

// Criar entrega
export async function criar(req, res) {
  const { id_ponto, data_hora } = req.body;

  await execute(
    'INSERT INTO Entrega (id_usuario, id_ponto, data_hora) VALUES (?, ?, ?)',
    [req.usuario.id, id_ponto, data_hora]
  );

  res.json({ mensagem: 'Entrega criada com sucesso' });
}

// Aceitar entrega
export async function aceitar(req, res) {
  await execute(
    'UPDATE Entrega SET id_coletador=?, status="aceita" WHERE id_entrega=?',
    [req.usuario.id, req.params.id]
  );

  res.json({ mensagem: 'Entrega aceita' });
}

// Confirmar coleta
export async function confirmar(req, res) {
  await execute(
    'UPDATE Entrega SET status="coletada" WHERE id_entrega=?',
    [req.params.id]
  );

  res.json({ mensagem: 'Entrega coletada com sucesso' });
}