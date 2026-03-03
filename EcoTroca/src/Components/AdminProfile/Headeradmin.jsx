
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../api.js";

const links = [
  { label: "Início",       to: "/AdminDashboard" },
  { label: "Utilizadores", to: "/AdminUtilizadores" },
  { label: "Empresas",     to: "/AdminEmpresas" },
  { label: "Coletadores",  to: "/AdminColetadores" },
  { label: "Entregas",     to: "/AdminEntregas" },
  { label: "Educação",     to: "/AdminEducacao" },
  { label: "Relatórios",   to: "/AdminRelatorios" },
];

const Header = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/Login');
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">

      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        {/* Logo */}
        <h1 className="text-xl font-bold text-gray-800">
          🛡️ EcoTroca — Admin
        </h1>

        {/* Links desktop */}
        <ul className="hidden md:flex items-center gap-6 text-gray-700 font-medium text-sm">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  isActive
                    ? "text-gray-900 font-semibold border-b-2 border-gray-700 pb-1"
                    : "hover:text-gray-900 transition"
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Sair
            </button>
          </li>
        </ul>

        {/* Hamburguer mobile */}
        <div
          className="md:hidden flex flex-col cursor-pointer space-y-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="w-6 h-0.5 bg-gray-700"></span>
          <span className="w-6 h-0.5 bg-gray-700"></span>
          <span className="w-6 h-0.5 bg-gray-700"></span>
        </div>
      </div>

      {/* Menu mobile */}
      {isOpen && (
        <div className="md:hidden bg-white px-8 py-4 border-t border-gray-200">
          <ul className="flex flex-col gap-4 text-gray-700 font-medium">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive
                      ? "font-semibold text-gray-900"
                      : "hover:text-gray-900 transition"
                  }
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
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