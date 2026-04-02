/**
 * Arquivo: src/App.jsx
 * Descrição: Componente principal da aplicação React Router.
 * Define todas as rotas públicas e privadas da plataforma EcoTroca.
 * Usa RotaProtegida para proteger acessos com base no tipo de utilizador.
 * Estruturado por grupos: públicas, utilizador comum, coletador, empresa, admin.
 */

import { Routes, Route } from 'react-router-dom' // Importa componentes essenciais do React Router para gerir navegação

// ── Páginas públicas ──────────────────────────────────────────
// Estas páginas não requerem autenticação - acessíveis a todos
import Home               from './pages/home' // Página inicial / landing page
import Login              from './pages/Login' // Formulário de autenticação
import Cadastro           from './Components/Cadastro' // Registo de novos utilizadores
import RecuperacaoDeSenha from './pages/RecuperacaoDeSenha' // Pedido de reset de senha
import RedefinirSenha     from './pages/RedefinirSenha' // Formulário para nova senha
import Footer             from './Components/Footer' // Rodapé (rota rara)
import ConfirmarEmail     from './Components/ConfirmarEmail' // Confirmação de email via token

// ── Utilizador comum ──────────────────────────────────────────
// Componentes para utilizadores normais (não coletor/empresa/admin)
import UserProfile    from './pages/UserProfile' // Página principal do perfil utilizador
import PaginaInicial  from './Components/UserProfile/PaginaInicial' // Dashboard inicial
import Dashboard      from './Components/UserProfile/Dashboard' // Visão geral actividades
import Eventos        from './Components/UserProfile/Eventos' // Lista de eventos
import Noticias       from './Components/UserProfile/Noticias' // Feed de notícias
import Educacao       from './Components/UserProfile/Educacao' // Conteúdo educativo
import Perfil         from './Components/UserProfile/Perfil' // Perfil pessoal e público
import Definicoes     from './Components/UserProfile/Definicoes' // Configurações conta
import Editar         from './Components/UserProfile/Editar' // Edição de dados
import NovoResiduo    from './Components/UserProfile/NovoResiduo' // Criação/editação resíduos

// ── Coletador ─────────────────────────────────────────────────
// Componentes exclusivos para utilizadores tipo 'coletor'
import ColetadorProfile       from './pages/ColetadorProfile' // Página principal coletador
import PaginaInicialColetador from './Components/ColetadorProfile/PaginaInicialColetador.jsx' // Dashboard coletador
import DashboardColetador     from './Components/ColetadorProfile/DashboardColetador' // Stats entregas
import PedidosPendentes       from './Components/ColetadorProfile/PedidosPendentes' // Pedidos abertos
import HistoricoColetas       from './Components/ColetadorProfile/HistoricoColetas' // Histórico
import PerfilColetador        from './Components/ColetadorProfile/PerfilColetador' // Perfil público coletador
import EditarColetador        from './Components/ColetadorProfile/EditarColetador' // Editar dados coletador
import DefinicoesColetador    from './Components/ColetadorProfile/DefinicoesColetador' // Configs coletador
import EventosColetador       from './Components/ColetadorProfile/Eventos' // Eventos para coletadores
import NoticiasColetador      from './Components/ColetadorProfile/Noticias' // Notícias coletador
import EducacaoColetador      from './Components/ColetadorProfile/Educacao' // Educação coletador

// ── Empresa ───────────────────────────────────────────────────
// Componentes para empresas recicladora
import DashboardEmpresa     from './Components/EmpresaProfile/DashboardEmpresa' // Dashboard empresa
import PaginaInicialEmpresa from './Components/EmpresaProfile/PaginaInicialEmpresa' // Inicial empresa
import PerfilEmpresa        from './Components/EmpresaProfile/PerfilEmpresa' // Perfil empresa
import EditarEmpresa        from './Components/EmpresaProfile/EditarEmpresa' // Edição empresa
import EntregasEmpresa      from './Components/EmpresaProfile/EntregasEmpresa' // Gestão entregas
import EventosEmpresa       from './Components/EmpresaProfile/EventosEmpresa' // Eventos empresa
import ColetadoresEmpresa   from './Components/EmpresaProfile/ColetadoresEmpresa' // Lista coletadores
import EducacaoEmpresa      from './Components/EmpresaProfile/EducacaoEmpresa' // Educação empresa
import NoticiasEmpresa      from './Components/EmpresaProfile/NoticiasEmpresa' // Notícias empresa

