
//  O que esta página faz:
//  Mostro um feed com todas as publicações da plataforma —
//  ofertas de resíduos de utilizadores, pedidos de empresas,
//  eventos de reciclagem e conteúdos educativos.
//  Todos os tipos de utilizador vêem a mesma página inicial.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, Building2, Calendar, BookOpen,
  Plus, MapPin, Weight, Banknote, Filter, Search
} from 'lucide-react';
import { getFeed, criarPublicacao, getResiduos, getUtilizadorLocal } from '../../api.js';

// ── Tipos de filtro disponíveis no feed ──
const FILTROS = [
  { valor: 'todos',          label: 'Tudo',       icon: '🌍' },
  { valor: 'oferta_residuo', label: 'Ofertas',    icon: '♻️' },
  { valor: 'pedido_residuo', label: 'Pedidos',    icon: '🏭' },
  { valor: 'evento',         label: 'Eventos',    icon: '📅' },
  { valor: 'educacao',       label: 'Educação',   icon: '📚' },
];

export default function Feed() {

  const navigate = useNavigate();

  // utilizador → dados do utilizador autenticado (nome e tipo)
  const utilizador = getUtilizadorLocal();

  // feed → lista de publicações vindas da API
  const [feed, setFeed] = useState([]);

  // carregando → true enquanto os dados não chegaram
  const [carregando, setCarregando] = useState(true);

  // erro → mensagem de erro se a API falhar
  const [erro, setErro] = useState('');

  // filtro → tipo de publicação actualmente seleccionado
  const [filtro, setFiltro] = useState('todos');

  // pesquisa → texto digitado na barra de pesquisa
  const [pesquisa, setPesquisa] = useState('');

  // modalAberto → controla se o formulário de nova publicação está visível
  const [modalAberto, setModalAberto] = useState(false);

  // residuos → lista de tipos de resíduos para o formulário
  const [residuos, setResiduos] = useState([]);

  // formulario → dados do formulário de nova publicação
  const [formulario, setFormulario] = useState({
    tipo_publicacao: 'oferta_residuo',
    titulo: '',
    descricao: '',
    id_residuo: '',
    quantidade_kg: '',
    valor_proposto: '',
    provincia: '',
    imagem: '',
  });

  // publicando → evita cliques duplos no botão publicar
  const [publicando, setPublicando] = useState(false);

  // erroFormulario → mensagem de erro dentro do formulário
  const [erroFormulario, setErroFormulario] = useState('');

  // ── Carrego o feed e os resíduos ao abrir a página ──
  useEffect(() => {
    carregarFeed();
    carregarResiduos();
  }, []);

  const carregarFeed = async () => {
    try {
      setCarregando(true);
      // GET /api/feed — devolve todas as publicações ordenadas por data
      const dados = await getFeed();
      setFeed(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const carregarResiduos = async () => {
    try {
      // GET /api/residuos — devolve os tipos disponíveis para o formulário
      const dados = await getResiduos();
      setResiduos(dados);
    } catch (err) {
      console.error('Erro ao carregar resíduos:', err);
    }
  };

  // ── Filtragem local do feed ──
  const feedFiltrado = feed
    .filter(p => filtro === 'todos' || p.tipo_publicacao === filtro)
    .filter(p => {
      if (!pesquisa) return true;
      const termo = pesquisa.toLowerCase();
      return (
        p.titulo?.toLowerCase().includes(termo) ||
        p.descricao?.toLowerCase().includes(termo) ||
        p.nome_autor?.toLowerCase().includes(termo) ||
        p.provincia?.toLowerCase().includes(termo)
      );
    });

  // ── Actualiza um campo do formulário ──
  const handleCampo = (campo, valor) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }));
  };

  // ── Publica uma nova entrada no feed ──
  const handlePublicar = async () => {
    if (!formulario.titulo.trim()) {
      setErroFormulario('O título é obrigatório.');
      return;
    }
    try {
      setPublicando(true);
      setErroFormulario('');
      // POST /api/feed — cria uma nova publicação
      await criarPublicacao(formulario);
      // Fecho o modal e recarrego o feed para mostrar a nova publicação
      setModalAberto(false);
      setFormulario({
        tipo_publicacao: 'oferta_residuo',
        titulo: '', descricao: '', id_residuo: '',
        quantidade_kg: '', valor_proposto: '', provincia: '', imagem: '',
      });
      await carregarFeed();
    } catch (err) {
      setErroFormulario(err.message);
    } finally {
      setPublicando(false);
    }
  };

  // ── Define quais tipos de publicação cada utilizador pode criar ──
  // Utilizador comum → pode publicar ofertas de resíduos
  // Empresa → pode publicar pedidos de resíduos
  // Coletador → não publica (só visualiza)
  // Admin → vê o feed mas não publica
  // Admin e utilizadores/empresas podem publicar — só o coletador não publica
  const podePublicar = utilizador?.tipo !== 'coletor';
  // Admin pode publicar qualquer tipo
  // Empresa → só pedidos | Utilizador → só ofertas | Admin → todos
  const tiposDisponiveis = utilizador?.tipo === 'admin'
    ? [
        { valor: 'oferta_residuo', label: 'Oferta de Resíduo'  },
        { valor: 'pedido_residuo', label: 'Pedido de Resíduo'  },
        { valor: 'educacao',       label: 'Conteúdo Educativo' },
      ]
    : utilizador?.tipo === 'empresa'
    ? [{ valor: 'pedido_residuo', label: 'Pedido de Resíduo' }]
    : [{ valor: 'oferta_residuo', label: 'Oferta de Resíduo' }];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 to-green-900 pt-6 pb-12">

      {/* ── Cabeçalho do feed ── */}
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-2xl font-bold">EcoTroca</h1>
            <p className="text-white/60 text-sm">
              Olá, {utilizador?.nome?.split(' ')[0] || 'bem-vindo'} 👋
            </p>
          </div>
          {/* Botão para criar nova publicação — só para utilizadores e empresas */}
          {podePublicar && (
            <button
              onClick={() => setModalAberto(true)}
              className="flex items-center gap-2 bg-green-400 hover:bg-green-300 text-green-950 font-semibold px-4 py-2 rounded-xl text-sm transition"
            >
              <Plus size={16} /> Publicar
            </button>
          )}
        </div>

        {/* Barra de pesquisa */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-3.5 text-white/40" />
          <input
            type="text"
            placeholder="Pesquisar no feed..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/40"
          />
        </div>

        {/* Filtros por tipo de publicação */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTROS.map(f => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition shrink-0 ${
                filtro === f.valor
                  ? 'bg-green-400 text-green-950'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista de publicações ── */}
      <div className="max-w-2xl mx-auto px-4 space-y-4">

        {carregando && (
          <p className="text-white/50 text-center py-12">A carregar feed...</p>
        )}

        {erro && (
          <p className="text-red-400 text-center py-6">{erro}</p>
        )}

        {!carregando && !erro && feedFiltrado.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/40 text-lg">Nenhuma publicação encontrada.</p>
            {podePublicar && (
              <button
                onClick={() => setModalAberto(true)}
                className="mt-4 text-green-400 hover:text-green-300 text-sm underline"
              >
                Sê o primeiro a publicar
              </button>
            )}
          </div>
        )}

        {/* Um cartão por publicação */}
        {feedFiltrado.map((p) => (
          <CartaoPublicacao key={p.id_publicacao} publicacao={p} navigate={navigate} utilizador={utilizador} onApagar={carregarFeed} />
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          MODAL — Formulário de nova publicação
      ══════════════════════════════════════════════ */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-gray-900 rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Cabeçalho do modal */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">Nova Publicação</h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-white/50 hover:text-white text-xl transition"
              >✕</button>
            </div>

            <div className="space-y-4">

              {/* Tipo de publicação — só aparece se tiver mais de uma opção */}
              {tiposDisponiveis.length > 1 && (
                <div>
                  <label className="text-white/70 text-sm block mb-1">Tipo</label>
                  <select
                    value={formulario.tipo_publicacao}
                    onChange={(e) => handleCampo('tipo_publicacao', e.target.value)}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-sm"
                  >
                    {tiposDisponiveis.map(t => (
                      <option key={t.valor} value={t.valor} className="bg-gray-800">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Título */}
              <div>
                <label className="text-white/70 text-sm block mb-1">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formulario.titulo}
                  onChange={(e) => handleCampo('titulo', e.target.value)}
                  placeholder={
                    utilizador?.tipo === 'empresa'
                      ? 'Ex: Preciso de 5kg de plástico PET'
                      : 'Ex: Tenho 3kg de papel para vender'
                  }
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="text-white/70 text-sm block mb-1">Descrição (opcional)</label>
                <textarea
                  value={formulario.descricao}
                  onChange={(e) => handleCampo('descricao', e.target.value)}
                  placeholder="Mais detalhes sobre o resíduo..."
                  rows={3}
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 resize-none"
                />
              </div>

              {/* Tipo de resíduo e quantidade — lado a lado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/70 text-sm block mb-1">Tipo de Resíduo</label>
                  <select
                    value={formulario.id_residuo}
                    onChange={(e) => handleCampo('id_residuo', e.target.value)}
                    className="w-full bg-gray-800 text-white border border-white/20 rounded-xl px-3 py-3 text-sm"
                  >
                    <option value="" className="bg-gray-800">Seleccionar</option>
                    {residuos.map(r => (
                      <option key={r.id_residuo} value={r.id_residuo} className="bg-gray-800">
                        {r.tipo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Quantidade (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formulario.quantidade_kg}
                    onChange={(e) => handleCampo('quantidade_kg', e.target.value)}
                    placeholder="Ex: 2.5"
                    className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {/* Valor proposto e província — lado a lado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/70 text-sm block mb-1">Valor Proposto (Kz)</label>
                  <input
                    type="number"
                    min="0"
                    value={formulario.valor_proposto}
                    onChange={(e) => handleCampo('valor_proposto', e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Província</label>
                  <input
                    type="text"
                    value={formulario.provincia}
                    onChange={(e) => handleCampo('provincia', e.target.value)}
                    placeholder="Ex: Luanda"
                    className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {/* URL de imagem opcional */}
              <div>
                <label className="text-white/70 text-sm block mb-1">Imagem (URL opcional)</label>
                <input
                  type="text"
                  value={formulario.imagem}
                  onChange={(e) => handleCampo('imagem', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Mensagem de erro */}
              {erroFormulario && (
                <p className="text-red-400 text-sm bg-red-500/10 rounded-xl p-3">
                  {erroFormulario}
                </p>
              )}
            </div>

            {/* Botão publicar */}
            <button
              onClick={handlePublicar}
              disabled={publicando}
              className="w-full mt-5 bg-green-400 hover:bg-green-300 disabled:opacity-50 text-green-950 font-bold py-3 rounded-xl transition"
            >
              {publicando ? 'A publicar...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CartaoPublicacao ─────────────────────────────────────────
// Cartão individual para cada publicação no feed
// O visual muda conforme o tipo da publicação
function CartaoPublicacao({ publicacao: p, navigate, utilizador, onApagar }) {

  // Mapa de estilos e ícones por tipo de publicação
  const estilos = {
    oferta_residuo: {
      badge: 'bg-green-400/20 text-green-300',
      borda: 'border-green-400/20',
      label: '♻️ Oferta de Resíduo',
    },
    pedido_residuo: {
      badge: 'bg-purple-400/20 text-purple-300',
      borda: 'border-purple-400/20',
      label: '🏭 Pedido de Empresa',
    },
    evento: {
      badge: 'bg-blue-400/20 text-blue-300',
      borda: 'border-blue-400/20',
      label: '📅 Evento',
    },
    educacao: {
      badge: 'bg-yellow-400/20 text-yellow-300',
      borda: 'border-yellow-400/20',
      label: '📚 Educação',
    },
  };

  const estilo = estilos[p.tipo_publicacao] || estilos.oferta_residuo;

  return (
    <div className={`bg-white/5 border ${estilo.borda} rounded-2xl overflow-hidden`}>

      {/* Imagem da publicação — se existir */}
      {p.imagem && (
        <img
          src={p.imagem}
          alt={p.titulo}
          className="w-full h-48 object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      <div className="p-4">

        {/* Cabeçalho — badge do tipo e data */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${estilo.badge}`}>
            {estilo.label}
          </span>
          <span className="text-white/40 text-xs">
            {new Date(p.criado_em).toLocaleDateString('pt-AO')}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-white font-semibold text-base mb-1">{p.titulo}</h3>

        {/* Descrição — se existir */}
        {p.descricao && (
          <p className="text-white/60 text-sm mb-3 line-clamp-2">{p.descricao}</p>
        )}

        {/* Detalhes — resíduo, peso e valor — só para ofertas e pedidos */}
        {(p.tipo_publicacao === 'oferta_residuo' || p.tipo_publicacao === 'pedido_residuo') && (
          <div className="flex flex-wrap gap-3 mb-3">
            {p.tipo_residuo && (
              <span className="flex items-center gap-1 text-white/70 text-xs">
                <Recycle size={12} /> {p.tipo_residuo}
              </span>
            )}
            {p.quantidade_kg && (
              <span className="flex items-center gap-1 text-white/70 text-xs">
                <Weight size={12} /> {p.quantidade_kg} kg
              </span>
            )}
            {p.valor_proposto && (
              <span className="flex items-center gap-1 text-green-300 text-xs font-medium">
                <Banknote size={12} /> {parseFloat(p.valor_proposto).toFixed(0)} Kz
              </span>
            )}
            {p.provincia && (
              <span className="flex items-center gap-1 text-white/50 text-xs">
                <MapPin size={12} /> {p.provincia}
              </span>
            )}
          </div>
        )}

        {/* Rodapé — nome do autor e botão ver perfil */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            {/* Avatar com inicial do nome */}
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              {p.nome_autor?.charAt(0).toUpperCase()}
            </div>
            <span className="text-white/60 text-xs">{p.nome_autor}</span>
            {/* Badge do tipo de autor */}
            {p.tipo_autor === 'empresa' && (
              <span className="flex items-center gap-1 text-purple-300 text-xs">
                <Building2 size={10} /> Empresa
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Botão apagar — visível para o admin e para o próprio autor */}
            {(utilizador?.tipo === 'admin') && (
              <button
                onClick={async () => {
                  if (!window.confirm('Remover esta publicação do feed?')) return;
                  try {
                    const { apagarPublicacao } = await import('../../api.js');
                    await apagarPublicacao(p.id_publicacao);
                    onApagar(); // recarrega o feed após apagar
                  } catch (err) {
                    alert(err.message);
                  }
                }}
                className="text-red-400 hover:text-red-300 text-xs transition"
              >
                🗑 Remover
              </button>
            )}
            {/* Botão para ver o perfil público do autor */}
            <button
              onClick={() => navigate(`/Perfil/${p.tipo_autor}/${p.id_autor}`)}
              className="text-green-400 hover:text-green-300 text-xs transition"
            >
              Ver perfil →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}