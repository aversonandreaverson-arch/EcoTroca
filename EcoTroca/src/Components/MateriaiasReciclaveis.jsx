import React from 'react'
import {  Truck,  Package, CreditCard, Paperclip } from "lucide-react";


 const MateriaiasReciclaveis = () => {
  return (
    
        <section id='MateriaisReciclaveis' className='py-20 bg-[#f9faf7] w-full shadow-2xs text-center '>
            <h1 className='text-4xl text-green-900 font-extrabold text-center'>O Que Reciclamos?</h1>
            <p className='text-center text-green-500'>Estes materiais tu podes vender. Vê quanto ganhas por cada quilo(Kg):</p>
            {/* inicio dos cards */}
            <div className='grid md:grid-cols-4 gap-12 mt-8 px-6 md:px-20 lg-20'>
                {/* card 1 */}
                <div className='rounded-2xl bg-green-200 p-13'>
                    <Truck size={70} className='mx-auto'></Truck>
                    <h5 className='text-3xl font-bold'>Plástico</h5>
                    <p className='text-green-900'>Garrafas, tampas, baldes...</p>
                    <div className='bg-green-800 text-center  mt-5 rounded-2xl py-3'>
                        <h6 className='text-white text-3xl'>
                            150 Kz
                        </h6>
                        <p className='text-green-200'>Por um quilo</p>
                    </div>
                </div>
                {/* card 2 */}
                <div className='rounded-2xl bg-green-200 p-13'>
                    <Truck size={70} className='mx-auto'></Truck>
                    <h5 className='text-3xl font-bold'>Vidro</h5>
                    <p className='text-green-900'>Garrafas, Frascos, Copos...</p>
                    <div className='bg-green-800 text-center  mt-5 rounded-2xl py-3'>
                        <h6 className='text-white text-3xl'>
                            100 Kz
                        </h6>
                        <p className='text-green-200'>Por um quilo</p>
                    </div>
                </div>
                {/* card 3 */}
                <div className='rounded-2xl bg-green-200 p-13'>
                    <Truck size={70} className='mx-auto'></Truck>
                    <h5 className='text-3xl font-bold'>Metal</h5>
                    <p className='text-green-900'>Latas, Panelas, ferro...</p>
                    <div className='bg-green-800 text-center  mt-5 rounded-2xl py-3'>
                        <h6 className='text-white text-3xl'>
                            200 Kz
                        </h6>
                        <p className='text-green-200'>Por um quilo</p>
                    </div>
                </div>
                {/* card 4 */}
                <div className='rounded-2xl bg-green-200 p-13'>
                    <Truck size={70} className='mx-auto'></Truck>
                    <h5 className='text-3xl font-bold'>Papel</h5>
                    <p className='text-green-900'>Garrafas, tampas, baldes...</p>
                    <div className='bg-green-800 text-center  mt-5 rounded-2xl py-3'>
                        <h6 className='text-white text-3xl'>
                        80 Kz
                        </h6>
                        <p className='text-green-200'>Por um quilo</p>
                    </div>
                </div>
                

                

                

                


            </div>
        </section>
    
  )
}

export default MateriaiasReciclaveis
