
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';

const router = Router();

//  GET /api/admin/utilizadores 
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
      FROM Usuario
      WHERE tipo_usuario != 'admin'
      ORDER BY data_criacao DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/admin/utilizadores/:id/status 
// Activa ou desactiva um utilizador (ativo = 1 ou 0)
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

// ── PATCH /api/admin/utilizadores/:id/advertencia 
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

//  PATCH /api/admin/utilizadores/:id/suspender 
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

//  PATCH /api/admin/utilizadores/:id/bloquear 
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
      FROM Entrega e
      LEFT JOIN Usuario            u  ON e.id_usuario = u.id_usuario
      LEFT JOIN EmpresaRecicladora em ON e.id_empresa = em.id_empresa
      LEFT JOIN Residuo            r  ON e.id_residuo = r.id_residuo
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
      FROM Auditoria a
      LEFT JOIN Usuario u ON a.id_usuario = u.id_usuario
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
    const [[{ total_usuarios }]]     = await pool.query('SELECT COUNT(*) as total_usuarios FROM Usuario');
    const [[{ total_entregas }]]     = await pool.query('SELECT COUNT(*) as total_entregas FROM Entrega');
    const [[{ entregas_pendentes }]] = await pool.query("SELECT COUNT(*) as entregas_pendentes FROM Entrega WHERE status = 'pendente'");
    const [[{ total_empresas }]]     = await pool.query('SELECT COUNT(*) as total_empresas FROM EmpresaRecicladora');

    res.json({ total_usuarios, total_entregas, entregas_pendentes, total_empresas });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/dashboard 
