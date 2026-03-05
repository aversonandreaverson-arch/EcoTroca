// ============================================================
//  entrega.routes.js — Rotas das entregas
//  Guardar em: src/routes/entrega.routes.js
//
//  Aqui giro todo o ciclo de vida de uma entrega:
//  pendente → aceita → coletada → pagamentos calculados
//
//  Cálculo por transacção (definido nas regras de negócio):
//  valor_total      = peso_real × valor_por_kg
//  valor_utilizador = (valor_total × 0.70) − 50 Kz fixos
//  valor_coletador  = valor_total × 0.30 (sem desconto)
//  comissao_empresa = valor_total × 0.10
//  comissao_ecotroca = comissao_empresa + 50 Kz do utilizador
// ============================================================

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/entregas ─────────────────────────────────────────
// Aqui listo todas as entregas do utilizador autenticado
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        e.*,
        GROUP_CONCAT(r.tipo SEPARATOR ', ')      AS tipos_residuos,
        SUM(er.peso_kg)                          AS peso_total_real,
        MAX(r.qualidade)                         AS qualidade,
        MAX(r.descricao)                         AS descricao_qualidade,
        MAX(r.preco_min)                         AS preco_min,
        MAX(r.preco_max)                         AS preco_max
       FROM Entrega e
       LEFT JOIN Entrega_Residuo er ON e.id_entrega = er.id_entrega
       LEFT JOIN Residuo r ON er.id_residuo = r.id_residuo
       WHERE e.id_usuario = ?
       GROUP BY e.id_entrega
       ORDER BY e.data_hora DESC`,
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/entregas ────────────────────────────────────────
// Aqui crio uma nova entrega com os resíduos associados
router.post('/', auth, async (req, res) => {
  try {
    const {
      tipo_entrega, endereco_domicilio, id_ponto,
      tipo_recompensa, residuos, observacoes
    } = req.body;

    // Insiro a entrega principal
    const [result] = await pool.query(
      `INSERT INTO Entrega
        (id_usuario, tipo_entrega, endereco_domicilio, id_ponto, tipo_recompensa, observacoes, data_hora)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        req.usuario.id_usuario,
        tipo_entrega,
        endereco_domicilio,
        id_ponto || null,
        tipo_recompensa,
        observacoes || null,
      ]
    );

    const id_entrega = result.insertId;

    // Aqui insiro cada resíduo na tabela Entrega_Residuo
    if (residuos && residuos.length > 0) {
      for (const r of residuos) {
        await pool.query(
          'INSERT INTO Entrega_Residuo (id_entrega, id_residuo, quantidade, peso_kg) VALUES (?, ?, ?, ?)',
          [id_entrega, r.id_residuo, r.quantidade || 1, r.peso_kg]
        );
      }
    }

    // Aqui crio o chat para esta entrega — será activado após aceitação (Regra 18)
    await pool.query('INSERT INTO Chat (id_entrega) VALUES (?)', [id_entrega]);

    res.status(201).json({ mensagem: 'Entrega criada com sucesso!', id_entrega });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/entregas/:id ─────────────────────────────────────
