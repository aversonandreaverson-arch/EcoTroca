
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── Função auxiliar: busca o id_empresa do utilizador autenticado ──
const getIdEmpresa = async (id_usuario) => {
  const [rows] = await pool.query(
    'SELECT id_empresa FROM EmpresaRecicladora WHERE id_usuario = ?',
    [id_usuario]
  );
  if (rows.length === 0) throw new Error('Não és uma empresa.');
  return rows[0].id_empresa;
};

// ── GET /api/empresas ─────────────────────────────────────────
// Lista todas as empresas activas — sidebar da PaginaInicial
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id_empresa, e.nome, e.telefone, e.email,
              e.provincia, e.municipio, e.horario_abertura,
              e.horario_fechamento, e.foto_perfil
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

// ── GET /api/empresas/perfil ──────────────────────────────────
// Perfil da empresa autenticada — usado no DashboardEmpresa, PerfilEmpresa
router.get('/perfil', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*
       FROM EmpresaRecicladora e
       WHERE e.id_usuario = ?`,
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
// Entregas associadas à empresa autenticada
router.get('/minhas/entregas', auth, async (req, res) => {
  try {
    const id_empresa = await getIdEmpresa(req.usuario.id_usuario);

    const [rows] = await pool.query(
      `SELECT
         en.id_entrega,
         en.status,
         en.peso_total,
         en.valor_total,
         en.data_hora,
         en.observacoes,
         en.endereco_domicilio,
         u.nome  AS nome_usuario,
         u.telefone AS telefone_usuario,
         GROUP_CONCAT(r.tipo ORDER BY r.tipo SEPARATOR ', ') AS tipos_residuos
       FROM Entrega en
       INNER JOIN Usuario u ON en.id_usuario = u.id_usuario
       LEFT JOIN EntregaResiduo er ON er.id_entrega = en.id_entrega
       LEFT JOIN Residuo r ON r.id_residuo = er.id_residuo
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
// Eventos criados pela empresa autenticada
router.get('/minhas/eventos', auth, async (req, res) => {
  try {
    const id_empresa = await getIdEmpresa(req.usuario.id_usuario);

    const [rows] = await pool.query(
      `SELECT *
       FROM Evento
       WHERE id_empresa = ?
       ORDER BY data_inicio DESC`,
      [id_empresa]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PUT /api/empresas/perfil ──────────────────────────────────
// Actualiza o perfil da empresa autenticada
router.put('/perfil', auth, async (req, res) => {
  try {
    const {
      nome, telefone, email, endereco, provincia, municipio,
      bairro, descricao, horario_abertura, horario_fechamento,
      site, residuos_aceites
    } = req.body;

    const id_empresa = await getIdEmpresa(req.usuario.id_usuario);

    await pool.query(
      `UPDATE EmpresaRecicladora SET
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
// Ver detalhes de uma empresa específica (perfil público)
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, u.email AS email_usuario
       FROM EmpresaRecicladora e
       INNER JOIN Usuario u ON e.id_usuario = u.id_usuario
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