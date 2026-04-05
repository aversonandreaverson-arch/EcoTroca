
//  GET    /api/educacao           → listar (filtra por publico_alvo + pesquisa + categoria)
//  GET    /api/educacao/:id       → ver conteúdo completo
//  POST   /api/educacao           → admin cria conteúdo
//  PUT    /api/educacao/:id       → admin edita conteúdo
//  DELETE /api/educacao/:id       → admin elimina (soft delete)
// ============================================================

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';

const router = Router();


// GET /api/educacao
// Lista conteúdos filtrados por:
//   - publico_alvo do utilizador autenticado (automático)
//   - ?pesquisa=texto   → pesquisa livre em título, descrição e conteúdo
//   - ?categoria=valor  → filtra por categoria
//   - ?ordem=recente    → mais recente primeiro (padrão)
//   - ?ordem=antigo     → mais antigo primeiro
router.get('/', auth, async (req, res) => {
  try {
    const { pesquisa, categoria, ordem } = req.query;
    const tipo = req.usuario.tipo_usuario; // vem do token JWT

    // Parâmetros da query dinâmica
    const params = [];

    // ── Filtro base: não eliminados + visíveis para este tipo de utilizador
    let where = `WHERE e.eliminado = FALSE
                 AND (e.publico_alvo = 'todos' OR e.publico_alvo = ?)`;
    params.push(tipo);

    // ── Pesquisa livre — procura em título, descrição e conteúdo
    if (pesquisa && pesquisa.trim()) {
      where += ` AND (
        e.titulo    LIKE ? OR
        e.descricao LIKE ? OR
        e.conteudo  LIKE ?
      )`;
      const termo = `%${pesquisa.trim()}%`;
      params.push(termo, termo, termo);
    }

    // ── Filtro por categoria
    if (categoria && categoria !== 'todos') {
      where += ` AND e.categoria = ?`;
      params.push(categoria);
    }

    // ── Ordenação
    const ordenacao = ordem === 'antigo' ? 'ASC' : 'DESC';

    const [rows] = await pool.query(
      `SELECT
         e.id_educacao, e.titulo, e.descricao, e.categoria,
         e.publico_alvo, e.imagem, e.criado_em
       FROM Educacao e
       ${where}
       ORDER BY e.criado_em ${ordenacao}`,
      params
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/educacao/:id
// Ver conteúdo completo de um artigo
// ──────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const tipo = req.usuario.tipo_usuario;

    const [rows] = await pool.query(
      `SELECT * FROM Educacao
       WHERE id_educacao = ?
         AND eliminado = FALSE
         AND (publico_alvo = 'todos' OR publico_alvo = ?)`,
      [req.params.id, tipo]
    );

    if (rows.length === 0)
      return res.status(404).json({ erro: 'Conteúdo não encontrado.' });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/educacao
// Admin cria novo conteúdo educativo
// ──────────────────────────────────────────────────────────────
router.post('/', auth, role('admin'), async (req, res) => {
  try {
    const { titulo, descricao, conteudo, categoria, publico_alvo, imagem } = req.body;

    if (!titulo?.trim())   return res.status(400).json({ erro: 'Título é obrigatório.' });
    if (!conteudo?.trim()) return res.status(400).json({ erro: 'Conteúdo é obrigatório.' });

    const [result] = await pool.query(
      `INSERT INTO Educacao (titulo, descricao, conteudo, categoria, publico_alvo, imagem)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        titulo.trim(),
        descricao?.trim() || null,
        conteudo.trim(),
        categoria     || 'boas_praticas',
        publico_alvo  || 'todos',
        imagem        || null,
      ]
    );

    res.status(201).json({
      mensagem: 'Conteúdo criado com sucesso!',
      id_educacao: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT /api/educacao/:id
// Admin edita conteúdo existente
// ──────────────────────────────────────────────────────────────
router.put('/:id', auth, role('admin'), async (req, res) => {
  try {
    const { titulo, descricao, conteudo, categoria, publico_alvo, imagem } = req.body;

    if (!titulo?.trim())   return res.status(400).json({ erro: 'Título é obrigatório.' });
    if (!conteudo?.trim()) return res.status(400).json({ erro: 'Conteúdo é obrigatório.' });

    await pool.query(
      `UPDATE Educacao SET
         titulo = ?, descricao = ?, conteudo = ?,
         categoria = ?, publico_alvo = ?, imagem = ?
       WHERE id_educacao = ? AND eliminado = FALSE`,
      [
        titulo.trim(),
        descricao?.trim() || null,
        conteudo.trim(),
        categoria    || 'boas_praticas',
        publico_alvo || 'todos',
        imagem       || null,
        req.params.id,
      ]
    );

    res.json({ mensagem: 'Conteúdo atualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// DELETE /api/educacao/:id
// Admin elimina conteúdo — soft delete (preserva histórico)
// ──────────────────────────────────────────────────────────────
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    await pool.query(
      `UPDATE Educacao SET eliminado = TRUE WHERE id_educacao = ?`,
      [req.params.id]
    );

    res.json({ mensagem: 'Conteúdo eliminado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;