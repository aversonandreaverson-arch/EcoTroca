
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/admin/utilizadores ──────────────────────────
router.get('/utilizadores', auth, role('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nome, email, telefone, tipo_usuario, ativo FROM Usuario'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/admin/utilizadores/:id/status ─────────────
router.patch('/utilizadores/:id/status', auth, role('admin'), async (req, res) => {
  try {
    const { ativo } = req.body;
    await pool.query(
      'UPDATE Usuario SET ativo = ? WHERE id_usuario = ?',
      [ativo, req.params.id]
    );
    res.json({ mensagem: 'Estado do utilizador actualizado!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/entregas ───────────────────────────────
router.get('/entregas', auth, role('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.*,
        u.nome  AS nome_usuario,
        em.nome AS nome_empresa,
        r.nome  AS nome_residuo
      FROM Entrega e
      LEFT JOIN Usuario          u  ON e.id_usuario = u.id_usuario
      LEFT JOIN EmpresaRecicladora em ON e.id_empresa = em.id_empresa
      LEFT JOIN Residuo           r  ON e.id_residuo = r.id_residuo
      ORDER BY e.criado_em DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/auditoria ──────────────────────────────
router.get('/auditoria', auth, role('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, u.nome AS nome_usuario
      FROM Auditoria a
      LEFT JOIN Usuario u ON a.id_usuario = u.id_usuario
      ORDER BY a.data DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/estatisticas ───────────────────────────
router.get('/estatisticas', auth, role('admin'), async (req, res) => {
  try {
    const [[{ total_usuarios }]]        = await pool.query('SELECT COUNT(*) as total_usuarios FROM Usuario');
    const [[{ total_entregas }]]        = await pool.query('SELECT COUNT(*) as total_entregas FROM Entrega');
    const [[{ entregas_pendentes }]]    = await pool.query("SELECT COUNT(*) as entregas_pendentes FROM Entrega WHERE status = 'pendente'");
    const [[{ total_empresas }]]        = await pool.query('SELECT COUNT(*) as total_empresas FROM EmpresaRecicladora');

    res.json({ total_usuarios, total_entregas, entregas_pendentes, total_empresas });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/dashboard ──────────────────────────────
// Rota principal do painel — usada pelo DashboardAdmin.jsx
router.get('/dashboard', auth, role('admin'), async (req, res) => {
  try {
    // Contagens de utilizadores
    const [[{ total_utilizadores }]] = await pool.query(
      "SELECT COUNT(*) as total_utilizadores FROM Usuario WHERE tipo_usuario = 'utilizador'"
    );
    const [[{ total_empresas }]] = await pool.query(
      'SELECT COUNT(*) as total_empresas FROM EmpresaRecicladora'
    );
    const [[{ total_coletadores }]] = await pool.query(
      'SELECT COUNT(*) as total_coletadores FROM Coletador'
    );

    // Contagens de entregas por estado
    const [[{ total_entregas }]] = await pool.query(
      'SELECT COUNT(*) as total_entregas FROM Entrega'
    );
    const [[{ pendentes }]] = await pool.query(
      "SELECT COUNT(*) as pendentes FROM Entrega WHERE status = 'pendente'"
    );
    const [[{ concluidas }]] = await pool.query(
      "SELECT COUNT(*) as concluidas FROM Entrega WHERE status = 'coletada'"
    );
    const [[{ canceladas }]] = await pool.query(
      "SELECT COUNT(*) as canceladas FROM Entrega WHERE status IN ('cancelada','rejeitada')"
    );

    // Financeiro
    const [[fin]] = await pool.query(`
      SELECT
        COALESCE(SUM(valor_total), 0)        AS total_transaccionado,
        COALESCE(SUM(valor_total * 0.10), 0) AS total_comissoes,
        COALESCE(SUM(peso_total), 0)         AS total_kg
      FROM Entrega
      WHERE status = 'coletada'
    `);

    // Ultimas 10 entregas
    const [entregas_recentes] = await pool.query(`
      SELECT
        e.id_entrega, e.status,
        e.peso_total  AS peso,
        e.valor_total,
        e.criado_em,
        u.nome        AS utilizador,
        em.nome       AS empresa,
        r.nome        AS residuo
      FROM Entrega e
      LEFT JOIN Usuario            u  ON e.id_usuario = u.id_usuario
      LEFT JOIN EmpresaRecicladora em ON e.id_empresa = em.id_empresa
      LEFT JOIN Residuo            r  ON e.id_residuo = r.id_residuo
      ORDER BY e.criado_em DESC
      LIMIT 10
    `);

    res.json({
      utilizadores: { total: total_utilizadores, comuns: total_utilizadores },
      empresas:     { total: total_empresas },
      coletadores:  { total: total_coletadores },
      entregas:     { total: total_entregas, pendentes, concluidas, canceladas },
      financeiro: {
        total_transaccionado: fin.total_transaccionado,
        total_comissoes:      fin.total_comissoes,
        total_kg:             fin.total_kg,
      },
      entregas_recentes,
    });

  } catch (err) {
    console.error('Erro dashboard admin:', err);
    res.status(500).json({ erro: 'Erro ao carregar estatisticas.' });
  }
});

export default router;