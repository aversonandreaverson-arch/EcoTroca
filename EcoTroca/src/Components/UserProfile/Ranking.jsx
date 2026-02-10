import React from 'react'

export default function Ranking() {
  const ranking = [
    { nome: "Maria", pontos: 500 },
    { nome: "Áverson", pontos: 240 },
    { nome: "João", pontos: 180 }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-green-800 mb-4">Ranking 🌍</h3>
      <ol className="list-decimal pl-5 space-y-1">
        {ranking.map((user, i) => (
          <li key={i} className="text-gray-700">
            {user.nome} - {user.pontos} pts
          </li>
        ))}
      </ol>
    </div>
  );
}
