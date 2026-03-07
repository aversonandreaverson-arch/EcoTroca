
import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { getNotificacoes, marcarNotificacaoLida } from "../../api.js";

// Links de navegação — adicionados aqui para não repetir código
const links = [
  { label: "Página Inicial", to: "/PaginaInicial" },
  { label: "Dashboard",      to: "/Dashboard"     },
  { label: "Eventos",        to: "/Eventos"        },
  { label: "Notícias",       to: "/Noticias"       },
  { label: "Educação",       to: "/Educacao"       },
  { label: "Perfil",         to: "/Perfil"         },
];

const Header = () => {
  // Controla abertura do menu mobile
  const [isOpen, setIsOpen] = useState(false);

  // Controla abertura do painel de notificações
  const [painelAberto, setPainelAberto] = useState(false);

  // Lista de notificações do utilizador autenticado
  const [notificacoes, setNotificacoes] = useState([]);

  // Referência ao painel para fechar ao clicar fora
  const painelRef = useRef(null);

  // Carrego as notificações ao montar o Header
  useEffect(() => {
    carregarNotificacoes();
  }, []);

  // Fecho o painel ao clicar fora dele
  useEffect(() => {
    const handleClickFora = (e) => {
      if (painelRef.current && !painelRef.current.contains(e.target)) {
        setPainelAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  // Vai buscar as notificações ao backend via GET /api/notificacoes
  const carregarNotificacoes = async () => {
    try {
      const dados = await getNotificacoes();
      setNotificacoes(dados);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  };

  // Marca uma notificação como lida e actualiza a lista
  const marcarLida = async (id) => {
    try {
      await marcarNotificacaoLida(id); // PATCH /api/notificacoes/:id/ler
      // Actualizo localmente sem precisar de recarregar tudo
      setNotificacoes(prev =>
        prev.map(n => n.id_notificacao === id ? { ...n, lida: true } : n)
      );
    } catch (err) {
      console.error('Erro ao marcar notificação:', err);
    }
  };

  // Conto quantas notificações ainda não foram lidas — aparece no badge do sino
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    // Navbar fixa no topo com efeito de desfoque
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">

      {/* Container principal da navbar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        {/* Logo / Nome do sistema */}
        <h1 className="text-xl font-bold text-green-700">
          Ecotroca-Angola
        </h1>

        {/* Links de navegação — só visíveis no desktop */}
        <ul className="hidden md:flex items-center gap-8 text-green-700 font-medium">
          {links.map((link) => (
            <li key={link.to}>
              {/* NavLink muda o estilo automaticamente quando a rota está activa */}
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  isActive
                    ? "text-green-900 font-semibold border-b-2 border-green-700 pb-1"
                    : "hover:text-green-900 transition"
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Lado direito: sino de notificações + hamburguer mobile */}
        <div className="flex items-center gap-4">

          {/* ── Sino de notificações ── */}
          <div className="relative" ref={painelRef}>

            {/* Botão do sino — mostra o badge com o número de não lidas */}
            <button
              onClick={() => setPainelAberto(!painelAberto)}
              className="relative p-2 text-green-700 hover:text-green-900 transition"
            >
              <Bell size={22} />
              {/* Badge vermelho com contador — só aparece se houver não lidas */}
              {naoLidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {naoLidas > 9 ? '9+' : naoLidas}
                </span>
              )}
            </button>

            {/* Painel de notificações — abre ao clicar no sino */}
            {painelAberto && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">

                {/* Cabeçalho do painel */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-green-800 font-semibold text-sm">Notificações</h3>
                  <button
                    onClick={() => setPainelAberto(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Lista de notificações */}
                <div className="max-h-96 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    // Estado vazio — sem notificações
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <Bell size={32} className="mx-auto mb-2 opacity-30" />
                      Sem notificações
                    </div>
                  ) : (
                    notificacoes.map(n => (
                      <div
                        key={n.id_notificacao}
                        onClick={() => !n.lida && marcarLida(n.id_notificacao)}
                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${
                          // Notificações não lidas têm fundo ligeiramente verde
                          !n.lida ? 'bg-green-50' : 'bg-white'
                        }`}
                      >
                        {/* Título da notificação */}
                        <p className="text-gray-800 text-xs font-semibold mb-0.5">{n.titulo}</p>
                        {/* Mensagem da notificação */}
                        <p className="text-gray-500 text-xs leading-relaxed">{n.mensagem}</p>
                        {/* Data e indicador de não lida */}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-300 text-xs">
                            {new Date(n.data).toLocaleDateString('pt-AO', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          {/* Ponto verde indica notificação não lida */}
                          {!n.lida && (
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Botão hamburguer — só visível no mobile */}
          <div
            className="md:hidden flex flex-col cursor-pointer space-y-1"
            onClick={() => setIsOpen(!isOpen)}
          >
            {/* Três linhas do hamburguer */}
            <span className="w-6 h-0.5 bg-green-700"></span>
            <span className="w-6 h-0.5 bg-green-700"></span>
            <span className="w-6 h-0.5 bg-green-700"></span>
          </div>

        </div>
      </div>

      {/* Menu mobile — aparece quando o hamburguer é clicado */}
      {isOpen && (
        <div className="md:hidden bg-white px-8 py-4 border-t border-gray-200">
          <ul className="flex flex-col gap-4 text-green-700 font-medium">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive
                      ? "font-semibold text-green-900"
                      : "hover:text-green-900 transition"
                  }
                  onClick={() => setIsOpen(false)} // Fecha o menu ao navegar
                >
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