// ============================================================
//  HistoricoColetas.jsx — Coletador
//  Histórico de todas as coletas com filtros e resumo
// ============================================================

import React, { useState, useEffect } from "react";
import { CheckCircle, Clock, XCircle, Truck, Banknote, Star } from "lucide-react";
import Header from "./Header.jsx";
import { getMinhasColetasColetador, getCarteira } from "../../api.js";

const STATUS_CONFIG = {
  coletada:  { label: "Concluída",  cor: "bg-green-100 text-green-700",  Icone: CheckCircle },
  aceita:    { label: "Em curso",   cor: "bg-blue-100 text-blue-700",    Icone: Truck       },
  cancelada: { label: "Cancelada",  cor: "bg-red-100 text-red-700",      Icone: XCircle     },
  pendente:  { label: "Pendente",   cor: "bg-yellow-100 text-yellow-700",Icone: Clock       },
};

export default function HistoricoColetas() {
  const [entregas, setEntregas]     = useState([]);
  const [carteira, setCarteira]     = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro]         = useState("todos");

  useEffect(() => {
    const carregar = async () => {
      try {
        const [coletas, dadosCarteira] = await Promise.all([
          getMinhasColetasColetador(),
          getCarteira(),
        ]);
        setEntregas(coletas);
        setCarteira(dadosCarteira);
      } catch (err) {
        console.error(err);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const filtradas   = filtro === "todos" ? entregas : entregas.filter(e => e.status === filtro);
  const concluidas  = entregas.filter(e => e.status === "coletada");
  const totalKg     = concluidas.reduce((acc, e) => acc + (parseFloat(e.peso_total)  || 0), 0);
  const totalPontos = concluidas.reduce((acc, e) => acc + (e.pontos_recebidos || 10), 0);

  return (
    <div className="min-h-screen bg-green-700 pt-24 p-6">
      <Header />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Histórico de Coletas</h1>
        <p className="text-gray-300 mt-1">Todas as coletas registadas na tua conta.</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 text-center shadow">
          <p className="text-2xl font-bold text-green-700">{concluidas.length}</p>
          <p className="text-xs text-gray-500 mt-1">Coletas concluídas</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow">
          <p className="text-2xl font-bold text-green-700">{totalKg.toFixed(1)} kg</p>
          <p className="text-xs text-gray-500 mt-1">Total recolhido</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow">
          <p className="text-2xl font-bold text-green-700 flex items-center justify-center gap-1">
            <Banknote size={16} />
            {/* parseFloat converte string do MySQL para número */}
            {parseFloat(carteira?.dinheiro || 0).toFixed(2)} Kz
          </p>
          <p className="text-xs text-gray-500 mt-1">Dinheiro sacável</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow">
          <p className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
            <Star size={16} /> {totalPontos}
          </p>
          <p className="text-xs text-gray-500 mt-1">Pontos ganhos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[
          { val: "todos",     label: "Todos"      },
          { val: "coletada",  label: "Concluídas" },
          { val: "aceita",    label: "Em curso"   },
          { val: "pendente",  label: "Pendentes"  },
          { val: "cancelada", label: "Canceladas" },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setFiltro(val)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filtro === val
                ? "bg-white text-green-700 shadow"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {carregando ? (
        <p className="text-white text-center">A carregar histórico...</p>
      ) : filtradas.length === 0 ? (
        <div className="bg-white/10 rounded-2xl p-8 text-center text-white">
          <Truck size={40} className="mx-auto mb-3 opacity-50" />
          <p>Nenhuma coleta encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((entrega) => {
            const config = STATUS_CONFIG[entrega.status] || STATUS_CONFIG.pendente;
            const { Icone } = config;
            return (
              <div key={entrega.id_entrega} className="bg-white rounded-2xl shadow p-5 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">
                    {entrega.tipos_residuos || "Resíduo"} — {entrega.peso_total || "?"} kg
                  </p>
                  <p className="text-sm text-gray-500">
                    {entrega.endereco_domicilio || "Localização não definida"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Utilizador: {entrega.nome_usuario || "—"}
                  </p>
                  {entrega.data_hora && (
                    <p className="text-xs text-gray-400">
                      {new Date(entrega.data_hora).toLocaleDateString("pt-AO", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  )}
                  {entrega.valor_total && (
                    <p className="text-xs font-medium text-green-600 mt-1">
                      Valor: {parseFloat(entrega.valor_total).toFixed(2)} Kz
                      {entrega.tipo_recompensa === "dinheiro" && (
                        " (tua parte: " + (parseFloat(entrega.valor_total) * 0.3 * 0.9).toFixed(2) + " Kz)"
                      )}
                    </p>
                  )}
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${config.cor}`}>
                  <Icone size={14} />
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}