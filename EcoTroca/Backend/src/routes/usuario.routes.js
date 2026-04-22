
//  Rotas:
//    GET /api/usuarios/perfil     → ver perfil do utilizador autenticado
//    PUT /api/usuarios/perfil     → actualizar perfil
//    GET /api/usuarios            → listar todos (só admin)
//    GET /api/usuarios/pontuacao  → ver pontuação e recompensa
//    GET /api/usuarios/carteira   → ver saldo da carteira
//    GET /api/usuarios/residuos   → listar resíduos disponíveis

import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/usuarios/perfil 
// Devolve os dados do perfil do utilizador autenticado
// Para coletadores, inclui o tipo (dependente/independente) e o nome da empresa
router.get('/perfil', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nome, email, telefone, provincia, municipio, bairro, tipo_usuario FROM Usuario WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Utilizador nao encontrado.' });

    const perfil = rows[0];

    // Se for coletador, busca o tipo e o nome da empresa
    if (perfil.tipo_usuario === 'coletor') {
      const [coletRows] = await pool.query(
        `SELECT c.tipo AS tipo_coletador, c.id_empresa, e.nome AS nome_empresa
         FROM coletador c
         LEFT JOIN empresarecicladora e ON e.id_empresa = c.id_empresa
         WHERE c.id_usuario = ?`,
        [perfil.id_usuario]
      );
      if (coletRows.length > 0) {
        perfil.tipo_coletador = coletRows[0].tipo_coletador;
        perfil.id_empresa     = coletRows[0].id_empresa;
        perfil.nome_empresa   = coletRows[0].nome_empresa;
      }
    }

    res.json(perfil);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/usuarios 
// Lista todos os utilizadores — só acessível pelo admin
router.get('/', auth, role('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nome, email, telefone, tipo_usuario, ativo FROM Usuario'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PUT /api/usuarios/perfil 
// Actualiza o perfil do utilizador autenticado
// Campos com string vazia são convertidos para NULL
// para evitar o erro de UNIQUE KEY no campo telefone e email
router.put('/perfil', auth, async (req, res) => {
  try {
    const { nome, provincia, municipio, bairro, data_nascimento } = req.body;

    // Nome é obrigatório — não pode ficar vazio
    if (!nome?.trim()) {
      return res.status(400).json({ erro: 'O nome é obrigatório.' });
    }

    // Actualizo apenas os campos que vieram no body
    // O telefone NÃO é actualizado aqui porque o formulário de edição não tem esse campo
    // Tem UNIQUE KEY — se vier vazio pode causar conflito com outros utilizadores
    await pool.query(
      'UPDATE Usuario SET nome = ?, provincia = ?, municipio = ?, bairro = ?, data_nascimento = ? WHERE id_usuario = ?',
      [
        nome.trim(),
        provincia       || null,
        municipio       || null,
        bairro          || null,
        data_nascimento || null,
        req.usuario.id_usuario,
      ]
    );

    res.json({ mensagem: 'Perfil actualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/usuarios/pontuacao 
// Devolve a pontuação e o nível de recompensa do utilizador
router.get('/pontuacao', auth, async (req, res) => {
  try {
    const [pontuacao] = await pool.query(
      'SELECT * FROM PontuacaoUsuario WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    const [recompensa] = await pool.query(
      'SELECT * FROM RecompensaUsuario WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    res.json({ pontuacao: pontuacao[0], recompensa: recompensa[0] });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/usuarios/carteira 
// Devolve o saldo da carteira do utilizador
// Se ainda não tiver carteira, cria automaticamente com saldo zero
router.get('/carteira', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT dinheiro, saldo FROM Carteira WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );

    // Se não tem carteira ainda, cria automaticamente
    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO Carteira (id_usuario) VALUES (?)',
        [req.usuario.id_usuario]
      );
      return res.json({ dinheiro: 0, saldo: 0 });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/usuarios/residuos 
// Lista todos os resíduos activos — usado no formulário de nova entrega
router.get('/residuos', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Residuo WHERE ativo = TRUE ORDER BY tipo ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;