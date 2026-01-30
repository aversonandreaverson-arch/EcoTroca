import React from 'react'
import {    LineChart, TreeDeciduous, Medal, Recycle   } from "lucide-react";


 const Niveis = () => {
  return (
     <div className='py-20 w-full bg-[#fafaf7] px-6 md:px-12 lg:px-20 '>
             <section className='py-15 bg-white rounded-2xl shadow  px-'>
                 <h3 className='text-green-900 text-center text-2xl font-extrabold'>
                     Níveis - Quanto mais reciclas, mais sobes!
                 </h3>
                 {/* inicio */}
                    <div className='grid md:grid-cols-4 gap-4 mt-8 px-20' >
                     {/* card 1 */}
                      <div className='bg-gray-200 rounded-2xl p-8  shadow text-center'>
                         <LineChart size={40} className='text-green-900'> </LineChart>
                         <h2 className='text-green-900 font-bold'>
                            Iniciante
                         </h2>
                         <p className=' font-semibold  text-green-500 '>
                            0 Pontos
                         </p>
                         
                     </div>
                      {/* card 2 */}
                       <div className='bg-gray-200 rounded-2xl p-8  shadow text-center'>
                         <Recycle size={40} className='text-green-900'> </Recycle>
                         <h2 className='text-green-900 font-bold'>
                            Reciclador
                         </h2>
                         <p className=' font-semibold  text-green-500 '>
                            100 Pontos
                         </p>
                         
                     </div>
                     {/* card 3 */}
                       <div className='bg-gray-200 rounded-2xl p-8  shadow text-center'>
                         <TreeDeciduous size={40} className='text-green-900'> </TreeDeciduous>
                         <h2 className='text-green-900 font-bold'>
                            Eco-Herói
                         </h2>
                         <p className=' font-semibold  text-green-500 '>
                            500 Pontos
                         </p>
                         
                     </div>
                     {/* card 4 */}
                      <div className='bg-gray-200 rounded-2xl p-8  shadow text-center'>
                         <Medal size={40} className='text-green-900'> </Medal>
                         <h2 className='text-green-900 font-bold'>
                            Campeão Verde                         </h2>
                         <p className=' font-semibold  text-green-500 '>
                            1000 Pontos
                         </p>
                         
                    </div>



                     
                 </div>
                 
     
             </section>
     
         </div>
         
    
  )
}

export default Niveis
