// ============================================================
//  Header.jsx — Navbar da Empresa Recicladora
//  Barra de navegação fixa no topo para o painel da empresa
// ============================================================

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../api.js";

// Links do menu da empresa — diferentes do utilizador comum
const links = [
  { label: "Início",       to: "/DashboardEmpresa" },
  { label: "Entregas",     to: "/EntregasEmpresa" },
  { label: "Eventos",      to: "/EventosEmpresa" },
  { label: "Coletadores",  to: "/ColetadoresEmpresa" },
  { label: "Perfil",       to: "/PerfilEmpresa" },
];

const Header = () => {
  const navigate = useNavigate();

  // Controla se o menu mobile está aberto ou fechado
  const [isOpen, setIsOpen] = useState(false);

  // Faz logout e redireciona para o login
  const handleLogout = () => {
    logout();
    navigate('/Login');
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">

      {/* Container principal da navbar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        {/* Logo / Nome do sistema */}
        <h1 className="text-xl font-bold text-green-700">
          🏭 EcoTroca — Empresa
        </h1>

        {/* Links — visíveis só em desktop */}
        <ul className="hidden md:flex items-center gap-8 text-green-700 font-medium">
          {links.map((link) => (
            <li key={link.to}>
              {/* NavLink muda o estilo automaticamente quando a rota está ativa */}
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  isActive
                    ? "text-green-900 font-semibold border-b-2 border-green-700 pb-1"
                    : "hover:text-green-900 transition"
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}

          {/* Botão de logout — separado dos links de navegação */}
          <li>
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Sair
            </button>
          </li>
        </ul>

        {/* Botão hamburguer — visível só em mobile */}
        <div
          className="md:hidden flex flex-col cursor-pointer space-y-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="w-6 h-0.5 bg-green-700"></span>
          <span className="w-6 h-0.5 bg-green-700"></span>
          <span className="w-6 h-0.5 bg-green-700"></span>
        </div>
      </div>

      {/* Menu mobile — aparece quando o hamburguer é clicado */}
      {isOpen && (
        <div className="md:hidden bg-white px-8 py-4 border-t border-gray-200">
          <ul className="flex flex-col gap-4 text-green-700 font-medium">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive
                      ? "font-semibold text-green-900"
                      : "hover:text-green-900 transition"
                  }
                  onClick={() => setIsOpen(false)} // Fecha o menu ao clicar
                >
                  {link.label}
                </NavLink>
              </li>
            ))}

            {/* Logout no menu mobile */}
            <li>
              <button
                onClick={handleLogout}
                className="text-red-600 font-medium hover:text-red-800 transition"
              >
                Sair
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Header;