// ============================================================
//  empresa.routes.js — Rotas das empresas recicladoras
//  Guardar em: src/routes/empresa.routes.js
//
//  Rotas disponíveis:
//    GET  /api/empresas          → listar todas as empresas activas (público)
//    GET  /api/empresas/:id      → ver detalhes de uma empresa
//    PUT  /api/empresas/perfil   → actualizar perfil da empresa autenticada
// ============================================================

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/empresas ─────────────────────────────────────────
// Lista todas as empresas activas — usado na sidebar da PaginaInicial
// Qualquer utilizador autenticado pode ver
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         e.id_empresa,
         e.nome,
         e.telefone,
         e.email,
         e.provincia,
         e.municipio,
         e.horario_abertura,
         e.horario_fechamento,
         e.foto_perfil
       FROM EmpresaRecicladora e
       INNER JOIN Usuario u ON e.id_usuario = u.id_usuario
       WHERE u.ativo = TRUE
       ORDER BY e.nome ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/empresas/:id ─────────────────────────────────────
// Ver detalhes de uma empresa específica
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         e.*,
         u.email AS email_usuario
       FROM EmpresaRecicladora e
       INNER JOIN Usuario u ON e.id_usuario = u.id_usuario
       WHERE e.id_empresa = ? AND u.ativo = TRUE`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Empresa não encontrada.' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PUT /api/empresas/perfil ──────────────────────────────────
// Actualiza o perfil da empresa autenticada
router.put('/perfil', auth, async (req, res) => {
  try {
    const { nome, telefone, provincia, municipio, horario_abertura, horario_fechamento } = req.body;

    // Vou buscar o id_empresa da empresa autenticada
    const [empresa] = await pool.query(
      'SELECT id_empresa FROM EmpresaRecicladora WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );

    if (empresa.length === 0) {
      return res.status(403).json({ erro: 'Não és uma empresa.' });
    }

    await pool.query(
      `UPDATE EmpresaRecicladora SET
         nome = ?, telefone = ?, provincia = ?, municipio = ?,
         horario_abertura = ?, horario_fechamento = ?
       WHERE id_empresa = ?`,
      [
        nome, telefone, provincia || null, municipio || null,
        horario_abertura || null, horario_fechamento || null,
        empresa[0].id_empresa
      ]
    );

    res.json({ mensagem: 'Perfil da empresa actualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;