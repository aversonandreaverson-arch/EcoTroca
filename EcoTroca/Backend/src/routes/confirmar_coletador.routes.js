
//  Rotas para a empresa confirmar ou recusar um coletador
//  que disse trabalhar para ela durante o cadastro.
//
//  Fluxo:
//    1. Coletador regista-se com id_empresa e ativo=false
//    2. Backend envia email/notificacao a empresa
//    3. Empresa ve no DashboardEmpresa um card "Coletadores a Confirmar"
//    4. Empresa clica Confirmar -> coletador fica activo + notificado
//    5. Empresa clica Recusar  -> coletador recebe notificacao de recusa

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// GET /api/coletadores/pendentes
// Lista coletadores que disseram pertencer a esta empresa mas ainda nao confirmados
// A empresa ve esta lista no dashboard
router.get('/pendentes', auth, async (req, res) => {
  try {
    // Busca o id_empresa da empresa autenticada
    const [empRows] = await pool.query(
      'SELECT id_empresa FROM empresarecicladora WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    if (empRows.length === 0)
      return res.status(403).json({ erro: 'Nao es uma empresa.' });

    const id_empresa = empRows[0].id_empresa;

    // Busca coletadores que escolheram esta empresa mas ainda estao inactivos
    // ativo = FALSE significa que ainda aguarda confirmacao da empresa
    const [coletadores] = await pool.query(
      `SELECT c.id_coletador, c.tipo,
              u.id_usuario, u.nome, u.telefone, u.email,
              u.provincia, u.municipio, u.bairro,
              u.criado_em
       FROM coletador c
       INNER JOIN usuario u ON u.id_usuario = c.id_usuario
       WHERE c.id_empresa = ?
         AND u.ativo = FALSE
       ORDER BY u.criado_em DESC`,
      [id_empresa]
    );

    res.json(coletadores);
  } catch (err) {
    console.error('Erro ao listar coletadores pendentes:', err);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/coletadores/:id/confirmar
// Empresa confirma que o coletador trabalha para ela
// -> coletador fica activo + recebe notificacao de boas-vindas
router.post('/:id/confirmar', auth, async (req, res) => {
  try {
    const id_coletador = parseInt(req.params.id);

    // Busca o id_empresa da empresa autenticada
    const [empRows] = await pool.query(
      'SELECT id_empresa, nome FROM empresarecicladora WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    if (empRows.length === 0)
      return res.status(403).json({ erro: 'Nao es uma empresa.' });

    const { id_empresa, nome: nomeEmpresa } = empRows[0];

    // Verifica que o coletador pertence a esta empresa e esta inactivo
    const [coletRows] = await pool.query(
      `SELECT c.id_coletador, u.id_usuario, u.nome, u.ativo
       FROM coletador c
       INNER JOIN usuario u ON u.id_usuario = c.id_usuario
       WHERE c.id_coletador = ? AND c.id_empresa = ?`,
      [id_coletador, id_empresa]
    );

    if (coletRows.length === 0)
      return res.status(404).json({ erro: 'Coletador nao encontrado.' });

    const coletador = coletRows[0];

    if (coletador.ativo)
      return res.status(400).json({ erro: 'Este coletador ja esta activo.' });

    // Activa a conta do coletador
    await pool.query(
      'UPDATE usuario SET ativo = TRUE WHERE id_usuario = ?',
      [coletador.id_usuario]
    );

    // Notifica o coletador com mensagem de boas-vindas
    await pool.query(
      `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
       VALUES (?, 'Boas-vindas a EcoTroca!', ?, 'sistema')`,
      [
        coletador.id_usuario,
        `A empresa ${nomeEmpresa} confirmou que fazes parte da equipa! A tua conta esta agora activa. Bem-vindo a EcoTroca Angola!`,
      ]
    );

    res.json({
      mensagem: `${coletador.nome} foi confirmado e a conta esta agora activa.`,
    });
  } catch (err) {
    console.error('Erro ao confirmar coletador:', err);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/coletadores/:id/recusar
// Empresa recusa o coletador — conta permanece inactiva
// Coletador recebe notificacao explicando a situacao
router.post('/:id/recusar', auth, async (req, res) => {
  try {
    const id_coletador = parseInt(req.params.id);
    const { motivo } = req.body;

    const [empRows] = await pool.query(
      'SELECT id_empresa, nome FROM empresarecicladora WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    if (empRows.length === 0)
      return res.status(403).json({ erro: 'Nao es uma empresa.' });

    const { id_empresa, nome: nomeEmpresa } = empRows[0];

    const [coletRows] = await pool.query(
      `SELECT c.id_coletador, u.id_usuario, u.nome
       FROM coletador c
       INNER JOIN usuario u ON u.id_usuario = c.id_usuario
       WHERE c.id_coletador = ? AND c.id_empresa = ?`,
      [id_coletador, id_empresa]
    );

    if (coletRows.length === 0)
      return res.status(404).json({ erro: 'Coletador nao encontrado.' });

    const coletador = coletRows[0];

    // Remove a associacao com a empresa — coletador fica sem empresa
    // A conta permanece inactiva — o coletador tera de se registar novamente
    // ou contactar outra empresa
    await pool.query(
      'UPDATE coletador SET id_empresa = NULL, tipo = ? WHERE id_coletador = ?',
      ['independente', id_coletador]
    );

    // Notifica o coletador da recusa
    await pool.query(
      `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
       VALUES (?, 'Pedido de confirmacao recusado', ?, 'sistema')`,
      [
        coletador.id_usuario,
        `A empresa ${nomeEmpresa} nao confirmou a tua associacao. ${motivo ? `Motivo: ${motivo}.` : ''} Podes contactar a empresa directamente ou tentar com outra empresa.`,
      ]
    );

    res.json({ mensagem: `Pedido de ${coletador.nome} foi recusado.` });
  } catch (err) {
    console.error('Erro ao recusar coletador:', err);
    res.status(500).json({ erro: err.message });
  }
});

export default router;