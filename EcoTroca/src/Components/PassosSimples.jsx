// Importa o React para poder criar componentes
import React from 'react'

// Importa os ícones que vão ser usados nos passos
import { Truck, Package, CreditCard, Paperclip } from "lucide-react"

// Cria o componente PassosSimples
const PassosSimples = () => {
  return (
    // Container externo que cria espaço em cima e em baixo
    <div className="py-20 w-full bg-[#f9faf7] px-6 md:px-12 lg:px-20">

      {/* Section principal com fundo verde */}
      <section className="py-20 w-full bg-green-800 rounded-2xl px-6 md:px-12 lg:px-20">

        {/* Título da seção */}
        <h1 className="text-2xl text-white font-bold text-center">
          Só 4 Passos Simples
        </h1>

        {/* Grid que organiza os 4 passos */}
        <div className="grid md:grid-cols-4 gap-5 mt-8">

          {/* ================= PASSO 1 ================= */}
          <div className="bg-green-600 rounded-2xl p-8 shadow text-center">

            {/* Ícone do passo */}
            <Paperclip size={40} className="text-green-900 mx-auto mb-4" />

            {/* Número do passo */}
            <h1 className="text-3xl font-semibold text-white mb-2">
              1
            </h1>

            {/* Título do passo */}
            <h2 className="text-2xl font-semibold text-white mb-3">
              Cadastra
            </h2>

            {/* Texto explicativo */}
            <p className="text-white">
              Cria a sua conta, grátis!
            </p>
          </div>
          {/* =============== FIM PASSO 1 ================= */}


          {/* ================= PASSO 2 ================= */}
          <div className="bg-green-600 rounded-2xl p-8 shadow text-center">

            {/* Ícone do passo */}
            <Package size={40} className="text-green-900 mx-auto mb-4" />

            {/* Número do passo */}
            <h1 className="text-3xl font-semibold text-white mb-2">
              2
            </h1>

            {/* Título do passo */}
            <h2 className="text-2xl font-semibold text-white mb-3">
              Pede coleta
            </h2>

            {/* Texto explicativo */}
            <p className="text-white">
              Publica o que tens para reciclar
            </p>
          </div>
          {/* =============== FIM PASSO 2 ================= */}


          {/* ================= PASSO 3 ================= */}
          <div className="bg-green-600 rounded-2xl p-8 shadow text-center">

            {/* Ícone do passo */}
            <Truck size={40} className="text-green-900 mx-auto mb-4" />

            {/* Número do passo */}
            <h1 className="text-3xl font-semibold text-white mb-2">
              3
            </h1>

            {/* Título do passo */}
            <h2 className="text-2xl font-semibold text-white mb-3">
              Entrega
            </h2>

            {/* Texto explicativo */}
            <p className="text-white">
              O coletador(a) busca ou tu levas
            </p>
          </div>
          {/* =============== FIM PASSO 3 ================= */}


          {/* ================= PASSO 4 ================= */}
          <div className="bg-green-600 rounded-2xl p-8 shadow text-center">

            {/* Ícone do passo */}
            <CreditCard size={40} className="text-green-900 mx-auto mb-4" />

            {/* Número do passo */}
            <h1 className="text-3xl font-semibold text-white mb-2">
              4
            </h1>

            {/* Título do passo */}
            <h2 className="text-2xl font-semibold text-white mb-3">
              Recebe
            </h2>

            {/* Texto explicativo */}
            <p className="text-white">
              Ganhe dinheiro e pontos
            </p>
          </div>
          {/* =============== FIM PASSO 4 ================= */}

        </div>
      </section>
    </div>
  )
}

// Exporta o componente para poder usar noutras partes do projeto
export default PassosSimples
