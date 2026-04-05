const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const { verificarToken, verificarTipo } = require('../middlewares/auth');

// ============================================================
//  EMPRESA - Criar recolha agendada
// ============================================================

router.post('/recolhas', verificarToken, verificarTipo(['empresa']), async (req, res) => {
  try {
    const { id_entrega, data_proposta, hora_inicio, referencia_local, endereco_completo, latitude, longitude } = req.body;
    const id_empresa = req.usuario.id_usuario;

    if (!id_entrega || !data_proposta || !hora_inicio || !referencia_local) {
      return res.status(400).json({ erro: 'Campos obrigatórios: id_entrega, data_proposta, hora_inicio, referencia_local' });
    }

    const query = `
      INSERT INTO recolha_agendada 
      (id_empresa, id_entrega, data_recolha, hora_inicio, referencia_local, endereco_completo, latitude, longitude, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'agendada')
    `;

    const [result] = await db.execute(query, [
      id_empresa,
      id_entrega,
      data_proposta,
      hora_inicio,
      referencia_local,
      endereco_completo || null,
      latitude || null,
      longitude || null
    ]);

    // Notificar utilizador
    await db.execute(
      `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo, id_referencia, lido)
       SELECT u.id_usuario, ?, ?, 'recolha_agendada', ?, 0
       FROM entrega e
       JOIN usuario u ON e.id_usuario = u.id_usuario
       WHERE e.id_entrega = ?`,
      [
        'Recolha agendada! ✅',
        `Sua recolha foi agendada para ${data_proposta} às ${hora_inicio}`,
        result.insertId,
        id_entrega
      ]
    );

    res.json({ 
      sucesso: true, 
      id_recolha: result.insertId,
      mensagem: 'Recolha agendada com sucesso!' 
    });
  } catch (erro) {
    console.error('Erro ao agendar recolha:', erro);
    res.status(500).json({ erro: 'Erro ao agendar recolha' });
  }
});

// ============================================================
//  UTILIZADOR - Confirmar/Recusar recolha
// ============================================================

router.patch('/recolhas/:id_recolha/confirmar', verificarToken, verificarTipo(['usuario']), async (req, res) => {
  try {
    const { id_recolha } = req.params;
    const { aceito, motivo } = req.body;
    const id_usuario = req.usuario.id_usuario;

    // Verificar se a recolha pertence ao utilizador
    const [recolha] = await db.execute(
      `SELECT r.* FROM recolha_agendada r
       JOIN entrega e ON r.id_entrega = e.id_entrega
       WHERE r.id_recolha = ? AND e.id_usuario = ?`,
      [id_recolha, id_usuario]
    );

    if (recolha.length === 0) {
      return res.status(403).json({ erro: 'Recolha não encontrada ou não autorizada' });
    }

    if (aceito) {
      // Confirmar recolha
      await db.execute(
        'UPDATE recolha_agendada SET status = ? WHERE id_recolha = ?',
        ['confirmada', id_recolha]
      );

      // Notificar empresa
      await db.execute(
        `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo, id_referencia, lido)
         VALUES (?, ?, ?, 'recolha_confirmada', ?, 0)`,
        [
          recolha[0].id_empresa,
          'Recolha confirmada! ✅',
          `O utilizador confirmou a recolha agendada para ${recolha[0].data_recolha}`,
          id_recolha
        ]
      );

      res.json({ sucesso: true, mensagem: 'Recolha confirmada!' });
    } else {
      // Recusar recolha
      await db.execute(
        'UPDATE recolha_agendada SET status = ?, motivo_cancelamento = ? WHERE id_recolha = ?',
        ['recusada', motivo, id_recolha]
      );

      // Notificar empresa
      await db.execute(
        `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo, id_referencia, lido)
         VALUES (?, ?, ?, 'recolha_recusada', ?, 0)`,
        [
          recolha[0].id_empresa,
          'Recolha recusada ⚠️',
          `Motivo: ${motivo}. A recolha foi rescindida.`,
          id_recolha
        ]
      );

      res.json({ sucesso: true, mensagem: 'Recolha recusada. Empresa será contactada.' });
    }
  } catch (erro) {
    console.error('Erro ao confirmar recolha:', erro);
    res.status(500).json({ erro: 'Erro ao processar confirmação' });
  }
});

// ============================================================
//  COLETADOR - Listar recolhas agendadas
// ============================================================

router.get('/coletador/recolhas/agendadas', verificarToken, verificarTipo(['coletador']), async (req, res) => {
  try {
    const id_coletador = req.usuario.id_usuario;

    const query = `
      SELECT 
        r.id_recolha, r.id_empresa, r.id_entrega, r.id_coletador,
        r.data_recolha, r.hora_inicio, r.status,
        r.referencia_local, r.endereco_completo, r.latitude, r.longitude,
        e.tipo_residuo, e.peso_total,
        u.nome AS nome_usuario, u.telefone,
        er.nome AS nome_empresa
      FROM recolha_agendada r
      JOIN entrega e ON r.id_entrega = e.id_entrega
      JOIN usuario u ON e.id_usuario = u.id_usuario
      JOIN empresarecicladora er ON r.id_empresa = er.id_empresa
      WHERE r.id_coletador = ? OR (r.status = 'confirmada' AND r.id_coletador IS NULL)
      ORDER BY r.data_recolha ASC, r.hora_inicio ASC
    `;

    const [recolhas] = await db.execute(query, [id_coletador]);
    res.json(recolhas);
  } catch (erro) {
    console.error('Erro ao listar recolhas:', erro);
    res.status(500).json({ erro: 'Erro ao listar recolhas' });
  }
});

