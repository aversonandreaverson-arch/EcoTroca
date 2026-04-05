import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Truck, CheckCircle, AlertCircle, Phone } from "lucide-react";
import Mapa from "../Shared/Mapa.jsx";
import { getRecolhasAgendadas, iniciarRecolha, concluirRecolha, reportarFalhaRecolha } from "../../api.js";

export default function RecolhasAgendadas() {
  const [recolhas, setRecolhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [recolhaSelecionada, setRecolhaSelecionada] = useState(null);
  const [mostraMapa, setMostraMapa] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await getRecolhasAgendadas();
        setRecolhas(dados || []);
      } catch (err) {
        setErro(err.message || "Erro ao carregar recolhas");
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const handleIniciar = async (id_recolha) => {
    try {
      await iniciarRecolha(id_recolha);
      setRecolhas(recolhas.map(r => 
        r.id_recolha === id_recolha ? { ...r, status: 'em_curso' } : r
      ));
      alert("✅ Recolha iniciada!");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  const handleConcluir = async (id_recolha) => {
    const peso = prompt("Peso recolhido (kg)?");
    if (!peso) return;

    try {
      await concluirRecolha(id_recolha, parseFloat(peso));
      setRecolhas(recolhas.map(r => 
        r.id_recolha === id_recolha ? { ...r, status: 'concluida' } : r
      ));
      alert("✅ Recolha concluída!");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  const handleFalha = async (id_recolha) => {
    const motivo = prompt("Motivo da falta:");
    if (!motivo) return;

    try {
      await reportarFalhaRecolha(id_recolha, motivo);
      setRecolhas(recolhas.map(r => 
        r.id_recolha === id_recolha ? { ...r, status: 'cancelada' } : r
      ));
      alert("⚠️ Falha reportada. Empresa será notificada para reagendar.");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  if (mostraMapa && recolhaSelecionada) {
    return (
      <div className="min-h-screen bg-green-100 pt-24 p-6">
        <button
          onClick={() => setMostraMapa(false)}
          className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium"
        >
          ← Voltar
        </button>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Rota para Recolha</h1>
        <p className="text-gray-600 mb-6">{recolhaSelecionada.referencia_local}</p>

        <Mapa
          origin={[recolhaSelecionada.latitude, recolhaSelecionada.longitude]}
          destination={[recolhaSelecionada.latitude, recolhaSelecionada.longitude]}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Minhas Recolhas Agendadas</h1>
        <p className="text-gray-600 mt-1">Recolhas que precisa fazer hoje/próximos dias</p>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="text-gray-500 text-center">A carregar recolhas...</p>
      ) : recolhas.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-green-100">
          <Truck size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Nenhuma recolha agendada no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recolhas.map((recolha) => (
            <CartaoRecolha
              key={recolha.id_recolha}
              recolha={recolha}
              onIniciar={() => handleIniciar(recolha.id_recolha)}
              onConcluir={() => handleConcluir(recolha.id_recolha)}
              onFalha={() => handleFalha(recolha.id_recolha)}
              onMapa={() => {
                setRecolhaSelecionada(recolha);
                setMostraMapa(true);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CartaoRecolha({ recolha, onIniciar, onConcluir, onFalha, onMapa }) {
  const data = new Date(recolha.data_proposta);
  const hoje = new Date();
  const isHoje = data.toDateString() === hoje.toDateString();

  return (
    <div className={`bg-white rounded-2xl shadow-md p-6 border-l-4 ${
      recolha.status === 'em_curso' ? 'border-l-blue-500' :
      recolha.status === 'concluida' ? 'border-l-green-500' :
      'border-l-yellow-500'
    }`}>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            {recolha.nome_usuario}
          </h3>
          <p className="text-sm text-gray-500">
            {recolha.tipo_residuo} • {recolha.peso_total} kg
          </p>
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
          recolha.status === 'agendada' ? 'bg-yellow-100 text-yellow-700' :
          recolha.status === 'em_curso' ? 'bg-blue-100 text-blue-700' :
          'bg-green-100 text-green-700'
        }`}>
          {recolha.status === 'agendada' ? '⏰ Agendada' :
           recolha.status === 'em_curso' ? '🚗 Em curso' :
           '✅ Concluída'}
        </span>
      </div>

      {/* Detalhes */}
      <div className="space-y-2 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-green-600" />
          <span>
            {isHoje ? '🔥 HOJE' : data.toLocaleDateString('pt-AO', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-green-600" />
          <span>{recolha.hora_inicio.substring(0, 5)}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={16} className="text-red-600 shrink-0 mt-0.5" />
          <span className="text-xs leading-relaxed">{recolha.referencia_local}</span>
        </div>
      </div>

      {/* Botões */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={onMapa}
          className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg font-medium text-sm transition flex items-center justify-center gap-1"
        >
          📍 Mapa
        </button>
        
        {recolha.status === 'agendada' && (
          <>
            <button
              onClick={onIniciar}
              className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium text-sm transition"
            >
              Iniciar
            </button>
            <button
              onClick={onFalha}
              className="bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-medium text-sm transition"
            >
              Não posso
            </button>
          </>
        )}
        
        {recolha.status === 'em_curso' && (
          <button
            onClick={onConcluir}
            className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm transition flex items-center justify-center gap-1"
          >
            <CheckCircle size={16} />
            Concluir
          </button>
        )}
      </div>
    </div>
  );
}