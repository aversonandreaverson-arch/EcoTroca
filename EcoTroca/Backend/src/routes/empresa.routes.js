// ============================================================
//  empresa.routes.js
//  Todas as rotas da empresa recicladora
//  IMPORTANTE: as rotas específicas (/perfil, /minhas/...)
//  devem vir ANTES das rotas com parâmetro (/:id)
//  para o Express não confundir "perfil" com um id
// ============================================================

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';
import { processarPagamento, rejeitarEntrega, criarEvento } from '../services/empresa.service.js';

const router = Router();

// ──────────────────────────────────────────────────────────────
// GET /api/empresas/perfil
// Perfil da empresa autenticada — usa o token JWT
// ──────────────────────────────────────────────────────────────
router.get('/perfil', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM EmpresaRecicladora WHERE id_usuario = ? AND ativo = TRUE`,
      [req.usuario.id_usuario]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Perfil de empresa não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT /api/empresas/perfil
// Editar dados da empresa autenticada
// ──────────────────────────────────────────────────────────────
router.put('/perfil', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const {
      nome, telefone, email, endereco, provincia, municipio, bairro,
      descricao, horario_abertura, horario_fechamento, site, residuos_aceites
    } = req.body;

    await pool.query(
      `UPDATE EmpresaRecicladora SET
         nome = ?, telefone = ?, email = ?, endereco = ?,
         provincia = ?, municipio = ?, bairro = ?,
         descricao = ?, horario_abertura = ?, horario_fechamento = ?,
         site = ?, residuos_aceites = ?
       WHERE id_usuario = ?`,
      [nome, telefone, email, endereco, provincia, municipio, bairro,
       descricao, horario_abertura, horario_fechamento, site, residuos_aceites,
       req.usuario.id_usuario]
    );

    res.json({ mensagem: 'Perfil atualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/empresas/minhas/entregas
// Entregas destinadas à empresa autenticada
// ──────────────────────────────────────────────────────────────
router.get('/minhas/entregas', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const [empresa] = await pool.query(
      `SELECT id_empresa FROM EmpresaRecicladora WHERE id_usuario = ?`,
      [req.usuario.id_usuario]
    );
    if (empresa.length === 0) return res.status(404).json({ erro: 'Empresa não encontrada.' });

    const [rows] = await pool.query(
      `SELECT
         e.id_entrega, e.status, e.tipo_entrega, e.tipo_recompensa,
         e.endereco_domicilio, e.data_hora, e.observacoes,
         u.nome AS nome_usuario, u.telefone AS telefone_usuario,
         GROUP_CONCAT(r.tipo SEPARATOR ', ') AS tipos_residuos,
         SUM(er.peso_kg) AS peso_total,
         SUM(er.peso_kg * r.valor_por_kg) AS valor_total
       FROM Entrega e
       JOIN Usuario u ON e.id_usuario = u.id_usuario
       LEFT JOIN Entrega_Residuo er ON e.id_entrega = er.id_entrega
       LEFT JOIN Residuo r ON er.id_residuo = r.id_residuo
       WHERE e.id_empresa = ?
       GROUP BY e.id_entrega
       ORDER BY e.data_hora DESC`,
      [empresa[0].id_empresa]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/empresas/minhas/entregas/:idEntrega/aceitar
// Aceitar entrega — processa pagamento (Regra 16)
// ──────────────────────────────────────────────────────────────
router.post('/minhas/entregas/:idEntrega/aceitar', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const [empresa] = await pool.query(
      `SELECT id_empresa FROM EmpresaRecicladora WHERE id_usuario = ?`,
      [req.usuario.id_usuario]
    );
    if (empresa.length === 0) return res.status(404).json({ erro: 'Empresa não encontrada.' });

    const resultado = await processarPagamento(req.params.idEntrega, empresa[0].id_empresa);
    res.json({ mensagem: 'Entrega aceite e pagamento processado!', ...resultado });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/empresas/minhas/entregas/:idEntrega/rejeitar
// Rejeitar entrega com motivo obrigatório (Regra 17)
// ──────────────────────────────────────────────────────────────
router.post('/minhas/entregas/:idEntrega/rejeitar', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const { motivo, pede_foto, pede_limpeza } = req.body;
    if (!motivo) return res.status(400).json({ erro: 'O motivo da rejeição é obrigatório.' });

    const [empresa] = await pool.query(
      `SELECT id_empresa FROM EmpresaRecicladora WHERE id_usuario = ?`,
      [req.usuario.id_usuario]
    );
    if (empresa.length === 0) return res.status(404).json({ erro: 'Empresa não encontrada.' });

    const resultado = await rejeitarEntrega(
      req.params.idEntrega, empresa[0].id_empresa, motivo, pede_foto, pede_limpeza
    );
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/empresas/minhas/coletadores
// Coletadores dependentes da empresa autenticada
// ──────────────────────────────────────────────────────────────
router.get('/minhas/coletadores', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const [empresa] = await pool.query(
      `SELECT id_empresa FROM EmpresaRecicladora WHERE id_usuario = ?`,
      [req.usuario.id_usuario]
    );
    if (empresa.length === 0) return res.status(404).json({ erro: 'Empresa não encontrada.' });

    const [rows] = await pool.query(
      `SELECT c.id_coletador, c.nome, c.telefone, c.ativo, u.email
       FROM Coletador c
       JOIN Usuario u ON c.id_usuario = u.id_usuario
       WHERE c.id_empresa = ? AND c.tipo = 'empresa'
       ORDER BY c.nome ASC`,
      [empresa[0].id_empresa]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/empresas/minhas/coletadores
// Adicionar coletador por ID ou por telefone
// ──────────────────────────────────────────────────────────────
router.post('/minhas/coletadores', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const { id_coletador, telefone } = req.body;

    const [empresa] = await pool.query(
      `SELECT id_empresa FROM EmpresaRecicladora WHERE id_usuario = ?`,
      [req.usuario.id_usuario]
    );
    if (empresa.length === 0) return res.status(404).json({ erro: 'Empresa não encontrada.' });

    let coletadorId = id_coletador;

    // Se passou telefone em vez de ID, procura o coletador pelo telefone
    if (!coletadorId && telefone) {
      const [coletador] = await pool.query(
        `SELECT c.id_coletador FROM Coletador c
         JOIN Usuario u ON c.id_usuario = u.id_usuario
         WHERE u.telefone = ?`,
        [telefone]
      );
      if (coletador.length === 0)
        return res.status(404).json({ erro: 'Nenhum coletador encontrado com este telefone.' });
      coletadorId = coletador[0].id_coletador;
    }

    if (!coletadorId) return res.status(400).json({ erro: 'Fornece o id_coletador ou o telefone.' });

    await pool.query(
      `UPDATE Coletador SET id_empresa = ?, tipo = 'empresa' WHERE id_coletador = ?`,
      [empresa[0].id_empresa, coletadorId]
    );

    res.json({ mensagem: 'Coletador adicionado à empresa com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// DELETE /api/empresas/minhas/coletadores/:idColetador
// Remover coletador da empresa
// ──────────────────────────────────────────────────────────────
router.delete('/minhas/coletadores/:idColetador', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const [empresa] = await pool.query(
      `SELECT id_empresa FROM EmpresaRecicladora WHERE id_usuario = ?`,
      [req.usuario.id_usuario]
    );
    if (empresa.length === 0) return res.status(404).json({ erro: 'Empresa não encontrada.' });

    await pool.query(
      `UPDATE Coletador SET id_empresa = NULL, tipo = 'independente'
       WHERE id_coletador = ? AND id_empresa = ?`,
      [req.params.idColetador, empresa[0].id_empresa]
    );
    res.json({ mensagem: 'Coletador removido da empresa.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/empresas/minhas/eventos
// Eventos criados pela empresa autenticada
// ──────────────────────────────────────────────────────────────
router.get('/minhas/eventos', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const [empresa] = await pool.query(
      `SELECT id_empresa FROM EmpresaRecicladora WHERE id_usuario = ?`,
      [req.usuario.id_usuario]
    );
    if (empresa.length === 0) return res.status(404).json({ erro: 'Empresa não encontrada.' });

    const [rows] = await pool.query(
      `SELECT * FROM Evento WHERE id_empresa = ? AND eliminado = FALSE ORDER BY data_inicio DESC`,
      [empresa[0].id_empresa]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/empresas/minhas/eventos
// Criar evento — só empresa e admin
// ──────────────────────────────────────────────────────────────
router.post('/minhas/eventos', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const [empresa] = await pool.query(
      `SELECT id_empresa FROM EmpresaRecicladora WHERE id_usuario = ?`,
      [req.usuario.id_usuario]
    );
    if (empresa.length === 0) return res.status(404).json({ erro: 'Empresa não encontrada.' });

    const resultado = await criarEvento(req.body, empresa[0].id_empresa, null);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/empresas
// Listar todas as empresas ativas — público
// ──────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_empresa, nome, telefone, email, endereco, provincia, municipio,
              horario_abertura, horario_fechamento, foto_perfil, descricao, residuos_aceites
       FROM EmpresaRecicladora WHERE ativo = TRUE ORDER BY nome ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/empresas/:id
// Ver empresa por ID — público
// ATENÇÃO: esta rota deve ficar DEPOIS de todas as rotas específicas
// para o Express não confundir "perfil" ou "minhas" com um :id
// ──────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM EmpresaRecicladora WHERE id_empresa = ? AND ativo = TRUE`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Empresa não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// PATCH /api/empresas/:id/desativar — só admin
// ──────────────────────────────────────────────────────────────
router.patch('/:id/desativar', auth, role('admin'), async (req, res) => {
  try {
    await pool.query(
      'UPDATE EmpresaRecicladora SET ativo = FALSE WHERE id_empresa = ?',
      [req.params.id]
    );
    res.json({ mensagem: 'Empresa desativada com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;