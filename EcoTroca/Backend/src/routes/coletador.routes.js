import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';
import { atribuirPontos } from '../services/entrega.service.js';

const router = Router();

// Listar entregas pendentes
router.get('/entregas/pendentes', auth, role('coletor'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, p.endereco_completo, p.tipo as tipo_ponto, u.nome as nome_usuario
       FROM Entrega e
       JOIN PontoRecolha p ON e.id_ponto = p.id_ponto
       JOIN Usuario u ON e.id_usuario = u.id_usuario
       WHERE e.status = 'pendente'
       ORDER BY e.data_hora ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Aceitar entrega
router.patch('/entregas/:id/aceitar', auth, role('coletor'), async (req, res) => {
  try {
    const [coletador] = await pool.query(
      'SELECT id_coletador FROM Coletador WHERE id_usuario = ? AND ativo = TRUE',
      [req.usuario.id_usuario]
    );

    if (coletador.length === 0) return res.status(404).json({ erro: 'Coletador não encontrado' });

    await pool.query(
      'UPDATE Entrega SET status = ?, id_coletador = ? WHERE id_entrega = ? AND status = ?',
      ['aceita', coletador[0].id_coletador, req.params.id, 'pendente']
    );

    await pool.query(
      'UPDATE Chat SET ativo = TRUE WHERE id_entrega = ?',
      [req.params.id]
    );

    res.json({ mensagem: 'Entrega aceite com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Marcar entrega como recolhida
router.patch('/entregas/:id/recolher', auth, role('coletor'), async (req, res) => {
  try {
    const [coletador] = await pool.query(
      'SELECT id_coletador FROM Coletador WHERE id_usuario = ? AND ativo = TRUE',
      [req.usuario.id_usuario]
    );

    if (coletador.length === 0) return res.status(404).json({ erro: 'Coletador não encontrado' });

    await pool.query(
      'UPDATE Entrega SET status = ? WHERE id_entrega = ? AND id_coletador = ?',
      ['coletada', req.params.id, coletador[0].id_coletador]
    );

    await pool.query(
      'INSERT INTO RecompensaColetador (id_coletador, pontos_recebidos, descricao) VALUES (?, ?, ?)',
      [coletador[0].id_coletador, 10, `Entrega ${req.params.id} recolhida`]
    );

    // Busca o utilizador da entrega e atribui pontos
    const [entrega] = await pool.query(
      'SELECT id_usuario FROM Entrega WHERE id_entrega = ?',
      [req.params.id]
    );

    const pontos = await atribuirPontos(entrega[0].id_usuario, req.params.id);

    res.json({ mensagem: 'Entrega recolhida com sucesso!', pontos_atribuidos: pontos });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;