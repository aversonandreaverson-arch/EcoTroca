import express from 'express';
import pool from '../config/database.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// ============================================================
// EMPRESA - Criar recolha agendada
// ============================================================

router.post('/recolhas', auth, async (req, res) => {
  try {
    const {
      id_entrega,
      data_proposta,
      hora_inicio,
      referencia_local,
      endereco_completo,
      latitude,
      longitude
    } = req.body;

    const id_empresa = req.usuario.id_usuario;

    if (!id_entrega || !data_proposta || !hora_inicio || !referencia_local) {
      return res.status(400).json({ erro: 'Campos obrigatórios em falta' });
    }

    const [result] = await pool.execute(
      `INSERT INTO recolha_agendada 
      (id_empresa, id_entrega, data_recolha, hora_inicio, referencia_local, endereco_completo, latitude, longitude, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'agendada')`,
      [
        id_empresa,
        id_entrega,
        data_proposta,
        hora_inicio,
        referencia_local,
        endereco_completo || null,
        latitude || null,
        longitude || null
      ]
    );

    res.json({
      sucesso: true,
      id_recolha: result.insertId,
      mensagem: 'Recolha agendada com sucesso!'
    });

  } catch (erro) {
    console.error('Erro ao agendar recolha:', erro);
    res.status(500).json({ erro: 'Erro ao agendar recolha' });
  }
});

// ============================================================
// UTILIZADOR - Confirmar/Recusar recolha
// ============================================================

router.patch('/recolhas/:id_recolha/confirmar', auth, async (req, res) => {
  try {
    const { id_recolha } = req.params;
    const { aceito, motivo } = req.body;
    const id_usuario = req.usuario.id_usuario;

    const [recolha] = await pool.execute(
      `SELECT r.* 
       FROM recolha_agendada r
       JOIN entrega e ON r.id_entrega = e.id_entrega
       WHERE r.id_recolha = ? AND e.id_usuario = ?`,
      [id_recolha, id_usuario]
    );

    if (!recolha.length) {
      return res.status(403).json({ erro: 'Recolha não encontrada' });
    }

    if (aceito) {
      await pool.execute(
        'UPDATE recolha_agendada SET status = ? WHERE id_recolha = ?',
        ['confirmada', id_recolha]
      );
    } else {
      await pool.execute(
        'UPDATE recolha_agendada SET status = ?, motivo_cancelamento = ? WHERE id_recolha = ?',
        ['recusada', motivo, id_recolha]
      );
    }

    res.json({ sucesso: true });

  } catch (erro) {
    console.error('Erro ao confirmar recolha:', erro);
    res.status(500).json({ erro: 'Erro ao processar confirmação' });
  }
});

// ============================================================
// COLETADOR - Listar recolhas
// ============================================================

router.get('/coletador/recolhas/agendadas', auth, async (req, res) => {
  try {
    const id_coletador = req.usuario.id_usuario;

    const [recolhas] = await pool.execute(
      `SELECT 
        r.id_recolha,
        r.data_recolha,
        r.hora_inicio,
        r.status,
        r.referencia_local,
        e.tipo_residuo,
        e.peso_total
      FROM recolha_agendada r
      JOIN entrega e ON r.id_entrega = e.id_entrega
      WHERE r.id_coletador = ? OR r.status = 'confirmada'
      ORDER BY r.data_recolha ASC`,
      [id_coletador]
    );

    res.json(recolhas);

  } catch (erro) {
    console.error('Erro ao listar recolhas:', erro);
    res.status(500).json({ erro: 'Erro ao listar recolhas' });
  }
});

export default router;