import React from 'react'

export default function Dashboard() {
  // MOCK DATA: substituir pelo backend depois
  const usuario = {
    nome: "Áverson",
    nivel: "EcoAmigo - Nível 3",
    pontos: 240,
    totalTrocas: 12
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-green-800 mb-2">Bem-vindo, {usuario.nome} </h2>
      <p className="text-gray-600 mb-4">{usuario.nivel}</p>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-green-800 font-bold">{usuario.pontos}</p>
          <p className="text-gray-500 text-sm">Pontos</p>
        </div>
        <div>
          <p className="text-green-800 font-bold">{usuario.totalTrocas}</p>
          <p className="text-gray-500 text-sm">Trocas</p>
        </div>
        <div>
          <p className="text-green-800 font-bold">#12</p>
          <p className="text-gray-500 text-sm">Ranking</p>
        </div>
      </div>
    </div>
  );
}
