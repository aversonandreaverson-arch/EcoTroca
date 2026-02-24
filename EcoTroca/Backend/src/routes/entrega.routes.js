import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// Criar entrega
router.post('/', auth, async (req, res) => {
  try {
    const { id_ponto, data_hora, residuos } = req.body;
    const id_usuario = req.usuario.id_usuario;

    // Cria a entrega
    const [result] = await pool.query(
      'INSERT INTO Entrega (id_usuario, id_ponto, data_hora, status) VALUES (?, ?, ?, ?)',
      [id_usuario, id_ponto, data_hora, 'pendente']
    );

    const id_entrega = result.insertId;

    // Adiciona os resíduos da entrega
    for (const residuo of residuos) {
      await pool.query(
        'INSERT INTO Entrega_Residuo (id_entrega, id_residuo, quantidade, peso_kg) VALUES (?, ?, ?, ?)',
        [id_entrega, residuo.id_residuo, residuo.quantidade, residuo.peso_kg]
      );
    }

    // Cria o chat da entrega
    await pool.query('INSERT INTO Chat (id_entrega) VALUES (?)', [id_entrega]);

    res.status(201).json({ mensagem: 'Entrega criada com sucesso!', id_entrega });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Listar entregas do utilizador logado
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, p.endereco_completo, p.tipo as tipo_ponto
       FROM Entrega e
       JOIN PontoRecolha p ON e.id_ponto = p.id_ponto
       WHERE e.id_usuario = ?
       ORDER BY e.data_hora DESC`,
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Ver detalhes de uma entrega
router.get('/:id', auth, async (req, res) => {
  try {
    const [entrega] = await pool.query(
      `SELECT e.*, p.endereco_completo, p.tipo as tipo_ponto
       FROM Entrega e
       JOIN PontoRecolha p ON e.id_ponto = p.id_ponto
       WHERE e.id_entrega = ?`,
      [req.params.id]
    );

    if (entrega.length === 0) return res.status(404).json({ erro: 'Entrega não encontrada' });

    const [residuos] = await pool.query(
      `SELECT r.tipo, r.valor_por_kg, er.quantidade, er.peso_kg
       FROM Entrega_Residuo er
       JOIN Residuo r ON er.id_residuo = r.id_residuo
       WHERE er.id_entrega = ?`,
      [req.params.id]
    );

    res.json({ ...entrega[0], residuos });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Cancelar entrega
router.patch('/:id/cancelar', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE Entrega SET status = ? WHERE id_entrega = ? AND id_usuario = ?',
      ['cancelada', req.params.id, req.usuario.id_usuario]
    );
    res.json({ mensagem: 'Entrega cancelada com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;