// ============================================================
//  PaginaInicialEmpresa.jsx — Página Inicial da Empresa Recicladora
//  Guardar em: src/Components/UserProfile/PaginaInicialEmpresa.jsx
//
//  Estrutura, cores e layout 100% iguais à PaginaInicial.jsx
//  Única diferença:
//    - Usa EmpresaHeader em vez de Header
//    - tiposDisponiveis fixos para empresa (sem TIPOS_POR_PERFIL dinâmico)
//    - podeTeresseInteresse usa utilizador?.tipo === 'empresa' directamente
// ============================================================

import { useState, useEffect } from 'react';                                   // Hooks do React
import {
  Recycle, Building2, MapPin,
  Plus, Search, Trash2, X, HandshakeIcon, Bell
} from 'lucide-react';                                                          // Ícones Lucide — iguais à PaginaInicial
import EmpresaHeader from './EmpresaHeader';                                    // Header da empresa (substitui o Header comum)
import {
  getFeed, criarPublicacao, apagarPublicacao,
  getResiduos, getUtilizadorLocal, criarNotificacao, getEmpresas
} from '../../api.js';                                                          // Funções da API — iguais à PaginaInicial

// ── Tipos de publicação que a empresa pode criar ──
// Empresa não pode publicar oferta_residuo — só utilizadores comuns fazem isso
const TIPOS_EMPRESA = [
  { valor: 'pedido_residuo', label: '🏭 Pedido de Resíduo' }, // Empresa pede resíduo aos utilizadores
  { valor: 'evento',         label: '📅 Evento'            }, // Eventos organizados pela empresa
  { valor: 'educacao',       label: '📚 Educação'          }, // Conteúdo educativo sobre reciclagem
  { valor: 'noticia',        label: '📰 Notícia'           }, // Notícias relevantes da empresa
];

// ── Filtros do feed — iguais à PaginaInicial do utilizador ──
const FILTROS = [
  { valor: 'todos',          label: 'Tudo',     icon: '🌍' }, // Mostra todas as publicações
  { valor: 'oferta_residuo', label: 'Ofertas',  icon: '♻️' }, // Só ofertas de resíduo dos utilizadores
  { valor: 'pedido_residuo', label: 'Pedidos',  icon: '🏭' }, // Só pedidos de resíduo das empresas
  { valor: 'evento',         label: 'Eventos',  icon: '📅' }, // Só eventos
  { valor: 'educacao',       label: 'Educação', icon: '📚' }, // Só conteúdo educativo
  { valor: 'noticia',        label: 'Notícias', icon: '📰' }, // Só notícias
  { valor: 'aviso',          label: 'Avisos',   icon: '📣' }, // Só avisos do admin
];

// ── Estilos visuais por tipo — iguais à PaginaInicial do utilizador ──
// Cada tipo tem cor de badge e borda diferentes para identificação visual rápida
const ESTILOS = {
  oferta_residuo: { badge: 'bg-green-100 text-green-700',   borda: 'border-green-100',  label: '♻️ Oferta de Resíduo' },
  pedido_residuo: { badge: 'bg-purple-100 text-purple-700', borda: 'border-purple-100', label: '🏭 Pedido de Empresa'  },
  evento:         { badge: 'bg-blue-100 text-blue-700',     borda: 'border-blue-100',   label: '📅 Evento'             },
  educacao:       { badge: 'bg-yellow-100 text-yellow-700', borda: 'border-yellow-100', label: '📚 Educação'           },
  noticia:        { badge: 'bg-cyan-100 text-cyan-700',     borda: 'border-cyan-100',   label: '📰 Notícia'            },
  aviso:          { badge: 'bg-red-100 text-red-700',       borda: 'border-red-100',    label: '📣 Aviso'              },
};

// ── Formulário vazio — igual à PaginaInicial, tipo padrão muda para pedido_residuo ──
const FORM_VAZIO = {
  tipo_publicacao: 'pedido_residuo', // Tipo padrão da empresa
  titulo: '', descricao: '', id_residuo: '',
  quantidade_kg: '', valor_proposto: '', provincia: '', imagem: '',
};

