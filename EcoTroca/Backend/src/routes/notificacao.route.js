import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// GET /api/notificacoes
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

// POST /api/notificacoes/criar
router.post('/criar', auth, async (req, res) => {
  try {
    const { id_usuario_destino, titulo, mensagem, id_publicacao, tipo = 'geral' } = req.body;

    if (!id_usuario_destino || !titulo || !mensagem)
      return res.status(400).json({ erro: 'id_usuario_destino, titulo e mensagem sao obrigatorios.' });

    await pool.query(
      `INSERT INTO Notificacao
        (id_usuario, titulo, mensagem, tipo, id_publicacao, id_usuario_remetente)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario_destino, titulo, mensagem, tipo, id_publicacao || null, req.usuario.id_usuario]
    );

    // Se for proposta, muda publicacao para em_negociacao
    if (tipo === 'proposta' && id_publicacao) {
      await pool.query(
        `UPDATE Publicacao SET status = 'em_negociacao'
         WHERE id_publicacao = ? AND status = 'disponivel'`,
        [id_publicacao]
      );
    }

    res.status(201).json({ mensagem: 'Notificacao enviada com sucesso.' });
  } catch (err) {
    console.error('Erro ao criar notificacao:', err);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/notificacoes/:id/aceitar
// Utilizador aceita proposta da empresa
// -> cria entrega ligada a empresa + notifica empresa + muda publicacao para fechada
router.post('/:id/aceitar', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Notificacao WHERE id_notificacao = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );

    if (!rows.length)
      return res.status(404).json({ erro: 'Notificacao nao encontrada.' });

    const notif = rows[0];

    if (notif.tipo !== 'proposta')
      return res.status(400).json({ erro: 'Esta notificacao nao e uma proposta.' });

    if (!notif.id_publicacao)
      return res.status(400).json({ erro: 'Publicacao nao identificada nesta proposta.' });

    // Busca dados da publicacao para saber o residuo e tipo
    const [pubRows] = await pool.query(
      `SELECT p.*, er.id_empresa
       FROM publicacao p
       LEFT JOIN empresarecicladora er ON er.id_usuario = p.id_usuario
       WHERE p.id_publicacao = ?`,
      [notif.id_publicacao]
    );

    if (!pubRows.length)
      return res.status(404).json({ erro: 'Publicacao nao encontrada.' });

    const pub = pubRows[0];

    // Busca o id_empresa do remetente (empresa que fez a proposta)
    const [empRows] = await pool.query(
      'SELECT id_empresa FROM empresarecicladora WHERE id_usuario = ?',
      [notif.id_usuario_remetente]
    );
    const id_empresa = empRows[0]?.id_empresa || null;

    // Busca o residuo da publicacao para associar a entrega
    const [residuoRows] = await pool.query(
      'SELECT id_residuo FROM publicacao WHERE id_publicacao = ?',
      [notif.id_publicacao]
    );
    const id_residuo = residuoRows[0]?.id_residuo || null;

    // Busca entrega ja existente ligada a esta publicacao deste utilizador
    // (pode ja existir se o utilizador criou a oferta via NovoResiduo)
    const [entregaExistente] = await pool.query(
      `SELECT id_entrega FROM entrega
       WHERE id_usuario = ? AND id_entrega = (
         SELECT id_entrega FROM publicacao WHERE id_publicacao = ? LIMIT 1
       )`,
      [req.usuario.id_usuario, notif.id_publicacao]
    );

    let id_entrega;

    if (entregaExistente.length > 0) {
      // Entrega ja existe — actualiza com a empresa que aceitou
      id_entrega = entregaExistente[0].id_entrega;
      await pool.query(
        `UPDATE entrega SET id_empresa = ?, id_publicacao = ? WHERE id_entrega = ?`,
        [id_empresa, notif.id_publicacao, id_entrega]
      );
    } else {
      // Cria nova entrega ligada a empresa e a publicacao
      const [result] = await pool.query(
        `INSERT INTO entrega
          (id_usuario, tipo_entrega, tipo_recompensa, data_hora, id_empresa, id_publicacao)
         VALUES (?, 'ponto_recolha', 'dinheiro', NOW(), ?, ?)`,
        [req.usuario.id_usuario, id_empresa, notif.id_publicacao]
      );
      id_entrega = result.insertId;

      // Associa o residuo se existir
      if (id_residuo) {
        await pool.query(
          'INSERT INTO entrega_residuo (id_entrega, id_residuo, quantidade, peso_kg) VALUES (?, ?, 1, 0)',
          [id_entrega, id_residuo]
        );
      }

      // Cria chat para a entrega
      await pool.query('INSERT INTO chat (id_entrega) VALUES (?)', [id_entrega]);
    }

    // Muda publicacao para fechada
    await pool.query(
      `UPDATE Publicacao SET status = 'fechada' WHERE id_publicacao = ?`,
      [notif.id_publicacao]
    );

    // Busca nome do utilizador para a mensagem
    const [uRows] = await pool.query(
      'SELECT nome FROM usuario WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    const nomeUtilizador = uRows[0]?.nome || 'O utilizador';
    const tituloPublicacao = pub.titulo || 'residuo';

    // Notifica a empresa que o utilizador aceitou
    await pool.query(
      `INSERT INTO Notificacao (id_usuario, titulo, mensagem, tipo)
       VALUES (?, 'Proposta aceite', ?, 'geral')`,
      [
        notif.id_usuario_remetente,
        `${nomeUtilizador} aceitou a tua proposta de troca para "${tituloPublicacao}". A entrega #${id_entrega} foi criada e pode ser gerida em Gestao de Entregas.`,
      ]
    );

    // Marca notificacao como lida
    await pool.query(
      'UPDATE Notificacao SET lida = TRUE WHERE id_notificacao = ?',
      [req.params.id]
    );

    res.json({
      mensagem: 'Proposta aceite com sucesso.',
      id_entrega,
      feedback: 'Aceitaste a troca com sucesso! A empresa sera notificada e ira definir a data de recolha.',
    });
  } catch (err) {
    console.error('Erro ao aceitar proposta:', err);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/notificacoes/:id/recusar
// Utilizador recusa proposta da empresa
// -> publicacao volta a disponivel + notifica empresa
router.post('/:id/recusar', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Notificacao WHERE id_notificacao = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );

    if (!rows.length)
      return res.status(404).json({ erro: 'Notificacao nao encontrada.' });

    const notif = rows[0];

    if (notif.tipo !== 'proposta')
      return res.status(400).json({ erro: 'Esta notificacao nao e uma proposta.' });

    if (!notif.id_publicacao)
      return res.status(400).json({ erro: 'Publicacao nao identificada nesta proposta.' });

    // Volta publicacao para disponivel
    await pool.query(
      `UPDATE Publicacao SET status = 'disponivel' WHERE id_publicacao = ?`,
      [notif.id_publicacao]
    );

    // Busca dados para a mensagem
    const [uRows] = await pool.query(
      'SELECT nome FROM usuario WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    const [pRows] = await pool.query(
      'SELECT titulo FROM Publicacao WHERE id_publicacao = ?',
      [notif.id_publicacao]
    );
    const nomeUtilizador   = uRows[0]?.nome   || 'O utilizador';
    const tituloPublicacao = pRows[0]?.titulo || 'residuo';

    // Notifica a empresa da recusa
    await pool.query(
      `INSERT INTO Notificacao (id_usuario, titulo, mensagem, tipo)
       VALUES (?, 'Proposta recusada', ?, 'geral')`,
      [
        notif.id_usuario_remetente,
        `${nomeUtilizador} recusou a tua proposta para "${tituloPublicacao}". O residuo voltou a estar disponivel para outras empresas.`,
      ]
    );

    // Marca notificacao como lida
    await pool.query(
      'UPDATE Notificacao SET lida = TRUE WHERE id_notificacao = ?',
      [req.params.id]
    );

    res.json({
      mensagem: 'Proposta recusada.',
      feedback: 'Recusaste a proposta de troca. O teu residuo continua disponivel no feed.',
    });
  } catch (err) {
    console.error('Erro ao recusar proposta:', err);
    res.status(500).json({ erro: err.message });
  }
});

// PATCH /api/notificacoes/:id/ler
router.patch('/:id/ler', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE Notificacao SET lida = TRUE WHERE id_notificacao = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );
    res.json({ mensagem: 'Notificacao marcada como lida.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PATCH /api/notificacoes/todas/lidas
router.patch('/todas/lidas', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE Notificacao SET lida = TRUE WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    res.json({ mensagem: 'Todas as notificacoes marcadas como lidas.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;