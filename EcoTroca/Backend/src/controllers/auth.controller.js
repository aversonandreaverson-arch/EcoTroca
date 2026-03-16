// ============================================================
//  auth.controller.js
//  Guardar em: src/controllers/auth.controller.js
//
//  Funções de autenticação da plataforma EcoTroca Angola:
//  - registar       → cria conta com ativo=1 e envia email de boas-vindas
//  - confirmarEmail → mantido por compatibilidade (já não é obrigatório)
//  - login          → valida credenciais e devolve JWT
//  - recuperarSenha → envia link de redefinição por email e SMS
//  - redefinirSenha → valida token e guarda nova senha em hash
// ============================================================

import pool           from '../config/database.js';
import { hash as _hash, compare } from 'bcryptjs';
import { gerarToken }  from '../utils/jwt.js';
import crypto          from 'crypto';
import nodemailer      from 'nodemailer';
import AfricasTalking  from 'africastalking';

// ── Nodemailer: envia emails via conta Gmail ──────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Africa's Talking: envia SMS para números angolanos ────────
const AT  = AfricasTalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
const sms = AT.SMS;


//  Envia email de boas-vindas após o registo bem-sucedido.
const enviarEmailBoasVindas = async (email, nome, tipo_usuario) => {

  // Mensagem personalizada por tipo de conta
  const mensagens = {
  comum: {
    titulo: 'Bem-vindo à EcoTroca Angola!',
    corpo:  `Agora és parte de uma comunidade que transforma resíduos em valor. Podes publicar os teus materiais recicláveis, receber propostas de empresas e ganhar dinheiro enquanto cuidas do ambiente.`,
    cta:    'Começar a Vender',
    link:   `${process.env.FRONTEND_URL}/PaginaInicial`,
  },
  coletor: {
    titulo: 'Bem-vindo à EcoTroca Angola!',
    corpo:  `A tua conta de coletador está activa. Podes agora aceitar pedidos de recolha, gerir as tuas entregas e fazer parte de uma rede que valoriza o trabalho de quem recolhe.`,
    cta:    'Ver Pedidos Disponíveis',
    link:   `${process.env.FRONTEND_URL}/PaginaInicial`,
  },
  empresa: {
    titulo: 'Bem-vinda à EcoTroca Angola!',
    corpo:  `A tua empresa está registada na maior plataforma de reciclagem de Angola. Podes agora encontrar fornecedores de resíduos, gerir entregas e expandir a tua rede de coletadores.`,
    cta:    'Aceder à Plataforma',
    link:   `${process.env.FRONTEND_URL}/PaginaInicialEmpresa`,
  },
};
  

  // Usa o tipo correcto ou cai no comum se não reconhecer
  const m = mensagens[tipo_usuario] || mensagens.comum;

  try {
    await transporter.sendMail({
      from:    `"EcoTroca Angola" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: m.titulo,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;">

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                  <!-- Cabeçalho verde -->
                  <tr>
                    <td style="background:#15803d;padding:36px 40px;text-align:center;">
                      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                        🌿 EcoTroca Angola
                      </h1>
                      <p style="color:#bbf7d0;margin:8px 0 0;font-size:14px;">
                        Conectando pessoas pela sustentabilidade
                      </p>
                    </td>
                  </tr>

                  <!-- Corpo -->
                  <tr>
                    <td style="padding:40px 40px 32px;">
                      <h2 style="color:#14532d;font-size:22px;margin:0 0 16px;">
                        ${m.titulo}
                      </h2>
                      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;">
                        Olá, <strong>${nome}</strong>!
                      </p>
                      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;">
                        ${m.corpo}
                      </p>

                      <!-- Botão CTA -->
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background:#15803d;border-radius:10px;">
                            <a href="${m.link}"
                               style="display:inline-block;color:#ffffff;font-size:15px;font-weight:700;
                                      padding:14px 32px;text-decoration:none;letter-spacing:0.3px;">
                              ${m.cta} →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Destaques da plataforma -->
                  <tr>
                    <td style="padding:0 40px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background:#f0fdf4;border-radius:10px;padding:20px 24px;">
                            <p style="color:#15803d;font-weight:700;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">
                              O que podes fazer na plataforma
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding:4px 0;color:#374151;font-size:14px;">♻️ &nbsp;Publicar e gerir resíduos recicláveis</td>
                              </tr>
                              <tr>
                                <td style="padding:4px 0;color:#374151;font-size:14px;">💰 &nbsp;Receber propostas e ganhar dinheiro</td>
                              </tr>
                              <tr>
                                <td style="padding:4px 0;color:#374151;font-size:14px;">🤝 &nbsp;Conectar com empresas e coletadores</td>
                              </tr>
                              <tr>
                                <td style="padding:4px 0;color:#374151;font-size:14px;">📊 &nbsp;Acompanhar o teu impacto ambiental</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Rodapé -->
                  <tr>
                    <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                      <p style="color:#9ca3af;font-size:12px;margin:0;">
                        EcoTroca Angola — Conectando pessoas pela sustentabilidade<br>
                        Se não criaste esta conta, ignora este email.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>

        </body>
        </html>
      `,
    });
    console.log(`Email de boas-vindas enviado para ${email}`);
  } catch (errEmail) {
    // Erro no email não bloqueia o registo — utilizador já entrou na plataforma
    console.error('Erro ao enviar email de boas-vindas:', errEmail.message);
  }
};

