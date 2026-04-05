import express from 'express';
import cors from 'cors';

// ── Importo todas as rotas da aplicação ──
import authRoutes          from './routes/auth.routes.js';
import usuarioRoutes       from './routes/usuario.routes.js';
import entregaRoutes       from './routes/entrega.routes.js';
import coletadorRoutes     from './routes/coletador.routes.js';
import empresaRoutes       from './routes/empresa.routes.js';
import eventoRoutes        from './routes/evento.routes.js';
import adminRoutes         from './routes/admin.routes.js';
import chatRoutes          from './routes/chat.routes.js';
import notificacaoRoutes   from './routes/notificacao.route.js';
import educacaoRoutes      from './routes/educacao.routes.js';
import feedRoutes          from './routes/feed.routes.js';
import perfilPublicoRoutes from './routes/perfilpublico.routes.js';
import residuoRoutes       from './routes/residuo.routes.js';
import pesquisaRoutes      from './routes/pesquisa.routes.js';
import recolhasRoutes      from './routes/recolhas.routes.js'; 

const app = express();

// ── CORS — permite pedidos do frontend 
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  credentials: true,
}));

// ── Middleware para ler JSON no body dos pedidos ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Rotas da API ──
app.use('/api/auth',           authRoutes);
app.use('/api/usuarios',       usuarioRoutes);
app.use('/api/entregas',       entregaRoutes);
app.use('/api/coletador',      coletadorRoutes);
app.use('/api/empresas',       empresaRoutes);
app.use('/api/eventos',        eventoRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/chat',           chatRoutes);
app.use('/api/notificacoes',   notificacaoRoutes);
app.use('/api/educacao',       educacaoRoutes);
app.use('/api/feed',           feedRoutes);
app.use('/api/perfilpublico',  perfilPublicoRoutes);
app.use('/api/residuos',       residuoRoutes);
app.use('/api/pesquisa',       pesquisaRoutes);
app.use('/api',                recolhasRoutes); 

// ── Rota de teste ──
app.get('/', (req, res) => res.json({ mensagem: 'EcoTroca API funcionando!' }));

export default app;