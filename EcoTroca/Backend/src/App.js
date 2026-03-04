// ============================================================
//  app.js — Configuração principal do servidor Express
//  Define middlewares, CORS e todas as rotas da API
// ============================================================

import express, { json } from 'express';
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
// Aqui importo a rota dos resíduos — usada no formulário de nova publicação
import residuoRoutes       from './routes/residuo.routes.js';

const app = express();

// ── CORS — permite pedidos do frontend ──
// Aceita qualquer origem localhost em desenvolvimento (porta 5173, 5174, 5175, etc.)
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
app.use(json());

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
// Aqui registo a rota dos resíduos para o frontend poder listar os tipos
app.use('/api/residuos',       residuoRoutes);

// ── Rota de teste ──
app.get('/', (req, res) => res.json({ mensagem: 'EcoTroca API funcionando!' }));

export default app;