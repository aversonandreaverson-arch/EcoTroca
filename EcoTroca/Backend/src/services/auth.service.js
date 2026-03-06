
import pool from '../config/database.js';
import { hash as _hash, compare } from 'bcryptjs';
import { gerarToken } from '../utils/jwt.js';
import twilio from 'twilio';

// Inicializo o cliente Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Função auxiliar para normalizar número angolano 
const normalizarTelefone = (telefone) => {
  if (!telefone) return null;
  let t = telefone.toString().trim().replace(/\s/g, '');
  if (t.startsWith('+244')) return t;
  if (t.startsWith('244'))  return '+' + t;
  if (t.startsWith('9'))    return '+244' + t;
  return '+244' + t;
};

// Função auxiliar para enviar SMS — não bloqueia o fluxo se falhar
const enviarSMS = async (telefone, mensagem) => {
  try {
    const numero = normalizarTelefone(telefone);
    if (!numero) return;
    await twilioClient.messages.create({
      body: mensagem,
      from: process.env.TWILIO_PHONE_NUMBER,
      to:   numero,
    });
    console.log(`✅ SMS enviado para ${numero}`);
  } catch (err) {
    console.error(`❌ Erro ao enviar SMS de boas-vindas: ${err.message}`);
  }
};

// ──────────────────────────────────────────────────────────────
// REGISTO
// ──────────────────────────────────────────────────────────────
const registar = async ({
  nome, email, telefone, senha, tipo_usuario,
  provincia, municipio, bairro, bi, data_nascimento,
  horario_abertura, horario_fechamento
}) => {

  // Verifica se o email ou telefone já estão registados
  const [existe] = await pool.query(
    'SELECT id_usuario FROM Usuario WHERE email = ? OR telefone = ?',
    [email || null, telefone]
  );
  if (existe.length > 0) throw new Error('Email ou telefone já registado.');

  // Gera o hash da senha
  const hash = await _hash(senha, 10);

  // Insere o utilizador na tabela principal
  const [result] = await pool.query(
    `INSERT INTO Usuario
       (nome, email, telefone, senha, tipo_usuario, provincia, municipio, bairro, bi, data_nascimento)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nome,
      email || null,
      telefone,
      hash,
      tipo_usuario || 'comum',
      provincia || null,
      municipio || null,
      bairro    || null,
      bi        || null,
      data_nascimento || null,
    ]
  );

  const id_usuario = result.insertId;

  // Pontuação e recompensas
  await pool.query('INSERT INTO PontuacaoUsuario (id_usuario) VALUES (?)', [id_usuario]);
  await pool.query('INSERT INTO RecompensaUsuario (id_usuario) VALUES (?)', [id_usuario]);

  // Carteira — só para utilizadores e coletadores
  if (tipo_usuario !== 'empresa') {
    await pool.query('INSERT INTO Carteira (id_usuario) VALUES (?)', [id_usuario]);
  }

  // Registo extra conforme o tipo de conta
  if (tipo_usuario === 'coletor') {
    await pool.query(
      `INSERT INTO Coletador (id_usuario, nome, telefone, tipo)
       VALUES (?, ?, ?, 'independente')`,
      [id_usuario, nome, telefone]
    );
  }

  if (tipo_usuario === 'empresa') {
    await pool.query(
      `INSERT INTO EmpresaRecicladora
         (id_usuario, nome, telefone, email, horario_abertura, horario_fechamento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id_usuario,
        nome,
        telefone,
        email || null,
        horario_abertura   || null,
        horario_fechamento || null,
      ]
    );
  }

  // ── SMS de boas-vindas ────────────────────────────────────
  // Enviado para o número com que a pessoa se registou
  const tipoLabel = tipo_usuario === 'empresa'  ? 'Empresa'    :
                    tipo_usuario === 'coletor'   ? 'Coletador'  :
                    'Utilizador';

  const mensagemSMS =
    `🌱 EcoTroca Angola\n` +
    `Olá ${nome}, bem-vindo(a)!\n` +
    `A tua conta de ${tipoLabel} foi criada com sucesso.\n` +
    `Juntos tornamos Angola mais verde. ♻️`;

  await enviarSMS(telefone, mensagemSMS);
  // ─────────────────────────────────────────────────────────

  const token = gerarToken({ id_usuario, tipo_usuario: tipo_usuario || 'comum' });

  return { token, id_usuario, tipo_usuario: tipo_usuario || 'comum', nome };
};

// ──────────────────────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────────────────────
const login = async ({ email, senha }) => {

  const [rows] = await pool.query(
    `SELECT * FROM Usuario
     WHERE (email = ? OR telefone = ?) AND ativo = TRUE`,
    [email, email]
  );

  if (rows.length === 0) throw new Error('Utilizador não encontrado.');

  const usuario = rows[0];

  const senhaCorreta = await compare(senha, usuario.senha);
  if (!senhaCorreta) throw new Error('Senha incorreta.');

  const token = gerarToken({
    id_usuario:   usuario.id_usuario,
    tipo_usuario: usuario.tipo_usuario
  });

  return {
    token,
    tipo_usuario: usuario.tipo_usuario,
    nome:         usuario.nome,
    id_usuario:   usuario.id_usuario,
  };
};

export { registar, login };