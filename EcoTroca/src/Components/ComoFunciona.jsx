import React from 'react'
import { User, Truck, Building2, Smartphone, Coins, Home, MapPin, Package, CreditCard, Scale } from "lucide-react";


 const ComoFunciona = () => {
  return (
    
        
    <section className='py-20 w-full px-8 bg-[#f9faf7] '> {/* É PARA DAR MAIS ESPAÇO */}
        <div className='max-w-7xl mx-auto px-6'>
            <h1 className='text-4xl font-bold text-green-900 text-center'>
                    Como Funciona 
            </h1>
                <p className='text-center text-green-700 mt-2'>
                    É muito fácil! Escolhe o que combina contigo
                </p>
                {/* CARDS */}
                <div className='grid md:grid-cols-3 gap-8 mt-12'>
                    {/*  inicio 1 card */}
                     <div  className='bg-white rounded-2xl p-8 shadow text-center'>
                    <User size={40} className='text-green-700 mx-auto mb-4 bg-amber-50 rounded-2xl '></User>
                    <p className=' text-gray-400 '>
                        USUÁRIO
                    </p>
                    <h3 className='text-xl font-semibold text-green-900 mb-4'>
                        Eu Tenho Lixo
                    </h3>
                         <p className=' text-gray-400  '>
                            Você tem lixo reciclável em casa?
                            <br />
                            Nós pagamos por ele!
                    </p>

                    <ul className='space-y-2 text-green-900 text-sm '>
                        <div className=''>
                                <li className='bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl ' > <Smartphone size={16}></Smartphone> Pede coleta pelo celular</li>
                                <li className='bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl'> <Coins size={16}></Coins>Ganha dinheiro ou pontos</li>
                                <li className='bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl'> <Home size={16}></Home> Coleta na sua casa</li>

                        </div>
                        
                    </ul>


                </div> {/* fim do 1 card */}

                        {/*  inicio 2 card */}
                         <div  className='bg-white rounded-2xl p-8 shadow text-center'>
                    <Truck size={40} className='text-green-700 mx-auto mb-4 bg-amber-50 rounded-2xl   '></Truck>
                    <p className=' text-gray-400'>
                        COLETADOR(A)
                    </p>
                    <h3 className='text-xl font-semibold text-green-900 mb-4'>
                        Eu Coleto Lixo
                    </h3>
                        <p className=' text-gray-400  '>
                            Quer ganhar dinheiro recolhendo materiais?
                            <br />
                            Seja um coletador(a)!
                    </p>

                    <ul className='space-y-2 text-green-900 text-sm'>
                        <div className='bg-white gap-0.5 shadow-black'>
                                <li className='bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl'> <MapPin size={16}></MapPin> Vê pedidos perto de você</li>
                                <li className='bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl'> <Package size={16}></Package> Recolhe o material</li>
                                <li className='bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl'> <Coins size={16}></Coins> Recebe por cada coleta</li>

                        </div>
                        
                    </ul>


                </div> {/* fim do 2 card */}

                        {/*  inicio 3 card  */}

                     <div  className='bg-white rounded-2xl p-8 shadow text-center'>
                    <Building2 size={40} className='text-green-700 mx-auto mb-4 bg-amber-50 rounded-2xl '></Building2>
                    <p className=' text-gray-400'>
                        EMPRESA
                    </p>
                    <h3 className='text-xl font-semibold text-green-900 mb-4'>
                        Compro Materiais
                    </h3>
                        <p className=' text-gray-400  '>
                            Sua empresa compra materiais recicláveis?
                            <br />
                            Receba de forma organizada!
                    </p>

                    <ul className='space-y-2 text-green-900 text-sm'>
                        <div className=''>
                                <li className='bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl'> <Package size={16}></Package> Recebe materiais separados</li>
                                <li className='bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl'> <Scale size={16}></Scale>Pesa e confirma</li>
                                <li className='bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl'> <CreditCard size={16}></CreditCard> Paga automaticamente</li>

                        </div>
                        
                    </ul>


                </div> {/* fim do 3 card */}


                </div>
                </div>
                
        


    </section>
       
          
          
    

    
    
  )
}

export default ComoFunciona 
