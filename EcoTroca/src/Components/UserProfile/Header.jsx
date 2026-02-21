import { useState } from "react";
import { NavLink } from "react-router-dom";

// Aqui criamos um array com os links do menu
// Isso ajuda a não repetir muito código
const links = [
  { label: "Página Inicial", to: "/PaginaInicial" },
  { label: "Dashboard", to: "/Dashboard" },
  { label: "Eventos", to: "/Eventos" },
  { label: "Notícias", to: "/Noticias" },
  { label: "Educação", to: "/Educacao" },
  { label: "Perfil", to: "/Perfil" },
];

// Componente principal Header (Navbar)
const Header = () => {
  // Aqui usamos o useState para abrir/fechar o menu mobile
  const [isOpen, setIsOpen] = useState(false);

  return (
    // Toda a navbar
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      
      {/* Container da navbar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        {/* LOGO ou NOME DO SISTEMA */}
        <h1 className="text-xl font-bold text-green-700">
          Ecotroca-Angola
        </h1>

        {/* LINKS - DESKTOP (aparece só em telas maiores) */}
        <ul className="hidden md:flex items-center gap-8 text-green-700 font-medium">
          {links.map((link) => (
            <li key={link.to}>
              {/* NavLink é do react-router-dom, ele muda o estilo se estiver ativo */}
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  isActive
                    ? "text-green-900 font-semibold border-b-2 border-green-700 pb-1"
                    : "hover:text-green-900 transition"
                }
              >
                {link.label} {/* Aqui mostramos o nome do link */}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* BOTÃO HAMBURGUER - MOBILE (aparece só em telas pequenas) */}
        <div
          className="md:hidden flex flex-col cursor-pointer space-y-1"
          onClick={() => setIsOpen(!isOpen)} // Aqui abrimos ou fechamos o menu mobile
        >
          {/* Três linhas do hamburguerr */}
          <span className="w-6 h-0.5 bg-green-700"></span>
          <span className="w-6 h-0.5 bg-green-700"></span>
          <span className="w-6 h-0.5 bg-green-700"></span>
        </div>
      </div>

      {/* MENU MOBILE */}
      {isOpen && (
        <div className="md:hidden bg-white px-8 py-4 border-t border-gray-200">
          <ul className="flex flex-col gap-4 text-green-700 font-medium">
            {links.map((link) => (
              <li key={link.to}>
                {/* Mesmo NavLink do desktop, mas sem underline, só muda a cor */}
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive
                      ? "font-semibold text-green-900"
                      : "hover:text-green-900 transition"
                  }
                  onClick={() => setIsOpen(false)} // Fecha o menu quando clicamos
                >
                  {link.label} {/* Nome do link */}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Header;
