import Dashboard from "../Components/UserProfile/Dashboard.jsx";
import Noticias from "../Components/UserProfile/Noticias";
import Eventos from "../Components/UserProfile/Eventos";
import Ranking from "../Components/UserProfile/Ranking";
import Educacao from "../Components/UserProfile/Educacao";
import RecompensasUsuario from "../Components/UserProfile/RecompensasUsuario";
import Explorar from "../Components/UserProfile/Explorar";
import Mapa from "../Components/UserProfile/Mapa";

export default function UserProfile() {
  return (
    <div>
      {/* DASHBOARD */}
      <Dashboard />

      {/* RECOMPENSAS */}
      <RecompensasUsuario />

      {/* PESQUISAR EMPRESAS E COLETADORES */}
      <Explorar />

      {/* MAPA */}
      <Mapa />

      {/* RANKING */}
      <Ranking />

      {/* NOTICIAS */}
      <Noticias />

      {/* EVENTOS */}
      <Eventos />

      {/* EDUCACAO AMBIENTAL */}
      <Educacao />
    </div>
  );
}
