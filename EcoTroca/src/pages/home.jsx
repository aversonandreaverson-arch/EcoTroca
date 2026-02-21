import NavBar from "../Components/NavBar.jsx";
import Hero from "../Components/Hero.jsx"
import ComoFunciona  from "../Components/ComoFunciona.jsx"
import Forma from "../Components/Forma.jsx"
import PassosSimples from "../Components/PassosSimples.jsx"
import MateriaiasReciclaveis from "../Components/MateriaiasReciclaveis.jsx";
import DicasRapidas from "../Components/DicasRapidas.jsx"
import OqueGanhas from "../Components/OqueGanhas.jsx";
import Niveis from "../Components/Niveis.jsx";
import Cadastro from "../Components/Cadastro.jsx";



const Home = () => {
    return (


    <div >
    
        <NavBar />
        <Hero />
        <ComoFunciona /> 
        <Forma/>
        <PassosSimples/>
        <MateriaiasReciclaveis/> 
        <DicasRapidas/>
        <OqueGanhas />
        <Niveis /> 
        < Cadastro /> 
  </div>
    );
};
    
  

export default Home
