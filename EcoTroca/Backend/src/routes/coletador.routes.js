import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';
import { atribuirRecompensa } from '../services/entrega.service.js';

const router = Router();

// ─────────────────────────────────────────────
// GET /api/coletador/entregas/pendentes
// Regra 10 — Só coletadores cadastrados veem pedidos
// Regra 12 — Só mostra entregas de domicílio (tipo_entrega = 'domicilio')
//            porque só essas precisam de coletador
// ─────────────────────────────────────────────
router.get('/entregas/pendentes', auth, role('coletor'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        e.id_entrega,
        e.tipo_recompensa,
        e.endereco_domicilio,
        e.latitude,
        e.longitude,
        e.data_hora,
        e.status,
        u.nome     AS nome_usuario,
        u.provincia AS provincia_usuario,
        GROUP_CONCAT(r.tipo SEPARATOR ', ')                    AS tipos_residuos,
        SUM(er.peso_kg)                                        AS peso_total,
        SUM(er.quantidade)                                     AS quantidade_total,
        GROUP_CONCAT(
          CONCAT(r.tipo, ': ', er.quantidade, ' un / ', er.peso_kg, ' kg')
          SEPARATOR ' | '
        )                                                      AS detalhe_residuos,
        SUM(er.peso_kg * r.valor_por_kg)                       AS valor_total
       FROM entrega e
       JOIN usuario u ON e.id_usuario = u.id_usuario
       LEFT JOIN entrega_residuo er ON e.id_entrega = er.id_entrega
       LEFT JOIN residuo r ON er.id_residuo = r.id_residuo
       WHERE e.status = 'pendente'
         AND e.tipo_entrega = 'coletador'
         AND e.id_coletador IS NULL
       GROUP BY e.id_entrega
       ORDER BY e.data_hora ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/coletador/entregas/minhas
// Lista entregas aceites pelo coletador logado
// ─────────────────────────────────────────────
router.get('/entregas/minhas', auth, role('coletor'), async (req, res) => {
  try {
    const [coletador] = await pool.query(
      'SELECT id_coletador FROM Coletador WHERE id_usuario = ? AND ativo = TRUE',
      [req.usuario.id_usuario]
    );
    if (coletador.length === 0) return res.status(404).json({ erro: 'Coletador não encontrado' });

    const [rows] = await pool.query(
      `SELECT
        e.id_entrega,
        e.status,
        e.tipo_recompensa,
        e.endereco_domicilio,
        e.latitude,
        e.longitude,
        e.data_hora,
        u.nome AS nome_usuario,
        GROUP_CONCAT(r.tipo SEPARATOR ', ') AS tipos_residuos,
        SUM(er.peso_kg) AS peso_total,
        SUM(er.quantidade) AS quantidade_total,
        GROUP_CONCAT(
          CONCAT(r.tipo, ': ', er.quantidade, ' un / ', er.peso_kg, ' kg')
          SEPARATOR ' | '
        ) AS detalhe_residuos,
        SUM(er.peso_kg * r.valor_por_kg) AS valor_total
       FROM entrega e
       JOIN usuario u ON e.id_usuario = u.id_usuario
       LEFT JOIN entrega_residuo er ON e.id_entrega = er.id_entrega
       LEFT JOIN residuo r ON er.id_residuo = r.id_residuo
       WHERE e.id_coletador = ?
       GROUP BY e.id_entrega
       ORDER BY e.data_hora DESC`,
      [coletador[0].id_coletador]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/coletador/entregas/:id/aceitar
// Regra 10 — Cada pedido só pode ser aceite por UM coletador
// Regra 11 — Regista data/hora de aceitação
// ─────────────────────────────────────────────
router.patch('/entregas/:id/aceitar', auth, role('coletor'), async (req, res) => {
  try {
    const [coletador] = await pool.query(
      'SELECT id_coletador FROM Coletador WHERE id_usuario = ? AND ativo = TRUE',
      [req.usuario.id_usuario]
    );
    if (coletador.length === 0) return res.status(404).json({ erro: 'Coletador não encontrado' });

    // Verifica se a entrega existe, é de domicílio e ainda está pendente
    const [entrega] = await pool.query(
      `SELECT id_entrega, id_usuario, tipo_entrega, status 
       FROM Entrega WHERE id_entrega = ?`,
      [req.params.id]
    );
    if (entrega.length === 0) return res.status(404).json({ erro: 'Entrega não encontrada' });
    if (entrega[0].tipo_entrega !== 'coletador') return res.status(400).json({ erro: 'Esta entrega não precisa de coletador' });
    if (entrega[0].status !== 'pendente') return res.status(400).json({ erro: 'Esta entrega já foi aceite por outro coletador' });

    // Aceita a entrega — guarda o tipo de recompensa escolhido pelo coletador
    const tipo_recompensa_coletador = req.body.tipo_recompensa || 'dinheiro';
    await pool.query(
      'UPDATE entrega SET status = ?, id_coletador = ?, tipo_recompensa_coletador = ? WHERE id_entrega = ?',
      ['aceita', coletador[0].id_coletador, tipo_recompensa_coletador, req.params.id]
    );

    // Activa o chat entre utilizador e coletador
    await pool.query(
      'UPDATE Chat SET ativo = TRUE WHERE id_entrega = ?',
      [req.params.id]
    );

    // Busca o nome do coletador para a notificação
    const [nomeCol] = await pool.query(
      'SELECT nome FROM usuario WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    const nomeColetador = nomeCol[0]?.nome || 'Um coletador';

    // Busca o tipo de resíduo da entrega para a notificação
    const [residuoCol] = await pool.query(
      `SELECT GROUP_CONCAT(r.tipo SEPARATOR ', ') AS tipos
       FROM entrega_residuo er
       JOIN residuo r ON r.id_residuo = er.id_residuo
       WHERE er.id_entrega = ?`,
      [req.params.id]
    );
    const tipoResiduo = residuoCol[0]?.tipos || 'resíduo';

    // Notifica o utilizador com o nome do coletador
    await pool.query(
      `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
       VALUES (?, '🚛 Coletador a caminho!', ?, 'sistema')`,
      [
        entrega[0].id_usuario,
        `O coletador ${nomeColetador} aceitou a tua entrega #${req.params.id} (${tipoResiduo}) e está a caminho para recolher os teus resíduos!`
      ]
    );

    res.json({ mensagem: 'Entrega aceite com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/coletador/entregas/:id/recolher
// Regra 11 — Confirmação da coleta, liberta recompensa
// Regra 8/9 — Aplica lógica de dinheiro (70/30%) ou saldo (100%)
//             Pontos gerados automaticamente sempre
// ─────────────────────────────────────────────
router.patch('/entregas/:id/recolher', auth, role('coletor'), async (req, res) => {
  try {
    const [coletador] = await pool.query(
      'SELECT id_coletador FROM Coletador WHERE id_usuario = ? AND ativo = TRUE',
      [req.usuario.id_usuario]
    );
    if (coletador.length === 0) return res.status(404).json({ erro: 'Coletador não encontrado' });

    // Verifica se esta entrega pertence a este coletador e está aceite
    const [entrega] = await pool.query(
      'SELECT id_entrega, id_usuario, tipo_recompensa, status, id_coletador FROM Entrega WHERE id_entrega = ?',
      [req.params.id]
    );
    if (entrega.length === 0) return res.status(404).json({ erro: 'Entrega não encontrada' });
    if (entrega[0].id_coletador !== coletador[0].id_coletador) return res.status(403).json({ erro: 'Não tens permissão para recolher esta entrega' });
    if (entrega[0].status !== 'aceita') return res.status(400).json({ erro: 'A entrega tem de estar aceite antes de ser recolhida' });

    // Marca como recolhida
    await pool.query(
      'UPDATE Entrega SET status = ? WHERE id_entrega = ?',
      ['coletada', req.params.id]
    );

    // Atribui recompensa conforme escolha do utilizador (dinheiro ou saldo)
    // Pontos são sempre gerados automaticamente dentro desta função
    const resultado = await atribuirRecompensa(
      entrega[0].id_usuario,
      parseInt(req.params.id),
      entrega[0].tipo_recompensa,  // 'dinheiro' ou 'saldo'
      coletador[0].id_coletador    // para calcular comissão de 30%
    );

    // Notifica o utilizador
    await pool.query(
      'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
      [entrega[0].id_usuario, '✅ Entrega confirmada!', `A tua entrega #${req.params.id} foi recolhida com sucesso!`]
    );

    res.json({
      mensagem: 'Entrega recolhida com sucesso!',
      pontos_atribuidos: resultado.pontos,
      valor_total: resultado.valor_total,
      nivel: resultado.nivel
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/coletador/localizacao ──────────────────────────
// Coletador actualiza a sua localização GPS
router.post('/localizacao', auth, role('coletor'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ erro: 'Latitude e longitude são obrigatórias.' });

    await pool.query(
      `UPDATE coletador SET latitude = ?, longitude = ?, ultima_localizacao = NOW()
       WHERE id_usuario = ?`,
      [latitude, longitude, req.usuario.id_usuario]
    );
    res.json({ mensagem: 'Localização actualizada.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/coletador/proximos ───────────────────────────────
// Devolve coletadores independentes ordenados por distância
// Usa fórmula Haversine para calcular distância em km
router.get('/proximos', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) return res.status(400).json({ erro: 'Localização necessária.' });

    const [rows] = await pool.query(`
      SELECT
        c.id_coletador,
        u.nome,
        u.provincia,
        c.latitude,
        c.longitude,
        c.ultima_localizacao,
        -- Fórmula Haversine — distância em km
        (6371 * ACOS(
          COS(RADIANS(?)) * COS(RADIANS(c.latitude)) *
          COS(RADIANS(c.longitude) - RADIANS(?)) +
          SIN(RADIANS(?)) * SIN(RADIANS(c.latitude))
        )) AS distancia_km
      FROM coletador c
      INNER JOIN usuario u ON u.id_usuario = c.id_usuario
      WHERE c.tipo = 'independente'
        AND c.ativo = 1
        AND c.latitude IS NOT NULL
        AND c.longitude IS NOT NULL
        -- Só coletadores com localização actualizada nas últimas 24h
        AND c.ultima_localizacao >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY distancia_km ASC
      LIMIT 10
    `, [latitude, longitude, latitude]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;