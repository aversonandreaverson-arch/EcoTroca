import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';
import AfricasTalking from 'africastalking';

const router = Router();

// Inicializo o cliente AfricasTalking com as credenciais da sandbox
const at  = AfricasTalking({
  username: process.env.AT_USERNAME || 'sandbox',
  apiKey:   process.env.AT_API_KEY  || 'TXPJ51x6L',
});
const sms = at.SMS;

// ── GET /api/notificacoes ─────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Notificacao WHERE id_usuario = ? ORDER BY data DESC',
      [req.usuario.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/notificacoes/criar ──────────────────────────────
// Aqui crio uma notificação na plataforma E envio SMS ao utilizador
// Usado quando uma empresa mostra interesse numa oferta de resíduo
router.post('/criar', auth, async (req, res) => {
  try {
    const { id_usuario_destino, titulo, mensagem } = req.body;

    if (!id_usuario_destino || !titulo || !mensagem) {
      return res.status(400).json({ erro: 'id_usuario_destino, titulo e mensagem são obrigatórios.' });
    }

    // Guardo a notificação na base de dados — aparece no sino da plataforma
    await pool.query(
      'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
      [id_usuario_destino, titulo, mensagem]
    );

    // Vou buscar o número de telefone do utilizador destino
    const [rows] = await pool.query(
      'SELECT telefone FROM Usuario WHERE id_usuario = ?',
      [id_usuario_destino]
    );

    // Se o utilizador tiver número, envio o SMS
    if (rows.length && rows[0].telefone) {
      let telefone = rows[0].telefone.toString().trim();

      // Normalizo o número para formato internacional com prefixo Angola (+244)
      // Se já começar com +244 não faço nada
      // Se começar com 244 adiciono o +
      // Se começar com 9 (número local angolano) adiciono +244
      if (telefone.startsWith('+244')) {
        // já está correcto
      } else if (telefone.startsWith('244')) {
        telefone = '+' + telefone;
      } else if (telefone.startsWith('9')) {
        telefone = '+244' + telefone;
      } else {
        telefone = '+244' + telefone;
      }

      try {
        await sms.send({
          to:      [telefone],
          message: `EcoTroca: ${mensagem}`,
          from:    'EcoTroca', // Nome do remetente (pode não funcionar na sandbox)
        });
        console.log(`SMS enviado para ${telefone}`);
      } catch (smsErr) {
        // Se o SMS falhar não bloqueio a resposta — a notificação na plataforma já foi guardada
        console.error('Erro ao enviar SMS:', smsErr.message);
      }
    }

    res.status(201).json({ mensagem: 'Notificação enviada com sucesso.' });
  } catch (err) {
    console.error('Erro ao criar notificação:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/notificacoes/:id/ler ──────────────────────────
router.patch('/:id/ler', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE Notificacao SET lida = TRUE WHERE id_notificacao = ? AND id_usuario = ?',
      [req.params.id, req.usuario.id_usuario]
    );
    res.json({ mensagem: 'Notificação marcada como lida.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── PATCH /api/notificacoes/todas/lidas ──────────────────────
router.patch('/todas/lidas', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE Notificacao SET lida = TRUE WHERE id_usuario = ?',
      [req.usuario.id_usuario]
    );
    res.json({ mensagem: 'Todas as notificações marcadas como lidas.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;