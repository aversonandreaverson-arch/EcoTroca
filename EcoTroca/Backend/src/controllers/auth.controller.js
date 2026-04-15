
import pool           from '../config/database.js';
import { hash as _hash, compare } from 'bcryptjs';
import { gerarToken }  from '../utils/jwt.js';
import crypto          from 'crypto';
import nodemailer      from 'nodemailer';
import AfricasTalking  from 'africastalking';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const AT  = AfricasTalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
const sms = AT.SMS;

const enviarEmailBoasVindas = async (email, nome, tipo_usuario) => {
  const mensagens = {
    comum: {
      titulo: 'Bem-vindo à EcoTroca Angola!',
      corpo:  'Agora és parte de uma comunidade que transforma resíduos em valor.',
      cta:    'Começar a Vender',
      link:   `${process.env.FRONTEND_URL}/PaginaInicial`,
    },
    coletor: {
      titulo: 'Bem-vindo à EcoTroca Angola!',
      corpo:  'A tua conta de coletador está activa. Podes agora aceitar pedidos de recolha.',
      cta:    'Ver Pedidos Disponíveis',
      link:   `${process.env.FRONTEND_URL}/PaginaInicial`,
    },
    empresa: {
      titulo: 'Bem-vinda à EcoTroca Angola!',
      corpo:  'A tua empresa está registada na maior plataforma de reciclagem de Angola.',
      cta:    'Aceder à Plataforma',
      link:   `${process.env.FRONTEND_URL}/PaginaInicialEmpresa`,
    },
  };
  const m = mensagens[tipo_usuario] || mensagens.comum;
  try {
    await transporter.sendMail({
      from: `"EcoTroca Angola" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: m.titulo,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f0fdf4;padding:40px 20px;">
          <div style="background:#fff;border-radius:16px;overflow:hidden;">
            <div style="background:#15803d;padding:36px 40px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:26px;">🌿 EcoTroca Angola</h1>
            </div>
            <div style="padding:40px;">
              <h2 style="color:#14532d;">${m.titulo}</h2>
              <p style="color:#374151;">Olá, <strong>${nome}</strong>!</p>
              <p style="color:#374151;">${m.corpo}</p>
              <a href="${m.link}" style="display:inline-block;background:#15803d;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;">${m.cta} →</a>
            </div>
            <div style="background:#f9fafb;padding:20px 40px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;">EcoTroca Angola — Se não criaste esta conta, ignora este email.</p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Erro ao enviar email de boas-vindas:', err.message);
  }
};

// Envia email a empresa a pedir confirmacao do coletador dependente
const enviarEmailConfirmacaoEmpresa = async (emailEmpresa, nomeEmpresa, nomeColetador, telefoneColetador) => {
  if (!emailEmpresa) return; // empresa pode nao ter email
  try {
    await transporter.sendMail({
      from: `"EcoTroca Angola" <${process.env.EMAIL_USER}>`,
      to: emailEmpresa,
      subject: `EcoTroca — ${nomeColetador} diz trabalhar para a tua empresa`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f0fdf4;padding:40px 20px;">
          <div style="background:#fff;border-radius:16px;overflow:hidden;">
            <div style="background:#15803d;padding:36px 40px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:26px;">🌿 EcoTroca Angola</h1>
            </div>
            <div style="padding:40px;">
              <h2 style="color:#14532d;">Novo coletador aguarda confirmação</h2>
              <p style="color:#374151;">Olá, <strong>${nomeEmpresa}</strong>!</p>
              <p style="color:#374151;">
                <strong>${nomeColetador}</strong> (tel: ${telefoneColetador}) registou-se na plataforma EcoTroca
                e indicou que trabalha para a tua empresa.
              </p>
              <p style="color:#374151;">
                Acede ao teu <strong>Dashboard</strong> para confirmar ou recusar este pedido.
                Enquanto não confirmares, a conta do coletador permanece inactiva.
              </p>
              <a href="${process.env.FRONTEND_URL}/DashboardEmpresa"
                style="display:inline-block;background:#15803d;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;">
                Ir ao Dashboard →
              </a>
            </div>
            <div style="background:#f9fafb;padding:20px 40px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;">EcoTroca Angola</p>
            </div>
          </div>
        </div>
      `,
    });
    console.log(`Email de confirmacao enviado para empresa: ${emailEmpresa}`);
  } catch (err) {
    console.error('Erro ao enviar email de confirmacao a empresa:', err.message);
  }
};

