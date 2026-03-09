
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
// Lista todas as entregas do utilizador autenticado
// Faz JOIN com Publicacao para trazer a imagem guardada na publicação
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
       FROM Entrega e
       LEFT JOIN Entrega_Residuo er ON e.id_entrega = er.id_entrega
       LEFT JOIN Residuo r          ON er.id_residuo = r.id_residuo
       LEFT JOIN Publicacao p       ON p.id_entrega = e.id_entrega AND p.eliminado = 0
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
// Aceita imagem em base64 e guarda na Publicacao
router.post('/', auth, async (req, res) => {
  try {
    const {
      tipo_entrega, endereco_domicilio, id_ponto,
      tipo_recompensa, residuos, observacoes,
      imagem, // Base64 da foto do resíduo — pode ser null
    } = req.body;

    // Insiro a entrega principal na tabela Entrega
    const [result] = await pool.query(
      `INSERT INTO Entrega
        (id_usuario, tipo_entrega, endereco_domicilio, id_ponto, tipo_recompensa, observacoes, data_hora)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        req.usuario.id_usuario,
        tipo_entrega,
        endereco_domicilio,
        id_ponto || null,
        tipo_recompensa,
        observacoes || null,
      ]
    );

    const id_entrega = result.insertId;

    // Insiro cada resíduo na tabela Entrega_Residuo
    let id_residuo_principal = null;
    if (residuos && residuos.length > 0) {
      for (const r of residuos) {
        await pool.query(
          'INSERT INTO Entrega_Residuo (id_entrega, id_residuo, quantidade, peso_kg) VALUES (?, ?, ?, ?)',
          [id_entrega, r.id_residuo, r.quantidade || 1, r.peso_kg]
        );
        id_residuo_principal = r.id_residuo;
      }
    }

    // ── Criação automática da Publicacao ─────────────────────
    if (id_residuo_principal) {

      // Vou buscar os detalhes do resíduo para construir o título e descrição
      const [residuoRows] = await pool.query(
        'SELECT tipo, qualidade, preco_min, preco_max, descricao FROM Residuo WHERE id_residuo = ?',
        [id_residuo_principal]
      );

      if (residuoRows.length > 0) {
        const r = residuoRows[0];

        // Título gerado automaticamente com base no tipo e qualidade
        const labelQualidade = {
          ruim: 'Ruim', moderada: 'Moderada', boa: 'Boa', excelente: 'Excelente',
        }[r.qualidade] || r.qualidade;

        const titulo = `Oferta de ${r.tipo} — Qualidade ${labelQualidade}`;

        // Descrição com intervalo de preço e observações opcionais
        let descricao = `${r.tipo} de qualidade ${labelQualidade}.`;
        if (r.preco_min && r.preco_max) descricao += ` Valor estimado: ${r.preco_min}–${r.preco_max} Kz/kg.`;
        if (observacoes) descricao += ` ${observacoes}`;

        // Vou buscar a província do utilizador para mostrar no cartão
        const [userRows] = await pool.query(
          'SELECT provincia FROM Usuario WHERE id_usuario = ?',
          [req.usuario.id_usuario]
        );
        const provincia = userRows[0]?.provincia || null;

        // Insiro a publicação com a imagem base64 se foi enviada
        await pool.query(
          `INSERT INTO Publicacao
            (id_usuario, tipo_autor, tipo_publicacao, titulo, descricao,
             id_residuo, provincia, imagem, status, id_entrega, criado_em)
           VALUES (?, 'utilizador', 'oferta_residuo', ?, ?, ?, ?, ?, 'disponivel', ?, NOW())`,
          [
            req.usuario.id_usuario,
            titulo,
            descricao,
            id_residuo_principal,
            provincia,
            imagem || null, // Base64 da imagem ou null se não foi enviada
            id_entrega,
          ]
        );
      }
    }

    // Crio o chat para esta entrega — usado depois da negociação
    await pool.query('INSERT INTO Chat (id_entrega) VALUES (?)', [id_entrega]);

    res.status(201).json({ mensagem: 'Entrega criada com sucesso!', id_entrega });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/entregas/:id ─────────────────────────────────────
// Devolve o detalhe de uma entrega específica com a imagem da publicação
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
       FROM Entrega e
       LEFT JOIN Entrega_Residuo er ON e.id_entrega = er.id_entrega
       LEFT JOIN Residuo r          ON er.id_residuo = r.id_residuo
       LEFT JOIN Publicacao p       ON p.id_entrega = e.id_entrega AND p.eliminado = 0
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
// Edita uma entrega e actualiza a imagem na Publicacao correspondente
router.put('/:id', auth, async (req, res) => {
  try {
    const { tipo_entrega, endereco_domicilio, tipo_recompensa, observacoes, residuos, imagem } = req.body;

    // Verifico se a entrega existe e pertence ao utilizador
    const [rows] = await pool.query(
      'SELECT status FROM Entrega WHERE id_entrega = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Entrega não encontrada.' });
    if (rows[0].status !== 'pendente') {
      return res.status(403).json({ erro: 'Só é possível editar entregas pendentes.' });
    }

    // Actualizo os dados da entrega
    await pool.query(
      `UPDATE Entrega SET
        tipo_entrega       = ?,
        endereco_domicilio = ?,
        tipo_recompensa    = ?,
        observacoes        = ?
       WHERE id_entrega = ?`,
      [tipo_entrega, endereco_domicilio, tipo_recompensa, observacoes || null, req.params.id]
    );

    // Actualizo a imagem na Publicacao correspondente se foi enviada uma nova
    if (imagem !== undefined) {
      await pool.query(
        'UPDATE Publicacao SET imagem = ? WHERE id_entrega = ? AND eliminado = 0',
        [imagem || null, req.params.id]
      );
    }

    // Se vieram novos resíduos, apago os antigos e insiro os novos
    if (residuos && residuos.length > 0) {
      await pool.query('DELETE FROM Entrega_Residuo WHERE id_entrega = ?', [req.params.id]);
      for (const r of residuos) {
        await pool.query(
          'INSERT INTO Entrega_Residuo (id_entrega, id_residuo, quantidade, peso_kg) VALUES (?, ?, ?, ?)',
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
// Confirma a coleta com o peso real e calcula todos os valores
// Comissão: empresa paga 10%, utilizador recebe 70% - 50Kz, coletador recebe 30%
router.patch('/:id/confirmar', auth, async (req, res) => {
  try {
    const { peso_real } = req.body;

    if (!peso_real || parseFloat(peso_real) <= 0) {
      return res.status(400).json({ erro: 'O peso real é obrigatório para confirmar a coleta.' });
    }

    // Vou buscar o valor por kg do resíduo desta entrega
    const [rows] = await pool.query(
      `SELECT er.id_residuo, r.valor_por_kg
       FROM Entrega_Residuo er
       LEFT JOIN Residuo r ON er.id_residuo = r.id_residuo
       WHERE er.id_entrega = ?
       LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ erro: 'Entrega não encontrada.' });

    // Vou buscar as configurações de comissão da base de dados
    const [configs] = await pool.query('SELECT chave, valor FROM Configuracao');
    const cfg = {};
    configs.forEach(c => { cfg[c.chave] = parseFloat(c.valor); });

    // Cálculo dos valores com base no peso real
    const valor_por_kg      = parseFloat(rows[0].valor_por_kg);
    const peso              = parseFloat(peso_real);
    const valor_total       = valor_por_kg * peso;
    const comissao_empresa  = valor_total * (cfg.comissao_empresa || 0.10);
    const valor_utilizador  = (valor_total * 0.70) - (cfg.comissao_utilizador_fixo || 50);
    const valor_coletador   = valor_total * 0.30;
    const comissao_ecotroca = comissao_empresa + (cfg.comissao_utilizador_fixo || 50);

    // Actualizo a entrega com o status 'coletada' e todos os valores calculados
    await pool.query(
      `UPDATE Entrega SET
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
// Cancela a entrega E elimina a publicação correspondente do feed
router.patch('/:id/cancelar', auth, async (req, res) => {
  try {
    // Cancelo a entrega — só funciona se ainda estiver pendente
    const [result] = await pool.query(
      `UPDATE Entrega SET status = 'cancelada'
       WHERE id_entrega = ? AND id_usuario = ? AND status = 'pendente'`,
      [req.params.id, req.usuario.id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({
        erro: 'Não foi possível cancelar. A entrega pode já não estar pendente.'
      });
    }

    // Elimino a publicação correspondente do feed (soft delete)
    await pool.query(
      `UPDATE Publicacao SET eliminado = 1
       WHERE id_entrega = ? AND id_usuario = ? AND eliminado = 0 AND status != 'fechada'`,
      [req.params.id, req.usuario.id_usuario]
    );

    res.json({ mensagem: 'Entrega cancelada e publicação removida do feed.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;