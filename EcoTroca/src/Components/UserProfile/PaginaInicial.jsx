
//  FLUXO DE PARTICIPAÇÃO:
//    - Utilizador comum vê pedido de empresa no feed
//    - Clica "Participar" → entrega criada imediatamente (sem modal)
//    - Ao clicar, concorda automaticamente que tem o mínimo pedido
//    - Empresa recebe notificação: "X aceitou participar e tem os Y kg"
//    - Botão muda para "Confirmado" e barra de progresso actualiza
//
//  FLUXO DE INTERESSE (empresa):
//    - Empresa vê oferta de resíduo de utilizador comum
//    - Clica "Tenho interesse" → abre modal para propor valor
//    - Utilizador recebe notificação com botões Aceitar/Recusar
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, Building2, MapPin, Plus, Search, Trash2,
  Handshake, Bell, Target, ChevronRight, CheckCircle, Star, ThumbsUp,
  ThumbsDown, Smile, Info, User, Megaphone,
  Calendar, Newspaper, BookOpen, X
} from 'lucide-react';
import Header from './Header';
import {
  getFeed, criarPublicacao, apagarPublicacao,
  getResiduos, getUtilizadorLocal, criarNotificacao,
  getEmpresas, pesquisar, participarEmPedido
} from '../../api.js';

// ── Tipos de publicação permitidos por perfil ────────────────
const TIPOS_POR_PERFIL = {
  admin:   [
    { valor: 'evento',         label: 'Evento'    },
    { valor: 'educacao',       label: 'Educação'  },
    { valor: 'noticia',        label: 'Notícia'   },
    { valor: 'aviso',          label: 'Aviso'     },
  ],
  empresa: [
    { valor: 'pedido_residuo', label: 'Pedido de Resíduo' },
    { valor: 'evento',         label: 'Evento'            },
    { valor: 'educacao',       label: 'Educação'          },
    { valor: 'noticia',        label: 'Notícia'           },
  ],
  comum:   [{ valor: 'oferta_residuo', label: 'Oferta de Resíduo' }],
  coletor: [], // coletador só lê, não publica
};

// ── Filtros do feed ──────────────────────────────────────────
const FILTROS = [
  { valor: 'todos',          label: 'Tudo'      },
  { valor: 'oferta_residuo', label: 'Ofertas'   },
  { valor: 'pedido_residuo', label: 'Pedidos'   },
  { valor: 'evento',         label: 'Eventos'   },
  { valor: 'educacao',       label: 'Educação'  },
  { valor: 'noticia',        label: 'Notícias'  },
  { valor: 'aviso',          label: 'Avisos'    },
];

// ── Estilos visuais por tipo de publicação ───────────────────
const ESTILOS = {
  oferta_residuo: { badge: 'bg-green-100 text-green-700',   borda: 'border-green-200',  label: 'Oferta de Resíduo', icone: <Recycle   size={28} className="text-green-500"  />, fundo: 'bg-green-50'  },
  pedido_residuo: { badge: 'bg-purple-100 text-purple-700', borda: 'border-purple-200', label: 'Pedido de Empresa', icone: <Megaphone size={28} className="text-purple-500" />, fundo: 'bg-purple-50' },
  evento:         { badge: 'bg-blue-100 text-blue-700',     borda: 'border-blue-200',   label: 'Evento',            icone: <Calendar  size={28} className="text-blue-500"   />, fundo: 'bg-blue-50'   },
  educacao:       { badge: 'bg-yellow-100 text-yellow-700', borda: 'border-yellow-200', label: 'Educação',          icone: <BookOpen  size={28} className="text-yellow-500" />, fundo: 'bg-yellow-50' },
  noticia:        { badge: 'bg-cyan-100 text-cyan-700',     borda: 'border-cyan-200',   label: 'Notícia',           icone: <Newspaper size={28} className="text-cyan-500"   />, fundo: 'bg-cyan-50'   },
  aviso:          { badge: 'bg-red-100 text-red-700',       borda: 'border-red-200',    label: 'Aviso',             icone: <Bell      size={28} className="text-red-500"    />, fundo: 'bg-red-50'    },
};

