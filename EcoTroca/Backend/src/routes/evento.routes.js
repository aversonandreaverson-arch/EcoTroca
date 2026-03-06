
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ──────────────────────────────────────────────────────────────
// GET /api/eventos
// Listar todos os eventos ativos — visível para todos
// ──────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         ev.id_evento, ev.titulo, ev.descricao, ev.data_inicio, ev.data_fim,
         ev.local, ev.provincia, ev.municipio, ev.tipo, ev.status, ev.imagem,
         emp.nome AS nome_empresa,
         emp.foto_perfil AS foto_empresa
       FROM Evento ev
       LEFT JOIN EmpresaRecicladora emp ON ev.id_empresa = emp.id_empresa
       WHERE ev.status = 'ativo' AND ev.eliminado = FALSE
       ORDER BY ev.data_inicio ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/eventos/:id
// Ver detalhes de um evento
// ──────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         ev.*, emp.nome AS nome_empresa, emp.telefone AS telefone_empresa,
         emp.foto_perfil AS foto_empresa
       FROM Evento ev
       LEFT JOIN EmpresaRecicladora emp ON ev.id_empresa = emp.id_empresa
       WHERE ev.id_evento = ? AND ev.eliminado = FALSE`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Evento não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT /api/eventos/:id
// Editar evento — só a empresa que criou ou admin
// ──────────────────────────────────────────────────────────────
router.put('/:id', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    const { titulo, descricao, data_inicio, data_fim, local, provincia, municipio, tipo } = req.body;

    // Verifica se o evento pertence à empresa autenticada
    if (req.usuario.tipo_usuario === 'empresa') {
      const [empresa] = await pool.query(
        `SELECT id_empresa FROM EmpresaRecicladora WHERE id_usuario = ?`,
        [req.usuario.id_usuario]
      );
      const [evento] = await pool.query(
        `SELECT id_empresa FROM Evento WHERE id_evento = ?`,
        [req.params.id]
      );
      if (evento.length === 0) return res.status(404).json({ erro: 'Evento não encontrado.' });
      if (evento[0].id_empresa !== empresa[0].id_empresa) {
        return res.status(403).json({ erro: 'Não tens permissão para editar este evento.' });
      }
    }

    await pool.query(
      `UPDATE Evento SET
         titulo = ?, descricao = ?, data_inicio = ?, data_fim = ?,
         local = ?, provincia = ?, municipio = ?, tipo = ?
       WHERE id_evento = ?`,
      [titulo, descricao, data_inicio, data_fim, local, provincia, municipio, tipo, req.params.id]
    );

    res.json({ mensagem: 'Evento atualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// DELETE /api/eventos/:id
// Apagar evento — só a empresa que criou ou admin
// Em vez de apagar fisicamente, muda o status para 'cancelado'
// ──────────────────────────────────────────────────────────────
router.delete('/:id', auth, role('empresa', 'admin'), async (req, res) => {
  try {
    // Verifica se o evento pertence à empresa autenticada
    if (req.usuario.tipo_usuario === 'empresa') {
      const [empresa] = await pool.query(
        `SELECT id_empresa FROM EmpresaRecicladora WHERE id_usuario = ?`,
        [req.usuario.id_usuario]
      );
      const [evento] = await pool.query(
        `SELECT id_empresa FROM Evento WHERE id_evento = ?`,
        [req.params.id]
      );
      if (evento.length === 0) return res.status(404).json({ erro: 'Evento não encontrado.' });
      if (evento[0].id_empresa !== empresa[0].id_empresa) {
        return res.status(403).json({ erro: 'Não tens permissão para apagar este evento.' });
      }
    }

    // Soft delete — marca como eliminado mas preserva o histórico
    await pool.query(
      `UPDATE Evento SET eliminado = TRUE WHERE id_evento = ?`,
      [req.params.id]
    );

    res.json({ mensagem: 'Evento eliminado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;