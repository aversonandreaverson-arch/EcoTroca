import { useState } from "react";
import { useNavigate }  from "react-router-dom";
import logo from "../../assets/Ecotroca-logo-2.0.png";
import { Link } from "react-router-dom";

/* isto é um componente funcional que chamamos de NavBar, permite o jsx que é misturar o html com js */
 const Header = () => {
  /* aqui criamos um estado chamado isOpen. O setIsOpen é uma funcao que nos permite abrir e fechar o menu, 
  e nesse estado será guardado o useState(false) pois o useState é um hook que guarda um estado que pode mudar 
  na tela e como esta false ent ele vai guardar o false quando o menu estiver aberto   */
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
/* esta funcao nos permite guardar o UseNavigate, 
ele é que faz com que possamos navegar sem que o site carregue novamente  */
  const scrollToDashboard = () => {
    if(window.location.pathname !== '/'){
      navigate('/')
      /* da um atraso de 200ms para o dom renderizar */
      setTimeout (() => {
        document.getElementById('Dasboard')?.scrollIntoView({ behavior: 'smooth'})
      }, 200);
    } else {
      document.getElementById('Dasboard')?.scrollIntoView({behavior: 'smooth'})

    }
    setIsOpen(false) /* fecha menu mobile apos clicar */
  }

  /* Outro Scroll */

  const scrollToEventos = () => {
    if (window.location.pathname !== '/'){
      navigate ('/')
      setTimeout (() => {
        document.getElementById('Eventos')?.scrollIntoView({ behavior: 'smooth'})
      }, 200 )
    } else {
      document.getElementById('Eventos')?.scrollIntoView({ behavior: 'smooth'})
    }
    setIsOpen(false) 
  }

  /* OUTRO SCROLL */

  const scrollToNoticiais = () => {
    if(window.location.pathname !== '/'){
      navigate ('/')
      setTimeout (() => {
        document.getElementById('Noticiais')?.scrollIntoView({ behavior: 'smooth'})
      }, 200)
    } else {
      document.getElementById('Noticiais')?.scrollIntoView({behavior: 'smooth'})
    }
    setIsOpen(false)
  }
  /* OUTRO SCROLL */

  const scrollToEducacao = () => {
    if(window.location.pathname !== '/'){
      navigate ('/')
      setTimeout (() =>{
        document.getElementById('Educacao')?.scrollIntoView({ behavior: 'smooth'})
      }, 200)
    } else {
      document.getElementById('Educacao')?.scrollIntoView({behavior: 'smooth'})
    }
    setIsOpen(false)
  }
   /* OUTRO SCROLL */

  const scrollToPerfil = () => {
    if(window.location.pathname !== '/'){
      navigate ('/')
      setTimeout (() =>{
        document.getElementById('Perfil')?.scrollIntoView({ behavior: 'smooth'})
      }, 200)
    } else {
      document.getElementById('Perfil')?.scrollIntoView({behavior: 'smooth'})
    }
    setIsOpen(false)
  }


  /* FIm DOS SCROLL'S */

    /* aqui começa o codigo da navbar com estilizacao*/
  return (
    <nav className="w-full bg-[#fafaf9] shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <img className="w-35" src={logo} alt="logo-EcoTroca" />
        </div>

        {/* LINKS - desktop */}
        <ul className="hidden md:flex items-center gap-8 text-green-700 font-medium">
          <li className="cursor-pointer hover:text-green-900" onClick={scrollToPaginaInicial}>Página Inicial</li>
          <li className="cursor-pointer hover:text-green-900" onClick={() => navigate ('/Dashboard')}>Dashboard</li>
          <li className="cursor-pointer hover:text-green-900" onClick={() => navigate ('/Eventos')}>Eventos</li>
          <li className="cursor-pointer hover:text-green-900" onClick={() => navigate ('/Noticiais')}>Notíciais</li>
          <li className="cursor-pointer hover:text-green-900" onClick={() => navigate('/Educacao')}>Educação</li>
          <li className="cursor-pointer hover:text-green-900" onClick={() => navigate('/Perfil')}>Perfil</li>

        </ul>

        {/* BOTÃO CTA - desktop */}
        {/* <button className="hidden md:block bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-semibold transition" onClick={scrollToCadastro}>
          Começar Agora
        </button> */}

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
        <div className="md:hidden bg-gray-200 px-8 py-4">
          <ul className="flex flex-col gap-4 text-green-700 font-medium">
          <li className="cursor-pointer hover:text-green-900" onClick={scrollToPaginaInicial}>Página Inicial</li>
          <li className="cursor-pointer hover:text-green-900" onClick={() => navigate ('/Dashboard')}>Dashboard</li>
          <li className="cursor-pointer hover:text-green-900" onClick={() => navigate ('Eventos')}>Eventos</li>
          <li className="cursor-pointer hover:text-green-900" onClick={() => navigate ('/Noticiais')}>Notíciais</li>
          <li className="cursor-pointer hover:text-green-900" onClick={() => navigate('/Educacao')}>Educação</li>
          <li className="cursor-pointer hover:text-green-900" onClick={() => navigate('/Perfil')}>Perfil</li>
{/* mexerrrrr aqui na parte do entrar, para que quando clicamos no link entrar para redirecionar para a pagina de login */}
            <li>
             {/*  <button className="w-full bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-semibold transition" onClick={scrollToCadastro}>
                Começar Agora
              </button> */}
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Header;
