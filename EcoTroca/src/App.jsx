// ============================================================
//  App.jsx — Ficheiro principal de rotas da aplicação
//  Guardar em: src/App.jsx
//
//  Aqui defino todas as páginas da aplicação e as suas rotas.
//  Uso o RotaProtegida para garantir que só utilizadores
//  autenticados acedem às páginas privadas.
//  Uso a prop "tipos" para garantir que cada tipo de utilizador
//  só acede às suas próprias páginas.
// ============================================================

import { Routes, Route } from 'react-router-dom'

// ── Páginas públicas — qualquer pessoa pode ver sem login ──
import Home               from './pages/home'
import Login              from './pages/Login'
import Cadastro           from './Components/Cadastro'
import RecuperacaoDeSenha from './pages/RecuperacaoDeSenha'
import RedefinirSenha     from './pages/RedefinirSenha'
import Footer             from './Components/Footer'

// ── Utilizador comum ──
import UserProfile    from './pages/UserProfile'
import PaginaInicial  from './Components/UserProfile/PaginaInicial'
import Dashboard      from './Components/UserProfile/Dashboard'
import Eventos        from './Components/UserProfile/Eventos'
import Noticias       from './Components/UserProfile/Noticias'
import Educacao       from './Components/UserProfile/Educacao'
import Perfil         from './Components/UserProfile/Perfil'
import Definicoes     from './Components/UserProfile/Definicoes'
import Editar         from './Components/UserProfile/Editar'
import NovoResiduo    from './Components/UserProfile/NovoResiduo'

// ── Coletador ──
import ColetadorProfile       from './pages/ColetadorProfile'
import PaginaInicialColetador from './Components/ColetadorProfile/PaginaInicial'
import DashboardColetador     from './Components/ColetadorProfile/DashboardColetador'
import PedidosPendentes       from './Components/ColetadorProfile/PedidosPendentes'
import HistoricoColetas       from './Components/ColetadorProfile/HistoricoColetas'
import PerfilColetador        from './Components/ColetadorProfile/PerfilColetador'
import EditarColetador        from './Components/ColetadorProfile/EditarColetador'
import DefinicoesColetador    from './Components/ColetadorProfile/DefinicoesColetador'
import EventosColetador       from './Components/ColetadorProfile/Eventos'
import NoticiasColetador      from './Components/ColetadorProfile/Noticias'
import EducacaoColetador      from './Components/ColetadorProfile/Educacao'

// ── Empresa ──
import DashboardEmpresa   from './Components/EmpresaProfile/DashboardEmpresa'
import PerfilEmpresa      from './Components/EmpresaProfile/PerfilEmpresa'
import EditarEmpresa      from './Components/EmpresaProfile/EditarEmpresa'
import EntregasEmpresa    from './Components/EmpresaProfile/EntregasEmpresa'
import EventosEmpresa     from './Components/EmpresaProfile/EventosEmpresa'
import ColetadoresEmpresa from './Components/EmpresaProfile/ColetadoresEmpresa'
import EducacaoEmpresa    from './Components/EmpresaProfile/Educacao'

// ── Feed — página inicial partilhada por todos ──
import Feed         from './Components/Feed/Feed'
import PerfilPublico from './Components/Feed/PerfilPublico'

// ── Admin — importo todas as páginas do painel de administração ──
import DashboardAdmin    from './Components/AdminProfile/DashboardAdmin'
import AdminUtilizadores from './Components/AdminProfile/AdminUtilizadores'
import AdminEducacao     from './Components/AdminProfile/AdminEducacao'
import AdminRelatorios  from './Components/AdminProfile/AdminRelatorios'

// ── RotaProtegida — componente que protege as páginas privadas ──
// Se não estiver autenticado → redireciona para /Login
// Se o tipo não corresponder → redireciona para /Login
// Uso: <RotaProtegida tipos={["admin"]}> → só o admin entra
//      <RotaProtegida tipos={["empresa"]}> → só empresas entram
//      <RotaProtegida tipos={["coletor"]}> → só coletadores entram
//      <RotaProtegida> sem tipos → qualquer autenticado entra
import RotaProtegida from './Components/RotaProtegida'

