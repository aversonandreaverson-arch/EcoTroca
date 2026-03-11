import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, X, Check, XCircle } from 'lucide-react';
import { logout, getNotificacoes, marcarNotificacaoLida, aceitarProposta, recusarProposta } from '../../api.js';

const links = [
  { label: 'Dashboard',      to: '/DashboardEmpresa'      },
  { label: 'Página Inicial', to: '/PaginaInicialEmpresa'  },
  { label: 'Entregas',       to: '/EntregasEmpresa'       },
  { label: 'Eventos',        to: '/EventosEmpresa'        },
  { label: 'Educação',       to: '/EducacaoEmpresa'       },
  { label: 'Notícias',       to: '/NoticiasEmpresa'       },
  { label: 'Coletadores',    to: '/ColetadoresEmpresa'    },
  { label: 'Perfil',         to: '/PerfilEmpresa'         },
];

const HeaderEmpresa = () => {
  const navigate = useNavigate();

  const [isOpen,       setIsOpen]       = useState(false);
  const [painelAberto, setPainelAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [processando,  setProcessando]  = useState(null);

  const painelRef = useRef(null);

  useEffect(() => { carregarNotificacoes(); }, []);

  useEffect(() => {
    const handleClickFora = (e) => {
      if (painelRef.current && !painelRef.current.contains(e.target))
        setPainelAberto(false);
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const carregarNotificacoes = async () => {
    try {
      const dados = await getNotificacoes();
      setNotificacoes(dados);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  };

  const marcarLida = async (id) => {
    try {
      await marcarNotificacaoLida(id);
      setNotificacoes(prev =>
        prev.map(n => n.id_notificacao === id ? { ...n, lida: true } : n)
      );
    } catch (err) {
      console.error('Erro ao marcar notificação:', err);
    }
  };

  const handleAceitar = async (e, notif) => {
    e.stopPropagation();
    try {
      setProcessando(notif.id_notificacao);
      await aceitarProposta(notif.id_notificacao);
      setNotificacoes(prev =>
        prev.map(n => n.id_notificacao === notif.id_notificacao
          ? { ...n, lida: true, tipo: 'geral' } : n)
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessando(null);
    }
  };

  const handleRecusar = async (e, notif) => {
    e.stopPropagation();
    try {
      setProcessando(notif.id_notificacao);
      await recusarProposta(notif.id_notificacao);
      setNotificacoes(prev =>
        prev.map(n => n.id_notificacao === notif.id_notificacao
          ? { ...n, lida: true, tipo: 'geral' } : n)
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessando(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/Login');
  };

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        <h1 className="text-xl font-bold text-green-700">🏭 EcoTroca — Empresa</h1>

        <ul className="hidden md:flex items-center gap-6 text-green-700 font-medium text-sm">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  isActive
                    ? 'text-green-900 font-semibold border-b-2 border-green-700 pb-1'
                    : 'hover:text-green-900 transition'
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">

          <div className="relative" ref={painelRef}>
            <button
              onClick={() => setPainelAberto(!painelAberto)}
              className="relative p-2 text-green-700 hover:text-green-900 transition"
            >
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
                  <h3 className="text-green-800 font-semibold text-sm">Notificações</h3>
                  <button onClick={() => setPainelAberto(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <Bell size={32} className="mx-auto mb-2 opacity-30" />
                      Sem notificações
                    </div>
                  ) : (
                    notificacoes.map(n => (
                      <div
                        key={n.id_notificacao}
                        onClick={() => !n.lida && n.tipo !== 'proposta' && marcarLida(n.id_notificacao)}
                        className={`px-4 py-3 border-b border-gray-50 transition ${
                          !n.lida ? 'bg-green-50' : 'bg-white'
                        } ${n.tipo !== 'proposta' ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      >
                        <p className="text-gray-800 text-xs font-semibold mb-0.5">{n.titulo}</p>
                        <p className="text-gray-500 text-xs leading-relaxed">{n.mensagem}</p>
                        {n.tipo === 'proposta' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => handleAceitar(e, n)}
                              disabled={processando === n.id_notificacao}
                              className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded-lg transition"
                            >
                              <Check size={12} />
                              {processando === n.id_notificacao ? 'A processar...' : 'Aceitar'}
                            </button>
                            <button
                              onClick={(e) => handleRecusar(e, n)}
                              disabled={processando === n.id_notificacao}
                              className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded-lg transition"
                            >
                              <XCircle size={12} />
                              {processando === n.id_notificacao ? 'A processar...' : 'Recusar'}
                            </button>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1">
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

          <button
            onClick={handleLogout}
            className="hidden md:block bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Sair
          </button>

          <div
            className="md:hidden flex flex-col cursor-pointer space-y-1"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="w-6 h-0.5 bg-green-700"></span>
            <span className="w-6 h-0.5 bg-green-700"></span>
            <span className="w-6 h-0.5 bg-green-700"></span>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white px-8 py-4 border-t border-gray-200">
          <ul className="flex flex-col gap-4 text-green-700 font-medium">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive ? 'font-semibold text-green-900' : 'hover:text-green-900 transition'
                  }
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button onClick={handleLogout} className="text-red-600 font-medium hover:text-red-800 transition">
                Sair
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default HeaderEmpresa;