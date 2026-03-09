
import { useState, useEffect, useRef } from "react";                          // Hooks do React
import { NavLink, useNavigate } from "react-router-dom";                      // Navegação entre páginas
import { Bell, X, Check, XCircle } from "lucide-react";                       // Ícones do sino e botões
import { logout, getNotificacoes, marcarNotificacaoLida, aceitarProposta, recusarProposta } from "../../api.js"; // Funções da API

// Links do menu da empresa — diferentes do utilizador comum
const links = [
  { label: "Início",            to: "/DashboardEmpresa"      }, // Dashboard principal da empresa
  { label: "Fed",              to: "/PaginaInicialEmpresa"  }, // Feed de publicações da empresa
  { label: "Entregas",          to: "/EntregasEmpresa"       }, // Gestão de entregas
  { label: "Eventos",           to: "/EventosEmpresa"        }, // Eventos criados pela empresa
  { label: "Coletadores",       to: "/ColetadoresEmpresa"    }, // Coletadores associados
  { label: "Perfil",            to: "/PerfilEmpresa"         }, // Perfil da empresa
];

const EmpresaHeader = () => {
  const navigate = useNavigate();                                              // Hook para navegar após logout

  const [isOpen,       setIsOpen]       = useState(false);                   // Controla abertura do menu mobile
  const [painelAberto, setPainelAberto] = useState(false);                   // Controla abertura do painel de notificações
  const [notificacoes, setNotificacoes] = useState([]);                      // Lista de notificações da empresa
  const [processando,  setProcessando]  = useState(null);                    // ID da notificação a ser processada (aceitar/recusar)

  const painelRef = useRef(null);                                             // Referência ao painel para fechar ao clicar fora

  // Carrego as notificações ao montar o header
  useEffect(() => {
    carregarNotificacoes();                                                    // Chama a API ao abrir a página
  }, []);

  // Fecho o painel ao clicar fora dele
  useEffect(() => {
    const handleClickFora = (e) => {
      if (painelRef.current && !painelRef.current.contains(e.target)) {      // Verifica se o clique foi fora do painel
        setPainelAberto(false);                                                // Fecha o painel
      }
    };
    document.addEventListener('mousedown', handleClickFora);                  // Adiciona o listener ao documento
    return () => document.removeEventListener('mousedown', handleClickFora);  // Remove o listener ao desmontar
  }, []);

  // Vai buscar as notificações ao backend via GET /api/notificacoes
  const carregarNotificacoes = async () => {
    try {
      const dados = await getNotificacoes();                                   // Chama GET /api/notificacoes
      setNotificacoes(dados);                                                  // Guarda as notificações no estado
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);                    // Regista o erro no console
    }
  };

  // Marca uma notificação normal como lida ao clicar nela
  const marcarLida = async (id) => {
    try {
      await marcarNotificacaoLida(id);                                         // Chama PATCH /api/notificacoes/:id/ler
      setNotificacoes(prev =>                                                  // Actualiza localmente sem recarregar
        prev.map(n => n.id_notificacao === id ? { ...n, lida: true } : n)     // Marca só a notificação clicada
      );
    } catch (err) {
      console.error('Erro ao marcar notificação:', err);                       // Regista o erro no console
    }
  };

  // Empresa aceita uma proposta recebida
  // Publica a publicação como 'fechada' + dono do resíduo é notificado
  const handleAceitar = async (e, notif) => {
    e.stopPropagation();                                                        // Evita que o clique feche o painel
    try {
      setProcessando(notif.id_notificacao);                                    // Mostra estado de carregamento no botão
      await aceitarProposta(notif.id_notificacao);                             // Chama POST /api/notificacoes/:id/aceitar
      setNotificacoes(prev =>                                                  // Actualiza localmente — remove os botões
        prev.map(n => n.id_notificacao === notif.id_notificacao
          ? { ...n, lida: true, tipo: 'geral' }                               // Muda tipo para 'geral' — esconde botões
          : n
        )
      );
    } catch (err) {
      console.error('Erro ao aceitar proposta:', err);                         // Regista o erro no console
      alert(err.message);                                                       // Mostra o erro ao utilizador
    } finally {
      setProcessando(null);                                                     // Remove o estado de carregamento
    }
  };

  // Empresa recusa uma proposta recebida
  // Publicação volta para 'disponivel' + dono do resíduo é notificado
  const handleRecusar = async (e, notif) => {
    e.stopPropagation();                                                        // Evita que o clique feche o painel
    try {
      setProcessando(notif.id_notificacao);                                    // Mostra estado de carregamento no botão
      await recusarProposta(notif.id_notificacao);                             // Chama POST /api/notificacoes/:id/recusar
      setNotificacoes(prev =>                                                  // Actualiza localmente — remove os botões
        prev.map(n => n.id_notificacao === notif.id_notificacao
          ? { ...n, lida: true, tipo: 'geral' }                               // Muda tipo para 'geral' — esconde botões
          : n
        )
      );
    } catch (err) {
      console.error('Erro ao recusar proposta:', err);                         // Regista o erro no console
      alert(err.message);                                                       // Mostra o erro ao utilizador
    } finally {
      setProcessando(null);                                                     // Remove o estado de carregamento
    }
  };

  // Faz logout e redireciona para o login
  const handleLogout = () => {
    logout();                                                                   // Remove token e dados do localStorage
    navigate('/Login');                                                         // Redireciona para a página de login
  };

  // Conta quantas notificações ainda não foram lidas — aparece no badge do sino
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    // Navbar fixa no topo com efeito de desfoque
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">

      {/* Container principal da navbar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        {/* Logo da empresa */}
        <h1 className="text-xl font-bold text-green-700">
          🏭 EcoTroca — Empresa
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
                    ? "text-green-900 font-semibold border-b-2 border-green-700 pb-1" // Estilo activo
                    : "hover:text-green-900 transition"                                // Estilo normal
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Lado direito: sino + logout + hamburguer */}
        <div className="flex items-center gap-4">

          {/* ── Sino de notificações ── */}
          <div className="relative" ref={painelRef}>

            {/* Botão do sino — mostra o badge com o número de não lidas */}
            <button
              onClick={() => setPainelAberto(!painelAberto)}                   // Abre/fecha o painel ao clicar
              className="relative p-2 text-green-700 hover:text-green-900 transition"
            >
              <Bell size={22} />
              {/* Badge vermelho — só aparece se houver notificações não lidas */}
              {naoLidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {naoLidas > 9 ? '9+' : naoLidas}                            {/* Máximo de 9+ para não transbordar */}
                </span>
              )}
            </button>

            {/* Painel de notificações — abre ao clicar no sino */}
            {painelAberto && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">

                {/* Cabeçalho do painel */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-green-800 font-semibold text-sm">Notificações</h3>
                  <button onClick={() => setPainelAberto(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />                                             {/* Botão fechar painel */}
                  </button>
                </div>

                {/* Lista de notificações com scroll */}
                <div className="max-h-96 overflow-y-auto">
                  {notificacoes.length === 0 ? (

                    // Estado vazio — sem notificações
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <Bell size={32} className="mx-auto mb-2 opacity-30" />  {/* Ícone decorativo */}
                      Sem notificações
                    </div>

                  ) : (
                    notificacoes.map(n => (
                      <div
                        key={n.id_notificacao}
                        onClick={() => !n.lida && n.tipo !== 'proposta' && marcarLida(n.id_notificacao)} // Marca como lida ao clicar (só notificações normais)
                        className={`px-4 py-3 border-b border-gray-50 transition ${
                          !n.lida ? 'bg-green-50' : 'bg-white'                // Fundo verde para não lidas
                        } ${n.tipo !== 'proposta' ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      >
                        {/* Título da notificação */}
                        <p className="text-gray-800 text-xs font-semibold mb-0.5">{n.titulo}</p>

                        {/* Mensagem da notificação */}
                        <p className="text-gray-500 text-xs leading-relaxed">{n.mensagem}</p>

                        {/* Botões aceitar/recusar — só para notificações do tipo 'proposta' */}
                        {n.tipo === 'proposta' && (
                          <div className="flex gap-2 mt-2">

                            {/* Botão Aceitar — muda publicação para 'fechada' */}
                            <button
                              onClick={(e) => handleAceitar(e, n)}
                              disabled={processando === n.id_notificacao}      // Desactiva durante o processamento
                              className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded-lg transition"
                            >
                              <Check size={12} />
                              {processando === n.id_notificacao ? 'A processar...' : 'Aceitar'}
                            </button>

                            {/* Botão Recusar — publicação volta para 'disponivel' */}
                            <button
                              onClick={(e) => handleRecusar(e, n)}
                              disabled={processando === n.id_notificacao}      // Desactiva durante o processamento
                              className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded-lg transition"
                            >
                              <XCircle size={12} />
                              {processando === n.id_notificacao ? 'A processar...' : 'Recusar'}
                            </button>

                          </div>
                        )}

                        {/* Data e ponto indicador de não lida */}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-300 text-xs">
                            {new Date(n.data).toLocaleDateString('pt-AO', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          {/* Ponto verde — indica notificação não lida */}
                          {!n.lida && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botão logout — visível só no desktop */}
          <button
            onClick={handleLogout}
            className="hidden md:block bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Sair
          </button>

          {/* Botão hamburguer — visível só no mobile */}
          <div
            className="md:hidden flex flex-col cursor-pointer space-y-1"
            onClick={() => setIsOpen(!isOpen)}                                  // Abre/fecha o menu mobile
          >
            <span className="w-6 h-0.5 bg-green-700"></span>                  {/* Linha 1 do hamburguer */}
            <span className="w-6 h-0.5 bg-green-700"></span>                  {/* Linha 2 do hamburguer */}
            <span className="w-6 h-0.5 bg-green-700"></span>                  {/* Linha 3 do hamburguer */}
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
                    isActive ? "font-semibold text-green-900" : "hover:text-green-900 transition"
                  }
                  onClick={() => setIsOpen(false)}                              // Fecha o menu ao clicar num link
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            {/* Logout no menu mobile */}
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

export default EmpresaHeader;