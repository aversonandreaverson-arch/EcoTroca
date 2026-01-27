import React from 'react'
import {  Home, MapPin } from 'lucide-react'


 const Forma = () => {
  return (
    <section className='py-20 w-full px-8 bg-[#f9faf7]'> 
         <div className='max-w-6xl mx-auto px-1'>
            <h1 className='text-4xl font-bold text-green-900 text-center '>Duas formas de entregar</h1>
            {/* CARDS */}
                <div className='grid md:grid-cols-2 gap-8 mt-12'>
                    {/*  inicio 1 card */}
                     <div  className='bg-white rounded-2xl p-8 shadow text-center'>
                    <Home size={40} className='text-green-700 mx-auto mb-4 bg-amber-50 rounded-2xl '></Home>
                  
                    <h3 className='text-xl font-semibold text-green-900 mb-4'>
                        Coleta em casa
                    </h3>
                         <p className=' text-gray-400  '>
                            O coletador vai até você buscar o material    
                        </p>
                </div>
                        {/*  inicio 2 card */}
                     <div  className='bg-white rounded-2xl p-8 shadow text-center'>
                    <MapPin size={40} className='text-green-700 mx-auto mb-4 bg-amber-50 rounded-2xl '></MapPin>
                   
                    <h3 className='text-xl font-semibold text-green-900 mb-4'>
                        Leva No Ponto
                    </h3>
                         <p className=' text-gray-400  '>
                            Você leva o material até um ponto de recolha
                    </p>
                </div>
                </div>

         </div>
        
    </section>
  )
}

export default Forma
