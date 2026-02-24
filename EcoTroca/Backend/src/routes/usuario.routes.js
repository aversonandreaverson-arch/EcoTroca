import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';

const router = Router();

// Ver perfil do utilizador logado
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

// Listar todos os utilizadores (só admin)
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

// Actualizar perfil
router.put('/perfil', auth, async (req, res) => {
  try {
    const { nome, telefone, provincia, municipio, bairro } = req.body;
    await pool.query(
      'UPDATE Usuario SET nome = ?, telefone = ?, provincia = ?, municipio = ?, bairro = ? WHERE id_usuario = ?',
      [nome, telefone, provincia, municipio, bairro, req.usuario.id_usuario]
    );
    res.json({ mensagem: 'Perfil actualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Ver pontuação do utilizador
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

export default router;