export default function PaginaInicialEmpresa() {
  const utilizador = getUtilizadorLocal();                                      // Dados da empresa autenticada do localStorage

  // ── Estados do feed — iguais à PaginaInicial ──
  const [feed,       setFeed]       = useState([]);                            // Lista de publicações do feed
  const [carregando, setCarregando] = useState(true);                          // Estado de carregamento inicial
  const [erro,       setErro]       = useState('');                            // Mensagem de erro do feed
  const [filtro,     setFiltro]     = useState('todos');                       // Filtro activo (padrão: todos)
  const [pesquisa,   setPesquisa]   = useState('');                            // Texto da barra de pesquisa

  // ── Estados do modal de nova publicação — iguais à PaginaInicial ──
  const [modalAberto, setModalAberto] = useState(false);                       // Controla abertura do modal
  const [residuos,    setResiduos]    = useState([]);                          // Tipos de resíduos para o selector
  const [formulario,  setFormulario]  = useState(FORM_VAZIO);                  // Dados do formulário de publicação
  const [publicando,  setPublicando]  = useState(false);                       // Estado de envio do formulário
  const [erroForm,    setErroForm]    = useState('');                          // Erro do formulário

  // ── Estados do modal de interesse — iguais à PaginaInicial ──
  const [modalInteresse,    setModalInteresse]    = useState(false);           // Controla abertura do modal de proposta
  const [publicacaoAlvo,    setPublicacaoAlvo]    = useState(null);            // Publicação sobre a qual se quer propor
  const [valorProposto,     setValorProposto]     = useState('');              // Valor em Kz/kg proposto pela empresa
  const [mensagemInteresse, setMensagemInteresse] = useState('');              // Nota opcional para o utilizador
  const [enviandoInteresse, setEnviandoInteresse] = useState(false);           // Estado de envio da proposta
  const [erroInteresse,     setErroInteresse]     = useState('');              // Erro da proposta
  const [interesseEnviado,  setInteresseEnviado]  = useState({});              // Mapa de propostas já enviadas por id_publicacao

  // ── Dados da sidebar — igual à PaginaInicial ──
  const [empresas, setEmpresas] = useState([]);                                // Lista de empresas para a sidebar

  const tiposDisponiveis     = TIPOS_EMPRESA;                                  // Empresa tem sempre os 4 tipos disponíveis
  const podePublicar         = true;                                           // Empresa pode sempre publicar
  const mostrarCamposResiduo = ['oferta_residuo', 'pedido_residuo'].includes(formulario.tipo_publicacao); // Controla campos de resíduo

  // Carrego feed, resíduos e empresas ao montar o componente
  useEffect(() => {
    carregarFeed();                                                              // Busca publicações do feed
    carregarResiduos();                                                         // Busca tipos de resíduos para o selector
    getEmpresas().then(setEmpresas).catch(console.error);                       // Busca empresas para a sidebar
  }, []);

  // Vai buscar todas as publicações ao backend via GET /api/feed
  const carregarFeed = async () => {
    try {
      setCarregando(true);                                                       // Activa estado de carregamento
      setFeed(await getFeed());                                                  // Guarda as publicações no estado
    } catch (err) {
      setErro(err.message);                                                      // Mostra erro se a chamada falhar
    } finally {
      setCarregando(false);                                                      // Desactiva carregamento sempre
    }
  };

  // Vai buscar os tipos de resíduos para o selector do formulário
  const carregarResiduos = async () => {
    try { setResiduos(await getResiduos()); }                                   // Guarda os resíduos
    catch (err) { console.error(err); }                                         // Regista erro no console
  };

  // Aplico filtro de tipo e pesquisa em simultâneo — igual à PaginaInicial
  const feedFiltrado = feed
    .filter(p => filtro === 'todos' || p.tipo_publicacao === filtro)            // Filtra por tipo de publicação
    .filter(p => {
      if (!pesquisa) return true;                                               // Sem pesquisa mostra tudo
      const t = pesquisa.toLowerCase();                                         // Normaliza o texto de pesquisa
      return (
        p.titulo?.toLowerCase().includes(t)     ||                             // Pesquisa no título
        p.descricao?.toLowerCase().includes(t)  ||                             // Pesquisa na descrição
        p.nome_autor?.toLowerCase().includes(t) ||                             // Pesquisa no nome do autor
        p.provincia?.toLowerCase().includes(t)                                 // Pesquisa na província
      );
    });

  // Filtra só os avisos do feed para mostrar na sidebar
  const avisos = feed.filter(p => p.tipo_publicacao === 'aviso');

  // Actualiza um campo do formulário sem apagar os outros
  const handleCampo = (campo, valor) =>
    setFormulario(prev => ({ ...prev, [campo]: valor }));

  // Quando muda o tipo de publicação — reseta o formulário mantendo o novo tipo
  const handleTipo = (novoTipo) =>
    setFormulario({ ...FORM_VAZIO, tipo_publicacao: novoTipo });

  // Submete a nova publicação ao backend via POST /api/feed
  const handlePublicar = async () => {
    if (!formulario.titulo.trim()) { setErroForm('O título é obrigatório.'); return; } // Valida título
    try {
      setPublicando(true); setErroForm('');                                     // Activa estado de envio
      await criarPublicacao(formulario);                                        // Chama POST /api/feed
      setModalAberto(false);                                                    // Fecha o modal
      setFormulario(FORM_VAZIO);                                                // Reseta o formulário
      await carregarFeed();                                                     // Recarrega o feed
    } catch (err) { setErroForm(err.message); }                                // Mostra erro do backend
    finally { setPublicando(false); }                                           // Desactiva estado de envio
  };

  // Apaga publicação via DELETE /api/feed/:id — igual à PaginaInicial
  const handleApagar = async (id) => {
    if (!window.confirm('Remover esta publicação?')) return;                    // Pede confirmação
    try { await apagarPublicacao(id); await carregarFeed(); }                  // Apaga e recarrega
    catch (err) { alert(err.message); }                                         // Mostra erro
  };

  // Abre o modal de proposta com os dados da publicação seleccionada
  const abrirModalInteresse = (publicacao) => {
    setPublicacaoAlvo(publicacao);                                              // Guarda publicação alvo
    setValorProposto('');                                                       // Limpa valor anterior
    setMensagemInteresse('');                                                   // Limpa nota anterior
    setErroInteresse('');                                                       // Limpa erros anteriores
    setModalInteresse(true);                                                    // Abre o modal
  };

  // Envia proposta de compra ao dono do resíduo — igual à PaginaInicial
  const handleEnviarInteresse = async () => {
    const vMin      = publicacaoAlvo?.preco_min ? parseFloat(publicacaoAlvo.preco_min) : null; // Preço mínimo do resíduo
    const vMax      = publicacaoAlvo?.preco_max ? parseFloat(publicacaoAlvo.preco_max) : null; // Preço máximo do resíduo
    const vProposto = parseFloat(valorProposto);                                // Valor proposto pela empresa

    if (!valorProposto || vProposto <= 0) {
      setErroInteresse('Indica um valor proposto em Kz.'); return;             // Valida preenchimento
    }
    if (vMin && vProposto < vMin) {
      setErroInteresse(`O valor mínimo para este resíduo é ${vMin} Kz/kg.`); return; // Valida mínimo
    }
    if (vMax && vProposto > vMax) {
      setErroInteresse(`O valor máximo para este resíduo é ${vMax} Kz/kg.`); return; // Valida máximo
    }

    try {
      setEnviandoInteresse(true);                                               // Activa estado de envio
      setErroInteresse('');                                                     // Limpa erros
      const nomeEmpresa   = utilizador?.nome || 'Uma empresa';                 // Nome da empresa para a notificação
      const tituloResiduo = publicacaoAlvo?.titulo || 'resíduo';               // Título do resíduo para a notificação

      // Envia notificação ao dono do resíduo e muda status para 'em_negociacao'
      await criarNotificacao({
        id_usuario_destino: publicacaoAlvo.id_autor,                           // ID do dono do resíduo
        titulo:             '💼 Nova proposta de compra',                      // Título da notificação
        mensagem:           `${nomeEmpresa} quer comprar o teu resíduo "${tituloResiduo}" por ${vProposto.toFixed(0)} Kz/kg.${mensagemInteresse ? ` Nota: ${mensagemInteresse}` : ''}`,
        id_publicacao:      publicacaoAlvo.id_publicacao,                      // Para aceitar/recusar depois
        tipo:               'proposta',                                         // Tipo proposta — mostra botões aceitar/recusar
      });

      setInteresseEnviado(prev => ({ ...prev, [publicacaoAlvo.id_publicacao]: true })); // Marca como enviada
      setModalInteresse(false);                                                 // Fecha o modal
    } catch (err) {
      setErroInteresse(err.message);                                            // Mostra erro do backend
    } finally {
      setEnviandoInteresse(false);                                              // Desactiva estado de envio
    }
  };

  return (
    // bg-green-100 + pt-24 + pb-12 — exactamente igual à PaginaInicial do utilizador
    <div id="PaginaInicialEmpresa" className="min-h-screen bg-green-100 pt-24 pb-12">
      <EmpresaHeader />                                                         {/* Header da empresa — substitui o Header comum */}

      {/* px-6 — igual à PaginaInicial do utilizador */}
      <div className="px-6">

        {/* Cabeçalho — estrutura e classes iguais à PaginaInicial */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-800">Página Inicial</h1> {/* Mesmo título */}
            <p className="text-green-600 text-sm mt-0.5">
              Olá, {utilizador?.nome?.split(' ')[0] || 'bem-vinda'} 👋          {/* Primeiro nome da empresa */}
            </p>
          </div>
          {/* Botão publicar — igual ao da PaginaInicial */}
          {podePublicar && (
            <button
              onClick={() => {
                setFormulario({ ...FORM_VAZIO, tipo_publicacao: tiposDisponiveis[0].valor }); // Primeiro tipo disponível
                setModalAberto(true);                                           // Abre o modal
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition"
            >
              <Plus size={16} /> Publicar
            </button>
          )}
        </div>

        {/* Layout: feed + sidebar — flex gap-6, igual à PaginaInicial */}
        <div className="flex gap-6 items-start">

          {/* ── Coluna do feed ── */}
          <div className="flex-1 min-w-0">

            {/* Pesquisa — igual à PaginaInicial */}
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-3.5 text-gray-400" /> {/* Ícone lupa */}
              <input
                type="text"
                placeholder="Pesquisar..."                                      {/* Placeholder igual */}
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}                  // Actualiza pesquisa
                className="w-full bg-white border border-green-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
              />
              {/* X para limpar pesquisa — igual à PaginaInicial */}
              {pesquisa && (
                <X size={15} className="absolute right-3 top-3.5 text-gray-400 cursor-pointer"
                  onClick={() => setPesquisa('')} />
              )}
            </div>

            {/* Filtros — iguais à PaginaInicial */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
              {FILTROS.map(f => (
                <button
                  key={f.valor}
                  onClick={() => setFiltro(f.valor)}                           // Muda filtro activo
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition shrink-0 ${
                    filtro === f.valor
                      ? 'bg-green-600 text-white'                              // Filtro activo
                      : 'bg-white text-green-700 border border-green-200 hover:bg-green-50' // Filtro inactivo
                  }`}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>

            {/* Lista de publicações — 1 coluna mobile, 2 colunas desktop, igual à PaginaInicial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estado de carregamento */}
              {carregando && (
                <p className="text-green-700 text-center py-12 md:col-span-2">A carregar...</p>
              )}
              {/* Mensagem de erro */}
              {erro && (
                <p className="text-red-500 text-center py-6 md:col-span-2">{erro}</p>
              )}
              {/* Estado vazio — igual à PaginaInicial */}
              {!carregando && !erro && feedFiltrado.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-green-100 md:col-span-2">
                  <p className="text-gray-400">Nenhuma publicação encontrada.</p>
                  {podePublicar && (
                    <button onClick={() => setModalAberto(true)}
                      className="mt-3 text-green-600 text-sm underline">
                      Sê o primeiro a publicar
                    </button>
                  )}
                </div>
              )}
              {/* Cartões de publicação */}
              {feedFiltrado.map(p => (
                <CartaoPublicacao
                  key={p.id_publicacao}
                  publicacao={p}
                  utilizador={utilizador}                                       // Dados da empresa autenticada
                  tipoUtilizador="empresa"                                      // Fixo — esta página é sempre da empresa
                  onApagar={handleApagar}                                       // Função para apagar publicação própria
                  onInteresse={abrirModalInteresse}                             // Função para abrir modal de proposta
                  interesseJaEnviado={!!interesseEnviado[p.id_publicacao]}     // Se já enviou proposta
                />
              ))}
            </div>
          </div>

          {/* ── Sidebar — hidden lg:flex, igual à PaginaInicial ── */}
          <div className="hidden lg:flex flex-col gap-4 w-68 shrink-0">

            {/* Card: Empresas Parceiras — igual à PaginaInicial */}
            <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-green-800 font-semibold text-sm mb-4 flex items-center gap-2">
                <Building2 size={15} className="text-purple-600" /> Empresas Parceiras
              </h3>
              {empresas.length === 0 ? (
                <p className="text-gray-400 text-xs">Nenhuma empresa registada.</p>
              ) : (
                <div className="space-y-3">
                  {empresas.slice(0, 5).map(e => (                             // Máximo 5 empresas
                    <div key={e.id_empresa} className="flex items-center gap-3">
                      {/* Avatar com inicial da empresa */}
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {e.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-700 text-xs font-medium truncate">{e.nome}</p>
                        {e.provincia && (
                          <p className="text-gray-400 text-xs flex items-center gap-1">
                            <MapPin size={10} /> {e.provincia}                 {/* Província da empresa */}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Quantas empresas adicionais existem */}
                  {empresas.length > 5 && (
                    <p className="text-green-600 text-xs text-center mt-1">
                      +{empresas.length - 5} empresas
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Card: Avisos — dados reais do feed, igual à PaginaInicial */}
            <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-red-600 font-semibold text-sm mb-4 flex items-center gap-2">
                <Bell size={15} /> Avisos
              </h3>
              {avisos.length === 0 ? (
                <p className="text-gray-400 text-xs">Sem avisos de momento.</p>
              ) : (
                <div className="space-y-3">
                  {avisos.slice(0, 3).map(aviso => (                           // Máximo 3 avisos
                    <div key={aviso.id_publicacao} className="border-l-2 border-red-300 pl-3">
                      <p className="text-gray-700 text-xs font-medium">{aviso.titulo}</p>
                      {aviso.descricao && (
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{aviso.descricao}</p>
                      )}
                      <p className="text-gray-300 text-xs mt-1">
                        {new Date(aviso.criado_em).toLocaleDateString('pt-AO')} {/* Data formatada em pt-AO */}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Modal nova publicação — estrutura igual à PaginaInicial ── */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">

            {/* Cabeçalho do modal */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg">Nova Publicação</h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-4">

              {/* Selector de tipo — igual à PaginaInicial, só aparece se houver mais de 1 tipo */}
              {tiposDisponiveis.length > 1 && (
                <div>
                  <label className="text-gray-600 text-sm block mb-2">O que quero publicar</label>
                  <div className="grid grid-cols-2 gap-2">
                    {tiposDisponiveis.map(t => (
                      <button key={t.valor} onClick={() => handleTipo(t.valor)} // Muda tipo e reseta formulário
                        className={`py-2 px-3 rounded-xl text-sm font-medium transition border ${
                          formulario.tipo_publicacao === t.valor
                            ? 'bg-green-600 text-white border-green-600'       // Tipo seleccionado
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50' // Não seleccionado
                        }`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Título — obrigatório, igual à PaginaInicial */}
              <div>
                <label className="text-gray-600 text-sm block mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input type="text" value={formulario.titulo}
                  onChange={(e) => handleCampo('titulo', e.target.value)}      // Actualiza título
                  placeholder="Título da publicação"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Descrição — opcional, igual à PaginaInicial */}
              <div>
                <label className="text-gray-600 text-sm block mb-1">Descrição (opcional)</label>
                <textarea value={formulario.descricao}
                  onChange={(e) => handleCampo('descricao', e.target.value)}   // Actualiza descrição
                  placeholder="Mais detalhes..." rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>

              {/* Campos de resíduo — igual à PaginaInicial */}
              {mostrarCamposResiduo && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-sm block mb-1">Tipo de Resíduo</label>
                    <select value={formulario.id_residuo}
                      onChange={(e) => handleCampo('id_residuo', e.target.value)} // Actualiza resíduo
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                      <option value="">Seleccionar</option>
                      {residuos.map(r => (
                        <option key={r.id_residuo} value={r.id_residuo}>{r.tipo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm block mb-1">Província</label>
                    <input type="text" value={formulario.provincia}
                      onChange={(e) => handleCampo('provincia', e.target.value)} // Actualiza província
                      placeholder="Ex: Luanda"
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                </div>
              )}

              {/* Província para outros tipos — igual à PaginaInicial */}
              {!mostrarCamposResiduo && (
                <div>
                  <label className="text-gray-600 text-sm block mb-1">Província (opcional)</label>
                  <input type="text" value={formulario.provincia}
                    onChange={(e) => handleCampo('provincia', e.target.value)} // Actualiza província
                    placeholder="Ex: Luanda"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              )}

              {/* Erro do formulário */}
              {erroForm && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{erroForm}</p>
              )}
            </div>

            {/* Botão publicar — igual à PaginaInicial */}
            <button onClick={handlePublicar} disabled={publicando}
              className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">
              {publicando ? 'A publicar...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal de interesse — igual à PaginaInicial, só para empresas ── */}
      {modalInteresse && publicacaoAlvo && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">

            {/* Cabeçalho do modal */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-green-800 font-bold text-lg">Propor Compra</h3>
              <button onClick={() => setModalInteresse(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* Resumo do resíduo — igual à PaginaInicial */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              <p className="text-green-800 font-medium text-sm">{publicacaoAlvo.titulo}</p>
              {publicacaoAlvo.tipo_residuo && (
                <p className="text-green-600 text-xs mt-0.5 flex items-center gap-1">
                  <Recycle size={11} /> {publicacaoAlvo.tipo_residuo}          {/* Tipo de resíduo */}
                  {publicacaoAlvo.provincia && (
                    <span className="ml-2 flex items-center gap-1">
                      <MapPin size={11} />{publicacaoAlvo.provincia}           {/* Localização */}
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="space-y-3">

              {/* Valor proposto — igual à PaginaInicial */}
              <div>
                <label className="text-gray-600 text-sm block mb-1">
                  Valor que propões <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">(Kz/kg)</span>
                </label>
                <div className="relative">
                  <input
                    type="number" min="1" step="1"
                    value={valorProposto}
                    onChange={(e) => setValorProposto(e.target.value)}         // Actualiza valor
                    placeholder="Ex: 750"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <span className="absolute right-4 top-3 text-gray-400 text-sm">Kz</span> {/* Sufixo moeda */}
                </div>
                {/* Referência de preço do resíduo */}
                {publicacaoAlvo.preco_min && publicacaoAlvo.preco_max && (
                  <p className="text-xs text-gray-400 mt-1">
                    Referência: {publicacaoAlvo.preco_min}–{publicacaoAlvo.preco_max} Kz/kg
                  </p>
                )}
              </div>

              {/* Nota opcional — igual à PaginaInicial */}
              <div>
                <label className="text-gray-600 text-sm block mb-1">Nota (opcional)</label>
                <textarea
                  value={mensagemInteresse}
                  onChange={(e) => setMensagemInteresse(e.target.value)}       // Actualiza nota
                  placeholder="Ex: Podemos recolher na próxima semana..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>

              {/* Erro da proposta */}
              {erroInteresse && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{erroInteresse}</p>
              )}
            </div>

            {/* Botão enviar proposta — igual à PaginaInicial */}
            <button
              onClick={handleEnviarInteresse}
              disabled={enviandoInteresse}
              className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {enviandoInteresse ? 'A enviar...' : <><HandshakeIcon size={16} /> Enviar Proposta</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cartão individual de publicação ──
// Estrutura e classes 100% iguais à PaginaInicial do utilizador
// tipoUtilizador é passado como "empresa" — controla o botão "Tenho interesse"
function CartaoPublicacao({ publicacao: p, utilizador, tipoUtilizador, onApagar, onInteresse, interesseJaEnviado }) {
  const estilo = ESTILOS[p.tipo_publicacao] || ESTILOS.aviso;                  // Estilo visual pelo tipo de publicação

  // Admin pode apagar tudo; autor apaga as suas próprias publicações
  const podeApagar = utilizador?.tipo === 'admin' || utilizador?.id === p.id_autor;

  // Só empresas vêem "Tenho interesse" em ofertas de resíduo de outros utilizadores
  const podeTeresseInteresse =
    tipoUtilizador === 'empresa' &&                                             // Só para empresa
    p.tipo_publicacao === 'oferta_residuo' &&                                   // Só em ofertas de resíduo
    p.id_autor !== utilizador?.id;                                              // Não nas suas próprias publicações

  return (
    // Borda colorida conforme o tipo — igual à PaginaInicial
    <div className={`bg-white border ${estilo.borda} rounded-2xl overflow-hidden shadow-sm`}>

      {/* Imagem se existir — igual à PaginaInicial */}
      {p.imagem && (
        <img src={p.imagem} alt={p.titulo} className="w-full h-48 object-cover"
          onError={(e) => { e.target.style.display = 'none'; }} />             // Esconde se falhar ao carregar
      )}

      <div className="p-4">

        {/* Badge do tipo e data — iguais à PaginaInicial */}
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${estilo.badge}`}>
            {estilo.label}                                                      {/* Ex: ♻️ Oferta de Resíduo */}
          </span>
          <span className="text-gray-400 text-xs">
            {new Date(p.criado_em).toLocaleDateString('pt-AO')}                {/* Data formatada */}
          </span>
        </div>

        {/* Título e descrição — iguais à PaginaInicial */}
        <h3 className="text-gray-800 font-semibold text-sm mb-1">{p.titulo}</h3>
        {p.descricao && (
          <p className="text-gray-500 text-xs mb-2 line-clamp-2">{p.descricao}</p>
        )}

        {/* Detalhes do resíduo — igual à PaginaInicial */}
        {(p.tipo_publicacao === 'oferta_residuo' || p.tipo_publicacao === 'pedido_residuo') && (
          <div className="flex flex-wrap gap-3 mb-2">
            {p.tipo_residuo && (
              <span className="flex items-center gap-1 text-gray-500 text-xs">
                <Recycle size={11} /> {p.tipo_residuo}                         {/* Tipo de resíduo */}
              </span>
            )}
            {p.provincia && (
              <span className="flex items-center gap-1 text-gray-400 text-xs">
                <MapPin size={11} /> {p.provincia}                             {/* Localização */}
              </span>
            )}
          </div>
        )}

        {/* Rodapé: autor e acções — igual à PaginaInicial */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">

          {/* Autor */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
              {p.nome_autor?.charAt(0).toUpperCase()}                           {/* Inicial do nome */}
            </div>
            <span className="text-gray-500 text-xs">{p.nome_autor}</span>     {/* Nome do autor */}
            {/* Badge empresa — aparece quando o autor é uma empresa */}
            {p.tipo_autor === 'empresa' && (
              <span className="text-purple-600 text-xs flex items-center gap-1">
                <Building2 size={10} /> Empresa
              </span>
            )}
          </div>

          {/* Acções — iguais à PaginaInicial */}
          <div className="flex items-center gap-2">
            {/* Botão remover — só para publicações próprias ou admin */}
            {podeApagar && (
              <button onClick={() => onApagar(p.id_publicacao)}
                className="text-red-400 hover:text-red-500 text-xs flex items-center gap-1 transition">
                <Trash2 size={12} /> Remover
              </button>
            )}
            {/* Botão "Tenho interesse" — só empresa, só em ofertas de outros */}
            {podeTeresseInteresse && (
              interesseJaEnviado
                ? <span className="text-green-600 text-xs font-medium">✓ Proposta enviada</span> // Já enviada
                : (
                  <button onClick={() => onInteresse(p)}                       // Abre modal de proposta
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
                    <HandshakeIcon size={12} /> Tenho interesse
                  </button>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}