import {Routes, Route} from 'react-router-dom'
import Home from './pages/home'
import Login from './pages/Login'
import RecuperacaoDeSenha from './pages/RecuperacaoDeSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import UserProfile from './pages/UserProfile'

function App () {
  return (
    <Routes>
      <Route path='/' element={<Home />}></Route>
      <Route path='/Login' element={<Login />}></Route>
      <Route path='/RecuperacaoDeSenha' element={<RecuperacaoDeSenha />}></Route>
      <Route path='/RedefinirSenha/:token123' element={<RedefinirSenha />}></Route>
      <Route path='/UserProfile' element={<UserProfile />}></Route>
    </Routes>
  )
}

export default App