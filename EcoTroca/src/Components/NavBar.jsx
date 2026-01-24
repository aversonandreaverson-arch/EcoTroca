
import logo from "../assets/Ecotroca-logo-2.0.png"


export const NavBar = () => {
  return (
    <nav className='w-full flex items-center justify-between px-8 py-4 bg-gray-200'>

         {/* LOGO */}

            <div className="flex items-center gap-2">
                <div className='flex shrink-0 items-center justify-center '>
                    <img className="mx-1 w-35 " src={logo} alt='logo-EcoTroca'/>
                </div>
               
            </div>
                        
        {/* links */} 

            <ul className="hidden md:flex items-center gap-8 text-green-700 font-medium">
                <li className="cursor-pointer hover:text-green-900">
                        Como Funciona
                </li>  
                <li className="cursor-pointer hover:text-green-900">
                        Materiais
                </li> 
                <li className="cursor-pointer hover:text-green-900">
                        Recompensas
                </li> 
                <li className="cursor-pointer hover:text-green-900">
                        Cadastrar
                </li>           
            </ul>
        {/* Botao CTA */} 

            <button className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-semibold transition">
                    Começar Agora
            </button>
        
                
            


  
   
   
   
    </nav>

    
  )
}
 export default NavBar