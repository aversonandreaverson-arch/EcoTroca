import React from "react";

// Componente funcional para publicar um novo resíduo
export default function NovoResiduo() {
  return (
    // Container principal da página, ocupa toda a tela e centraliza o conteúdo
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      
      {/* Card branco centralizado */}
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">

        {/* Título da página */}
        <h2 className="text-2xl font-bold mb-6 text-green-700">
          Publicar Novo Resíduo
        </h2>

        {/* Área de Upload */}
        <div className="border-2 border-dashed border-green-400 rounded-xl p-6 text-center mb-4 cursor-pointer hover:bg-green-50 transition">
          <p className="text-gray-500">
            Clique ou arraste para enviar <br />
            <span className="text-xs">
              Imagens ou vídeos (máx. 50MB)
            </span>
          </p>
        </div>

        {/* Seleção de Categoria */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">
            Categoria
          </label>
          <select className="w-full border rounded-lg p-2">
            <option>Selecione a categoria...</option>
            <option>Plástico</option>
            <option>Vidro</option>
            <option>Papel</option>
            <option>Metal</option>
          </select>
        </div>

        {/* Input de Peso */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">
            Peso (kg)
          </label>
          <input
            type="number"
            placeholder="0.0"
            className="w-full border rounded-lg p-2"
          />
        </div>

        {/* Tipo de Recompensa */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">
            Tipo de Recompensa
          </label>

          <div className="space-y-2">
            {/* Opção Dinheiro */}
            <div className="border rounded-lg p-3 cursor-pointer hover:bg-green-50">
              💰 Dinheiro
              <p className="text-xs text-gray-500">50 Kz por kg</p>
            </div>

            {/* Opção Pontos */}
            <div className="border rounded-lg p-3 cursor-pointer hover:bg-green-50">
              🪙 Pontos
              <p className="text-xs text-gray-500">10 pontos por kg</p>
            </div>
          </div>
        </div>

        {/* Descrição do Resíduo */}
        <div className="mb-6">
          <label className="block mb-1 text-sm font-medium">
            Descrição
          </label>
          <textarea
            placeholder="Descreva o resíduo..."
            className="w-full border rounded-lg p-2"
          />
        </div>

        {/* Botões de ação */}
        <div className="flex justify-between">
          {/* Cancelar */}
          <button className="bg-gray-300 px-4 py-2 rounded-lg">
            Cancelar
          </button>

          {/* Publicar */}
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg">
            Publicar
          </button>
        </div>

      </div>
    </div>
  );
}
