import React from 'react'
import {    Package, Camera, Ruler,  } from "lucide-react";


 const DicasRapidas = () => {
  return (
    <div className='py-20 w-full bg-[#fafaf7] px-6 md:px-12 lg:px-20 '>
        <section className='py-15 bg-white rounded-2xl shadow  px-'>
            <h3 className='text-green-900 text-center text-2xl font-extrabold'>
                Dicas Rápidas
            </h3>
            {/* inicio */}
            <div className='grid md:grid-cols-3 gap-4 mt-8 px-20' >
                {/* card 1 */}
                 <div className='bg-gray-200 rounded-2xl p-8  shadow text-center'>
                    <Package size={40} className='text-green-900 mx-auto mb-4   '> </Package>
                    <p className=' font-semibold  text-green-500 '>
                        Lava e seca <br /> o material antes
                    </p>
                    
                </div>
                 {/* card 2 */}
                 <div className='bg-gray-200 rounded-2xl p-8  shadow text-center'>
                    <Ruler size={40} className='text-green-900 mx-auto mb-4   '> </Ruler>
                    <p className=' font-semibold  text-green-500 '>
                        Minímo 1kg <br /> por tipo
                    </p>
                    
                </div>
                 {/* card 3 */}
                 <div className='bg-gray-200 rounded-2xl p-8  shadow text-center'>
                    <Camera size={40} className='text-green-900 mx-auto mb-4   '> </Camera>
                    <p className=' font-semibold  text-green-500 '>
                        Tira foto para  <br /> o pedido
                    </p>
                    
                </div>

            </div>
            

        </section>

    </div>
        )
}


export default DicasRapidas
