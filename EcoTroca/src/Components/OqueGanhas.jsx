import React from 'react'
import { Coins, Star, Medal } from "lucide-react";


 const OqueGanhas = () => {
  return (
    <section className='py-20 w-full px-8 bg-[#f9faf7] '> {/* É PARA DAR MAIS ESPAÇO */}
        <div className='max-w-7xl mx-auto px-6'>
            <h1 className='text-4xl font-bold text-green-900 text-center'>
                    O Que Ganhas?
            </h1>
                <p className='text-center text-green-700 mt-2'>
                    Tu escolhes como queres receber. Pode ser dinheiro ou pontos                </p>
                {/* CARDS */}
                <div className='grid md:grid-cols-3 gap-8 mt-12'>
                    {/*  inicio 1 card */}
                     <div  className='bg-white rounded-2xl p-8 shadow text-center'>
                    <Coins size={40} className='text-green-700 mx-auto mb-4 rounded-2xl '></Coins>
                   
                    <h3 className='text-xl font-semibold text-green-900 mb-4'>
                        Dinheiro
                    </h3>
                         <p className=' text-gray-400  '>
                            Recebe dinheiro em mão ou na sua conta bancária 
                         </p>



                </div> {/* fim do 1 card */}

                        {/*  inicio 2 card */}
                         <div  className='bg-white rounded-2xl p-8 shadow text-center'>
                    <Star size={40} className='text-green-700 mx-auto mb-4  rounded-2xl   '></Star>
                    <h3 className='text-xl font-semibold text-green-900 mb-4'>
                        Pontos
                    </h3>
                        <p className=' text-gray-400  '>
                            Junta pontos e troca por prémios
                    </p>

                   

                </div> {/* fim do 2 card */}

                        {/*  inicio 3 card  */}

                     <div  className='bg-white rounded-2xl p-8 shadow text-center'>
                    <Medal size={40} className='text-green-700 mx-auto mb-4  rounded-2xl '></Medal>
                    <h3 className='text-xl font-semibold text-green-900 mb-4'>
                        Medalhas
                    </h3>
                        <p className=' text-gray-400  '>
                            Ganha medalhas e sobe de nível
                    </p>

                   
                </div> {/* fim do 3 card */}


                </div>
                </div>
                
        


    </section>
    
  )
}


export default OqueGanhas