// ════════════════════════════════════════════════════════════
//  registar
// ════════════════════════════════════════════════════════════
const registar = async ({
  nome, email, telefone, senha, tipo_usuario,
  provincia, municipio, bairro, bi, data_nascimento,
  horario_abertura, horario_fechamento,
  // Campos especificos do coletador
  tipo_coletador, // 'dependente' | 'independente'
  id_empresa,     // id da empresa (so para dependente)
  ativo,          // false se dependente (aguarda confirmacao da empresa)
}) => {

  // Verifica se ja existe conta com o mesmo email ou telefone
  const [existe] = await pool.query(
    'SELECT id_usuario FROM usuario WHERE email = ? OR telefone = ?',
    [email || null, telefone]
  );
  if (existe.length > 0) throw new Error('Email ou telefone já registado.');

  const hash = await _hash(senha, 10);

  // Determina se a conta fica activa imediatamente ou nao
  // Coletador dependente fica inactivo ate a empresa confirmar
  // Todos os outros ficam activos imediatamente
  const contaActiva = tipo_usuario === 'coletor' && tipo_coletador === 'dependente'
    ? 0  // inactivo — aguarda confirmacao da empresa
    : 1; // activo imediatamente

  const [result] = await pool.query(
    `INSERT INTO usuario
       (nome, email, telefone, senha, tipo_usuario, provincia, municipio, bairro, bi, data_nascimento, ativo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      contaActiva,    // 0 ou 1 consoante o tipo
    ]
  );

  const id_usuario = result.insertId;

  // Registos associados ao novo utilizador
  await pool.query('INSERT INTO pontuacaousuario (id_usuario) VALUES (?)', [id_usuario]);
  await pool.query('INSERT INTO recompensausuario (id_usuario) VALUES (?)', [id_usuario]);

  if (tipo_usuario !== 'empresa') {
    await pool.query('INSERT INTO carteira (id_usuario) VALUES (?)', [id_usuario]);
  }

  // Registo do coletador — guarda tipo e id_empresa se dependente
  if (tipo_usuario === 'coletor') {
    const tipoFinal    = tipo_coletador || 'independente';
    const idEmpresaFinal = tipoFinal === 'dependente' ? (id_empresa || null) : null;

    await pool.query(
      `INSERT INTO coletador (id_usuario, nome, telefone, tipo, id_empresa)
       VALUES (?, ?, ?, ?, ?)`,
      [id_usuario, nome, telefone, tipoFinal, idEmpresaFinal]
    );

    // Se for dependente, notifica a empresa dentro da plataforma
    // e envia email a empresa pedindo confirmacao
    if (tipoFinal === 'dependente' && idEmpresaFinal) {
      try {
        // Busca dados da empresa para notificar
        const [empRows] = await pool.query(
          'SELECT id_usuario, nome, email FROM empresarecicladora WHERE id_empresa = ?',
          [idEmpresaFinal]
        );

        if (empRows.length > 0) {
          const empresa = empRows[0];

          // Notificacao dentro da plataforma para a empresa
          await pool.query(
            `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
             VALUES (?, 'Novo coletador aguarda confirmacao', ?, 'sistema')`,
            [
              empresa.id_usuario,
              `${nome} (tel: ${telefone}) disse que trabalha para a tua empresa e aguarda confirmacao. Vai ao teu Dashboard para confirmar ou recusar.`,
            ]
          );

          // Email a empresa (em segundo plano)
          enviarEmailConfirmacaoEmpresa(empresa.email, empresa.nome, nome, telefone);
        }
      } catch (errNotif) {
        // Nao bloqueia o registo se a notificacao falhar
        console.error('Erro ao notificar empresa:', errNotif.message);
      }
    }
  }

  // Registo da empresa
  if (tipo_usuario === 'empresa') {
    await pool.query(
      `INSERT INTO empresarecicladora
         (id_usuario, nome, telefone, email, horario_abertura, horario_fechamento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, nome, telefone, email || null, horario_abertura || null, horario_fechamento || null]
    );
  }

  // Coletador dependente — conta inactiva
  // Nao gera token nem envia para a plataforma
  // O frontend redireciona para o Login com mensagem explicativa
  if (tipo_usuario === 'coletor' && tipo_coletador === 'dependente') {
    return {
      mensagem:     'Conta criada. Aguarda confirmacao da empresa para poderes entrar.',
      tipo_usuario: 'coletor',
      dependente:   true,
      nome,
    };
  }

  // Para todos os outros — envia email e gera token
  if (email) enviarEmailBoasVindas(email, nome, tipo_usuario || 'comum');

  const token = gerarToken({ id_usuario, tipo_usuario: tipo_usuario || 'comum' });

  return { token, id_usuario, tipo_usuario: tipo_usuario || 'comum', nome };
};

