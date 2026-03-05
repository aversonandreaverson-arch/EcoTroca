import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/notificacoes ─────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Notificacao WHERE id_usuario = ? ORDER BY data DESC',
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/notificacoes/criar ──────────────────────────────
// Aqui crio uma notificação para outro utilizador
// Usado quando uma empresa mostra interesse numa oferta de resíduo
router.post('/criar', auth, async (req, res) => {
  try {
    const { id_usuario_destino, titulo, mensagem } = req.body;

    if (!id_usuario_destino || !titulo || !mensagem) {
      return res.status(400).json({ erro: 'id_usuario_destino, titulo e mensagem são obrigatórios.' });
    }

    await pool.query(
      'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
      [id_usuario_destino, titulo, mensagem]
    );

    res.status(201).json({ mensagem: 'Notificação enviada com sucesso.' });
  } catch (err) {
    console.error('Erro ao criar notificação:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/notificacoes/:id/ler ──────────────────────────
router.patch('/:id/ler', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE Notificacao SET lida = TRUE WHERE id_notificacao = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );
    res.json({ mensagem: 'Notificação marcada como lida.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/notificacoes/todas/lidas ──────────────────────
router.patch('/todas/lidas', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE Notificacao SET lida = TRUE WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    res.json({ mensagem: 'Todas as notificações marcadas como lidas.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;