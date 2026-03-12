
import { Router } from 'express';
import {
  registar,
  login,
  recuperarSenha,
  redefinirSenha,
  confirmarEmail,
} from '../controllers/auth.controller.js';

const router = Router();

// ── Wrapper assíncrono ────────────────────────────────────────
// Envolve cada handler para apanhar erros e devolver sempre JSON.
// Junta req.body e req.params num único objecto para simplificar
// a assinatura das funções no controller.
const handle = (fn) => async (req, res) => {
  try {
    const resultado = await fn({ ...req.body, ...req.params });
    res.json(resultado);
  } catch (err) {
    // Devolve o erro como JSON com código 400 (Bad Request)
    res.status(400).json({ erro: err.message });
  }
};

// ── Registo de nova conta ─────────────────────────────────────
// Cria utilizador com ativo=0 e envia email de confirmação
router.post('/registar', handle(registar));

// ── Login ─────────────────────────────────────────────────────
// Valida credenciais e devolve JWT — só aceita contas com ativo=1
router.post('/login', handle(login));

// ── Pedido de recuperação de senha ────────────────────────────
// Gera token e envia link por email e SMS
router.post('/recuperar-senha', handle(recuperarSenha));

// ── Redefinição de senha ──────────────────────────────────────
// Valida o token do link e guarda a nova senha em hash
// O :token vem no URL, a nova senha vem no body
router.post(
  '/redefinir-senha/:token',
  handle(({ token, senha }) => redefinirSenha({ token, senha }))
);

// ── Confirmação de email ──────────────────────────────────────
// O utilizador chega aqui ao clicar no link do email de registo
// Valida o token e activa a conta (ativo = 1)
// Usa GET porque é chamado directamente pelo browser via link
router.get(
  '/confirmar-email/:token',
  handle(({ token }) => confirmarEmail({ token }))
);

export default router;