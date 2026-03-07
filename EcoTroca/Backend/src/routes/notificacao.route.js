
//  Quando empresa envia proposta:
//    1. Guarda notificação na base de dados
//    2. Muda status da publicação para 'em_negociacao'
//       → protege a publicação de ser apagada sem penalização
// ============================================================

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/notificacoes ─────────────────────────────────────
// Lista todas as notificações do utilizador autenticado
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
// Cria notificação na plataforma para outro utilizador
// Quando empresa envia proposta → muda status da publicação para 'em_negociacao'
router.post('/criar', auth, async (req, res) => {
  try {
    const { id_usuario_destino, titulo, mensagem, id_publicacao } = req.body;

    if (!id_usuario_destino || !titulo || !mensagem) {
      return res.status(400).json({ erro: 'id_usuario_destino, titulo e mensagem são obrigatórios.' });
    }

    // Guardo a notificação na base de dados — aparece no sino
    await pool.query(
      'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
      [id_usuario_destino, titulo, mensagem]
    );

    // Se veio com id_publicacao, mudo o status para 'em_negociacao'
    // Isto protege a publicação — o dono não pode apagar sem penalização
    if (id_publicacao) {
      await pool.query(
        `UPDATE Publicacao SET status = 'em_negociacao'
         WHERE id_publicacao = ? AND status = 'disponivel'`,
        [id_publicacao]
      );
    }

    res.status(201).json({ mensagem: 'Notificação enviada com sucesso.' });
  } catch (err) {
    console.error('Erro ao criar notificação:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/notificacoes/:id/ler ──────────────────────────
// Marca uma notificação como lida
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
// Marca todas as notificações do utilizador como lidas
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