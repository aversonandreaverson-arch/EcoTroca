
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/residuos ─────────────────────────────────────────
// Aqui devolvo todos os resíduos com qualidade e intervalos de preço
// O frontend usa estes dados para o fluxo tipo → qualidade → estimativa
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id_residuo,
        tipo,
        subtipo,
        qualidade,
        descricao,
        valor_por_kg,
        preco_min,
        preco_max
      FROM Residuo
      ORDER BY tipo ASC, 
        FIELD(qualidade, 'ruim', 'moderada', 'boa', 'excelente') ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao carregar resíduos:', err);
    res.status(500).json({ erro: err.message });
  }
});

export default router;