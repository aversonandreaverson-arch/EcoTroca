
import { useState, useEffect } from 'react';
import {
  Recycle, Building2, MapPin,
  Plus, Search, Trash2, X, HandshakeIcon, Bell
} from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa';
import {
  getFeed, criarPublicacao, apagarPublicacao,
  getResiduos, getUtilizadorLocal, criarNotificacao, getEmpresas
} from '../../api.js';



const TIPOS_EMPRESA = [
  { valor: 'pedido_residuo', label: '🏭 Pedido de Resíduo' },
  { valor: 'evento',         label: '📅 Evento'            },
  { valor: 'educacao',       label: '📚 Educação'          },
  { valor: 'noticia',        label: '📰 Notícia'           },
];


const FILTROS = [
  { valor: 'todos',          label: 'Tudo',     icon: '🌍' },
  { valor: 'oferta_residuo', label: 'Ofertas',  icon: '♻️' },
  { valor: 'pedido_residuo', label: 'Pedidos',  icon: '🏭' },
  { valor: 'evento',         label: 'Eventos',  icon: '📅' },
  { valor: 'educacao',       label: 'Educação', icon: '📚' },
  { valor: 'noticia',        label: 'Notícias', icon: '📰' },
  { valor: 'aviso',          label: 'Avisos',   icon: '📣' },
];


const ESTILOS = {
  oferta_residuo: { badge: 'bg-green-100 text-green-700',   borda: 'border-green-100',  label: '♻️ Oferta de Resíduo' },
  pedido_residuo: { badge: 'bg-purple-100 text-purple-700', borda: 'border-purple-100', label: '🏭 Pedido de Empresa'  },
  evento:         { badge: 'bg-blue-100 text-blue-700',     borda: 'border-blue-100',   label: '📅 Evento'             },
  educacao:       { badge: 'bg-yellow-100 text-yellow-700', borda: 'border-yellow-100', label: '📚 Educação'           },
  noticia:        { badge: 'bg-cyan-100 text-cyan-700',     borda: 'border-cyan-100',   label: '📰 Notícia'            },
  aviso:          { badge: 'bg-red-100 text-red-700',       borda: 'border-red-100',    label: '📣 Aviso'              },
};


const FORM_VAZIO = {
  tipo_publicacao: 'pedido_residuo',
  titulo: '', descricao: '', id_residuo: '',
  quantidade_kg: '', valor_proposto: '', provincia: '', imagem: '',
};

