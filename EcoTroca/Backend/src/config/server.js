// Importa o dotenv
import dotenv from 'dotenv';

// Carrega as variáveis do .env para process.env
dotenv.config();

// Importa o express
import express from 'express';

const app = express();

// Exemplo de uso do .env
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.send('ECOTROCA Angola - Back-end ativo');
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});