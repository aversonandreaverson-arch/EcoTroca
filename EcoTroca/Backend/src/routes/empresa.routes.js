
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// Busca o id_empresa do utilizador autenticado
const getIdEmpresa = async (id_usuario) => {
  const [rows] = await pool.query(
    'SELECT id_empresa, limiar_recolha FROM empresarecicladora WHERE id_usuario = ?',
    [id_usuario]
  );
  if (rows.length === 0) throw new Error('Não és uma empresa.');
  return rows[0];
};

// GET /api/empresas — publica, sem autenticacao (usada no Cadastro)
router.get('/', async (req, res) => {
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

// GET /api/empresas/perfil
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

// GET /api/empresas/minhas/entregas
router.get('/minhas/entregas', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const [rows] = await pool.query(
      `SELECT
         en.id_entrega, en.status, en.tipo_entrega, en.peso_total, en.valor_total,
         en.data_hora, en.observacoes, en.endereco_domicilio,
         en.data_recolha_proposta,
         en.observacoes_empresa,
         en.valor_utilizador,
         en.valor_coletador,
         en.latitude,
         en.longitude,
         en.id_coletador,
         u.nome AS nome_usuario, u.telefone AS telefone_usuario,
         uc.nome AS nome_coletadores,
         GROUP_CONCAT(r.tipo ORDER BY r.tipo SEPARATOR ', ') AS tipos_residuos
       FROM entrega en
       INNER JOIN usuario u ON en.id_usuario = u.id_usuario
       LEFT JOIN coletador c ON c.id_coletador = en.id_coletador
       LEFT JOIN usuario uc ON uc.id_usuario = c.id_usuario
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

// POST /api/empresas/minhas/entregas/:id/aceitar
// Empresa aceita entrega:
//   - Se tipo_entrega = 'coletador' → notifica coletadores independentes (pagamento só depois da recolha)
//   - Se tipo_entrega = 'domicilio' ou 'ponto_recolha' → regista peso e paga logo
router.post('/minhas/entregas/:id/aceitar', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const id_entrega = parseInt(req.params.id);
    const { peso_real } = req.body;

    const [entregas] = await pool.query(
      `SELECT e.id_entrega, e.status, e.tipo_entrega, e.id_usuario,
              er.id_residuo, r.tipo AS tipo_residuo,
              u.nome AS nome_utilizador, u.provincia AS provincia_utilizador,
              emp.nome AS nome_empresa, emp.endereco AS endereco_empresa,
              emp.latitude AS empresa_latitude, emp.longitude AS empresa_longitude
       FROM entrega e
       LEFT JOIN entrega_residuo er ON er.id_entrega = e.id_entrega
       LEFT JOIN residuo r ON r.id_residuo = er.id_residuo
       LEFT JOIN usuario u ON u.id_usuario = e.id_usuario
       LEFT JOIN empresarecicladora emp ON emp.id_empresa = ?
       WHERE e.id_entrega = ? AND e.id_empresa = ?
       LIMIT 1`,
      [id_empresa, id_entrega, id_empresa]
    );

    if (entregas.length === 0)
      return res.status(404).json({ erro: 'Entrega nao encontrada.' });

    // Aceita se pendente, aceita (data marcada) ou aguarda_pesagem (coletador entregou)
    const statusValidos = ['pendente', 'aceita', 'aguarda_pesagem'];
    if (!statusValidos.includes(entregas[0].status))
      return res.status(400).json({ erro: 'Esta entrega ja foi processada.' });

    const entrega = entregas[0];

    // ── Fluxo com coletador independente ──
    if (entrega.tipo_entrega === 'coletador') {

      // Verifica se o coletador já entregou (aguarda_pesagem) ou já tem coletador
      // Se sim → empresa está a registar o peso → processa pagamento
      if (entrega.status === 'aguarda_pesagem') {
        if (!peso_real || parseFloat(peso_real) <= 0)
          return res.status(400).json({ erro: 'O peso real dos residuos e obrigatorio.' });

        const { processarPagamento } = await import('../services/empresa.service.js');
        const resultado = await processarPagamento(id_entrega, id_empresa, parseFloat(peso_real));

        return res.json({
          mensagem:          'Pagamento processado com sucesso.',
          peso_real:         resultado.peso_real,
          valor_total:       resultado.valor_total,
          comissao_ecotroca: resultado.comissao_ecotroca,
          valor_utilizador:  resultado.valor_utilizador,
          valor_coletador:   resultado.valor_coletador,
        });
      }

      // Coletador ainda não entregou → empresa aceita e aguarda
      await pool.query(
        "UPDATE entrega SET status = 'aceita' WHERE id_entrega = ?",
        [id_entrega]
      );

      await pool.query(
        `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
         VALUES (?, '✅ Empresa aceitou!', ?, 'sistema')`,
        [
          entrega.id_usuario,
          `A empresa ${entrega.nome_empresa} aceitou a tua oferta de ${entrega.tipo_residuo || 'resíduo'}. Estamos a procurar um coletador para ir buscar os teus resíduos.`
        ]
      );

      return res.json({
        mensagem: 'Entrega aceite. Define a data de recolha para notificar os coletadores.',
        aguarda_coletador: true,
      });
    }

    // ── Fluxo normal (domicilio / ponto_recolha) ──
    if (!peso_real || parseFloat(peso_real) <= 0)
      return res.status(400).json({ erro: 'O peso real dos residuos e obrigatorio.' });

    const { processarPagamento } = await import('../services/empresa.service.js');
    const resultado = await processarPagamento(id_entrega, id_empresa, parseFloat(peso_real));

    res.json({
      mensagem:          'Entrega aceite e pagamento processado com sucesso.',
      peso_real:         resultado.peso_real,
      valor_total:       resultado.valor_total,
      comissao_ecotroca: resultado.comissao_ecotroca,
      valor_utilizador:  resultado.valor_utilizador,
      valor_coletador:   resultado.valor_coletador,
    });
  } catch (err) {
    console.error('Erro ao aceitar entrega:', err);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/empresas/minhas/entregas/:id/rejeitar
// Empresa rejeita entrega com motivo obrigatorio
router.post('/minhas/entregas/:id/rejeitar', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const id_entrega = parseInt(req.params.id);
    const { motivo } = req.body;

    if (!motivo || !motivo.trim())
      return res.status(400).json({ erro: 'O motivo da rejeicao e obrigatorio.' });

    const [entregas] = await pool.query(
      'SELECT id_entrega, status, id_usuario FROM entrega WHERE id_entrega = ? AND id_empresa = ?',
      [id_entrega, id_empresa]
    );

    if (entregas.length === 0)
      return res.status(404).json({ erro: 'Entrega nao encontrada.' });

    if (entregas[0].status !== 'pendente')
      return res.status(400).json({ erro: 'Esta entrega ja foi processada.' });

    const { rejeitarEntrega } = await import('../services/empresa.service.js');
    await rejeitarEntrega(id_entrega, id_empresa, motivo, false, false);

    await pool.query(
      "UPDATE entrega SET status = 'cancelada' WHERE id_entrega = ?",
      [id_entrega]
    );

    res.json({ mensagem: 'Entrega rejeitada com sucesso.' });
  } catch (err) {
    console.error('Erro ao rejeitar entrega:', err);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/empresas/minhas/entregas/:id/propor-data
router.post('/minhas/entregas/:id/propor-data', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const id_entrega = parseInt(req.params.id);
    const { data_recolha, observacoes } = req.body;

    if (!data_recolha)
      return res.status(400).json({ erro: 'A data de recolha e obrigatoria.' });

    const [entregas] = await pool.query(
      `SELECT en.id_entrega, en.id_usuario, u.nome AS nome_utilizador, emp.nome AS nome_empresa
       FROM entrega en
       INNER JOIN usuario u ON u.id_usuario = en.id_usuario
       INNER JOIN empresarecicladora emp ON emp.id_empresa = ?
       WHERE en.id_entrega = ? AND en.id_empresa = ?`,
      [id_empresa, id_entrega, id_empresa]
    );

    if (entregas.length === 0)
      return res.status(404).json({ erro: 'Entrega nao encontrada.' });

    await pool.query(
      'UPDATE entrega SET data_recolha_proposta = ?, observacoes_empresa = ?, status = ? WHERE id_entrega = ?',
      [data_recolha, observacoes || null, 'aceita', id_entrega]
    );

    const dataFormatada = new Date(data_recolha).toLocaleString('pt-AO', {
      weekday: 'long', day: '2-digit', month: 'long',
      year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const { nome_utilizador, nome_empresa } = entregas[0];

    // Notifica o utilizador com a data marcada
    await pool.query(
      "INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo) VALUES (?, 'Data de recolha marcada', ?, 'geral')",
      [
        entregas[0].id_usuario,
        `A empresa ${nome_empresa} marcou a recolha para ${dataFormatada}.${observacoes ? ` Nota: ${observacoes}` : ''} Certifica-te de estar disponivel.`,
      ]
    );

    // Notifica cada coletador designado com os detalhes da recolha
    // id_coletadores e um array de ids enviado pelo frontend
    const id_coletadores = req.body.id_coletadores || [];
    if (id_coletadores.length > 0) {
      for (const id_col of id_coletadores) {
        // Busca o id_usuario do coletador para enviar a notificacao
        const [colRows] = await pool.query(
          `SELECT c.id_coletador, u.id_usuario, u.nome
           FROM coletador c
           INNER JOIN usuario u ON u.id_usuario = c.id_usuario
           WHERE c.id_coletador = ? AND c.id_empresa = ?`,
          [id_col, id_empresa]
        );
        if (colRows.length > 0) {
          await pool.query(
            "INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo) VALUES (?, 'Nova recolha designada', ?, 'geral')",
            [
              colRows[0].id_usuario,
              `Foste designado para fazer a recolha de ${nome_utilizador} em ${dataFormatada}. Local: ${entregas[0].id_usuario ? 'ver detalhes na app' : 'a confirmar'}.${observacoes ? ` Nota da empresa: ${observacoes}` : ''}`,
            ]
          );
        }
      }
    }

    // Se tipo_entrega = 'coletador' → notifica coletadores independentes com a data
    const [entregaInfo] = await pool.query(
      `SELECT e.tipo_entrega, emp.nome AS nome_empresa,
              GROUP_CONCAT(r.tipo SEPARATOR ', ') AS tipos_residuos,
              u.nome AS nome_utilizador, u.provincia AS provincia_utilizador
       FROM entrega e
       LEFT JOIN empresarecicladora emp ON emp.id_empresa = e.id_empresa
       LEFT JOIN entrega_residuo er ON er.id_entrega = e.id_entrega
       LEFT JOIN residuo r ON r.id_residuo = er.id_residuo
       LEFT JOIN usuario u ON u.id_usuario = e.id_usuario
       WHERE e.id_entrega = ?
       GROUP BY e.id_entrega`,
      [id_entrega]
    );

    if (entregaInfo.length > 0 && entregaInfo[0].tipo_entrega === 'coletador') {
      const info = entregaInfo[0];

      const [coletadores] = await pool.query(
        `SELECT c.id_coletador, u.id_usuario
         FROM coletador c
         INNER JOIN usuario u ON u.id_usuario = c.id_usuario
         WHERE c.id_empresa IS NULL AND c.tipo = 'independente' AND u.ativo = TRUE`
      );

      for (const col of coletadores) {
        await pool.query(
          `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
           VALUES (?, '📦 Nova recolha disponível', ?, 'sistema')`,
          [
            col.id_usuario,
            `Nova recolha disponível! ${info.nome_utilizador}${info.provincia_utilizador ? ` (${info.provincia_utilizador})` : ''} tem ${info.tipos_residuos || 'resíduo'} para recolher. Destino: ${info.nome_empresa}. Data: ${dataFormatada}. Entrega #${id_entrega}.`
          ]
        );
      }

      console.log(`${coletadores.length} coletadores notificados para entrega #${id_entrega}`);
    }

    res.json({ mensagem: `Data proposta. ${nome_utilizador} foi notificado.`, data_recolha, data_formatada: dataFormatada });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/empresas/minhas/eventos
