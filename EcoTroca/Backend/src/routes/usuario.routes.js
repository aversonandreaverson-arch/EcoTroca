
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/usuarios/perfil ──────────────────────────────────
// Devolve os dados do perfil do utilizador autenticado
router.get('/perfil', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nome, email, telefone, provincia, municipio, bairro, tipo_usuario FROM Usuario WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/usuarios ─────────────────────────────────────────
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

// ── PUT /api/usuarios/perfil ──────────────────────────────────
// Actualiza o perfil do utilizador autenticado
// Campos com string vazia são convertidos para NULL
// para evitar o erro de UNIQUE KEY no campo telefone e email
router.put('/perfil', auth, async (req, res) => {
  try {
    const { nome, telefone, provincia, municipio, bairro } = req.body;

    // Nome é obrigatório — não pode ficar vazio
    if (!nome?.trim()) {
      return res.status(400).json({ erro: 'O nome é obrigatório.' });
    }

    // Só o telefone precisa de ser convertido para NULL quando vazio
    // porque tem UNIQUE KEY — dois utilizadores não podem ter o mesmo telefone
    // Os outros campos (provincia, municipio, bairro) são dados comuns
    // e podem ser iguais entre utilizadores sem qualquer problema
    const telefoneFinal = telefone?.trim() || null;

    await pool.query(
      'UPDATE Usuario SET nome = ?, telefone = ?, provincia = ?, municipio = ?, bairro = ? WHERE id_usuario = ?',
      [nome.trim(), telefoneFinal, provincia || null, municipio || null, bairro || null, req.usuario.id_usuario]
    );

    res.json({ mensagem: 'Perfil actualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/usuarios/pontuacao ───────────────────────────────
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

// ── GET /api/usuarios/carteira ────────────────────────────────
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

// ── GET /api/usuarios/residuos ────────────────────────────────
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