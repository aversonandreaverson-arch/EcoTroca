
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
// ============================================================

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// Tipos de publicação permitidos por perfil de utilizador
const TIPOS_PERMITIDOS = {
  admin:   ['evento', 'educacao', 'noticia', 'aviso'],
  empresa: ['pedido_residuo', 'evento', 'educacao', 'noticia'],
  comum:   ['oferta_residuo'],
  coletor: [], // coletador só lê, não publica
};

// ── GET /api/feed ─────────────────────────────────────────────
// Devolve publicações da tabela Publicacao + eventos da tabela Evento
// Ordena tudo por data decrescente (mais recente primeiro)
router.get('/', auth, async (req, res) => {
  try {
    // Vou buscar as publicações com dados do autor e do resíduo associado
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

    // Vou buscar os eventos activos das empresas
    // Os eventos têm a mesma estrutura das publicações para facilitar o frontend
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

    // Junto publicações e eventos e ordeno tudo por data
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
// Cria uma nova publicação com status 'disponivel' por defeito
// O status muda para 'em_negociacao' quando uma empresa envia proposta
router.post('/', auth, async (req, res) => {
  try {
    const {
      tipo_publicacao, titulo, descricao,
      id_residuo, quantidade_kg, valor_proposto,
      provincia, imagem,
    } = req.body;

    const tipo_usuario = req.usuario.tipo_usuario;

    // Determino o tipo_autor com base no tipo de conta
    const tipo_autor = tipo_usuario === 'empresa' ? 'empresa'
                     : tipo_usuario === 'coletor' ? 'coletor'
                     : tipo_usuario === 'admin'   ? 'admin'
                     : 'utilizador';

    // Verifico se este perfil tem permissão para este tipo de publicação
    const permitidos = TIPOS_PERMITIDOS[tipo_usuario] || [];
    if (!permitidos.includes(tipo_publicacao)) {
      return res.status(403).json({
        erro: `O teu perfil não pode publicar o tipo "${tipo_publicacao}".`
      });
    }

    // Título é obrigatório
    if (!titulo?.trim()) {
      return res.status(400).json({ erro: 'O título é obrigatório.' });
    }

    // Insiro a publicação — status começa sempre como 'disponivel'
    await pool.query(
      `INSERT INTO Publicacao
        (id_usuario, tipo_autor, tipo_publicacao, titulo, descricao,
         id_residuo, quantidade_kg, valor_proposto, provincia, imagem, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponivel')`,
      [
        req.usuario.id_usuario,
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
// Apaga publicação com lógica de penalização baseada no status
//
//  'disponivel'    → apaga normalmente
//  'em_negociacao' → apaga + advertência automática ao utilizador
//                    se advertencias >= 3 → suspende por 7 dias
//  'fechada'       → bloqueia completamente (só admin pode apagar)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Vou buscar a publicação e o seu status actual
    const [rows] = await pool.query(
      'SELECT id_usuario, status FROM Publicacao WHERE id_publicacao = ? AND eliminado = 0',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ erro: 'Publicação não encontrada.' });
    }

    const publicacao = rows[0];
    const eAdmin     = req.usuario.tipo_usuario === 'admin';
    const eAutor     = publicacao.id_usuario === req.usuario.id_usuario;

    // Só o autor ou admin podem apagar
    if (!eAdmin && !eAutor) {
      return res.status(403).json({ erro: 'Não tens permissão para apagar esta publicação.' });
    }

    // ── Regra 1: publicação FECHADA não pode ser apagada ──
    // A negociação já foi concluída — ninguém pode remover
    if (publicacao.status === 'fechada' && !eAdmin) {
      return res.status(403).json({
        erro: 'Esta publicação já tem uma negociação concluída e não pode ser removida.'
      });
    }

    // ── Regra 2: publicação EM NEGOCIAÇÃO → penalização automática ──
    // O utilizador pode apagar mas recebe uma advertência no perfil
    if (publicacao.status === 'em_negociacao' && !eAdmin) {

      // Incremento o contador de advertências do utilizador
      await pool.query(
        'UPDATE Usuario SET advertencias = advertencias + 1 WHERE id_usuario = ?',
        [publicacao.id_usuario]
      );

      // Verifico se já tem 3 ou mais advertências — se sim suspendo por 7 dias
      const [u] = await pool.query(
        'SELECT advertencias FROM Usuario WHERE id_usuario = ?',
        [publicacao.id_usuario]
      );

      if (u[0].advertencias >= 3) {
        // Calculo a data de fim da suspensão (hoje + 7 dias)
        const suspensaoAte = new Date();
        suspensaoAte.setDate(suspensaoAte.getDate() + 7);

        await pool.query(
          'UPDATE Usuario SET suspenso_ate = ? WHERE id_usuario = ?',
          [suspensaoAte, publicacao.id_usuario]
        );
      }

      // Notifico o utilizador da advertência aplicada
      await pool.query(
        `INSERT INTO Notificacao (id_usuario, titulo, mensagem)
         VALUES (?, '⚠️ Advertência aplicada', ?)`,
        [
          publicacao.id_usuario,
          'Removeste uma publicação que estava em negociação. Esta acção resultou numa advertência. Ao acumular 3 advertências a tua conta será suspensa por 7 dias.'
        ]
      );
    }

    // Apago a publicação com soft delete — preservo o histórico
    await pool.query(
      'UPDATE Publicacao SET eliminado = 1 WHERE id_publicacao = ?',
      [req.params.id]
    );

    // Mensagem diferente consoante o status da publicação apagada
    const mensagem = publicacao.status === 'em_negociacao'
      ? 'Publicação removida. Foi aplicada uma advertência à tua conta.'
      : 'Publicação removida com sucesso.';

    res.json({ mensagem });
  } catch (err) {
    console.error('Erro ao apagar publicação:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/feed/:id/status ────────────────────────────────
// Actualiza o status de uma publicação
// Chamado internamente quando:
//   - empresa envia proposta    → 'em_negociacao'
//   - utilizador aceita proposta → 'fechada'
//   - utilizador recusa proposta → 'disponivel'
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    // Verifico se o status enviado é válido
    const statusValidos = ['disponivel', 'em_negociacao', 'fechada'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ erro: 'Status inválido.' });
    }

    await pool.query(
      'UPDATE Publicacao SET status = ? WHERE id_publicacao = ?',
      [status, req.params.id]
    );

    res.json({ mensagem: `Status actualizado para "${status}".` });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;