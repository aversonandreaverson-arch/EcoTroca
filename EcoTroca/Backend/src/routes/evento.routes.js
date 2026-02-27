// ============================================================
//  evento.routes.js
//  Rotas públicas de eventos:
//    GET  /api/eventos        → listar todos os eventos ativos
//    GET  /api/eventos/:id    → ver detalhes de um evento
//    POST /api/admin/eventos  → admin cria evento (em admin.routes.js)
// ============================================================

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ──────────────────────────────────────────────────────────────
// LISTAR TODOS OS EVENTOS ATIVOS
// Visível para utilizadores e coletadores
// Ordenado por data mais próxima primeiro
// ──────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         ev.id_evento, ev.titulo, ev.descricao, ev.data_inicio, ev.data_fim,
         ev.local, ev.provincia, ev.municipio, ev.tipo, ev.status, ev.imagem,
         emp.nome AS nome_empresa,
         emp.foto_perfil AS foto_empresa
       FROM Evento ev
       LEFT JOIN EmpresaRecicladora emp ON ev.id_empresa = emp.id_empresa
       WHERE ev.status = 'ativo'
         AND ev.data_inicio >= NOW()
       ORDER BY ev.data_inicio ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// VER DETALHES DE UM EVENTO
// ──────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         ev.*, emp.nome AS nome_empresa, emp.telefone AS telefone_empresa,
         emp.foto_perfil AS foto_empresa
       FROM Evento ev
       LEFT JOIN EmpresaRecicladora emp ON ev.id_empresa = emp.id_empresa
       WHERE ev.id_evento = ?`,
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ erro: 'Evento não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;