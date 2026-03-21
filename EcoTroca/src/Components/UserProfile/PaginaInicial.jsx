
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, Building2, MapPin, Plus, Search, Trash2,
  X, HandshakeIcon, Bell, Target, Scale,
  ChevronRight, Truck, CheckCircle, Star, ThumbsUp,
  ThumbsDown, Smile, Leaf, Info, User, Megaphone,
  Calendar, Newspaper, BookOpen
} from 'lucide-react';
import Header from './Header';
import {
  getFeed, criarPublicacao, apagarPublicacao,
  getResiduos, getUtilizadorLocal, criarNotificacao,
  getEmpresas, pesquisar
} from '../../api.js';

// ── Tipos de publicação permitidos por perfil 
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
  oferta_residuo: { badge: 'bg-green-100 text-green-700',   borda: 'border-green-200',  label: 'Oferta de Resíduo', icone: <Recycle size={28} className="text-green-500" />,   fundo: 'bg-green-50'  },
  pedido_residuo: { badge: 'bg-purple-100 text-purple-700', borda: 'border-purple-200', label: 'Pedido de Empresa', icone: <Megaphone size={28} className="text-purple-500" />, fundo: 'bg-purple-50' },
  evento:         { badge: 'bg-blue-100 text-blue-700',     borda: 'border-blue-200',   label: 'Evento',            icone: <Calendar size={28} className="text-blue-500" />,    fundo: 'bg-blue-50'   },
  educacao:       { badge: 'bg-yellow-100 text-yellow-700', borda: 'border-yellow-200', label: 'Educação',          icone: <BookOpen size={28} className="text-yellow-500" />,  fundo: 'bg-yellow-50' },
  noticia:        { badge: 'bg-cyan-100 text-cyan-700',     borda: 'border-cyan-200',   label: 'Notícia',           icone: <Newspaper size={28} className="text-cyan-500" />,   fundo: 'bg-cyan-50'   },
  aviso:          { badge: 'bg-red-100 text-red-700',       borda: 'border-red-200',    label: 'Aviso',             icone: <Bell size={28} className="text-red-500" />,         fundo: 'bg-red-50'    },
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
  const navigate   = useNavigate();           // hook de navegação
  const utilizador = getUtilizadorLocal();    // dados do utilizador da sessão
  const tipo       = utilizador?.tipo || 'comum'; // tipo: comum, empresa, admin, coletor

  // ── Estados do feed ──────────────────────────────────────
  const [feed,       setFeed]       = useState([]); // publicações do feed
  const [carregando, setCarregando] = useState(true); // loading inicial
  const [erro,       setErro]       = useState(''); // erro global
  const [filtro,     setFiltro]     = useState('todos'); // filtro activo
  const [pesquisa,   setPesquisa]   = useState(''); // texto na barra de pesquisa

  // ── Estados da pesquisa com dropdown ─────────────────────
  const [resultadosPesquisa, setResultadosPesquisa] = useState(null); // null = ainda não pesquisou
  const [pesquisando,        setPesquisando]        = useState(false); // spinner de pesquisa
  const [mostrarDropdown,    setMostrarDropdown]    = useState(false); // visibilidade do dropdown
  const pesquisaRef = useRef(null);  // referência ao container da pesquisa (para fechar ao clicar fora)
  const timeoutRef  = useRef(null);  // referência ao timeout do debounce

  // ── Estados do modal de publicação ───────────────────────
  const [modalAberto, setModalAberto] = useState(false); // visibilidade do modal
  const [residuos,    setResiduos]    = useState([]);    // tipos de resíduos para o selector
  const [formulario,  setFormulario]  = useState(FORM_VAZIO); // dados do formulário
  const [publicando,  setPublicando]  = useState(false); // loading do botão publicar
  const [erroForm,    setErroForm]    = useState('');    // erro dentro do modal

  // ── Estados do modal de interesse (para empresas) ────────
  const [modalInteresse,    setModalInteresse]    = useState(false); // visibilidade do modal
  const [publicacaoAlvo,    setPublicacaoAlvo]    = useState(null);  // publicação alvo da proposta
  const [valorProposto,     setValorProposto]     = useState('');    // valor proposto em Kz/kg
  const [mensagemInteresse, setMensagemInteresse] = useState('');    // nota opcional
  const [enviandoInteresse, setEnviandoInteresse] = useState(false); // loading do botão enviar
  const [erroInteresse,     setErroInteresse]     = useState('');    // erro dentro do modal
  const [interesseEnviado,  setInteresseEnviado]  = useState({});   // map de propostas já enviadas

  // ── Estado das empresas para a sidebar ───────────────────
  const [empresas, setEmpresas] = useState([]);

  // ── Derivados ─────────────────────────────────────────────
  const tiposDisponiveis     = TIPOS_POR_PERFIL[tipo] || []; // tipos que este utilizador pode publicar
  const podePublicar         = tiposDisponiveis.length > 0;  // se pode publicar
  const mostrarCamposResiduo = ['oferta_residuo', 'pedido_residuo'].includes(formulario.tipo_publicacao); // campos extra de resíduo

  // ── Carregamento inicial ──────────────────────────────────
  useEffect(() => {
    carregarFeed();
    carregarResiduos();
    getEmpresas().then(setEmpresas).catch(console.error);
  }, []); // executa só uma vez ao montar

  // ── Fecha dropdown ao clicar fora da barra de pesquisa ───
  useEffect(() => {
    const fechar = (e) => {
      if (pesquisaRef.current && !pesquisaRef.current.contains(e.target))
        setMostrarDropdown(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar); // cleanup
  }, []);

  // ── Carrega publicações do feed via GET /api/feed ─────────
  const carregarFeed = async () => {
    try {
      setCarregando(true);
      setFeed(await getFeed());
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // ── Carrega tipos de resíduos para o selector do modal ───
  const carregarResiduos = async () => {
    try { setResiduos(await getResiduos()); }
    catch (err) { console.error(err); }
  };

  // ── Pesquisa com debounce de 400ms ────────────────────────
  // Evita chamar a API a cada tecla — espera 400ms após parar de escrever
  const handlePesquisa = (valor) => {
    setPesquisa(valor);              // actualiza o texto imediatamente
    clearTimeout(timeoutRef.current); // cancela o timeout anterior

    // Se o campo ficou vazio, limpa os resultados e fecha o dropdown
    if (!valor.trim()) {
      setResultadosPesquisa(null);
      setMostrarDropdown(false);
      return;
    }

    // Aguarda 400ms antes de chamar a API
    timeoutRef.current = setTimeout(async () => {
      try {
        setPesquisando(true); // mostra spinner
        const dados = await pesquisar(valor.trim()); // GET /api/pesquisa?q=...
        setResultadosPesquisa(dados); // guarda resultados
        setMostrarDropdown(true);     // abre o dropdown
      } catch (err) {
        console.error('Erro na pesquisa:', err);
      } finally {
        setPesquisando(false); // esconde spinner
      }
    }, 400);
  };

  // ── Navega para o perfil correcto consoante o tipo ────────
  const irParaPerfil = (tipo_resultado, item) => {
    setMostrarDropdown(false);    // fecha o dropdown
    setPesquisa('');              // limpa a barra
    setResultadosPesquisa(null);  // limpa os resultados

    if (tipo_resultado === 'empresa')       navigate(`/PerfilEmpresa/${item.id_empresa}`);
    else if (tipo_resultado === 'comum')   navigate(`/Perfil/${item.id_usuario}`);
    else if (tipo_resultado === 'coletor') navigate(`/PerfilColetador/${item.id_coletador}`);
  };

  // ── Total de resultados da pesquisa ──────────────────────
  const totalResultados = resultadosPesquisa
    ? (resultadosPesquisa.empresas?.length    || 0) +
      (resultadosPesquisa.utilizadores?.length || 0) +
      (resultadosPesquisa.coletadores?.length  || 0)
    : 0;

  // ── Feed filtrado apenas por tipo ─────────────────────────
  // A pesquisa de texto é para pessoas — não filtra o feed
  const feedFiltrado = feed.filter(p => filtro === 'todos' || p.tipo_publicacao === filtro);

  // ── Avisos reais do feed para a sidebar ──────────────────
  const avisos = feed.filter(p => p.tipo_publicacao === 'aviso');

  // ── Handlers do formulário de publicação ─────────────────
  const handleCampo = (campo, valor) =>
    setFormulario(prev => ({ ...prev, [campo]: valor }));

  // Quando muda o tipo, reseta o formulário mas mantém o tipo novo
  const handleTipo = (novoTipo) =>
    setFormulario({ ...FORM_VAZIO, tipo_publicacao: novoTipo });

  // ── Submete nova publicação via POST /api/feed ────────────
  const handlePublicar = async () => {
    if (!formulario.titulo.trim()) { setErroForm('O título é obrigatório.'); return; }
    try {
      setPublicando(true); setErroForm('');
      await criarPublicacao(formulario); // cria a publicação
      setModalAberto(false);
      setFormulario(FORM_VAZIO);         // reseta o formulário
      await carregarFeed();              // recarrega o feed
    } catch (err) { setErroForm(err.message); }
    finally { setPublicando(false); }
  };

  // ── Apaga publicação via DELETE /api/feed/:id ─────────────
  // Backend aplica penalização se publicação estiver em negociação
  const handleApagar = async (id) => {
    if (!window.confirm('Remover esta publicação?')) return;
    try { await apagarPublicacao(id); await carregarFeed(); }
    catch (err) { alert(err.message); }
  };

  // ── Abre o modal de proposta de compra ────────────────────
  const abrirModalInteresse = (publicacao) => {
    setPublicacaoAlvo(publicacao);  // guarda a publicação alvo
    setValorProposto('');           // limpa valor anterior
    setMensagemInteresse('');       // limpa nota anterior
    setErroInteresse('');           // limpa erros
    setModalInteresse(true);        // abre o modal
  };

  // ── Envia proposta de compra ao dono do resíduo ──────────
  // Cria notificação do tipo 'proposta' que aparece no header do utilizador
  const handleEnviarInteresse = async () => {
    const vMin      = publicacaoAlvo?.preco_min ? parseFloat(publicacaoAlvo.preco_min) : null;
    const vMax      = publicacaoAlvo?.preco_max ? parseFloat(publicacaoAlvo.preco_max) : null;
    const vProposto = parseFloat(valorProposto);

    // Validações do valor proposto
    if (!valorProposto || vProposto <= 0) { setErroInteresse('Indica um valor proposto em Kz.'); return; }
    if (vMin && vProposto < vMin) { setErroInteresse(`O valor mínimo é ${vMin} Kz/kg.`); return; }
    if (vMax && vProposto > vMax) { setErroInteresse(`O valor máximo é ${vMax} Kz/kg.`); return; }

    try {
      setEnviandoInteresse(true);
      setErroInteresse('');
      // Cria notificação no backend — também muda status da publicação para 'em_negociacao'
      await criarNotificacao({
        id_usuario_destino: publicacaoAlvo.id_autor,
        titulo:             'Nova proposta de compra',
        mensagem:           `${utilizador?.nome || 'Uma empresa'} quer comprar o teu resíduo "${publicacaoAlvo?.titulo}" por ${vProposto.toFixed(0)} Kz/kg.${mensagemInteresse ? ` Nota: ${mensagemInteresse}` : ''}`,
        id_publicacao:      publicacaoAlvo.id_publicacao,
        tipo:               'proposta',
      });
      // Marca esta publicação como "proposta já enviada" para não enviar de novo
      setInteresseEnviado(prev => ({ ...prev, [publicacaoAlvo.id_publicacao]: true }));
      setModalInteresse(false);
    } catch (err) {
      setErroInteresse(err.message);
    } finally {
      setEnviandoInteresse(false);
    }
  };

  return (
    <div id="PaginaInicial" className="min-h-screen bg-green-100 pt-24 pb-12">
      <Header />

      <div className="px-6">

        {/* ── Cabeçalho com saudação e botão publicar ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-800">Página Inicial</h1>
            <p className="text-green-600 text-sm mt-0.5">
              Olá, {utilizador?.nome?.split(' ')[0] || 'bem-vindo'}
            </p>
          </div>
          {/* Botão Publicar — só aparece para utilizadores que podem publicar */}
          {podePublicar && (
            <button
              onClick={() => {
                setFormulario({ ...FORM_VAZIO, tipo_publicacao: tiposDisponiveis[0].valor });
                setModalAberto(true);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition"
            >
              <Plus size={16} /> Publicar
            </button>
          )}
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Coluna do feed ── */}
          <div className="flex-1 min-w-0">

            {/* ── Barra de pesquisa com dropdown ── */}
            <div className="relative mb-4" ref={pesquisaRef}>
              <Search size={15} className="absolute left-3 top-3.5 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Pesquisar empresas, utilizadores, coletadores..."
                value={pesquisa}
                onChange={(e) => handlePesquisa(e.target.value)}
                onFocus={() => { if (resultadosPesquisa && totalResultados > 0) setMostrarDropdown(true); }}
                className="w-full bg-white border border-green-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
              />
              {/* Botão limpar — só aparece quando há texto e não está a pesquisar */}
              {pesquisa && !pesquisando && (
                <button onClick={() => { setPesquisa(''); setResultadosPesquisa(null); setMostrarDropdown(false); }}
                  className="absolute right-3 top-3.5">
                  <X size={15} className="text-gray-400" />
                </button>
              )}
              {/* Spinner de pesquisa */}
              {pesquisando && (
                <div className="absolute right-3 top-3.5">
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* ── Dropdown de resultados ── */}
              {mostrarDropdown && resultadosPesquisa && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-green-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                  {totalResultados === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      Nenhum resultado para "{pesquisa}"
                    </div>
                  ) : (
                    <>
                      {/* Secção Empresas */}
                      {resultadosPesquisa.empresas?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Empresas</p>
                          {resultadosPesquisa.empresas.map(e => (
                            <button key={e.id_empresa} onClick={() => irParaPerfil('empresa', e)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition text-left">
                              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {e.nome?.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-gray-800 text-sm font-medium truncate">{e.nome}</p>
                                <p className="text-gray-400 text-xs flex items-center gap-1">
                                  <Building2 size={10} /> Empresa Recicladora
                                  {e.provincia && <><MapPin size={10} className="ml-1" /> {e.provincia}</>}
                                </p>
                              </div>
                              <ChevronRight size={14} className="text-gray-300 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Secção Utilizadores */}
                      {resultadosPesquisa.utilizadores?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Utilizadores</p>
                          {resultadosPesquisa.utilizadores.map(u => (
                            <button key={u.id_usuario} onClick={() => irParaPerfil('comum', u)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition text-left">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {u.nome?.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-gray-800 text-sm font-medium truncate">{u.nome}</p>
                                <p className="text-gray-400 text-xs flex items-center gap-1">
                                  <User size={10} /> Utilizador
                                  {u.provincia && <><MapPin size={10} className="ml-1" /> {u.provincia}</>}
                                </p>
                              </div>
                              <ChevronRight size={14} className="text-gray-300 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Secção Coletadores */}
                      {resultadosPesquisa.coletadores?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Coletadores</p>
                          {resultadosPesquisa.coletadores.map(c => (
                            <button key={c.id_coletador} onClick={() => irParaPerfil('coletor', c)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition text-left">
                              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {c.nome?.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-gray-800 text-sm font-medium truncate">{c.nome}</p>
                                <p className="text-gray-400 text-xs flex items-center gap-1">
                                  <Recycle size={10} /> Coletador
                                  {c.provincia && <><MapPin size={10} className="ml-1" /> {c.provincia}</>}
                                </p>
                              </div>
                              <ChevronRight size={14} className="text-gray-300 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Rodapé com total de resultados */}
                      <div className="px-4 py-2 border-t border-gray-100">
                        <p className="text-gray-300 text-xs text-center">
                          {totalResultados} resultado{totalResultados !== 1 ? 's' : ''} encontrado{totalResultados !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Filtros de tipo ── */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
              {FILTROS.map(f => (
                <button key={f.valor} onClick={() => setFiltro(f.valor)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition shrink-0 ${
                    filtro === f.valor
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* ── Feed em grid 2 colunas ── */}
            {carregando && <p className="text-green-700 text-center py-12">A carregar...</p>}
            {erro && <p className="text-red-500 text-center py-6">{erro}</p>}
            {!carregando && !erro && feedFiltrado.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-green-100">
                <p className="text-gray-400">Nenhuma publicação encontrada.</p>
                {podePublicar && (
                  <button onClick={() => setModalAberto(true)} className="mt-3 text-green-600 text-sm underline">
                    Sê o primeiro a publicar
                  </button>
                )}
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
                  interesseJaEnviado={!!interesseEnviado[p.id_publicacao]}
                />
              ))}
            </div>
          </div>

          {/* ── Sidebar — só no desktop ── */}
          <div className="hidden lg:flex flex-col gap-4 w-64 shrink-0">

            {/* Empresas Parceiras — clicáveis */}
            <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-green-800 font-semibold text-sm mb-4 flex items-center gap-2">
                <Building2 size={15} className="text-purple-600" /> Empresas Parceiras
              </h3>
              {empresas.length === 0 ? (
                <p className="text-gray-400 text-xs">Nenhuma empresa registada.</p>
              ) : (
                <div className="space-y-1">
                  {empresas.slice(0, 5).map(e => (
                    // Clique navega para o perfil público da empresa
                    <button key={e.id_empresa}
                      onClick={() => navigate(`/PerfilEmpresa/${e.id_empresa}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-green-50 transition text-left">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {e.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-700 text-xs font-medium truncate">{e.nome}</p>
                        {e.provincia && (
                          <p className="text-gray-400 text-xs flex items-center gap-1">
                            <MapPin size={10} /> {e.provincia}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={13} className="text-gray-300 shrink-0" />
                    </button>
                  ))}
                  {empresas.length > 5 && (
                    <p className="text-green-600 text-xs text-center mt-1 pt-1">
                      +{empresas.length - 5} empresas
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Avisos reais do feed */}
            <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-red-600 font-semibold text-sm mb-4 flex items-center gap-2">
                <Bell size={15} /> Avisos
              </h3>
              {avisos.length === 0 ? (
                <p className="text-gray-400 text-xs">Sem avisos de momento.</p>
              ) : (
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

      {/* ── Modal nova publicação ── */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg">Nova Publicação</h3>
              <button onClick={() => setModalAberto(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {/* Selector de tipo — só aparece se houver mais de um tipo disponível */}
              {tiposDisponiveis.length > 1 && (
                <div>
                  <label className="text-gray-600 text-sm block mb-2">O que quero publicar</label>
                  <div className="grid grid-cols-2 gap-2">
                    {tiposDisponiveis.map(t => (
                      <button key={t.valor} onClick={() => handleTipo(t.valor)}
                        className={`py-2 px-3 rounded-xl text-sm font-medium transition border ${
                          formulario.tipo_publicacao === t.valor
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'
                        }`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Título obrigatório */}
              <div>
                <label className="text-gray-600 text-sm block mb-1">Título <span className="text-red-500">*</span></label>
                <input type="text" value={formulario.titulo} onChange={(e) => handleCampo('titulo', e.target.value)}
                  placeholder="Título da publicação"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              {/* Descrição opcional */}
              <div>
                <label className="text-gray-600 text-sm block mb-1">Descrição (opcional)</label>
                <textarea value={formulario.descricao} onChange={(e) => handleCampo('descricao', e.target.value)}
                  placeholder="Mais detalhes..." rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
              </div>
              {/* Campos de resíduo — só para oferta_residuo e pedido_residuo */}
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
              {/* Província para outros tipos */}
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

      {/* ── Modal de interesse — só para empresas ── */}
      {modalInteresse && publicacaoAlvo && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-green-800 font-bold text-lg">Propor Compra</h3>
              <button onClick={() => setModalInteresse(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            {/* Resumo da publicação alvo */}
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
                {/* Referência de preço do mercado */}
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
              {enviandoInteresse ? 'A enviar...' : <><HandshakeIcon size={16} /> Enviar Proposta</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  CardPublicacao
//  Card individual para cada publicação no feed.
//  Mostra imagem ou fundo colorido com ícone consoante o tipo.
//  Mostra campos ricos: qualidade, mínimo por pessoa, progresso.
//  Só o autor e admin podem apagar.
//  Só empresas podem enviar proposta em ofertas de resíduo.
// ============================================================
function CardPublicacao({ publicacao: p, utilizador, tipoUtilizador, onApagar, onInteresse, interesseJaEnviado }) {
  const estilo    = ESTILOS[p.tipo_publicacao] || ESTILOS.aviso; // estilo visual do tipo
  const qualCfg   = QUALIDADE_CONFIG[p.qualidade] || null;        // config da qualidade se existir
  const podeApagar = utilizador?.tipo === 'admin' || utilizador?.id === p.id_autor; // quem pode apagar
  const temAcordos = parseFloat(p.total_acumulado || 0) > 0; // se já há acordos activos

  // Empresa vê "Tenho interesse" em ofertas de resíduo de utilizadores comuns
  const podeInteresse =
    tipoUtilizador === 'empresa' &&
    p.tipo_publicacao === 'oferta_residuo' &&
    p.id_autor !== utilizador?.id;

  // Utilizador comum vê "Quero Participar" em pedidos de empresa
  const podeParticipar =
    tipoUtilizador === 'comum' &&
    p.tipo_publicacao === 'pedido_residuo' &&
    p.id_autor !== utilizador?.id;

  // Calcula progresso da barra (total acumulado / total para agendar)
  const progresso = (() => {
    const acumulado = parseFloat(p.total_acumulado || 0);
    const meta      = parseFloat(p.minimo_para_agendar || 0);
    if (!meta) return null;
    return Math.min(Math.round((acumulado / meta) * 100), 100);
  })();

  // Calcula equivalente em unidades do mínimo por pessoa
  const minimoUnidades = (() => {
    const kg  = parseFloat(p.minimo_por_pessoa_kg || 0);
    const kpu = parseFloat(p.kg_por_unidade || 0);
    if (!kg || !kpu) return null;
    return Math.ceil(kg / kpu);
  })();

  return (
    <div className={`bg-white border ${estilo.borda} rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col`}>

      {/* Imagem ou fundo colorido com ícone */}
      {p.imagem ? (
        <img src={p.imagem} alt={p.titulo} className="w-full h-44 object-cover"
          onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <div className={`w-full h-32 ${estilo.fundo} flex items-center justify-center`}>
          {estilo.icone}
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">

        {/* Badge + data + acções */}
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${estilo.badge}`}>{estilo.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">{new Date(p.criado_em).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}</span>
            {/* Botão apagar — só para autor e admin */}
            {podeApagar && (
              <button onClick={() => onApagar(p.id_publicacao)} className="text-red-400 hover:text-red-600 transition">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Título */}
        <h3 className="text-gray-900 font-bold text-sm mb-1 line-clamp-2">{p.titulo}</h3>

        {/* Descrição */}
        {p.descricao && <p className="text-gray-500 text-xs mb-2 line-clamp-2">{p.descricao}</p>}

        {/* Tags: tipo resíduo, qualidade, localização */}
        {(p.tipo_residuo || p.qualidade || p.provincia) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {p.tipo_residuo && (
              <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                <Recycle size={10} /> {p.tipo_residuo}
              </span>
            )}
            {qualCfg && (
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${qualCfg.cor}`}>
                {qualCfg.icone} {qualCfg.label}
              </span>
            )}
            {p.provincia && (
              <span className="flex items-center gap-1 text-gray-400 text-xs">
                <MapPin size={10} /> {p.provincia}
              </span>
            )}
          </div>
        )}

        {/* Valor que a empresa paga — só em pedidos de resíduo */}
        {p.tipo_publicacao === 'pedido_residuo' && p.valor_proposto && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-2">
            <p className="text-green-700 text-xs">A empresa paga</p>
            <p className="text-green-800 font-bold text-base">
              {parseFloat(p.valor_proposto).toFixed(0)} Kz<span className="text-xs font-normal text-green-600"> /kg</span>
            </p>
          </div>
        )}

        {/* Mínimo por pessoa — só em pedidos com mínimo definido */}
        {p.minimo_por_pessoa_kg && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-2">
            <p className="text-blue-600 text-xs font-medium mb-0.5 flex items-center gap-1"><Info size={10} /> Mínimo por pessoa</p>
            <div className="flex items-center gap-3">
              <span className="text-gray-800 text-xs font-bold">{parseFloat(p.minimo_por_pessoa_kg).toFixed(0)} kg</span>
              {minimoUnidades !== null && p.nome_unidade && (
                <span className="text-gray-500 text-xs">ou {minimoUnidades.toLocaleString()} {p.nome_unidade}s</span>
              )}
            </div>
          </div>
        )}

        {/* Barra de progresso — só em pedidos com meta definida */}
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

        {/* Rodapé: autor + botão de interesse */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {p.nome_autor?.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-500 text-xs truncate">{p.nome_autor}</span>
            {p.tipo_autor === 'empresa' && (
              <span className="text-purple-600 text-xs flex items-center gap-1"><Building2 size={10} /> Empresa</span>
            )}
          </div>

          {/* Botão de interesse — só para empresas em ofertas de outros */}
          {podeInteresse && (
            interesseJaEnviado
              ? <span className="text-green-600 text-xs font-medium flex items-center gap-1"><CheckCircle size={11} /> Enviada</span>
              : (
                <button onClick={() => onInteresse(p)}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
                  <HandshakeIcon size={12} /> Tenho interesse
                </button>
              )
          )}

          {/* Botão "Quero Participar" — utilizador comum responde a pedido de empresa */}
          {podeParticipar && (
            <button
              onClick={() => onInteresse(p)}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
              <CheckCircle size={12} /> Participar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}