import React from 'react'

export default function Noticias() {
  const noticias = ["Reciclagem cresce em Angola", "Novas empresas sustentáveis"];
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-green-800 mb-4">Notícias 📰</h3>
      {noticias.map((n, i) => <p key={i} className="text-gray-700">- {n}</p>)}
    </div>
  );
}
