
import pool          from '../config/database.js';
import { hash as _hash, compare } from 'bcryptjs';
import { gerarToken } from '../utils/jwt.js';
import crypto        from 'crypto';
import nodemailer    from 'nodemailer';
import AfricasTalking from 'africastalking';

// ── Configuração do nodemailer (Gmail) ────────────────────────
// EMAIL_PASS deve ser uma "palavra-passe de aplicação" do Gmail
// Gerar em: Google Account → Segurança → Verificação em 2 etapas → Palavras-passe de app
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Configuração do Africa's Talking (SMS) ────────────────────
// AT_USERNAME=sandbox para testes, nome real da app em produção
const AT  = AfricasTalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
const sms = AT.SMS;

// ── registar ─────────────────────────────────────────────────
// Cria o utilizador na tabela Usuario + tabelas associadas
// A senha é sempre guardada como hash bcrypt — nunca em texto claro
const registar = async ({
  nome, email, telefone, senha, tipo_usuario,
  provincia, municipio, bairro, bi, data_nascimento,
  horario_abertura, horario_fechamento
}) => {

  const [existe] = await pool.query(
    'SELECT id_usuario FROM Usuario WHERE email = ? OR telefone = ?',
    [email || null, telefone]
  );
  if (existe.length > 0) throw new Error('Email ou telefone já registado.');

  // Hash da senha — nunca guardar em texto claro
  const hash = await _hash(senha, 10);

  const [result] = await pool.query(
    `INSERT INTO Usuario
       (nome, email, telefone, senha, tipo_usuario, provincia, municipio, bairro, bi, data_nascimento)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

  const token = gerarToken({ id_usuario, tipo_usuario: tipo_usuario || 'comum' });
  return { token, id_usuario, tipo_usuario: tipo_usuario || 'comum', nome };
};

// ── login ─────────────────────────────────────────────────────
// Valida email/telefone + senha e devolve JWT
const login = async ({ email, senha }) => {

  const [rows] = await pool.query(
    `SELECT * FROM Usuario WHERE (email = ? OR telefone = ?) AND ativo = TRUE`,
    [email, email]
  );

  if (rows.length === 0) throw new Error('Utilizador não encontrado.');

  const usuario      = rows[0];
  const senhaCorreta = await compare(senha, usuario.senha);
  if (!senhaCorreta) throw new Error('Senha incorreta.');

  const token = gerarToken({ id_usuario: usuario.id_usuario, tipo_usuario: usuario.tipo_usuario });
  return { token, tipo_usuario: usuario.tipo_usuario, nome: usuario.nome, id_usuario: usuario.id_usuario };
};

// ── recuperarSenha ────────────────────────────────────────────
// Gera token aleatório + envia email + SMS com o link de redefinição
// Funciona para todos os tipos de conta — comum, coletor, empresa, admin
const recuperarSenha = async ({ emailOuTelefone }) => {
  if (!emailOuTelefone) throw new Error('Email ou telefone é obrigatório.');

  // Procuro o utilizador por email ou telefone — qualquer tipo de conta
  const [rows] = await pool.query(
    'SELECT * FROM Usuario WHERE email = ? OR telefone = ? LIMIT 1',
    [emailOuTelefone, emailOuTelefone]
  );

  // Respondo sempre com sucesso para não revelar se a conta existe (segurança)
  if (!rows.length) return { mensagem: 'Se existir uma conta com esses dados, receberás as instruções.' };

  const usuario = rows[0];

  // Gero token aleatório seguro de 32 bytes em hexadecimal
  const token     = crypto.randomBytes(32).toString('hex');
  const expiracao = new Date(Date.now() + 60 * 60 * 1000); // expira em 1 hora

  // Apago tokens antigos deste utilizador e guardo o novo
  await pool.query('DELETE FROM RecuperacaoSenha WHERE id_usuario = ?', [usuario.id_usuario]);
  await pool.query(
    'INSERT INTO RecuperacaoSenha (id_usuario, token, expira_em) VALUES (?, ?, ?)',
    [usuario.id_usuario, token, expiracao]
  );

  // Link de redefinição que vai no email e no SMS
  const link = `${process.env.FRONTEND_URL}/RedefinirSenha/${token}`;

  // ── Email via Gmail ───────────────────────────────────────
  if (usuario.email) {
    try {
      await transporter.sendMail({
        from:    `"EcoTroca Angola" <${process.env.EMAIL_USER}>`,
        to:      usuario.email,
        subject: ' Recuperação de senha — EcoTroca Angola',
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
    } catch (errEmail) {
      // Erro no email não bloqueia o SMS
      console.error('Erro ao enviar email:', errEmail.message);
    }
  }

  // ── SMS via Africa's Talking ──────────────────────────────
  if (usuario.telefone) {
    try {
      // Formato Angola: +244 seguido do número sem zeros iniciais
      let telefone = usuario.telefone.replace(/\s/g, '');
      if (!telefone.startsWith('+')) {
        telefone = '+244' + telefone.replace(/^0+/, '');
      }

      await sms.send({
        to:      [telefone],
        message: `EcoTroca Angola: Redefine a tua senha (valido 1h): ${link}`,
      });
    } catch (errSMS) {
      // Erro no SMS não bloqueia a resposta
      console.error('Erro ao enviar SMS:', errSMS.message);
    }
  }

  return { mensagem: 'Se existir uma conta com esses dados, receberás as instruções.' };
};

// ── redefinirSenha ────────────────────────────────────────────
// Valida o token, verifica expiração e guarda o hash da nova senha
const redefinirSenha = async ({ token, senha }) => {
  if (!senha || senha.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');

  // Verifico se o token existe e ainda não expirou
  const [rows] = await pool.query(
    `SELECT id_usuario FROM RecuperacaoSenha
     WHERE token = ? AND expira_em > NOW()
     LIMIT 1`,
    [token]
  );

  if (!rows.length) throw new Error('Este link é inválido ou já expirou. Pede uma nova recuperação de senha.');

  // Hash da nova senha — nunca guardar em texto claro
  const hashSenha = await _hash(senha, 10);

  // Actualizo a senha na BD
  await pool.query('UPDATE Usuario SET senha = ? WHERE id_usuario = ?', [hashSenha, rows[0].id_usuario]);

  // Apago o token — não pode ser reutilizado
  await pool.query('DELETE FROM RecuperacaoSenha WHERE token = ?', [token]);

  return { mensagem: 'Senha redefinida com sucesso! Já podes fazer login.' };
};

export { registar, login, recuperarSenha, redefinirSenha };