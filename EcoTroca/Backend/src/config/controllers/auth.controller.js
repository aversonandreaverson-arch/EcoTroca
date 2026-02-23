const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');

// Login
exports.login = async (req, res) => {
  const { email, senha } = req.body;

  const [[usuario]] = await db.execute(
    'SELECT * FROM Usuario WHERE email = ?',
    [email]
  );

  if (!usuario) {
    return res.status(401).json({ erro: 'Usuário não encontrado' });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    return res.status(401).json({ erro: 'Senha incorreta' });
  }

  res.json({
    token: generateToken(usuario),
    tipo_usuario: usuario.tipo_usuario
  });
};