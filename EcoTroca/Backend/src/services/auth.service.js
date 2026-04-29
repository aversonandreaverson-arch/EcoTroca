
//  Funções:
//    registar          → cria utilizador inactivo + envia email de confirmação
//    confirmarEmail    → activa a conta após o utilizador clicar no link
//    login             → só deixa entrar se ativo = 1
//    recuperarSenha    → gera token + envia email + SMS (Africa's Talking)
//    redefinirSenha    → valida token + guarda hash da nova senha
//
//  Fluxo de registo:
//    1. Utilizador preenche o formulário
//    2. Backend cria conta com ativo = 0
//    3. Backend envia email com link de confirmação
//    4. Utilizador clica no link → ativo passa a 1
//    5. Utilizador já pode fazer login
// ============================================================

import pool             from '../config/database.js';
import { hash as _hash, compare } from 'bcryptjs';
import { gerarToken }   from '../utils/jwt.js';
import crypto           from 'crypto';
import nodemailer       from 'nodemailer';
import AfricasTalking   from 'africastalking';

// ── Configuração do nodemailer (Gmail) ────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Configuração do Africa's Talking (SMS) ────────────────────
const AT  = AfricasTalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
const sms = AT.SMS;

// ── Função auxiliar para enviar email ────────────────────────
// Reutilizada no registo e na recuperação de senha
const enviarEmail = async (para, assunto, html) => {
  try {
    await transporter.sendMail({
      from: `"EcoTroca Angola" <${process.env.EMAIL_USER}>`,
      to:   para,
      subject: assunto,
      html,
    });
  } catch (err) {
    console.error('Erro ao enviar email:', err.message);
  }
};

// ── registar ─────────────────────────────────────────────────
// Cria utilizador com ativo = 0 e envia email de confirmação
// A conta só fica activa após o utilizador clicar no link do email
const registar = async ({
  nome, email, telefone, senha, tipo_usuario,
  provincia, municipio, bairro, bi, data_nascimento,
  horario_abertura, horario_fechamento
}) => {

  // Verifico se o email ou telefone já estão registados
  const [existe] = await pool.query(
    'SELECT id_usuario FROM Usuario WHERE email = ? OR telefone = ?',
    [email || null, telefone]
  );
  if (existe.length > 0) throw new Error('Email ou telefone já registado.');

  // Hash da senha — nunca guardar em texto claro
  const hash = await _hash(senha, 10);

  // Insiro o utilizador com ativo = 0 — fica inactivo até confirmar o email
  const [result] = await pool.query(
    `INSERT INTO Usuario
       (nome, email, telefone, senha, tipo_usuario, provincia, municipio, bairro, bi, data_nascimento, ativo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      nome, email || null, telefone, hash,
      tipo_usuario || 'comum',
      provincia || null, municipio || null,
      bairro || null, bi || null,
      data_nascimento || null,
    ]
  );

  const id_usuario = result.insertId;

  // Crio as tabelas associadas ao novo utilizador
  await pool.query('INSERT INTO PontuacaoUsuario (id_usuario) VALUES (?)', [id_usuario]);
  await pool.query('INSERT INTO RecompensaUsuario (id_usuario) VALUES (?)', [id_usuario]);

  // Carteira só para não-empresas
  if (tipo_usuario !== 'empresa') {
    await pool.query('INSERT INTO Carteira (id_usuario) VALUES (?)', [id_usuario]);
  }

  // Registo extra para coletadores
  if (tipo_usuario === 'coletor') {
    await pool.query(
      `INSERT INTO Coletador (id_usuario, nome, telefone, tipo) VALUES (?, ?, ?, 'independente')`,
      [id_usuario, nome, telefone]
    );
  }

  // Registo extra para empresas
  if (tipo_usuario === 'empresa') {
    await pool.query(
      `INSERT INTO EmpresaRecicladora
         (id_usuario, nome, telefone, email, horario_abertura, horario_fechamento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, nome, telefone, email || null, horario_abertura || null, horario_fechamento || null]
    );
  }

  // ── Envio do email de confirmação ────────────────────────
  if (email) {
    // Gero token aleatório seguro de 32 bytes
    const token     = crypto.randomBytes(32).toString('hex');
    const expiracao = new Date(Date.now() + 24 * 60 * 60 * 1000); // expira em 24 horas

    // Guardo o token na tabela ConfirmacaoEmail
    await pool.query(
      'INSERT INTO ConfirmacaoEmail (id_usuario, token, expira_em) VALUES (?, ?, ?)',
      [id_usuario, token, expiracao]
    );

    // Link de confirmação que vai no email
    const link = `${process.env.FRONTEND_URL}/ConfirmarEmail/${token}`;

    await enviarEmail(
      email,
      '✅ Confirma o teu email — EcoTroca Angola',
      `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;">
          <h2 style="color:#15803d;">EcoTroca Angola</h2>
          <p>Olá, <strong>${nome}</strong>! Bem-vindo à plataforma.</p>
          <p>Clica no botão abaixo para activar a tua conta:</p>
          <a href="${link}"
             style="display:inline-block;background:#15803d;color:white;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Activar Conta
          </a>
          <p style="color:#666;font-size:12px;">
            Este link expira em <strong>24 horas</strong>.<br>
            Se não criaste esta conta, ignora este email.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
          <p style="color:#aaa;font-size:11px;">EcoTroca Angola — Conectando pessoas pela sustentabilidade</p>
        </div>
      `
    );
  }

  // Não devolvo token JWT aqui — o utilizador tem de confirmar o email primeiro
  return {
    mensagem: 'Conta criada com sucesso! Verifica o teu email para activar a conta.',
    id_usuario,
  };
};

