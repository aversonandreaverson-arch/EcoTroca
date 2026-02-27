// ============================================================
//  empresa.routes.js
//  Rotas da empresa recicladora:
//    GET    /api/empresas              → listar empresas ativas
//    GET    /api/empresas/:id          → ver detalhes de uma empresa
//    PUT    /api/empresas/:id          → editar dados da empresa
//    GET    /api/empresas/:id/entregas → entregas destinadas à empresa
//    POST   /api/empresas/:id/entregas/:idEntrega/aceitar  → aceitar entrega
//    POST   /api/empresas/:id/entregas/:idEntrega/rejeitar → rejeitar resíduos
//    GET    /api/empresas/:id/coletadores → coletadores dependentes
//    POST   /api/empresas/:id/coletadores → adicionar coletador dependente
//    POST   /api/empresas/:id/eventos  → criar evento
//    GET    /api/eventos               → listar todos os eventos (público)
// ============================================================

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';
import { processarPagamento, rejeitarEntrega, criarEvento } from '../services/empresa.service.js';

const router = Router();

// ──────────────────────────────────────────────────────────────
// LISTAR TODAS AS EMPRESAS ATIVAS
// Acesso: qualquer utilizador autenticado
// ──────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_empresa, nome, telefone, email, endereco, provincia, municipio,
              horario_abertura, horario_fechamento, foto_perfil, descricao, residuos_aceites
       FROM EmpresaRecicladora
       WHERE ativo = TRUE
       ORDER BY nome ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// VER DETALHES DE UMA EMPRESA
// Acesso: qualquer utilizador autenticado
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
// EDITAR DADOS DA EMPRESA
// Acesso: só a própria empresa (tipo_usuario = 'empresa')
// ──────────────────────────────────────────────────────────────
router.put('/:id', auth, role('empresa', 'admin'), async (req, res) => {
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
       WHERE id_empresa = ?`,
      [nome, telefone, email, endereco, provincia, municipio, bairro,
       descricao, horario_abertura, horario_fechamento, site, residuos_aceites,
       req.params.id]
    );

    res.json({ mensagem: 'Dados da empresa atualizados com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// LISTAR ENTREGAS DESTINADAS À EMPRESA
// Acesso: só a própria empresa
// ──────────────────────────────────────────────────────────────
router.get('/:id/entregas', auth, role('empresa', 'admin'), async (req, res) => {
  try {
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
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// ACEITAR ENTREGA — Regra 16
// Empresa aceita os resíduos e o sistema processa o pagamento
// Acesso: só a própria empresa
// ──────────────────────────────────────────────────────────────
router.post('/:id/entregas/:idEntrega/aceitar', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const { id, idEntrega } = req.params;

    // Processa o pagamento ao utilizador e coletador (Regra 16)
    const resultado = await processarPagamento(idEntrega, id);

    res.json({
      mensagem: 'Entrega aceite e pagamento processado com sucesso!',
      ...resultado
    });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// REJEITAR ENTREGA — Regra 17
// Empresa rejeita resíduos danificados, sujos ou de origem suspeita
// Pode pedir fotos, limpeza ou organização ao utilizador
// Acesso: só a própria empresa
// ──────────────────────────────────────────────────────────────
router.post('/:id/entregas/:idEntrega/rejeitar', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const { id, idEntrega } = req.params;
    const { motivo, pede_foto, pede_limpeza } = req.body;

    // motivo é obrigatório — empresa deve justificar a rejeição
    if (!motivo) return res.status(400).json({ erro: 'O motivo da rejeição é obrigatório.' });

    const resultado = await rejeitarEntrega(idEntrega, id, motivo, pede_foto, pede_limpeza);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// LISTAR COLETADORES DEPENDENTES DA EMPRESA
// Acesso: só a própria empresa
// ──────────────────────────────────────────────────────────────
router.get('/:id/coletadores', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id_coletador, c.nome, c.telefone, c.ativo, u.email
       FROM Coletador c
       JOIN Usuario u ON c.id_usuario = u.id_usuario
       WHERE c.id_empresa = ? AND c.tipo = 'empresa'
       ORDER BY c.nome ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// ADICIONAR COLETADOR DEPENDENTE À EMPRESA
// Liga um coletador independente existente à empresa
// Acesso: só a própria empresa
// ──────────────────────────────────────────────────────────────
router.post('/:id/coletadores', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const { id_coletador } = req.body;

    if (!id_coletador) return res.status(400).json({ erro: 'id_coletador é obrigatório.' });

    // Atualiza o coletador para ficar ligado à empresa
    await pool.query(
      `UPDATE Coletador SET id_empresa = ?, tipo = 'empresa' WHERE id_coletador = ?`,
      [req.params.id, id_coletador]
    );

    res.json({ mensagem: 'Coletador adicionado à empresa com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// REMOVER COLETADOR DEPENDENTE DA EMPRESA
// Acesso: só a própria empresa
// ──────────────────────────────────────────────────────────────
router.delete('/:id/coletadores/:idColetador', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    // Remove a ligação — coletador volta a ser independente
    await pool.query(
      `UPDATE Coletador SET id_empresa = NULL, tipo = 'independente'
       WHERE id_coletador = ? AND id_empresa = ?`,
      [req.params.idColetador, req.params.id]
    );

    res.json({ mensagem: 'Coletador removido da empresa.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// CRIAR EVENTO
// Só empresas e admins podem criar eventos
// ──────────────────────────────────────────────────────────────
router.post('/:id/eventos', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const resultado = await criarEvento(req.body, req.params.id, null);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// DESATIVAR EMPRESA — só admin
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