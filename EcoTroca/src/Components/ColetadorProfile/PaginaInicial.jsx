import React, { useState } from 'react';
import { Search, X } from "lucide-react";
import Actividades from "./Actividades";
import CartaoPedidoEmpresa from "./CartaoPedidoEmpresa";
import CartaoColetador from "./CartaoColetador"; 
import Header from './Header';

const pedidosEmpresas = [
  { empresa: "Elisal", material: "plástico", quantidadeTotal: 1000, quantidadeAtual: 320, precoPorKg: 300 },
  { empresa: "EcoLuanda", material: "vidro", quantidadeTotal: 500, quantidadeAtual: 210, precoPorKg: 200 }
];

const coletadores = [
  { nome: "João", totalColetado: 150, Municipio: "Dande" },
  { nome: "Maria", totalColetado: 200, Municipio: "Viana" }
];

export default function PaginaInicial() {
  const [search, setSearch] = useState('');

  return (
    <div id='PaginaInicial' className="pt-24 p-6 bg-green-700 min-h-screen">
      <Header/>

      {/* Título */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Página Inicial</h1>
        <p className="text-gray-300">Veja o que está a acontecer agora no Ecotroca-Angola</p>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative mb-10">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar empresas, resíduos ou coletadores..."
          className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {search && (
          <X 
            className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 cursor-pointer"
            onClick={() => setSearch('')}
          />
        )}
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Coluna esquerda: Pedidos de empresas */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-white">Pedidos de Empresas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pedidosEmpresas.map((pedido, index) => (
              <CartaoPedidoEmpresa key={index} pedido={pedido} />
            ))}
          </div>

          {/* Coletadores */}
          <h2 className="text-xl font-semibold text-white mt-10">Coletadores em Ação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coletadores.map((coletador, index) => (
              <CartaoColetador key={index} coletador={coletador} />
            ))}
          </div>
        </div>

        {/* Coluna direita: Atividades recentes */}
        <div className="bg-green-800 p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Atividades Recentes</h2>
          <Actividades />
        </div>

      </div>
    </div>
  );
}