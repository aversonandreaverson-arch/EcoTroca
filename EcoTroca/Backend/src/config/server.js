
//  Responsabilidades:
//    - Carregar variáveis de ambiente do .env
//    - Configurar middleware (JSON, CORS, body limit)
//    - Iniciar o servidor na porta definida
// ============================================================

// Carrega as variáveis do ficheiro .env para process.env
// Tem de ser a primeira coisa a correr antes de qualquer import
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

const app = express();

// Porta do servidor — usa a do .env ou 3000 por defeito
const PORT = process.env.PORT || 3000;

// ── Middleware de parsing do body ─────────────────────────────
// Limite de 10mb para suportar upload de imagens em base64
// Uma imagem de 5MB em base64 ocupa ~7MB de texto
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rota de teste — confirma que o servidor está a correr
app.get('/', (req, res) => {
  res.send('ECOTROCA Angola - Back-end ativo');
});

// Inicia o servidor e imprime a porta no terminal
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});