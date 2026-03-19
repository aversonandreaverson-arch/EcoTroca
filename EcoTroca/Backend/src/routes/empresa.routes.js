
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── Função auxiliar: busca o id_empresa do utilizador autenticado ──
const getIdEmpresa = async (id_usuario) => {
  const [rows] = await pool.query(
    'SELECT id_empresa, limiar_recolha FROM empresarecicladora WHERE id_usuario = ?',
    [id_usuario]
  );
  if (rows.length === 0) throw new Error('Não és uma empresa.');
  return rows[0];
};

// ── GET /api/empresas ─────────────────────────────────────────
// Lista todas as empresas activas — usado na sidebar do feed
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
// Devolve o perfil completo da empresa autenticada
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
// Lista todas as entregas associadas à empresa autenticada
router.get('/minhas/entregas', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
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
// Lista os eventos criados pela empresa
router.get('/minhas/eventos', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
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
// Cria um novo evento para a empresa
router.post('/minhas/eventos', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
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
// Lista os coletadores da equipa da empresa
// Inclui o campo 'tipo' para distinguir dependentes de independentes
router.get('/minhas/coletadores', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const [rows] = await pool.query(
      `SELECT c.id_coletador, c.tipo, u.nome, u.telefone, u.email, u.ativo
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
// Adiciona um coletador à equipa da empresa
router.post('/minhas/coletadores', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
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
// Remove um coletador da equipa da empresa
router.delete('/minhas/coletadores/:id', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    await pool.query(
      'UPDATE coletador SET id_empresa = NULL WHERE id_coletador = ? AND id_empresa = ?',
      [req.params.id, id_empresa]
    );
    res.json({ mensagem: 'Coletador removido da empresa.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  RECOLHAS AGENDADAS
//  Sistema de logística para recolha em lote ou individual
// ════════════════════════════════════════════════════════════

// ── GET /api/empresas/minhas/recolhas ─────────────────────────
// Lista todas as recolhas agendadas da empresa
// Inclui os coletadores e o número de entregas associadas
router.get('/minhas/recolhas', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);

    const [recolhas] = await pool.query(
      `SELECT
         ra.id_recolha, ra.data_recolha, ra.observacoes, ra.status, ra.criado_em,
         COUNT(DISTINCT re.id_entrega)  AS total_entregas,
         GROUP_CONCAT(DISTINCT u.nome ORDER BY u.nome SEPARATOR ', ') AS coletadores
       FROM recolha_agendada ra
       LEFT JOIN recolha_entrega  re ON re.id_recolha  = ra.id_recolha
       LEFT JOIN recolha_coletador rc ON rc.id_recolha = ra.id_recolha
       LEFT JOIN coletador c ON c.id_coletador = rc.id_coletador
       LEFT JOIN usuario u ON u.id_usuario = c.id_usuario
       WHERE ra.id_empresa = ?
       GROUP BY ra.id_recolha
       ORDER BY ra.data_recolha DESC`,
      [id_empresa]
    );
    res.json(recolhas);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/empresas/minhas/recolhas/:id ────────────────────
// Detalhe de uma recolha — coletadores + entregas/utilizadores associados
router.get('/minhas/recolhas/:id', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);

    // Verifica que a recolha pertence à empresa
    const [recolha] = await pool.query(
      'SELECT * FROM recolha_agendada WHERE id_recolha = ? AND id_empresa = ?',
      [req.params.id, id_empresa]
    );
    if (recolha.length === 0)
      return res.status(404).json({ erro: 'Recolha não encontrada.' });

    // Coletadores associados
    const [coletadores] = await pool.query(
      `SELECT c.id_coletador, c.tipo, u.nome, u.telefone
       FROM recolha_coletador rc
       INNER JOIN coletador c ON c.id_coletador = rc.id_coletador
       INNER JOIN usuario u ON u.id_usuario = c.id_usuario
       WHERE rc.id_recolha = ?`,
      [req.params.id]
    );

    // Entregas/acordos associados com dados do utilizador
    const [entregas] = await pool.query(
      `SELECT
         en.id_entrega, en.status, en.peso_total, en.endereco_domicilio,
         u.nome AS nome_usuario, u.telefone AS telefone_usuario
       FROM recolha_entrega re
       INNER JOIN entrega en ON en.id_entrega = re.id_entrega
       INNER JOIN usuario u ON u.id_usuario = en.id_usuario
       WHERE re.id_recolha = ?`,
      [req.params.id]
    );

    res.json({ ...recolha[0], coletadores, entregas });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/empresas/minhas/recolhas ───────────────────────
// Cria uma nova recolha agendada
// Associa coletadores e entregas pendentes
// Notifica todos os utilizadores envolvidos com a data/hora
router.post('/minhas/recolhas', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const { data_recolha, observacoes, ids_coletadores, ids_entregas } = req.body;

    // Validações obrigatórias
    if (!data_recolha)
      return res.status(400).json({ erro: 'A data de recolha é obrigatória.' });
    if (!ids_coletadores || ids_coletadores.length === 0)
      return res.status(400).json({ erro: 'Selecciona pelo menos um coletador.' });
    if (!ids_entregas || ids_entregas.length === 0)
      return res.status(400).json({ erro: 'Selecciona pelo menos uma entrega.' });

    // Cria o registo da recolha
    const [result] = await pool.query(
      `INSERT INTO recolha_agendada (id_empresa, data_recolha, observacoes)
       VALUES (?, ?, ?)`,
      [id_empresa, data_recolha, observacoes || null]
    );
    const id_recolha = result.insertId;

    // Associa os coletadores à recolha
    for (const id_coletador of ids_coletadores) {
      await pool.query(
        'INSERT INTO recolha_coletador (id_recolha, id_coletador) VALUES (?, ?)',
        [id_recolha, id_coletador]
      );
    }

    // Associa as entregas à recolha e notifica cada utilizador
    const dataFormatada = new Date(data_recolha).toLocaleString('pt-AO', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    for (const id_entrega of ids_entregas) {
      // Liga a entrega à recolha
      await pool.query(
        'INSERT INTO recolha_entrega (id_recolha, id_entrega) VALUES (?, ?)',
        [id_recolha, id_entrega]
      );

      // Vai buscar o id_usuario desta entrega para notificar
      const [entrega] = await pool.query(
        'SELECT id_usuario FROM entrega WHERE id_entrega = ?',
        [id_entrega]
      );

      if (entrega.length > 0) {
        // Cria notificação para o utilizador — avisa da data/hora da recolha
        await pool.query(
          `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
           VALUES (?, ?, ?, 'geral')`,
          [
            entrega[0].id_usuario,
            'Recolha agendada',
            `A recolha dos teus resíduos está agendada para ${dataFormatada}. Um coletador irá ao teu endereço.`,
          ]
        );
      }
    }

    res.status(201).json({
      mensagem: `Recolha agendada para ${dataFormatada}. ${ids_entregas.length} utilizadores foram notificados.`,
      id_recolha,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/empresas/minhas/recolhas/:id/status ───────────
// Actualiza o status de uma recolha (em_curso, concluida, cancelada)
// Quando concluída, notifica os utilizadores
router.patch('/minhas/recolhas/:id/status', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const { status } = req.body;

    const statusValidos = ['agendada', 'em_curso', 'concluida', 'cancelada'];
    if (!statusValidos.includes(status))
      return res.status(400).json({ erro: 'Status inválido.' });

    // Verifica que a recolha pertence à empresa
    const [recolha] = await pool.query(
      'SELECT id_recolha FROM recolha_agendada WHERE id_recolha = ? AND id_empresa = ?',
      [req.params.id, id_empresa]
    );
    if (recolha.length === 0)
      return res.status(404).json({ erro: 'Recolha não encontrada.' });

    // Actualiza o status
    await pool.query(
      'UPDATE recolha_agendada SET status = ? WHERE id_recolha = ?',
      [status, req.params.id]
    );

    // Se concluída — notifica todos os utilizadores das entregas associadas
    if (status === 'concluida') {
      const [entregas] = await pool.query(
        `SELECT en.id_usuario
         FROM recolha_entrega re
         INNER JOIN entrega en ON en.id_entrega = re.id_entrega
         WHERE re.id_recolha = ?`,
        [req.params.id]
      );

      for (const e of entregas) {
        await pool.query(
          `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
           VALUES (?, 'Recolha concluída', 'Os teus resíduos foram recolhidos com sucesso. Obrigado pela tua contribuição!', 'geral')`,
          [e.id_usuario]
        );
      }
    }

    // Se cancelada — também notifica os utilizadores
    if (status === 'cancelada') {
      const [entregas] = await pool.query(
        `SELECT en.id_usuario
         FROM recolha_entrega re
         INNER JOIN entrega en ON en.id_entrega = re.id_entrega
         WHERE re.id_recolha = ?`,
        [req.params.id]
      );

      for (const e of entregas) {
        await pool.query(
          `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
           VALUES (?, 'Recolha cancelada', 'A recolha agendada foi cancelada. A empresa irá contactar-te para reagendar.', 'geral')`,
          [e.id_usuario]
        );
      }
    }

    res.json({ mensagem: `Recolha marcada como ${status}.` });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/empresas/minhas/acordos-pendentes ───────────────
// Lista as entregas com acordo mas ainda sem recolha agendada
// Usado pela empresa para ver quem está à espera de recolha
// Também verifica se atingiu o limiar e avisa
router.get('/minhas/acordos-pendentes', auth, async (req, res) => {
  try {
    const { id_empresa, limiar_recolha } = await getIdEmpresa(req.usuario.id_usuario);

    // Entregas aceites que ainda não foram associadas a nenhuma recolha
    const [acordos] = await pool.query(
      `SELECT
         en.id_entrega, en.status, en.peso_total, en.endereco_domicilio,
         en.data_hora, u.nome AS nome_usuario, u.telefone AS telefone_usuario,
         GROUP_CONCAT(r.tipo SEPARATOR ', ') AS tipos_residuos
       FROM entrega en
       INNER JOIN usuario u ON u.id_usuario = en.id_usuario
       LEFT JOIN entrega_residuo er ON er.id_entrega = en.id_entrega
       LEFT JOIN residuo r ON r.id_residuo = er.id_residuo
       WHERE en.id_empresa = ?
         AND en.status = 'aceite'
         AND en.id_entrega NOT IN (
           SELECT re.id_entrega FROM recolha_entrega re
         )
       GROUP BY en.id_entrega
       ORDER BY en.data_hora ASC`,
      [id_empresa]
    );

    // Verifica se atingiu o limiar — avisa o frontend para mostrar sugestão de agendamento
    const atingiuLimiar = acordos.length >= (limiar_recolha || 5);

    res.json({
      acordos,
      total:          acordos.length,
      limiar_recolha: limiar_recolha || 5,
      atingiu_limiar: atingiuLimiar,
      // Mensagem de sugestão quando atinge o limiar
      sugestao: atingiuLimiar
        ? `Tens ${acordos.length} acordos pendentes. Considera agendar uma recolha em lote.`
        : null,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PUT /api/empresas/minhas/limiar ───────────────────────────
// Actualiza o limiar de recolha da empresa
// O limiar define quantos acordos mínimos para sugerir recolha em lote
router.put('/minhas/limiar', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const { limiar_recolha } = req.body;

    if (!limiar_recolha || limiar_recolha < 1)
      return res.status(400).json({ erro: 'O limiar deve ser pelo menos 1.' });

    await pool.query(
      'UPDATE empresarecicladora SET limiar_recolha = ? WHERE id_empresa = ?',
      [limiar_recolha, id_empresa]
    );
    res.json({ mensagem: 'Limiar actualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PUT /api/empresas/perfil ──────────────────────────────────
// Actualiza os dados do perfil da empresa
router.put('/perfil', auth, async (req, res) => {
  try {
    const {
      nome, telefone, email, endereco, provincia, municipio,
      bairro, descricao, horario_abertura, horario_fechamento,
      site, residuos_aceites
    } = req.body;

    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);

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

// ── POST /api/empresas/minhas/entregas/:id/aceitar 
// A empresa aceita uma entrega pendente
// Chama processarPagamento que:
//   1. Calcula valor total (peso × valor_por_kg)
//   2. Retém 10% de comissão da plataforma
//   3. Distribui o restante: 70% utilizador + 30% coletador 
//   4. Credita na carteira do utilizador (dinheiro ou saldo)
//   5. Marca a entrega como 'coletada'
//   6. Notifica o utilizador e o coletador
router.post('/minhas/entregas/:id/aceitar', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const id_entrega = parseInt(req.params.id);
 
    // Verifica que a entrega pertence a esta empresa e está pendente
    const [entregas] = await pool.query(
      `SELECT id_entrega, status, id_usuario, id_coletador, peso_total
       FROM entrega
       WHERE id_entrega = ? AND id_empresa = ?`,
      [id_entrega, id_empresa]
    );
 
    if (entregas.length === 0)
      return res.status(404).json({ erro: 'Entrega não encontrada.' });
 
    if (entregas[0].status !== 'pendente')
      return res.status(400).json({ erro: `Esta entrega já foi ${entregas[0].status === 'coletada' ? 'aceite' : 'rejeitada'}.` });
 
    // Chama o serviço de pagamento
    const { processarPagamento } = await import('../services/empresa.service.js');
    const resultado = await processarPagamento(id_entrega, id_empresa);
 
    res.json({
      mensagem:            'Entrega aceite e pagamento processado com sucesso.',
      valor_bruto:         resultado.valor_bruto,
      comissao_plataforma: resultado.comissao_plataforma,
      valor_liquido:       resultado.valor_liquido,
    });
  } catch (err) {
    console.error('Erro ao aceitar entrega:', err);
    res.status(500).json({ erro: err.message });
  }
});
 
// ── POST /api/empresas/minhas/entregas/:id/rejeitar ───────────
// A empresa rejeita uma entrega pendente
// Pode indicar motivo, pedir fotos e/ou pedir limpeza ao utilizador
// Notifica o utilizador com o motivo e os pedidos adicionais
router.post('/minhas/entregas/:id/rejeitar', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const id_entrega = parseInt(req.params.id);
    const { motivo, pede_foto, pede_limpeza } = req.body;
 
    if (!motivo || !motivo.trim())
      return res.status(400).json({ erro: 'O motivo da rejeição é obrigatório.' });
 
    // Verifica que a entrega pertence a esta empresa e está pendente
    const [entregas] = await pool.query(
      `SELECT id_entrega, status, id_usuario
       FROM entrega
       WHERE id_entrega = ? AND id_empresa = ?`,
      [id_entrega, id_empresa]
    );
 
    if (entregas.length === 0)
      return res.status(404).json({ erro: 'Entrega não encontrada.' });
 
    if (entregas[0].status !== 'pendente')
      return res.status(400).json({ erro: `Esta entrega já foi ${entregas[0].status === 'coletada' ? 'aceite' : 'rejeitada'}.` });
 
    // Chama o serviço de rejeição
    const { rejeitarEntrega } = await import('../services/empresa.service.js');
    const resultado = await rejeitarEntrega(id_entrega, id_empresa, motivo, pede_foto, pede_limpeza);
 
    // Marca a entrega como cancelada
    await pool.query(
      `UPDATE entrega SET status = 'cancelada' WHERE id_entrega = ?`,
      [id_entrega]
    );
 
    res.json(resultado);
  } catch (err) {
    console.error('Erro ao rejeitar entrega:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/empresas/:id ─────────────────────────────────────
// IMPORTANTE: esta rota tem de ficar SEMPRE no fim
// para não interceptar as rotas /perfil, /minhas/...
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