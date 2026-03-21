//  Regras de apagar por status:
//    'disponivel'    → apaga livremente, sem penalização
//    'em_negociacao' → apaga MAS recebe advertência automática
//                      ao acumular 3 advertências → suspensão 7 dias
//    'fechada'       → BLOQUEADO, negociação concluída
//
//  Quem pode publicar:
//    admin   → evento, educacao, noticia, aviso
//    empresa → pedido_residuo, evento, educacao, noticia
//    comum   → oferta_residuo
//    coletor → não pode publicar

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
        p.status,
        p.id_usuario          AS id_autor,
        p.kg_por_unidade,
        p.nome_unidade,
        p.minimo_por_pessoa   AS minimo_por_pessoa_kg,
        p.minimo_para_agendar,
        u.nome                AS nome_autor,
        r.tipo                AS tipo_residuo,
        r.qualidade,
        r.preco_min,
        r.preco_max,
        COALESCE((
          SELECT SUM(e2.peso_total)
          FROM entrega e2
          INNER JOIN empresarecicladora em2 ON em2.id_empresa = e2.id_empresa
          WHERE em2.id_usuario = p.id_usuario
            AND e2.id_residuo = p.id_residuo
            AND e2.status IN ('aceita','coletada')
        ), 0) AS total_acumulado
      FROM publicacao p
      LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
      LEFT JOIN residuo r ON p.id_residuo = r.id_residuo
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
        'fechada'      AS status,
        e.id_empresa   AS id_autor,
        NULL           AS kg_por_unidade,
        NULL           AS nome_unidade,
        NULL           AS minimo_por_pessoa_kg,
        NULL           AS minimo_para_agendar,
        em.nome        AS nome_autor,
        NULL           AS tipo_residuo,
        NULL           AS qualidade,
        NULL           AS preco_min,
        NULL           AS preco_max,
        0              AS total_acumulado
      FROM evento e
      LEFT JOIN empresarecicladora em ON e.id_empresa = em.id_empresa
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
      tipo_publicacao,
      titulo,
      descricao,
      id_residuo,
      quantidade_kg,
      valor_proposto,
      provincia,
      imagem,
      // Campos extras do modal completo da empresa
      nome_unidade,
      kg_por_unidade,
      minimo_por_pessoa_kg,   // frontend envia como minimo_por_pessoa_kg
      minimo_para_agendar,
      observacoes,
      com_coletador,
      id_coletadores,
    } = req.body;

    const tipo_usuario = req.usuario.tipo_usuario;

    const tipo_autor = tipo_usuario === 'empresa' ? 'empresa'
                     : tipo_usuario === 'coletor' ? 'coletor'
                     : tipo_usuario === 'admin'   ? 'admin'
                     : 'utilizador';

    const permitidos = TIPOS_PERMITIDOS[tipo_usuario] || [];
    if (!permitidos.includes(tipo_publicacao)) {
      return res.status(403).json({
        erro: `O teu perfil não pode publicar o tipo "${tipo_publicacao}".`
      });
    }

    if (!titulo?.trim()) {
      return res.status(400).json({ erro: 'O título é obrigatório.' });
    }

    // Insiro com todos os campos disponíveis na tabela
    const [result] = await pool.query(
      `INSERT INTO publicacao
        (id_usuario, tipo_autor, tipo_publicacao, titulo, descricao,
         id_residuo, quantidade_kg, valor_proposto, provincia, imagem,
         nome_unidade, kg_por_unidade, minimo_por_pessoa, minimo_para_agendar,
         status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponivel')`,
      [
        req.usuario.id_usuario,
        tipo_autor,
        tipo_publicacao,
        titulo.trim(),
        descricao            || null,
        id_residuo           || null,
        quantidade_kg        || null,
        valor_proposto       || null,
        provincia            || null,
        imagem               || null,
        nome_unidade         || null,
        kg_por_unidade       || null,
        minimo_por_pessoa_kg || null,   // guarda na coluna minimo_por_pessoa
        minimo_para_agendar  || null,
      ]
    );

    const id_publicacao = result.insertId;

    // Se a empresa enviou coletadores, registo a associação
    if (com_coletador && Array.isArray(id_coletadores) && id_coletadores.length > 0) {
      // Verifico se a tabela publicacao_coletador existe antes de inserir
      // Se não existir, ignoro silenciosamente (feature opcional)
      try {
        for (const id_coletador of id_coletadores) {
          await pool.query(
            'INSERT IGNORE INTO publicacao_coletador (id_publicacao, id_coletador) VALUES (?, ?)',
            [id_publicacao, id_coletador]
          );
        }
      } catch {
        // Tabela publicacao_coletador pode não existir — ignora silenciosamente
      }
    }

    res.status(201).json({ mensagem: 'Publicação criada com sucesso.', id_publicacao });
  } catch (err) {
    console.error('Erro ao criar publicação:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── PUT /api/feed/:id ─────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      titulo, descricao, id_residuo, quantidade_kg,
      valor_proposto, provincia, imagem,
      nome_unidade, kg_por_unidade,
      minimo_por_pessoa_kg, minimo_para_agendar,
    } = req.body;

    const [rows] = await pool.query(
      'SELECT id_usuario FROM publicacao WHERE id_publicacao = ? AND eliminado = 0',
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ erro: 'Publicação não encontrada.' });

    const eAdmin = req.usuario.tipo_usuario === 'admin';
    const eAutor = rows[0].id_usuario === req.usuario.id_usuario;
    if (!eAdmin && !eAutor) return res.status(403).json({ erro: 'Sem permissão.' });

    await pool.query(
      `UPDATE publicacao SET
        titulo = ?, descricao = ?, id_residuo = ?, quantidade_kg = ?,
        valor_proposto = ?, provincia = ?, imagem = ?,
        nome_unidade = ?, kg_por_unidade = ?,
        minimo_por_pessoa = ?, minimo_para_agendar = ?
       WHERE id_publicacao = ?`,
      [
        titulo?.trim()       || null,
        descricao            || null,
        id_residuo           || null,
        quantidade_kg        || null,
        valor_proposto       || null,
        provincia            || null,
        imagem               || null,
        nome_unidade         || null,
        kg_por_unidade       || null,
        minimo_por_pessoa_kg || null,
        minimo_para_agendar  || null,
        req.params.id,
      ]
    );

    res.json({ mensagem: 'Publicação actualizada.' });
  } catch (err) {
    console.error('Erro ao editar publicação:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── DELETE /api/feed/:id ──────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, status FROM publicacao WHERE id_publicacao = ? AND eliminado = 0',
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ erro: 'Publicação não encontrada.' });

    const publicacao = rows[0];
    const eAdmin     = req.usuario.tipo_usuario === 'admin';
    const eAutor     = publicacao.id_usuario === req.usuario.id_usuario;

    if (!eAdmin && !eAutor) return res.status(403).json({ erro: 'Sem permissão.' });

    if (publicacao.status === 'fechada' && !eAdmin) {
      return res.status(403).json({
        erro: 'Esta publicação já tem uma negociação concluída e não pode ser removida.'
      });
    }

    if (publicacao.status === 'em_negociacao' && !eAdmin) {
      await pool.query(
        'UPDATE usuario SET advertencias = advertencias + 1 WHERE id_usuario = ?',
        [publicacao.id_usuario]
      );

      const [u] = await pool.query(
        'SELECT advertencias FROM usuario WHERE id_usuario = ?',
        [publicacao.id_usuario]
      );

      if (u[0].advertencias >= 3) {
        const suspensaoAte = new Date();
        suspensaoAte.setDate(suspensaoAte.getDate() + 7);
        await pool.query(
          'UPDATE usuario SET suspenso_ate = ? WHERE id_usuario = ?',
          [suspensaoAte, publicacao.id_usuario]
        );
      }

      await pool.query(
        `INSERT INTO notificacao (id_usuario, titulo, mensagem)
         VALUES (?, '⚠️ Advertência aplicada', ?)`,
        [
          publicacao.id_usuario,
          'Removeste uma publicação que estava em negociação. Esta acção resultou numa advertência. Ao acumular 3 advertências a tua conta será suspensa por 7 dias.'
        ]
      );
    }

    await pool.query(
      'UPDATE publicacao SET eliminado = 1 WHERE id_publicacao = ?',
      [req.params.id]
    );

    const mensagem = publicacao.status === 'em_negociacao'
      ? 'Publicação removida. Foi aplicada uma advertência à tua conta.'
      : 'Publicação removida com sucesso.';

    res.json({ mensagem });
  } catch (err) {
    console.error('Erro ao apagar publicação:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/feed/:id/status 
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const statusValidos = ['disponivel', 'em_negociacao', 'fechada'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ erro: 'Status inválido.' });
    }
    await pool.query(
      'UPDATE publicacao SET status = ? WHERE id_publicacao = ?',
      [status, req.params.id]
    );
    res.json({ mensagem: `Status actualizado para "${status}".` });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;