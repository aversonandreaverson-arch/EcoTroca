import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, CheckCircle, Clock, Star, TrendingUp } from "lucide-react";
import Header from "./Header.jsx";
import { getPerfil, getEntregasPendentes } from "../../api.js";

export default function DashboardColetador() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [pendentes, setPendentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        const [dadosPerfil, entregasPendentes] = await Promise.all([
          getPerfil(),
          getEntregasPendentes(),
        ]);
        setPerfil(dadosPerfil);
        setPendentes(entregasPendentes);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  if (carregando) return (
    <div className="min-h-screen bg-green-700 flex items-center justify-center pt-24">
      <Header />
      <p className="text-white text-lg">A carregar...</p>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen bg-green-700 flex items-center justify-center pt-24">
      <Header />
      <div className="bg-white p-6 rounded-xl text-center">
        <p className="text-red-600 mb-4">{erro}</p>
        <button onClick={() => navigate("/Login")} className="bg-green-600 text-white px-4 py-2 rounded-lg">Fazer Login</button>
      </div>
    </div>
  );

  const concluidas = pendentes.filter(e => e.status === "coletada");
  const emCurso   = pendentes.filter(e => e.status === "aceita");
  const aguardando= pendentes.filter(e => e.status === "pendente");
  // Coletador ganha PONTOS por coleta — tabela RecompensaColetador
  const pontosGanhos = concluidas.reduce((acc, e) => acc + (e.pontos_recebidos || 10), 0);

  return (
    <div className="min-h-screen bg-green-700 pt-24 p-6">
      <Header />
      <div className="bg-white/10 text-white rounded-2xl p-6 shadow-lg mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-1">Olá, {perfil?.nome || "Coletador"}! 👋</h2>
            <p className="opacity-80">Conta Coletador — Ecotroca Angola</p>
            <p className="text-sm mt-2 opacity-70">📍 {perfil?.municipio}, {perfil?.provincia}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <Truck size={32} className="mx-auto mb-1" />
            <p className="text-xs font-medium">Coletador Ativo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-600 text-sm font-medium">Pendentes</h3>
            <Clock className="text-yellow-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-yellow-600">{aguardando.length}</p>
          <p className="text-xs text-gray-400 mt-1">à espera</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-600 text-sm font-medium">Em curso</h3>
            <Truck className="text-blue-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-blue-600">{emCurso.length}</p>
          <p className="text-xs text-gray-400 mt-1">aceites por mim</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-600 text-sm font-medium">Concluídas</h3>
            <CheckCircle className="text-green-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-green-600">{concluidas.length}</p>
          <p className="text-xs text-gray-400 mt-1">coletas feitas</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-600 text-sm font-medium">Meus Pontos</h3>
            <Star className="text-yellow-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-yellow-600">{pontosGanhos}</p>
          <p className="text-xs text-gray-400 mt-1">pontos ganhos</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
            <Clock size={20} className="text-yellow-500" />Pedidos Pendentes
          </h3>
          <button onClick={() => navigate("/PedidosPendentes")} className="text-sm text-green-600 hover:underline">Ver todos →</button>
        </div>
        {aguardando.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Sem pedidos pendentes no momento.</p>
        ) : (
          <ul className="space-y-3">
            {aguardando.slice(0, 3).map((entrega) => (
              <li key={entrega.id_entrega} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{entrega.tipo_residuo || "Resíduo"} — {entrega.peso_total || "?"} kg</p>
                  <p className="text-xs text-gray-500">{entrega.endereco_completo || entrega.nome_usuario}</p>
                </div>
                <button onClick={() => navigate("/PedidosPendentes")} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition">Ver</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700">
          <TrendingUp size={20} className="text-green-600" />Atividade Recente
        </h3>
        {pendentes.length === 0 ? (
          <p className="text-gray-500 text-sm">Sem atividade recente.</p>
        ) : (
          <ul className="space-y-3 text-sm text-gray-600">
            {pendentes.slice(0, 4).map((entrega) => (
              <li key={entrega.id_entrega} className="flex justify-between items-center">
                <span>Entrega #{entrega.id_entrega} — {entrega.tipo_residuo || "Resíduo"}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  entrega.status === "coletada" ? "bg-green-100 text-green-700" :
                  entrega.status === "aceita"   ? "bg-blue-100 text-blue-700" :
                                                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {entrega.status === "coletada" ? "Concluída" : entrega.status === "aceita" ? "Em curso" : "Pendente"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}