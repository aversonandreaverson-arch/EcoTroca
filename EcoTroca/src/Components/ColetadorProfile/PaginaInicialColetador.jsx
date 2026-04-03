
//  Pagina inicial do coletador — ve o feed de publicacoes,
//  pesquisa empresas/utilizadores/coletadores e ve oportunidades.
//  Coletador nao publica — so le o feed.

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Megaphone, Calendar, BookOpen, Search, X,
  Building2, MapPin, ChevronRight, User,
  Recycle, Newspaper, Bell, Target, Info
} from "lucide-react";
import Header from "./Header";
import { getFeed, getEmpresas, pesquisar } from "../../api.js";

// Filtros do feed — coletador nao ve ofertas de residuo (nao e relevante para ele)
const FILTROS = [
  { valor: "todos",          label: "Tudo"     },
  { valor: "pedido_residuo", label: "Pedidos"  },
  { valor: "evento",         label: "Eventos"  },
  { valor: "educacao",       label: "Educacao" },
  { valor: "noticia",        label: "Noticias" },
  { valor: "aviso",          label: "Avisos"   },
];

// Estilos visuais por tipo de publicacao
const ESTILOS = {
  pedido_residuo: { badge: "bg-purple-100 text-purple-700", borda: "border-purple-200", label: "Pedido de Empresa", icone: <Megaphone size={28} className="text-purple-500" />, fundo: "bg-purple-50" },
  evento:         { badge: "bg-blue-100 text-blue-700",     borda: "border-blue-200",   label: "Evento",            icone: <Calendar  size={28} className="text-blue-500"   />, fundo: "bg-blue-50"   },
  educacao:       { badge: "bg-yellow-100 text-yellow-700", borda: "border-yellow-200", label: "Educacao",          icone: <BookOpen  size={28} className="text-yellow-500" />, fundo: "bg-yellow-50" },
  noticia:        { badge: "bg-cyan-100 text-cyan-700",     borda: "border-cyan-200",   label: "Noticia",           icone: <Newspaper size={28} className="text-cyan-500"   />, fundo: "bg-cyan-50"   },
  aviso:          { badge: "bg-red-100 text-red-700",       borda: "border-red-200",    label: "Aviso",             icone: <Bell      size={28} className="text-red-500"    />, fundo: "bg-red-50"    },
};

