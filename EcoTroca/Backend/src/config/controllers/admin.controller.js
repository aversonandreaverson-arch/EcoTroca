const db = require('../config/database');

// Banir usuário
exports.banir = async (req, res) => {
  await db.execute(
    'UPDATE Usuario SET ativo=FALSE WHERE id_usuario=?',
    [req.params.id]
  );

  res.json({ mensagem: 'Usuário desativado' });
};