import React from 'react'
import {  Truck,  Package, CreditCard, Paperclip } from "lucide-react";


 const PassosSimples = () => {
  return (
    <div className='py-20 w-full bg-[#f9faf7] shadow-2xs px-6 md:px-12 lg:px-20 '>
        <section className='py-20 w-full bg-green-800 rounded-2xl px-6 md:px-12 lg:px-20  '>
            <div>
                <h1 className='text-2xl text-white font-bold  text-center '>Só 4 Passos Simples</h1>

            </div>
            <div className='grid md:grid-cols-4 gap-5 mt-8 '>
                <div className='bg-green-600 rounded-2xl p-8 shadow text-center'>
                    <Paperclip size={40} className='text-green-900 mx-auto mb-4   '> </Paperclip>
                    <h1 className='text-3xl font-semibold text-white mb-4'>
                        1
                    </h1>
                    <h2 className='text-2xl font-semibold text-white mb-4'>
                        CADASTRA
                    </h2>
                        <p className=' text-white  '>
                            Cria a sua conta, grátis!
                        </p>
                </div> {/* fim do 1 card */}

                <div className='bg-green-600 rounded-2xl p-8 shadow text-center'>
                    <Package size={40} className='text-green-900 mx-auto mb-4   '> </Package>
                    <h1 className='text-3xl font-semibold text-white mb-4'>
                        2
                    </h1>
                    <h2 className='text-2xl font-semibold text-white mb-4'>
                        Pede Coleta
                    </h2>
                        <p className=' text-white  '>
                        Publica o que tens para reciclar
                        </p>
                </div> {/* fim do 2 card */}

                <div className='bg-green-600 rounded-2xl p-8 shadow text-center'>
                    <Truck size={40} className='text-green-900 mx-auto mb-4   '> </Truck>
                    <h1 className='text-3xl font-semibold text-white mb-4'>
                        3
                    </h1>
                    <h2 className='text-2xl font-semibold text-white mb-4'>
                        Entrega
                    </h2>
                        <p className=' text-white  '>
                            O coletador(a) busca ou tu levas
                        </p>
                </div> {/* fim do 3 card */}

                <div className='bg-green-600 rounded-2xl p-8 shadow text-center'>
                    <CreditCard size={40} className='text-green-900 mx-auto mb-4   '> </CreditCard>
                    <h1 className='text-3xl font-semibold text-white mb-4'>
                        4
                    </h1>
                    <h2 className='text-2xl font-semibold text-white mb-4'>
                        Recebe
                    </h2>
                        <p className=' text-white  '>
                            Ganhe dinheiro e Pontos 
                        </p>
                </div> {/* fim do 4 card */}



            </div>
                
        </section>

    </div> 
       
  )
}


export default PassosSimples;
