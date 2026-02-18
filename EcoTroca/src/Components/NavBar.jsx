// Importa React e o hook useState para controlar estados internos
import { useState } from "react"

// Importa useNavigate para navegar entre páginas sem recarregar
import { useNavigate } from "react-router-dom"

// Importa o logo da aplicação
import logo from "../assets/Ecotroca-logo-2.0.png"

// Importa Link para navegação (não utilizado aqui, mas pode ser usado)
import { Link } from "react-router-dom"

/* 
  Componente NavBar
  Responsável pelo menu do site, desktop e mobile
*/
const NavBar = () => {
  // Estado que guarda se o menu mobile está aberto ou fechado
  const [isOpen, setIsOpen] = useState(false)

  // Função que permite navegar entre páginas sem recarregar
  const navigate = useNavigate()

  /* ================= FUNÇÕES DE SCROLL ================= */

  // Função para ir até a seção Cadastro
  const scrollToCadastro = () => {
    if (window.location.pathname !== "/") {
      navigate("/") // vai para a página inicial
      setTimeout(() => {
        // espera 200ms para o DOM renderizar
        document.getElementById("Cadastro")?.scrollIntoView({ behavior: "smooth" })
      }, 200)
    } else {
      document.getElementById("Cadastro")?.scrollIntoView({ behavior: "smooth" })
    }
    setIsOpen(false) // fecha menu mobile após clicar
  }

  // Função para ir até a seção Como Funciona
  const scrollToComoFunciona = () => {
    if (window.location.pathname !== "/") {
      navigate("/")
      setTimeout(() => {
        document.getElementById("ComoFunciona")?.scrollIntoView({ behavior: "smooth" })
      }, 200)
    } else {
      document.getElementById("ComoFunciona")?.scrollIntoView({ behavior: "smooth" })
    }
    setIsOpen(false)
  }

  // Função para ir até a seção Materiais Recicláveis
  const scrollToMateriaisReciclaveis = () => {
    if (window.location.pathname !== "/") {
      navigate("/")
      setTimeout(() => {
        document.getElementById("MateriaisReciclaveis")?.scrollIntoView({ behavior: "smooth" })
      }, 200)
    } else {
      document.getElementById("MateriaisReciclaveis")?.scrollIntoView({ behavior: "smooth" })
    }
    setIsOpen(false)
  }

  // Função para ir até a seção O Que Ganhas
  const scrollToOqueGanhas = () => {
    if (window.location.pathname !== "/") {
      navigate("/")
      setTimeout(() => {
        document.getElementById("OqueGanhas")?.scrollIntoView({ behavior: "smooth" })
      }, 200)
    } else {
      document.getElementById("OqueGanhas")?.scrollIntoView({ behavior: "smooth" })
    }
    setIsOpen(false)
  }

  /* ================= FIM FUNÇÕES DE SCROLL ================= */

  return (
    // Container da navbar
    <nav className="w-full bg-[#fafaf9] shadow-md">
      {/* Área principal da navbar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <img className="w-35" src={logo} alt="logo-EcoTroca" />
        </div>

        {/* LINKS - desktop */}
        <ul className="hidden md:flex items-center gap-8 text-green-700 font-medium">
          <li className="cursor-pointer hover:text-green-900" onClick={scrollToComoFunciona}>
            Como Funciona
          </li>
          <li className="cursor-pointer hover:text-green-900" onClick={scrollToMateriaisReciclaveis}>
            Materiais
          </li>
          <li className="cursor-pointer hover:text-green-900" onClick={scrollToOqueGanhas}>
            Recompensas
          </li>
          <li className="cursor-pointer hover:text-green-900" onClick={scrollToCadastro}>
            Cadastrar
          </li>
          <li className="cursor-pointer hover:text-green-900" onClick={() => navigate("/Login")}>
            Entrar
          </li>
        </ul>

        {/* BOTÃO CTA - desktop */}
        <button
          className="hidden md:block bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-semibold transition"
          onClick={scrollToCadastro}
        >
          Começar Agora
        </button>

        {/* HAMBURGUER - mobile */}
        <div
          className="md:hidden flex flex-col cursor-pointer space-y-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* Linhas do botão hamburguer */}
          <span className="w-6 h-0.5 bg-green-700"></span>
          <span className="w-6 h-0.5 bg-green-700"></span>
          <span className="w-6 h-0.5 bg-green-700"></span>
        </div>
      </div>

      {/* MENU MOBILE */}
      {isOpen && (
        <div className="md:hidden bg-gray-200 px-8 py-4">
          <ul className="flex flex-col gap-4 text-green-700 font-medium">
            <li className="cursor-pointer hover:text-green-900" onClick={scrollToComoFunciona}>
              Como Funciona
            </li>
            <li className="cursor-pointer hover:text-green-900" onClick={scrollToMateriaisReciclaveis}>
              Materiais
            </li>
            <li className="cursor-pointer hover:text-green-900" onClick={scrollToOqueGanhas}>
              Recompensas
            </li>
            <li className="cursor-pointer hover:text-green-900" onClick={scrollToCadastro}>
              Cadastrar
            </li>
            <li className="cursor-pointer hover:text-green-900" onClick={() => navigate("/Login")}>
              Entrar
            </li>
            {/* Botão CTA mobile */}
            <li>
              <button
                className="w-full bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-semibold transition"
                onClick={scrollToCadastro}
              >
                Começar Agora
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}

export default NavBar
