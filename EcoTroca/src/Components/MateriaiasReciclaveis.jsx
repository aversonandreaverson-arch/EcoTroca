// Importa o React
import React from "react"

// Importa os ícones usados nos cards
import { Truck } from "lucide-react"

// Cria o componente MateriaiasReciclaveis
const MateriaiasReciclaveis = () => {
  return (
    // Section principal com ID para navegação
    <section
      id="MateriaisReciclaveis"
      className="py-20 bg-[#f9faf7] w-full shadow-2xs text-center"
    >
      {/* Título principal */}
      <h1 className="text-4xl text-green-900 font-extrabold text-center">
        O Que Reciclamos?
      </h1>

      {/* Texto explicativo */}
      <p className="text-center text-green-500 mt-2">
        Estes materiais tu podes vender. Vê quanto ganhas por cada quilo(Kg):
      </p>

      {/* Grid com os 4 cards */}
      <div className="grid md:grid-cols-4 gap-12 mt-8 px-6 md:px-20 lg:px-20">

        {/* ================= CARD 1 - PLÁSTICO ================= */}
        <div className="rounded-2xl bg-green-200 p-8">
          {/* Ícone */}
          <Truck size={70} className="mx-auto mb-4" />

          {/* Título do material */}
          <h5 className="text-3xl font-bold mb-2">Plástico</h5>

          {/* Descrição */}
          <p className="text-green-900">Garrafas, tampas, baldes...</p>

          {/* Preço por quilo */}
          <div className="bg-green-800 text-center mt-5 rounded-2xl py-3">
            <h6 className="text-white text-3xl">150 Kz</h6>
            <p className="text-green-200">Por um quilo</p>
          </div>
        </div>
        {/* =============== FIM CARD 1 ================= */}


        {/* ================= CARD 2 - VIDRO ================= */}
        <div className="rounded-2xl bg-green-200 p-8">
          <Truck size={70} className="mx-auto mb-4" />
          <h5 className="text-3xl font-bold mb-2">Vidro</h5>
          <p className="text-green-900">Garrafas, Frascos, Copos...</p>
          <div className="bg-green-800 text-center mt-5 rounded-2xl py-3">
            <h6 className="text-white text-3xl">100 Kz</h6>
            <p className="text-green-200">Por um quilo</p>
          </div>
        </div>
        {/* =============== FIM CARD 2 ================= */}


        {/* ================= CARD 3 - METAL ================= */}
        <div className="rounded-2xl bg-green-200 p-8">
          <Truck size={70} className="mx-auto mb-4" />
          <h5 className="text-3xl font-bold mb-2">Metal</h5>
          <p className="text-green-900">Latas, Panelas, ferro...</p>
          <div className="bg-green-800 text-center mt-5 rounded-2xl py-3">
            <h6 className="text-white text-3xl">200 Kz</h6>
            <p className="text-green-200">Por um quilo</p>
          </div>
        </div>
        {/* =============== FIM CARD 3 ================= */}


        {/* ================= CARD 4 - PAPEL ================= */}
        <div className="rounded-2xl bg-green-200 p-8">
          <Truck size={70} className="mx-auto mb-4" />
          <h5 className="text-3xl font-bold mb-2">Papel</h5>
          <p className="text-green-900">Jornais, cadernos, caixas...</p>
          <div className="bg-green-800 text-center mt-5 rounded-2xl py-3">
            <h6 className="text-white text-3xl">80 Kz</h6>
            <p className="text-green-200">Por um quilo</p>
          </div>
        </div>
        {/* =============== FIM CARD 4 ================= */}

      </div>
      {/* =============== FIM GRID ================= */}
    </section>
  )
}

// Exporta o componente
export default MateriaiasReciclaveis
