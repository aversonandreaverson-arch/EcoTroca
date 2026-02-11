import { Package } from "lucide-react";

export default function CartaoPedidoEmpresa({ pedido }) {
  if (!pedido) return null;

  const progresso = Math.round(
    (pedido.quantidadeAtual / pedido.quantidadeTotal) * 100
  );

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-bold text-green-700">
          {pedido.empresa}
        </h3>
        <p className="text-gray-600">
          Pedido: até {pedido.quantidadeTotal}kg de {pedido.material}
        </p>
        <p className="text-sm text-gray-500">
          1kg = {pedido.precoPorKg} Kz
        </p>
      </div>

      {/* Progresso */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>{pedido.quantidadeAtual}kg coletados</span>
          <span>{progresso}%</span>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-green-500 rounded-full"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      <button className="mt-3 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
        <Package className="w-4 h-4" />
        Aceitar esta encomenda
      </button>
    </div>
  );
}
5