// ════════════════════════════════════════════════════════════
//  confirmarEmail — mantido por compatibilidade
// ════════════════════════════════════════════════════════════
const confirmarEmail = async ({ token }) => {
  if (!token) throw new Error('Token inválido.');
  const [rows] = await pool.query(
    'SELECT id_usuario FROM confirmacaoemail WHERE token = ? AND expira_em > NOW() LIMIT 1',
    [token]
  );
  if (!rows.length) throw new Error('Este link é inválido ou já expirou.');
  await pool.query('UPDATE usuario SET ativo = 1 WHERE id_usuario = ?', [rows[0].id_usuario]);
  await pool.query('DELETE FROM confirmacaoemail WHERE token = ?', [token]);
  return { mensagem: 'Email confirmado com sucesso!' };
};

// ════════════════════════════════════════════════════════════
//  login
// ════════════════════════════════════════════════════════════
const login = async ({ email, senha }) => {
  const [rows] = await pool.query(
    'SELECT * FROM usuario WHERE (email = ? OR telefone = ?) AND ativo = TRUE',
    [email, email]
  );

  if (rows.length === 0) {
    // Verifica se existe mas esta inactivo
    const [inativo] = await pool.query(
      'SELECT id_usuario, tipo_usuario FROM usuario WHERE email = ? OR telefone = ?',
      [email, email]
    );
    if (inativo.length > 0) {
      // Mensagem especifica para coletador dependente inactivo
      const [coletRows] = await pool.query(
        `SELECT c.tipo FROM coletador c
         INNER JOIN usuario u ON u.id_usuario = c.id_usuario
         WHERE u.id_usuario = ? AND c.tipo = 'dependente'`,
        [inativo[0].id_usuario]
      );
      if (coletRows.length > 0) {
        throw new Error('A tua conta ainda nao foi confirmada pela empresa. Aguarda a confirmacao para poderes entrar.');
      }
      throw new Error('A tua conta está inactiva. Contacta o suporte.');
    }
    throw new Error('Utilizador não encontrado.');
  }

  const usuario      = rows[0];
  const senhaCorreta = await compare(senha, usuario.senha);
  if (!senhaCorreta) throw new Error('Senha incorreta.');

  const token = gerarToken({ id_usuario: usuario.id_usuario, tipo_usuario: usuario.tipo_usuario });

  return { token, tipo_usuario: usuario.tipo_usuario, nome: usuario.nome, id_usuario: usuario.id_usuario };
};

// ════════════════════════════════════════════════════════════
//  recuperarSenha
// ════════════════════════════════════════════════════════════
const recuperarSenha = async ({ emailOuTelefone }) => {
  if (!emailOuTelefone) throw new Error('Email ou telefone é obrigatório.');
  const [rows] = await pool.query(
    'SELECT * FROM usuario WHERE email = ? OR telefone = ? LIMIT 1',
    [emailOuTelefone, emailOuTelefone]
  );
  if (!rows.length) return { mensagem: 'Se existir uma conta com esses dados, receberás as instruções.' };

  const usuario   = rows[0];
  const token     = crypto.randomBytes(32).toString('hex');
  const expiracao = new Date(Date.now() + 60 * 60 * 1000);

  await pool.query('DELETE FROM recuperacaosenha WHERE id_usuario = ?', [usuario.id_usuario]);
  await pool.query('INSERT INTO recuperacaosenha (id_usuario, token, expira_em) VALUES (?, ?, ?)',
    [usuario.id_usuario, token, expiracao]);

  const link = `${process.env.FRONTEND_URL}/RedefinirSenha/${token}`;

  if (usuario.email) {
    try {
      await transporter.sendMail({
        from: `"EcoTroca Angola" <${process.env.EMAIL_USER}>`,
        to: usuario.email,
        subject: 'Recuperação de senha — EcoTroca Angola',
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;">
          <h2 style="color:#15803d;">EcoTroca Angola</h2>
          <p>Olá, <strong>${usuario.nome}</strong>!</p>
          <p>Recebemos um pedido para redefinir a tua senha.</p>
          <a href="${link}" style="display:inline-block;background:#15803d;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Redefinir Senha</a>
          <p style="color:#666;font-size:12px;">Expira em 1 hora.</p>
        </div>`,
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
// ════════════════════════════════════════════════════════════
const redefinirSenha = async ({ token, senha }) => {
  if (!senha || senha.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
  const [rows] = await pool.query(
    'SELECT id_usuario FROM recuperacaosenha WHERE token = ? AND expira_em > NOW() LIMIT 1',
    [token]
  );
  if (!rows.length) throw new Error('Este link é inválido ou já expirou.');
  const hashSenha = await _hash(senha, 10);
  await pool.query('UPDATE usuario SET senha = ? WHERE id_usuario = ?', [hashSenha, rows[0].id_usuario]);
  await pool.query('DELETE FROM recuperacaosenha WHERE token = ?', [token]);
  return { mensagem: 'Senha redefinida com sucesso! Já podes fazer login.' };
};

export { registar, login, recuperarSenha, redefinirSenha, confirmarEmail };