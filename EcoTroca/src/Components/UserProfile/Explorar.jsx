
import React, { useState, useEffect } from "react";

export default function Explorar() {
  const [resultados, setResultados] = useState([
    { id: 1, nome: "EcoPlast", tipo: "Empresa", material: "Plástico" },
    { id: 2, nome: "João Coletor", tipo: "Coletador", material: "Vidro" }
  ]);

  useEffect(() => {
    // FUTURO BACKEND
    // api.get("/explorar")
    //   .then(res => setResultados(res.data));
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-green-800 mb-4">Explorar ♻️</h3>
      <input
        placeholder="Pesquisar empresas ou coletadores..."
        className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-green-500"
      />

      <div className="space-y-3">
        {resultados.map(item => (
          <div key={item.id} className="border rounded-lg p-3 flex justify-between items-center">
            <div>
              <h4 className="font-bold">{item.nome}</h4>
              <p className="text-gray-500 text-sm">{item.tipo} - {item.material}</p>
            </div>
            <button className="bg-green-800 text-white px-3 py-1 rounded-lg text-sm">Ver Perfil</button>
          </div>
        ))}
      </div>
    </div>
  );
}
