import {Routes, Route} from 'react-router-dom'
import Home from './pages/home'
import Login from './pages/Login'
import RecuperacaoDeSenha from './pages/RecuperacaoDeSenha'
import RedefinirSenha from './pages/RedefinirSenha'
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



function App () {
  return (
    <Routes>
      <Route path='/' element={<Home />}></Route>
      <Route path='/Login' element={<Login />}></Route>
      <Route path='/RecuperacaoDeSenha' element={<RecuperacaoDeSenha />}></Route>
      <Route path='/RedefinirSenha/:token123' element={<RedefinirSenha />}></Route>
      <Route path='/UserProfile' element={<UserProfile />}></Route>
      <Route path='/ColetadorProfile' element={<ColetadorProfile />}></Route>
      <Route path='/Dashboard' element={<Dashboard />}></Route>
      <Route path='/Eventos' element={<Eventos/>}></Route>
      <Route path='/Noticias' element={<Noticias/>}></Route>
      <Route path='/Educacao' element={<Educacao />}></Route>
      <Route path='/Perfil' element={<Perfil />}></Route>
      <Route path='/PaginaInicial' element={<PaginaInicial />}></Route>
      <Route path='/Definicoes' element={<Definicoes /> }></Route>
      <Route path='/Editar' element={<Editar />}></Route>
      <Route path='/NovoResiduo' element={<NovoResiduo/>}></Route>
    </Routes>
  )
}

export default App