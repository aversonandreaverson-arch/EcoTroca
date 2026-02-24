import express, { json } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';

const app = express();

app.use(cors());
app.use(json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);

// (as outras rotas vamos adicionar aqui depois)

app.get('/', (req, res) => res.json({ mensagem: 'EcoTroca API funcionando!' }));

export default app;