// ── Ícone e cor por qualidade do resíduo ─────────────────────
const QUALIDADE_CONFIG = {
  ruim:      { icone: <ThumbsDown size={11} className="text-red-500"    />, label: 'Ruim',      cor: 'bg-red-50 text-red-600 border-red-200'         },
  moderada:  { icone: <Smile      size={11} className="text-yellow-500" />, label: 'Moderada',  cor: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  boa:       { icone: <ThumbsUp   size={11} className="text-green-500"  />, label: 'Boa',       cor: 'bg-green-50 text-green-600 border-green-200'    },
  excelente: { icone: <Star       size={11} className="text-orange-400" />, label: 'Excelente', cor: 'bg-orange-50 text-orange-600 border-orange-200' },
};

// ── Formulário vazio para o modal de nova publicação ─────────
const FORM_VAZIO = {
  tipo_publicacao: 'oferta_residuo',
  titulo: '', descricao: '', id_residuo: '',
  quantidade_kg: '', valor_proposto: '', provincia: '', imagem: '',
};

export default function PaginaInicial() {
  const navigate   = useNavigate();
  const utilizador = getUtilizadorLocal();            // dados do utilizador autenticado
  const tipo       = utilizador?.tipo || 'comum';    // tipo: comum, empresa, admin, coletor

  // ── Estados do feed ──────────────────────────────────────
  const [feed,       setFeed]       = useState([]); // publicações do feed
  const [carregando, setCarregando] = useState(true); // loading inicial
  const [erro,       setErro]       = useState(''); // erro global
  const [filtro,     setFiltro]     = useState('todos'); // filtro activo

  // ── Estados da pesquisa com dropdown ─────────────────────
  const [pesquisa,           setPesquisa]           = useState('');
  const [resultadosPesquisa, setResultadosPesquisa] = useState(null); // null = não pesquisou ainda
  const [pesquisando,        setPesquisando]        = useState(false);
  const [mostrarDropdown,    setMostrarDropdown]    = useState(false);
  const pesquisaRef = useRef(null); // para fechar dropdown ao clicar fora
  const timeoutRef  = useRef(null); // para o debounce de 400ms

  // ── Estados do modal de nova publicação ──────────────────
  const [modalAberto, setModalAberto] = useState(false);
  const [residuos,    setResiduos]    = useState([]);
  const [formulario,  setFormulario]  = useState(FORM_VAZIO);
  const [publicando,  setPublicando]  = useState(false);
  const [erroForm,    setErroForm]    = useState('');

  // ── Estados do modal de interesse (empresa propõe compra) ─
  const [modalInteresse,    setModalInteresse]    = useState(false);
  const [publicacaoAlvo,    setPublicacaoAlvo]    = useState(null);
  const [valorProposto,     setValorProposto]     = useState('');
  const [mensagemInteresse, setMensagemInteresse] = useState('');
  const [enviandoInteresse, setEnviandoInteresse] = useState(false);
  const [erroInteresse,     setErroInteresse]     = useState('');

  // ── Estado de participações e propostas já enviadas ──────
  // Map { id_publicacao: true } — evita enviar duplicados
  const [interesseEnviado, setInteresseEnviado] = useState({});

  // ── Estado de participação em curso ──────────────────────
  // Guarda o id_publicacao do pedido em que está a criar entrega
  // Usado para mostrar loading no botão correcto e evitar duplo clique
  const [participando, setParticipando] = useState(null);

  // ── Estado das empresas para a sidebar ───────────────────
  const [empresas,       setEmpresas]       = useState([]);
  const [perfilModal,    setPerfilModal]    = useState(null); // { tipo, dados } — perfil publico a mostrar

  // ── Derivados ─────────────────────────────────────────────
  const tiposDisponiveis     = TIPOS_POR_PERFIL[tipo] || [];
  const podePublicar         = tiposDisponiveis.length > 0;
  const mostrarCamposResiduo = ['oferta_residuo', 'pedido_residuo'].includes(formulario.tipo_publicacao);

  // ── Carregamento inicial ──────────────────────────────────
  useEffect(() => {
    carregarFeed();
    carregarResiduos();
    getEmpresas().then(setEmpresas).catch(console.error);
  }, []);

  // ── Fecha dropdown ao clicar fora ────────────────────────
  useEffect(() => {
    const fechar = (e) => {
      if (pesquisaRef.current && !pesquisaRef.current.contains(e.target))
        setMostrarDropdown(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  // ── Carrega feed via GET /api/feed ────────────────────────
  // O getFeed pode devolver:
  //   - array simples (utilizador comum, coletador, admin)
  //   - { publicacoes, propostasEnviadas } (empresa)
  // Extraimos sempre o array para garantir compatibilidade
  const carregarFeed = async () => {
    try {
      setCarregando(true);
      const dados = await getFeed();
      // Se vier objecto (empresa), extrai apenas o array de publicacoes
      const publicacoes = Array.isArray(dados) ? dados : (dados?.publicacoes || []);
      setFeed(publicacoes);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // ── Carrega resíduos para o selector do modal ────────────
  const carregarResiduos = async () => {
    try { setResiduos(await getResiduos()); }
    catch (err) { console.error(err); }
  };

  // ── Pesquisa com debounce de 400ms ────────────────────────
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

  // ── Navega para o perfil ao clicar no dropdown ───────────
  const irParaPerfil = (tipo_resultado, item) => {
    setMostrarDropdown(false); setPesquisa(''); setResultadosPesquisa(null);
    // Todos os tipos abrem modal com perfil publico
    setPerfilModal({ tipo: tipo_resultado, dados: item });
  };

  const totalResultados = resultadosPesquisa
    ? (resultadosPesquisa.empresas?.length    || 0) +
      (resultadosPesquisa.utilizadores?.length || 0) +
      (resultadosPesquisa.coletadores?.length  || 0)
    : 0;

  const feedFiltrado = feed.filter(p => filtro === 'todos' || p.tipo_publicacao === filtro);
  const avisos = feed.filter(p => p.tipo_publicacao === 'aviso');

  const handleCampo = (campo, valor) => setFormulario(prev => ({ ...prev, [campo]: valor }));
  const handleTipo  = (novoTipo) => setFormulario({ ...FORM_VAZIO, tipo_publicacao: novoTipo });

  // ── Publica nova publicação via POST /api/feed ────────────
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

  // ── Apaga publicação via DELETE /api/feed/:id ─────────────
  const handleApagar = async (id) => {
    if (!window.confirm('Remover esta publicação?')) return;
    try { await apagarPublicacao(id); await carregarFeed(); }
    catch (err) { alert(err.message); }
  };

  // ── Abre modal de proposta de compra (empresa) ────────────
  const abrirModalInteresse = (publicacao) => {
    setPublicacaoAlvo(publicacao);
    setValorProposto(''); setMensagemInteresse(''); setErroInteresse('');
    setModalInteresse(true);
  };

  // ── Utilizador comum clica "Participar" num pedido de empresa ──
  // SEM MODAL — ao clicar está automaticamente a confirmar que tem o mínimo pedido.
  // Cria a entrega imediatamente e notifica a empresa.
  // O backend usa o endereço do perfil do utilizador e o mínimo do pedido.
  const handleParticipar = async (publicacao) => {
    if (participando) return; // evita duplo clique

    try {
      setParticipando(publicacao.id_publicacao); // activa loading neste card

      // Cria entrega ligada ao pedido da empresa
      // Backend: cria entrega pendente + notifica empresa com nome + kg comprometidos
      await participarEmPedido({
        id_empresa:         publicacao.id_autor,                          // empresa dona do pedido
        id_publicacao:      publicacao.id_publicacao,                     // liga ao pedido
        tipo_entrega:       'domicilio',                                  // empresa vai buscar
        endereco_domicilio: utilizador?.endereco || '',                   // endereço do perfil
        tipo_recompensa:    'dinheiro',                                   // padrão
        residuos: [{
          id_residuo: publicacao.id_residuo || null,                      // resíduo do pedido
          peso_kg:    parseFloat(publicacao.minimo_por_pessoa_kg || 0),   // mínimo comprometido
          quantidade: 1,
        }],
      });

      // Marca como "já participou" — botão muda para "Confirmado"
      setInteresseEnviado(prev => ({ ...prev, [publicacao.id_publicacao]: true }));
      await carregarFeed(); // actualiza barra de progresso do pedido

    } catch (err) {
      alert(err.message);
    } finally {
      setParticipando(null);
    }
  };

  // ── Envia proposta de compra (empresa → utilizador) ───────
  const handleEnviarInteresse = async () => {
    const vMin      = publicacaoAlvo?.preco_min ? parseFloat(publicacaoAlvo.preco_min) : null;
    const vMax      = publicacaoAlvo?.preco_max ? parseFloat(publicacaoAlvo.preco_max) : null;
    const vProposto = parseFloat(valorProposto);
    if (!valorProposto || vProposto <= 0) { setErroInteresse('Indica um valor proposto em Kz.'); return; }
    if (vMin && vProposto < vMin) { setErroInteresse(`O valor mínimo é ${vMin} Kz/kg.`); return; }
    if (vMax && vProposto > vMax) { setErroInteresse(`O valor máximo é ${vMax} Kz/kg.`); return; }
    try {
      setEnviandoInteresse(true); setErroInteresse('');
      await criarNotificacao({
        id_usuario_destino: publicacaoAlvo.id_autor,
        titulo:             'Nova proposta de compra',
        mensagem:           `${utilizador?.nome || 'Uma empresa'} quer comprar o teu resíduo "${publicacaoAlvo?.titulo}" por ${vProposto.toFixed(0)} Kz/kg.${mensagemInteresse ? ` Nota: ${mensagemInteresse}` : ''}`,
        id_publicacao:      publicacaoAlvo.id_publicacao,
        tipo:               'proposta',
      });
      setInteresseEnviado(prev => ({ ...prev, [publicacaoAlvo.id_publicacao]: true }));
      setModalInteresse(false);
    } catch (err) { setErroInteresse(err.message); }
    finally { setEnviandoInteresse(false); }
  };

  return (
    <div id="PaginaInicial" className="min-h-screen bg-green-100 pt-24 pb-12">
      <Header />

      <div className="px-6">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-800">Página Inicial</h1>
            <p className="text-green-600 text-sm mt-0.5">Olá, {utilizador?.nome?.split(' ')[0] || 'bem-vindo'}</p>
          </div>
          {podePublicar && (
            <button onClick={() => { setFormulario({ ...FORM_VAZIO, tipo_publicacao: tiposDisponiveis[0].valor }); setModalAberto(true); }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">
              <Plus size={16} /> Publicar
            </button>
          )}
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Coluna do feed ── */}
          <div className="flex-1 min-w-0">

            {/* Pesquisa com dropdown */}
            <div className="relative mb-4" ref={pesquisaRef}>
              <Search size={15} className="absolute left-3 top-3.5 text-gray-400 z-10" />
              <input type="text" placeholder="Pesquisar empresas, utilizadores, coletadores..."
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
                            <button key={e.id_empresa} onClick={() => irParaPerfil('empresa', e)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition text-left">
                              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{e.nome?.charAt(0).toUpperCase()}</div>
                              <div className="min-w-0">
                                <p className="text-gray-800 text-sm font-medium truncate">{e.nome}</p>
                                <p className="text-gray-400 text-xs flex items-center gap-1"><Building2 size={10} /> Empresa{e.provincia && <><MapPin size={10} className="ml-1" /> {e.provincia}</>}</p>
                              </div>
                              <ChevronRight size={14} className="text-gray-300 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                      {resultadosPesquisa.utilizadores?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Utilizadores</p>
                          {resultadosPesquisa.utilizadores.map(u => (
                            <button key={u.id_usuario} onClick={() => irParaPerfil('comum', u)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition text-left">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{u.nome?.charAt(0).toUpperCase()}</div>
                              <div className="min-w-0">
                                <p className="text-gray-800 text-sm font-medium truncate">{u.nome}</p>
                                <p className="text-gray-400 text-xs flex items-center gap-1"><User size={10} /> Utilizador{u.provincia && <><MapPin size={10} className="ml-1" /> {u.provincia}</>}</p>
                              </div>
                              <ChevronRight size={14} className="text-gray-300 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                      {resultadosPesquisa.coletadores?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Coletadores</p>
                          {resultadosPesquisa.coletadores.map(c => (
                            <button key={c.id_coletador} onClick={() => irParaPerfil('coletor', c)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition text-left">
                              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{c.nome?.charAt(0).toUpperCase()}</div>
                              <div className="min-w-0">
                                <p className="text-gray-800 text-sm font-medium truncate">{c.nome}</p>
                                <p className="text-gray-400 text-xs flex items-center gap-1"><Recycle size={10} /> Coletador{c.provincia && <><MapPin size={10} className="ml-1" /> {c.provincia}</>}</p>
                              </div>
                              <ChevronRight size={14} className="text-gray-300 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="px-4 py-2 border-t border-gray-100">
                        <p className="text-gray-300 text-xs text-center">{totalResultados} resultado{totalResultados !== 1 ? 's' : ''} encontrado{totalResultados !== 1 ? 's' : ''}</p>
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

            {/* Feed */}
            {carregando && <p className="text-green-700 text-center py-12">A carregar...</p>}
            {erro && <p className="text-red-500 text-center py-6">{erro}</p>}
            {!carregando && !erro && feedFiltrado.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-green-100">
                <p className="text-gray-400">Nenhuma publicação encontrada.</p>
                {podePublicar && <button onClick={() => setModalAberto(true)} className="mt-3 text-green-600 text-sm underline">Sê o primeiro a publicar</button>}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedFiltrado.map(p => (
                <CardPublicacao
                  key={p.id_publicacao}
                  publicacao={p}
                  utilizador={utilizador}
                  tipoUtilizador={tipo}
                  onApagar={handleApagar}
                  onInteresse={abrirModalInteresse}
                  onParticipar={handleParticipar}
                  interesseEnviado={interesseEnviado}
                  // id da publicação em que está a processar (para loading no botão correcto)
                  participandoId={participando}
                />
              ))}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
            <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-green-800 font-semibold text-sm mb-4 flex items-center gap-2">
                <Building2 size={15} className="text-purple-600" /> Empresas Parceiras
              </h3>
              {empresas.length === 0 ? <p className="text-gray-400 text-xs">Nenhuma empresa registada.</p> : (
                <div className="space-y-1">
                  {empresas.slice(0, 5).map(e => (
                    <button key={e.id_empresa} onClick={() => setPerfilModal({ tipo: 'empresa', dados: e })}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-green-50 transition text-left">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{e.nome?.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-700 text-xs font-medium truncate">{e.nome}</p>
                        {e.provincia && <p className="text-gray-400 text-xs flex items-center gap-1"><MapPin size={10} /> {e.provincia}</p>}
                      </div>
                      <ChevronRight size={13} className="text-gray-300 shrink-0" />
                    </button>
                  ))}
                  {empresas.length > 5 && <p className="text-green-600 text-xs text-center mt-1 pt-1">+{empresas.length - 5} empresas</p>}
                </div>
              )}
            </div>
            <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-red-600 font-semibold text-sm mb-4 flex items-center gap-2"><Bell size={15} /> Avisos</h3>
              {avisos.length === 0 ? <p className="text-gray-400 text-xs">Sem avisos de momento.</p> : (
                <div className="space-y-3">
                  {avisos.slice(0, 3).map(aviso => (
                    <div key={aviso.id_publicacao} className="border-l-2 border-red-300 pl-3">
                      <p className="text-gray-700 text-xs font-medium">{aviso.titulo}</p>
                      {aviso.descricao && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{aviso.descricao}</p>}
                      <p className="text-gray-300 text-xs mt-1">{new Date(aviso.criado_em).toLocaleDateString('pt-AO')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              {tiposDisponiveis.length > 1 && (
                <div>
                  <label className="text-gray-600 text-sm block mb-2">O que quero publicar</label>
                  <div className="grid grid-cols-2 gap-2">
                    {tiposDisponiveis.map(t => (
                      <button key={t.valor} onClick={() => handleTipo(t.valor)}
                        className={`py-2 px-3 rounded-xl text-sm font-medium transition border ${formulario.tipo_publicacao === t.valor ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
              {mostrarCamposResiduo && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-sm block mb-1">Tipo de Resíduo</label>
                    <select value={formulario.id_residuo} onChange={(e) => handleCampo('id_residuo', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                      <option value="">Seleccionar</option>
                      {residuos.map(r => (<option key={r.id_residuo} value={r.id_residuo}>{r.tipo}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm block mb-1">Província</label>
                    <input type="text" value={formulario.provincia} onChange={(e) => handleCampo('provincia', e.target.value)}
                      placeholder="Ex: Luanda"
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                </div>
              )}
              {!mostrarCamposResiduo && (
                <div>
                  <label className="text-gray-600 text-sm block mb-1">Província (opcional)</label>
                  <input type="text" value={formulario.provincia} onChange={(e) => handleCampo('provincia', e.target.value)}
                    placeholder="Ex: Luanda"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              )}
              {erroForm && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{erroForm}</p>}
            </div>
            <button onClick={handlePublicar} disabled={publicando}
              className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">
              {publicando ? 'A publicar...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      {/* Modal perfil publico — empresa, coletador ou utilizador */}
      {perfilModal && (() => {
        const d = perfilModal.dados;
        const t = perfilModal.tipo;
        const corAvatar = t === 'empresa' ? 'bg-purple-600' : t === 'coletor' ? 'bg-green-600' : 'bg-blue-500';
        const labelTipo = t === 'empresa' ? 'Empresa Recicladora' : t === 'coletor' ? 'Coletador' : 'Utilizador';
        return (
          <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
            <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-green-800 font-bold text-lg">{d.nome}</h3>
                <button onClick={() => setPerfilModal(null)}><X size={20} className="text-gray-400" /></button>
              </div>

              {/* Avatar + nome + tipo */}
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 rounded-full ${corAvatar} flex items-center justify-center text-white text-2xl font-bold shrink-0`}>
                  {d.nome?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-gray-800 font-semibold">{d.nome}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    t === 'empresa' ? 'bg-purple-100 text-purple-700' :
                    t === 'coletor' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{labelTipo}</span>
                </div>
              </div>

              {/* Informações comuns */}
              <div className="space-y-2 text-sm text-gray-600 mb-5 bg-gray-50 rounded-xl p-4">
                {(d.provincia || d.municipio) && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400 shrink-0" />
                    <span>{[d.municipio, d.provincia].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {d.telefone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-16 shrink-0">Telefone</span>
                    <span>{d.telefone}</span>
                  </div>
                )}
                {d.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-16 shrink-0">Email</span>
                    <span className="truncate">{d.email}</span>
                  </div>
                )}

                {/* Campos específicos de empresa */}
                {t === 'empresa' && d.horario_abertura && d.horario_fechamento && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-16 shrink-0">Horário</span>
                    <span>{d.horario_abertura} — {d.horario_fechamento}</span>
                  </div>
                )}
                {t === 'empresa' && d.residuos_aceites && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 text-xs w-16 shrink-0 mt-0.5">Resíduos</span>
                    <span className="text-xs">{d.residuos_aceites}</span>
                  </div>
                )}
                {t === 'empresa' && d.descricao && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 text-xs w-16 shrink-0 mt-0.5">Sobre</span>
                    <span className="text-xs leading-relaxed">{d.descricao}</span>
                  </div>
                )}

                {/* Campos específicos de coletador */}
                {t === 'coletor' && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-16 shrink-0">Tipo</span>
                    <span className="text-xs">{d.tipo === 'dependente' ? 'Coletador dependente' : 'Coletador independente'}</span>
                  </div>
                )}
              </div>

              <button onClick={() => setPerfilModal(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition">
                Fechar
              </button>
            </div>
          </div>
        );
      })()}

      {/* Modal de interesse — empresa propõe compra a utilizador */}
      {modalInteresse && publicacaoAlvo && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-green-800 font-bold text-lg">Propor Compra</h3>
              <button onClick={() => setModalInteresse(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              <p className="text-green-800 font-medium text-sm">{publicacaoAlvo.titulo}</p>
              {publicacaoAlvo.tipo_residuo && (
                <p className="text-green-600 text-xs mt-0.5 flex items-center gap-1">
                  <Recycle size={11} /> {publicacaoAlvo.tipo_residuo}
                  {publicacaoAlvo.provincia && <span className="ml-2 flex items-center gap-1"><MapPin size={11} />{publicacaoAlvo.provincia}</span>}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-gray-600 text-sm block mb-1">Valor que propões <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(Kz/kg)</span></label>
                <div className="relative">
                  <input type="number" min="1" step="1" value={valorProposto} onChange={(e) => setValorProposto(e.target.value)}
                    placeholder="Ex: 750"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  <span className="absolute right-4 top-3 text-gray-400 text-sm">Kz</span>
                </div>
                {publicacaoAlvo.preco_min && publicacaoAlvo.preco_max && (
                  <p className="text-xs text-gray-400 mt-1">Referência: {publicacaoAlvo.preco_min}–{publicacaoAlvo.preco_max} Kz/kg</p>
                )}
              </div>
              <div>
                <label className="text-gray-600 text-sm block mb-1">Nota (opcional)</label>
                <textarea value={mensagemInteresse} onChange={(e) => setMensagemInteresse(e.target.value)}
                  placeholder="Ex: Podemos recolher na próxima semana..." rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
              </div>
              {erroInteresse && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{erroInteresse}</p>}
            </div>
            <button onClick={handleEnviarInteresse} disabled={enviandoInteresse}
              className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              {enviandoInteresse ? 'A enviar...' : <><Handshake size={16} /> Enviar Proposta</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  CardPublicacao
//
//  Props:
//    onInteresse   → empresa clica "Tenho interesse" numa oferta
//    onParticipar  → utilizador clica "Participar" num pedido
//    interesseEnviado → { id_publicacao: true } — evita duplicados
//    participandoId   → id_publicacao em loading (mostra spinner)
// ============================================================
function CardPublicacao({ publicacao: p, utilizador, tipoUtilizador, onApagar, onInteresse, onParticipar, interesseEnviado, participandoId }) {
  const estilo   = ESTILOS[p.tipo_publicacao] || ESTILOS.aviso;
  const qualCfg  = QUALIDADE_CONFIG[p.qualidade] || null;
  const podeApagar = utilizador?.tipo === 'admin' || utilizador?.id === p.id_autor;

  // Empresa vê "Tenho interesse" em ofertas de utilizadores comuns
  const podeInteresse =
    tipoUtilizador === 'empresa' &&
    p.tipo_publicacao === 'oferta_residuo' &&
    p.id_autor !== utilizador?.id;

  // Utilizador comum vê "Participar" em pedidos de empresa
  const podeParticipar =
    tipoUtilizador === 'comum' &&
    p.tipo_publicacao === 'pedido_residuo' &&
    p.id_autor !== utilizador?.id;

  // Verifica se já enviou proposta ou participação para este pedido
  const jaEnviou = !!(interesseEnviado?.[p.id_publicacao]);

  // Verifica se este card específico está a processar a participação
  const esteCardEmLoading = participandoId === p.id_publicacao;

  const progresso = (() => {
    const acumulado = parseFloat(p.total_acumulado || 0);
    const meta      = parseFloat(p.minimo_para_agendar || 0);
    if (!meta) return null;
    return Math.min(Math.round((acumulado / meta) * 100), 100);
  })();

  const minimoUnidades = (() => {
    const kg  = parseFloat(p.minimo_por_pessoa_kg || 0);
    const kpu = parseFloat(p.kg_por_unidade || 0);
    if (!kg || !kpu) return null;
    return Math.ceil(kg / kpu);
  })();

  return (
    <div className={`bg-white border ${estilo.borda} rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col`}>

      {/* Imagem ou fundo colorido */}
      {p.imagem ? (
        <img src={p.imagem} alt={p.titulo} className="w-full h-44 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <div className={`w-full h-32 ${estilo.fundo} flex items-center justify-center`}>{estilo.icone}</div>
      )}

      <div className="p-4 flex flex-col flex-1">

        {/* Badge + data + apagar */}
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${estilo.badge}`}>{estilo.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">{new Date(p.criado_em).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}</span>
            {podeApagar && (
              <button onClick={() => onApagar(p.id_publicacao)} className="text-red-400 hover:text-red-600 transition">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <h3 className="text-gray-900 font-bold text-sm mb-1 line-clamp-2">{p.titulo}</h3>
        {p.descricao && <p className="text-gray-500 text-xs mb-2 line-clamp-2">{p.descricao}</p>}

        {/* Tags */}
        {(p.tipo_residuo || p.qualidade || p.provincia) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {p.tipo_residuo && <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"><Recycle size={10} /> {p.tipo_residuo}</span>}
            {qualCfg && <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${qualCfg.cor}`}>{qualCfg.icone} {qualCfg.label}</span>}
            {p.provincia && <span className="flex items-center gap-1 text-gray-400 text-xs"><MapPin size={10} /> {p.provincia}</span>}
          </div>
        )}

        {/* Valor que a empresa paga */}
        {p.tipo_publicacao === 'pedido_residuo' && p.valor_proposto && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-2">
            <p className="text-green-700 text-xs">A empresa paga</p>
            <p className="text-green-800 font-bold text-base">{parseFloat(p.valor_proposto).toFixed(0)} Kz<span className="text-xs font-normal text-green-600"> /kg</span></p>
          </div>
        )}

        {/* Mínimo por pessoa */}
        {p.minimo_por_pessoa_kg && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-2">
            <p className="text-blue-600 text-xs font-medium mb-0.5 flex items-center gap-1"><Info size={10} /> Mínimo por pessoa</p>
            <div className="flex items-center gap-3">
              <span className="text-gray-800 text-xs font-bold">{parseFloat(p.minimo_por_pessoa_kg).toFixed(0)} kg</span>
              {minimoUnidades !== null && p.nome_unidade && <span className="text-gray-500 text-xs">ou {minimoUnidades.toLocaleString()} {p.nome_unidade}s</span>}
            </div>
          </div>
        )}

        {/* Barra de progresso */}
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
            {progresso >= 100 && <p className="text-green-600 text-xs mt-1 font-medium">Meta atingida</p>}
          </div>
        )}

        {/* Rodapé: autor + botões */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{p.nome_autor?.charAt(0).toUpperCase()}</div>
            <span className="text-gray-500 text-xs truncate">{p.nome_autor}</span>
            {p.tipo_autor === 'empresa' && <span className="text-purple-600 text-xs flex items-center gap-1"><Building2 size={10} /> Empresa</span>}
          </div>

          {/* Empresa: "Tenho interesse" numa oferta de utilizador */}
          {podeInteresse && (
            jaEnviou
              ? <span className="text-green-600 text-xs font-medium flex items-center gap-1"><CheckCircle size={11} /> Enviada</span>
              : <button onClick={() => onInteresse(p)} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
                  <Handshake size={12} /> Tenho interesse
                </button>
          )}

          {/* Utilizador: "Participar" num pedido de empresa */}
          {/* Clique único — sem modal — cria entrega e notifica empresa imediatamente */}
          {podeParticipar && (
            jaEnviou
              ? <span className="text-green-600 text-xs font-medium flex items-center gap-1"><CheckCircle size={11} /> Confirmado</span>
              : <button
                  onClick={() => onParticipar(p)}
                  disabled={esteCardEmLoading} // desactiva enquanto processa
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
                  {esteCardEmLoading
                    ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> A confirmar...</>
                    : <><CheckCircle size={12} /> Participar</>
                  }
                </button>
          )}
        </div>
      </div>
    </div>
  );
}