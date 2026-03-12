//  Funções de autenticação da plataforma EcoTroca Angola:
//  - registar         → cria conta com ativo=0, envia email de confirmação
//  - confirmarEmail   → valida token e activa a conta (ativo=1)
//  - login            → valida credenciais, devolve JWT
//  - recuperarSenha   → envia link de redefinição por email e SMS
//  - redefinirSenha   → valida token e guarda nova senha em hash

import pool           from '../config/database.js';
import { hash as _hash, compare } from 'bcryptjs';
import { gerarToken } from '../utils/jwt.js';
import crypto         from 'crypto';
import nodemailer     from 'nodemailer';
import AfricasTalking from 'africastalking';

// ── Nodemailer: envia emails via conta Gmail ──────────────────
// EMAIL_PASS deve ser uma "palavra-passe de aplicação" do Gmail
// Gerar em: Google Account → Segurança → Verificação em 2 etapas → Palavras-passe de app
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // ex: aversondaniel01@gmail.com
    pass: process.env.EMAIL_PASS, // palavra-passe de app (não a senha normal)
  },
});

// ── Africa's Talking: envia SMS para números angolanos ────────
// AT_USERNAME=sandbox para testes locais
// Em produção substitui pelo nome real da aplicação no painel AT
const AT  = AfricasTalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
const sms = AT.SMS;

// ════════════════════════════════════════════════════════════
//  FUNÇÃO AUXILIAR: enviarEmailConfirmacao
//  Gera um token aleatório seguro, guarda na tabela
//  confirmacaoemail e envia o link por email ao utilizador.
//  Chamada internamente pelo registar — não é uma rota directa.
// ════════════════════════════════════════════════════════════
const enviarEmailConfirmacao = async (id_usuario, email, nome) => {

  // Gera token hexadecimal de 64 caracteres (32 bytes aleatórios)
  const token     = crypto.randomBytes(32).toString('hex');

  // O link de confirmação expira ao fim de 24 horas
  const expiracao = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Apaga tokens anteriores deste utilizador para evitar duplicados na BD
  await pool.query('DELETE FROM confirmacaoemail WHERE id_usuario = ?', [id_usuario]);

  // Guarda o novo token associado ao utilizador
  await pool.query(
    'INSERT INTO confirmacaoemail (id_usuario, token, expira_em) VALUES (?, ?, ?)',
    [id_usuario, token, expiracao]
  );

  // Constrói o link que vai no email — aponta para a página ConfirmarEmail do frontend
  const link = `${process.env.FRONTEND_URL}/ConfirmarEmail/${token}`;

  // Envia o email — erros aqui não bloqueiam o registo, apenas ficam no log
  try {
    await transporter.sendMail({
      from:    `"EcoTroca Angola" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: 'Confirma a tua conta — EcoTroca Angola',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;">
          <h2 style="color:#15803d;">EcoTroca Angola</h2>
          <p>Olá, <strong>${nome}</strong>!</p>
          <p>Obrigado por te registares na plataforma EcoTroca Angola.</p>
          <p>Clica no botão abaixo para confirmar o teu email e activar a tua conta:</p>
          <a href="${link}"
             style="display:inline-block;background:#15803d;color:white;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Confirmar Email
          </a>
          <p style="color:#666;font-size:12px;">
            Este link expira em <strong>24 horas</strong>.<br>
            Se não criaste uma conta no EcoTroca, podes ignorar este email.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
          <p style="color:#aaa;font-size:11px;">EcoTroca Angola — Conectando pessoas pela sustentabilidade</p>
        </div>
      `,
    });
  } catch (errEmail) {
    // Regista o erro mas não interrompe o fluxo — o utilizador pode pedir reenvio
    console.error('Erro ao enviar email de confirmação:', errEmail.message);
  }
};

