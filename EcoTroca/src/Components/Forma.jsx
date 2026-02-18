// Importa o React para poder criar o componente
import React from 'react'

// Importa os ícones que vamos usar nos cards
import { Home, MapPin } from 'lucide-react'

// Cria o componente Forma
const Forma = () => {
  return (
    // Section principal da área "Duas formas de entregar"
    <section className="py-20 w-full px-8 bg-[#f9faf7]">

      {/* Container para centralizar e limitar a largura */}
      <div className="max-w-6xl mx-auto px-4">

        {/* Título da seção */}
        <h1 className="text-4xl font-bold text-green-900 text-center">
          Duas formas de entregar
        </h1>

        {/* Grid que organiza os 2 cards */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">

          {/* ================= CARD 1 - COLETA EM CASA ================= */}
          <div className="bg-white rounded-2xl p-8 shadow text-center">

            {/* Ícone de casa */}
            <div className="flex justify-center mb-4">
              <Home
                size={40}
                className="text-green-700 bg-amber-50 p-2 rounded-2xl"
              />
            </div>

            {/* Título do card */}
            <h3 className="text-xl font-semibold text-green-900 mb-3">
              Coleta em casa
            </h3>

            {/* Texto explicativo */}
            <p className="text-gray-400">
              O coletador vai até você buscar o material
            </p>
          </div>
          {/* =============== FIM CARD 1 ================= */}


          {/* ================= CARD 2 - LEVAR NO PONTO ================= */}
          <div className="bg-white rounded-2xl p-8 shadow text-center">

            {/* Ícone de localização */}
            <div className="flex justify-center mb-4">
              <MapPin
                size={40}
                className="text-green-700 bg-amber-50 p-2 rounded-2xl"
              />
            </div>

            {/* Título do card */}
            <h3 className="text-xl font-semibold text-green-900 mb-3">
              Leva no ponto
            </h3>

            {/* Texto explicativo */}
            <p className="text-gray-400">
              Você leva o material até um ponto de recolha
            </p>
          </div>
          {/* =============== FIM CARD 2 ================= */}

        </div>
      </div>
    </section>
  )
}

// Exporta o componente para poder usar em outras páginas
export default Forma
