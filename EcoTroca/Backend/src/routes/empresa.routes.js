import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';

const router = Router();

// Listar empresas
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM EmpresaRecicladora WHERE ativo = TRUE');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Criar empresa (só admin)
router.post('/', auth, role('admin'), async (req, res) => {
  try {
    const { nome, telefone, email, endereco } = req.body;
    const [result] = await pool.query(
      'INSERT INTO EmpresaRecicladora (nome, telefone, email, endereco) VALUES (?, ?, ?, ?)',
      [nome, telefone, email, endereco]
    );
    res.status(201).json({ mensagem: 'Empresa criada com sucesso!', id_empresa: result.insertId });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Ver detalhes de uma empresa
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM EmpresaRecicladora WHERE id_empresa = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Empresa não encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Desactivar empresa (só admin)
router.patch('/:id/desactivar', auth, role('admin'), async (req, res) => {
  try {
    await pool.query(
      'UPDATE EmpresaRecicladora SET ativo = FALSE WHERE id_empresa = ?',
      [req.params.id]
    );
    res.json({ mensagem: 'Empresa desactivada com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;