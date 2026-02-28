import { Routes, Route } from 'react-router-dom'

// ── Páginas públicas ──
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

// ── Rota protegida ──
import RotaProtegida from './Components/RotaProtegida'

function App() {
  return (
    <Routes>

      {/* ═══════════════════════════════════════════════
          ROTAS PÚBLICAS
      ═══════════════════════════════════════════════ */}
      <Route path='/'                         element={<Home />} />
      <Route path='/Login'                    element={<Login />} />
      <Route path='/Cadastro'                 element={<Cadastro />} />
      <Route path='/RecuperacaoDeSenha'       element={<RecuperacaoDeSenha />} />
      <Route path='/RedefinirSenha/:token123' element={<RedefinirSenha />} />
      <Route path='/Footer'                   element={<Footer />} />

      {/* ═══════════════════════════════════════════════
          ROTAS PRIVADAS — utilizador comum
      ═══════════════════════════════════════════════ */}
      <Route path='/PaginaInicial'    element={<RotaProtegida><PaginaInicial /></RotaProtegida>} />
      <Route path='/Dashboard'        element={<RotaProtegida><Dashboard /></RotaProtegida>} />
      <Route path='/UserProfile'      element={<RotaProtegida><UserProfile /></RotaProtegida>} />
      <Route path='/Eventos'          element={<RotaProtegida><Eventos /></RotaProtegida>} />
      <Route path='/Noticias'         element={<RotaProtegida><Noticias /></RotaProtegida>} />
      <Route path='/Educacao'         element={<RotaProtegida><Educacao /></RotaProtegida>} />
      <Route path='/Perfil'           element={<RotaProtegida><Perfil /></RotaProtegida>} />
      <Route path='/Definicoes'       element={<RotaProtegida><Definicoes /></RotaProtegida>} />
      <Route path='/Editar'           element={<RotaProtegida><Editar /></RotaProtegida>} />
      <Route path='/NovoResiduo'      element={<RotaProtegida><NovoResiduo /></RotaProtegida>} />

      {/* ═══════════════════════════════════════════════
          ROTAS PRIVADAS — coletador
      ═══════════════════════════════════════════════ */}
      <Route path='/ColetadorInicio'     element={<RotaProtegida><PaginaInicialColetador /></RotaProtegida>} />
      <Route path='/ColetadorDashboard'  element={<RotaProtegida><DashboardColetador /></RotaProtegida>} />
      <Route path='/ColetadorProfile'    element={<RotaProtegida><ColetadorProfile /></RotaProtegida>} />
      <Route path='/PedidosPendentes'    element={<RotaProtegida><PedidosPendentes /></RotaProtegida>} />
      <Route path='/HistoricoColetas'    element={<RotaProtegida><HistoricoColetas /></RotaProtegida>} />
      <Route path='/PerfilColetador'     element={<RotaProtegida><PerfilColetador /></RotaProtegida>} />
      <Route path='/EditarColetador'     element={<RotaProtegida><EditarColetador /></RotaProtegida>} />
      <Route path='/DefinicoesColetador' element={<RotaProtegida><DefinicoesColetador /></RotaProtegida>} />
      <Route path='/ColetadorEventos'    element={<RotaProtegida><EventosColetador /></RotaProtegida>} />
      <Route path='/ColetadorNoticias'   element={<RotaProtegida><NoticiasColetador /></RotaProtegida>} />
      <Route path='/ColetadorEducacao'   element={<RotaProtegida><EducacaoColetador /></RotaProtegida>} />

      {/* ═══════════════════════════════════════════════
          ROTAS PRIVADAS — empresa
      ═══════════════════════════════════════════════ */}
      <Route path='/DashboardEmpresa'   element={<RotaProtegida><DashboardEmpresa /></RotaProtegida>} />
      <Route path='/PerfilEmpresa'      element={<RotaProtegida><PerfilEmpresa /></RotaProtegida>} />
      <Route path='/EditarEmpresa'      element={<RotaProtegida><EditarEmpresa /></RotaProtegida>} />
      <Route path='/EntregasEmpresa'    element={<RotaProtegida><EntregasEmpresa /></RotaProtegida>} />
      <Route path='/EventosEmpresa'     element={<RotaProtegida><EventosEmpresa /></RotaProtegida>} />
      <Route path='/ColetadoresEmpresa' element={<RotaProtegida><ColetadoresEmpresa /></RotaProtegida>} />
      <Route path='/EmpresaEducacao'    element={<RotaProtegida><EducacaoEmpresa /></RotaProtegida>} />

    </Routes>
  )
}

export default App