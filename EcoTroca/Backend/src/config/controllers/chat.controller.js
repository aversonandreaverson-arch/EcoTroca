const db = require('../config/database');

// Enviar mensagem
exports.enviar = async (req, res) => {
  const { conteudo } = req.body;

  await db.execute(
    'INSERT INTO Mensagem (id_chat, id_usuario, conteudo) VALUES (?, ?, ?)',
    [req.params.id_chat, req.usuario.id, conteudo]
  );

  res.json({ mensagem: 'Mensagem enviada' });
};