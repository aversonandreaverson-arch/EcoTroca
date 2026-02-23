import express, { json } from 'express';
import cors from 'cors';
const app = express();

app.use(cors());
app.use(json());

// Rotas
app.use('/api/auth', require('./routes/auth.routes'));

// (as outras rotas vamos adicionar aqui depois)

app.get('/', (req, res) => res.json({ mensagem: 'EcoTroca API funcionando!' }));

export default app;