export default function PaginaInicialColetador() {
  const navigate = useNavigate();

  // Estados do feed
  const [feed,       setFeed]       = useState([]);
  const [empresas,   setEmpresas]   = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro,     setFiltro]     = useState("todos");

  // Estados da pesquisa com dropdown
  const [pesquisa,           setPesquisa]           = useState("");
  const [resultadosPesquisa, setResultadosPesquisa] = useState(null);
  const [pesquisando,        setPesquisando]        = useState(false); // estado que faltava
  const [mostrarDropdown,    setMostrarDropdown]    = useState(false);

  const pesquisaRef = useRef(null); // para fechar dropdown ao clicar fora
  const timeoutRef  = useRef(null); // para debounce de 400ms

  // Carregamento inicial
  useEffect(() => { loadData(); }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const fechar = (e) => {
      if (pesquisaRef.current && !pesquisaRef.current.contains(e.target))
        setMostrarDropdown(false);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  // Carrega feed e empresas em paralelo
  const loadData = useCallback(async () => {
    setCarregando(true);
    try {
      const [f, e] = await Promise.all([getFeed(), getEmpresas()]);
      setFeed(f    || []);
      setEmpresas(e || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Pesquisa com debounce de 400ms
  const handlePesquisa = (valor) => {
    setPesquisa(valor);
    clearTimeout(timeoutRef.current);
    if (!valor.trim()) { setResultadosPesquisa(null); setMostrarDropdown(false); return; }
    timeoutRef.current = setTimeout(async () => {
      try {
        setPesquisando(true); // activa spinner
        const dados = await pesquisar(valor.trim());
        setResultadosPesquisa(dados || {});
        setMostrarDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setPesquisando(false); // desactiva spinner
      }
    }, 400);
  };

  // Navega para o perfil correcto ao clicar no dropdown
  const irParaPerfil = (tipo_resultado, item) => {
    setMostrarDropdown(false); setPesquisa(""); setResultadosPesquisa(null);
    if (tipo_resultado === "empresa")      navigate(`/PerfilEmpresa/${item.id_empresa}`);
    else if (tipo_resultado === "comum")   navigate(`/Perfil/${item.id_usuario}`);
    else if (tipo_resultado === "coletor") navigate(`/PerfilColetador/${item.id_coletador}`);
  };

  // Total de resultados da pesquisa
  const totalResultados = useMemo(() => {
    if (!resultadosPesquisa) return 0;
    return (
      (resultadosPesquisa.empresas     || []).length +
      (resultadosPesquisa.utilizadores || []).length +
      (resultadosPesquisa.coletadores  || []).length
    );
  }, [resultadosPesquisa]);

  // Feed filtrado por tipo
  const feedFiltrado = useMemo(
    () => feed.filter(p => filtro === "todos" || p.tipo_publicacao === filtro),
    [feed, filtro]
  );

  // Avisos para a sidebar
  const avisos = useMemo(() => feed.filter(p => p.tipo_publicacao === "aviso"), [feed]);

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12">
      <Header />

      <div className="px-6">
        <h1 className="text-2xl font-bold text-green-800 mb-1">Pagina Inicial</h1>
        <p className="text-green-600 text-sm mb-6">Ve os pedidos de empresas e oportunidades de recolha.</p>

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">

            {/* Pesquisa com dropdown */}
            <div className="relative mb-4" ref={pesquisaRef}>
              <Search size={15} className="absolute left-3 top-3.5 text-gray-400 z-10" />
              <input value={pesquisa} onChange={(e) => handlePesquisa(e.target.value)}
                onFocus={() => { if (resultadosPesquisa && totalResultados > 0) setMostrarDropdown(true); }}
                placeholder="Pesquisar empresas, utilizadores, coletadores..."
                className="w-full bg-white border border-green-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm" />
              {/* Botao limpar */}
              {pesquisa && !pesquisando && (
                <button onClick={() => { setPesquisa(""); setResultadosPesquisa(null); setMostrarDropdown(false); }}
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

              {/* Dropdown de resultados */}
              {mostrarDropdown && resultadosPesquisa && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-green-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                  {totalResultados === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Nenhum resultado para "{pesquisa}"</div>
                  ) : (
                    <>
                      {/* Empresas */}
                      {(resultadosPesquisa.empresas || []).length > 0 && (
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
                      {/* Utilizadores */}
                      {(resultadosPesquisa.utilizadores || []).length > 0 && (
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
                      {/* Coletadores */}
                      {(resultadosPesquisa.coletadores || []).length > 0 && (
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
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Feed */}
            {carregando && <p className="text-green-700 text-center py-12">A carregar...</p>}
            {!carregando && feedFiltrado.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-green-100">
                <p className="text-gray-400">Nenhuma publicacao encontrada.</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedFiltrado.map(p => {
                const estilo = ESTILOS[p.tipo_publicacao] || ESTILOS.aviso;
                const progresso = (() => {
                  const acumulado = parseFloat(p.total_acumulado || 0);
                  const meta      = parseFloat(p.minimo_para_agendar || 0);
                  if (!meta) return null;
                  return Math.min(Math.round((acumulado / meta) * 100), 100);
                })();

                return (
                  <div key={p.id_publicacao} className={`bg-white border ${estilo.borda || "border-gray-200"} rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col`}>
                    {/* Imagem ou fundo */}
                    {p.imagem ? (
                      <img src={p.imagem} alt={p.titulo} className="w-full h-44 object-cover"
                        onError={(e) => { e.target.style.display = "none"; }} />
                    ) : (
                      <div className={`w-full h-32 ${estilo.fundo} flex items-center justify-center`}>
                        {estilo.icone}
                      </div>
                    )}

                    <div className="p-4 flex flex-col flex-1">
                      {/* Badge + data */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${estilo.badge || "bg-gray-100 text-gray-600"}`}>{estilo.label || p.tipo_publicacao}</span>
                        <span className="text-gray-400 text-xs">{new Date(p.criado_em).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}</span>
                      </div>

                      <h3 className="text-gray-900 font-bold text-sm mb-1 line-clamp-2">{p.titulo}</h3>
                      {p.descricao && <p className="text-gray-500 text-xs mb-2 line-clamp-2">{p.descricao}</p>}

                      {/* Valor que a empresa paga — util para o coletador saber o que vale a recolha */}
                      {p.tipo_publicacao === "pedido_residuo" && p.valor_proposto && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-2">
                          <p className="text-green-700 text-xs">A empresa paga</p>
                          <p className="text-green-800 font-bold">{parseFloat(p.valor_proposto).toFixed(0)} Kz<span className="text-xs font-normal text-green-600"> /kg</span></p>
                        </div>
                      )}

                      {/* Progresso do pedido */}
                      {progresso !== null && (
                        <div className="mb-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400 text-xs flex items-center gap-1"><Target size={10} /> Progresso</span>
                            <span className="text-xs font-bold text-gray-500">
                              {parseFloat(p.total_acumulado || 0).toFixed(0)}/{parseFloat(p.minimo_para_agendar || 0).toFixed(0)} kg
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${progresso >= 100 ? "bg-green-500" : "bg-green-400"}`} style={{ width: `${progresso}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Autor */}
                      <div className="mt-auto pt-2 border-t border-gray-100 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {p.nome_autor?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-500 text-xs truncate">{p.nome_autor}</span>
                        {p.tipo_autor === "empresa" && (
                          <span className="text-purple-600 text-xs flex items-center gap-1"><Building2 size={10} /> Empresa</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
            {/* Empresas */}
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
            {/* Avisos */}
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