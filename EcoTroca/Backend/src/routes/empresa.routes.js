
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── Função auxiliar: busca o id_empresa do utilizador autenticado ──
const getIdEmpresa = async (id_usuario) => {
  const [rows] = await pool.query(
    'SELECT id_empresa FROM empresarecicladora WHERE id_usuario = ?',
    [id_usuario]
  );
  if (rows.length === 0) throw new Error('Não és uma empresa.');
  return rows[0].id_empresa;
};

// ── GET /api/empresas ─────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id_empresa, e.nome, e.telefone, e.email,
              e.provincia, e.municipio, e.horario_abertura,
              e.horario_fechamento, e.foto_perfil
       FROM empresarecicladora e
       INNER JOIN usuario u ON e.id_usuario = u.id_usuario
       WHERE u.ativo = TRUE
       ORDER BY e.nome ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/empresas/perfil ──────────────────────────────────
router.get('/perfil', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT e.* FROM empresarecicladora e WHERE e.id_usuario = ?',
      [req.usuario.id_usuario]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Perfil de empresa não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/empresas/minhas/entregas ─────────────────────────
router.get('/minhas/entregas', auth, async (req, res) => {
  try {
    const id_empresa = await getIdEmpresa(req.usuario.id_usuario);
    const [rows] = await pool.query(
      `SELECT
         en.id_entrega, en.status, en.peso_total, en.valor_total,
         en.data_hora, en.observacoes, en.endereco_domicilio,
         u.nome AS nome_usuario, u.telefone AS telefone_usuario,
         GROUP_CONCAT(r.tipo ORDER BY r.tipo SEPARATOR ', ') AS tipos_residuos
       FROM entrega en
       INNER JOIN usuario u ON en.id_usuario = u.id_usuario
       LEFT JOIN entrega_residuo er ON er.id_entrega = en.id_entrega
       LEFT JOIN residuo r ON r.id_residuo = er.id_residuo
       WHERE en.id_empresa = ?
       GROUP BY en.id_entrega
       ORDER BY en.data_hora DESC`,
      [id_empresa]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/empresas/minhas/eventos ─────────────────────────
router.get('/minhas/eventos', auth, async (req, res) => {
  try {
    const id_empresa = await getIdEmpresa(req.usuario.id_usuario);
    const [rows] = await pool.query(
      'SELECT * FROM evento WHERE id_empresa = ? ORDER BY data_inicio DESC',
      [id_empresa]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/empresas/minhas/eventos ─────────────────────────
router.post('/minhas/eventos', auth, async (req, res) => {
  try {
    const id_empresa = await getIdEmpresa(req.usuario.id_usuario);
    const { titulo, descricao, data_inicio, data_fim, local, provincia, municipio, tipo } = req.body;

    if (!titulo || !data_inicio || !local)
      return res.status(400).json({ erro: 'Título, data de início e local são obrigatórios.' });

    const [result] = await pool.query(
      `INSERT INTO evento (id_empresa, titulo, descricao, data_inicio, data_fim, local, provincia, municipio, tipo, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo')`,
      [id_empresa, titulo, descricao || null, data_inicio, data_fim || null,
       local, provincia || null, municipio || null, tipo || 'recolha']
    );
    res.status(201).json({ mensagem: 'Evento criado com sucesso.', id_evento: result.insertId });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/empresas/minhas/coletadores ─────────────────────
router.get('/minhas/coletadores', auth, async (req, res) => {
  try {
    const id_empresa = await getIdEmpresa(req.usuario.id_usuario);
    const [rows] = await pool.query(
      `SELECT c.id_coletador, u.nome, u.telefone, u.email, u.ativo
       FROM coletador c
       INNER JOIN usuario u ON c.id_usuario = u.id_usuario
       WHERE c.id_empresa = ?
       ORDER BY u.nome ASC`,
      [id_empresa]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/empresas/minhas/coletadores ─────────────────────
router.post('/minhas/coletadores', auth, async (req, res) => {
  try {
    const id_empresa = await getIdEmpresa(req.usuario.id_usuario);
    const { id_coletador } = req.body;
    if (!id_coletador)
      return res.status(400).json({ erro: 'id_coletador é obrigatório.' });

    const [existe] = await pool.query(
      'SELECT id_coletador FROM coletador WHERE id_coletador = ?',
      [id_coletador]
    );
    if (existe.length === 0)
      return res.status(404).json({ erro: 'Coletador não encontrado.' });

    await pool.query(
      'UPDATE coletador SET id_empresa = ? WHERE id_coletador = ?',
      [id_empresa, id_coletador]
    );
    res.json({ mensagem: 'Coletador adicionado à empresa com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── DELETE /api/empresas/minhas/coletadores/:id ───────────────
router.delete('/minhas/coletadores/:id', auth, async (req, res) => {
  try {
    const id_empresa = await getIdEmpresa(req.usuario.id_usuario);
    await pool.query(
      'UPDATE coletador SET id_empresa = NULL WHERE id_coletador = ? AND id_empresa = ?',
      [req.params.id, id_empresa]
    );
    res.json({ mensagem: 'Coletador removido da empresa.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PUT /api/empresas/perfil ──────────────────────────────────
router.put('/perfil', auth, async (req, res) => {
  try {
    const {
      nome, telefone, email, endereco, provincia, municipio,
      bairro, descricao, horario_abertura, horario_fechamento,
      site, residuos_aceites
    } = req.body;

    const id_empresa = await getIdEmpresa(req.usuario.id_usuario);

    await pool.query(
      `UPDATE empresarecicladora SET
         nome = ?, telefone = ?, email = ?, endereco = ?,
         provincia = ?, municipio = ?, bairro = ?, descricao = ?,
         horario_abertura = ?, horario_fechamento = ?,
         site = ?, residuos_aceites = ?
       WHERE id_empresa = ?`,
      [
        nome, telefone, email || null, endereco || null,
        provincia || null, municipio || null, bairro || null, descricao || null,
        horario_abertura || null, horario_fechamento || null,
        site || null, residuos_aceites || null,
        id_empresa
      ]
    );
    res.json({ mensagem: 'Perfil actualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/empresas/:id ─────────────────────────────────────
// IMPORTANTE: esta rota tem de ficar SEMPRE no fim
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, u.email AS email_usuario
       FROM empresarecicladora e
       INNER JOIN usuario u ON e.id_usuario = u.id_usuario
       WHERE e.id_empresa = ? AND u.ativo = TRUE`,
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: 'Empresa não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;