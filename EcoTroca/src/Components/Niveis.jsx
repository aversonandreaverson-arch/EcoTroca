// Importa o React
import React from "react"

// Importa os ícones usados nos cards
import { LineChart, TreeDeciduous, Medal, Recycle } from "lucide-react"

// Cria o componente Niveis
const Niveis = () => {
  return (
    // Container externo com espaçamento e fundo cinza claro
    <div className="py-20 w-full bg-[#fafaf7] px-6 md:px-12 lg:px-20">

      {/* Section principal com fundo branco e bordas arredondadas */}
      <section className="py-15 bg-white rounded-2xl shadow px-6">

        {/* Título da seção */}
        <h3 className="text-green-900 text-center text-2xl font-extrabold">
          Níveis - Quanto mais reciclas, mais sobes!
        </h3>

        {/* Grid que organiza os 4 cards */}
        <div className="grid md:grid-cols-4 gap-4 mt-8 px-4">

          {/* ================= CARD 1 - INICIANTE ================= */}
          <div className="bg-gray-200 rounded-2xl p-8 shadow text-center">
            {/* Ícone */}
            <LineChart size={40} className="text-green-900" />
            {/* Nome do nível */}
            <h2 className="text-green-900 font-bold mt-2">Iniciante</h2>
            {/* Pontos */}
            <p className="font-semibold text-green-500">0 Pontos</p>
          </div>
          {/* =============== FIM CARD 1 ================= */}


          {/* ================= CARD 2 - RECICLADOR ================= */}
          <div className="bg-gray-200 rounded-2xl p-8 shadow text-center">
            <Recycle size={40} className="text-green-900" />
            <h2 className="text-green-900 font-bold mt-2">Reciclador</h2>
            <p className="font-semibold text-green-500">100 Pontos</p>
          </div>
          {/* =============== FIM CARD 2 ================= */}


          {/* ================= CARD 3 - ECO-HERÓI ================= */}
          <div className="bg-gray-200 rounded-2xl p-8 shadow text-center">
            <TreeDeciduous size={40} className="text-green-900" />
            <h2 className="text-green-900 font-bold mt-2">Eco-Herói</h2>
            <p className="font-semibold text-green-500">500 Pontos</p>
          </div>
          {/* =============== FIM CARD 3 ================= */}


          {/* ================= CARD 4 - CAMPEÃO VERDE ================= */}
          <div className="bg-gray-200 rounded-2xl p-8 shadow text-center">
            <Medal size={40} className="text-green-900" />
            <h2 className="text-green-900 font-bold mt-2">Campeão Verde</h2>
            <p className="font-semibold text-green-500">1000 Pontos</p>
          </div>
          {/* =============== FIM CARD 4 ================= */}

        </div>
        {/* =============== FIM GRID ================= */}

      </section>
    </div>
  )
}

// Exporta o componente
export default Niveis
