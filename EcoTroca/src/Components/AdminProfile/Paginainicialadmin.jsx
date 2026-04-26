import { useState, useEffect, useRef } from 'react';
import {
  Recycle, Building2, MapPin, Plus, Search, Trash2,
  Bell, Target, ChevronRight, Star, ThumbsUp, ThumbsDown,
  Smile, Info, User, Megaphone, Calendar, Newspaper,
  BookOpen, X, Shield, AlertTriangle, Ban, CheckCircle,
  Package, TrendingUp, Users, Clock, Activity
} from 'lucide-react';
import Header from './Header.jsx';
import {
  getFeed, criarPublicacao, apagarPublicacao,
  getEmpresas, pesquisar
} from '../../api.js';

const TOKEN = () => localStorage.getItem('token');
const apiAdmin = (path, opts = {}) =>
  fetch(`http://localhost:3000${path}`, {
    headers: { Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' },
    ...opts
  }).then(r => r.json());

const TIPOS_DISPONIVEIS = [
  { valor: 'evento',   label: 'Evento'   },
  { valor: 'educacao', label: 'Educação' },
  { valor: 'noticia',  label: 'Notícia'  },
  { valor: 'aviso',    label: 'Aviso'    },
];

const FILTROS = [
  { valor: 'todos',          label: 'Tudo'      },
  { valor: 'oferta_residuo', label: 'Ofertas'   },
  { valor: 'pedido_residuo', label: 'Pedidos'   },
  { valor: 'evento',         label: 'Eventos'   },
  { valor: 'educacao',       label: 'Educação'  },
  { valor: 'noticia',        label: 'Notícias'  },
  { valor: 'aviso',          label: 'Avisos'    },
];

const ESTILOS = {
  oferta_residuo: { badge: 'bg-green-100 text-green-700',   borda: 'border-green-200',  label: 'Oferta',   icone: <Recycle   size={28} className="text-green-500"  />, fundo: 'bg-green-50'  },
  pedido_residuo: { badge: 'bg-purple-100 text-purple-700', borda: 'border-purple-200', label: 'Pedido',   icone: <Megaphone size={28} className="text-purple-500" />, fundo: 'bg-purple-50' },
  evento:         { badge: 'bg-blue-100 text-blue-700',     borda: 'border-blue-200',   label: 'Evento',   icone: <Calendar  size={28} className="text-blue-500"   />, fundo: 'bg-blue-50'   },
  educacao:       { badge: 'bg-yellow-100 text-yellow-700', borda: 'border-yellow-200', label: 'Educação', icone: <BookOpen  size={28} className="text-yellow-500" />, fundo: 'bg-yellow-50' },
  noticia:        { badge: 'bg-cyan-100 text-cyan-700',     borda: 'border-cyan-200',   label: 'Notícia',  icone: <Newspaper size={28} className="text-cyan-500"   />, fundo: 'bg-cyan-50'   },
  aviso:          { badge: 'bg-red-100 text-red-700',       borda: 'border-red-200',    label: 'Aviso',    icone: <Bell      size={28} className="text-red-500"    />, fundo: 'bg-red-50'    },
};

const QUALIDADE_CONFIG = {
  ruim:      { icone: <ThumbsDown size={11} className="text-red-500"    />, label: 'Ruim',      cor: 'bg-red-50 text-red-600 border-red-200'         },
  moderada:  { icone: <Smile      size={11} className="text-yellow-500" />, label: 'Moderada',  cor: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  boa:       { icone: <ThumbsUp   size={11} className="text-green-500"  />, label: 'Boa',       cor: 'bg-green-50 text-green-600 border-green-200'    },
  excelente: { icone: <Star       size={11} className="text-orange-400" />, label: 'Excelente', cor: 'bg-orange-50 text-orange-600 border-orange-200' },
};

const FORM_VAZIO = { tipo_publicacao: 'evento', titulo: '', descricao: '', provincia: '', imagem: '' };

export default function PaginaInicialAdmin() {
  const [feed,       setFeed]       = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');
  const [filtro,     setFiltro]     = useState('todos');
  const [empresas,   setEmpresas]   = useState([]);
  const [statsHoje,  setStatsHoje]  = useState(null);

  // Pesquisa
  const [pesquisa,           setPesquisa]           = useState('');
  const [resultadosPesquisa, setResultadosPesquisa] = useState(null);
  const [pesquisando,        setPesquisando]        = useState(false);
  const [mostrarDropdown,    setMostrarDropdown]    = useState(false);
  const pesquisaRef = useRef(null);
  const timeoutRef  = useRef(null);

  // Modal publicação
  const [modalAberto, setModalAberto] = useState(false);
  const [formulario,  setFormulario]  = useState(FORM_VAZIO);
  const [publicando,  setPublicando]  = useState(false);
  const [erroForm,    setErroForm]    = useState('');

  // Modal autor — controlo do admin
  const [autorModal,     setAutorModal]     = useState(null); // { id_usuario, nome, tipo }
  const [acaoEmCurso,    setAcaoEmCurso]    = useState(null);
  const [motivoAcao,     setMotivoAcao]     = useState('');
  const [feedbackAcao,   setFeedbackAcao]   = useState('');

  useEffect(() => {
    carregarFeed();
    getEmpresas().then(setEmpresas).catch(console.error);
    apiAdmin('/api/admin/hoje').then(setStatsHoje).catch(console.error);
  }, []);

  useEffect(() => {
    const fechar = (e) => {
      if (pesquisaRef.current && !pesquisaRef.current.contains(e.target))
        setMostrarDropdown(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  const carregarFeed = async () => {
    try {
      setCarregando(true);
      const dados = await getFeed();
      const publicacoes = Array.isArray(dados) ? dados : (dados?.publicacoes || []);
      setFeed(publicacoes);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handlePesquisa = (valor) => {
    setPesquisa(valor);
    clearTimeout(timeoutRef.current);
    if (!valor.trim()) { setResultadosPesquisa(null); setMostrarDropdown(false); return; }
    timeoutRef.current = setTimeout(async () => {
      try {
        setPesquisando(true);
        const dados = await pesquisar(valor.trim());
        setResultadosPesquisa(dados);
        setMostrarDropdown(true);
      } catch (err) { console.error(err); }
      finally { setPesquisando(false); }
    }, 400);
  };

  const totalResultados = resultadosPesquisa
    ? (resultadosPesquisa.empresas?.length    || 0) +
      (resultadosPesquisa.utilizadores?.length || 0) +
      (resultadosPesquisa.coletadores?.length  || 0)
    : 0;

  const feedFiltrado = feed.filter(p => filtro === 'todos' || p.tipo_publicacao === filtro);
  const avisos = feed.filter(p => p.tipo_publicacao === 'aviso');

  const handleCampo = (campo, valor) => setFormulario(prev => ({ ...prev, [campo]: valor }));

  const handlePublicar = async () => {
    if (!formulario.titulo.trim()) { setErroForm('O título é obrigatório.'); return; }
    try {
      setPublicando(true); setErroForm('');
      await criarPublicacao(formulario);
      setModalAberto(false); setFormulario(FORM_VAZIO);
      await carregarFeed();
    } catch (err) { setErroForm(err.message); }
    finally { setPublicando(false); }
  };

  const handleApagar = async (id) => {
    if (!window.confirm('Remover esta publicação?')) return;
    try { await apagarPublicacao(id); await carregarFeed(); }
    catch (err) { alert(err.message); }
  };

  // Abre modal de controlo ao clicar no autor
  const abrirAutorModal = (publicacao) => {
    if (!publicacao.id_autor || publicacao.tipo_autor === 'admin') return;
    setAutorModal({
      id_usuario: publicacao.id_autor,
      nome: publicacao.nome_autor,
      tipo: publicacao.tipo_autor,
    });
    setMotivoAcao('');
    setFeedbackAcao('');
    setAcaoEmCurso(null);
  };

  // Executa acção admin (advertir, suspender, bloquear)
  const executarAcao = async (acao) => {
    if (!motivoAcao.trim()) { setFeedbackAcao('O motivo é obrigatório.'); return; }
    try {
      setAcaoEmCurso(acao);
      const tipo = autorModal.tipo === 'empresa' ? 'empresa'
                 : autorModal.tipo === 'coletor' ? 'coletor' : 'comum';

      await apiAdmin(`/api/admin/utilizadores/${autorModal.id_usuario}/${acao}`, {
        method: 'PATCH',
        body: JSON.stringify({ tipo, motivo: motivoAcao }),
      });

      const msgs = {
        advertencia: `✅ Advertência aplicada a ${autorModal.nome}.`,
        suspender:   `✅ ${autorModal.nome} suspenso por 7 dias.`,
        bloquear:    `✅ ${autorModal.nome} bloqueado permanentemente.`,
      };
      setFeedbackAcao(msgs[acao] || 'Acção executada.');
      setMotivoAcao('');
    } catch (err) {
      setFeedbackAcao(`Erro: ${err.message}`);
    } finally {
      setAcaoEmCurso(null);
    }
  };

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12">
      <Header />

      <div className="px-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-800 flex items-center gap-2">
              <Shield size={22} className="text-green-700" /> Página Inicial
            </h1>
            <p className="text-green-600 text-sm mt-0.5">Controlo total da plataforma EcoTroca Angola</p>
          </div>
          <button onClick={() => { setFormulario(FORM_VAZIO); setModalAberto(true); }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">
            <Plus size={16} /> Publicar
          </button>
        </div>

        <div className="flex gap-6 items-start">

          {/* Feed */}
          <div className="flex-1 min-w-0">

            {/* Pesquisa */}
            <div className="relative mb-4" ref={pesquisaRef}>
              <Search size={15} className="absolute left-3 top-3.5 text-gray-400 z-10" />
              <input type="text" placeholder="Pesquisar utilizadores, empresas, coletadores..."
                value={pesquisa} onChange={(e) => handlePesquisa(e.target.value)}
                onFocus={() => { if (resultadosPesquisa && totalResultados > 0) setMostrarDropdown(true); }}
                className="w-full bg-white border border-green-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" />
              {pesquisa && !pesquisando && (
                <button onClick={() => { setPesquisa(''); setResultadosPesquisa(null); setMostrarDropdown(false); }} className="absolute right-3 top-3.5">
                  <X size={15} className="text-gray-400" />
                </button>
              )}
              {pesquisando && (
                <div className="absolute right-3 top-3.5">
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {mostrarDropdown && resultadosPesquisa && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-green-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                  {totalResultados === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Nenhum resultado para "{pesquisa}"</div>
                  ) : (
                    <>
                      {resultadosPesquisa.empresas?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Empresas</p>
                          {resultadosPesquisa.empresas.map(e => (
                            <button key={e.id_empresa}
                              onClick={() => { setMostrarDropdown(false); setPesquisa(''); setResultadosPesquisa(null); setAutorModal({ id_usuario: e.id_usuario, nome: e.nome, tipo: 'empresa' }); setMotivoAcao(''); setFeedbackAcao(''); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition text-left">
                              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{e.nome?.charAt(0).toUpperCase()}</div>
                              <div className="min-w-0 flex-1">
                                <p className="text-gray-800 text-sm font-medium truncate">{e.nome}</p>
                                <p className="text-gray-400 text-xs">Empresa</p>
                              </div>
                              <Shield size={12} className="text-green-500 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                      {resultadosPesquisa.utilizadores?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Utilizadores</p>
                          {resultadosPesquisa.utilizadores.map(u => (
                            <button key={u.id_usuario}
                              onClick={() => { setMostrarDropdown(false); setPesquisa(''); setResultadosPesquisa(null); setAutorModal({ id_usuario: u.id_usuario, nome: u.nome, tipo: 'comum' }); setMotivoAcao(''); setFeedbackAcao(''); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition text-left">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{u.nome?.charAt(0).toUpperCase()}</div>
                              <div className="min-w-0 flex-1">
                                <p className="text-gray-800 text-sm font-medium truncate">{u.nome}</p>
                                <p className="text-gray-400 text-xs">Utilizador</p>
                              </div>
                              <Shield size={12} className="text-green-500 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                      {resultadosPesquisa.coletadores?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Coletadores</p>
                          {resultadosPesquisa.coletadores.map(c => (
                            <button key={c.id_coletador}
                              onClick={() => { setMostrarDropdown(false); setPesquisa(''); setResultadosPesquisa(null); setAutorModal({ id_usuario: c.id_usuario, nome: c.nome, tipo: 'coletor' }); setMotivoAcao(''); setFeedbackAcao(''); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition text-left">
                              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{c.nome?.charAt(0).toUpperCase()}</div>
                              <div className="min-w-0 flex-1">
                                <p className="text-gray-800 text-sm font-medium truncate">{c.nome}</p>
                                <p className="text-gray-400 text-xs">Coletador</p>
                              </div>
                              <Shield size={12} className="text-green-500 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="px-4 py-2 border-t border-gray-100">
                        <p className="text-gray-300 text-xs text-center">{totalResultados} resultado{totalResultados !== 1 ? 's' : ''} — clica para gerir</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
              {FILTROS.map(f => (
                <button key={f.valor} onClick={() => setFiltro(f.valor)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition shrink-0 ${filtro === f.valor ? 'bg-green-600 text-white' : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {carregando && <p className="text-green-700 text-center py-12">A carregar...</p>}
            {erro && <p className="text-red-500 text-center py-6">{erro}</p>}
            {!carregando && !erro && feedFiltrado.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-green-100">
                <p className="text-gray-400">Nenhuma publicação encontrada.</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedFiltrado.map(p => (
                <CardPublicacao
                  key={p.id_publicacao}
                  publicacao={p}
                  onApagar={handleApagar}
                  onClicarAutor={abrirAutorModal}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">

            {/* Stats do dia */}
            <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-green-800 font-semibold text-sm mb-4 flex items-center gap-2">
                <Activity size={15} className="text-green-600" /> Hoje na Plataforma
              </h3>
              {statsHoje ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-green-500" />
                      <span className="text-gray-600 text-xs">Entregas hoje</span>
                    </div>
                    <span className="font-bold text-green-700">{statsHoje.entregas_hoje}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-green-500" />
                      <span className="text-gray-600 text-xs">Novos registos</span>
                    </div>
                    <span className="font-bold text-green-700">{statsHoje.usuarios_hoje}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-green-500" />
                      <span className="text-gray-600 text-xs">Receita hoje</span>
                    </div>
                    <span className="font-bold text-green-700">{parseFloat(statsHoje.receita_hoje || 0).toFixed(0)} Kz</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-yellow-500" />
                      <span className="text-gray-600 text-xs">Entregas pendentes</span>
                    </div>
                    <span className={`font-bold ${statsHoje.pendentes > 10 ? 'text-red-500' : 'text-yellow-600'}`}>{statsHoje.pendentes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-green-500" />
                      <span className="text-gray-600 text-xs">Total utilizadores</span>
                    </div>
                    <span className="font-bold text-green-700">{statsHoje.total_usuarios}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-xs">A carregar...</p>
              )}
            </div>

            {/* Acções rápidas */}
            <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-green-800 font-semibold text-sm mb-3 flex items-center gap-2">
                <Shield size={15} className="text-green-600" /> Acções Rápidas
              </h3>
              <p className="text-gray-400 text-xs mb-3">Clica no autor de qualquer publicação ou pesquisa um utilizador para o gerir.</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-yellow-50 rounded-xl p-2.5">
                  <AlertTriangle size={13} className="text-yellow-500 shrink-0" />
                  <span className="text-yellow-700 text-xs">Advertir — aviso formal</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 rounded-xl p-2.5">
                  <Clock size={13} className="text-orange-500 shrink-0" />
                  <span className="text-orange-700 text-xs">Suspender — bloqueia 7 dias</span>
                </div>
                <div className="flex items-center gap-2 bg-red-50 rounded-xl p-2.5">
                  <Ban size={13} className="text-red-500 shrink-0" />
                  <span className="text-red-700 text-xs">Bloquear — permanente</span>
                </div>
              </div>
            </div>

            {/* Avisos */}
            {avisos.length > 0 && (
              <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-5">
                <h3 className="text-red-600 font-semibold text-sm mb-3 flex items-center gap-2">
                  <Bell size={15} /> Avisos Activos
                </h3>
                <div className="space-y-3">
                  {avisos.slice(0, 3).map(aviso => (
                    <div key={aviso.id_publicacao} className="border-l-2 border-red-300 pl-3">
                      <p className="text-gray-700 text-xs font-medium">{aviso.titulo}</p>
                      {aviso.descricao && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{aviso.descricao}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal nova publicação */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg">Nova Publicação</h3>
              <button onClick={() => setModalAberto(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm block mb-2">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_DISPONIVEIS.map(t => (
                    <button key={t.valor} onClick={() => handleCampo('tipo_publicacao', t.valor)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium transition border ${formulario.tipo_publicacao === t.valor ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-gray-600 text-sm block mb-1">Título <span className="text-red-500">*</span></label>
                <input type="text" value={formulario.titulo} onChange={(e) => handleCampo('titulo', e.target.value)}
                  placeholder="Título da publicação"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-gray-600 text-sm block mb-1">Descrição (opcional)</label>
                <textarea value={formulario.descricao} onChange={(e) => handleCampo('descricao', e.target.value)}
                  placeholder="Mais detalhes..." rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
              </div>
              <div>
                <label className="text-gray-600 text-sm block mb-1">Província (opcional)</label>
                <input type="text" value={formulario.provincia} onChange={(e) => handleCampo('provincia', e.target.value)}
                  placeholder="Ex: Luanda"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              {erroForm && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{erroForm}</p>}
            </div>
            <button onClick={handlePublicar} disabled={publicando}
              className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">
              {publicando ? 'A publicar...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      {/* Modal controlo do autor */}
      {autorModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <Shield size={18} /> Gerir Utilizador
              </h3>
              <button onClick={() => setAutorModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            {/* Info do utilizador */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 ${
                autorModal.tipo === 'empresa' ? 'bg-purple-600' :
                autorModal.tipo === 'coletor' ? 'bg-green-600' : 'bg-blue-500'
              }`}>
                {autorModal.nome?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-gray-800 font-semibold">{autorModal.nome}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  autorModal.tipo === 'empresa' ? 'bg-purple-100 text-purple-700' :
                  autorModal.tipo === 'coletor' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {autorModal.tipo === 'empresa' ? 'Empresa' : autorModal.tipo === 'coletor' ? 'Coletador' : 'Utilizador'}
                </span>
              </div>
            </div>

            {/* Motivo */}
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-medium block mb-1">
                Motivo da acção <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivoAcao}
                onChange={e => setMotivoAcao(e.target.value)}
                placeholder="Descreve o motivo da acção (obrigatório)..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
            </div>

            {/* Feedback */}
            {feedbackAcao && (
              <div className={`rounded-xl p-3 mb-4 text-sm flex items-center gap-2 ${
                feedbackAcao.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {feedbackAcao.startsWith('✅') ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                {feedbackAcao}
              </div>
            )}

            {/* Acções */}
            <div className="space-y-2">
              <button
                onClick={() => executarAcao('advertencia')}
                disabled={!!acaoEmCurso}
                className="w-full flex items-center gap-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-800 py-3 px-4 rounded-xl text-sm font-medium transition disabled:opacity-50">
                <AlertTriangle size={16} className="text-yellow-500 shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">Advertir</p>
                  <p className="text-xs text-yellow-600 font-normal">Aviso formal — conta mantém-se activa</p>
                </div>
                {acaoEmCurso === 'advertencia' && <div className="ml-auto w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />}
              </button>

              <button
                onClick={() => executarAcao('suspender')}
                disabled={!!acaoEmCurso}
                className="w-full flex items-center gap-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 py-3 px-4 rounded-xl text-sm font-medium transition disabled:opacity-50">
                <Clock size={16} className="text-orange-500 shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">Suspender 7 dias</p>
                  <p className="text-xs text-orange-600 font-normal">Bloqueia o acesso temporariamente</p>
                </div>
                {acaoEmCurso === 'suspender' && <div className="ml-auto w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />}
              </button>

              <button
                onClick={() => executarAcao('bloquear')}
                disabled={!!acaoEmCurso}
                className="w-full flex items-center gap-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 py-3 px-4 rounded-xl text-sm font-medium transition disabled:opacity-50">
                <Ban size={16} className="text-red-500 shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">Bloquear permanentemente</p>
                  <p className="text-xs text-red-600 font-normal">Conta desactivada definitivamente</p>
                </div>
                {acaoEmCurso === 'bloquear' && <div className="ml-auto w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />}
              </button>
            </div>

            <button onClick={() => setAutorModal(null)}
              className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CardPublicacao({ publicacao: p, onApagar, onClicarAutor }) {
  const estilo  = ESTILOS[p.tipo_publicacao] || ESTILOS.aviso;
  const qualCfg = QUALIDADE_CONFIG[p.qualidade] || null;

  const progresso = (() => {
    const acumulado = parseFloat(p.total_acumulado || 0);
    const meta      = parseFloat(p.minimo_para_agendar || 0);
    if (!meta) return null;
    return Math.min(Math.round((acumulado / meta) * 100), 100);
  })();

  return (
    <div className={`bg-white border ${estilo.borda} rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col`}>
      {p.imagem ? (
        <img src={p.imagem} alt={p.titulo} className="w-full h-44 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <div className={`w-full h-32 ${estilo.fundo} flex items-center justify-center`}>{estilo.icone}</div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${estilo.badge}`}>{estilo.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">{new Date(p.criado_em).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}</span>
            <button onClick={() => onApagar(p.id_publicacao)} className="text-red-400 hover:text-red-600 transition" title="Apagar publicação">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <h3 className="text-gray-900 font-bold text-sm mb-1 line-clamp-2">{p.titulo}</h3>
        {p.descricao && <p className="text-gray-500 text-xs mb-2 line-clamp-2">{p.descricao}</p>}

        {(p.tipo_residuo || p.qualidade || p.provincia) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {p.tipo_residuo && <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"><Recycle size={10} /> {p.tipo_residuo}</span>}
            {qualCfg && <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${qualCfg.cor}`}>{qualCfg.icone} {qualCfg.label}</span>}
            {p.provincia && <span className="flex items-center gap-1 text-gray-400 text-xs"><MapPin size={10} /> {p.provincia}</span>}
          </div>
        )}

        {p.tipo_publicacao === 'pedido_residuo' && p.valor_proposto && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-2">
            <p className="text-green-700 text-xs">A empresa paga</p>
            <p className="text-green-800 font-bold">{parseFloat(p.valor_proposto).toFixed(0)} Kz<span className="text-xs font-normal text-green-600"> /kg</span></p>
          </div>
        )}

        {progresso !== null && (
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-xs flex items-center gap-1"><Target size={10} /> Progresso</span>
              <span className={`text-xs font-bold ${progresso >= 100 ? 'text-green-600' : 'text-gray-500'}`}>
                {parseFloat(p.total_acumulado || 0).toFixed(0)}/{parseFloat(p.minimo_para_agendar || 0).toFixed(0)} kg
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${progresso >= 100 ? 'bg-green-500' : 'bg-green-400'}`} style={{ width: `${progresso}%` }} />
            </div>
          </div>
        )}

        {/* Rodapé — clica no autor para gerir */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => onClicarAutor(p)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-1 py-0.5 transition group"
            title="Clica para gerir este utilizador">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
              p.tipo_autor === 'empresa' ? 'bg-purple-600' :
              p.tipo_autor === 'admin'   ? 'bg-green-700'  : 'bg-green-600'
            }`}>
              {p.nome_autor?.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-500 text-xs truncate group-hover:text-green-700">{p.nome_autor}</span>
            {p.tipo_autor === 'empresa' && <Building2 size={10} className="text-purple-400" />}
            {p.tipo_autor === 'admin'   && <Shield    size={10} className="text-green-600" />}
            {p.tipo_autor !== 'admin'   && <Shield    size={10} className="text-gray-300 group-hover:text-green-500" />}
          </button>
        </div>
      </div>
    </div>
  );
}