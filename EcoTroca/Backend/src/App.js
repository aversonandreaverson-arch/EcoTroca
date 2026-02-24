import express, { json } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import entregaRoutes from './routes/entrega.routes.js';
import coletadorRoutes from './routes/coletador.routes.js';
import empresaRoutes from './routes/empresa.routes.js';
import adminRoutes from './routes/admin.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificacaoRoutes from './routes/notificacao.route.js';

const app = express();

app.use(cors());
app.use(json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/entregas', entregaRoutes);
app.use('/api/coletador', coletadorRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notificacoes', notificacaoRoutes);


app.get('/', (req, res) => res.json({ mensagem: 'EcoTroca API funcionando!' }));

export default app;