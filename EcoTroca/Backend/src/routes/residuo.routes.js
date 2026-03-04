
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/residuos ─────────────────────────────────────────
// Aqui devolvo todos os tipos de resíduos disponíveis na plataforma
// O frontend usa estes dados para preencher o select do formulário
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_residuo, tipo, descricao, valor_por_kg FROM Residuo ORDER BY tipo ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro ao carregar resíduos:', err);
    res.status(500).json({ erro: err.message });
  }
});

export default router;