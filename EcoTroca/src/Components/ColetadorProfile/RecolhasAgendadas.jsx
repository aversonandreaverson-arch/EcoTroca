
//  Lista as entregas pendentes para o coletador recolher
//  Usa as rotas existentes do backend:
//    GET  /api/coletador/entregas/pendentes  — lista entregas
//    PATCH /api/coletador/entregas/:id/aceitar — coletador aceita
//    PATCH /api/coletador/entregas/:id/recolher — marca como recolhida
// ============================================================

import React, { useState, useEffect } from "react";
import {
  Calendar, Clock, MapPin, Truck,
  CheckCircle, AlertCircle, Package
} from "lucide-react";
import Header from "./Header.jsx";
import {
  getEntregasPendentes, // GET /api/coletador/entregas/pendentes
  aceitarEntrega,       // PATCH /api/coletador/entregas/:id/aceitar
  recolherEntrega,      // PATCH /api/coletador/entregas/:id/recolher
} from "../../api.js";

export default function RecolhasAgendadas() {
  // Lista de entregas pendentes para este coletador
  const [recolhas,    setRecolhas]    = useState([]);
  const [carregando,  setCarregando]  = useState(true);
  const [erro,        setErro]        = useState("");

  // Carrega as entregas ao montar o componente
  useEffect(() => {
    carregar();
  }, []);

  // Vai buscar as entregas pendentes ao backend
  const carregar = async () => {
    try {
      setCarregando(true);
      setErro("");
      const dados = await getEntregasPendentes();
      setRecolhas(dados || []);
    } catch (err) {
      setErro(err.message || "Erro ao carregar recolhas");
    } finally {
      setCarregando(false);
    }
  };

  // Coletador aceita uma entrega pendente
  const handleAceitar = async (id_entrega) => {
    try {
      await aceitarEntrega(id_entrega);
      // Actualiza o status localmente sem recarregar tudo
      setRecolhas(prev =>
        prev.map(r => r.id_entrega === id_entrega ? { ...r, status: 'aceita' } : r)
      );
    } catch (err) {
      alert("Erro ao aceitar entrega: " + err.message);
    }
  };

  // Coletador marca entrega como recolhida (ja foi buscar os residuos)
  const handleRecolher = async (id_entrega) => {
    if (!window.confirm("Confirmas que ja recolheste os residuos desta entrega?")) return;
    try {
      await recolherEntrega(id_entrega);
      // Actualiza o status localmente
      setRecolhas(prev =>
        prev.map(r => r.id_entrega === id_entrega ? { ...r, status: 'recolhida' } : r)
      );
      alert("Recolha concluida com sucesso!");
    } catch (err) {
      alert("Erro ao concluir recolha: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12 px-6">
      <Header />

      {/* Cabecalho da pagina */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-800">Minhas Recolhas</h1>
        <p className="text-gray-500 mt-1">Entregas pendentes para recolher</p>
      </div>

      {/* Erro global */}
      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle size={16} /> {erro}
        </div>
      )}

      {/* Estado de carregamento */}
      {carregando ? (
        <p className="text-green-700 text-center py-12">A carregar recolhas...</p>

      // Estado vazio
      ) : recolhas.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-green-100 shadow-sm">
          <Truck size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 font-medium">Nenhuma recolha pendente.</p>
          <p className="text-gray-300 text-sm mt-1">As novas entregas aparecem aqui automaticamente.</p>
        </div>

      // Lista de cards de recolha
      ) : (
        <div className="space-y-4">
          {recolhas.map(recolha => (
            <CardRecolha
              key={recolha.id_entrega}
              recolha={recolha}
              onAceitar={() => handleAceitar(recolha.id_entrega)}
              onRecolher={() => handleRecolher(recolha.id_entrega)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Card individual de cada recolha
function CardRecolha({ recolha, onAceitar, onRecolher }) {

  // Cor da borda esquerda por status
  const corBorda =
    recolha.status === 'aceita'    ? 'border-l-blue-500'   :
    recolha.status === 'recolhida' ? 'border-l-green-500'  :
                                     'border-l-yellow-500';

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-5 border border-green-100 border-l-4 ${corBorda} hover:shadow-md transition`}>

      {/* Cabecalho: nome do utilizador + badge de status */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-green-800 text-lg">{recolha.nome_usuario || 'Utilizador'}</p>
          <p className="text-gray-400 text-xs">Entrega #{recolha.id_entrega}</p>
        </div>
        {/* Badge de status com cor por estado */}
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          recolha.status === 'pendente'  ? 'bg-yellow-100 text-yellow-700' :
          recolha.status === 'aceita'    ? 'bg-blue-100 text-blue-700'     :
          recolha.status === 'recolhida' ? 'bg-green-100 text-green-700'   :
                                           'bg-gray-100 text-gray-500'
        }`}>
          {recolha.status === 'pendente'  ? 'Pendente'  :
           recolha.status === 'aceita'    ? 'Aceite'    :
           recolha.status === 'recolhida' ? 'Recolhida' : recolha.status}
        </span>
      </div>

      {/* Detalhes: residuo, peso, endereco e data */}
      <div className="space-y-2 text-sm text-gray-600 mb-4">

        {/* Tipo de residuo e peso */}
        <div className="flex items-center gap-2">
          <Package size={14} className="text-green-500 shrink-0" />
          <span>{recolha.tipo_residuo || 'Residuo'}</span>
          {recolha.peso_total && (
            <span className="text-green-600 font-medium">· {recolha.peso_total} kg</span>
          )}
        </div>

        {/* Endereco de recolha */}
        {recolha.endereco_domicilio && (
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-green-500 shrink-0 mt-0.5" />
            <span>{recolha.endereco_domicilio}</span>
          </div>
        )}

        {/* Data e hora da entrega */}
        {recolha.data_hora && (
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-green-500 shrink-0" />
            <span className="text-xs text-gray-400">
              {new Date(recolha.data_hora).toLocaleDateString('pt-AO', {
                weekday: 'short', day: '2-digit', month: 'short',
                hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
        )}

        {/* Data de recolha proposta pela empresa */}
        {recolha.data_recolha_proposta && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            <Calendar size={14} className="text-blue-500 shrink-0" />
            <div>
              <p className="text-blue-700 text-xs font-medium">Recolha marcada para</p>
              <p className="text-blue-600 text-xs">
                {new Date(recolha.data_recolha_proposta).toLocaleString('pt-AO', {
                  weekday: 'short', day: '2-digit', month: 'short',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Botoes de accao por status */}
      <div className="flex gap-2">

        {/* Entrega pendente — coletador pode aceitar */}
        {recolha.status === 'pendente' && (
          <button
            onClick={onAceitar}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
            <CheckCircle size={14} /> Aceitar Recolha
          </button>
        )}

        {/* Entrega aceite — coletador pode marcar como recolhida */}
        {recolha.status === 'aceita' && (
          <button
            onClick={onRecolher}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
            <Truck size={14} /> Marcar como Recolhida
          </button>
        )}

        {/* Entrega ja recolhida — sem accoes */}
        {recolha.status === 'recolhida' && (
          <div className="flex-1 bg-green-50 border border-green-200 text-green-700 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1">
            <CheckCircle size={14} /> Recolha Concluida
          </div>
        )}
      </div>
    </div>
  );
}