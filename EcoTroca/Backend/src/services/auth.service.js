// ============================================================
//  auth.service.js
//  Lógica de autenticação: registo e login
//  Suporta: utilizador comum, coletador e empresa
// ============================================================

import pool from '../config/database.js';
import { hash as _hash, compare } from 'bcryptjs';
import { gerarToken } from '../utils/jwt.js';

// ──────────────────────────────────────────────────────────────
// REGISTO
// Cria conta conforme o tipo: comum, coletor ou empresa
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

  // Gera o hash da senha para não guardar em texto simples
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

  // ── Cria registos de suporte para todos os tipos ──

  // Pontuação e recompensas (gamificação)
  await pool.query('INSERT INTO PontuacaoUsuario (id_usuario) VALUES (?)', [id_usuario]);
  await pool.query('INSERT INTO RecompensaUsuario (id_usuario) VALUES (?)', [id_usuario]);

  // Carteira (dinheiro sacável + saldo na plataforma)
  await pool.query('INSERT INTO Carteira (id_usuario) VALUES (?)', [id_usuario]);

  // ── Registo extra conforme o tipo de conta ──

  if (tipo_usuario === 'coletor') {
    // Coletador independente — ligado ao id_usuario criado acima
    await pool.query(
      `INSERT INTO Coletador (id_usuario, nome, telefone, tipo)
       VALUES (?, ?, ?, 'independente')`,
      [id_usuario, nome, telefone]
    );
  }

  if (tipo_usuario === 'empresa') {
    // Empresa recicladora — cria registo na tabela EmpresaRecicladora
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

  // Gera o token JWT para autenticação imediata após o registo
  const token = gerarToken({ id_usuario, tipo_usuario: tipo_usuario || 'comum' });

  return { token, id_usuario, tipo_usuario: tipo_usuario || 'comum', nome };
};

// ──────────────────────────────────────────────────────────────
// LOGIN
// Autentica o utilizador pelo email ou telefone
// ──────────────────────────────────────────────────────────────
const login = async ({ email, senha }) => {

  // Procura pelo email ou telefone (o utilizador pode usar qualquer um)
  const [rows] = await pool.query(
    `SELECT * FROM Usuario
     WHERE (email = ? OR telefone = ?) AND ativo = TRUE`,
    [email, email]
  );

  if (rows.length === 0) throw new Error('Utilizador não encontrado.');

  const usuario = rows[0];

  // Compara a senha introduzida com o hash guardado
  const senhaCorreta = await compare(senha, usuario.senha);
  if (!senhaCorreta) throw new Error('Senha incorreta.');

  // Gera o token JWT
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