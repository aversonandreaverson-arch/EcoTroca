
//  Como usar:
//    1. Abre o terminal na pasta Backend
//    2. Corre: node src/scripts/criarAdmin.js
//    3. O script cria a conta e termina automaticamente

import bcrypt from 'bcrypt';
import pool from '../config/database.js';

const NOME  = 'Administrador EcoTroca';
const EMAIL = 'admin@ecotroca.ao';
const TELEF = '900000000';
const SENHA = 'Admin@EcoTroca2026';

const criarAdmin = async () => {
  try {
    // Verifica se já existe uma conta com este email
    const [existente] = await pool.query(
      'SELECT id_usuario FROM usuario WHERE email = ?',
      [EMAIL]
    );

    if (existente.length > 0) {
      console.log('⚠️  Já existe uma conta com este email:', EMAIL);
      console.log('    Nenhuma alteração foi feita.');
      process.exit(0);
    }

    // Encripta a senha com bcrypt
    console.log('A encriptar a senha...');
    const hash = await bcrypt.hash(SENHA, 10);

    // Insere o admin na base de dados
    await pool.query(
      `INSERT INTO usuario (nome, email, telefone, senha, tipo_usuario, ativo)
       VALUES (?, ?, ?, ?, 'admin', 1)`,
      [NOME, EMAIL, TELEF, hash]
    );

    console.log('');
    console.log('Administrador criado com sucesso!');
    console.log('');
    console.log('   Email:', EMAIL);
    console.log('   Senha:', SENHA);
    console.log('');

  } catch (err) {
    console.error('Erro ao criar administrador:', err.message);
  } finally {
    process.exit(0);
  }
};

criarAdmin();