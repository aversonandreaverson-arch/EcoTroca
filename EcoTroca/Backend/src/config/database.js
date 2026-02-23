// Importa o mysql2
import { createPool } from 'mysql2';

// Cria um pool de conexões com o banco de dados
const pool = createPool({
  host: process.env.DB_HOST,      // endereço do banco
  user: process.env.DB_USER,      // usuário
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME 
});

// Exporta usando Promise para async/await
export default pool.promise();