router.get('/minhas/eventos', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const [rows] = await pool.query('SELECT * FROM evento WHERE id_empresa = ? ORDER BY data_inicio DESC', [id_empresa]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/empresas/minhas/eventos
router.post('/minhas/eventos', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const { titulo, descricao, data_inicio, data_fim, local, provincia, municipio, tipo } = req.body;
    if (!titulo || !data_inicio || !local)
      return res.status(400).json({ erro: 'Titulo, data de inicio e local sao obrigatorios.' });
    const [result] = await pool.query(
      "INSERT INTO evento (id_empresa, titulo, descricao, data_inicio, data_fim, local, provincia, municipio, tipo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo')",
      [id_empresa, titulo, descricao || null, data_inicio, data_fim || null, local, provincia || null, municipio || null, tipo || 'recolha']
    );
    res.status(201).json({ mensagem: 'Evento criado com sucesso.', id_evento: result.insertId });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/empresas/minhas/coletadores
router.get('/minhas/coletadores', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const [rows] = await pool.query(
      'SELECT c.id_coletador, c.tipo, u.nome, u.telefone, u.email, u.ativo FROM coletador c INNER JOIN usuario u ON c.id_usuario = u.id_usuario WHERE c.id_empresa = ? ORDER BY u.nome ASC',
      [id_empresa]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/empresas/minhas/coletadores
router.post('/minhas/coletadores', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const { id_coletador } = req.body;
    if (!id_coletador) return res.status(400).json({ erro: 'id_coletador e obrigatorio.' });
    const [existe] = await pool.query('SELECT id_coletador FROM coletador WHERE id_coletador = ?', [id_coletador]);
    if (existe.length === 0) return res.status(404).json({ erro: 'Coletador nao encontrado.' });
    await pool.query('UPDATE coletador SET id_empresa = ? WHERE id_coletador = ?', [id_empresa, id_coletador]);
    res.json({ mensagem: 'Coletador adicionado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/empresas/minhas/coletadores/:id
router.delete('/minhas/coletadores/:id', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    await pool.query('UPDATE coletador SET id_empresa = NULL WHERE id_coletador = ? AND id_empresa = ?', [req.params.id, id_empresa]);
    res.json({ mensagem: 'Coletador removido.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/empresas/minhas/recolhas
router.get('/minhas/recolhas', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const [recolhas] = await pool.query(
      `SELECT ra.id_recolha, ra.data_recolha, ra.observacoes, ra.status, ra.criado_em,
         COUNT(DISTINCT re.id_entrega) AS total_entregas,
         GROUP_CONCAT(DISTINCT u.nome ORDER BY u.nome SEPARATOR ', ') AS coletadores
       FROM recolha_agendada ra
       LEFT JOIN recolha_entrega re ON re.id_recolha = ra.id_recolha
       LEFT JOIN recolha_coletador rc ON rc.id_recolha = ra.id_recolha
       LEFT JOIN coletador c ON c.id_coletador = rc.id_coletador
       LEFT JOIN usuario u ON u.id_usuario = c.id_usuario
       WHERE ra.id_empresa = ?
       GROUP BY ra.id_recolha ORDER BY ra.data_recolha DESC`,
      [id_empresa]
    );
    res.json(recolhas);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/empresas/minhas/recolhas
router.post('/minhas/recolhas', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const { data_recolha, observacoes, ids_coletadores, ids_entregas } = req.body;
    if (!data_recolha) return res.status(400).json({ erro: 'A data de recolha e obrigatoria.' });
    if (!ids_coletadores?.length) return res.status(400).json({ erro: 'Selecciona pelo menos um coletador.' });
    if (!ids_entregas?.length) return res.status(400).json({ erro: 'Selecciona pelo menos uma entrega.' });
    const [result] = await pool.query('INSERT INTO recolha_agendada (id_empresa, data_recolha, observacoes) VALUES (?, ?, ?)', [id_empresa, data_recolha, observacoes || null]);
    const id_recolha = result.insertId;
    for (const id_coletador of ids_coletadores)
      await pool.query('INSERT INTO recolha_coletador (id_recolha, id_coletador) VALUES (?, ?)', [id_recolha, id_coletador]);
    const dataFormatada = new Date(data_recolha).toLocaleString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    for (const id_entrega of ids_entregas) {
      await pool.query('INSERT INTO recolha_entrega (id_recolha, id_entrega) VALUES (?, ?)', [id_recolha, id_entrega]);
      const [e] = await pool.query('SELECT id_usuario FROM entrega WHERE id_entrega = ?', [id_entrega]);
      if (e.length > 0)
        await pool.query("INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo) VALUES (?, 'Recolha agendada', ?, 'geral')", [e[0].id_usuario, `A recolha dos teus residuos esta agendada para ${dataFormatada}.`]);
    }
    res.status(201).json({ mensagem: `Recolha agendada. ${ids_entregas.length} utilizadores notificados.`, id_recolha });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PATCH /api/empresas/minhas/recolhas/:id/status
router.patch('/minhas/recolhas/:id/status', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const { status } = req.body;
    if (!['agendada','em_curso','concluida','cancelada'].includes(status))
      return res.status(400).json({ erro: 'Status invalido.' });
    const [recolha] = await pool.query('SELECT id_recolha FROM recolha_agendada WHERE id_recolha = ? AND id_empresa = ?', [req.params.id, id_empresa]);
    if (recolha.length === 0) return res.status(404).json({ erro: 'Recolha nao encontrada.' });
    await pool.query('UPDATE recolha_agendada SET status = ? WHERE id_recolha = ?', [status, req.params.id]);
    if (status === 'concluida' || status === 'cancelada') {
      const [entregas] = await pool.query('SELECT en.id_usuario FROM recolha_entrega re INNER JOIN entrega en ON en.id_entrega = re.id_entrega WHERE re.id_recolha = ?', [req.params.id]);
      const msg = status === 'concluida' ? 'Os teus residuos foram recolhidos com sucesso!' : 'A recolha agendada foi cancelada. A empresa ira contactar-te para reagendar.';
      const titulo = status === 'concluida' ? 'Recolha concluida' : 'Recolha cancelada';
      for (const e of entregas)
        await pool.query("INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo) VALUES (?, ?, ?, 'geral')", [e.id_usuario, titulo, msg]);
    }
    res.json({ mensagem: `Recolha marcada como ${status}.` });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/empresas/minhas/acordos-pendentes
router.get('/minhas/acordos-pendentes', auth, async (req, res) => {
  try {
    const { id_empresa, limiar_recolha } = await getIdEmpresa(req.usuario.id_usuario);
    const [acordos] = await pool.query(
      `SELECT en.id_entrega, en.status, en.peso_total, en.endereco_domicilio, en.data_hora,
         u.nome AS nome_usuario, u.telefone AS telefone_usuario,
         GROUP_CONCAT(r.tipo SEPARATOR ', ') AS tipos_residuos
       FROM entrega en
       INNER JOIN usuario u ON u.id_usuario = en.id_usuario
       LEFT JOIN entrega_residuo er ON er.id_entrega = en.id_entrega
       LEFT JOIN residuo r ON r.id_residuo = er.id_residuo
       WHERE en.id_empresa = ? AND en.status = 'aceite'
         AND en.id_entrega NOT IN (SELECT re.id_entrega FROM recolha_entrega re)
       GROUP BY en.id_entrega ORDER BY en.data_hora ASC`,
      [id_empresa]
    );
    const atingiuLimiar = acordos.length >= (limiar_recolha || 5);
    res.json({ acordos, total: acordos.length, limiar_recolha: limiar_recolha || 5, atingiu_limiar: atingiuLimiar, sugestao: atingiuLimiar ? `Tens ${acordos.length} acordos pendentes.` : null });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PUT /api/empresas/minhas/limiar
router.put('/minhas/limiar', auth, async (req, res) => {
  try {
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    const { limiar_recolha } = req.body;
    if (!limiar_recolha || limiar_recolha < 1) return res.status(400).json({ erro: 'O limiar deve ser pelo menos 1.' });
    await pool.query('UPDATE empresarecicladora SET limiar_recolha = ? WHERE id_empresa = ?', [limiar_recolha, id_empresa]);
    res.json({ mensagem: 'Limiar actualizado.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PUT /api/empresas/perfil
router.put('/perfil', auth, async (req, res) => {
  try {
    const { nome, telefone, email, endereco, provincia, municipio, bairro, descricao, horario_abertura, horario_fechamento, site, residuos_aceites, latitude, longitude } = req.body;
    const { id_empresa } = await getIdEmpresa(req.usuario.id_usuario);
    await pool.query(
      'UPDATE empresarecicladora SET nome=?, telefone=?, email=?, endereco=?, provincia=?, municipio=?, bairro=?, descricao=?, horario_abertura=?, horario_fechamento=?, site=?, residuos_aceites=?, latitude=?, longitude=? WHERE id_empresa=?',
      [nome, telefone, email||null, endereco||null, provincia||null, municipio||null, bairro||null, descricao||null, horario_abertura||null, horario_fechamento||null, site||null, residuos_aceites||null, latitude||null, longitude||null, id_empresa]
    );
    res.json({ mensagem: 'Perfil actualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/empresas/:id — TEM DE FICAR SEMPRE NO FIM
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT e.*, u.email AS email_usuario FROM empresarecicladora e INNER JOIN usuario u ON e.id_usuario = u.id_usuario WHERE e.id_empresa = ? AND u.ativo = TRUE',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Empresa não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;