// ── Feed ──────────────────────────────────────────────────────
import Feed from './Components/Feed/Feed' // Feed principal - posts/utilizadores

// ── Admin ─────────────────────────────────────────────────────
import DashboardAdmin    from './Components/AdminProfile/DashboardAdmin' // Painel admin
import AdminUtilizadores from './Components/AdminProfile/AdminUtilizadores' // Gestão users
import AdminEducacao     from './Components/AdminProfile/AdminEducacao' // Gestão conteúdo
import AdminRelatorios   from './Components/AdminProfile/AdminRelatorios' // Relatórios

// ── Protecção de rotas ────────────────────────────────────────
import RotaProtegida from './Components/RotaProtegida' // Componente wrapper - verifica token e tipo_usuario

/**
 * Componente principal App - define toda a estrutura de rotas da aplicação
 * @returns {JSX.Element} Container com todas as rotas React Router
 */
function App() {
  // Retorna o elemento Routes que contém todas as definições de rotas
  return (
    // Routes é o container principal que mapeia URL -> Componente
    <Routes>

      {/* ── ROTAS PÚBLICAS ───────────────────────────────────── 
           Estas rotas NÃO usam RotaProtegida - acessíveis sem login */}
      <Route path='/'                      element={<Home />} /> {/* Home/landing page */}
      <Route path='/Login'                 element={<Login />} /> {/* Login */}
      <Route path='/Cadastro'              element={<Cadastro />} /> {/* Cadastro */}
      <Route path='/RecuperacaoDeSenha'    element={<RecuperacaoDeSenha />} /> {/* Recuperação senha */}
      <Route path='/RedefinirSenha/:token' element={<RedefinirSenha />} /> {/* Redefinição com token URL */}
      <Route path='/Footer'                element={<Footer />} /> {/* Rodapé (pouco usado) */}
      <Route path='/ConfirmarEmail/:token' element={<ConfirmarEmail />} /> {/* Confirmação email */}

      {/* ── ROTAS PRIVADAS — qualquer utilizador autenticado ─── 
           Envolve componente com <RotaProtegida> que verifica JWT nos localStorage */}
      <Route path='/Feed'          element={<RotaProtegida><Feed /></RotaProtegida>} /> {/* Feed geral */}
      <Route path='/PaginaInicial' element={<RotaProtegida><PaginaInicial /></RotaProtegida>} /> {/* Inicial user */}
      <Route path='/Dashboard'     element={<RotaProtegida><Dashboard /></RotaProtegida>} /> {/* Dashboard user */}
      <Route path='/UserProfile'   element={<RotaProtegida><UserProfile /></RotaProtegida>} /> {/* Perfil completo */}
      <Route path='/Eventos'       element={<RotaProtegida><Eventos /></RotaProtegida>} /> {/* Eventos */}
      <Route path='/Noticias'      element={<RotaProtegida><Noticias /></RotaProtegida>} /> {/* Notícias */}
      <Route path='/Educacao'      element={<RotaProtegida><Educacao /></RotaProtegida>} /> {/* Educação */}
      <Route path='/Perfil'        element={<RotaProtegida><Perfil /></RotaProtegida>} /> {/* Perfil próprio */}
      <Route path='/Definicoes'    element={<RotaProtegida><Definicoes /></RotaProtegida>} /> {/* Definições */}
      <Route path='/Editar'        element={<RotaProtegida><Editar /></RotaProtegida>} /> {/* Editar perfil */}
      <Route path='/NovoResiduo'       element={<RotaProtegida><NovoResiduo /></RotaProtegida>} /> {/* Novo residuo */}
      <Route path='/EditarResiduo/:id' element={<RotaProtegida><NovoResiduo /></RotaProtegida>} /> {/* Editar por ID */}

      {/* ── Perfis públicos — mesmo componente detecta o :id ── 
           RotaProtegida permite ver perfil público mesmo de outros users */}
      <Route path='/Perfil/:id'          element={<RotaProtegida><Perfil /></RotaProtegida>} /> {/* Perfil por ID */}
      <Route path='/PerfilColetador/:id' element={<RotaProtegida><PerfilColetador /></RotaProtegida>} /> {/* Coletador público */}
      <Route path='/PerfilEmpresa/:id'   element={<RotaProtegida><PerfilEmpresa /></RotaProtegida>} /> {/* Empresa pública */}

      {/* ── ROTAS PRIVADAS — coletador ──────────────────────── 
           Passa tipos={["coletor"]} para RotaProtegida validar role específica */}
      <Route path='/ColetadorInicio'     element={<RotaProtegida tipos={["coletor"]}><PaginaInicialColetador /></RotaProtegida>} />
      <Route path='/ColetadorDashboard'  element={<RotaProtegida tipos={["coletor"]}><DashboardColetador /></RotaProtegida>} />
      <Route path='/ColetadorProfile'    element={<RotaProtegida tipos={["coletor"]}><ColetadorProfile /></RotaProtegida>} />
      <Route path='/PedidosPendentes'    element={<RotaProtegida tipos={["coletor"]}><PedidosPendentes /></RotaProtegida>} />
      <Route path='/HistoricoColetas'    element={<RotaProtegida tipos={["coletor"]}><HistoricoColetas /></RotaProtegida>} />
      <Route path='/PerfilColetador'     element={<RotaProtegida tipos={["coletor"]}><PerfilColetador /></RotaProtegida>} />
      <Route path='/EditarColetador'     element={<RotaProtegida tipos={["coletor"]}><EditarColetador /></RotaProtegida>} />
      <Route path='/DefinicoesColetador' element={<RotaProtegida tipos={["coletor"]}><DefinicoesColetador /></RotaProtegida>} />
      <Route path='/ColetadorEventos'    element={<RotaProtegida tipos={["coletor"]}><EventosColetador /></RotaProtegida>} />
      <Route path='/ColetadorNoticias'   element={<RotaProtegida tipos={["coletor"]}><NoticiasColetador /></RotaProtegida>} />
      <Route path='/ColetadorEducacao'   element={<RotaProtegida tipos={["coletor"]}><EducacaoColetador /></RotaProtegida>} />

      {/* ── ROTAS PRIVADAS — empresa ────────────────────────── */}
      <Route path='/DashboardEmpresa'     element={<RotaProtegida tipos={["empresa"]}><DashboardEmpresa /></RotaProtegida>} />
      <Route path='/PaginaInicialEmpresa' element={<RotaProtegida tipos={["empresa"]}><PaginaInicialEmpresa /></RotaProtegida>} />
      <Route path='/PerfilEmpresa'        element={<RotaProtegida tipos={["empresa"]}><PerfilEmpresa /></RotaProtegida>} />
      <Route path='/EditarEmpresa'        element={<RotaProtegida tipos={["empresa"]}><EditarEmpresa /></RotaProtegida>} />
      <Route path='/EntregasEmpresa'      element={<RotaProtegida tipos={["empresa"]}><EntregasEmpresa /></RotaProtegida>} />
      <Route path='/EventosEmpresa'       element={<RotaProtegida tipos={["empresa"]}><EventosEmpresa /></RotaProtegida>} />
      <Route path='/ColetadoresEmpresa'   element={<RotaProtegida tipos={["empresa"]}><ColetadoresEmpresa /></RotaProtegida>} />
      <Route path='/EducacaoEmpresa'      element={<RotaProtegida tipos={["empresa"]}><EducacaoEmpresa /></RotaProtegida>} />
      <Route path='/NoticiasEmpresa'      element={<RotaProtegida tipos={["empresa"]}><NoticiasEmpresa /></RotaProtegida>} />

      {/* ── ROTAS PRIVADAS — admin ──────────────────────────── */}
      <Route path='/AdminDashboard'    element={<RotaProtegida tipos={["admin"]}><DashboardAdmin /></RotaProtegida>} />
      <Route path='/AdminFeed'         element={<RotaProtegida tipos={["admin"]}><Feed /></RotaProtegida>} />
      <Route path='/AdminUtilizadores' element={<RotaProtegida tipos={["admin"]}><AdminUtilizadores /></RotaProtegida>} />
      <Route path='/AdminEducacao'     element={<RotaProtegida tipos={["admin"]}><AdminEducacao /></RotaProtegida>} />
      <Route path='/AdminRelatorios'   element={<RotaProtegida tipos={["admin"]}><AdminRelatorios /></RotaProtegida>} />

    </Routes>
  ) // Fecha return do JSX
} // Fecha função App

// Exporta App como default - usado em main.jsx como <App />
export default App