// Rota principal do painel — usada pelo DashboardAdmin.jsx
// Devolvo todas as estatísticas numa só chamada para evitar
// múltiplos pedidos ao servidor quando a página abre
router.get('/dashboard', auth, role('admin'), async (req, res) => {
  try {
    // Conto utilizadores comuns (tipo != admin)
    const [[{ total_utilizadores }]] = await pool.query(
      "SELECT COUNT(*) as total_utilizadores FROM Usuario WHERE tipo_usuario = 'comum'"
    );
    // Conto empresas registadas
    const [[{ total_empresas }]] = await pool.query(
      'SELECT COUNT(*) as total_empresas FROM EmpresaRecicladora'
    );
    // Conto coletadores registados
    const [[{ total_coletadores }]] = await pool.query(
      'SELECT COUNT(*) as total_coletadores FROM Coletador'
    );
    // Conto total de entregas
    const [[{ total_entregas }]] = await pool.query(
      'SELECT COUNT(*) as total_entregas FROM Entrega'
    );
    // Conto entregas pendentes
    const [[{ pendentes }]] = await pool.query(
      "SELECT COUNT(*) as pendentes FROM Entrega WHERE status = 'pendente'"
    );
    // Conto entregas concluídas
    const [[{ concluidas }]] = await pool.query(
      "SELECT COUNT(*) as concluidas FROM Entrega WHERE status = 'coletada'"
    );
    // Conto entregas canceladas ou rejeitadas
    const [[{ canceladas }]] = await pool.query(
      "SELECT COUNT(*) as canceladas FROM Entrega WHERE status IN ('cancelada','rejeitada')"
    );
    // Calculo os totais financeiros das entregas concluídas
    const [[fin]] = await pool.query(`
      SELECT
        COALESCE(SUM(valor_total), 0)        AS total_transaccionado,
        COALESCE(SUM(valor_total * 0.10), 0) AS total_comissoes,
        COALESCE(SUM(peso_total), 0)         AS total_kg
      FROM Entrega
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
      FROM Entrega e
      LEFT JOIN Usuario            u  ON e.id_usuario = u.id_usuario
      LEFT JOIN EmpresaRecicladora em ON e.id_empresa = em.id_empresa
      LEFT JOIN Residuo            r  ON e.id_residuo = r.id_residuo
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

// ── GET /api/educacao — usada pelo admin para listar todos ───
// (Esta rota já deve existir no educacao.routes.js)
// Adicionar no admin.routes.js apenas as rotas de gestão:

// ── POST /api/admin/educacao ──────────────────────────────────
// Crio um novo conteúdo educativo
router.post('/educacao', auth, role('admin'), async (req, res) => {
  try {
    const { titulo, descricao, conteudo, categoria, publico_alvo, imagem } = req.body;

    // Valido os campos obrigatórios antes de inserir na base de dados
    if (!titulo || !conteudo) {
      return res.status(400).json({ erro: 'Título e conteúdo são obrigatórios.' });
    }

    // Insiro o novo conteúdo na tabela Educacao
    await pool.query(
      `INSERT INTO Educacao (titulo, descricao, conteudo, categoria, publico_alvo, imagem)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [titulo, descricao || null, conteudo, categoria || 'boas_praticas', publico_alvo || 'todos', imagem || null]
    );
    res.status(201).json({ mensagem: 'Conteúdo criado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PUT /api/admin/educacao/:id ───────────────────────────────
// Actualizo um conteúdo educativo existente pelo ID
router.put('/educacao/:id', auth, role('admin'), async (req, res) => {
  try {
    const { titulo, descricao, conteudo, categoria, publico_alvo, imagem } = req.body;

    if (!titulo || !conteudo) {
      return res.status(400).json({ erro: 'Título e conteúdo são obrigatórios.' });
    }

    // Actualizo todos os campos do conteúdo — atualizado_em é actualizado automaticamente pelo MySQL
    await pool.query(
      `UPDATE Educacao
       SET titulo = ?, descricao = ?, conteudo = ?, categoria = ?, publico_alvo = ?, imagem = ?
       WHERE id_educacao = ? AND eliminado = 0`,
      [titulo, descricao || null, conteudo, categoria, publico_alvo, imagem || null, req.params.id]
    );
    res.json({ mensagem: 'Conteúdo actualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── DELETE /api/admin/educacao/:id ────────────────────────────
// Faço soft delete — marco como eliminado sem apagar da base de dados
// Assim o conteúdo desaparece para os utilizadores mas fica no histórico
router.delete('/educacao/:id', auth, role('admin'), async (req, res) => {
  try {
    await pool.query(
      'UPDATE Educacao SET eliminado = 1 WHERE id_educacao = ?',
      [req.params.id]
    );
    res.json({ mensagem: 'Conteúdo removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/admin/relatorios ─────────────────────────────────
// Devolvo os dados financeiros filtrados pelo período escolhido
// Parâmetro de query: ?periodo=hoje|semana|mes|total
// Regra 15 — cada transacção contém todos os campos obrigatórios
router.get('/relatorios', auth, role('admin'), async (req, res) => {
  try {
    // Vou buscar o período da query string — por defeito uso 'mes'
    const { periodo = 'mes' } = req.query;

    // Calculo a data de início conforme o período pedido
    let dataInicio = null;
    const agora = new Date();

    if (periodo === 'hoje') {
      // Hoje: começa à meia-noite de hoje
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    } else if (periodo === 'semana') {
      // Esta semana: começa há 7 dias
      dataInicio = new Date(agora);
      dataInicio.setDate(dataInicio.getDate() - 7);
    } else if (periodo === 'mes') {
      // Este mês: começa no dia 1 do mês actual
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    }
    // 'total' → dataInicio fica null — não filtro por data

    // Construo a condição WHERE conforme o período
    // Se dataInicio for null, não adiciono filtro de data
    const condicaoData = dataInicio
      ? `AND e.criado_em >= '${dataInicio.toISOString().slice(0, 19).replace('T', ' ')}'`
      : '';

    // ── Resumo financeiro do período ──
    const [[resumo]] = await pool.query(`
      SELECT
        COUNT(*)                             AS total_entregas,
        COALESCE(SUM(valor_total), 0)        AS total_transaccionado,
        COALESCE(SUM(valor_total * 0.10), 0) AS total_comissoes,
        COALESCE(SUM(peso_total), 0)         AS total_kg
      FROM Entrega e
      WHERE e.status = 'coletada'
      ${condicaoData}
    `);

    // ── Volume por empresa no período ──
    const [por_empresa] = await pool.query(`
      SELECT
        em.nome                              AS empresa,
        COUNT(*)                             AS total_entregas,
        COALESCE(SUM(e.peso_total), 0)       AS total_kg,
        COALESCE(SUM(e.valor_total), 0)      AS total_valor,
        COALESCE(SUM(e.valor_total * 0.10), 0) AS comissao
      FROM Entrega e
      LEFT JOIN EmpresaRecicladora em ON e.id_empresa = em.id_empresa
      WHERE e.status = 'coletada'
      ${condicaoData}
      GROUP BY e.id_empresa, em.nome
      ORDER BY comissao DESC
      LIMIT 10
    `);

    // ── Detalhe de cada transacção — campos exigidos pela Regra 15 ──
    const [transacoes] = await pool.query(`
      SELECT
        e.id_entrega,
        e.criado_em,
        e.peso_total                  AS peso,
        e.valor_total,
        e.valor_total * 0.10          AS comissao,
        u.nome                        AS utilizador,
        c.nome                        AS coletador,
        em.nome                       AS empresa,
        r.nome                        AS residuo
      FROM Entrega e
      LEFT JOIN Usuario            u  ON e.id_usuario   = u.id_usuario
      LEFT JOIN Coletador          c  ON e.id_coletador = c.id_coletador
      LEFT JOIN EmpresaRecicladora em ON e.id_empresa   = em.id_empresa
      LEFT JOIN Residuo            r  ON e.id_residuo   = r.id_residuo
      WHERE e.status = 'coletada'
      ${condicaoData}
      ORDER BY e.criado_em DESC
    `);

    // Devolvo tudo num único objecto organizado
    res.json({ resumo, por_empresa, transacoes });

  } catch (err) {
    console.error('Erro relatorios admin:', err);
    res.status(500).json({ erro: err.message });
  }
});

export default router;