// ── confirmarEmail ────────────────────────────────────────────
// Activa a conta do utilizador após clicar no link do email
// Muda ativo de 0 para 1 na tabela Usuario
const confirmarEmail = async ({ token }) => {
  if (!token) throw new Error('Token inválido.');

  // Verifico se o token existe e ainda não expirou
  const [rows] = await pool.query(
    `SELECT id_usuario FROM ConfirmacaoEmail
     WHERE token = ? AND expira_em > NOW()
     LIMIT 1`,
    [token]
  );

  if (!rows.length) {
    throw new Error('Este link é inválido ou já expirou. Faz um novo registo ou pede um novo link.');
  }

  // Activo a conta — ativo passa de 0 para 1
  await pool.query(
    'UPDATE Usuario SET ativo = 1 WHERE id_usuario = ?',
    [rows[0].id_usuario]
  );

  // Apago o token — não pode ser reutilizado
  await pool.query('DELETE FROM ConfirmacaoEmail WHERE token = ?', [token]);

  return { mensagem: 'Email confirmado com sucesso! Já podes fazer login.' };
};

// ── login ─────────────────────────────────────────────────────
// Só deixa entrar utilizadores com ativo = 1
// Se ativo = 0 → conta ainda não foi confirmada por email
const login = async ({ email, senha }) => {

  const [rows] = await pool.query(
    `SELECT * FROM Usuario WHERE (email = ? OR telefone = ?)`,
    [email, email]
  );

  if (rows.length === 0) throw new Error('Utilizador não encontrado.');

  const usuario = rows[0];

  // Verifico se a conta está activa — se não → email ainda não confirmado
  if (!usuario.ativo) {
    throw new Error('A tua conta ainda não foi activada. Verifica o teu email e clica no link de confirmação.');
  }

  // Verifico se a conta está suspensa temporariamente
  if (usuario.suspenso_ate && new Date(usuario.suspenso_ate) > new Date()) {
    throw new Error(`Conta suspensa até ${new Date(usuario.suspenso_ate).toLocaleDateString('pt-AO')}.`);
  }

  // Verifico se a conta está bloqueada permanentemente
  if (usuario.bloqueado_permanente) {
    throw new Error('Esta conta foi bloqueada permanentemente.');
  }

  const senhaCorreta = await compare(senha, usuario.senha);
  if (!senhaCorreta) throw new Error('Senha incorreta.');

  const token = gerarToken({ id_usuario: usuario.id_usuario, tipo_usuario: usuario.tipo_usuario });
  return { token, tipo_usuario: usuario.tipo_usuario, nome: usuario.nome, id_usuario: usuario.id_usuario };
};

