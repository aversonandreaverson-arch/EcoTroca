
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/notificacoes ─────────────────────────────────────
// Lista todas as notificações do utilizador autenticado ordenadas por data
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
// Cria notificação para outro utilizador
// Se tipo = 'proposta' → guarda id_publicacao e id_usuario_remetente
// e muda status da publicação para 'em_negociacao'
router.post('/criar', auth, async (req, res) => {
  try {
    const {
      id_usuario_destino,
      titulo,
      mensagem,
      id_publicacao,
      tipo = 'geral', // 'geral' | 'proposta' | 'sistema'
    } = req.body;

    if (!id_usuario_destino || !titulo || !mensagem) {
      return res.status(400).json({ erro: 'id_usuario_destino, titulo e mensagem são obrigatórios.' });
    }

    // Guardo a notificação com todos os campos necessários para aceitar/recusar
    await pool.query(
      `INSERT INTO Notificacao
        (id_usuario, titulo, mensagem, tipo, id_publicacao, id_usuario_remetente)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id_usuario_destino,
        titulo,
        mensagem,
        tipo,
        id_publicacao       || null,
        req.usuario.id_usuario, // quem enviou a proposta
      ]
    );

    // Se for uma proposta de compra, mudo o status da publicação para 'em_negociacao'
    // Isto protege a publicação — o dono não pode apagar sem receber advertência
    if (tipo === 'proposta' && id_publicacao) {
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

// ── POST /api/notificacoes/:id/aceitar ────────────────────────
// Utilizador aceita a proposta de uma empresa
// → publicação fica 'fechada' + notificação de confirmação vai para a empresa
router.post('/:id/aceitar', auth, async (req, res) => {
  try {
    // Vou buscar a notificação para saber qual publicação e qual empresa
    const [rows] = await pool.query(
      'SELECT * FROM Notificacao WHERE id_notificacao = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );

    if (!rows.length) {
      return res.status(404).json({ erro: 'Notificação não encontrada.' });
    }

    const notif = rows[0];

    if (notif.tipo !== 'proposta') {
      return res.status(400).json({ erro: 'Esta notificação não é uma proposta.' });
    }

    if (!notif.id_publicacao) {
      return res.status(400).json({ erro: 'Publicação não identificada nesta proposta.' });
    }

    // Mudo o status da publicação para 'fechada' — negociação concluída
    await pool.query(
      `UPDATE Publicacao SET status = 'fechada' WHERE id_publicacao = ?`,
      [notif.id_publicacao]
    );

    // Vou buscar o nome do utilizador para a mensagem de confirmação
    const [uRows] = await pool.query(
      'SELECT nome FROM Usuario WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    const nomeUtilizador = uRows[0]?.nome || 'O utilizador';

    // Vou buscar o título da publicação para a mensagem
    const [pRows] = await pool.query(
      'SELECT titulo FROM Publicacao WHERE id_publicacao = ?',
      [notif.id_publicacao]
    );
    const tituloPublicacao = pRows[0]?.titulo || 'resíduo';

    // Envio notificação de confirmação à empresa que fez a proposta
    await pool.query(
      `INSERT INTO Notificacao (id_usuario, titulo, mensagem, tipo)
       VALUES (?, '✅ Proposta aceite!', ?, 'sistema')`,
      [
        notif.id_usuario_remetente,
        `${nomeUtilizador} aceitou a tua proposta para "${tituloPublicacao}". Podem agora combinar os detalhes da recolha.`,
      ]
    );

    // Marco a notificação de proposta como lida
    await pool.query(
      'UPDATE Notificacao SET lida = TRUE WHERE id_notificacao = ?',
      [req.params.id]
    );

    res.json({ mensagem: 'Proposta aceite com sucesso.' });
  } catch (err) {
    console.error('Erro ao aceitar proposta:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/notificacoes/:id/recusar ────────────────────────
// Utilizador recusa a proposta de uma empresa
// → publicação volta para 'disponivel' + notificação de recusa vai para a empresa
router.post('/:id/recusar', auth, async (req, res) => {
  try {
    // Vou buscar a notificação para saber qual publicação e qual empresa
    const [rows] = await pool.query(
      'SELECT * FROM Notificacao WHERE id_notificacao = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );

    if (!rows.length) {
      return res.status(404).json({ erro: 'Notificação não encontrada.' });
    }

    const notif = rows[0];

    if (notif.tipo !== 'proposta') {
      return res.status(400).json({ erro: 'Esta notificação não é uma proposta.' });
    }

    if (!notif.id_publicacao) {
      return res.status(400).json({ erro: 'Publicação não identificada nesta proposta.' });
    }

    // Mudo o status da publicação de volta para 'disponivel'
    // Assim outras empresas podem fazer novas propostas
    await pool.query(
      `UPDATE Publicacao SET status = 'disponivel' WHERE id_publicacao = ?`,
      [notif.id_publicacao]
    );

    // Vou buscar o nome do utilizador para a mensagem de recusa
    const [uRows] = await pool.query(
      'SELECT nome FROM Usuario WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    const nomeUtilizador = uRows[0]?.nome || 'O utilizador';

    // Vou buscar o título da publicação para a mensagem
    const [pRows] = await pool.query(
      'SELECT titulo FROM Publicacao WHERE id_publicacao = ?',
      [notif.id_publicacao]
    );
    const tituloPublicacao = pRows[0]?.titulo || 'resíduo';

    // Envio notificação de recusa à empresa que fez a proposta
    await pool.query(
      `INSERT INTO Notificacao (id_usuario, titulo, mensagem, tipo)
       VALUES (?, '❌ Proposta recusada', ?, 'sistema')`,
      [
        notif.id_usuario_remetente,
        `${nomeUtilizador} recusou a tua proposta para "${tituloPublicacao}". O resíduo voltou a estar disponível.`,
      ]
    );

    // Marco a notificação de proposta como lida
    await pool.query(
      'UPDATE Notificacao SET lida = TRUE WHERE id_notificacao = ?',
      [req.params.id]
    );

    res.json({ mensagem: 'Proposta recusada.' });
  } catch (err) {
    console.error('Erro ao recusar proposta:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/notificacoes/:id/ler ──────────────────────────
// Marca uma notificação específica como lida
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
// Marca todas as notificações do utilizador como lidas de uma vez
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