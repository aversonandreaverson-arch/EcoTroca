import { useState } from "react";
import { NavLink } from "react-router-dom";

/* isto é um componente funcional que chamamos de NavBar, permite o jsx que é misturar o html com js */
const Header = () => {

/* aqui criamos um estado chamado isOpen. O setIsOpen é uma funcao que nos permite abrir e fechar o menu,
e nesse estado será guardado o useState(false) pois o useState é um hook que guarda um estado que pode mudar
na tela e como esta false ent ele vai guardar o false quando o menu estiver aberto   */
const [isOpen, setIsOpen] = useState(false);

/* aqui começa o codigo da navbar com estilizacao*/
return ( <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50"> <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

    {/* LOGO / NOME DO SISTEMA */}
    <h1 className="text-xl font-bold text-green-700">
      Ecotroca-Angola
    </h1>

    {/* LINKS - desktop */}
    <ul className="hidden md:flex items-center gap-8 text-green-700 font-medium">

      <li>
        <NavLink
          to="/PaginaInicial"
          className={({ isActive }) =>
            isActive
              ? "text-green-900 font-semibold border-b-2 border-green-700 pb-1"
              : "hover:text-green-900 transition"
          }
        >
          Página Inicial
        </NavLink>
      </li>

      <li>
        <NavLink
          to="/Dashboard"
          className={({ isActive }) =>
            isActive
              ? "text-green-900 font-semibold border-b-2 border-green-700 pb-1"
              : "hover:text-green-900 transition"
          }
        >
          Dashboard
        </NavLink>
      </li>

      <li>
        <NavLink
          to="/Eventos"
          className={({ isActive }) =>
            isActive
              ? "text-green-900 font-semibold border-b-2 border-green-700 pb-1"
              : "hover:text-green-900 transition"
          }
        >
          Eventos
        </NavLink>
      </li>

      <li>
        <NavLink
          to="/Noticias"
          className={({ isActive }) =>
            isActive
              ? "text-green-900 font-semibold border-b-2 border-green-700 pb-1"
              : "hover:text-green-900 transition"
          }
        >
          Notícias
        </NavLink>
      </li>

      <li>
        <NavLink
          to="/Educacao"
          className={({ isActive }) =>
            isActive
              ? "text-green-900 font-semibold border-b-2 border-green-700 pb-1"
              : "hover:text-green-900 transition"
          }
        >
          Educação
        </NavLink>
      </li>

      <li>
        <NavLink
          to="/Perfil"
          className={({ isActive }) =>
            isActive
              ? "text-green-900 font-semibold border-b-2 border-green-700 pb-1"
              : "hover:text-green-900 transition"
          }
        >
          Perfil
        </NavLink>
      </li>

    </ul>

    {/* HAMBURGUER - mobile */}
    <div
      className="md:hidden flex flex-col cursor-pointer space-y-1"
      onClick={() => setIsOpen(!isOpen)}
    >
      {/* linhas do menu */}
      <span className="w-6 h-0.5 bg-green-700"></span>
      <span className="w-6 h-0.5 bg-green-700"></span>
      <span className="w-6 h-0.5 bg-green-700"></span>
    </div>
  </div>

  {/* MENU MOBILE*/}
  {isOpen && (
    <div className="md:hidden bg-white px-8 py-4 border-t border-gray-200">
      <ul className="flex flex-col gap-4 text-green-700 font-medium">

        <li>
          <NavLink to="/" onClick={() => setIsOpen(false)}>Página Inicial</NavLink>
        </li>

        <li>
          <NavLink to="/Dashboard" onClick={() => setIsOpen(false)}>Dashboard</NavLink>
        </li>

        <li>
          <NavLink to="/Eventos" onClick={() => setIsOpen(false)}>Eventos</NavLink>
        </li>

        <li>
          <NavLink to="/Noticiais" onClick={() => setIsOpen(false)}>Notíciais</NavLink>
        </li>

        <li>
          <NavLink to="/Educacao" onClick={() => setIsOpen(false)}>Educação</NavLink>
        </li>

        <li>
          <NavLink to="/Perfil" onClick={() => setIsOpen(false)}>Perfil</NavLink>
        </li>

      </ul>
    </div>
  )}
</nav>


);
};

export default Header
