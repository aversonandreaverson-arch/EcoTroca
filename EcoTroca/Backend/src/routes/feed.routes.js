import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

const TIPOS_PERMITIDOS = {
  admin:   ['evento', 'educacao', 'noticia', 'aviso'],
  empresa: ['pedido_residuo', 'evento', 'educacao', 'noticia'],
  comum:   ['oferta_residuo'],
  coletor: [],
};

// ── GET /api/feed ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
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
        p.id_usuario AS id_autor,
        u.nome       AS nome_autor,
        r.tipo       AS tipo_residuo,
        r.preco_min,
        r.preco_max
      FROM Publicacao p
      LEFT JOIN Usuario u ON p.id_usuario = u.id_usuario
      LEFT JOIN Residuo r ON p.id_residuo = r.id_residuo
      WHERE p.eliminado = 0
      ORDER BY p.criado_em DESC
      LIMIT 50
    `);

    const [eventos] = await pool.query(`
      SELECT
        e.id_evento    AS id_publicacao,
        'evento'       AS tipo_publicacao,
        e.titulo,
        e.descricao,
        NULL           AS quantidade_kg,
        NULL           AS valor_proposto,
        e.provincia,
        e.imagem,
        e.criado_em,
        'empresa'      AS tipo_autor,
        e.id_empresa   AS id_autor,
        em.nome        AS nome_autor,
        NULL           AS tipo_residuo,
        NULL           AS preco_min,
        NULL           AS preco_max
      FROM Evento e
      LEFT JOIN EmpresaRecicladora em ON e.id_empresa = em.id_empresa
      WHERE e.eliminado = 0 AND e.status = 'ativo'
      ORDER BY e.criado_em DESC
      LIMIT 20
    `);

    const tudo = [...publicacoes, ...eventos].sort(
      (a, b) => new Date(b.criado_em) - new Date(a.criado_em)
    );

    res.json(tudo);
  } catch (err) {
    console.error('Erro ao carregar feed:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/feed ────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const {
      tipo_publicacao, titulo, descricao,
      id_residuo, quantidade_kg, valor_proposto,
      provincia, imagem,
    } = req.body;

    const tipo_usuario = req.usuario.tipo_usuario;
    const tipo_autor   = tipo_usuario === 'empresa' ? 'empresa'
                       : tipo_usuario === 'coletor' ? 'coletor'
                       : tipo_usuario === 'admin'   ? 'admin'
                       : 'utilizador';

    const permitidos = TIPOS_PERMITIDOS[tipo_usuario] || TIPOS_PERMITIDOS['comum'];
    if (!permitidos.includes(tipo_publicacao)) {
      return res.status(403).json({
        erro: `O teu perfil não pode publicar o tipo "${tipo_publicacao}".`
      });
    }

    if (!titulo?.trim()) {
      return res.status(400).json({ erro: 'O título é obrigatório.' });
    }

    await pool.query(
      `INSERT INTO Publicacao
        (id_usuario, tipo_autor, tipo_publicacao, titulo, descricao,
         id_residuo, quantidade_kg, valor_proposto, provincia, imagem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.id,
        tipo_autor,
        tipo_publicacao,
        titulo.trim(),
        descricao      || null,
        id_residuo     || null,
        quantidade_kg  || null,
        valor_proposto || null,
        provincia      || null,
        imagem         || null,
      ]
    );

    res.status(201).json({ mensagem: 'Publicação criada com sucesso.' });
  } catch (err) {
    console.error('Erro ao criar publicação:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── DELETE /api/feed/:id ──────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario FROM Publicacao WHERE id_publicacao = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ erro: 'Publicação não encontrada.' });
    }

    const eAdmin = req.usuario.tipo_usuario === 'admin';
    const eAutor = rows[0].id_usuario === req.usuario.id;

    if (!eAdmin && !eAutor) {
      return res.status(403).json({ erro: 'Não tens permissão para apagar esta publicação.' });
    }

    await pool.query(
      'UPDATE Publicacao SET eliminado = 1 WHERE id_publicacao = ?',
      [req.params.id]
    );

    res.json({ mensagem: 'Publicação removida com sucesso.' });
  } catch (err) {
    console.error('Erro ao apagar publicação:', err);
    res.status(500).json({ erro: err.message });
  }
});

export default router;