const db = require('../config/database');

// Listar notificações
exports.listar = async (req, res) => {
  const [notificacoes] = await db.execute(
    'SELECT * FROM Notificacao WHERE id_usuario=?',
    [req.usuario.id]
  );

  res.json(notificacoes);
};