// Importa o React, que é a base para criar componentes
import React from 'react'

// Importa os ícones que vão ser usados nos cards
import {
  User,
  Truck,
  Building2,
  Smartphone,
  Coins,
  Home,
  MapPin,
  Package,
  CreditCard,
  Scale
} from "lucide-react";

// Cria o componente chamado ComoFunciona
const ComoFunciona = () => {
  return (
    // Section principal da parte "Como Funciona"
    <section
      id="ComoFunciona" // ID para poder navegar até essa parte da página
      className="py-20 w-full px-8 bg-[#f9faf7]" // Espaçamento e cor de fundo
    >

      {/* Container central para limitar a largura do conteúdo */}
      <div className="max-w-7xl mx-auto px-6">

        {/* Título principal */}
        <h1 className="text-4xl font-bold text-green-900 text-center">
          Como Funciona
        </h1>

        {/* Texto abaixo do título */}
        <p className="text-center text-green-700 mt-2">
          É muito fácil! Escolhe o que combina contigo
        </p>

        {/* Grid que organiza os 3 cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-12">

          {/* ================= CARD 1 - USUÁRIO ================= */}
          <div className="bg-white rounded-2xl p-8 shadow text-center">

            {/* Ícone do usuário */}
            <User
              size={40}
              className="text-green-700 mx-auto mb-4 bg-amber-50 rounded-2xl"
            />

            {/* Tipo de perfil */}
            <p className="text-gray-400">USUÁRIO</p>

            {/* Título do card */}
            <h3 className="text-xl font-semibold text-green-900 mb-4">
              Eu Tenho Lixo
            </h3>

            {/* Descrição */}
            <p className="text-gray-400">
              Você tem lixo reciclável em casa?
              <br />
              Nós pagamos por ele!
            </p>

            {/* Lista de ações do usuário */}
            <ul className="space-y-2 text-green-900 text-sm mt-4">
              <li className="bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl flex items-center gap-2 justify-center">
                <Smartphone size={16} />
                Pede coleta pelo celular
              </li>

              <li className="bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl flex items-center gap-2 justify-center">
                <Coins size={16} />
                Ganha dinheiro ou pontos
              </li>

              <li className="bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl flex items-center gap-2 justify-center">
                <Home size={16} />
                Coleta na sua casa
              </li>
            </ul>
          </div>
          {/* =============== FIM CARD 1 ================= */}


          {/* ================= CARD 2 - COLETADOR ================= */}
          <div className="bg-white rounded-2xl p-8 shadow text-center">

            {/* Ícone do coletador */}
            <Truck
              size={40}
              className="text-green-700 mx-auto mb-4 bg-amber-50 rounded-2xl"
            />

            {/* Tipo de perfil */}
            <p className="text-gray-400">COLETADOR(A)</p>

            {/* Título do card */}
            <h3 className="text-xl font-semibold text-green-900 mb-4">
              Eu Coleto Lixo
            </h3>

            {/* Descrição */}
            <p className="text-gray-400">
              Quer ganhar dinheiro recolhendo materiais?
              <br />
              Seja um coletador(a)!
            </p>

            {/* Lista de ações do coletador */}
            <ul className="space-y-2 text-green-900 text-sm mt-4">
              <li className="bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl flex items-center gap-2 justify-center">
                <MapPin size={16} />
                Vê pedidos perto de você
              </li>

              <li className="bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl flex items-center gap-2 justify-center">
                <Package size={16} />
                Recolhe o material
              </li>

              <li className="bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl flex items-center gap-2 justify-center">
                <Coins size={16} />
                Recebe por cada coleta
              </li>
            </ul>
          </div>
          {/* =============== FIM CARD 2 ================= */}


          {/* ================= CARD 3 - EMPRESA ================= */}
          <div className="bg-white rounded-2xl p-8 shadow text-center">

            {/* Ícone da empresa */}
            <Building2
              size={40}
              className="text-green-700 mx-auto mb-4 bg-amber-50 rounded-2xl"
            />

            {/* Tipo de perfil */}
            <p className="text-gray-400">EMPRESA</p>

            {/* Título do card */}
            <h3 className="text-xl font-semibold text-green-900 mb-4">
              Compro Materiais
            </h3>

            {/* Descrição */}
            <p className="text-gray-400">
              Sua empresa compra materiais recicláveis?
              <br />
              Receba de forma organizada!
            </p>

            {/* Lista de ações da empresa */}
            <ul className="space-y-2 text-green-900 text-sm mt-4">
              <li className="bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl flex items-center gap-2 justify-center">
                <Package size={16} />
                Recebe materiais separados
              </li>

              <li className="bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl flex items-center gap-2 justify-center">
                <Scale size={16} />
                Pesa e confirma
              </li>

              <li className="bg-gray-300 m-3 rounded-2xl py-3 shadow-2xl flex items-center gap-2 justify-center">
                <CreditCard size={16} />
                Paga automaticamente
              </li>
            </ul>
          </div>
          {/* =============== FIM CARD 3 ================= */}

        </div>
      </div>
    </section>
  )
}

// Exporta o componente para poder usar em outras partes do projeto
export default ComoFunciona
