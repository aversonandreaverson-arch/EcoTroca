import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// Ver mensagens de um chat
router.get('/:id_entrega', auth, async (req, res) => {
  try {
    const [chat] = await pool.query(
      'SELECT * FROM Chat WHERE id_entrega = ? AND ativo = TRUE',
      [req.params.id_entrega]
    );

    if (chat.length === 0) return res.status(404).json({ erro: 'Chat não disponível ainda' });

    const [mensagens] = await pool.query(
      `SELECT m.*, u.nome as nome_usuario
       FROM Mensagem m
       JOIN Usuario u ON m.id_usuario = u.id_usuario
       WHERE m.id_chat = ?
       ORDER BY m.data_envio ASC`,
      [chat[0].id_chat]
    );

    res.json({ id_chat: chat[0].id_chat, mensagens });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Enviar mensagem
router.post('/:id_entrega/mensagem', auth, async (req, res) => {
  try {
    const [chat] = await pool.query(
      'SELECT * FROM Chat WHERE id_entrega = ? AND ativo = TRUE',
      [req.params.id_entrega]
    );

    if (chat.length === 0) return res.status(404).json({ erro: 'Chat não disponível ainda' });

    const { conteudo } = req.body;
    await pool.query(
      'INSERT INTO Mensagem (id_chat, id_usuario, conteudo) VALUES (?, ?, ?)',
      [chat[0].id_chat, req.usuario.id_usuario, conteudo]
    );

    // Cria notificação para o outro utilizador
    const [entrega] = await pool.query(
      'SELECT * FROM Entrega WHERE id_entrega = ?',
      [req.params.id_entrega]
    );

    const id_destino = req.usuario.id_usuario === entrega[0].id_usuario
      ? entrega[0].id_coletador
      : entrega[0].id_usuario;

    if (id_destino) {
      await pool.query(
        'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
        [id_destino, 'Nova mensagem', `Tens uma nova mensagem na entrega #${req.params.id_entrega}`]
      );
    }

    res.status(201).json({ mensagem: 'Mensagem enviada com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;