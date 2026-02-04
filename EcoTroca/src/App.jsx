import {Routes, Route} from 'react-router-dom'
import Home from './pages/home'
import Cadastro from './Components/Cadastro'
import Login from './Components/Login'
import ComoFunciona from './Components/ComoFunciona'


function App () {
  return (
    <Routes>
      <Route path='/' element={<Home />}></Route>
      <Route path ='/' element={<Cadastro />}></Route>
      <Route path='/' element={<Login />}></Route>
      
    </Routes>
  )
}

export default App