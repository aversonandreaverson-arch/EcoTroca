//  Fluxo principal:
//    1. Utilizador cria entrega via NovoResiduo.jsx
//    2. Backend cria Entrega + Entrega_Residuo + Publicacao (automática) + Chat
//    3. Publicação aparece na Página Inicial para empresas verem
//    4. Se utilizador cancelar → entrega fica 'cancelada' + publicação eliminada do feed

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/entregas ─────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        e.*,
        GROUP_CONCAT(r.tipo SEPARATOR ', ') AS tipos_residuos,
        SUM(er.peso_kg)                     AS peso_total_real,
        MAX(r.qualidade)                    AS qualidade,
        MAX(r.descricao)                    AS descricao_qualidade,
        MAX(r.preco_min)                    AS preco_min,
        MAX(r.preco_max)                    AS preco_max,
        p.imagem                            AS imagem
       FROM entrega e
       LEFT JOIN entrega_residuo er ON e.id_entrega = er.id_entrega
       LEFT JOIN residuo r          ON er.id_residuo = r.id_residuo
       LEFT JOIN publicacao p       ON p.id_entrega = e.id_entrega AND p.eliminado = 0
       WHERE e.id_usuario = ?
       GROUP BY e.id_entrega, p.imagem
       ORDER BY e.data_hora DESC`,
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/entregas ────────────────────────────────────────
// Cria a entrega e automaticamente uma Publicacao no feed
// Se id_empresa ou id_publicacao vier no body, associa directamente
router.post('/', auth, async (req, res) => {
  try {
    const {
      tipo_entrega, endereco_domicilio, id_ponto,
      tipo_recompensa, residuos, observacoes,
      imagem,
      id_empresa,      // empresa destino (quando vem do NovoResiduo?empresa=X)
      id_publicacao,   // pedido específico da empresa (quando vem de um pedido)
    } = req.body;

    // Insiro a entrega principal
    const [result] = await pool.query(
      `INSERT INTO entrega
        (id_usuario, tipo_entrega, endereco_domicilio, id_ponto,
         tipo_recompensa, observacoes, data_hora, id_empresa, id_publicacao)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        req.usuario.id_usuario,
        tipo_entrega,
        endereco_domicilio,
        id_ponto      || null,
        tipo_recompensa,
        observacoes   || null,
        id_empresa    || null,
        id_publicacao || null,
      ]
    );

    const id_entrega = result.insertId;

    // Insiro cada resíduo na tabela entrega_residuo
    let id_residuo_principal = null;
    if (residuos && residuos.length > 0) {
      for (const r of residuos) {
        await pool.query(
          'INSERT INTO entrega_residuo (id_entrega, id_residuo, quantidade, peso_kg) VALUES (?, ?, ?, ?)',
          [id_entrega, r.id_residuo, r.quantidade || 1, r.peso_kg]
        );
        id_residuo_principal = r.id_residuo;
      }
    }

    // ── Criação automática da Publicacao ─────────────────────
    // Só cria publicação automática se NÃO for uma entrega directa a empresa
    // (quando é directa, o pedido da empresa já existe no feed)
    if (id_residuo_principal && !id_publicacao) {
      const [residuoRows] = await pool.query(
        'SELECT tipo, qualidade, preco_min, preco_max, descricao FROM residuo WHERE id_residuo = ?',
        [id_residuo_principal]
      );

      if (residuoRows.length > 0) {
        const r = residuoRows[0];

        const labelQualidade = {
          ruim: 'Ruim', moderada: 'Moderada', boa: 'Boa', excelente: 'Excelente',
        }[r.qualidade] || r.qualidade;

        const titulo = `Oferta de ${r.tipo} — Qualidade ${labelQualidade}`;

        let descricao = `${r.tipo} de qualidade ${labelQualidade}.`;
        if (r.preco_min && r.preco_max) descricao += ` Valor estimado: ${r.preco_min}–${r.preco_max} Kz/kg.`;
        if (observacoes) descricao += ` ${observacoes}`;

        const [userRows] = await pool.query(
          'SELECT provincia FROM usuario WHERE id_usuario = ?',
          [req.usuario.id_usuario]
        );
        const provincia = userRows[0]?.provincia || null;

        await pool.query(
          `INSERT INTO publicacao
            (id_usuario, tipo_autor, tipo_publicacao, titulo, descricao,
             id_residuo, provincia, imagem, status, id_entrega, criado_em)
           VALUES (?, 'utilizador', 'oferta_residuo', ?, ?, ?, ?, ?, 'disponivel', ?, NOW())`,
          [
            req.usuario.id_usuario,
            titulo,
            descricao,
            id_residuo_principal,
            provincia,
            imagem || null,
            id_entrega,
          ]
        );
      }
    }

    // ── Notifica a empresa quando utilizador participa num pedido ──
    // O utilizador ao clicar "Participar" está automaticamente a comprometer-se
    // com o mínimo definido no pedido. A empresa recebe uma notificação simples.
    if (id_publicacao) {
      try {
        // Busca o id_usuario da empresa (dona do pedido) e o nome do utilizador
        // que está a participar para montar a mensagem de notificação
        const [pubRows] = await pool.query(
          `SELECT
             p.id_usuario AS id_empresa_usuario,   -- utilizador da empresa a notificar
             p.titulo     AS titulo_pedido,          -- título do pedido para a mensagem
             u.nome       AS nome_utilizador         -- nome de quem participou
           FROM publicacao p
           INNER JOIN usuario u ON u.id_usuario = ?  -- utilizador que participou
           WHERE p.id_publicacao = ?`,
          [req.usuario.id_usuario, id_publicacao]
        );

        if (pubRows.length > 0) {
          const pub = pubRows[0];
          // Notifica a empresa: "João aceitou participar no teu pedido X."
          await pool.query(
            `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
             VALUES (?, 'Novo participante no teu pedido', ?, 'geral')`,
            [
              pub.id_empresa_usuario,
              `${pub.nome_utilizador} aceitou participar no pedido "${pub.titulo_pedido}".`,
            ]
          );
        }
      } catch (errNotif) {
        // Notificação é opcional — não bloqueia a criação da entrega se falhar
        console.error('Erro ao notificar empresa:', errNotif.message);
      }
    }

    // Crio o chat para esta entrega
    await pool.query('INSERT INTO chat (id_entrega) VALUES (?)', [id_entrega]);

    res.status(201).json({ mensagem: 'Entrega criada com sucesso!', id_entrega });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/entregas/:id ─────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        e.*,
        er.id_residuo,
        r.tipo      AS tipo_residuo,
        r.qualidade,
        r.descricao AS descricao_qualidade,
        r.preco_min,
        r.preco_max,
        p.imagem    AS imagem
       FROM entrega e
       LEFT JOIN entrega_residuo er ON e.id_entrega = er.id_entrega
       LEFT JOIN residuo r          ON er.id_residuo = r.id_residuo
       LEFT JOIN publicacao p       ON p.id_entrega = e.id_entrega AND p.eliminado = 0
       WHERE e.id_entrega = ? AND e.id_usuario = ?
       LIMIT 1`,
      [req.params.id, req.usuario.id_usuario]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Entrega não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PUT /api/entregas/:id ─────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { tipo_entrega, endereco_domicilio, tipo_recompensa, observacoes, residuos, imagem } = req.body;

    const [rows] = await pool.query(
      'SELECT status FROM entrega WHERE id_entrega = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Entrega não encontrada.' });
    if (rows[0].status !== 'pendente') {
      return res.status(403).json({ erro: 'Só é possível editar entregas pendentes.' });
    }

    await pool.query(
      `UPDATE entrega SET
        tipo_entrega       = ?,
        endereco_domicilio = ?,
        tipo_recompensa    = ?,
        observacoes        = ?
       WHERE id_entrega = ?`,
      [tipo_entrega, endereco_domicilio, tipo_recompensa, observacoes || null, req.params.id]
    );

    if (imagem !== undefined) {
      await pool.query(
        'UPDATE publicacao SET imagem = ? WHERE id_entrega = ? AND eliminado = 0',
        [imagem || null, req.params.id]
      );
    }

    if (residuos && residuos.length > 0) {
      await pool.query('DELETE FROM entrega_residuo WHERE id_entrega = ?', [req.params.id]);
      for (const r of residuos) {
        await pool.query(
          'INSERT INTO entrega_residuo (id_entrega, id_residuo, quantidade, peso_kg) VALUES (?, ?, ?, ?)',
          [req.params.id, r.id_residuo, r.quantidade || 1, r.peso_kg || 0]
        );
      }
    }

    res.json({ mensagem: 'Entrega actualizada com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/entregas/:id/confirmar ────────────────────────
router.patch('/:id/confirmar', auth, async (req, res) => {
  try {
    const { peso_real } = req.body;

    if (!peso_real || parseFloat(peso_real) <= 0) {
      return res.status(400).json({ erro: 'O peso real é obrigatório para confirmar a coleta.' });
    }

    const [rows] = await pool.query(
      `SELECT er.id_residuo, r.valor_por_kg
       FROM entrega_residuo er
       LEFT JOIN residuo r ON er.id_residuo = r.id_residuo
       WHERE er.id_entrega = ?
       LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ erro: 'Entrega não encontrada.' });

    const [configs] = await pool.query('SELECT chave, valor FROM configuracao');
    const cfg = {};
    configs.forEach(c => { cfg[c.chave] = parseFloat(c.valor); });

    const valor_por_kg      = parseFloat(rows[0].valor_por_kg);
    const peso              = parseFloat(peso_real);
    const valor_total       = valor_por_kg * peso;
    const comissao_empresa  = valor_total * (cfg.comissao_empresa || 0.10);
    const valor_utilizador  = (valor_total * 0.70) - (cfg.comissao_utilizador_fixo || 50);
    const valor_coletador   = valor_total * 0.30;
    const comissao_ecotroca = comissao_empresa + (cfg.comissao_utilizador_fixo || 50);

    await pool.query(
      `UPDATE entrega SET
        status            = 'coletada',
        peso_total        = ?,
        valor_total       = ?,
        valor_utilizador  = ?,
        valor_coletador   = ?,
        comissao_ecotroca = ?
       WHERE id_entrega = ?`,
      [peso, valor_total, valor_utilizador, valor_coletador, comissao_ecotroca, req.params.id]
    );

    res.json({
      mensagem:          'Coleta confirmada com sucesso.',
      valor_total:       valor_total.toFixed(2),
      valor_utilizador:  valor_utilizador.toFixed(2),
      valor_coletador:   valor_coletador.toFixed(2),
      comissao_ecotroca: comissao_ecotroca.toFixed(2),
      empresa_paga:      (valor_total + comissao_empresa).toFixed(2),
    });
  } catch (err) {
    console.error('Erro ao confirmar coleta:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/entregas/:id/cancelar ─────────────────────────
router.patch('/:id/cancelar', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE entrega SET status = 'cancelada'
       WHERE id_entrega = ? AND id_usuario = ? AND status = 'pendente'`,
      [req.params.id, req.usuario.id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({
        erro: 'Não foi possível cancelar. A entrega pode já não estar pendente.'
      });
    }

    await pool.query(
      `UPDATE publicacao SET eliminado = 1
       WHERE id_entrega = ? AND id_usuario = ? AND eliminado = 0 AND status != 'fechada'`,
      [req.params.id, req.usuario.id_usuario]
    );

    res.json({ mensagem: 'Entrega cancelada e publicação removida do feed.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;