export default function PaginaInicialEmpresa() {
  const utilizador = getUtilizadorLocal();


  const [feed,       setFeed]       = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');
  const [filtro,     setFiltro]     = useState('todos');
  const [pesquisa,   setPesquisa]   = useState('');


  const [modalAberto, setModalAberto] = useState(false);
  const [residuos,    setResiduos]    = useState([]);
  const [formulario,  setFormulario]  = useState(FORM_VAZIO);
  const [publicando,  setPublicando]  = useState(false);
  const [erroForm,    setErroForm]    = useState('');


  const [modalInteresse,    setModalInteresse]    = useState(false);
  const [publicacaoAlvo,    setPublicacaoAlvo]    = useState(null);
  const [valorProposto,     setValorProposto]     = useState('');
  const [mensagemInteresse, setMensagemInteresse] = useState('');
  const [enviandoInteresse, setEnviandoInteresse] = useState(false);
  const [erroInteresse,     setErroInteresse]     = useState('');
  const [interesseEnviado,  setInteresseEnviado]  = useState({});


  const [empresas, setEmpresas] = useState([]);

  const tiposDisponiveis     = TIPOS_EMPRESA;
  const podePublicar         = true;
  const mostrarCamposResiduo = ['oferta_residuo', 'pedido_residuo'].includes(formulario.tipo_publicacao);

  useEffect(() => {
    carregarFeed();
    carregarResiduos();
    getEmpresas().then(setEmpresas).catch(console.error);
  }, []);

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

  const carregarResiduos = async () => {
    try { setResiduos(await getResiduos()); }
    catch (err) { console.error(err); }
  };

  const feedFiltrado = feed
    .filter(p => filtro === 'todos' || p.tipo_publicacao === filtro)
    .filter(p => {
      if (!pesquisa) return true;
      const t = pesquisa.toLowerCase();
      return (
        p.titulo?.toLowerCase().includes(t)     ||
        p.descricao?.toLowerCase().includes(t)  ||
        p.nome_autor?.toLowerCase().includes(t) ||
        p.provincia?.toLowerCase().includes(t)
      );
    });

  const avisos = feed.filter(p => p.tipo_publicacao === 'aviso');

  const handleCampo = (campo, valor) =>
    setFormulario(prev => ({ ...prev, [campo]: valor }));

  const handleTipo = (novoTipo) =>
    setFormulario({ ...FORM_VAZIO, tipo_publicacao: novoTipo });

  const handlePublicar = async () => {
    if (!formulario.titulo.trim()) { setErroForm('O título é obrigatório.'); return; }
    try {
      setPublicando(true); setErroForm('');
      await criarPublicacao(formulario);
      setModalAberto(false);
      setFormulario(FORM_VAZIO);
      await carregarFeed();
    } catch (err) { setErroForm(err.message); }
    finally { setPublicando(false); }
  };

  const handleApagar = async (id) => {
    if (!window.confirm('Remover esta publicação?')) return;
    try { await apagarPublicacao(id); await carregarFeed(); }
    catch (err) { alert(err.message); }
  };

  const abrirModalInteresse = (publicacao) => {
    setPublicacaoAlvo(publicacao);
    setValorProposto('');
    setMensagemInteresse('');
    setErroInteresse('');
    setModalInteresse(true);
  };

  const handleEnviarInteresse = async () => {
    const vMin      = publicacaoAlvo?.preco_min ? parseFloat(publicacaoAlvo.preco_min) : null;
    const vMax      = publicacaoAlvo?.preco_max ? parseFloat(publicacaoAlvo.preco_max) : null;
    const vProposto = parseFloat(valorProposto);

    if (!valorProposto || vProposto <= 0) {
      setErroInteresse('Indica um valor proposto em Kz.'); return;
    }
    if (vMin && vProposto < vMin) {
      setErroInteresse(`O valor mínimo para este resíduo é ${vMin} Kz/kg.`); return;
    }
    if (vMax && vProposto > vMax) {
      setErroInteresse(`O valor máximo para este resíduo é ${vMax} Kz/kg.`); return;
    }

    try {
      setEnviandoInteresse(true);
      setErroInteresse('');
      const nomeEmpresa   = utilizador?.nome || 'Uma empresa';
      const tituloResiduo = publicacaoAlvo?.titulo || 'resíduo';

      await criarNotificacao({
        id_usuario_destino: publicacaoAlvo.id_autor,
        titulo:             '💼 Nova proposta de compra',
        mensagem:           `${nomeEmpresa} quer comprar o teu resíduo "${tituloResiduo}" por ${vProposto.toFixed(0)} Kz/kg.${mensagemInteresse ? ` Nota: ${mensagemInteresse}` : ''}`,
        id_publicacao:      publicacaoAlvo.id_publicacao,
        tipo:               'proposta',
      });

      setInteresseEnviado(prev => ({ ...prev, [publicacaoAlvo.id_publicacao]: true }));
      setModalInteresse(false);
    } catch (err) {
      setErroInteresse(err.message);
    } finally {
      setEnviandoInteresse(false);
    }
  };

  return (
    <div id="PaginaInicialEmpresa" className="min-h-screen bg-green-100 pt-24 pb-12">
      <HeaderEmpresa />

      <div className="px-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-800">Página Inicial</h1>
            <p className="text-green-600 text-sm mt-0.5">
              Olá, {utilizador?.nome?.split(' ')[0] || 'bem-vinda'} 👋
            </p>
          </div>
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

          {/* Coluna do feed */}
          <div className="flex-1 min-w-0">

            {/* Pesquisa */}
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="w-full bg-white border border-green-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
              />
              {pesquisa && (
                <X
                  size={15}
                  className="absolute right-3 top-3.5 text-gray-400 cursor-pointer"
                  onClick={() => setPesquisa('')}
                />
              )}
            </div>

            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
              {FILTROS.map(f => (
                <button
                  key={f.valor}
                  onClick={() => setFiltro(f.valor)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition shrink-0 ${
                    filtro === f.valor
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
                  }`}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>

            {/* Lista de publicações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {carregando && (
                <p className="text-green-700 text-center py-12 md:col-span-2">A carregar...</p>
              )}
              {erro && (
                <p className="text-red-500 text-center py-6 md:col-span-2">{erro}</p>
              )}
              {!carregando && !erro && feedFiltrado.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-green-100 md:col-span-2">
                  <p className="text-gray-400">Nenhuma publicação encontrada.</p>
                  {podePublicar && (
                    <button
                      onClick={() => setModalAberto(true)}
                      className="mt-3 text-green-600 text-sm underline"
                    >
                      Sê o primeiro a publicar
                    </button>
                  )}
                </div>
              )}
              {feedFiltrado.map(p => (
                <CartaoPublicacao
                  key={p.id_publicacao}
                  publicacao={p}
                  utilizador={utilizador}
                  tipoUtilizador="empresa"
                  onApagar={handleApagar}
                  onInteresse={abrirModalInteresse}
                  interesseJaEnviado={!!interesseEnviado[p.id_publicacao]}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:flex flex-col gap-4 w-68 shrink-0">

            <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-green-800 font-semibold text-sm mb-4 flex items-center gap-2">
                <Building2 size={15} className="text-purple-600" /> Empresas Parceiras
              </h3>
              {empresas.length === 0 ? (
                <p className="text-gray-400 text-xs">Nenhuma empresa registada.</p>
              ) : (
                <div className="space-y-3">
                  {empresas.slice(0, 5).map(e => (
                    <div key={e.id_empresa} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {e.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-700 text-xs font-medium truncate">{e.nome}</p>
                        {e.provincia && (
                          <p className="text-gray-400 text-xs flex items-center gap-1">
                            <MapPin size={10} /> {e.provincia}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {empresas.length > 5 && (
                    <p className="text-green-600 text-xs text-center mt-1">
                      +{empresas.length - 5} empresas
                    </p>
                  )}
                </div>
              )}
            </div>

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
                      {aviso.descricao && (
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{aviso.descricao}</p>
                      )}
                      <p className="text-gray-300 text-xs mt-1">
                        {new Date(aviso.criado_em).toLocaleDateString('pt-AO')}
                      </p>
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
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-4">

              {tiposDisponiveis.length > 1 && (
                <div>
                  <label className="text-gray-600 text-sm block mb-2">O que quero publicar</label>
                  <div className="grid grid-cols-2 gap-2">
                    {tiposDisponiveis.map(t => (
                      <button
                        key={t.valor}
                        onClick={() => handleTipo(t.valor)}
                        className={`py-2 px-3 rounded-xl text-sm font-medium transition border ${
                          formulario.tipo_publicacao === t.valor
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-gray-600 text-sm block mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formulario.titulo}
                  onChange={(e) => handleCampo('titulo', e.target.value)}
                  placeholder="Título da publicação"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="text-gray-600 text-sm block mb-1">Descrição (opcional)</label>
                <textarea
                  value={formulario.descricao}
                  onChange={(e) => handleCampo('descricao', e.target.value)}
                  placeholder="Mais detalhes..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>

              {mostrarCamposResiduo && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-sm block mb-1">Tipo de Resíduo</label>
                    <select
                      value={formulario.id_residuo}
                      onChange={(e) => handleCampo('id_residuo', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <option value="">Seleccionar</option>
                      {residuos.map(r => (
                        <option key={r.id_residuo} value={r.id_residuo}>{r.tipo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-600 text-sm block mb-1">Província</label>
                    <input
                      type="text"
                      value={formulario.provincia}
                      onChange={(e) => handleCampo('provincia', e.target.value)}
                      placeholder="Ex: Luanda"
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                </div>
              )}

              {!mostrarCamposResiduo && (
                <div>
                  <label className="text-gray-600 text-sm block mb-1">Província (opcional)</label>
                  <input
                    type="text"
                    value={formulario.provincia}
                    onChange={(e) => handleCampo('provincia', e.target.value)}
                    placeholder="Ex: Luanda"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              )}

              {erroForm && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{erroForm}</p>
              )}
            </div>

            <button
              onClick={handlePublicar}
              disabled={publicando}
              className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
            >
              {publicando ? 'A publicar...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      {/* Modal de interesse */}
      {modalInteresse && publicacaoAlvo && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-green-800 font-bold text-lg">Propor Compra</h3>
              <button onClick={() => setModalInteresse(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              <p className="text-green-800 font-medium text-sm">{publicacaoAlvo.titulo}</p>
              {publicacaoAlvo.tipo_residuo && (
                <p className="text-green-600 text-xs mt-0.5 flex items-center gap-1">
                  <Recycle size={11} /> {publicacaoAlvo.tipo_residuo}
                  {publicacaoAlvo.provincia && (
                    <span className="ml-2 flex items-center gap-1">
                      <MapPin size={11} />{publicacaoAlvo.provincia}
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="space-y-3">

              <div>
                <label className="text-gray-600 text-sm block mb-1">
                  Valor que propões <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">(Kz/kg)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={valorProposto}
                    onChange={(e) => setValorProposto(e.target.value)}
                    placeholder="Ex: 750"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <span className="absolute right-4 top-3 text-gray-400 text-sm">Kz</span>
                </div>
                {publicacaoAlvo.preco_min && publicacaoAlvo.preco_max && (
                  <p className="text-xs text-gray-400 mt-1">
                    Referência: {publicacaoAlvo.preco_min}–{publicacaoAlvo.preco_max} Kz/kg
                  </p>
                )}
              </div>

              <div>
                <label className="text-gray-600 text-sm block mb-1">Nota (opcional)</label>
                <textarea
                  value={mensagemInteresse}
                  onChange={(e) => setMensagemInteresse(e.target.value)}
                  placeholder="Ex: Podemos recolher na próxima semana..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>

              {erroInteresse && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{erroInteresse}</p>
              )}
            </div>

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


function CartaoPublicacao({ publicacao: p, utilizador, tipoUtilizador, onApagar, onInteresse, interesseJaEnviado }) {
  const estilo = ESTILOS[p.tipo_publicacao] || ESTILOS.aviso;

  const podeApagar = utilizador?.tipo === 'admin' || utilizador?.id === p.id_autor;

  const podeTeresseInteresse =
    tipoUtilizador === 'empresa' &&
    p.tipo_publicacao === 'oferta_residuo' &&
    p.id_autor !== utilizador?.id;

  return (
    <div className={`bg-white border ${estilo.borda} rounded-2xl overflow-hidden shadow-sm`}>

      {p.imagem && (
        <img
          src={p.imagem}
          alt={p.titulo}
          className="w-full h-48 object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      <div className="p-4">

        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${estilo.badge}`}>
            {estilo.label}
          </span>
          <span className="text-gray-400 text-xs">
            {new Date(p.criado_em).toLocaleDateString('pt-AO')}
          </span>
        </div>

        <h3 className="text-gray-800 font-semibold text-sm mb-1">{p.titulo}</h3>
        {p.descricao && (
          <p className="text-gray-500 text-xs mb-2 line-clamp-2">{p.descricao}</p>
        )}

        {(p.tipo_publicacao === 'oferta_residuo' || p.tipo_publicacao === 'pedido_residuo') && (
          <div className="flex flex-wrap gap-3 mb-2">
            {p.tipo_residuo && (
              <span className="flex items-center gap-1 text-gray-500 text-xs">
                <Recycle size={11} /> {p.tipo_residuo}
              </span>
            )}
            {p.provincia && (
              <span className="flex items-center gap-1 text-gray-400 text-xs">
                <MapPin size={11} /> {p.provincia}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
              {p.nome_autor?.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-500 text-xs">{p.nome_autor}</span>
            {p.tipo_autor === 'empresa' && (
              <span className="text-purple-600 text-xs flex items-center gap-1">
                <Building2 size={10} /> Empresa
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {podeApagar && (
              <button
                onClick={() => onApagar(p.id_publicacao)}
                className="text-red-400 hover:text-red-500 text-xs flex items-center gap-1 transition"
              >
                <Trash2 size={12} /> Remover
              </button>
            )}
            {podeTeresseInteresse && (
              interesseJaEnviado
                ? <span className="text-green-600 text-xs font-medium">✓ Proposta enviada</span>
                : (
                  <button
                    onClick={() => onInteresse(p)}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                  >
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