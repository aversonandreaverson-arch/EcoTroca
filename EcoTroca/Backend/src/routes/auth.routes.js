
import { Router } from 'express';
import {
  registar,
  login,
  recuperarSenha,
  redefinirSenha,
  confirmarEmail,
} from '../controllers/auth.controller.js';

const router = Router();

// Wrapper assíncrono — apanha erros e devolve sempre JSON limpo.
// Junta req.body e req.params num único objecto para simplificar
// a assinatura das funções no controller.
const handle = (fn) => async (req, res) => {
  try {
    const resultado = await fn({ ...req.body, ...req.params });
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// Registo — cria utilizador com ativo=0 e envia email de confirmação
router.post('/registar', handle(registar));

// Login — só aceita contas com ativo=1 (confirmadas)
router.post('/login', handle(login));

// Recuperação de senha — envia link por email e SMS
router.post('/recuperar-senha', handle(recuperarSenha));

// Redefinição de senha — valida token e guarda nova senha em hash
router.post(
  '/redefinir-senha/:token',
  handle(({ token, senha }) => redefinirSenha({ token, senha }))
);

// Confirmação de email — chamado pelo browser ao clicar no link do email
// Usa GET porque é acedido directamente como URL, não via fetch do frontend
router.get(
  '/confirmarEmail/:token',
  handle(({ token }) => confirmarEmail({ token }))
);

export default router;