// ════════════════════════════════════════════════════════════
//  registar
//  POST /api/auth/registar
//
//  Cria a conta do utilizador com ativo=0 (inactiva).
//  A conta só fica activa depois de o utilizador clicar
//  no link de confirmação enviado para o email.
//
//  Cria também os registos associados:
//  - pontuacaousuario  → pontos de reciclagem
//  - recompensausuario → histórico de recompensas
//  - carteira          → saldo (não criada para empresas)
//  - coletador         → perfil de coletador (só tipo 'coletor')
//  - empresarecicladora→ perfil de empresa (só tipo 'empresa')
// ════════════════════════════════════════════════════════════
const registar = async ({
  nome, email, telefone, senha, tipo_usuario,
  provincia, municipio, bairro, bi, data_nascimento,
  horario_abertura, horario_fechamento
}) => {

  // Verifica se já existe uma conta com o mesmo email ou telefone
  const [existe] = await pool.query(
    'SELECT id_usuario FROM usuario WHERE email = ? OR telefone = ?',
    [email || null, telefone]
  );
  if (existe.length > 0) throw new Error('Email ou telefone já registado.');

  // Nunca guardar a senha em texto claro — sempre hash bcrypt com custo 10
  const hash = await _hash(senha, 10);

  // Insere o utilizador com ativo=0 — fica bloqueado até confirmar o email
  const [result] = await pool.query(
    `INSERT INTO usuario
       (nome, email, telefone, senha, tipo_usuario, provincia, municipio, bairro, bi, data_nascimento, ativo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      nome,
      email        || null,
      telefone,
      hash,
      tipo_usuario || 'comum',
      provincia    || null,
      municipio    || null,
      bairro       || null,
      bi           || null,
      data_nascimento || null,
    ]
  );

  const id_usuario = result.insertId;

  // Cria registo de pontuação — começa em zero
  await pool.query('INSERT INTO pontuacaousuario (id_usuario) VALUES (?)', [id_usuario]);

  // Cria registo de recompensas — começa vazio
  await pool.query('INSERT INTO recompensausuario (id_usuario) VALUES (?)', [id_usuario]);

  // Empresas não têm carteira — os pagamentos passam pelo modelo de comissão
  if (tipo_usuario !== 'empresa') {
    await pool.query('INSERT INTO carteira (id_usuario) VALUES (?)', [id_usuario]);
  }

  // Coletadores precisam de um registo extra na tabela coletador
  if (tipo_usuario === 'coletor') {
    await pool.query(
      `INSERT INTO coletador (id_usuario, nome, telefone, tipo) VALUES (?, ?, ?, 'independente')`,
      [id_usuario, nome, telefone]
    );
  }

  // Empresas precisam de um registo extra na tabela empresarecicladora
  if (tipo_usuario === 'empresa') {
    await pool.query(
      `INSERT INTO empresarecicladora
         (id_usuario, nome, telefone, email, horario_abertura, horario_fechamento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, nome, telefone, email || null, horario_abertura || null, horario_fechamento || null]
    );
  }

  // Envia email de confirmação se o utilizador forneceu email
  // Registo sem email (só telefone) fica pendente de activação manual pelo admin
  if (email) await enviarEmailConfirmacao(id_usuario, email, nome);

  // Não devolve token de sessão — o utilizador ainda não está activo
  return {
    mensagem: email
      ? 'Conta criada! Verifica o teu email para activar a conta.'
      : 'Conta criada! Fala com um administrador para activar a tua conta.',
    confirmar_email: !!email, // o frontend usa isto para mostrar aviso apropriado
  };
};

