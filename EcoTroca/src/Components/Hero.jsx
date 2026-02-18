// Importa o React
import React from "react"

// Importa a imagem do banner
import banner from "../assets/ecotroca-banner-5-0.png"

// Cria o componente Hero
export const Hero = () => {
  return (
    // Section principal do Hero
    <section className="w-full px-8 py-16 bg-[#f9faf7]">

      {/* Container central com grid para organizar texto e imagem */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* ================= LADO ESQUERDO ================= */}
        <div>

          {/* Título principal */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 leading-tight mb-6">
            Tens Lixo em casa? <br />
            <span className="text-green-600">
              Nós pagamos
            </span>
          </h1>

          {/* Descrição curta */}
          <p className="text-green-800 max-w-xl mb-8">
            Plástico, vidro, metal, papel... Tudo que podes reciclar, nós compramos de ti. <br />
            <strong>É fácil e grátis</strong>
          </p>

          {/* Botão principal */}
          <button className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-xl font-semibold">
            Quero vender meu lixo
          </button>

          {/* Benefícios rápidos abaixo do botão */}
          <div className="flex flex-wrap gap-6 mt-10 text-green-800">
            {/* Benefício 1 */}
            <div className="flex items-center gap-2">
              <span>100% Grátis</span>
            </div>

            {/* Benefício 2 */}
            <div className="flex items-center gap-2">
              <span>Buscamos na hora</span>
            </div>

            {/* Benefício 3 */}
            <div className="flex items-center gap-2">
              <span>Pago na hora</span>
            </div>
          </div>
        </div>
        {/* =============== FIM LADO ESQUERDO ================= */}


        {/* ================= LADO DIREITO ================= */}
        <div className="flex justify-center">

          {/* Caixa que envolve a imagem para sombra e borda arredondada */}
          <div className="bg-green-50 rounded-xl shadow-md">

            {/* Imagem do banner */}
            <img
              className="max-w-full h-auto rounded-xl"
              src={banner}
              alt="banner EcoTroca"
            />
            {/* md:max-w-md ajuda a limitar o tamanho da imagem em telas menores */}
          </div>
        </div>
        {/* =============== FIM LADO DIREITO ================= */}

      </div>
    </section>
  )
}

// Exporta o componente Hero
export default Hero
