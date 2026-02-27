import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// Listar entregas do utilizador autenticado
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, GROUP_CONCAT(r.tipo SEPARATOR ', ') as tipos_residuos,
              SUM(er.peso_kg) as peso_total
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

// Criar nova entrega
router.post('/', auth, async (req, res) => {
  try {
    const { tipo_entrega, endereco_domicilio, id_ponto, tipo_recompensa, residuos, observacoes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO Entrega (id_usuario, tipo_entrega, endereco_domicilio, id_ponto, tipo_recompensa, observacoes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.usuario.id_usuario, tipo_entrega, endereco_domicilio, id_ponto, tipo_recompensa, observacoes]
    );

    const id_entrega = result.insertId;

    // Inserir resíduos da entrega
    if (residuos && residuos.length > 0) {
      for (const r of residuos) {
        await pool.query(
          'INSERT INTO Entrega_Residuo (id_entrega, id_residuo, quantidade, peso_kg) VALUES (?, ?, ?, ?)',
          [id_entrega, r.id_residuo, r.quantidade || 1, r.peso_kg]
        );
      }
    }

    // Criar chat para esta entrega
    await pool.query('INSERT INTO Chat (id_entrega) VALUES (?)', [id_entrega]);

    res.status(201).json({ mensagem: 'Entrega criada com sucesso!', id_entrega });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Cancelar entrega
router.patch('/:id/cancelar', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE Entrega SET status = 'cancelada' WHERE id_entrega = ? AND id_usuario = ? AND status = 'pendente'`,
      [req.params.id, req.usuario.id_usuario]
    );
    res.json({ mensagem: 'Entrega cancelada.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;