// ════════════════════════════════════════════════════════════
//  confirmarEmail
//  GET /api/auth/confirmar-email/:token
//
//  Recebe o token do link enviado por email.
//  Valida se o token existe e não expirou.
//  Se válido: activa a conta (ativo=1) e apaga o token.
//  Se inválido ou expirado: devolve erro com instrução.
// ════════════════════════════════════════════════════════════
const confirmarEmail = async ({ token }) => {
  if (!token) throw new Error('Token inválido.');

  // Procura o token na BD — só aceita tokens que ainda não expiraram
  const [rows] = await pool.query(
    `SELECT id_usuario FROM confirmacaoemail
     WHERE token = ? AND expira_em > NOW()
     LIMIT 1`,
    [token]
  );

  // Token inválido, já usado ou expirado
  if (!rows.length)
    throw new Error('Este link é inválido ou já expirou. Faz login para receber um novo link de confirmação.');

  const { id_usuario } = rows[0];

  // Activa a conta — agora o utilizador consegue fazer login
  await pool.query('UPDATE usuario SET ativo = 1 WHERE id_usuario = ?', [id_usuario]);

  // Apaga o token para que o mesmo link não possa ser usado novamente
  await pool.query('DELETE FROM confirmacaoemail WHERE token = ?', [token]);

  return { mensagem: 'Email confirmado com sucesso! Já podes fazer login.' };
};

// ════════════════════════════════════════════════════════════
//  login
//  POST /api/auth/login
//
//  Valida email/telefone + senha.
//  A condição ativo=TRUE garante que contas não confirmadas
//  não conseguem entrar — devolve mensagem específica.
//  Devolve JWT com id_usuario e tipo_usuario para o frontend
//  guardar em localStorage e enviar nas chamadas autenticadas.
// ════════════════════════════════════════════════════════════
const login = async ({ email, senha }) => {

  // Procura apenas contas activas — ativo=TRUE bloqueia contas por confirmar
  const [rows] = await pool.query(
    `SELECT * FROM usuario WHERE (email = ? OR telefone = ?) AND ativo = TRUE`,
    [email, email]
  );

  if (rows.length === 0) {

    // Verifica se a conta existe mas ainda não foi confirmada
    // para dar uma mensagem mais útil ao utilizador
    const [inativo] = await pool.query(
      'SELECT id_usuario FROM usuario WHERE email = ? OR telefone = ?',
      [email, email]
    );

    if (inativo.length > 0) {
      // Conta existe mas ativo=0 — falta confirmar o email
      throw new Error('A tua conta ainda não foi activada. Verifica o teu email e clica no link de confirmação.');
    }

    // Conta não existe de todo
    throw new Error('Utilizador não encontrado.');
  }

  const usuario = rows[0];

  // Compara a senha fornecida com o hash guardado na BD
  const senhaCorreta = await compare(senha, usuario.senha);
  if (!senhaCorreta) throw new Error('Senha incorreta.');

  // Gera JWT com os dados mínimos necessários para autenticar pedidos futuros
  const token = gerarToken({ id_usuario: usuario.id_usuario, tipo_usuario: usuario.tipo_usuario });

  return {
    token,
    tipo_usuario: usuario.tipo_usuario,
    nome:         usuario.nome,
    id_usuario:   usuario.id_usuario,
  };
};

