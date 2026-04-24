
//  Rotas:
//    POST /api/avaliacoes          → criar avaliação após entrega concluída
//    GET  /api/avaliacoes/:id_usuario → ver avaliações de um utilizador
//    GET  /api/avaliacoes/minhas   → ver avaliações que recebi

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── POST /api/avaliacoes 
// Qualquer utilizador autenticado pode avaliar após entrega concluída
router.post('/', auth, async (req, res) => {
  try {
    const { id_entrega, id_avaliado, tipo_avaliado, nota, comentario } = req.body;
    const id_avaliador = req.usuario.id_usuario;

    // Validações
    if (!id_entrega || !id_avaliado || !tipo_avaliado || !nota) {
      return res.status(400).json({ erro: 'id_entrega, id_avaliado, tipo_avaliado e nota são obrigatórios.' });
    }
    if (nota < 1 || nota > 5) {
      return res.status(400).json({ erro: 'A nota deve ser entre 1 e 5.' });
    }
    if (id_avaliador === parseInt(id_avaliado)) {
      return res.status(400).json({ erro: 'Não podes avaliar-te a ti próprio.' });
    }

    // Verifica se a entrega existe e está concluída
    const [entregas] = await pool.query(
      'SELECT id_entrega, status, id_usuario, id_empresa FROM entrega WHERE id_entrega = ?',
      [id_entrega]
    );
    if (!entregas.length) {
      return res.status(404).json({ erro: 'Entrega não encontrada.' });
    }
    if (entregas[0].status !== 'coletada') {
      return res.status(400).json({ erro: 'Só é possível avaliar após a entrega estar concluída.' });
    }

    // Verifica se o avaliador fez parte desta entrega
    const entrega = entregas[0];
    const [coletadorEntrega] = await pool.query(
      'SELECT c.id_usuario FROM coletador c WHERE c.id_coletador = (SELECT id_coletador FROM entrega WHERE id_entrega = ? LIMIT 1)',
      [id_entrega]
    );
    const idColetador = coletadorEntrega[0]?.id_usuario || null;

    const participantes = [entrega.id_usuario, idColetador].filter(Boolean);

    // Busca id_usuario da empresa
    const [empresaUser] = await pool.query(
      'SELECT id_usuario FROM empresarecicladora WHERE id_empresa = ?',
      [entrega.id_empresa]
    );
    if (empresaUser.length) participantes.push(empresaUser[0].id_usuario);

    if (!participantes.includes(id_avaliador)) {
      return res.status(403).json({ erro: 'Só os participantes desta entrega podem avaliar.' });
    }

    // Insere avaliação — UNIQUE KEY impede duplicados
    await pool.query(
      `INSERT INTO avaliacao (id_entrega, id_avaliador, id_avaliado, tipo_avaliado, nota, comentario)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_entrega, id_avaliador, id_avaliado, tipo_avaliado, nota, comentario || null]
    );

    // Verifica se ganhou medalhas com esta avaliação
    await verificarMedalhas(id_avaliado, tipo_avaliado);

    res.status(201).json({ mensagem: 'Avaliação registada com sucesso!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ erro: 'Já avaliaste esta entrega.' });
    }
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/avaliacoes/minhas ────────────────────────────────
// Avaliações que o utilizador autenticado recebeu
router.get('/minhas', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.nome AS nome_avaliador
       FROM avaliacao a
       INNER JOIN usuario u ON u.id_usuario = a.id_avaliador
       WHERE a.id_avaliado = ?
       ORDER BY a.criado_em DESC`,
      [req.usuario.id_usuario]
    );

    // Calcula média
    const media = rows.length
      ? (rows.reduce((acc, r) => acc + r.nota, 0) / rows.length).toFixed(1)
      : null;

    res.json({ avaliacoes: rows, media, total: rows.length });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/avaliacoes/entrega/:id ───────────────────────────
// Verifica se o utilizador já avaliou esta entrega
router.get('/entrega/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT tipo_avaliado FROM avaliacao WHERE id_entrega = ? AND id_avaliador = ?',
      [req.params.id, req.usuario.id_usuario]
    );
    // Devolve lista de tipos já avaliados por este utilizador nesta entrega
    res.json({ ja_avaliou: rows.map(r => r.tipo_avaliado) });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/avaliacoes/utilizador/:id ────────────────────────
// Avaliações públicas de um utilizador
router.get('/utilizador/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.nota, a.comentario, a.tipo_avaliado, a.criado_em,
              u.nome AS nome_avaliador, u.tipo_usuario AS tipo_avaliador
       FROM avaliacao a
       INNER JOIN usuario u ON u.id_usuario = a.id_avaliador
       WHERE a.id_avaliado = ?
       ORDER BY a.criado_em DESC
       LIMIT 20`,
      [req.params.id]
    );

    const media = rows.length
      ? (rows.reduce((acc, r) => acc + r.nota, 0) / rows.length).toFixed(1)
      : null;

    res.json({ avaliacoes: rows, media, total: rows.length });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── Verifica e atribui medalhas ───────────────────────────────
async function verificarMedalhas(id_usuario, tipo_avaliado) {
  try {
    // Conta avaliações com nota >= 4 recebidas
    const [stats] = await pool.query(
      `SELECT COUNT(*) AS total, AVG(nota) AS media
       FROM avaliacao WHERE id_avaliado = ? AND nota >= 4`,
      [id_usuario]
    );

    const total = stats[0].total;
    const media = parseFloat(stats[0].media || 0);

    // Define medalhas a verificar
    const medalhasParaVerificar = [
      { tipo: 'primeira_avaliacao', nome: 'Primeira Avaliação', descricao: 'Recebeste a tua primeira avaliação positiva!', condicao: total >= 1 },
      { tipo: '5_estrelas_10x',     nome: 'Parceiro de Confiança', descricao: '10 avaliações positivas recebidas.', condicao: total >= 10 },
      { tipo: '5_estrelas_50x',     nome: 'Referência da Plataforma', descricao: '50 avaliações positivas recebidas.', condicao: total >= 50 },
      { tipo: 'media_5_estrelas',   nome: 'Excelência Total', descricao: 'Média de 5 estrelas com pelo menos 5 avaliações.', condicao: media >= 4.8 && total >= 5 },
    ];

    for (const m of medalhasParaVerificar) {
      if (!m.condicao) continue;
      // Verifica se já tem esta medalha
      const [existe] = await pool.query(
        'SELECT id_medalha FROM medalha WHERE id_usuario = ? AND tipo = ?',
        [id_usuario, m.tipo]
      );
      if (!existe.length) {
        await pool.query(
          'INSERT INTO medalha (id_usuario, tipo, nome, descricao) VALUES (?, ?, ?, ?)',
          [id_usuario, m.tipo, m.nome, m.descricao]
        );
        // Notifica o utilizador
        await pool.query(
          `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
           VALUES (?, '🏅 Nova medalha!', ?, 'geral')`,
          [id_usuario, `Conquistaste a medalha "${m.nome}": ${m.descricao}`]
        );
      }
    }
  } catch (err) {
    console.error('Erro ao verificar medalhas:', err.message);
  }
}

export default router;