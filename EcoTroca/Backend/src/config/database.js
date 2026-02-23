// Importa o mysql com suporte a promises
import mysql from 'mysql2/promise';

// Cria um pool de conexões (boa prática)
const pool = mysql.createPool({
  host: process.env.DB_HOST,        // Endereço do banco
  user: process.env.DB_USER,        // Usuário do banco
  password: process.env.DB_PASSWORD,// Senha do banco
  database: process.env.DB_NAME,    // Nome do banco
  waitForConnections: true,         // Espera conexões livres
  connectionLimit: 10,              // Limite de conexões
  queueLimit: 0
});

// Exporta o pool para ser usado em todo o sistema
export default pool;