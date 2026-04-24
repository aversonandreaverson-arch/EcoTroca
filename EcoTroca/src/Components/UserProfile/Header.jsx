import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { Bell, X, Check, XCircle, CheckCircle, AlertCircle } from "lucide-react";
import { getNotificacoes, marcarNotificacaoLida, aceitarProposta, recusarProposta } from "../../api.js";

const links = [
  { label: "Pagina Inicial", to: "/PaginaInicial" },
  { label: "Dashboard",      to: "/Dashboard"     },
  { label: "Rankings",       to: "/Rankings"      },
  { label: "Eventos",        to: "/Eventos"        },
  { label: "Noticias",       to: "/Noticias"       },
  { label: "Educacao",       to: "/Educacao"       },
  { label: "Perfil",         to: "/Perfil"         },
];

const Header = () => {
  const [isOpen,       setIsOpen]       = useState(false);
  const [painelAberto, setPainelAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [processando,  setProcessando]  = useState(null);

  // Feedback visual apos aceitar ou recusar — { tipo: 'aceite'|'recusado', mensagem }
  const [feedback, setFeedback] = useState(null);

  const painelRef = useRef(null);

  useEffect(() => { carregarNotificacoes(); }, []);

  useEffect(() => {
    const fechar = (e) => {
      if (painelRef.current && !painelRef.current.contains(e.target))
        setPainelAberto(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  // Limpa o feedback automaticamente apos 4 segundos
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const carregarNotificacoes = async () => {
    try {
      const dados = await getNotificacoes();
      setNotificacoes(dados);
    } catch (err) {
      console.error('Erro ao carregar notificacoes:', err);
    }
  };

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

  // Utilizador aceita proposta da empresa
  // Backend cria entrega + notifica empresa
  const handleAceitar = async (e, notif) => {
    e.stopPropagation();
    try {
      setProcessando(notif.id_notificacao);
      const resultado = await aceitarProposta(notif.id_notificacao);

      // Actualiza notificacao localmente — remove botoes
      setNotificacoes(prev =>
        prev.map(n => n.id_notificacao === notif.id_notificacao
          ? { ...n, lida: true, tipo: 'geral' }
          : n
        )
      );

      // Fecha o painel e mostra feedback de sucesso
      setPainelAberto(false);
      setFeedback({
        tipo: 'aceite',
        mensagem: resultado?.feedback || 'Troca aceite com sucesso! A empresa sera notificada e ira definir a data de recolha.',
      });

    } catch (err) {
      console.error('Erro ao aceitar proposta:', err);
      setFeedback({ tipo: 'erro', mensagem: err.message || 'Erro ao aceitar a proposta.' });
    } finally {
      setProcessando(null);
    }
  };

  // Utilizador recusa proposta da empresa
  const handleRecusar = async (e, notif) => {
    e.stopPropagation();
    try {
      setProcessando(notif.id_notificacao);
      const resultado = await recusarProposta(notif.id_notificacao);

      // Actualiza notificacao localmente — remove botoes
      setNotificacoes(prev =>
        prev.map(n => n.id_notificacao === notif.id_notificacao
          ? { ...n, lida: true, tipo: 'geral' }
          : n
        )
      );

      // Fecha o painel e mostra feedback de recusa
      setPainelAberto(false);
      setFeedback({
        tipo: 'recusado',
        mensagem: resultado?.feedback || 'Proposta recusada. O teu residuo continua disponivel no feed.',
      });

    } catch (err) {
      console.error('Erro ao recusar proposta:', err);
      setFeedback({ tipo: 'erro', mensagem: err.message || 'Erro ao recusar a proposta.' });
    } finally {
      setProcessando(null);
    }
  };

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">

      {/* Feedback visual — aparece no topo durante 4 segundos */}
      {feedback && (
        <div className={`w-full px-4 py-3 flex items-center justify-between text-sm font-medium transition-all ${
          feedback.tipo === 'aceite'   ? 'bg-green-600 text-white' :
          feedback.tipo === 'recusado' ? 'bg-gray-700 text-white'  :
                                         'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.tipo === 'aceite'   && <CheckCircle size={16} />}
            {feedback.tipo === 'recusado' && <XCircle     size={16} />}
            {feedback.tipo === 'erro'     && <AlertCircle size={16} />}
            <span>{feedback.mensagem}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        <h1 className="text-xl font-bold text-green-700">Ecotroca-Angola</h1>

        {/* Links desktop */}
        <ul className="hidden md:flex items-center gap-8 text-green-700 font-medium">
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
                        onClick={() => !n.lida && n.tipo !== 'proposta' && marcarLida(n.id_notificacao)}
                        className={`px-4 py-3 border-b border-gray-50 transition ${
                          !n.lida ? 'bg-green-50' : 'bg-white'
                        } ${n.tipo !== 'proposta' ? 'cursor-pointer hover:bg-gray-50' : ''}`}>

                        <p className="text-gray-800 text-xs font-semibold mb-0.5">{n.titulo}</p>
                        <p className="text-gray-500 text-xs leading-relaxed">{n.mensagem}</p>

                        {/* Botoes aceitar/recusar — so para propostas nao lidas */}
                        {n.tipo === 'proposta' && !n.lida && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={(e) => handleAceitar(e, n)}
                              disabled={processando === n.id_notificacao}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-xl transition">
                              <Check size={13} />
                              {processando === n.id_notificacao ? 'A processar...' : 'Aceitar Troca'}
                            </button>
                            <button
                              onClick={(e) => handleRecusar(e, n)}
                              disabled={processando === n.id_notificacao}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 text-xs font-semibold py-2 rounded-xl border border-red-200 transition">
                              <XCircle size={13} />
                              {processando === n.id_notificacao ? 'A processar...' : 'Recusar'}
                            </button>
                          </div>
                        )}

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

          {/* Hamburguer mobile */}
          <div className="md:hidden flex flex-col cursor-pointer space-y-1" onClick={() => setIsOpen(!isOpen)}>
            <span className="w-6 h-0.5 bg-green-700"></span>
            <span className="w-6 h-0.5 bg-green-700"></span>
            <span className="w-6 h-0.5 bg-green-700"></span>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
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
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Header;