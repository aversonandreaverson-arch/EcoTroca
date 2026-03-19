// ============================================================
//  pesquisa.routes.js
//  Guardar em: src/routes/pesquisa.routes.js
//
//  GET /api/pesquisa?q=texto
//  Devolve utilizadores, empresas e coletadores correspondentes
// ============================================================

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q || q.length < 1)
      return res.json({ utilizadores: [], empresas: [], coletadores: [] });

    const like = `%${q}%`;

    // Utilizadores comuns
    const [utilizadores] = await pool.query(
      `SELECT u.id_usuario, u.nome, u.provincia, u.municipio,
              'comum' AS tipo
       FROM usuario u
       WHERE u.tipo_usuario = 'comum'
         AND u.ativo = TRUE
         AND (u.nome LIKE ? OR u.provincia LIKE ? OR u.municipio LIKE ?)
       ORDER BY u.nome ASC
       LIMIT 5`,
      [like, like, like]
    );

    // Empresas recicladoras
    const [empresas] = await pool.query(
      `SELECT e.id_empresa, e.nome, e.provincia, e.municipio,
              e.residuos_aceites, 'empresa' AS tipo
       FROM empresarecicladora e
       INNER JOIN usuario u ON u.id_usuario = e.id_usuario
       WHERE u.ativo = TRUE
         AND (e.nome LIKE ? OR e.provincia LIKE ? OR e.municipio LIKE ?)
       ORDER BY e.nome ASC
       LIMIT 5`,
      [like, like, like]
    );

    // Coletadores
    const [coletadores] = await pool.query(
      `SELECT c.id_coletador, u.nome, u.provincia, u.municipio,
              c.tipo AS subtipo, 'coletor' AS tipo
       FROM coletador c
       INNER JOIN usuario u ON u.id_usuario = c.id_usuario
       WHERE u.ativo = TRUE
         AND (u.nome LIKE ? OR u.provincia LIKE ? OR u.municipio LIKE ?)
       ORDER BY u.nome ASC
       LIMIT 5`,
      [like, like, like]
    );

    res.json({ utilizadores, empresas, coletadores });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;