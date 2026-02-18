// Importa o React
import React from 'react'

// Importa os ícones usados nos cards
import { Package, Camera, Ruler } from "lucide-react"

// Cria o componente DicasRapidas
const DicasRapidas = () => {
  return (
    // Container externo com espaçamento e cor de fundo
    <div className="py-20 w-full bg-[#fafaf7] px-6 md:px-12 lg:px-20">

      {/* Section principal com fundo branco e bordas arredondadas */}
      <section className="py-15 bg-white rounded-2xl shadow px-6">

        {/* Título da seção */}
        <h3 className="text-green-900 text-center text-2xl font-extrabold">
          Dicas Rápidas
        </h3>

        {/* Grid que organiza os 3 cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8 px-4">

          {/* ================= CARD 1 ================= */}
          <div className="bg-gray-200 rounded-2xl p-8 shadow text-center">

            {/* Ícone do card */}
            <Package size={40} className="text-green-900 mx-auto mb-4" />

            {/* Texto explicativo */}
            <p className="font-semibold text-green-500">
              Lava e seca <br /> o material antes
            </p>
          </div>
          {/* =============== FIM CARD 1 ================= */}


          {/* ================= CARD 2 ================= */}
          <div className="bg-gray-200 rounded-2xl p-8 shadow text-center">

            {/* Ícone do card */}
            <Ruler size={40} className="text-green-900 mx-auto mb-4" />

            {/* Texto explicativo */}
            <p className="font-semibold text-green-500">
              Minímo 1kg <br /> por tipo
            </p>
          </div>
          {/* =============== FIM CARD 2 ================= */}


          {/* ================= CARD 3 ================= */}
          <div className="bg-gray-200 rounded-2xl p-8 shadow text-center">

            {/* Ícone do card */}
            <Camera size={40} className="text-green-900 mx-auto mb-4" />

            {/* Texto explicativo */}
            <p className="font-semibold text-green-500">
              Tira foto para <br /> o pedido
            </p>
          </div>
          {/* =============== FIM CARD 3 ================= */}

        </div>
      </section>
    </div>
  )
}

// Exporta o componente para poder usar em outras partes do projeto
export default DicasRapidas
