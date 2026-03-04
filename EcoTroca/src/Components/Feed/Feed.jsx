
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, Building2, MapPin, Weight,
  Banknote, Plus, Search, Trash2
} from 'lucide-react';
import { getFeed, criarPublicacao, apagarPublicacao, getResiduos, getUtilizadorLocal } from '../../api.js';

// ── Aqui defino os tipos de publicação que cada perfil pode criar ──
// Uso um objecto onde a chave é o tipo de utilizador
// e o valor é um array com os tipos de publicação permitidos
const TIPOS_POR_PERFIL = {
  admin:   [
    { valor: 'evento',         label: '📅 Evento'            },
    { valor: 'educacao',       label: '📚 Educação'          },
    { valor: 'noticia',        label: '📰 Notícia'           },
    { valor: 'aviso',          label: '📣 Aviso'             },
  ],
  empresa: [
    { valor: 'pedido_residuo', label: '🏭 Pedido de Resíduo' },
    { valor: 'evento',         label: '📅 Evento'            },
    { valor: 'educacao',       label: '📚 Educação'          },
    { valor: 'noticia',        label: '📰 Notícia'           },
  ],
  comum:   [
    { valor: 'oferta_residuo', label: '♻️ Oferta de Resíduo' },
  ],
  coletor: [], // o coletador só visualiza — não publico nada para ele
};

// ── Aqui defino os filtros que aparecem no topo do feed ──
// O utilizador pode clicar num filtro para ver só esse tipo de publicação
const FILTROS = [
  { valor: 'todos',          label: 'Tudo',     icon: '🌍' },
  { valor: 'oferta_residuo', label: 'Ofertas',  icon: '♻️' },
  { valor: 'pedido_residuo', label: 'Pedidos',  icon: '🏭' },
  { valor: 'evento',         label: 'Eventos',  icon: '📅' },
  { valor: 'educacao',       label: 'Educação', icon: '📚' },
  { valor: 'noticia',        label: 'Notícias', icon: '📰' },
  { valor: 'aviso',          label: 'Avisos',   icon: '📣' },
];

// ── Aqui defino os estilos visuais de cada tipo de publicação ──
// Cada tipo tem uma cor diferente para ser fácil de identificar no feed
const ESTILOS = {
  oferta_residuo: { badge: 'bg-green-400/20 text-green-300',   borda: 'border-green-400/20',   label: '♻️ Oferta de Resíduo' },
  pedido_residuo: { badge: 'bg-purple-400/20 text-purple-300', borda: 'border-purple-400/20',  label: '🏭 Pedido de Empresa'  },
  evento:         { badge: 'bg-blue-400/20 text-blue-300',     borda: 'border-blue-400/20',    label: '📅 Evento'             },
  educacao:       { badge: 'bg-yellow-400/20 text-yellow-300', borda: 'border-yellow-400/20',  label: '📚 Educação'           },
  noticia:        { badge: 'bg-cyan-400/20 text-cyan-300',     borda: 'border-cyan-400/20',    label: '📰 Notícia'            },
  aviso:          { badge: 'bg-red-400/20 text-red-300',       borda: 'border-red-400/20',     label: '📣 Aviso'              },
};

// ── Aqui defino o formulário vazio que uso quando o modal abre ──
// Uso este objecto para limpar o formulário depois de publicar
const FORM_VAZIO = {
  tipo_publicacao: 'oferta_residuo',
  titulo: '', descricao: '', id_residuo: '',
  quantidade_kg: '', valor_proposto: '', provincia: '', imagem: '',
};

