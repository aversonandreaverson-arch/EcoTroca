import express, { json } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(cors());
app.use(json());

// Rotas
app.use('/api/auth', authRoutes);

// (as outras rotas vamos adicionar aqui depois)

app.get('/', (req, res) => res.json({ mensagem: 'EcoTroca API funcionando!' }));

export default app;