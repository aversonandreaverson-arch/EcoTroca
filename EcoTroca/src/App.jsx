import { Routes, Route } from 'react-router-dom'

// Páginas públicas (não precisam de login)
import Home from './pages/home'
import Login from './pages/Login'
import RecuperacaoDeSenha from './pages/RecuperacaoDeSenha'
import RedefinirSenha from './pages/RedefinirSenha'

// Páginas privadas (precisam de login)
import UserProfile from './pages/UserProfile'
import ColetadorProfile from './pages/ColetadorProfile'
import Dashboard from './Components/UserProfile/Dashboard'
import Eventos from './Components/UserProfile/Eventos'
import Noticias from './Components/UserProfile/Noticias'
import Educacao from './Components/UserProfile/Educacao'
import Perfil from './Components/UserProfile/Perfil'
import PaginaInicial from './Components/UserProfile/PaginaInicial'
import Definicoes from './Components/UserProfile/Definicoes'
import Editar from './Components/UserProfile/Editar'
import NovoResiduo from './Components/UserProfile/NovoResiduo'
import Footer from './Components/Footer'
/* IMPORTS DO COLETADOR */
// Componente que bloqueia páginas a utilizadores não autenticados
import RotaProtegida from './Components/RotaProtegida'

function App() {
  return (
    <Routes>

      {/* ===== ROTAS PÚBLICAS — qualquer pessoa pode aceder ===== */}
      <Route path='/' element={<Home />} />
      <Route path='/Login' element={<Login />} />
      <Route path='/RecuperacaoDeSenha' element={<RecuperacaoDeSenha />} />
      <Route path='/RedefinirSenha/:token123' element={<RedefinirSenha />} />
      <Route path='/Footer' element={<Footer />} />

      {/* ===== ROTAS PRIVADAS — só para utilizadores com login ===== */}
      <Route path='/PaginaInicial' element={<RotaProtegida><PaginaInicial /></RotaProtegida>} />
      <Route path='/Dashboard' element={<RotaProtegida><Dashboard /></RotaProtegida>} />
      <Route path='/UserProfile' element={<RotaProtegida><UserProfile /></RotaProtegida>} />
      <Route path='/ColetadorProfile' element={<RotaProtegida><ColetadorProfile /></RotaProtegida>} />
      <Route path='/Eventos' element={<RotaProtegida><Eventos /></RotaProtegida>} />
      <Route path='/Noticias' element={<RotaProtegida><Noticias /></RotaProtegida>} />
      <Route path='/Educacao' element={<RotaProtegida><Educacao /></RotaProtegida>} />
      <Route path='/Perfil' element={<RotaProtegida><Perfil /></RotaProtegida>} />
      <Route path='/Definicoes' element={<RotaProtegida><Definicoes /></RotaProtegida>} />
      <Route path='/Editar' element={<RotaProtegida><Editar /></RotaProtegida>} />
      <Route path='/NovoResiduo' element={<RotaProtegida><NovoResiduo /></RotaProtegida>} />

    </Routes>
  )
}

export default App