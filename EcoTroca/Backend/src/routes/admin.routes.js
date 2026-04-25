
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/admin/utilizadores 
// Devolvo todos os utilizadores registados na plataforma
// O frontend filtra por tipo_usuario para separar utilizadores, coletadores e empresas
router.get('/utilizadores', auth, role('admin'), async (req, res) => {
  try {
    // Vou buscar todos os utilizadores excepto o próprio admin
    // Incluo as colunas novas de penalização que adicionei à tabela
    const [rows] = await pool.query(`
      SELECT
        id_usuario, nome, email, telefone, provincia,
        tipo_usuario, ativo, advertencias,
        suspenso_ate, bloqueado_permanente, data_criacao
      FROM usuario
      WHERE tipo_usuario != 'admin'
      ORDER BY data_criacao DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/admin/utilizadores/:id/status ─────────────────
// Activa ou desactiva um utilizador (ativo = 1 ou 0)
router.patch('/utilizadores/:id/status', auth, role('admin'), async (req, res) => {
  try {
    const { ativo } = req.body;
    await pool.query(
      'UPDATE usuario SET ativo = ? WHERE id_usuario = ?',
      [ativo, req.params.id]
    );
    res.json({ mensagem: 'Estado do utilizador actualizado!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/admin/utilizadores/:id/advertencia ────────────
// Aplica uma advertência — incrementa o contador de advertencias
// Funciona para utilizadores, coletadores e empresas
// Regra 13 — 1ª ocorrência por peso errado
// Empresa — 1ª ocorrência por não pagamento
router.patch('/utilizadores/:id/advertencia', auth, role('admin'), async (req, res) => {
  try {
    const { tipo, motivo } = req.body;

    // Escolho a tabela e o campo ID correcto conforme o tipo
    const tabela   = tipo === 'coletor' ? 'Coletador'
                   : tipo === 'empresa' ? 'EmpresaRecicladora'
                   : 'Usuario';
    const campo_id = tipo === 'coletor' ? 'id_coletador'
                   : tipo === 'empresa' ? 'id_empresa'
                   : 'id_usuario';

    // Incremento o contador de advertências em 1
    await pool.query(
      `UPDATE ${tabela} SET advertencias = advertencias + 1 WHERE ${campo_id} = ?`,
      [req.params.id]
    );
    res.json({ mensagem: `Advertência aplicada. Motivo: ${motivo}` });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/admin/utilizadores/:id/suspender ──────────────
// Suspende a conta por 1 semana — Regra 13 (2ª ocorrência)
// Define suspenso_ate para a data de hoje + 7 dias
router.patch('/utilizadores/:id/suspender', auth, role('admin'), async (req, res) => {
  try {
    const { tipo, motivo } = req.body;

    const tabela   = tipo === 'coletor' ? 'Coletador'
                   : tipo === 'empresa' ? 'EmpresaRecicladora'
                   : 'Usuario';
    const campo_id = tipo === 'coletor' ? 'id_coletador'
                   : tipo === 'empresa' ? 'id_empresa'
                   : 'id_usuario';

    // Calculo a data daqui a 7 dias para definir o fim da suspensão
    const suspensaoAte = new Date();
    suspensaoAte.setDate(suspensaoAte.getDate() + 7);

    // Actualizo a data de suspensão e incremento as advertências
    await pool.query(
      `UPDATE ${tabela} SET suspenso_ate = ?, advertencias = advertencias + 1 WHERE ${campo_id} = ?`,
      [suspensaoAte, req.params.id]
    );
    res.json({ mensagem: `Conta suspensa por 1 semana. Motivo: ${motivo}` });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/admin/utilizadores/:id/bloquear ───────────────
// Bloqueia a conta permanentemente
// Regra 14 — coletador que desviou material
// Empresa — 3ª ocorrência de não pagamento
router.patch('/utilizadores/:id/bloquear', auth, role('admin'), async (req, res) => {
  try {
    const { tipo, motivo } = req.body;

    const tabela   = tipo === 'coletor' ? 'Coletador'
                   : tipo === 'empresa' ? 'EmpresaRecicladora'
                   : 'Usuario';
    const campo_id = tipo === 'coletor' ? 'id_coletador'
                   : tipo === 'empresa' ? 'id_empresa'
                   : 'id_usuario';

    // Marco como bloqueado e desactivo a conta ao mesmo tempo
    await pool.query(
      `UPDATE ${tabela} SET bloqueado_permanente = 1, ativo = 0 WHERE ${campo_id} = ?`,
      [req.params.id]
    );
    res.json({ mensagem: `Conta bloqueada permanentemente. Motivo: ${motivo}` });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/admin/utilizadores/:id/reativar ───────────────
// Reactiva uma conta suspensa ou bloqueada
// Limpa todos os campos de penalização e activa a conta
router.patch('/utilizadores/:id/reativar', auth, role('admin'), async (req, res) => {
  try {
    const { tipo } = req.body;

    const tabela   = tipo === 'coletor' ? 'Coletador'
                   : tipo === 'empresa' ? 'EmpresaRecicladora'
                   : 'Usuario';
    const campo_id = tipo === 'coletor' ? 'id_coletador'
                   : tipo === 'empresa' ? 'id_empresa'
                   : 'id_usuario';

    // Limpo a suspensão, o bloqueio e reactivo a conta
    await pool.query(
      `UPDATE ${tabela} SET ativo = 1, suspenso_ate = NULL, bloqueado_permanente = 0 WHERE ${campo_id} = ?`,
      [req.params.id]
    );
    res.json({ mensagem: 'Conta reactivada com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/entregas ───────────────────────────────────
// Devolvo todas as entregas da plataforma com detalhes completos
router.get('/entregas', auth, role('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.*,
        u.nome  AS nome_usuario,
        em.nome AS nome_empresa,
        r.nome  AS nome_residuo
      FROM entrega e
      LEFT JOIN usuario            u  ON e.id_usuario = u.id_usuario
      LEFT JOIN empresarecicladora em ON e.id_empresa = em.id_empresa
      LEFT JOIN residuo            r  ON e.id_residuo = r.id_residuo
      ORDER BY e.criado_em DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/auditoria ──────────────────────────────────
// Devolvo o registo de auditoria com o nome do utilizador associado
router.get('/auditoria', auth, role('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, u.nome AS nome_usuario
      FROM auditoria a
      LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
      ORDER BY a.data DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/estatisticas ───────────────────────────────
// Devolvo estatísticas básicas da plataforma (rota antiga mantida)
router.get('/estatisticas', auth, role('admin'), async (req, res) => {
  try {
    const [[{ total_usuarios }]]     = await pool.query('SELECT COUNT(*) as total_usuarios FROM usuario');
    const [[{ total_entregas }]]     = await pool.query('SELECT COUNT(*) as total_entregas FROM entrega');
    const [[{ entregas_pendentes }]] = await pool.query("SELECT COUNT(*) as entregas_pendentes FROM entrega WHERE status = 'pendente'");
    const [[{ total_empresas }]]     = await pool.query('SELECT COUNT(*) as total_empresas FROM empresarecicladora');

    res.json({ total_usuarios, total_entregas, entregas_pendentes, total_empresas });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/dashboard ──────────────────────────────────
// Rota principal do painel — usada pelo DashboardAdmin.jsx
// Devolvo todas as estatísticas numa só chamada para evitar
// múltiplos pedidos ao servidor quando a página abre
router.get('/dashboard', auth, role('admin'), async (req, res) => {
  try {
    // Conto utilizadores comuns (tipo != admin)
    const [[{ total_utilizadores }]] = await pool.query(
      "SELECT COUNT(*) as total_utilizadores FROM usuario WHERE tipo_usuario = 'comum'"
    );
    // Conto empresas registadas
    const [[{ total_empresas }]] = await pool.query(
      'SELECT COUNT(*) as total_empresas FROM empresarecicladora'
    );
    // Conto coletadores registados
    const [[{ total_coletadores }]] = await pool.query(
      'SELECT COUNT(*) as total_coletadores FROM coletador'
    );
    // Conto total de entregas
    const [[{ total_entregas }]] = await pool.query(
      'SELECT COUNT(*) as total_entregas FROM entrega'
    );
    // Conto entregas pendentes
    const [[{ pendentes }]] = await pool.query(
      "SELECT COUNT(*) as pendentes FROM entrega WHERE status = 'pendente'"
    );
    // Conto entregas concluídas
    const [[{ concluidas }]] = await pool.query(
      "SELECT COUNT(*) as concluidas FROM entrega WHERE status = 'coletada'"
    );
    // Conto entregas canceladas ou rejeitadas
    const [[{ canceladas }]] = await pool.query(
      "SELECT COUNT(*) as canceladas FROM entrega WHERE status IN ('cancelada','rejeitada')"
    );
    // Calculo os totais financeiros das entregas concluídas
    const [[fin]] = await pool.query(`
      SELECT
        COALESCE(SUM(valor_total), 0)        AS total_transaccionado,
        COALESCE(SUM(valor_total * 0.10), 0) AS total_comissoes,
        COALESCE(SUM(peso_total), 0)         AS total_kg
      FROM entrega
      WHERE status = 'coletada'
    `);
    // Vou buscar as últimas 10 entregas com todos os detalhes
    const [entregas_recentes] = await pool.query(`
      SELECT
        e.id_entrega, e.status,
        e.peso_total  AS peso,
        e.valor_total, e.criado_em,
        u.nome        AS utilizador,
        em.nome       AS empresa,
        r.nome        AS residuo
      FROM entrega e
      LEFT JOIN usuario            u  ON e.id_usuario = u.id_usuario
      LEFT JOIN empresarecicladora em ON e.id_empresa = em.id_empresa
      LEFT JOIN residuo            r  ON e.id_residuo = r.id_residuo
      ORDER BY e.criado_em DESC
      LIMIT 10
    `);

    // Devolvo tudo num único objecto organizado
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