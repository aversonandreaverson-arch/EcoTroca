
//  Recebe o pedido HTTP, chama o service e devolve a resposta
//  Toda a lógica de negócio está no auth.service.js


import {
  registar      as registarService,
  login         as loginService,
  recuperarSenha as recuperarSenhaService,
  redefinirSenha as redefinirSenhaService,
} from '../services/auth.service.js';

// ── POST /api/auth/registar ───────────────────────────────────
const registar = async (req, res) => {
  try {
    const resultado = await registarService(req.body);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────
const login = async (req, res) => {
  try {
    const resultado = await loginService(req.body);
    res.json(resultado);
  } catch (err) {
    res.status(401).json({ erro: err.message });
  }
};

// ── POST /api/auth/recuperar-senha ────────────────────────────
// Recebe emailOuTelefone e dispara email + SMS com o link de redefinição
const recuperarSenha = async (req, res) => {
  try {
    const resultado = await recuperarSenhaService(req.body);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// ── POST /api/auth/redefinir-senha/:token ─────────────────────
// Recebe o token da URL + nova senha no body
const redefinirSenha = async (req, res) => {
  try {
    // Junto o token da URL com a senha do body e passo ao service
    const resultado = await redefinirSenhaService({ token: req.params.token, senha: req.body.senha });
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

export { registar, login, recuperarSenha, redefinirSenha };