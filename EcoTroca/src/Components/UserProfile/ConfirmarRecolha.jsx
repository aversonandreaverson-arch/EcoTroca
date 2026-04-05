import React, { useState } from "react";
import { Calendar, Clock, MapPin, CheckCircle, X, AlertCircle } from "lucide-react";
import { confirmarRecolha } from "../../api.js";

export default function ConfirmarRecolha({ recolha, onSucesso, onCancel }) {
  const [confirmando, setConfirmando] = useState(false);
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [mostraMotivo, setMostraMotivo] = useState(false);

  const handleConfirmar = async () => {
    setConfirmando(true);
    setErro("");

    try {
      await confirmarRecolha(recolha.id_recolha, true);
      alert("✅ Recolha confirmada! Receberás notificações do coletador.");
      onSucesso?.();
    } catch (err) {
      setErro("❌ " + (err.message || "Erro ao confirmar"));
    } finally {
      setConfirmando(false);
    }
  };

  const handleRecusar = async () => {
    if (!motivo.trim()) {
      setErro("⚠️ Indique o motivo da recusa");
      return;
    }

    setRecusando(true);
    setErro("");

    try {
      await confirmarRecolha(recolha.id_recolha, false, motivo);
      alert("⚠️ Recolha recusada. A empresa entrará em contacto para reagendar.");
      onSucesso?.();
    } catch (err) {
      setErro("❌ " + (err.message || "Erro ao recusar"));
    } finally {
      setRecusando(false);
    }
  };

  const dataNova = new Date(recolha.data_proposta);
  const dataFormatada = dataNova.toLocaleDateString('pt-AO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 my-8">
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Confirmar Recolha? ✅</h2>
          <p className="text-gray-600 text-sm">A empresa agendou uma recolha para ti</p>
        </div>

        {/* Detalhes */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-blue-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-600">📅 Data</p>
              <p className="font-semibold text-gray-800">{dataFormatada}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock size={18} className="text-blue-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-600">🕐 Hora</p>
              <p className="font-semibold text-gray-800">
                {recolha.hora_inicio.substring(0, 5)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-600">📍 Local</p>
              <p className="font-semibold text-gray-800 text-sm">
                {recolha.referencia_local}
              </p>
            </div>
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">
            O coletador virá nesse horário. Se não conseguires, recusa e a empresa reagendará.
          </p>
        </div>

        {erro && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg p-3 text-sm">
            {erro}
          </div>
        )}

        {/* Secção de Recusa */}
        {mostraMotivo && (
          <div className="space-y-2">
            <textarea
              placeholder="Explica o motivo (ex: data não funciona, endereço mudou, etc.)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-16 resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Botões */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              if (mostraMotivo) {
                handleRecusar();
              } else {
                setMostraMotivo(true);
              }
            }}
            disabled={recusando || confirmando}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 disabled:opacity-60 text-red-700 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm"
          >
            <X size={16} />
            {mostraMotivo ? (recusando ? "Recusando..." : "Recusar") : "Não posso"}
          </button>
          <button
            onClick={handleConfirmar}
            disabled={confirmando || recusando}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm"
          >
            <CheckCircle size={16} />
            {confirmando ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}