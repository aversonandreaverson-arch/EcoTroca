import app from './App.js';
import { PORT } from './config/env.js';
import pool from './config/database.js';

pool.getConnection()
  .then((conn) => {
    conn.release();
    console.log(' Base de dados conectada!');
    app.listen(PORT, () => {
      console.log(` Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(' Erro ao conectar à base de dados:', err.message);
  });