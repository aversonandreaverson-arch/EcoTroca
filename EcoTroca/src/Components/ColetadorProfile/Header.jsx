import { useState } from "react";
import { NavLink } from "react-router-dom";
import { logout } from "../../api.js";
import { LogOut } from "lucide-react";

// Links específicos do coletador — diferentes do utilizador comum
const links = [
  { label: "Página Inicial", to: "/ColetadorInicio" },
  { label: "Dashboard", to: "/ColetadorDashboard" },
  { label: "Pedidos Pendentes", to: "/PedidosPendentes" },
  { label: "Histórico", to: "/HistoricoColetas" },
  { label: "Notícias", to: "/ColetadorNoticias" },
  { label: "Eventos", to: "/ColetadorEventos" },
  { label: "Perfil", to: "/PerfilColetador" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        {/* Logo com indicador de conta coletador */}
        <div>
          <h1 className="text-xl font-bold text-green-700">Ecotroca-Angola</h1>
          <span className="text-xs text-green-500 font-medium">Conta Coletador</span>
        </div>

        {/* Links Desktop */}
        <ul className="hidden md:flex items-center gap-6 text-green-700 font-medium">
          {links.map((link) => (
            <li key={link.to}>
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

          {/* Botão de logout */}
          <li>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-red-500 hover:text-red-700 transition text-sm"
            >
              <LogOut size={16} />
              Sair
            </button>
          </li>
        </ul>

        {/* Botão Hambúrguer Mobile */}
        <div
          className="md:hidden flex flex-col cursor-pointer space-y-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="w-6 h-0.5 bg-green-700"></span>
          <span className="w-6 h-0.5 bg-green-700"></span>
          <span className="w-6 h-0.5 bg-green-700"></span>
        </div>
      </div>

      {/* Menu Mobile */}
      {isOpen && (
        <div className="md:hidden bg-white px-8 py-4 border-t border-gray-200">
          <ul className="flex flex-col gap-4 text-green-700 font-medium">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive ? "font-semibold text-green-900" : "hover:text-green-900 transition"
                  }
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button onClick={logout} className="flex items-center gap-1 text-red-500 text-sm">
                <LogOut size={16} /> Sair
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Header;
