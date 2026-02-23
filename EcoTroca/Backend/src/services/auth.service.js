import { query } from '../config/database';
import { hash as _hash, compare } from 'bcryptjs';
import { gerarToken } from '../utils/jwt';

const registar = async ({ nome, email, telefone, senha, tipo_usuario, provincia, municipio, bairro }) => {
  const [existe] = await query('SELECT id_usuario FROM Usuario WHERE email = ? OR telefone = ?', [email, telefone]);
  if (existe.length > 0) throw new Error('Email ou telefone já registado');

  const hash = await _hash(senha, 10);
  const [result] = await query(
    'INSERT INTO Usuario (nome, email, telefone, senha, tipo_usuario, provincia, municipio, bairro) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [nome, email, telefone, hash, tipo_usuario || 'comum', provincia, municipio, bairro]
  );

  const id_usuario = result.insertId;

  // Criar pontuação inicial
  await query('INSERT INTO PontuacaoUsuario (id_usuario) VALUES (?)', [id_usuario]);
  await query('INSERT INTO RecompensaUsuario (id_usuario) VALUES (?)', [id_usuario]);

  const token = gerarToken({ id_usuario, tipo_usuario: tipo_usuario || 'comum' });
  return { token, id_usuario };
};

const login = async ({ email, senha }) => {
  const [rows] = await query('SELECT * FROM Usuario WHERE email = ? AND ativo = TRUE', [email]);
  if (rows.length === 0) throw new Error('Utilizador não encontrado');

  const usuario = rows[0];
  const senhaCorreta = await compare(senha, usuario.senha);
  if (!senhaCorreta) throw new Error('Senha incorreta');

  const token = gerarToken({ id_usuario: usuario.id_usuario, tipo_usuario: usuario.tipo_usuario });
  return { token, tipo_usuario: usuario.tipo_usuario, nome: usuario.nome };
};

export default { registar, login };