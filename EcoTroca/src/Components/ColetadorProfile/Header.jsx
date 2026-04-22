import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { Bell, X, Check, XCircle, CheckCircle, AlertCircle, LogOut } from "lucide-react";
import { logout, getPerfil, getNotificacoes, marcarNotificacaoLida } from "../../api.js";

// Links para coletador INDEPENDENTE
const linksIndependente = [
  { label: "Página Inicial",    to: "/ColetadorInicio"    },
  { label: "Dashboard",         to: "/ColetadorDashboard" },
  { label: "Pedidos Pendentes", to: "/PedidosPendentes"   },
  { label: "Histórico",         to: "/HistoricoColetas"   },
  { label: "Notícias",          to: "/ColetadorNoticias"  },
  { label: "Eventos",           to: "/ColetadorEventos"   },
  { label: "Perfil",            to: "/PerfilColetador"    },
];

// Links para coletador DEPENDENTE — sem Pedidos Pendentes nem Histórico
const linksDependente = [
  { label: "Página Inicial", to: "/ColetadorInicio"    },
  { label: "Dashboard",      to: "/ColetadorDashboard" },
  { label: "Notícias",       to: "/ColetadorNoticias"  },
  { label: "Eventos",        to: "/ColetadorEventos"   },
  { label: "Perfil",         to: "/PerfilColetador"    },
];

const Header = () => {
  const [isOpen,        setIsOpen]        = useState(false);
  const [tipoColetor,   setTipoColetor]   = useState('independente');
  const [nomeEmpresa,   setNomeEmpresa]   = useState('');
  const [painelAberto,  setPainelAberto]  = useState(false);
  const [notificacoes,  setNotificacoes]  = useState([]);
  const [feedback,      setFeedback]      = useState(null);

  const painelRef = useRef(null);

  const carregarNotificacoes = async () => {
    try {
      const dados = await getNotificacoes();
      setNotificacoes(dados);
    } catch (err) {
      console.error('Erro ao carregar notificacoes:', err);
    }
  };

  useEffect(() => {
    // Carrega tipo do coletador
    getPerfil()
      .then(perfil => {
        if (perfil?.tipo_coletador === 'dependente') {
          setTipoColetor('dependente');
          setNomeEmpresa(perfil.nome_empresa || '');
        }
      })
      .catch(() => {});

    carregarNotificacoes();
  }, []);

  // Fecha painel ao clicar fora
  useEffect(() => {
    const fechar = (e) => {
      if (painelRef.current && !painelRef.current.contains(e.target))
        setPainelAberto(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  // Limpa feedback após 4 segundos
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const marcarLida = async (id) => {
    try {
      await marcarNotificacaoLida(id);
      setNotificacoes(prev =>
        prev.map(n => n.id_notificacao === id ? { ...n, lida: true } : n)
      );
    } catch (err) {
      console.error('Erro ao marcar notificacao:', err);
    }
  };

  const naoLidas = notificacoes.filter(n => !n.lida).length;
  const links    = tipoColetor === 'dependente' ? linksDependente : linksIndependente;

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">

      {/* Feedback visual */}
      {feedback && (
        <div className={`w-full px-4 py-3 flex items-center justify-between text-sm font-medium ${
          feedback.tipo === 'sucesso' ? 'bg-green-600 text-white' :
          feedback.tipo === 'erro'   ? 'bg-red-600 text-white'   :
                                       'bg-gray-700 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.tipo === 'sucesso' && <CheckCircle size={16} />}
            {feedback.tipo === 'erro'    && <AlertCircle size={16} />}
            <span>{feedback.mensagem}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        {/* Logo */}
        <div>
          <h1 className="text-xl font-bold text-green-700">Ecotroca-Angola</h1>
          <span className="text-xs text-green-500 font-medium">
            {tipoColetor === 'dependente' && nomeEmpresa
              ? `Coletador da empresa ${nomeEmpresa}`
              : 'Coletador Independente'
            }
          </span>
        </div>

        {/* Links Desktop */}
        <ul className="hidden md:flex items-center gap-6 text-green-700 font-medium">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to}
                className={({ isActive }) =>
                  isActive
                    ? "text-green-900 font-semibold border-b-2 border-green-700 pb-1"
                    : "hover:text-green-900 transition"
                }>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">

          {/* Sino de notificacoes */}
          <div className="relative" ref={painelRef}>
            <button onClick={() => setPainelAberto(!painelAberto)}
              className="relative p-2 text-green-700 hover:text-green-900 transition">
              <Bell size={22} />
              {naoLidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {naoLidas > 9 ? '9+' : naoLidas}
                </span>
              )}
            </button>

            {painelAberto && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-green-800 font-semibold text-sm">Notificacoes</h3>
                  <button onClick={() => setPainelAberto(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <Bell size={32} className="mx-auto mb-2 opacity-30" />
                      Sem notificacoes
                    </div>
                  ) : (
                    notificacoes.map(n => (
                      <div key={n.id_notificacao}
                        onClick={() => !n.lida && marcarLida(n.id_notificacao)}
                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition ${
                          !n.lida ? 'bg-green-50 hover:bg-green-100' : 'bg-white hover:bg-gray-50'
                        }`}>
                        <p className="text-gray-800 text-xs font-semibold mb-0.5">{n.titulo}</p>
                        <p className="text-gray-500 text-xs leading-relaxed">{n.mensagem}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-gray-300 text-xs">
                            {new Date(n.data).toLocaleDateString('pt-AO', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          {!n.lida && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botao sair */}
          <button onClick={logout}
            className="hidden md:flex items-center gap-1 text-red-500 hover:text-red-700 transition text-sm">
            <LogOut size={16} /> Sair
          </button>

          {/* Hamburguer Mobile */}
          <div className="md:hidden flex flex-col cursor-pointer space-y-1"
            onClick={() => setIsOpen(!isOpen)}>
            <span className="w-6 h-0.5 bg-green-700"></span>
            <span className="w-6 h-0.5 bg-green-700"></span>
            <span className="w-6 h-0.5 bg-green-700"></span>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {isOpen && (
        <div className="md:hidden bg-white px-8 py-4 border-t border-gray-200">
          <ul className="flex flex-col gap-4 text-green-700 font-medium">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to}
                  className={({ isActive }) =>
                    isActive ? "font-semibold text-green-900" : "hover:text-green-900 transition"
                  }
                  onClick={() => setIsOpen(false)}>
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button onClick={logout} className="flex items-center gap-1 text-red-500 text-sm">
                <LogOut size={16} /> Sair
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Header;