// ════════════════════════════════════════════════════════════
//  recuperarSenha
//  POST /api/auth/recuperar-senha
//
//  Aceita email ou telefone. Gera token seguro, guarda na BD
//  e envia link de redefinição por email (Gmail) e por SMS
//  (Africa's Talking). Responde sempre com a mesma mensagem
//  para não revelar se a conta existe (protecção anti-enumeração).
// ════════════════════════════════════════════════════════════
const recuperarSenha = async ({ emailOuTelefone }) => {
  if (!emailOuTelefone) throw new Error('Email ou telefone é obrigatório.');

  // Procura a conta — sem filtro de ativo para permitir recuperação de contas inactivas
  const [rows] = await pool.query(
    'SELECT * FROM usuario WHERE email = ? OR telefone = ? LIMIT 1',
    [emailOuTelefone, emailOuTelefone]
  );

  // Resposta genérica para não revelar se o email/telefone existe na BD
  if (!rows.length)
    return { mensagem: 'Se existir uma conta com esses dados, receberás as instruções.' };

  const usuario   = rows[0];

  // Token aleatório seguro de 64 caracteres, expira em 1 hora
  const token     = crypto.randomBytes(32).toString('hex');
  const expiracao = new Date(Date.now() + 60 * 60 * 1000);

  // Substitui qualquer token anterior — só um link activo por vez
  await pool.query('DELETE FROM recuperacaosenha WHERE id_usuario = ?', [usuario.id_usuario]);
  await pool.query(
    'INSERT INTO recuperacaosenha (id_usuario, token, expira_em) VALUES (?, ?, ?)',
    [usuario.id_usuario, token, expiracao]
  );

  const link = `${process.env.FRONTEND_URL}/RedefinirSenha/${token}`;

  // ── Email de redefinição ──────────────────────────────────
  if (usuario.email) {
    try {
      await transporter.sendMail({
        from:    `"EcoTroca Angola" <${process.env.EMAIL_USER}>`,
        to:      usuario.email,
        subject: 'Recuperação de senha — EcoTroca Angola',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;">
            <h2 style="color:#15803d;">EcoTroca Angola</h2>
            <p>Olá, <strong>${usuario.nome}</strong>!</p>
            <p>Recebemos um pedido para redefinir a senha da tua conta.</p>
            <p>Clica no botão abaixo para criar uma nova senha:</p>
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
        `,
      });
    } catch (e) {
      // Erro no email não bloqueia a resposta — SMS pode ainda chegar
      console.error('Erro ao enviar email de recuperação:', e.message);
    }
  }

  // ── SMS de redefinição via Africa's Talking ───────────────
  if (usuario.telefone) {
    try {
      // Normaliza o número para formato internacional angolano (+244...)
      let tel = usuario.telefone.replace(/\s/g, '');
      if (!tel.startsWith('+')) tel = '+244' + tel.replace(/^0+/, '');

      await sms.send({
        to:      [tel],
        message: `EcoTroca Angola: Redefine a tua senha (válido 1h): ${link}`,
      });
    } catch (e) {
      // Erro no SMS não bloqueia a resposta — email pode já ter chegado
      console.error('Erro ao enviar SMS de recuperação:', e.message);
    }
  }

  return { mensagem: 'Se existir uma conta com esses dados, receberás as instruções.' };
};

// ════════════════════════════════════════════════════════════
//  redefinirSenha
//  POST /api/auth/redefinir-senha/:token
//
//  Valida o token de recuperação, verifica a expiração,
//  guarda o hash da nova senha e apaga o token para
//  impedir reutilização do mesmo link.
// ════════════════════════════════════════════════════════════
const redefinirSenha = async ({ token, senha }) => {

  // A nova senha deve ter pelo menos 6 caracteres
  if (!senha || senha.length < 6)
    throw new Error('A senha deve ter pelo menos 6 caracteres.');

  // Verifica se o token é válido e ainda não expirou
  const [rows] = await pool.query(
    `SELECT id_usuario FROM recuperacaosenha
     WHERE token = ? AND expira_em > NOW()
     LIMIT 1`,
    [token]
  );

  if (!rows.length)
    throw new Error('Este link é inválido ou já expirou. Pede uma nova recuperação de senha.');

  // Hash da nova senha antes de guardar — nunca texto claro
  const hashSenha = await _hash(senha, 10);

  // Actualiza a senha na BD
  await pool.query(
    'UPDATE usuario SET senha = ? WHERE id_usuario = ?',
    [hashSenha, rows[0].id_usuario]
  );

  // Apaga o token — não pode ser reutilizado para redefinir novamente
  await pool.query('DELETE FROM recuperacaosenha WHERE token = ?', [token]);

  return { mensagem: 'Senha redefinida com sucesso! Já podes fazer login.' };
};

export { registar, login, recuperarSenha, redefinirSenha, confirmarEmail };