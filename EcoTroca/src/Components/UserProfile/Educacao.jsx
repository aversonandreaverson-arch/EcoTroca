import React from 'react'

export default function Educacao() {
  const artigos = ["Como reciclar plástico", "Importância da sustentabilidade"];
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-green-800 mb-4">Educação Ambiental </h3>
      {artigos.map((a, i) => <p key={i} className="text-gray-700">- {a}</p>)}
    </div>
  );
}