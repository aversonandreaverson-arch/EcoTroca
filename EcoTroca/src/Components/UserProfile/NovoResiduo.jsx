import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { criarEntrega } from "../../api.js"; // importa função de criar entrega

export default function NovoResiduo() {
  const navigate = useNavigate();

  // Estado do formulário
  const [categoria, setCategoria] = useState("");
  const [peso, setPeso] = useState("");
  const [descricao, setDescricao] = useState("");
  const [recompensa, setRecompensa] = useState("dinheiro"); // "dinheiro" ou "pontos"
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handlePublicar = async () => {
    // Validação
    if (!categoria || !peso) {
      setErro("Preencha a categoria e o peso.");
      return;
    }
    if (parseFloat(peso) <= 0) {
      setErro("O peso deve ser maior que 0.");
      return;
    }

    try {
      setErro("");
      setCarregando(true);

      // Envia para o backend — POST /api/entregas
      await criarEntrega({
        tipo_residuo: categoria,
        peso_total: parseFloat(peso),
        descricao,
        tipo_recompensa: recompensa,
      });

      // Volta ao dashboard com sucesso
      navigate("/Dashboard");
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">

        <h2 className="text-2xl font-bold mb-6 text-green-700">
          Publicar Novo Resíduo
        </h2>

        {/* Área de Upload (visual apenas por agora) */}
        <div className="border-2 border-dashed border-green-400 rounded-xl p-6 text-center mb-4 cursor-pointer hover:bg-green-50 transition">
          <p className="text-gray-500">
            Clique ou arraste para enviar <br />
            <span className="text-xs">Imagens ou vídeos (máx. 50MB)</span>
          </p>
        </div>

        {/* Categoria */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Categoria *</label>
          <select
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Selecione a categoria...</option>
            <option value="Plástico">Plástico</option>
            <option value="Vidro">Vidro</option>
            <option value="Papel">Papel</option>
            <option value="Metal">Metal</option>
            <option value="Orgânico">Orgânico</option>
          </select>
        </div>

        {/* Peso */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Peso (kg) *</label>
          <input
            type="number"
            placeholder="0.0"
            min="0.1"
            step="0.1"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Tipo de Recompensa */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Tipo de Recompensa</label>
          <div className="space-y-2">

            {/* Opção Dinheiro */}
            <div
              onClick={() => setRecompensa("dinheiro")}
              className={`border rounded-lg p-3 cursor-pointer transition ${
                recompensa === "dinheiro"
                  ? "border-green-500 bg-green-50"
                  : "hover:bg-gray-50"
              }`}
            >
              💰 Dinheiro
              <p className="text-xs text-gray-500">50 Kz por kg</p>
            </div>

            {/* Opção Pontos */}
            <div
              onClick={() => setRecompensa("pontos")}
              className={`border rounded-lg p-3 cursor-pointer transition ${
                recompensa === "pontos"
                  ? "border-green-500 bg-green-50"
                  : "hover:bg-gray-50"
              }`}
            >
              🪙 Pontos
              <p className="text-xs text-gray-500">10 pontos por kg</p>
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Descrição</label>
          <textarea
            placeholder="Descreva o resíduo..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
          />
        </div>

        {/* Mensagem de erro */}
        {erro && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            {erro}
          </p>
        )}

        {/* Botões */}
        <div className="flex justify-between gap-3">
          <button
            onClick={() => navigate("/Dashboard")}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition flex-1"
          >
            Cancelar
          </button>
          <button
            onClick={handlePublicar}
            disabled={carregando}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition flex-1"
          >
            {carregando ? "A publicar..." : "Publicar"}
          </button>
        </div>

      </div>
    </div>
  );
}