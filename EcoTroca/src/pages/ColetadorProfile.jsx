import Header from "../Components/ColetadorProfile/Header.jsx";
import Actividades from "../Components/ColetadorProfile/Actividades.jsx";
import CartaoPedidoEmpresa from "../Components/ColetadorProfile/CartaoPedidoEmpresa.jsx";
import PaginaInicial from "../Components/ColetadorProfile/PaginaInicial.jsx";
import Dashboard from "../Components/ColetadorProfile/Dashboard.jsx";
import Noticias from "../Components/ColetadorProfile/Noticias.jsx";
import Eventos from "../Components/ColetadorProfile/Eventos.jsx";
import Educacao from "../Components/ColetadorProfile/Educacao.jsx";
import Mapa from "../Components/ColetadorProfile/Mapa.jsx";
import Perfil from "../Components/ColetadorProfile/Perfil.jsx";




export default function ColetadorProfile() {
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
