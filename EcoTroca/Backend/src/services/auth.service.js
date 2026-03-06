
import pool from '../config/database.js';
import { hash as _hash, compare } from 'bcryptjs';
import { gerarToken } from '../utils/jwt.js';

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

  await pool.query('INSERT INTO PontuacaoUsuario (id_usuario) VALUES (?)', [id_usuario]);
  await pool.query('INSERT INTO RecompensaUsuario (id_usuario) VALUES (?)', [id_usuario]);

  if (tipo_usuario !== 'empresa') {
    await pool.query('INSERT INTO Carteira (id_usuario) VALUES (?)', [id_usuario]);
  }

  if (tipo_usuario === 'coletor') {
    await pool.query(
      `INSERT INTO Coletador (id_usuario, nome, telefone, tipo) VALUES (?, ?, ?, 'independente')`,
      [id_usuario, nome, telefone]
    );
  }

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

const login = async ({ email, senha }) => {

  const [rows] = await pool.query(
    `SELECT * FROM Usuario WHERE (email = ? OR telefone = ?) AND ativo = TRUE`,
    [email, email]
  );

  if (rows.length === 0) throw new Error('Utilizador não encontrado.');

  const usuario = rows[0];
  const senhaCorreta = await compare(senha, usuario.senha);
  if (!senhaCorreta) throw new Error('Senha incorreta.');

  const token = gerarToken({ id_usuario: usuario.id_usuario, tipo_usuario: usuario.tipo_usuario });

  return { token, tipo_usuario: usuario.tipo_usuario, nome: usuario.nome, id_usuario: usuario.id_usuario };
};

export { registar, login };