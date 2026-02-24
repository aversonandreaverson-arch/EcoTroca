import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';

const router = Router();

// Ver todos os utilizadores
router.get('/utilizadores', auth, role('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nome, email, telefone, tipo_usuario, ativo FROM Usuario'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Activar ou desactivar utilizador
router.patch('/utilizadores/:id/status', auth, role('admin'), async (req, res) => {
  try {
    const { ativo } = req.body;
    await pool.query(
      'UPDATE Usuario SET ativo = ? WHERE id_usuario = ?',
      [ativo, req.params.id]
    );
    res.json({ mensagem: 'Estado do utilizador actualizado!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Ver todas as entregas
router.get('/entregas', auth, role('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, u.nome as nome_usuario, p.endereco_completo
       FROM Entrega e
       JOIN Usuario u ON e.id_usuario = u.id_usuario
       JOIN PontoRecolha p ON e.id_ponto = p.id_ponto
       ORDER BY e.data_hora DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Ver auditoria
router.get('/auditoria', auth, role('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.nome as nome_usuario
       FROM Auditoria a
       LEFT JOIN Usuario u ON a.id_usuario = u.id_usuario
       ORDER BY a.data DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Estatísticas gerais
router.get('/estatisticas', auth, role('admin'), async (req, res) => {
  try {
    const [[{ total_usuarios }]] = await pool.query('SELECT COUNT(*) as total_usuarios FROM Usuario');
    const [[{ total_entregas }]] = await pool.query('SELECT COUNT(*) as total_entregas FROM Entrega');
    const [[{ entregas_pendentes }]] = await pool.query('SELECT COUNT(*) as entregas_pendentes FROM Entrega WHERE status = "pendente"');
    const [[{ total_empresas }]] = await pool.query('SELECT COUNT(*) as total_empresas FROM EmpresaRecicladora');

    res.json({ total_usuarios, total_entregas, entregas_pendentes, total_empresas });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;