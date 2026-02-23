import { execute } from '../config/database';

// Enviar mensagem
export async function enviar(req, res) {
  const { conteudo } = req.body;

  await execute(
    'INSERT INTO Mensagem (id_chat, id_usuario, conteudo) VALUES (?, ?, ?)',
    [req.params.id_chat, req.usuario.id, conteudo]
  );

  res.json({ mensagem: 'Mensagem enviada' });
}