// ════════════════════════════════════════════════════════════
//  registar
//  POST /api/auth/registar
//
//  Cria a conta com ativo=1 — activa imediatamente.
//  O utilizador é redirecionado para a plataforma logo após
//  o cadastro, sem precisar de confirmar o email.
//  Se tiver email, recebe uma mensagem de boas-vindas.
// ════════════════════════════════════════════════════════════
const registar = async ({
  nome, email, telefone, senha, tipo_usuario,
  provincia, municipio, bairro, bi, data_nascimento,
  horario_abertura, horario_fechamento
}) => {

  // Verifica se já existe conta com o mesmo email ou telefone
  const [existe] = await pool.query(
    'SELECT id_usuario FROM usuario WHERE email = ? OR telefone = ?',
    [email || null, telefone]
  );
  if (existe.length > 0) throw new Error('Email ou telefone já registado.');

  // Hash da senha — nunca guardar em texto claro
  const hash = await _hash(senha, 10);

  // Cria a conta com ativo=1 — activa imediatamente após o registo
  const [result] = await pool.query(
    `INSERT INTO usuario
       (nome, email, telefone, senha, tipo_usuario, provincia, municipio, bairro, bi, data_nascimento, ativo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      nome,
      email           || null,
      telefone,
      hash,
      tipo_usuario    || 'comum',
      provincia       || null,
      municipio       || null,
      bairro          || null,
      bi              || null,
      data_nascimento || null,
    ]
  );

  const id_usuario = result.insertId;

  // Cria registos associados ao novo utilizador
  await pool.query('INSERT INTO pontuacaousuario (id_usuario) VALUES (?)', [id_usuario]);
  await pool.query('INSERT INTO recompensausuario (id_usuario) VALUES (?)', [id_usuario]);

  // Carteira só para não-empresas
  if (tipo_usuario !== 'empresa') {
    await pool.query('INSERT INTO carteira (id_usuario) VALUES (?)', [id_usuario]);
  }

  // Registo extra para coletadores
  if (tipo_usuario === 'coletor') {
    await pool.query(
      `INSERT INTO coletador (id_usuario, nome, telefone, tipo) VALUES (?, ?, ?, 'independente')`,
      [id_usuario, nome, telefone]
    );
  }

  // Registo extra para empresas
  if (tipo_usuario === 'empresa') {
    await pool.query(
      `INSERT INTO empresarecicladora
         (id_usuario, nome, telefone, email, horario_abertura, horario_fechamento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, nome, telefone, email || null, horario_abertura || null, horario_fechamento || null]
    );
  }

  // Envia email de boas-vindas em segundo plano — não bloqueia o login
  if (email) enviarEmailBoasVindas(email, nome, tipo_usuario || 'comum');

  // Gera token JWT — utilizador entra directamente na plataforma
  const token = gerarToken({ id_usuario, tipo_usuario: tipo_usuario || 'comum' });

  return {
    token,
    id_usuario,
    tipo_usuario: tipo_usuario || 'comum',
    nome,
  };
};