// ── recuperarSenha ────────────────────────────────────────────
// Gera token + envia email + SMS com link de redefinição
const recuperarSenha = async ({ emailOuTelefone }) => {
  if (!emailOuTelefone) throw new Error('Email ou telefone é obrigatório.');

  const [rows] = await pool.query(
    'SELECT * FROM Usuario WHERE email = ? OR telefone = ? LIMIT 1',
    [emailOuTelefone, emailOuTelefone]
  );

  // Respondo sempre com sucesso para não revelar se a conta existe
  if (!rows.length) return { mensagem: 'Se existir uma conta com esses dados, receberás as instruções.' };

  const usuario = rows[0];

  // Gero token aleatório de 32 bytes
  const token     = crypto.randomBytes(32).toString('hex');
  const expiracao = new Date(Date.now() + 60 * 60 * 1000); // expira em 1 hora

  await pool.query('DELETE FROM RecuperacaoSenha WHERE id_usuario = ?', [usuario.id_usuario]);
  await pool.query(
    'INSERT INTO RecuperacaoSenha (id_usuario, token, expira_em) VALUES (?, ?, ?)',
    [usuario.id_usuario, token, expiracao]
  );

  const link = `${process.env.FRONTEND_URL}/RedefinirSenha/${token}`;

  // Envio email se o utilizador tiver email registado
  if (usuario.email) {
    await enviarEmail(
      usuario.email,
      '🔒 Recuperação de senha — EcoTroca Angola',
      `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;">
          <h2 style="color:#15803d;">EcoTroca Angola</h2>
          <p>Olá, <strong>${usuario.nome}</strong>!</p>
          <p>Recebemos um pedido para redefinir a senha da tua conta.</p>
          <a href="${link}"
             style="display:inline-block;background:#15803d;color:white;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Redefinir Senha
          </a>
          <p style="color:#666;font-size:12px;">
            Este link expira em <strong>1 hora</strong>.<br>
            Se não pediste a recuperação, ignora este email.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
          <p style="color:#aaa;font-size:11px;">EcoTroca Angola — Conectando pessoas pela sustentabilidade</p>
        </div>
      `
    );
  }

  // Envio SMS se o utilizador tiver telefone registado
  if (usuario.telefone) {
    try {
      let telefone = usuario.telefone.replace(/\s/g, '');
      if (!telefone.startsWith('+')) {
        telefone = '+244' + telefone.replace(/^0+/, '');
      }
      await sms.send({
        to:      [telefone],
        message: `EcoTroca Angola: Redefine a tua senha (valido 1h): ${link}`,
      });
    } catch (errSMS) {
      console.error('Erro ao enviar SMS:', errSMS.message);
    }
  }

  return { mensagem: 'Se existir uma conta com esses dados, receberás as instruções.' };
};

// ── redefinirSenha ────────────────────────────────────────────
// Valida token + guarda hash da nova senha
const redefinirSenha = async ({ token, senha }) => {
  if (!senha || senha.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');

  const [rows] = await pool.query(
    `SELECT id_usuario FROM RecuperacaoSenha
     WHERE token = ? AND expira_em > NOW()
     LIMIT 1`,
    [token]
  );

  if (!rows.length) throw new Error('Este link é inválido ou já expirou. Pede uma nova recuperação de senha.');

  // Hash da nova senha
  const hashSenha = await _hash(senha, 10);

  await pool.query('UPDATE Usuario SET senha = ? WHERE id_usuario = ?', [hashSenha, rows[0].id_usuario]);

  // Apago o token — não pode ser reutilizado
  await pool.query('DELETE FROM RecuperacaoSenha WHERE token = ?', [token]);

  return { mensagem: 'Senha redefinida com sucesso! Já podes fazer login.' };
};

export { registar, confirmarEmail, login, recuperarSenha, redefinirSenha };