
//  Rotas públicas — acessíveis a qualquer utilizador autenticado:
//    GET /api/ranking          → ranking geral (utilizadores, coletadores, empresas)
//    GET /api/ranking/medalhas → medalhas do utilizador autenticado
//    GET /api/ranking/medalhas/:id → medalhas de um utilizador específico

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/ranking 
// Acessível a todos os utilizadores autenticados
router.get('/', auth, async (req, res) => {
  try {
    // Top utilizadores comuns por pontos
    const [utilizadores] = await pool.query(`
      SELECT
        u.id_usuario,
        u.nome,
        u.provincia,
        COALESCE(pu.pontos_total, 0)           AS pontos,
        COALESCE(ru.nivel, 'iniciante')        AS nivel,
        COALESCE(AVG(a.nota), 0)               AS media_avaliacoes,
        COUNT(DISTINCT a.id_avaliacao)         AS total_avaliacoes,
        COUNT(DISTINCT e.id_entrega)           AS total_entregas,
        (SELECT COUNT(*) FROM medalha m WHERE m.id_usuario = u.id_usuario) AS total_medalhas
      FROM usuario u
      LEFT JOIN pontuacaousuario  pu ON pu.id_usuario = u.id_usuario
      LEFT JOIN recompensausuario ru ON ru.id_usuario  = u.id_usuario
      LEFT JOIN avaliacao          a ON a.id_avaliado  = u.id_usuario
      LEFT JOIN entrega            e ON e.id_usuario   = u.id_usuario AND e.status = 'coletada'
      WHERE u.tipo_usuario = 'comum' AND u.ativo = 1
      GROUP BY u.id_usuario
      ORDER BY pontos DESC, media_avaliacoes DESC
      LIMIT 20
    `);

    // Top coletadores por avaliações e recolhas
    const [coletadores] = await pool.query(`
      SELECT
        u.id_usuario,
        u.nome,
        u.provincia,
        COALESCE(AVG(a.nota), 0)               AS media_avaliacoes,
        COUNT(DISTINCT a.id_avaliacao)         AS total_avaliacoes,
        COUNT(DISTINCT e.id_entrega)           AS total_entregas,
        (SELECT COUNT(*) FROM medalha m WHERE m.id_usuario = u.id_usuario) AS total_medalhas
      FROM usuario u
      LEFT JOIN avaliacao a ON a.id_avaliado = u.id_usuario
      LEFT JOIN entrega   e ON e.id_usuario  = u.id_usuario AND e.status = 'coletada'
      WHERE u.tipo_usuario = 'coletor' AND u.ativo = 1
      GROUP BY u.id_usuario
      ORDER BY media_avaliacoes DESC, total_entregas DESC
      LIMIT 10
    `);

    // Top empresas por avaliações e kg recolhidos
    const [empresas] = await pool.query(`
      SELECT
        u.id_usuario,
        er.id_empresa,
        er.nome,
        er.provincia,
        COALESCE(AVG(a.nota), 0)               AS media_avaliacoes,
        COUNT(DISTINCT a.id_avaliacao)         AS total_avaliacoes,
        COUNT(DISTINCT e.id_entrega)           AS total_entregas,
        COALESCE(SUM(e.peso_total), 0)         AS total_kg
      FROM empresarecicladora er
      INNER JOIN usuario u ON u.id_usuario = er.id_usuario
      LEFT JOIN avaliacao a ON a.id_avaliado = u.id_usuario
      LEFT JOIN entrega   e ON e.id_empresa  = er.id_empresa AND e.status = 'coletada'
      WHERE u.ativo = 1
      GROUP BY er.id_empresa
      ORDER BY media_avaliacoes DESC, total_entregas DESC
      LIMIT 10
    `);

    res.json({ utilizadores, coletadores, empresas });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/ranking/medalhas ────────────────────────────────
// Medalhas do utilizador autenticado
router.get('/medalhas', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM medalha WHERE id_usuario = ? ORDER BY ganho_em DESC',
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/ranking/medalhas/:id ────────────────────────────
// Medalhas públicas de um utilizador
router.get('/medalhas/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM medalha WHERE id_usuario = ? ORDER BY ganho_em DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;