function App() {
  return (
    <Routes>

      {/* ═══════════════════════════════════════════════
          ROTAS PÚBLICAS
          Estas páginas não precisam de login
      ═══════════════════════════════════════════════ */}
      <Route path='/'                         element={<Home />} />
      <Route path='/Login'                    element={<Login />} />
      <Route path='/Cadastro'                 element={<Cadastro />} />
      <Route path='/RecuperacaoDeSenha'       element={<RecuperacaoDeSenha />} />
      <Route path='/RedefinirSenha/:token123' element={<RedefinirSenha />} />
      <Route path='/Footer'                   element={<Footer />} />

      {/* ═══════════════════════════════════════════════
          ROTAS PRIVADAS — utilizador comum
          Sem tipos → qualquer utilizador autenticado entra
          O utilizador comum não tem tipo definido, por isso
          não uso tipos aqui para não bloquear o acesso
      ═══════════════════════════════════════════════ */}
      <Route path='/Feed'          element={<RotaProtegida><Feed /></RotaProtegida>} />
      <Route path='/Perfil/:tipo/:id' element={<RotaProtegida><PerfilPublico /></RotaProtegida>} />
      <Route path='/PaginaInicial' element={<RotaProtegida><PaginaInicial /></RotaProtegida>} />
      <Route path='/Dashboard'     element={<RotaProtegida><Dashboard /></RotaProtegida>} />
      <Route path='/UserProfile'   element={<RotaProtegida><UserProfile /></RotaProtegida>} />
      <Route path='/Eventos'       element={<RotaProtegida><Eventos /></RotaProtegida>} />
      <Route path='/Noticias'      element={<RotaProtegida><Noticias /></RotaProtegida>} />
      <Route path='/Educacao'      element={<RotaProtegida><Educacao /></RotaProtegida>} />
      <Route path='/Perfil'        element={<RotaProtegida><Perfil /></RotaProtegida>} />
      <Route path='/Definicoes'    element={<RotaProtegida><Definicoes /></RotaProtegida>} />
      <Route path='/Editar'        element={<RotaProtegida><Editar /></RotaProtegida>} />
      <Route path='/NovoResiduo'   element={<RotaProtegida><NovoResiduo /></RotaProtegida>} />

      {/* ═══════════════════════════════════════════════
          ROTAS PRIVADAS — coletador
          tipos={["coletor"]} → só coletadores entram
          Se um utilizador comum tentar aceder a /ColetadorDashboard
          é redireccionado para /Login automaticamente
      ═══════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════
          ROTAS PRIVADAS — empresa
          tipos={["empresa"]} → só empresas entram
      ═══════════════════════════════════════════════ */}
      <Route path='/DashboardEmpresa'   element={<RotaProtegida tipos={["empresa"]}><DashboardEmpresa /></RotaProtegida>} />
      <Route path='/PerfilEmpresa'      element={<RotaProtegida tipos={["empresa"]}><PerfilEmpresa /></RotaProtegida>} />
      <Route path='/EditarEmpresa'      element={<RotaProtegida tipos={["empresa"]}><EditarEmpresa /></RotaProtegida>} />
      <Route path='/EntregasEmpresa'    element={<RotaProtegida tipos={["empresa"]}><EntregasEmpresa /></RotaProtegida>} />
      <Route path='/EventosEmpresa'     element={<RotaProtegida tipos={["empresa"]}><EventosEmpresa /></RotaProtegida>} />
      <Route path='/ColetadoresEmpresa' element={<RotaProtegida tipos={["empresa"]}><ColetadoresEmpresa /></RotaProtegida>} />
      <Route path='/EmpresaEducacao'    element={<RotaProtegida tipos={["empresa"]}><EducacaoEmpresa /></RotaProtegida>} />

      {/* ═══════════════════════════════════════════════
          ROTAS PRIVADAS — admin
          tipos={["admin"]} → só o admin entra
          Qualquer outro tipo de utilizador que tente aceder
          a uma rota de admin é redireccionado para /Login
      ═══════════════════════════════════════════════ */}
      <Route path='/AdminDashboard'    element={<RotaProtegida tipos={["admin"]}><DashboardAdmin /></RotaProtegida>} />
      <Route path='/AdminFeed'         element={<RotaProtegida tipos={["admin"]}><Feed /></RotaProtegida>} />
      <Route path='/AdminUtilizadores' element={<RotaProtegida tipos={["admin"]}><AdminUtilizadores /></RotaProtegida>} />
      <Route path='/AdminEducacao'     element={<RotaProtegida tipos={["admin"]}><AdminEducacao /></RotaProtegida>} />
      <Route path='/AdminRelatorios'  element={<RotaProtegida tipos={["admin"]}><AdminRelatorios /></RotaProtegida>} />

    </Routes>
  )
}

export default App