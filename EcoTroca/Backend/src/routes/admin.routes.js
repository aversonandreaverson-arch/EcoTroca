import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';
import nodemailer from 'nodemailer';

// ── Configuração do nodemailer (mesmo que o auth.service.js) ──
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Envia email de notificação admin ao utilizador ────────────
const enviarEmailAdmin = async (email, nome, titulo, mensagem, corTitulo = '#15803d') => {
  if (!email) return; // sem email, não envia
  try {
    await transporter.sendMail({
      from:    `"EcoTroca Angola" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: `${titulo} — EcoTroca Angola`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden;">
          <div style="background:#15803d;padding:24px;">
            <h2 style="color:white;margin:0;">EcoTroca Angola</h2>
          </div>
          <div style="padding:24px;">
            <h3 style="color:${corTitulo};margin-top:0;">${titulo}</h3>
            <p>Olá, <strong>${nome}</strong>!</p>
            <div style="background:#f9f9f9;border-left:4px solid ${corTitulo};padding:16px;border-radius:8px;margin:16px 0;">
              <p style="margin:0;">${mensagem}</p>
            </div>
            <p style="color:#666;font-size:13px;">
              Se tens dúvidas, contacta o suporte da EcoTroca Angola.
            </p>
          </div>
          <div style="background:#f5f5f5;padding:16px;text-align:center;">
            <p style="color:#aaa;font-size:11px;margin:0;">EcoTroca Angola — Conectando pessoas pela sustentabilidade</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Erro ao enviar email admin:', err.message);
    // Erro no email não bloqueia a resposta
  }
};

const router = Router();

// ── GET /api/admin/utilizadores ──────────────────────────────
router.get('/utilizadores', auth, role('admin'), async (req, res) => {
  try {
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
router.patch('/utilizadores/:id/status', auth, role('admin'), async (req, res) => {
  try {
    const { ativo } = req.body;
    await pool.query('UPDATE usuario SET ativo = ? WHERE id_usuario = ?', [ativo, req.params.id]);
    res.json({ mensagem: 'Estado actualizado!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── Helper: busca id_usuario — recebe sempre id_usuario ──────
// O frontend envia sempre id_usuario independentemente do tipo
const getIdUsuario = async (id, tipo) => {
  // Verifica se o id_usuario existe na tabela usuario
  const [[row]] = await pool.query('SELECT id_usuario FROM usuario WHERE id_usuario = ?', [id]);
  return row?.id_usuario || null;
};

// ── Helper: busca id na tabela do tipo a partir do id_usuario ─
const getIdTabela = async (id_usuario, tipo) => {
  if (tipo === 'coletor') {
    const [[row]] = await pool.query('SELECT id_coletador FROM coletador WHERE id_usuario = ?', [id_usuario]);
    return row?.id_coletador || null;
  }
  if (tipo === 'empresa') {
    const [[row]] = await pool.query('SELECT id_empresa FROM empresarecicladora WHERE id_usuario = ?', [id_usuario]);
    return row?.id_empresa || null;
  }
  return id_usuario; // comum — id_usuario é o campo directo
};

// ── PATCH /api/admin/utilizadores/:id/advertencia ────────────
router.patch('/utilizadores/:id/advertencia', auth, role('admin'), async (req, res) => {
  try {
    const { tipo, motivo } = req.body;
    // req.params.id é sempre id_usuario
    const id_usuario = parseInt(req.params.id);
    const id_tabela = await getIdTabela(id_usuario, tipo);

    if (id_tabela) {
      const tabela   = tipo === 'coletor' ? 'coletador' : tipo === 'empresa' ? 'empresarecicladora' : 'usuario';
      const campo_id = tipo === 'coletor' ? 'id_coletador' : tipo === 'empresa' ? 'id_empresa' : 'id_usuario';
      await pool.query(`UPDATE ${tabela} SET advertencias = advertencias + 1 WHERE ${campo_id} = ?`, [id_tabela]);
    }

    await pool.query(
      `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
       VALUES (?, '⚠️ Advertência da EcoTroca', ?, 'sistema')`,
      [id_usuario, `Recebeste uma advertência oficial da plataforma EcoTroca Angola. Motivo: ${motivo}. Por favor cumpre as regras da plataforma para evitar sanções mais graves.`]
    );

    const [userAdv] = await pool.query('SELECT nome, email FROM usuario WHERE id_usuario = ?', [id_usuario]);
    if (userAdv.length) {
      await enviarEmailAdmin(
        userAdv[0].email, userAdv[0].nome,
        '⚠️ Advertência Oficial',
        `Recebeste uma advertência oficial da plataforma EcoTroca Angola.<br><br><strong>Motivo:</strong> ${motivo}<br><br>Por favor cumpre as regras da plataforma para evitar sanções mais graves como suspensão ou bloqueio da conta.`,
        '#ca8a04'
      );
    }

    res.json({ mensagem: `Advertência aplicada. Motivo: ${motivo}` });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/admin/utilizadores/:id/suspender ──────────────
router.patch('/utilizadores/:id/suspender', auth, role('admin'), async (req, res) => {
  try {
    const { tipo, motivo } = req.body;
    const id_usuario = parseInt(req.params.id);
    const id_tabela  = await getIdTabela(id_usuario, tipo);

    const suspensaoAte = new Date();
    suspensaoAte.setDate(suspensaoAte.getDate() + 7);

    // Suspende na tabela específica do tipo
    if (id_tabela && tipo !== 'comum') {
      const tabela   = tipo === 'coletor' ? 'coletador' : 'empresarecicladora';
      const campo_id = tipo === 'coletor' ? 'id_coletador' : 'id_empresa';
      await pool.query(`UPDATE ${tabela} SET suspenso_ate = ?, advertencias = advertencias + 1 WHERE ${campo_id} = ?`, [suspensaoAte, id_tabela]);
    }

    // Suspende sempre na tabela usuario — bloqueia o login
    await pool.query('UPDATE usuario SET suspenso_ate = ? WHERE id_usuario = ?', [suspensaoAte, id_usuario]);

    const dataFim = suspensaoAte.toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' });
    await pool.query(
      `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
       VALUES (?, '🚫 Conta Suspensa', ?, 'sistema')`,
      [id_usuario, `A tua conta foi suspensa por 7 dias até ${dataFim}. Motivo: ${motivo}. Durante este período não podes aceder à plataforma.`]
    );

    const [userSusp] = await pool.query('SELECT nome, email FROM usuario WHERE id_usuario = ?', [id_usuario]);
    if (userSusp.length) {
      await enviarEmailAdmin(
        userSusp[0].email, userSusp[0].nome,
        '🚫 Conta Suspensa',
        `A tua conta EcoTroca Angola foi suspensa temporariamente por 7 dias.<br><br><strong>Motivo:</strong> ${motivo}<br><strong>Suspensa até:</strong> ${dataFim}<br><br>Durante este período não consegues aceder à plataforma. Após o prazo, a conta será reactivada automaticamente.`,
        '#dc2626'
      );
    }

    res.json({ mensagem: `Conta suspensa por 1 semana. Motivo: ${motivo}` });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/admin/utilizadores/:id/bloquear ───────────────
router.patch('/utilizadores/:id/bloquear', auth, role('admin'), async (req, res) => {
  try {
    const { tipo, motivo } = req.body;
    const id_usuario = parseInt(req.params.id);
    const id_tabela  = await getIdTabela(id_usuario, tipo);

    // Bloqueia na tabela específica do tipo
    if (id_tabela && tipo !== 'comum') {
      const tabela   = tipo === 'coletor' ? 'coletador' : 'empresarecicladora';
      const campo_id = tipo === 'coletor' ? 'id_coletador' : 'id_empresa';
      await pool.query(`UPDATE ${tabela} SET bloqueado_permanente = 1, ativo = 0 WHERE ${campo_id} = ?`, [id_tabela]);
    }

    // Bloqueia sempre na tabela usuario — impede o login
    await pool.query('UPDATE usuario SET ativo = 0, bloqueado_permanente = 1 WHERE id_usuario = ?', [id_usuario]);

    await pool.query(
      `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
       VALUES (?, '❌ Conta Bloqueada', ?, 'sistema')`,
      [id_usuario, `A tua conta foi bloqueada permanentemente pela administração da EcoTroca Angola. Motivo: ${motivo}. Se acreditas que isto foi um erro, contacta o suporte.`]
    );

    const [userBloq] = await pool.query('SELECT nome, email FROM usuario WHERE id_usuario = ?', [id_usuario]);
    if (userBloq.length) {
      await enviarEmailAdmin(
        userBloq[0].email, userBloq[0].nome,
        '❌ Conta Bloqueada Permanentemente',
        `A tua conta EcoTroca Angola foi bloqueada permanentemente pela administração da plataforma.<br><br><strong>Motivo:</strong> ${motivo}<br><br>Se acreditas que isto foi um erro, contacta o suporte através do email <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>.`,
        '#991b1b'
      );
    }

    res.json({ mensagem: `Conta bloqueada permanentemente. Motivo: ${motivo}` });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/admin/utilizadores/:id/reativar ───────────────
router.patch('/utilizadores/:id/reativar', auth, role('admin'), async (req, res) => {
  try {
    const { tipo } = req.body;
    const tabela   = tipo === 'coletor' ? 'coletador' : tipo === 'empresa' ? 'empresarecicladora' : 'usuario';
    const campo_id = tipo === 'coletor' ? 'id_coletador' : tipo === 'empresa' ? 'id_empresa' : 'id_usuario';
    const id_usuario_reat = parseInt(req.params.id);
    const id_tabela_reat  = await getIdTabela(id_usuario_reat, req.body.tipo);

    if (id_tabela_reat && req.body.tipo !== 'comum') {
      const tabela   = req.body.tipo === 'coletor' ? 'coletador' : 'empresarecicladora';
      const campo_id = req.body.tipo === 'coletor' ? 'id_coletador' : 'id_empresa';
      await pool.query(`UPDATE ${tabela} SET ativo = 1, suspenso_ate = NULL, bloqueado_permanente = 0 WHERE ${campo_id} = ?`, [id_tabela_reat]);
    }

    await pool.query(
      'UPDATE usuario SET ativo = 1, suspenso_ate = NULL, bloqueado_permanente = 0 WHERE id_usuario = ?',
      [id_usuario_reat]
    );

    res.json({ mensagem: 'Conta reactivada com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/entregas ───────────────────────────────────
router.get('/entregas', auth, role('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.*,
        u.nome  AS nome_usuario,
        em.nome AS nome_empresa
      FROM entrega e
      LEFT JOIN usuario            u  ON e.id_usuario = u.id_usuario
      LEFT JOIN empresarecicladora em ON e.id_empresa = em.id_empresa
      ORDER BY e.data_hora DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/auditoria ──────────────────────────────────
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

// ── GET /api/admin/dashboard ──────────────────────────────────
router.get('/dashboard', auth, role('admin'), async (req, res) => {
  try {
    const [[{ total_utilizadores }]] = await pool.query(
      "SELECT COUNT(*) as total_utilizadores FROM usuario WHERE tipo_usuario != 'admin'"
    );
    const [[{ total_utilizadores_comuns }]] = await pool.query(
      "SELECT COUNT(*) as total_utilizadores_comuns FROM usuario WHERE tipo_usuario = 'comum'"
    );
    const [[{ total_empresas }]]    = await pool.query('SELECT COUNT(*) as total_empresas FROM empresarecicladora');
    const [[{ total_coletadores }]] = await pool.query('SELECT COUNT(*) as total_coletadores FROM coletador');
    const [[{ total_entregas }]]    = await pool.query('SELECT COUNT(*) as total_entregas FROM entrega');
    const [[{ pendentes }]]         = await pool.query("SELECT COUNT(*) as pendentes FROM entrega WHERE status = 'pendente'");
    const [[{ concluidas }]]        = await pool.query("SELECT COUNT(*) as concluidas FROM entrega WHERE status = 'coletada'");
    const [[{ canceladas }]]        = await pool.query("SELECT COUNT(*) as canceladas FROM entrega WHERE status IN ('cancelada','rejeitada')");

    const [[fin]] = await pool.query(`
      SELECT
        COALESCE(SUM(valor_total), 0)        AS total_transaccionado,
        COALESCE(SUM(valor_total * 0.10), 0) AS total_comissoes,
        COALESCE(SUM(valor_utilizador), 0)   AS total_utilizadores,
        COALESCE(SUM(valor_coletador), 0)    AS total_coletadores,
        COALESCE(SUM(peso_total), 0)         AS total_kg
      FROM entrega WHERE status = 'coletada'
    `);

    const [entregas_recentes] = await pool.query(`
      SELECT
        e.id_entrega, e.status,
        e.peso_total AS peso,
        e.valor_total, e.data_hora AS criado_em,
        u.nome  AS utilizador,
        em.nome AS empresa,
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

    res.json({
      utilizadores: { total: total_utilizadores, comuns: total_utilizadores_comuns },
      empresas:     { total: total_empresas },
      coletadores:  { total: total_coletadores },
      entregas:     { total: total_entregas, pendentes, concluidas, canceladas },
      financeiro: {
        total_transaccionado: fin.total_transaccionado,
        total_comissoes:      fin.total_comissoes,
        total_utilizadores:   fin.total_utilizadores,
        total_coletadores:    fin.total_coletadores,
        total_kg:             fin.total_kg,
      },
      entregas_recentes,
    });
  } catch (err) {
    console.error('Erro dashboard admin:', err);
    res.status(500).json({ erro: 'Erro ao carregar estatisticas.' });
  }
});

// ── GET /api/admin/graficos ───────────────────────────────────
router.get('/graficos', auth, role('admin'), async (req, res) => {
  try {
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

    const [receita_semana] = await pool.query(`
      SELECT
        DATE_FORMAT(data_hora, '%d/%m/%Y')   AS dia,
        YEARWEEK(data_hora, 1)               AS semana,
        COALESCE(SUM(valor_total), 0)        AS receita,
        COALESCE(SUM(valor_total * 0.10), 0) AS comissao
      FROM entrega
      WHERE status = 'coletada' AND data_hora IS NOT NULL
      GROUP BY YEARWEEK(data_hora, 1)
      ORDER BY YEARWEEK(data_hora, 1) ASC
      LIMIT 20
    `);

    const [crescimento] = await pool.query(`
      SELECT
        DATE_FORMAT(data_criacao, '%d/%m/%Y') AS dia,
        YEARWEEK(data_criacao, 1)             AS semana,
        SUM(tipo_usuario = 'comum')           AS utilizadores,
        SUM(tipo_usuario = 'empresa')         AS empresas,
        SUM(tipo_usuario = 'coletor')         AS coletadores
      FROM usuario
      WHERE data_criacao IS NOT NULL AND tipo_usuario != 'admin'
      GROUP BY YEARWEEK(data_criacao, 1)
      ORDER BY YEARWEEK(data_criacao, 1) ASC
      LIMIT 20
    `);

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

    const [tipos_residuos] = await pool.query(`
      SELECT r.tipo AS nome, COUNT(*) AS valor
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

// ── GET /api/admin/hoje ───────────────────────────────────────
router.get('/hoje', auth, role('admin'), async (req, res) => {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const [[{ entregas_hoje }]] = await pool.query("SELECT COUNT(*) AS entregas_hoje FROM entrega WHERE DATE(data_hora) = ?", [hoje]);
    const [[{ usuarios_hoje }]] = await pool.query("SELECT COUNT(*) AS usuarios_hoje FROM usuario WHERE DATE(data_criacao) = ? AND tipo_usuario != 'admin'", [hoje]);
    const [[{ receita_hoje }]]  = await pool.query("SELECT COALESCE(SUM(valor_total), 0) AS receita_hoje FROM entrega WHERE DATE(data_hora) = ? AND status = 'coletada'", [hoje]);
    const [[{ pendentes }]]     = await pool.query("SELECT COUNT(*) AS pendentes FROM entrega WHERE status = 'pendente'");
    const [[{ total_usuarios }]] = await pool.query("SELECT COUNT(*) AS total_usuarios FROM usuario WHERE tipo_usuario != 'admin'");
    res.json({ entregas_hoje, usuarios_hoje, receita_hoje, pendentes, total_usuarios });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/admin/educacao ──────────────────────────────────
router.post('/educacao', auth, role('admin'), async (req, res) => {
  try {
    const { titulo, descricao, conteudo, categoria, publico_alvo, imagem } = req.body;
    if (!titulo || !conteudo) return res.status(400).json({ erro: 'Título e conteúdo são obrigatórios.' });
    await pool.query(
      `INSERT INTO educacao (titulo, descricao, conteudo, categoria, publico_alvo, imagem) VALUES (?, ?, ?, ?, ?, ?)`,
      [titulo, descricao || null, conteudo, categoria || 'boas_praticas', publico_alvo || 'todos', imagem || null]
    );
    res.status(201).json({ mensagem: 'Conteúdo criado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PUT /api/admin/educacao/:id ───────────────────────────────
router.put('/educacao/:id', auth, role('admin'), async (req, res) => {
  try {
    const { titulo, descricao, conteudo, categoria, publico_alvo, imagem } = req.body;
    if (!titulo || !conteudo) return res.status(400).json({ erro: 'Título e conteúdo são obrigatórios.' });
    await pool.query(
      `UPDATE educacao SET titulo = ?, descricao = ?, conteudo = ?, categoria = ?, publico_alvo = ?, imagem = ? WHERE id_educacao = ?`,
      [titulo, descricao || null, conteudo, categoria, publico_alvo, imagem || null, req.params.id]
    );
    res.json({ mensagem: 'Conteúdo actualizado.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── DELETE /api/admin/educacao/:id ───────────────────────────
router.delete('/educacao/:id', auth, role('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE educacao SET eliminado = 1 WHERE id_educacao = ?', [req.params.id]);
    res.json({ mensagem: 'Conteúdo removido.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/relatorios ─────────────────────────────────
router.get('/relatorios', auth, role('admin'), async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;

    let condicaoData = '';
    const agora = new Date();

    if (periodo === 'hoje') {
      const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      condicaoData = `AND e.data_hora >= '${d.toISOString().slice(0, 19).replace('T', ' ')}'`;
    } else if (periodo === 'semana') {
      const d = new Date(agora);
      d.setDate(d.getDate() - 7);
      condicaoData = `AND e.data_hora >= '${d.toISOString().slice(0, 19).replace('T', ' ')}'`;
    } else if (periodo === 'mes') {
      const d = new Date(agora.getFullYear(), agora.getMonth(), 1);
      condicaoData = `AND e.data_hora >= '${d.toISOString().slice(0, 19).replace('T', ' ')}'`;
    }

    // Resumo financeiro
    const [[resumo]] = await pool.query(`
      SELECT
        COUNT(*)                              AS total_entregas,
        COALESCE(SUM(valor_total), 0)         AS total_transaccionado,
        COALESCE(SUM(valor_total * 0.10), 0)  AS total_comissoes,
        COALESCE(SUM(valor_utilizador), 0)    AS total_utilizadores,
        COALESCE(SUM(valor_coletador), 0)     AS total_coletadores,
        COALESCE(SUM(peso_total), 0)          AS total_kg
      FROM entrega e
      WHERE e.status = 'coletada'
      ${condicaoData}
    `);

    // Volume por empresa
    const [por_empresa] = await pool.query(`
      SELECT
        em.nome                               AS empresa,
        COUNT(*)                              AS total_entregas,
        COALESCE(SUM(e.peso_total), 0)        AS total_kg,
        COALESCE(SUM(e.valor_total), 0)       AS total_valor,
        COALESCE(SUM(e.valor_total * 0.10), 0) AS comissao
      FROM entrega e
      LEFT JOIN empresarecicladora em ON e.id_empresa = em.id_empresa
      WHERE e.status = 'coletada'
      ${condicaoData}
      GROUP BY e.id_empresa, em.nome
      ORDER BY comissao DESC
      LIMIT 10
    `);

    // Detalhe de cada transacção
    const [transacoes] = await pool.query(`
      SELECT
        e.id_entrega,
        e.data_hora          AS criado_em,
        e.peso_total         AS peso,
        e.valor_total,
        e.valor_utilizador,
        e.valor_coletador,
        e.valor_total * 0.10 AS comissao,
        u.nome               AS utilizador,
        c.nome               AS coletador,
        em.nome              AS empresa,
        GROUP_CONCAT(r.tipo SEPARATOR ', ') AS residuo
      FROM entrega e
      LEFT JOIN usuario            u  ON e.id_usuario   = u.id_usuario
      LEFT JOIN coletador          col ON e.id_coletador = col.id_coletador
      LEFT JOIN usuario            c  ON col.id_usuario  = c.id_usuario
      LEFT JOIN empresarecicladora em ON e.id_empresa   = em.id_empresa
      LEFT JOIN entrega_residuo   er  ON er.id_entrega  = e.id_entrega
      LEFT JOIN residuo            r  ON r.id_residuo   = er.id_residuo
      WHERE e.status = 'coletada'
      ${condicaoData}
      GROUP BY e.id_entrega
      ORDER BY e.data_hora DESC
    `);

    res.json({ resumo, por_empresa, transacoes });
  } catch (err) {
    console.error('Erro relatorios admin:', err);
    res.status(500).json({ erro: err.message });
  }
});

export default router;