// ============================================================
//  COLETADOR - Iniciar recolha
// ============================================================

router.patch('/recolhas/:id_recolha/iniciar', verificarToken, verificarTipo(['coletador']), async (req, res) => {
  try {
    const { id_recolha } = req.params;
    const id_coletador = req.usuario.id_usuario;

    // Atribuir coletador e marcar como em curso
    await db.execute(
      'UPDATE recolha_agendada SET id_coletador = ?, status = ? WHERE id_recolha = ?',
      [id_coletador, 'em_curso', id_recolha]
    );

    // Registar no histórico
    const [recolha] = await db.execute(
      'SELECT * FROM recolha_agendada WHERE id_recolha = ?',
      [id_recolha]
    );

    await db.execute(
      `INSERT INTO recolha_historico (id_recolha, data_tentativa, status_tentativa)
       VALUES (?, CURDATE(), 'realizada')`,
      [id_recolha]
    );

    res.json({ sucesso: true, mensagem: 'Recolha iniciada!' });
  } catch (erro) {
    console.error('Erro ao iniciar recolha:', erro);
    res.status(500).json({ erro: 'Erro ao iniciar recolha' });
  }
});

// ============================================================
//  COLETADOR - Concluir recolha
// ============================================================

router.patch('/recolhas/:id_recolha/concluir', verificarToken, verificarTipo(['coletador']), async (req, res) => {
  try {
    const { id_recolha } = req.params;
    const { peso_real, observacoes } = req.body;

    if (!peso_real) {
      return res.status(400).json({ erro: 'Peso real é obrigatório' });
    }

    // Atualizar recolha
    await db.execute(
      'UPDATE recolha_agendada SET status = ? WHERE id_recolha = ?',
      ['concluida', id_recolha]
    );

    // Registar no histórico com peso
    await db.execute(
      `UPDATE recolha_historico SET peso_recolhido = ?, observacoes = ? 
       WHERE id_recolha = ? AND data_tentativa = CURDATE()`,
      [peso_real, observacoes || null, id_recolha]
    );

    // Notificar empresa e utilizador
    const [recolha] = await db.execute(
      `SELECT r.id_empresa, e.id_usuario FROM recolha_agendada r
       JOIN entrega e ON r.id_entrega = e.id_entrega
       WHERE r.id_recolha = ?`,
      [id_recolha]
    );

    await db.execute(
      `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo, id_referencia, lido)
       VALUES (?, ?, ?, 'recolha_concluida', ?, 0), (?, ?, ?, 'recolha_concluida', ?, 0)`,
      [
        recolha[0].id_empresa, 'Recolha concluída ✅', `Peso: ${peso_real}kg`, id_recolha,
        recolha[0].id_usuario, 'Sua recolha foi concluída! ✅', `Peso recolhido: ${peso_real}kg`, id_recolha
      ]
    );

    res.json({ sucesso: true, mensagem: 'Recolha concluída com sucesso!' });
  } catch (erro) {
    console.error('Erro ao concluir recolha:', erro);
    res.status(500).json({ erro: 'Erro ao concluir recolha' });
  }
});

// ============================================================
//  COLETADOR - Reportar falha
// ============================================================

router.post('/recolhas/:id_recolha/falha', verificarToken, verificarTipo(['coletador']), async (req, res) => {
  try {
    const { id_recolha } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({ erro: 'Motivo é obrigatório' });
    }

    // Atualizar recolha
    await db.execute(
      'UPDATE recolha_agendada SET status = ?, numero_tentativas = numero_tentativas + 1 WHERE id_recolha = ?',
      ['nao_compareceu', id_recolha]
    );

    // Registar no histórico
    await db.execute(
      `INSERT INTO recolha_historico (id_recolha, data_tentativa, status_tentativa, observacoes)
       VALUES (?, CURDATE(), 'não_compareceu', ?)`,
      [id_recolha, motivo]
    );

    // Notificar empresa
    const [recolha] = await db.execute(
      'SELECT id_empresa FROM recolha_agendada WHERE id_recolha = ?',
      [id_recolha]
    );

    await db.execute(
      `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo, id_referencia, lido)
       VALUES (?, ?, ?, 'recolha_falha', ?, 0)`,
      [
        recolha[0].id_empresa,
        'Falha na recolha ⚠️',
        `Motivo: ${motivo}. Reagende a recolha.`,
        id_recolha
      ]
    );

    res.json({ sucesso: true, mensagem: 'Falha reportada. Empresa será notificada.' });
  } catch (erro) {
    console.error('Erro ao reportar falha:', erro);
    res.status(500).json({ erro: 'Erro ao reportar falha' });
  }
});

// ============================================================
//  EMPRESA - Obter datas sugeridas
// ============================================================

router.get('/recolhas/datas-sugeridas/:id_empresa', verificarToken, verificarTipo(['empresa']), async (req, res) => {
  try {
    const hoje = new Date();
    const datas = [];

    // Adicionar próximos 7 dias (excluindo finais de semana em Angola - segunda a sábado)
    for (let i = 1; i <= 10; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() + i);
      
      const diaSemana = data.getDay();
      // 0 = domingo (pular), 6 = sábado (considerar)
      if (diaSemana !== 0) { // Pular domingos
        datas.push(data.toISOString().split('T')[0]);
      }
      
      if (datas.length === 7) break;
    }

    res.json(datas);
  } catch (erro) {
    console.error('Erro ao obter datas:', erro);
    res.status(500).json({ erro: 'Erro ao obter datas sugeridas' });
  }
});

module.exports = router;