// ════════════════════════════════════════════════════════════
//  confirmarEmail — mantido por compatibilidade
//  Já não é obrigatório para activar a conta mas pode ser
//  usado futuramente para verificar o email do utilizador.
// ════════════════════════════════════════════════════════════
const confirmarEmail = async ({ token }) => {
  if (!token) throw new Error('Token inválido.');

  const [rows] = await pool.query(
    `SELECT id_usuario FROM confirmacaoemail
     WHERE token = ? AND expira_em > NOW() LIMIT 1`,
    [token]
  );

  if (!rows.length)
    throw new Error('Este link é inválido ou já expirou.');

  await pool.query('UPDATE usuario SET ativo = 1 WHERE id_usuario = ?', [rows[0].id_usuario]);
  await pool.query('DELETE FROM confirmacaoemail WHERE token = ?', [token]);

  return { mensagem: 'Email confirmado com sucesso!' };
};

// ════════════════════════════════════════════════════════════
//  login
//  POST /api/auth/login
// ════════════════════════════════════════════════════════════
const login = async ({ email, senha }) => {

  const [rows] = await pool.query(
    `SELECT * FROM usuario WHERE (email = ? OR telefone = ?) AND ativo = TRUE`,
    [email, email]
  );

  if (rows.length === 0) {
    const [inativo] = await pool.query(
      'SELECT id_usuario FROM usuario WHERE email = ? OR telefone = ?',
      [email, email]
    );
    if (inativo.length > 0)
      throw new Error('A tua conta está inactiva. Contacta o suporte.');
    throw new Error('Utilizador não encontrado.');
  }

  const usuario      = rows[0];
  const senhaCorreta = await compare(senha, usuario.senha);
  if (!senhaCorreta) throw new Error('Senha incorreta.');

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
// ════════════════════════════════════════════════════════════
const recuperarSenha = async ({ emailOuTelefone }) => {
  if (!emailOuTelefone) throw new Error('Email ou telefone é obrigatório.');

  const [rows] = await pool.query(
    'SELECT * FROM usuario WHERE email = ? OR telefone = ? LIMIT 1',
    [emailOuTelefone, emailOuTelefone]
  );

  if (!rows.length)
    return { mensagem: 'Se existir uma conta com esses dados, receberás as instruções.' };

  const usuario   = rows[0];
  const token     = crypto.randomBytes(32).toString('hex');
  const expiracao = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await pool.query('DELETE FROM recuperacaosenha WHERE id_usuario = ?', [usuario.id_usuario]);
  await pool.query(
    'INSERT INTO recuperacaosenha (id_usuario, token, expira_em) VALUES (?, ?, ?)',
    [usuario.id_usuario, token, expiracao]
  );

  const link = `${process.env.FRONTEND_URL}/RedefinirSenha/${token}`;

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
            <a href="${link}"
               style="display:inline-block;background:#15803d;color:white;padding:12px 24px;
                      border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
              Redefinir Senha
            </a>
            <p style="color:#666;font-size:12px;">Expira em <strong>1 hora</strong>.</p>
          </div>
        `,
      });
    } catch (e) { console.error('Erro ao enviar email de recuperação:', e.message); }
  }

  if (usuario.telefone) {
    try {
      let tel = usuario.telefone.replace(/\s/g, '');
      if (!tel.startsWith('+')) tel = '+244' + tel.replace(/^0+/, '');
      await sms.send({ to: [tel], message: `EcoTroca Angola: Redefine a tua senha (1h): ${link}` });
    } catch (e) { console.error('Erro ao enviar SMS de recuperação:', e.message); }
  }

  return { mensagem: 'Se existir uma conta com esses dados, receberás as instruções.' };
};

// ════════════════════════════════════════════════════════════
//  redefinirSenha
//  POST /api/auth/redefinir-senha/:token
// ════════════════════════════════════════════════════════════
const redefinirSenha = async ({ token, senha }) => {
  if (!senha || senha.length < 6)
    throw new Error('A senha deve ter pelo menos 6 caracteres.');

  const [rows] = await pool.query(
    `SELECT id_usuario FROM recuperacaosenha
     WHERE token = ? AND expira_em > NOW() LIMIT 1`,
    [token]
  );

  if (!rows.length)
    throw new Error('Este link é inválido ou já expirou. Pede uma nova recuperação de senha.');

  const hashSenha = await _hash(senha, 10);
  await pool.query('UPDATE usuario SET senha = ? WHERE id_usuario = ?', [hashSenha, rows[0].id_usuario]);
  await pool.query('DELETE FROM recuperacaosenha WHERE token = ?', [token]);

  return { mensagem: 'Senha redefinida com sucesso! Já podes fazer login.' };
};

export { registar, login, recuperarSenha, redefinirSenha, confirmarEmail };