import Header from "../Components/UserProfile/Header.jsx";
import Actividades from "../Components/UserProfile/Actividades.jsx";
import CartaoPedidoEmpresa from "../Components/UserProfile/CartaoPedidoEmpresa.jsx";
import PaginaInicial from "../Components/UserProfile/PaginaInicial.jsx";
import Dashboard from "../Components/UserProfile/Dashboard.jsx";
import Noticias from "../Components/UserProfile/Noticias.jsx";
import Eventos from "../Components/UserProfile/Eventos.jsx";
import Educacao from "../Components/UserProfile/Educacao.jsx";
import Mapa from "../Components/UserProfile/Mapa.jsx";
import Perfil from "../Components/UserProfile/Perfil.jsx";





export default function UserProfile() {
  return (
    <div>

      
      

      
        <Header />
 


        {/* Cartao de empresa */}
        <CartaoPedidoEmpresa />

        {/* Pagina inicial */}
      <PaginaInicial />

           {/* Actividades */}
      <Actividades />

     
      {/* DASHBOARD */}
      <Dashboard />

      

     

      {/* MAPA */}
      <Mapa />

      
      {/* NOTICIAS */}
      <Noticias />

      {/* EVENTOS */}
      <Eventos />

      {/* EDUCACAO AMBIENTAL */}
      <Educacao />


      <Perfil />
    </div>


  );
}
