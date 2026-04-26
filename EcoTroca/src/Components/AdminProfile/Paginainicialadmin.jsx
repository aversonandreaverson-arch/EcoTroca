
import { useState, useEffect } from 'react';
import {
  Bell, Package, Users, Building2, Recycle,
  CheckCircle, Clock, XCircle, Newspaper,
  BookOpen, Calendar, Megaphone, AlertCircle,
  TrendingUp, Activity
} from 'lucide-react';
import Header from './Header.jsx';

const TOKEN = () => localStorage.getItem('token');
const api = (path) => fetch(`http://localhost:3000${path}`, {
  headers: { Authorization: `Bearer ${TOKEN()}` }
}).then(r => r.json());

const ESTADO_CONFIG = {
  pendente:  { cor: 'bg-yellow-100 text-yellow-700', label: 'Pendente'  },
  aceita:    { cor: 'bg-blue-100 text-blue-700',     label: 'Aceite'    },
  coletada:  { cor: 'bg-green-100 text-green-700',   label: 'Concluída' },
  cancelada: { cor: 'bg-red-100 text-red-700',       label: 'Cancelada' },
  rejeitada: { cor: 'bg-red-100 text-red-700',       label: 'Rejeitada' },
};

const TIPO_CONFIG = {
  oferta_residuo: { cor: 'bg-green-100 text-green-700',   label: 'Oferta',    icone: <Recycle   size={14} /> },
  pedido_residuo: { cor: 'bg-purple-100 text-purple-700', label: 'Pedido',    icone: <Megaphone size={14} /> },
  evento:         { cor: 'bg-blue-100 text-blue-700',     label: 'Evento',    icone: <Calendar  size={14} /> },
  educacao:       { cor: 'bg-yellow-100 text-yellow-700', label: 'Educação',  icone: <BookOpen  size={14} /> },
  noticia:        { cor: 'bg-cyan-100 text-cyan-700',     label: 'Notícia',   icone: <Newspaper size={14} /> },
  aviso:          { cor: 'bg-red-100 text-red-700',       label: 'Aviso',     icone: <Bell      size={14} /> },
};

