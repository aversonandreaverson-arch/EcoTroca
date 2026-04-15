import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { PORT } from './src/config/env.js';
import pool from './src/config/database.js';

// Importa o job de expiracao de publicacoes (Regra 7)
import { iniciarJobExpiracoes } from './src/jobs/expirar_publicacoes.job.js';

pool.getConnection()
  .then((conn) => {
    conn.release();
    console.log('Base de dados conectada!');

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);

      // Inicia o job apos o servidor arrancar
      // Corre todos os dias as 08:00 — verifica publicacoes a expirar
      iniciarJobExpiracoes();
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar à base de dados:', err.message);
  });