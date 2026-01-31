import { useState } from "react";
import logo from "../assets/Ecotroca-logo-2.0.png";

export const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full bg-[#fafaf9] shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <img className="w-35" src={logo} alt="logo-EcoTroca" />
        </div>

        {/* LINKS - desktop */}
        <ul className="hidden md:flex items-center gap-8 text-green-700 font-medium">
          <li className="cursor-pointer hover:text-green-900">Como Funciona</li>
          <li className="cursor-pointer hover:text-green-900">Materiais</li>
          <li className="cursor-pointer hover:text-green-900">Recompensas</li>
          <li className="cursor-pointer hover:text-green-900">Cadastrar</li>
        </ul>

        {/* BOTÃO CTA - desktop */}
        <button className="hidden md:block bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-semibold transition">
          Começar Agora
        </button>

        {/* HAMBURGUER - mobile */}
        <div
          className="md:hidden flex flex-col cursor-pointer space-y-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="w-6 h-0.5 bg-green-700"></span>
          <span className="w-6 h-0.5 bg-green-700"></span>
          <span className="w-6 h-0.5 bg-green-700"></span>
        </div>
      </div>

      {/* MENU MOBILE */}
      {isOpen && (
        <div className="md:hidden bg-gray-200 px-8 py-4">
          <ul className="flex flex-col gap-4 text-green-700 font-medium">
            <li className="cursor-pointer hover:text-green-900">Como Funciona</li>
            <li className="cursor-pointer hover:text-green-900">Materiais</li>
            <li className="cursor-pointer hover:text-green-900">Recompensas</li>
            <li className="cursor-pointer hover:text-green-900">Cadastrar</li>
            <li>
              <button className="w-full bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-semibold transition">
                Começar Agora
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
