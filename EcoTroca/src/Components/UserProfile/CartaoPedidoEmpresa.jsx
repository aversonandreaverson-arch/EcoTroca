// Importamos o ícone Package da biblioteca lucide-react
import { Package } from "lucide-react";

// Este componente mostra um cartão com os dados de um pedido feito por uma empresa
// Ele recebe um objeto chamado "pedido" como propriedade (props)
export default function CartaoPedidoEmpresa({ pedido }) {

  // Se não existir pedido (vier vazio ou undefined), não mostramos nada
  if (!pedido) return null;

  // Aqui calculamos o progresso do pedido em percentagem
  // Exemplo: 5kg de 10kg = 50%
  const progresso = Math.round(
    (pedido.quantidadeAtual / pedido.quantidadeTotal) * 100
  );

  return (
    // Div principal do cartão
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      
      {/* Informações principais do pedido */}
      <div>
        {/* Nome da empresa */}
        <h3 className="text-xl font-bold text-green-700">
          {pedido.empresa}
        </h3>

        {/* Quantidade total e tipo de material */}
        <p className="text-gray-600">
          Pedido: até {pedido.quantidadeTotal}kg de {pedido.material}
        </p>

        {/* Preço por cada quilo */}
        <p className="text-sm text-gray-500">
          1kg = {pedido.precoPorKg} Kz
        </p>
      </div>

      {/* Secção do progresso do pedido */}
      <div>
        {/* Texto acima da barra de progresso */}
        <div className="flex justify-between text-sm mb-1">
          <span>{pedido.quantidadeAtual}kg coletados</span>
          <span>{progresso}%</span>
        </div>

        {/* Barra de fundo (cinza) */}
        <div className="w-full h-2 bg-gray-200 rounded-full">
          
          {/* Barra verde que cresce conforme o progresso */}
          <div
            className="h-2 bg-green-500 rounded-full"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Botão para aceitar a encomenda */}
      <button className="mt-3 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
        
        {/* Ícone do botão */}
        <Package className="w-4 h-4" />

        {/* Texto do botão */}
        Aceitar esta encomenda
      </button>
    </div>
  );
}
