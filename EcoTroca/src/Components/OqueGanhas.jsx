// Importa o React
import React from 'react'

// Importa os ícones que serão usados nos cards
import { Coins, Star, Medal } from "lucide-react"

// Cria o componente OqueGanhas
const OqueGanhas = () => {
  return (
    // Section principal da área "O Que Ganhas"
    <section
      id="OqueGanhas" // ID para navegar até esta seção
      className="py-20 w-full px-8 bg-[#f9faf7]" // Espaçamento e cor de fundo
    >

      {/* Container central para limitar largura e centralizar */}
      <div className="max-w-7xl mx-auto px-6">

        {/* Título principal */}
        <h1 className="text-4xl font-bold text-green-900 text-center">
          O Que Ganhas?
        </h1>

        {/* Texto explicativo abaixo do título */}
        <p className="text-center text-green-700 mt-2">
          Tu escolhes como queres receber. Pode ser dinheiro ou pontos
        </p>

        {/* Grid que organiza os 3 cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-12">

          {/* ================= CARD 1 - DINHEIRO ================= */}
          <div className="bg-white rounded-2xl p-8 shadow text-center">

            {/* Ícone do card */}
            <Coins size={40} className="text-green-700 mx-auto mb-4 rounded-2xl" />

            {/* Título do card */}
            <h3 className="text-xl font-semibold text-green-900 mb-4">
              Dinheiro
            </h3>

            {/* Descrição */}
            <p className="text-gray-400">
              Recebe dinheiro em mão ou na sua conta bancária
            </p>
          </div>
          {/* =============== FIM CARD 1 ================= */}


          {/* ================= CARD 2 - PONTOS ================= */}
          <div className="bg-white rounded-2xl p-8 shadow text-center">

            {/* Ícone do card */}
            <Star size={40} className="text-green-700 mx-auto mb-4 rounded-2xl" />

            {/* Título do card */}
            <h3 className="text-xl font-semibold text-green-900 mb-4">
              Pontos
            </h3>

            {/* Descrição */}
            <p className="text-gray-400">
              Junta pontos e troca por prémios
            </p>
          </div>
          {/* =============== FIM CARD 2 ================= */}


          {/* ================= CARD 3 - MEDALHAS ================= */}
          <div className="bg-white rounded-2xl p-8 shadow text-center">

            {/* Ícone do card */}
            <Medal size={40} className="text-green-700 mx-auto mb-4 rounded-2xl" />

            {/* Título do card */}
            <h3 className="text-xl font-semibold text-green-900 mb-4">
              Medalhas
            </h3>

            {/* Descrição */}
            <p className="text-gray-400">
              Ganha medalhas e sobe de nível
            </p>
          </div>
          {/* =============== FIM CARD 3 ================= */}

        </div>
      </div>
    </section>
  )
}

// Exporta o componente para ser usado em outras partes do projeto
export default OqueGanhas
