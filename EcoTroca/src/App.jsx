import { Routes, Route } from 'react-router-dom'

// ── Páginas públicas ──────────────────────────────────────────
import Home               from './pages/home'
import Login              from './pages/Login'
import Cadastro           from './Components/Cadastro'
import RecuperacaoDeSenha from './pages/RecuperacaoDeSenha'
import RedefinirSenha     from './pages/RedefinirSenha'
import Footer             from './Components/Footer'
import ConfirmarEmail     from './Components/ConfirmarEmail'

// ── Utilizador comum ──────────────────────────────────────────
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

// ── Coletador ─────────────────────────────────────────────────
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

// ── Empresa ───────────────────────────────────────────────────
import DashboardEmpresa     from './Components/EmpresaProfile/DashboardEmpresa'
import PaginaInicialEmpresa from './Components/EmpresaProfile/PaginaInicialEmpresa'
import PerfilEmpresa        from './Components/EmpresaProfile/PerfilEmpresa'
import EditarEmpresa        from './Components/EmpresaProfile/EditarEmpresa'
import EntregasEmpresa      from './Components/EmpresaProfile/EntregasEmpresa'
import EventosEmpresa       from './Components/EmpresaProfile/EventosEmpresa'
import ColetadoresEmpresa   from './Components/EmpresaProfile/ColetadoresEmpresa'
import EducacaoEmpresa      from './Components/EmpresaProfile/EducacaoEmpresa'
import NoticiasEmpresa      from './Components/EmpresaProfile/NoticiasEmpresa'

// ── Feed ──────────────────────────────────────────────────────
import Feed from './Components/Feed/Feed'

// ── Admin ─────────────────────────────────────────────────────
import DashboardAdmin    from './Components/AdminProfile/DashboardAdmin'
import AdminUtilizadores from './Components/AdminProfile/AdminUtilizadores'
import AdminEducacao     from './Components/AdminProfile/AdminEducacao'
import AdminRelatorios   from './Components/AdminProfile/AdminRelatorios'

// ── Protecção de rotas ────────────────────────────────────────
import RotaProtegida from './Components/RotaProtegida'

function App() {
  return (
    <Routes>

      {/* ── ROTAS PÚBLICAS ───────────────────────────────────── */}
      <Route path='/'                      element={<Home />} />
      <Route path='/Login'                 element={<Login />} />
      <Route path='/Cadastro'              element={<Cadastro />} />
      <Route path='/RecuperacaoDeSenha'    element={<RecuperacaoDeSenha />} />
      <Route path='/RedefinirSenha/:token' element={<RedefinirSenha />} />
      <Route path='/Footer'                element={<Footer />} />
      <Route path='/ConfirmarEmail/:token' element={<ConfirmarEmail />} />

      {/* ── ROTAS PRIVADAS — qualquer utilizador autenticado ─── */}
      <Route path='/Feed'          element={<RotaProtegida><Feed /></RotaProtegida>} />
      <Route path='/PaginaInicial' element={<RotaProtegida><PaginaInicial /></RotaProtegida>} />
      <Route path='/Dashboard'     element={<RotaProtegida><Dashboard /></RotaProtegida>} />
      <Route path='/UserProfile'   element={<RotaProtegida><UserProfile /></RotaProtegida>} />
      <Route path='/Eventos'       element={<RotaProtegida><Eventos /></RotaProtegida>} />
      <Route path='/Noticias'      element={<RotaProtegida><Noticias /></RotaProtegida>} />
      <Route path='/Educacao'      element={<RotaProtegida><Educacao /></RotaProtegida>} />
      <Route path='/Perfil'        element={<RotaProtegida><Perfil /></RotaProtegida>} />
      <Route path='/Definicoes'    element={<RotaProtegida><Definicoes /></RotaProtegida>} />
      <Route path='/Editar'        element={<RotaProtegida><Editar /></RotaProtegida>} />
      <Route path='/NovoResiduo'       element={<RotaProtegida><NovoResiduo /></RotaProtegida>} />
      <Route path='/EditarResiduo/:id' element={<RotaProtegida><NovoResiduo /></RotaProtegida>} />

      {/* ── Perfis públicos — mesmo componente detecta o :id ── */}
      <Route path='/Perfil/:id'          element={<RotaProtegida><Perfil /></RotaProtegida>} />
      <Route path='/PerfilColetador/:id' element={<RotaProtegida><PerfilColetador /></RotaProtegida>} />
      <Route path='/PerfilEmpresa/:id'   element={<RotaProtegida><PerfilEmpresa /></RotaProtegida>} />

      {/* ── ROTAS PRIVADAS — coletador ──────────────────────── */}
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
  )
}

export default App