// Aqui vou buscar uma entrega específica para o modo de edição
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        e.*,
        er.id_residuo,
        r.tipo        AS tipo_residuo,
        r.qualidade,
        r.descricao   AS descricao_qualidade,
        r.preco_min,
        r.preco_max
       FROM Entrega e
       LEFT JOIN Entrega_Residuo er ON e.id_entrega = er.id_entrega
       LEFT JOIN Residuo r ON er.id_residuo = r.id_residuo
       WHERE e.id_entrega = ? AND e.id_usuario = ?
       LIMIT 1`,
      [req.params.id, req.usuario.id_usuario]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Entrega não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PUT /api/entregas/:id ─────────────────────────────────────
// Aqui edito uma entrega — só funciona se ainda estiver pendente
router.put('/:id', auth, async (req, res) => {
  try {
    const { tipo_entrega, endereco_domicilio, tipo_recompensa, observacoes, residuos } = req.body;

    // Verifico se a entrega existe, é do utilizador e está pendente
    const [rows] = await pool.query(
      'SELECT status FROM Entrega WHERE id_entrega = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Entrega não encontrada.' });
    if (rows[0].status !== 'pendente') return res.status(403).json({ erro: 'Só é possível editar entregas pendentes.' });

    // Actualizo os dados principais da entrega
    await pool.query(
      `UPDATE Entrega SET
        tipo_entrega       = ?,
        endereco_domicilio = ?,
        tipo_recompensa    = ?,
        observacoes        = ?
       WHERE id_entrega = ?`,
      [tipo_entrega, endereco_domicilio, tipo_recompensa, observacoes || null, req.params.id]
    );

    // Se o resíduo mudou, actualizo a tabela Entrega_Residuo
    if (residuos && residuos.length > 0) {
      await pool.query('DELETE FROM Entrega_Residuo WHERE id_entrega = ?', [req.params.id]);
      for (const r of residuos) {
        await pool.query(
          'INSERT INTO Entrega_Residuo (id_entrega, id_residuo, quantidade, peso_kg) VALUES (?, ?, ?, ?)',
          [req.params.id, r.id_residuo, r.quantidade || 1, r.peso_kg || 0]
        );
      }
    }

    res.json({ mensagem: 'Entrega actualizada com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/entregas/:id/confirmar ────────────────────────
// Aqui confirmo a coleta e calculo os pagamentos automaticamente
// Este endpoint é chamado pelo coletador após pesar o resíduo real
router.patch('/:id/confirmar', auth, async (req, res) => {
  try {
    const { peso_real } = req.body;

    if (!peso_real || parseFloat(peso_real) <= 0) {
      return res.status(400).json({ erro: 'O peso real é obrigatório para confirmar a coleta.' });
    }

    // Aqui vou buscar o resíduo e o seu valor_por_kg para calcular o valor total
    const [rows] = await pool.query(
      `SELECT er.id_residuo, r.valor_por_kg
       FROM Entrega_Residuo er
       LEFT JOIN Residuo r ON er.id_residuo = r.id_residuo
       WHERE er.id_entrega = ?
       LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ erro: 'Entrega não encontrada.' });
    }

    // Aqui vou buscar as comissões da tabela Configuracao
    const [configs] = await pool.query('SELECT chave, valor FROM Configuracao');
    const cfg = {};
    configs.forEach(c => { cfg[c.chave] = parseFloat(c.valor); });

    const valor_por_kg        = parseFloat(rows[0].valor_por_kg);
    const peso                = parseFloat(peso_real);

    // Aqui calculo todos os valores conforme as regras de negócio
    const valor_total         = valor_por_kg * peso;
    const comissao_empresa    = valor_total * (cfg.comissao_empresa    || 0.10);
    const valor_utilizador    = (valor_total * 0.70) - (cfg.comissao_utilizador_fixo || 50);
    const valor_coletador     = valor_total * 0.30; // sem desconto
    const comissao_ecotroca   = comissao_empresa + (cfg.comissao_utilizador_fixo || 50);

    // Aqui actualizo a entrega com o peso real e os valores calculados
    await pool.query(
      `UPDATE Entrega SET
        status           = 'coletada',
        peso_total       = ?,
        valor_total      = ?,
        valor_utilizador = ?,
        valor_coletador  = ?,
        comissao_ecotroca = ?
       WHERE id_entrega = ?`,
      [
        peso,
        valor_total,
        valor_utilizador,
        valor_coletador,
        comissao_ecotroca,
        req.params.id,
      ]
    );

    res.json({
      mensagem:          'Coleta confirmada com sucesso.',
      valor_total:       valor_total.toFixed(2),
      valor_utilizador:  valor_utilizador.toFixed(2),
      valor_coletador:   valor_coletador.toFixed(2),
      comissao_ecotroca: comissao_ecotroca.toFixed(2),
      empresa_paga:      (valor_total + comissao_empresa).toFixed(2),
    });
  } catch (err) {
    console.error('Erro ao confirmar coleta:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/entregas/:id/cancelar ─────────────────────────
// Aqui cancelo uma entrega — só funciona se estiver pendente
router.patch('/:id/cancelar', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE Entrega SET status = 'cancelada'
       WHERE id_entrega = ? AND id_usuario = ? AND status = 'pendente'`,
      [req.params.id, req.usuario.id_usuario]
    );
    res.json({ mensagem: 'Entrega cancelada.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;