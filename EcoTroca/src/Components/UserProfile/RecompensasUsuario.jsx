import React from 'react'

export default function RecompensasUsuario() {
  // MOCK DATA: substituir pelo backend depois
  const recompensas = {
    dinheiro: 1500,
    pontos: 240,
    saldo: 800
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-green-800 mb-4">Minhas Recompensas 🎁</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="border rounded-lg p-4">
          <p className="text-green-800 font-bold">💰 {recompensas.dinheiro} Kz</p>
          <p className="text-gray-500 text-sm">Dinheiro</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-green-800 font-bold">⭐ {recompensas.pontos}</p>
          <p className="text-gray-500 text-sm">Pontos</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-green-800 font-bold">💳 {recompensas.saldo} Kz</p>
          <p className="text-gray-500 text-sm">Saldo EcoTroca</p>
        </div>
      </div>
    </div>
  );
}
