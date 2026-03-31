
// FLUXO "FAZER TROCA":
//   1. Empresa ve oferta de residuo de utilizador no feed
//   2. Clica "Fazer Troca" - sem modal, sem formulario
//   3. Utilizador recebe notificacao: "A empresa X quer fazer uma troca contigo"
//   4. Botao muda para "Enviado" - nao pode enviar de novo

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Recycle, Building2, MapPin, Plus, Search, Trash2,
  X, Bell, Pencil, Target, Info,
  Truck, AlertCircle, ChevronRight, User,
  Calendar, Newspaper, BookOpen, Megaphone,
  ThumbsDown, Smile, ThumbsUp, Star,
  ArrowLeftRight, CheckCircle
} from "lucide-react";
import HeaderEmpresa from "./HeaderEmpresa";
import {
  getFeed, apagarPublicacao, getUtilizadorLocal,
  getEmpresas, pesquisar, criarNotificacao, getPerfilEmpresa
} from "../../api.js";

const FILTROS = [
  { valor: "todos",          label: "Tudo"      },
  { valor: "oferta_residuo", label: "Ofertas"   },
  { valor: "pedido_residuo", label: "Pedidos"   },
  { valor: "evento",         label: "Eventos"   },
  { valor: "educacao",       label: "Educacao"  },
  { valor: "noticia",        label: "Noticias"  },
  { valor: "aviso",          label: "Avisos"    },
];

const ESTILOS = {
  oferta_residuo: { badge: "bg-green-100 text-green-700",   borda: "border-green-200",  label: "Oferta",   icone: <Recycle   size={28} className="text-green-500"  />, fundo: "bg-green-50"  },
  pedido_residuo: { badge: "bg-purple-100 text-purple-700", borda: "border-purple-200", label: "Pedido",   icone: <Megaphone size={28} className="text-purple-500" />, fundo: "bg-purple-50" },
  evento:         { badge: "bg-blue-100 text-blue-700",     borda: "border-blue-200",   label: "Evento",   icone: <Calendar  size={28} className="text-blue-500"  />, fundo: "bg-blue-50"   },
  educacao:       { badge: "bg-yellow-100 text-yellow-700", borda: "border-yellow-200", label: "Educacao", icone: <BookOpen  size={28} className="text-yellow-500" />, fundo: "bg-yellow-50" },
  noticia:        { badge: "bg-cyan-100 text-cyan-700",     borda: "border-cyan-200",   label: "Noticia",  icone: <Newspaper size={28} className="text-cyan-500"  />, fundo: "bg-cyan-50"   },
  aviso:          { badge: "bg-red-100 text-red-700",       borda: "border-red-200",    label: "Aviso",    icone: <Bell      size={28} className="text-red-500"    />, fundo: "bg-red-50"    },
};

const QUALIDADE_CONFIG = {
  ruim:      { icone: <ThumbsDown size={11} className="text-red-500"    />, label: "Ruim",      cor: "bg-red-50 text-red-600 border-red-200"         },
  moderada:  { icone: <Smile      size={11} className="text-yellow-500" />, label: "Moderada",  cor: "bg-yellow-50 text-yellow-600 border-yellow-200" },
  boa:       { icone: <ThumbsUp   size={11} className="text-green-500"  />, label: "Boa",       cor: "bg-green-50 text-green-600 border-green-200"    },
  excelente: { icone: <Star       size={11} className="text-orange-400" />, label: "Excelente", cor: "bg-orange-50 text-orange-600 border-orange-200" },
};

