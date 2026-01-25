import banner from "../assets/ecotroca-banner-5-0.png"

export const Hero = () => {
  return (
    <section className="w-full px-8 py-16 bg-[#f9faf7">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
             
             
            <div>           {/* lado esquerdo */}
                                {/* TITULO */}
                    <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 leading-tight mb-6">
                             Tens Lixo em casa? <br/>
                        <span className="text-green-600">
                                Nós pagamos
                        </span>
                    </h1>

                    {/* Descricao */}
                    <p className="text-green-800 max-w-xl mb-8">
                         Plástico, vidro, metal, papel... Tudo que podes reciclar, nós compramos de ti.  <br /><strong>É fácil e grátis</strong>
                    </p>

                    {/* BOTAO */}
                    <button className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-xl font-semibold">
                        Quero vender meu lixo

                    </button>

                             {/* Beneficios */} {/* colocar icones aqui */}
                            <div className="flex flex-wrap gap-6 mt-10 text-green-800">
                                    <div className="flex items-center gap-2">
                                        <span>100% Grátis</span>
                                    </div>
                                <div className="flex items-center gap-2">
                                    <span>Buscamos na hora</span>
                            </div>
                                <div className="flex items-center gap-2">
                        <span>Pago na hora</span>
                </div>
            
                
                </div> 
            
            </div>
               {/*  Lado Direito*/}
            
                <div className="flex justify-center">
                    <div className="bg-green-50 rounded-xl  shadow-md">
                            <img className="max-w-full h-auto rounded-xl"
                            src={banner} alt="banner EcoTroca" />
                    </div>

                </div>


        </div>
           
           
           
                     

    </section>
  )
}


export default Hero