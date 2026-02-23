import { listen } from './src/App.js';
import { PORT } from './src/config/env';
import { getConnection } from './src/config/database';

getConnection()
  .then(() => {
    console.log(' Base de dados conectada!');
    listen(PORT, () => {
      console.log(` Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(' Erro ao conectar à base de dados:', err.message);
  });