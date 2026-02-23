// Importa o Express
import express from 'express';

// Importa as rotas
import authRoutes from './routes/auth.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import coletorRoutes from './routes/coletador.routes.js';
import empresaRoutes from './routes/empresa.routes.js';
import entregaRoutes from './routes/entrega.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Cria a aplicação Express
const app = express();

// Middleware para permitir JSON
app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/coletador', coletadorRoutes);
app.use('/api/empresa', empresaRoutes);
app.use('/api/entregas', entregaRoutes);
app.use('/api/admin', adminRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.send('ECOTROCA Angola API ativa');
});

// Exporta o app
export default app;