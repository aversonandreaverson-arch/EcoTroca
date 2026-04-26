
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
      ORDER BY e.data_hora DESC
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
    // Total de todos os utilizadores (excluindo admin)
    const [[{ total_utilizadores }]] = await pool.query(
      "SELECT COUNT(*) as total_utilizadores FROM usuario WHERE tipo_usuario != 'admin'"
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
        e.valor_total, e.data_hora AS criado_em,
        u.nome        AS utilizador,
        em.nome       AS empresa,
        GROUP_CONCAT(r.tipo SEPARATOR ', ') AS residuo
      FROM entrega e
      LEFT JOIN usuario            u  ON e.id_usuario = u.id_usuario
      LEFT JOIN empresarecicladora em ON e.id_empresa = em.id_empresa
      LEFT JOIN entrega_residuo   er ON er.id_entrega = e.id_entrega
      LEFT JOIN residuo            r  ON r.id_residuo = er.id_residuo
      GROUP BY e.id_entrega
      ORDER BY e.data_hora DESC
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


// ── GET /api/admin/graficos ──────────────────────────────────
// Dados para os 3 gráficos do dashboard admin
router.get('/graficos', auth, role('admin'), async (req, res) => {
  try {
    // 1. Entregas por semana (últimas 8 semanas)
    const [entregasSemana] = await pool.query(`
      SELECT
        DATE_FORMAT(data_hora, '%Y-%u') AS semana,
        DATE_FORMAT(MIN(data_hora), '%d/%m') AS label,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'coletada' THEN 1 ELSE 0 END) AS concluidas,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) AS canceladas
      FROM entrega
      WHERE data_hora >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
      GROUP BY DATE_FORMAT(data_hora, '%Y-%u')
      ORDER BY semana ASC
    `);

    // 2. Receita por semana (últimas 8 semanas)
    const [receitaSemana] = await pool.query(`
      SELECT
        DATE_FORMAT(data_hora, '%Y-%u') AS semana,
        DATE_FORMAT(MIN(data_hora), '%d/%m') AS label,
        COALESCE(SUM(valor_total), 0) AS total_transaccionado,
        COALESCE(SUM(valor_total * 0.10) + COUNT(*) * 50, 0) AS comissoes
      FROM entrega
      WHERE status = 'coletada'
        AND data_hora >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
      GROUP BY DATE_FORMAT(data_hora, '%Y-%u')
      ORDER BY semana ASC
    `);

    // 3. Tipos de resíduos mais reciclados
    const [tiposResiduos] = await pool.query(`
      SELECT
        r.tipo AS name,
        COUNT(*) AS value,
        COALESCE(SUM(er.peso_kg), 0) AS total_kg
      FROM entrega_residuo er
      INNER JOIN residuo r ON r.id_residuo = er.id_residuo
      INNER JOIN entrega e ON e.id_entrega = er.id_entrega
      WHERE e.status = 'coletada'
      GROUP BY r.tipo
      ORDER BY value DESC
    `);

    res.json({ entregasSemana, receitaSemana, tiposResiduos });
  } catch (err) {
    console.error('Erro graficos admin:', err);
    res.status(500).json({ erro: err.message });
  }
});


// ── GET /api/admin/graficos ───────────────────────────────────
// Dados para os 3 gráficos do dashboard admin
router.get('/graficos', auth, role('admin'), async (req, res) => {
  try {
    // 1. Entregas por semana (últimas 8 semanas)
    const [entregas_semana] = await pool.query(`
      SELECT
        DATE_FORMAT(data_hora, '%d/%m') AS dia,
        COUNT(*)                         AS total
      FROM entrega
      WHERE data_hora >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
      GROUP BY DATE(data_hora)
      ORDER BY DATE(data_hora) ASC
      LIMIT 56
    `);

    // 2. Receita por semana (últimas 8 semanas)
    const [receita_semana] = await pool.query(`
      SELECT
        DATE_FORMAT(data_hora, '%d/%m')      AS dia,
        COALESCE(SUM(valor_total), 0)        AS receita,
        COALESCE(SUM(valor_total * 0.10), 0) AS comissoes
      FROM entrega
      WHERE status = 'coletada'
        AND data_hora >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
      GROUP BY DATE(data_hora)
      ORDER BY DATE(data_hora) ASC
      LIMIT 56
    `);

    // 3. Tipos de resíduos mais entregues
    const [tipos_residuos] = await pool.query(`
      SELECT
        r.tipo                AS nome,
        COUNT(er.id_residuo)  AS valor
      FROM entrega_residuo er
      JOIN residuo r ON r.id_residuo = er.id_residuo
      GROUP BY r.id_residuo, r.tipo
      ORDER BY valor DESC
      LIMIT 6
    `);

    res.json({ entregas_semana, receita_semana, tipos_residuos, crescimento, top_empresas, top_coletadores });
  } catch (err) {
    console.error('Erro graficos admin:', err.message);
    res.status(500).json({ erro: err.message });
  }
});


// ── GET /api/admin/graficos ───────────────────────────────────
// Dados para os 3 gráficos do dashboard admin
router.get('/graficos', auth, role('admin'), async (req, res) => {
  try {
    // 1. Entregas por semana (últimas 8 semanas)
    const [entregasSemana] = await pool.query(`
      SELECT
        DATE_FORMAT(data_hora, '%d/%m') AS dia,
        COUNT(*) AS total
      FROM entrega
      WHERE data_hora >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
      GROUP BY DATE(data_hora)
      ORDER BY DATE(data_hora) ASC
      LIMIT 56
    `);

    // 2. Receita por semana (últimas 8 semanas)
    const [receitaSemana] = await pool.query(`
      SELECT
        DATE_FORMAT(data_hora, '%d/%m') AS dia,
        COALESCE(SUM(valor_total), 0)         AS receita,
        COALESCE(SUM(valor_total * 0.10), 0)  AS comissao
      FROM entrega
      WHERE status = 'coletada'
        AND data_hora >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
      GROUP BY DATE(data_hora)
      ORDER BY DATE(data_hora) ASC
      LIMIT 56
    `);

    // 3. Tipos de resíduos mais entregues
    const [tiposResiduos] = await pool.query(`
      SELECT
        r.tipo AS nome,
        COUNT(er.id_entrega_residuo) AS valor
      FROM entrega_residuo er
      JOIN residuo r ON r.id_residuo = er.id_residuo
      JOIN entrega e ON e.id_entrega = er.id_entrega
      WHERE e.status = 'coletada'
      GROUP BY r.tipo
      ORDER BY valor DESC
      LIMIT 6
    `);

    res.json({ entregasSemana, receitaSemana, tiposResiduos });
  } catch (err) {
    console.error('Erro graficos admin:', err);
    res.status(500).json({ erro: err.message });
  }
});


// ── GET /api/admin/graficos ───────────────────────────────────
// Dados para os 3 gráficos do dashboard
router.get('/graficos', auth, role('admin'), async (req, res) => {
  try {
    // 1. Entregas por semana — todas as entregas agrupadas por semana
    const [entregas_semana] = await pool.query(`
      SELECT
        DATE_FORMAT(data_hora, '%d/%m/%Y') AS dia,
        YEARWEEK(data_hora, 1)             AS semana,
        COUNT(*)                           AS total
      FROM entrega
      WHERE data_hora IS NOT NULL
      GROUP BY YEARWEEK(data_hora, 1)
      ORDER BY YEARWEEK(data_hora, 1) ASC
      LIMIT 20
    `);

    // 2. Receita por semana — todas as entregas concluídas
    const [receita_semana] = await pool.query(`
      SELECT
        DATE_FORMAT(data_hora, '%d/%m/%Y')    AS dia,
        YEARWEEK(data_hora, 1)                AS semana,
        COALESCE(SUM(valor_total), 0)         AS receita,
        COALESCE(SUM(valor_total * 0.10), 0)  AS comissao
      FROM entrega
      WHERE status = 'coletada'
        AND data_hora IS NOT NULL
      GROUP BY YEARWEEK(data_hora, 1)
      ORDER BY YEARWEEK(data_hora, 1) ASC
      LIMIT 20
    `);

    // 3. Crescimento da plataforma — novos registos por semana
    const [crescimento] = await pool.query(`
      SELECT
        DATE_FORMAT(data_criacao, '%d/%m/%Y') AS dia,
        YEARWEEK(data_criacao, 1)             AS semana,
        SUM(tipo_usuario = 'comum')           AS utilizadores,
        SUM(tipo_usuario = 'empresa')         AS empresas,
        SUM(tipo_usuario = 'coletor')         AS coletadores
      FROM usuario
      WHERE data_criacao IS NOT NULL
        AND tipo_usuario != 'admin'
      GROUP BY YEARWEEK(data_criacao, 1)
      ORDER BY YEARWEEK(data_criacao, 1) ASC
      LIMIT 20
    `);

    // 4. Top empresas por volume de kg recolhidos
    const [top_empresas] = await pool.query(`
      SELECT
        er.nome                        AS nome,
        COALESCE(SUM(e.peso_total), 0) AS total_kg,
        COUNT(e.id_entrega)            AS total_entregas
      FROM empresarecicladora er
      LEFT JOIN entrega e ON e.id_empresa = er.id_empresa AND e.status = 'coletada'
      GROUP BY er.id_empresa
      ORDER BY total_kg DESC
      LIMIT 5
    `);

    // 5. Top coletadores por recolhas
    const [top_coletadores] = await pool.query(`
      SELECT
        u.nome                         AS nome,
        COUNT(e.id_entrega)            AS total_entregas,
        COALESCE(SUM(e.peso_total), 0) AS total_kg
      FROM coletador c
      INNER JOIN usuario u ON u.id_usuario = c.id_usuario
      LEFT JOIN entrega e ON e.id_coletador = c.id_coletador AND e.status = 'coletada'
      GROUP BY c.id_coletador
      ORDER BY total_entregas DESC
      LIMIT 5
    `);

    // 6. Tipos de resíduos (todos os tempos)
    const [tipos_residuos] = await pool.query(`
      SELECT
        r.tipo  AS nome,
        COUNT(*) AS valor
      FROM entrega_residuo er
      JOIN residuo r ON r.id_residuo = er.id_residuo
      GROUP BY r.tipo
      ORDER BY valor DESC
      LIMIT 8
    `);

    res.json({ entregas_semana, receita_semana, tipos_residuos, crescimento, top_empresas, top_coletadores });
  } catch (err) {
    console.error('Erro graficos admin:', err);
    res.status(500).json({ erro: err.message });
  }
});

export default router;