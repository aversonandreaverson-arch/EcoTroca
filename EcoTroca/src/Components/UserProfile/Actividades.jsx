// Importamos o ícone Package da biblioteca lucide-react
import { Package } from "lucide-react";

// Importamos o React (boa prática, mesmo que nem sempre seja obrigatório)
import React from "react";

// Lista de atividades simuladas
// Aqui usamos um array simples de strings
const listaActividades = [
  "João está a coletar plástico",
  "Maria entregou 5kg de vidro",
  "Pedro aceitou uma encomenda da Elisal",
  "Ana começou a coletar papel"
];

// Componente principal de atividades
// Não recebe props por enquanto
export default function Actividades() {

  return (
    // Card principal com fundo verde e cantos arredondados
    <div className="bg-green-700 rounded-xl shadow p-5">

      {/* Título da secção */}
      <h2 className="font-semibold text-lg mb-4 text-green-700">
        Actividade recentes
      </h2>

      {/* 
        Lista de atividades
        Está comentada porque talvez ainda não queiras mostrar no ecrã
        O map percorre o array listaActividades
      */}
      {/*
      <ul className="space-y-3 text-sm text-gray-600">
        {listaActividades.map((actividade, index) => (
          
          // Cada item da lista precisa de uma key
          <li key={index} className="flex items-center gap-3">

            // Ícone ao lado do texto
            <Package className="w-4 h-4 text-green-600" />

            // Texto da atividade
            {actividade}

          </li>
        ))}
      </ul>
      */}

    </div>
  );
}
