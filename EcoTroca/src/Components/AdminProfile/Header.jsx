
// useState → guardo o estado do menu mobile (aberto ou fechado)
import { useState } from "react";

// NavLink   → link de navegação que sabe quando está activo
// useNavigate → função para mudar de página programaticamente
import { NavLink, useNavigate } from "react-router-dom";

// logout → função do api.js que apaga o token e termina a sessão
import { logout } from "../../api.js";

// ── Lista de links do menu ───────────────────────────────────
// Cada objecto tem o texto a mostrar (label) e a rota de destino (to)
const links = [
  { label: "Página Inicial", to: "/AdminInicio"       },
  { label: "Dashboard",      to: "/AdminDashboard"    },
  { label: "Utilizadores",   to: "/AdminUtilizadores" },
  { label: "Educação",       to: "/AdminEducacao"     },
  { label: "Relatórios",     to: "/AdminRelatorios"   },
];

// ── Componente principal ─────────────────────────────────────
const Header = () => {

  // useNavigate devolve uma função para navegar para outra página
  const navigate = useNavigate();

  // isOpen → controla se o menu mobile está aberto (true) ou fechado (false)
  // começa fechado por defeito
  const [isOpen, setIsOpen] = useState(false);

  // Função chamada quando o utilizador clica em "Sair"
  const handleLogout = () => {
    logout();           // apaga o token do localStorage
    navigate('/Login'); // redireciona para a página de login
  };

  return (
    // nav → elemento HTML de navegação, fixo no topo (fixed top-0)
    // z-50 → fica por cima de todo o conteúdo da página
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">

      {/* Container principal — alinha logo, links e hambúrguer numa linha */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        {/* Logo / Nome do sistema — aparece sempre */}
        <h1 className="text-xl font-bold text-gray-800">
          🛡️ EcoTroca — Admin
        </h1>

        {/* ── Links de navegação — visíveis só em desktop (md:flex) ── */}
        {/* hidden → esconde em mobile; md:flex → mostra em desktop */}
        <ul className="hidden md:flex items-center gap-6 text-gray-700 font-medium text-sm">

          {/* Percorro a lista de links e crio um item de menu para cada um */}
          {links.map((link) => (
            <li key={link.to}>
              {/*
                NavLink é como um Link normal mas com uma prop especial:
                isActive → é true quando a rota actual corresponde ao "to"
                Uso isso para mudar o estilo do link activo
              */}
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  isActive
                    // Link activo → negrito com sublinhado cinzento
                    ? "text-gray-900 font-semibold border-b-2 border-gray-700 pb-1"
                    // Link inactivo → cinzento, fica mais escuro ao passar o rato
                    : "hover:text-gray-900 transition"
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}

          {/* Botão de logout — separado dos links de navegação */}
          <li>
            <button
              onClick={handleLogout} // chamo a função de logout ao clicar
              className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Sair
            </button>
          </li>
        </ul>

        {/* ── Botão hambúrguer — visível só em mobile (md:hidden) ── */}
        {/*
          Quando clicado, inverto o estado de isOpen:
          se estava false passa a true e o menu abre
          se estava true passa a false e o menu fecha
        */}
        <div
          className="md:hidden flex flex-col cursor-pointer space-y-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* Três traços que formam o ícone hambúrguer */}
          <span className="w-6 h-0.5 bg-gray-700"></span>
          <span className="w-6 h-0.5 bg-gray-700"></span>
          <span className="w-6 h-0.5 bg-gray-700"></span>
        </div>
      </div>

      {/* ── Menu mobile — só aparece quando isOpen é true ── */}
      {/*
        O operador && funciona assim:
        se isOpen for true → renderiza o div do menu
        se isOpen for false → não renderiza nada
      */}
      {isOpen && (
        <div className="md:hidden bg-white px-8 py-4 border-t border-gray-200">
          <ul className="flex flex-col gap-4 text-gray-700 font-medium">

            {/* Os mesmos links do desktop, mas em coluna */}
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive
                      ? "font-semibold text-gray-900"
                      : "hover:text-gray-900 transition"
                  }
                  // Fecho o menu ao clicar num link (melhora a experiência mobile)
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}

            {/* Botão de logout no menu mobile */}
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