export default function Feed() {

  // Uso o useNavigate para navegar para outras páginas sem recarregar
  const navigate = useNavigate();

  // Aqui vou buscar os dados do utilizador que está autenticado
  // Uso isto para saber o tipo e o nome do utilizador
  const utilizador = getUtilizadorLocal();
  const tipo       = utilizador?.tipo || 'comum';

  // Aqui guardo a lista de publicações vindas do servidor
  const [feed,        setFeed]        = useState([]);

  // Uso este estado para mostrar "A carregar..." enquanto espero o servidor
  const [carregando,  setCarregando]  = useState(true);

  // Aqui guardo a mensagem de erro se o servidor falhar
  const [erro,        setErro]        = useState('');

  // Aqui guardo o filtro activo — começo com 'todos' para mostrar tudo
  const [filtro,      setFiltro]      = useState('todos');

  // Aqui guardo o texto que o utilizador escreve na barra de pesquisa
  const [pesquisa,    setPesquisa]    = useState('');

  // Uso este estado para controlar se o modal de publicação está aberto
  const [modalAberto, setModalAberto] = useState(false);

  // Aqui guardo a lista de tipos de resíduos para o formulário
  const [residuos,    setResiduos]    = useState([]);

  // Aqui guardo os dados do formulário de nova publicação
  const [formulario,  setFormulario]  = useState(FORM_VAZIO);

  // Uso este estado para bloquear o botão enquanto estou a publicar
  const [publicando,  setPublicando]  = useState(false);

  // Aqui guardo o erro do formulário se o utilizador não preencher bem
  const [erroForm,    setErroForm]    = useState('');

  // Aqui calculo os tipos de publicação disponíveis para este utilizador
  // Se o tipo não existir no objecto, uso um array vazio (não publica)
  const tiposDisponiveis = TIPOS_POR_PERFIL[tipo] || [];

  // Aqui verifico se este utilizador pode publicar
  // O coletador tem um array vazio, por isso podePublicar fica false
  const podePublicar = tiposDisponiveis.length > 0;

  // Aqui verifico se devo mostrar os campos de resíduo no formulário
  // Só mostro para ofertas e pedidos de resíduo — os outros tipos não precisam
  const mostrarCamposResiduo = ['oferta_residuo', 'pedido_residuo'].includes(formulario.tipo_publicacao);

  // Quando a página abre, vou buscar o feed e a lista de resíduos ao servidor
  useEffect(() => {
    carregarFeed();
    carregarResiduos();
  }, []); // o array vazio [] significa que só executa uma vez, quando a página abre

  // Aqui vou buscar todas as publicações do feed ao servidor
  const carregarFeed = async () => {
    try {
      setCarregando(true);
      // GET /api/feed — o servidor devolve publicações + eventos misturados
      setFeed(await getFeed());
    } catch (err) {
      setErro(err.message);
    } finally {
      // O finally executa sempre, mesmo que haja erro
      // Assim o "A carregar..." desaparece sempre
      setCarregando(false);
    }
  };

  // Aqui vou buscar os tipos de resíduos para o select do formulário
  const carregarResiduos = async () => {
    try {
      setResiduos(await getResiduos());
    } catch (err) {
      console.error('Erro ao carregar resíduos:', err);
    }
  };

  // Aqui filtro as publicações localmente sem ir ao servidor
  // Primeiro filtro pelo tipo, depois pelo texto da pesquisa
  const feedFiltrado = feed
    .filter(p => filtro === 'todos' || p.tipo_publicacao === filtro)
    .filter(p => {
      if (!pesquisa) return true;
      const t = pesquisa.toLowerCase();
      // Procuro o termo em vários campos da publicação
      return (
        p.titulo?.toLowerCase().includes(t)     ||
        p.descricao?.toLowerCase().includes(t)  ||
        p.nome_autor?.toLowerCase().includes(t) ||
        p.provincia?.toLowerCase().includes(t)
      );
    });

  // Aqui actualizo um campo do formulário quando o utilizador escreve
  // Uso o spread (...prev) para manter os outros campos inalterados
  const handleCampo = (campo, valor) =>
    setFormulario(prev => ({ ...prev, [campo]: valor }));

  // Quando o utilizador muda o tipo de publicação, limpo o formulário
  // mas mantenho o tipo seleccionado para não perder a escolha
  const handleTipo = (novoTipo) => {
    setFormulario({ ...FORM_VAZIO, tipo_publicacao: novoTipo });
  };

  // Aqui envio a nova publicação para o servidor
  const handlePublicar = async () => {
    // Valido o título antes de enviar — é o único campo obrigatório
    if (!formulario.titulo.trim()) {
      setErroForm('O título é obrigatório.');
      return;
    }
    try {
      setPublicando(true);
      setErroForm('');
      // POST /api/feed — o servidor valida o tipo conforme o perfil
      await criarPublicacao(formulario);
      // Fecho o modal e limpo o formulário após publicar com sucesso
      setModalAberto(false);
      setFormulario(FORM_VAZIO);
      // Recarrego o feed para mostrar a nova publicação
      await carregarFeed();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setPublicando(false);
    }
  };

  // Aqui apago uma publicação — só o admin pode apagar qualquer publicação
  const handleApagar = async (id) => {
    // Peço confirmação antes de apagar para evitar erros acidentais
    if (!window.confirm('Remover esta publicação do feed?')) return;
    try {
      // DELETE /api/feed/:id — o servidor verifica se tenho permissão
      await apagarPublicacao(id);
      // Recarrego o feed para remover o cartão da lista
      await carregarFeed();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 to-green-900 pb-12">

      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Aqui mostro o cabeçalho do feed com o nome do utilizador */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white text-xl font-bold">Feed EcoTroca</h2>
            <p className="text-white/50 text-xs mt-0.5">
              {/* Mostro só o primeiro nome para ficar mais informal */}
              Olá, {utilizador?.nome?.split(' ')[0] || 'bem-vindo'} 👋
            </p>
          </div>

          {/* Só mostro o botão "Publicar" se o utilizador puder publicar */}
          {podePublicar && (
            <button
              onClick={() => {
                // Quando abro o modal, defino o primeiro tipo disponível como padrão
                setFormulario({ ...FORM_VAZIO, tipo_publicacao: tiposDisponiveis[0].valor });
                setModalAberto(true);
              }}
              className="flex items-center gap-2 bg-green-400 hover:bg-green-300 text-green-950 font-semibold px-4 py-2 rounded-xl text-sm transition"
            >
              <Plus size={16} /> Publicar
            </button>
          )}
        </div>

        {/* Barra de pesquisa — filtro o feed localmente enquanto o utilizador escreve */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-3.5 text-white/40" />
          <input
            type="text"
            placeholder="Pesquisar no feed..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-white/40"
          />
        </div>

        {/* Filtros por tipo — uso overflow-x-auto para scroll horizontal no mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {FILTROS.map(f => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition shrink-0 ${
                filtro === f.valor
                  ? 'bg-green-400 text-green-950'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {/* Aqui mostro a lista de publicações filtradas */}
        <div className="space-y-4">

          {/* Mostro a mensagem de carregamento enquanto espero o servidor */}
          {carregando && (
            <p className="text-white/50 text-center py-12">A carregar feed...</p>
          )}

          {/* Mostro o erro se o servidor falhar */}
          {erro && (
            <p className="text-red-400 text-center py-6">{erro}</p>
          )}

          {/* Mostro uma mensagem quando não há publicações */}
          {!carregando && !erro && feedFiltrado.length === 0 && (
            <div className="text-center py-16">
              <p className="text-white/40">Nenhuma publicação encontrada.</p>
              {podePublicar && (
                <button
                  onClick={() => setModalAberto(true)}
                  className="mt-3 text-green-400 hover:text-green-300 text-sm underline"
                >
                  Sê o primeiro a publicar
                </button>
              )}
            </div>
          )}

          {/* Aqui percorro a lista e crio um cartão para cada publicação */}
          {feedFiltrado.map(p => (
            <CartaoPublicacao
              key={p.id_publicacao}
              publicacao={p}
              navigate={navigate}
              utilizador={utilizador}
              onApagar={handleApagar}
            />
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          Modal de nova publicação
          Aparece quando clico em "Publicar"
          Uso position fixed para cobrir toda a página
      ══════════════════════════════════════════════ */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-gray-900 rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Cabeçalho do modal */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">Nova Publicação</h3>
              {/* Fecho o modal ao clicar no X */}
              <button
                onClick={() => setModalAberto(false)}
                className="text-white/50 hover:text-white text-xl transition"
              >✕</button>
            </div>

            <div className="space-y-4">

              {/* Só mostro os botões de tipo se o utilizador tiver mais de uma opção */}
              {tiposDisponiveis.length > 1 && (
                <div>
                  <label className="text-white/70 text-sm block mb-2">O que quero publicar</label>
                  <div className="grid grid-cols-2 gap-2">
                    {tiposDisponiveis.map(t => (
                      <button
                        key={t.valor}
                        onClick={() => handleTipo(t.valor)}
                        className={`py-2 px-3 rounded-xl text-sm font-medium transition ${
                          formulario.tipo_publicacao === t.valor
                            ? 'bg-green-400 text-green-950'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Campo de título — obrigatório */}
              <div>
                <label className="text-white/70 text-sm block mb-1">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formulario.titulo}
                  onChange={(e) => handleCampo('titulo', e.target.value)}
                  // O placeholder muda conforme o tipo de publicação
                  placeholder={
                    formulario.tipo_publicacao === 'oferta_residuo' ? 'Ex: Tenho 3kg de papel disponível'       :
                    formulario.tipo_publicacao === 'pedido_residuo' ? 'Ex: Precisamos de 10kg de plástico'      :
                    formulario.tipo_publicacao === 'evento'         ? 'Ex: Campanha de reciclagem em Viana'     :
                    formulario.tipo_publicacao === 'noticia'        ? 'Ex: Nova parceria com empresa X'         :
                    formulario.tipo_publicacao === 'aviso'          ? 'Ex: Manutenção programada amanhã'        :
                    'Título da publicação'
                  }
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Campo de descrição — opcional */}
              <div>
                <label className="text-white/70 text-sm block mb-1">Descrição (opcional)</label>
                <textarea
                  value={formulario.descricao}
                  onChange={(e) => handleCampo('descricao', e.target.value)}
                  placeholder="Mais detalhes sobre a publicação..."
                  rows={3}
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 resize-none"
                />
              </div>

              {/* Campos específicos de resíduo — só aparecem para ofertas e pedidos */}
              {mostrarCamposResiduo && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/70 text-sm block mb-1">Tipo de Resíduo</label>
                    <select
                      value={formulario.id_residuo}
                      onChange={(e) => handleCampo('id_residuo', e.target.value)}
                      className="w-full bg-gray-800 text-white border border-white/20 rounded-xl px-3 py-3 text-sm"
                    >
                      <option value="" className="bg-gray-800">Seleccionar</option>
                      {/* Aqui percorro os resíduos vindos do servidor */}
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
                      type="number" min="0" step="0.1"
                      value={formulario.quantidade_kg}
                      onChange={(e) => handleCampo('quantidade_kg', e.target.value)}
                      placeholder="Ex: 2.5"
                      className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-3 py-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm block mb-1">Valor Proposto (Kz)</label>
                    <input
                      type="number" min="0"
                      value={formulario.valor_proposto}
                      onChange={(e) => handleCampo('valor_proposto', e.target.value)}
                      placeholder="Ex: 500"
                      className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-3 py-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm block mb-1">Província</label>
                    <input
                      type="text"
                      value={formulario.provincia}
                      onChange={(e) => handleCampo('provincia', e.target.value)}
                      placeholder="Ex: Luanda"
                      className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-3 py-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Província para publicações que não são de resíduo */}
              {!mostrarCamposResiduo && (
                <div>
                  <label className="text-white/70 text-sm block mb-1">Província (opcional)</label>
                  <input
                    type="text"
                    value={formulario.provincia}
                    onChange={(e) => handleCampo('provincia', e.target.value)}
                    placeholder="Ex: Luanda"
                    className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
              )}

              {/* Campo de imagem — aceita URL */}
              <div>
                <label className="text-white/70 text-sm block mb-1">Imagem — URL (opcional)</label>
                <input
                  type="text"
                  value={formulario.imagem}
                  onChange={(e) => handleCampo('imagem', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none"
                />
                {/* Mostro a pré-visualização da imagem se o URL estiver preenchido */}
                {formulario.imagem && (
                  <img
                    src={formulario.imagem} alt="Pré-visualização"
                    className="mt-2 w-full h-32 object-cover rounded-xl"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
              </div>

              {/* Mostro o erro do formulário se existir */}
              {erroForm && (
                <p className="text-red-400 text-sm bg-red-500/10 rounded-xl p-3">{erroForm}</p>
              )}
            </div>

            {/* Botão de publicar — fica desactivado enquanto estou a publicar */}
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

// ============================================================
//  CartaoPublicacao — Cartão individual de cada publicação
//  Aqui recebo a publicação como prop e mostro os seus dados
//  O visual muda conforme o tipo da publicação
// ============================================================
function CartaoPublicacao({ publicacao: p, navigate, utilizador, onApagar }) {

  // Aqui vou buscar o estilo correcto para este tipo de publicação
  // Se o tipo não existir no mapa, uso o estilo de aviso como padrão
  const estilo = ESTILOS[p.tipo_publicacao] || ESTILOS.aviso;

  // Só o admin pode apagar qualquer publicação
  const podeApagar = utilizador?.tipo === 'admin';

  return (
    <div className={`bg-white/5 border ${estilo.borda} rounded-2xl overflow-hidden`}>

      {/* Mostro a imagem se existir — escondo se o URL for inválido */}
      {p.imagem && (
        <img
          src={p.imagem} alt={p.titulo}
          className="w-full h-48 object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      <div className="p-4">

        {/* Badge do tipo e data de publicação */}
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${estilo.badge}`}>
            {estilo.label}
          </span>
          <span className="text-white/40 text-xs">
            {new Date(p.criado_em).toLocaleDateString('pt-AO')}
          </span>
        </div>

        {/* Título da publicação */}
        <h3 className="text-white font-semibold text-sm mb-1">{p.titulo}</h3>

        {/* Descrição — mostro só 2 linhas para não ocupar muito espaço */}
        {p.descricao && (
          <p className="text-white/60 text-xs mb-2 line-clamp-2">{p.descricao}</p>
        )}

        {/* Detalhes de resíduo — só aparecem para ofertas e pedidos */}
        {(p.tipo_publicacao === 'oferta_residuo' || p.tipo_publicacao === 'pedido_residuo') && (
          <div className="flex flex-wrap gap-3 mb-2">
            {p.tipo_residuo && (
              <span className="flex items-center gap-1 text-white/60 text-xs">
                <Recycle size={11} /> {p.tipo_residuo}
              </span>
            )}
            {p.quantidade_kg && (
              <span className="flex items-center gap-1 text-white/60 text-xs">
                <Weight size={11} /> {p.quantidade_kg} kg
              </span>
            )}
            {p.valor_proposto && (
              <span className="flex items-center gap-1 text-green-300 text-xs font-medium">
                <Banknote size={11} /> {parseFloat(p.valor_proposto).toFixed(0)} Kz
              </span>
            )}
            {p.provincia && (
              <span className="flex items-center gap-1 text-white/50 text-xs">
                <MapPin size={11} /> {p.provincia}
              </span>
            )}
          </div>
        )}

        {/* Rodapé — nome do autor, tipo e botões de acção */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">

          {/* Informação do autor */}
          <div className="flex items-center gap-2">
            {/* Avatar com a inicial do nome */}
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              {p.nome_autor?.charAt(0).toUpperCase()}
            </div>
            <span className="text-white/50 text-xs">{p.nome_autor}</span>
            {/* Mostro o tipo do autor para dar contexto */}
            {p.tipo_autor === 'empresa' && (
              <span className="text-purple-300 text-xs flex items-center gap-1">
                <Building2 size={10} /> Empresa
              </span>
            )}
            {p.tipo_autor === 'admin' && (
              <span className="text-yellow-300 text-xs">🛡️ Admin</span>
            )}
          </div>

          {/* Botões de acção */}
          <div className="flex items-center gap-3">
            {/* Botão remover — só aparece para o admin */}
            {podeApagar && (
              <button
                onClick={() => onApagar(p.id_publicacao)}
                className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition"
              >
                <Trash2 size={12} /> Remover
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