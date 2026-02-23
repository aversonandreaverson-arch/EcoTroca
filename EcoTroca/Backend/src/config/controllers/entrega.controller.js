const db = require('../config/database');

// Criar entrega
exports.criar = async (req, res) => {
  const { id_ponto, data_hora } = req.body;

  await db.execute(
    'INSERT INTO Entrega (id_usuario, id_ponto, data_hora) VALUES (?, ?, ?)',
    [req.usuario.id, id_ponto, data_hora]
  );

  res.json({ mensagem: 'Entrega criada com sucesso' });
};

// Aceitar entrega
exports.aceitar = async (req, res) => {
  await db.execute(
    'UPDATE Entrega SET id_coletador=?, status="aceita" WHERE id_entrega=?',
    [req.usuario.id, req.params.id]
  );

  res.json({ mensagem: 'Entrega aceita' });
};

// Confirmar coleta
exports.confirmar = async (req, res) => {
  await db.execute(
    'UPDATE Entrega SET status="coletada" WHERE id_entrega=?',
    [req.params.id]
  );

  res.json({ mensagem: 'Entrega coletada com sucesso' });
};