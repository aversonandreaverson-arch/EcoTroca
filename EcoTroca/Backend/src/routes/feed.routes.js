// ============================================================
//  feed.routes.js — Rotas do feed da plataforma
//  Guardar em: src/routes/feed.routes.js
// ============================================================

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/feed ─────────────────────────────────────────────
// Devolvo todas as publicações ordenadas da mais recente para a mais antiga
// O feed é composto por publicações criadas manualmente na tabela Publicacao
// e também pelos eventos recentes da tabela Evento
router.get('/', auth, async (req, res) => {
  try {

    // Vou buscar as publicações de resíduos (ofertas e pedidos)
    const [publicacoes] = await pool.query(`
      SELECT
        p.id_publicacao,
        p.tipo_publicacao,
        p.titulo,
        p.descricao,
        p.quantidade_kg,
        p.valor_proposto,
        p.provincia,
        p.imagem,
        p.criado_em,
        p.tipo_autor,
        p.id_usuario   AS id_autor,
        u.nome         AS nome_autor,
        r.tipo         AS tipo_residuo
      FROM Publicacao p
      LEFT JOIN Usuario u ON p.id_usuario = u.id_usuario
      LEFT JOIN Residuo r ON p.id_residuo = r.id_residuo
      WHERE p.eliminado = 0
      ORDER BY p.criado_em DESC
      LIMIT 50
    `);

    // Vou buscar os eventos activos mais recentes e adiciono-os ao feed
    const [eventos] = await pool.query(`
      SELECT
        e.id_evento      AS id_publicacao,
        'evento'         AS tipo_publicacao,
        e.titulo,
        e.descricao,
        NULL             AS quantidade_kg,
        NULL             AS valor_proposto,
        e.provincia,
        e.imagem,
        e.criado_em,
        'empresa'        AS tipo_autor,
        e.id_empresa     AS id_autor,
        em.nome          AS nome_autor,
        NULL             AS tipo_residuo
      FROM Evento e
      LEFT JOIN EmpresaRecicladora em ON e.id_empresa = em.id_empresa
      WHERE e.eliminado = 0 AND e.status = 'ativo'
      ORDER BY e.criado_em DESC
      LIMIT 20
    `);

    // Junto as publicações e eventos numa lista só
    // e ordeno tudo por data decrescente
    const tudo = [...publicacoes, ...eventos].sort(
      (a, b) => new Date(b.criado_em) - new Date(a.criado_em)
    );

    res.json(tudo);
  } catch (err) {
    console.error('Erro feed:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/feed ────────────────────────────────────────────
// Crio uma nova publicação no feed
// Utilizador comum → oferta_residuo
// Empresa → pedido_residuo
router.post('/', auth, async (req, res) => {
  try {
    const {
      tipo_publicacao,
      titulo,
      descricao,
      id_residuo,
      quantidade_kg,
      valor_proposto,
      provincia,
      imagem,
    } = req.body;

    // Valido o campo obrigatório
    if (!titulo?.trim()) {
      return res.status(400).json({ erro: 'O título é obrigatório.' });
    }

    // Determino o tipo de autor com base no tipo_usuario do token
    // req.usuario vem do middleware auth
    const tipo_autor = req.usuario.tipo_usuario === 'empresa' ? 'empresa'
                     : req.usuario.tipo_usuario === 'coletor' ? 'coletor'
                     : 'utilizador';

    // Insiro a publicação na base de dados
    await pool.query(
      `INSERT INTO Publicacao
        (id_usuario, tipo_autor, tipo_publicacao, titulo, descricao,
         id_residuo, quantidade_kg, valor_proposto, provincia, imagem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.id,
        tipo_autor,
        tipo_publicacao || 'oferta_residuo',
        titulo.trim(),
        descricao || null,
        id_residuo || null,
        quantidade_kg || null,
        valor_proposto || null,
        provincia || null,
        imagem || null,
      ]
    );

    res.status(201).json({ mensagem: 'Publicação criada com sucesso.' });
  } catch (err) {
    console.error('Erro criar publicação:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── DELETE /api/feed/:id ──────────────────────────────────────
// Apago (soft delete) uma publicação — só o próprio autor pode apagar
router.delete('/:id', auth, async (req, res) => {
  try {
    // Verifico se a publicação pertence ao utilizador autenticado
    const [rows] = await pool.query(
      'SELECT id_usuario FROM Publicacao WHERE id_publicacao = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ erro: 'Publicação não encontrada.' });
    }

    // Só o autor ou o admin pode apagar
    if (rows[0].id_usuario !== req.usuario.id && req.usuario.tipo_usuario !== 'admin') {
      return res.status(403).json({ erro: 'Sem permissão para apagar esta publicação.' });
    }

    await pool.query(
      'UPDATE Publicacao SET eliminado = 1 WHERE id_publicacao = ?',
      [req.params.id]
    );

    res.json({ mensagem: 'Publicação removida.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;