export default function PaginaInicialAdmin() {
  const [feed,          setFeed]          = useState([]);
  const [entregas,      setEntregas]      = useState([]);
  const [utilizadores,  setUtilizadores]  = useState([]);
  const [carregando,    setCarregando]    = useState(true);
  const [erro,          setErro]          = useState('');
  const [filtroFeed,    setFiltroFeed]    = useState('todos');
  const [filtroEntrega, setFiltroEntrega] = useState('todos');

  useEffect(() => {
    const carregar = async () => {
      try {
        const [dadosFeed, dadosEntregas, dadosUsers] = await Promise.all([
          api('/api/feed'),
          api('/api/admin/entregas'),
          api('/api/admin/utilizadores'),
        ]);

        const feedArr = Array.isArray(dadosFeed)
          ? dadosFeed
          : dadosFeed?.publicacoes || [];

        setFeed(feedArr);
        setEntregas(Array.isArray(dadosEntregas) ? dadosEntregas : []);
        setUtilizadores(Array.isArray(dadosUsers) ? dadosUsers : []);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const feedFiltrado = filtroFeed === 'todos'
    ? feed
    : feed.filter(p => p.tipo_publicacao === filtroFeed);

  const entregasFiltradas = filtroEntrega === 'todos'
    ? entregas
    : entregas.filter(e => e.status === filtroEntrega);

  // Utilizadores novos (últimos 7 dias)
  const novosUtilizadores = utilizadores.filter(u => {
    const dias = (Date.now() - new Date(u.data_criacao)) / (1000 * 60 * 60 * 24);
    return dias <= 7;
  });

  if (carregando) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-white">A carregar...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pt-24 pb-12 px-6">
      <Header />

      {/* Cabeçalho */}
      <div className="bg-white/10 text-white rounded-2xl p-6 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity size={24} className="text-green-400" /> Actividade da Plataforma
          </h1>
          <p className="text-white/50 text-sm mt-1">Visão geral em tempo real de tudo o que acontece</p>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-400">{feed.length}</p>
            <p className="text-white/40 text-xs">Publicações</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">{entregas.length}</p>
            <p className="text-white/40 text-xs">Entregas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">{novosUtilizadores.length}</p>
            <p className="text-white/40 text-xs">Novos (7d)</p>
          </div>
        </div>
      </div>

      {erro && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-300 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle size={16} /> {erro}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Coluna esquerda: Feed completo ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <TrendingUp size={18} className="text-green-400" /> Feed da Plataforma
            </h2>
            <span className="text-white/40 text-xs">{feedFiltrado.length} publicações</span>
          </div>

          {/* Filtros do feed */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {[
              { val: 'todos',          label: 'Tudo'     },
              { val: 'oferta_residuo', label: 'Ofertas'  },
              { val: 'pedido_residuo', label: 'Pedidos'  },
              { val: 'evento',         label: 'Eventos'  },
              { val: 'noticia',        label: 'Notícias' },
              { val: 'aviso',          label: 'Avisos'   },
            ].map(f => (
              <button key={f.val} onClick={() => setFiltroFeed(f.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition shrink-0 ${
                  filtroFeed === f.val
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de publicações */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {feedFiltrado.length === 0 ? (
              <div className="bg-white/5 rounded-2xl p-8 text-center">
                <p className="text-white/30">Nenhuma publicação encontrada.</p>
              </div>
            ) : feedFiltrado.map(p => {
              const cfg = TIPO_CONFIG[p.tipo_publicacao] || TIPO_CONFIG.aviso;
              return (
                <div key={p.id_publicacao} className="bg-white/10 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cor}`}>
                        {cfg.icone} {cfg.label}
                      </span>
                    </div>
                    <span className="text-white/30 text-xs">
                      {new Date(p.criado_em).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-white font-medium text-sm">{p.titulo}</p>
                  {p.descricao && <p className="text-white/50 text-xs mt-1 line-clamp-2">{p.descricao}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                      {p.nome_autor?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white/40 text-xs">{p.nome_autor}</span>
                    {p.tipo_autor === 'empresa' && (
                      <span className="text-white/30 text-xs flex items-center gap-1">
                        <Building2 size={10} /> Empresa
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Coluna direita: Entregas + Novos utilizadores ── */}
        <div className="space-y-6">

          {/* Entregas recentes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Package size={18} className="text-green-400" /> Entregas
              </h2>
              <span className="text-white/40 text-xs">{entregasFiltradas.length} entregas</span>
            </div>

            {/* Filtros de estado */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {[
                { val: 'todos',     label: 'Todas'     },
                { val: 'pendente',  label: 'Pendentes' },
                { val: 'coletada',  label: 'Concluídas'},
                { val: 'cancelada', label: 'Canceladas'},
              ].map(f => (
                <button key={f.val} onClick={() => setFiltroEntrega(f.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition shrink-0 ${
                    filtroEntrega === f.val
                      ? 'bg-green-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {entregasFiltradas.slice(0, 15).map(e => {
                const cfg = ESTADO_CONFIG[e.status] || ESTADO_CONFIG.pendente;
                return (
                  <div key={e.id_entrega} className="bg-white/10 rounded-xl p-3 flex items-center justify-between border border-white/5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-xs font-medium truncate">
                          {e.nome_usuario} → {e.nome_empresa || 'Empresa'}
                        </p>
                      </div>
                      <p className="text-white/40 text-xs mt-0.5">
                        Entrega #{e.id_entrega}
                        {e.peso_total ? ` · ${e.peso_total} kg` : ''}
                        {e.valor_total ? ` · ${parseFloat(e.valor_total).toFixed(0)} Kz` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${cfg.cor}`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
              {entregasFiltradas.length === 0 && (
                <p className="text-white/30 text-center py-4 text-sm">Nenhuma entrega encontrada.</p>
              )}
            </div>
          </div>

          {/* Novos utilizadores */}
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
              <Users size={18} className="text-green-400" /> Novos Utilizadores (últimos 7 dias)
            </h2>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {novosUtilizadores.length === 0 ? (
                <p className="text-white/30 text-center py-4 text-sm">Nenhum utilizador novo nos últimos 7 dias.</p>
              ) : novosUtilizadores.map(u => (
                <div key={u.id_usuario} className="bg-white/10 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                    u.tipo_usuario === 'empresa' ? 'bg-purple-600' :
                    u.tipo_usuario === 'coletor' ? 'bg-green-600' : 'bg-blue-500'
                  }`}>
                    {u.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{u.nome}</p>
                    <p className="text-white/40 text-xs">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    u.tipo_usuario === 'empresa' ? 'bg-purple-100 text-purple-700' :
                    u.tipo_usuario === 'coletor' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {u.tipo_usuario === 'empresa' ? 'Empresa' :
                     u.tipo_usuario === 'coletor' ? 'Coletador' : 'Cidadão'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}