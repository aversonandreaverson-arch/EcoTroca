import { Package } from "lucide-react";
import React from 'react'


const listaActividades = [
  "João está a coletar plástico",
  "Maria entregou 5kg de vidro",
  "Pedro aceitou uma encomenda da Elisal",
  "Ana começou a coletar papel"
];

// eslint-disable-next-line no-const-assign
export default function  Actividades  ()  {
  return (
    <div className="bg-green-700 rounded-xl shadow p-5">
      <h2 className="font-semibold text-lg mb-4 text-green-700">
        Actividade recentes
      </h2>

     {/*  <ul className="space-y-3 text-sm text-gray-600">
        {listaActividades.map((actividade, index) => (
          <li key={index} className="flex items-center gap-3">
            <Package className="w-4 h-4 text-green-600" />
            {actividade}
          </li>
        ))}
      </ul> */}
    </div>
  );
}
