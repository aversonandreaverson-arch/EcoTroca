import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, AlertCircle, Check, X } from "lucide-react";
import { criarRecolhaAgendada, obterDatasSugeridas } from "../../api.js";

export default function AgendarRecolha({ entrega, empresa, onSucesso, onCancel }) {
  const [dataSugerida, setDataSugerida] = useState("");
  const [horaSugerida, setHoraSugerida] = useState("14:00");
  const [referencia, setReferencia] = useState(entrega?.endereco_completo || "");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [datasSugestas, setDatasSugestas] = useState([]);
  const [carregandoDatas, setCarregandoDatas] = useState(true);

  useEffect(() => {
    const carregarDatas = async () => {
      try {
        const datas = await obterDatasSugeridas(empresa.id_empresa);
        setDatasSugestas(datas || []);
        if (datas && datas.length > 0) {
          setDataSugerida(datas[0]);
        }
      } catch (err) {
        console.error("Erro ao carregar datas:", err);
      } finally {
        setCarregandoDatas(false);
      }
    };
    carregarDatas();
  }, [empresa.id_empresa]);

  const handleAgendar = async () => {
    if (!dataSugerida || !horaSugerida || !referencia.trim()) {
      setErro("⚠️ Preencha todos os campos (Data, Hora e Referência)");
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      await criarRecolhaAgendada({
        id_entrega: entrega.id_entrega,
        id_empresa: empresa.id_empresa,
        data_proposta: dataSugerida,
        hora_inicio: horaSugerida,
        latitude: entrega.latitude,
        longitude: entrega.longitude,
        endereco_completo: entrega.endereco_completo,
        referencia_local: referencia,
      });

      alert("✅ Recolha agendada com sucesso!");
      onSucesso?.();
    } catch (err) {
      setErro("❌ " + (err.message || "Erro ao agendar recolha"));
    } finally {
      setCarregando(false);
    }
  };

  if (carregandoDatas) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          <p className="text-gray-600 text-center">A carregar datas disponíveis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 my-8">
        
        <h2 className="text-2xl font-bold text-gray-800">Agendar Recolha</h2>
        
        {/* Info da entrega */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-100 space-y-2">
          <p className="text-sm text-gray-700">
            <strong> Utilizador:</strong> {entrega?.nome_usuario}
          </p>
          <p className="text-sm text-gray-700">
            <strong> Tipo:</strong> {entrega?.tipo_residuo}
          </p>
          <p className="text-sm text-gray-700">
            <strong> Peso:</strong> {entrega?.peso_total} kg
          </p>
        </div>

        {erro && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="text-sm">{erro}</span>
          </div>
        )}

        {/* Data */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Calendar size={16} className="text-green-600" />
            Data da recolha
          </label>
          <select
            value={dataSugerida}
            onChange={(e) => setDataSugerida(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Selecciona data...</option>
            {datasSugestas.map((data) => (
              <option key={data} value={data}>
                {new Date(data).toLocaleDateString('pt-AO', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </option>
            ))}
          </select>
        </div>

        {/* Hora */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Clock size={16} className="text-green-600" />
            Hora da recolha
          </label>
          <input
            type="time"
            value={horaSugerida}
            onChange={(e) => setHoraSugerida(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Referência Local (IMPORTANTE) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <MapPin size={16} className="text-red-600" />
            Ponto de referência 🇦🇴
            <span className="text-red-600 text-lg">*</span>
          </label>
          <textarea
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ex: Perto da bomba da Sonangol, casa azul com portão branco"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-20 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
             Descrição clara ajuda o coletador a encontrar o endereço com rapidez
          </p>
        </div>

        {/* Botões */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <X size={16} />
            Cancelar
          </button>
          <button
            onClick={handleAgendar}
            disabled={carregando}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <Check size={16} />
            {carregando ? "Agendando..." : "Agendar"}
          </button>
        </div>
      </div>
    </div>
  );
}