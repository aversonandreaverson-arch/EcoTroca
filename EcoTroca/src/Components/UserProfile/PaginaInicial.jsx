import React from 'react'
import { Search } from "lucide-react";


import Actividades from "./Actividades";
import CartaoPedidoEmpresa from "./CartaoPedidoEmpresa";

const pedidosEmpresas = [
  {
    empresa: "Elisal",
    material: "plástico",
    quantidadeTotal: 1000,
    quantidadeAtual: 320,
    precoPorKg: 300
  },
  {
    empresa: "EcoLuanda",
    material: "vidro",
    quantidadeTotal: 500,
    quantidadeAtual: 210,
    precoPorKg: 200
  }
];

// eslint-disable-next-line no-undef
export default function  PaginaInicial  ()  {
  return (
    <div id='PaginaInicial' className="p-6 bg-gr/ay-50 min-h
    8 -screen">

      {/* Título */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Página Inicial
        </h1>
        <p className="text-gray-500">
          Veja o que está a acontecer agora no Ecotroca-Angola
        </p>
      </div>

      {/* Barra de pesquisa-- Tem que se colocar um x que vai fazer com que o que o usuario escreveu na barra, apague tudo de uma vez */}
      <div className="relative mb-8">
      <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Pesquisar empresas, resíduos ou encomendas..."
        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna esquerda */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">
            Pedidos de empresas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pedidosEmpresas.map((pedido, index) => (
              <CartaoPedidoEmpresa key={index} pedido={pedido} />
            ))}
          </div>
        </div>

        

      </div>
    </div>
  );
}
