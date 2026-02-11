import React from 'react'

// eslint-disable-next-line no-undef
export default function Eventos ()  {
  const eventos = ["Limpeza da Praia - 10 Março"];
  return (
    <div id='Eventos' className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-green-800 mb-4">Eventos ♻️</h3>
      {eventos.map((e, i) => <p key={i} className="text-gray-700">- {e}</p>)}
    </div>
  );
}