export default function PaginaInicialEmpresa() {
  const navigate   = useNavigate();
  const utilizador = getUtilizadorLocal(); // dados da sessao da empresa

  // Estados do feed
  const [feed,       setFeed]       = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState("");
  const [filtro,     setFiltro]     = useState("todos");

  // Estados da pesquisa com dropdown
  const [pesquisa,           setPesquisa]           = useState("");
  const [resultadosPesquisa, setResultadosPesquisa] = useState(null);
  const [pesquisando,        setPesquisando]        = useState(false);
  const [mostrarDropdown,    setMostrarDropdown]    = useState(false);
  const pesquisaRef = useRef(null); // para fechar dropdown ao clicar fora
  const timeoutRef  = useRef(null); // para debounce de 400ms

  // Empresas para a sidebar
  const [empresas, setEmpresas] = useState([]);

  // Nome da empresa autenticada - usado na mensagem de notificacao
  // "A empresa X quer fazer uma troca contigo"
  const [nomeEmpresa, setNomeEmpresa] = useState("");

  // Map de trocas ja enviadas { id_publicacao: true }
  // Evita que a empresa envie notificacao duplicada
  const [trocaEnviada, setTrocaEnviada] = useState({});

  // Id da publicacao em processamento - mostra loading no botao correcto
  const [enviandoTroca, setEnviandoTroca] = useState(null);

  // Carregamento inicial
  useEffect(() => {
    carregarFeed();
    getEmpresas().then(setEmpresas).catch(console.error);
    // Carrega nome da empresa para usar nas notificacoes
    getPerfilEmpresa().then(p => setNomeEmpresa(p.nome || "Empresa")).catch(console.error);
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const fechar = (e) => {
      if (pesquisaRef.current && !pesquisaRef.current.contains(e.target))
        setMostrarDropdown(false);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  // Carrega feed via GET /api/feed
  const carregarFeed = async () => {
    try { setCarregando(true); setFeed(await getFeed()); }
    catch (err) { setErro(err.message); }
    finally { setCarregando(false); }
  };

  // Pesquisa com debounce de 400ms
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

  // Navega para perfil ao clicar no dropdown
  const irParaPerfil = (tipo_resultado, item) => {
    setMostrarDropdown(false); setPesquisa(""); setResultadosPesquisa(null);
    if (tipo_resultado === "empresa")      navigate(`/PerfilEmpresa/${item.id_empresa}`);
    else if (tipo_resultado === "comum")   navigate(`/Perfil/${item.id_usuario}`);
    else if (tipo_resultado === "coletor") navigate(`/PerfilColetador/${item.id_coletador}`);
  };

  const totalResultados = resultadosPesquisa
    ? (resultadosPesquisa.empresas?.length     || 0) +
      (resultadosPesquisa.utilizadores?.length  || 0) +
      (resultadosPesquisa.coletadores?.length   || 0)
    : 0;

  // Apaga publicacao
  const handleApagar = async (p) => {
    if (p.tipo_publicacao === "pedido_residuo" && parseFloat(p.total_acumulado || 0) > 0) {
      alert("Nao podes eliminar este pedido porque ja existem acordos activos."); return;
    }
    if (!window.confirm("Remover esta publicacao?")) return;
    try { await apagarPublicacao(p.id_publicacao); await carregarFeed(); }
    catch (err) { alert(err.message); }
  };

  // Empresa clica "Fazer Troca" numa oferta de utilizador
  // SEM MODAL - notifica o utilizador imediatamente com o nome da empresa
  // Utilizador ve no sino: "A empresa X quer fazer uma troca contigo"
  const handleFazerTroca = async (publicacao) => {
    if (enviandoTroca) return; // evita duplo clique

    try {
      setEnviandoTroca(publicacao.id_publicacao); // activa loading neste card

      // Cria notificacao do tipo "geral" para o utilizador dono da oferta
      // Aparece no sino do header sem botoes aceitar/recusar
      await criarNotificacao({
        id_usuario_destino: publicacao.id_autor,      // utilizador dono da oferta
        titulo:             "Interesse numa troca",
        mensagem:           `A empresa ${nomeEmpresa} quer fazer uma troca contigo pelo teu residuo "${publicacao.titulo}".`,
        id_publicacao:      publicacao.id_publicacao, // referencia a oferta
        tipo:               "geral",
      });

      // Marca como enviado - botao muda para "Enviado"
      setTrocaEnviada(prev => ({ ...prev, [publicacao.id_publicacao]: true }));

    } catch (err) {
      alert(err.message);
    } finally {
      setEnviandoTroca(null); // desactiva loading
    }
  };

  const feedFiltrado = feed.filter(p => filtro === "todos" || p.tipo_publicacao === filtro);
  const avisos       = feed.filter(p => p.tipo_publicacao === "aviso");

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12">
      <HeaderEmpresa />

      <div className="px-6">

        {/* Cabecalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-800">Pagina Inicial</h1>
            <p className="text-green-600 text-sm mt-0.5">Ola, {utilizador?.nome?.split(" ")[0] || "bem-vinda"}</p>
          </div>
          <button onClick={() => navigate("/DashboardEmpresa")}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">
            <Plus size={16} /> Novo Pedido
          </button>
        </div>

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">

            {/* Pesquisa com dropdown */}
            <div className="relative mb-4" ref={pesquisaRef}>
              <Search size={15} className="absolute left-3 top-3.5 text-gray-400 z-10" />
              <input type="text" placeholder="Pesquisar empresas, utilizadores, coletadores..."
                value={pesquisa} onChange={(e) => handlePesquisa(e.target.value)}
                onFocus={() => { if (resultadosPesquisa && totalResultados > 0) setMostrarDropdown(true); }}
                className="w-full bg-white border border-green-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" />
              {pesquisa && !pesquisando && (
                <button onClick={() => { setPesquisa(""); setResultadosPesquisa(null); setMostrarDropdown(false); }}
                  className="absolute right-3 top-3.5"><X size={15} className="text-gray-400" /></button>
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
                            <button key={e.id_empresa} onClick={() => irParaPerfil("empresa", e)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition text-left">
                              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{e.nome?.charAt(0).toUpperCase()}</div>
                              <div className="min-w-0">
                                <p className="text-gray-800 text-sm font-medium truncate">{e.nome}</p>
                                <p className="text-gray-400 text-xs flex items-center gap-1"><Building2 size={10} /> Empresa{e.provincia && <><MapPin size={10} className="ml-1" />{e.provincia}</>}</p>
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
                            <button key={u.id_usuario} onClick={() => irParaPerfil("comum", u)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition text-left">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{u.nome?.charAt(0).toUpperCase()}</div>
                              <div className="min-w-0">
                                <p className="text-gray-800 text-sm font-medium truncate">{u.nome}</p>
                                <p className="text-gray-400 text-xs flex items-center gap-1"><User size={10} /> Utilizador{u.provincia && <><MapPin size={10} className="ml-1" />{u.provincia}</>}</p>
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
                            <button key={c.id_coletador} onClick={() => irParaPerfil("coletor", c)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition text-left">
                              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{c.nome?.charAt(0).toUpperCase()}</div>
                              <div className="min-w-0">
                                <p className="text-gray-800 text-sm font-medium truncate">{c.nome}</p>
                                <p className="text-gray-400 text-xs flex items-center gap-1"><Recycle size={10} /> Coletador{c.provincia && <><MapPin size={10} className="ml-1" />{c.provincia}</>}</p>
                              </div>
                              <ChevronRight size={14} className="text-gray-300 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="px-4 py-2 border-t border-gray-100">
                        <p className="text-gray-300 text-xs text-center">{totalResultados} resultado{totalResultados !== 1 ? "s" : ""} encontrado{totalResultados !== 1 ? "s" : ""}</p>
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition shrink-0 ${
                    filtro === f.valor ? "bg-green-600 text-white" : "bg-white text-green-700 border border-green-200 hover:bg-green-50"
                  }`}>{f.label}</button>
              ))}
            </div>

            {/* Feed */}
            {carregando && <p className="text-green-700 text-center py-12">A carregar...</p>}
            {erro && <p className="text-red-500 text-center py-6">{erro}</p>}
            {!carregando && !erro && feedFiltrado.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-green-100">
                <p className="text-gray-400">Nenhuma publicacao encontrada.</p>
                <button onClick={() => navigate("/DashboardEmpresa")} className="mt-3 text-green-600 text-sm underline">
                  Criar primeiro pedido no Dashboard
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedFiltrado.map(p => (
                <CardPublicacao
                  key={p.id_publicacao}
                  publicacao={p}
                  utilizador={utilizador}
                  onEditar={() => navigate("/DashboardEmpresa")}
                  onApagar={handleApagar}
                  onFazerTroca={handleFazerTroca}
                  trocaEnviada={trocaEnviada}
                  enviandoTrocaId={enviandoTroca}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
            <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-green-800 font-semibold text-sm mb-4 flex items-center gap-2">
                <Building2 size={15} className="text-purple-600" /> Empresas Parceiras
              </h3>
              {empresas.length === 0 ? (
                <p className="text-gray-400 text-xs">Nenhuma empresa registada.</p>
              ) : (
                <div className="space-y-1">
                  {empresas.slice(0, 5).map(e => (
                    <button key={e.id_empresa} onClick={() => navigate(`/PerfilEmpresa/${e.id_empresa}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-green-50 transition text-left">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{e.nome?.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-700 text-xs font-medium truncate">{e.nome}</p>
                        {e.provincia && <p className="text-gray-400 text-xs flex items-center gap-1"><MapPin size={10} /> {e.provincia}</p>}
                      </div>
                      <ChevronRight size={13} className="text-gray-300 shrink-0" />
                    </button>
                  ))}
                  {empresas.length > 5 && <p className="text-green-600 text-xs text-center mt-1">+{empresas.length - 5} empresas</p>}
                </div>
              )}
            </div>
            <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-red-600 font-semibold text-sm mb-4 flex items-center gap-2"><Bell size={15} /> Avisos</h3>
              {avisos.length === 0 ? (
                <p className="text-gray-400 text-xs">Sem avisos de momento.</p>
              ) : (
                <div className="space-y-3">
                  {avisos.slice(0, 3).map(aviso => (
                    <div key={aviso.id_publicacao} className="border-l-2 border-red-300 pl-3">
                      <p className="text-gray-700 text-xs font-medium">{aviso.titulo}</p>
                      {aviso.descricao && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{aviso.descricao}</p>}
                      <p className="text-gray-300 text-xs mt-1">{new Date(aviso.criado_em).toLocaleDateString("pt-AO")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Card individual de publicacao
// onFazerTroca  -> empresa clica "Fazer Troca" numa oferta de utilizador
// trocaEnviada  -> map { id_publicacao: true } - evita duplicados
// enviandoTrocaId -> id em loading (mostra spinner no botao correcto)
function CardPublicacao({ publicacao: p, utilizador, onEditar, onApagar, onFazerTroca, trocaEnviada, enviandoTrocaId }) {
  const estilo     = ESTILOS[p.tipo_publicacao] || ESTILOS.aviso;
  const qualCfg    = QUALIDADE_CONFIG[p.qualidade] || null;
  const podeGerir  = utilizador?.tipo === "admin" || utilizador?.id === p.id_autor;
  const temAcordos = parseFloat(p.total_acumulado || 0) > 0;

  // Empresa pode fazer troca em ofertas de outros utilizadores
  const podeFazerTroca =
    utilizador?.tipo === "empresa" &&
    p.tipo_publicacao === "oferta_residuo" &&
    p.id_autor !== utilizador?.id;

  // Verifica se ja enviou notificacao de troca para esta oferta
  const jaEnviouTroca = !!(trocaEnviada?.[p.id_publicacao]);

  // Verifica se este card esta em loading
  const esteCardEmLoading = enviandoTrocaId === p.id_publicacao;

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

      {p.imagem ? (
        <img src={p.imagem} alt={p.titulo} className="w-full h-44 object-cover"
          onError={(e) => { e.target.style.display = "none"; }} />
      ) : (
        <div className={`w-full h-36 ${estilo.fundo} flex items-center justify-center`}>
          {estilo.icone}
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">

        {/* Badge + data + accoes */}
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${estilo.badge}`}>{estilo.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">{new Date(p.criado_em).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}</span>
            {podeGerir && (
              <>
                <button onClick={onEditar} title="Editar no Dashboard"
                  className="text-blue-400 hover:text-blue-600 transition"><Pencil size={13} /></button>
                {temAcordos
                  ? <span title="Ja existem acordos activos" className="text-gray-300 cursor-not-allowed"><Trash2 size={13} /></span>
                  : <button onClick={() => onApagar(p)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={13} /></button>
                }
              </>
            )}
          </div>
        </div>

        <h3 className="text-gray-900 font-bold text-sm mb-1 line-clamp-2">{p.titulo}</h3>
        {p.descricao && <p className="text-gray-500 text-xs mb-2 line-clamp-2">{p.descricao}</p>}

        {/* Tags */}
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

        {/* Valor */}
        {p.tipo_publicacao === "pedido_residuo" && p.valor_proposto && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-2">
            <p className="text-green-700 text-xs">A empresa paga</p>
            <p className="text-green-800 font-bold text-base">
              {parseFloat(p.valor_proposto).toFixed(0)} Kz<span className="text-xs font-normal text-green-600"> /kg</span>
            </p>
          </div>
        )}

        {/* Minimo por pessoa */}
        {p.minimo_por_pessoa_kg && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-2">
            <p className="text-blue-600 text-xs font-medium mb-0.5 flex items-center gap-1"><Info size={10} /> Minimo por pessoa</p>
            <div className="flex items-center gap-3">
              <span className="text-gray-800 text-xs font-bold">{parseFloat(p.minimo_por_pessoa_kg).toFixed(0)} kg</span>
              {minimoUnidades !== null && p.nome_unidade && (
                <span className="text-gray-500 text-xs">ou {minimoUnidades.toLocaleString()} {p.nome_unidade}s</span>
              )}
            </div>
          </div>
        )}

        {/* Progresso */}
        {progresso !== null && (
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-xs flex items-center gap-1"><Target size={10} /> Progresso</span>
              <span className={`text-xs font-bold ${progresso >= 100 ? "text-green-600" : "text-gray-500"}`}>
                {parseFloat(p.total_acumulado || 0).toFixed(0)}/{parseFloat(p.minimo_para_agendar || 0).toFixed(0)} kg
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${progresso >= 100 ? "bg-green-500" : "bg-green-400"}`} style={{ width: `${progresso}%` }} />
            </div>
            {progresso >= 100 && <p className="text-green-600 text-xs mt-1 font-medium">Meta atingida - agenda a recolha no Dashboard</p>}
          </div>
        )}

        {/* Aviso acordos activos */}
        {temAcordos && podeGerir && (
          <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1.5 mb-2">
            <AlertCircle size={12} className="text-yellow-600 shrink-0" />
            <p className="text-yellow-700 text-xs">{parseFloat(p.total_acumulado).toFixed(0)} kg em acordos activos</p>
          </div>
        )}

        {/* Coletador badge */}
        {p.com_coletador && (
          <div className="mt-auto pt-2 border-t border-gray-100 flex justify-end">
            <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
              <Truck size={10} /> A empresa vem buscar
            </span>
          </div>
        )}

        {/* Rodape: autor + botao Fazer Troca */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">

          {/* Autor - so mostra para publicacoes de outros */}
          {p.id_autor !== utilizador?.id ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {p.nome_autor?.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-500 text-xs truncate">{p.nome_autor}</span>
            </div>
          ) : <div />}

          {/* Botao "Fazer Troca" - so aparece em ofertas de outros utilizadores */}
          {/* Clique unico - sem modal - notifica o utilizador imediatamente */}
          {podeFazerTroca && (
            jaEnviouTroca
              ? <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                  <CheckCircle size={11} /> Enviado
                </span>
              : <button
                  onClick={() => onFazerTroca(p)}
                  disabled={esteCardEmLoading}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
                  {esteCardEmLoading
                    ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> A enviar...</>
                    : <><ArrowLeftRight size={12} /> Fazer Troca</>
                  }
                </button>
          )}
        </div>
      </div>
    </div>
  );
}