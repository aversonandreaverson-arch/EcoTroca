// Importa o mysql2
const mysql = require('mysql2');

// Cria um pool de conexões com o banco de dados
const pool = mysql.createPool({
  host: process.env.DB_HOST,      // endereço do banco
  user: process.env.DB_USER,      // usuário
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Exporta usando Promise para async/await
module.exports = pool.promise();