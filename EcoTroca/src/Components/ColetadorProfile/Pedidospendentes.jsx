import React, { useState, useEffect } from "react";
import { MapPin, Weight, User, CheckCircle, Truck } from "lucide-react";
import Header from "./Header.jsx";
import { getEntregasPendentes, aceitarEntrega, recolherEntrega } from "../../api.js";

export default function PedidosPendentes() {
  const [entregas, setEntregas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [acaoEmCurso, setAcaoEmCurso] = useState(null); // id da entrega a ser processada

  const carregar = async () => {
    try {
      setErro("");
      const dados = await getEntregasPendentes(); // GET /api/coletador/entregas/pendentes
      setEntregas(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  // Aceitar uma entrega pendente
  const handleAceitar = async (id) => {
    try {
      setAcaoEmCurso(id);
      await aceitarEntrega(id); // PATCH /api/coletador/entregas/:id/aceitar
      await carregar(); // recarrega a lista
    } catch (err) {
      setErro(err.message);
    } finally {
      setAcaoEmCurso(null);
    }
  };

  // Marcar entrega aceite como recolhida
  const handleRecolher = async (id) => {
    try {
      setAcaoEmCurso(id);
      await recolherEntrega(id); // PATCH /api/coletador/entregas/:id/recolher
      await carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setAcaoEmCurso(null);
    }
  };

  // Separa as entregas por estado
  const pendentes = entregas.filter(e => e.status === "pendente");
  const aceites = entregas.filter(e => e.status === "aceita");

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <Header />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Pedidos de Coleta</h1>
        <p className="text-gray-600 mt-1">Aceita pedidos e marca-os como recolhidos.</p>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6">
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="text-gray-500 text-center">A carregar pedidos...</p>
      ) : (
        <div className="space-y-8">

          {/* ===== PEDIDOS PENDENTES — para aceitar ===== */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                {pendentes.length}
              </span>
              Aguardando Aceitação
            </h2>

            {pendentes.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-green-100">
                Sem pedidos pendentes no momento.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {pendentes.map((entrega) => (
                  <CartaoPedido
                    key={entrega.id_entrega}
                    entrega={entrega}
                    tipo="pendente"
                    onAceitar={() => handleAceitar(entrega.id_entrega)}
                    carregando={acaoEmCurso === entrega.id_entrega}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ===== PEDIDOS ACEITES — para marcar como recolhido ===== */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-400 text-blue-900 text-xs font-bold px-2 py-1 rounded-full">
                {aceites.length}
              </span>
              Em Andamento (aceites por ti)
            </h2>

            {aceites.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-green-100">
                Sem coletas em andamento.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {aceites.map((entrega) => (
                  <CartaoPedido
                    key={entrega.id_entrega}
                    entrega={entrega}
                    tipo="aceita"
                    onRecolher={() => handleRecolher(entrega.id_entrega)}
                    carregando={acaoEmCurso === entrega.id_entrega}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}

// Componente auxiliar — cartão de cada pedido
function CartaoPedido({ entrega, tipo, onAceitar, onRecolher, carregando }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100">

      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-bold text-green-700 text-lg">
            {entrega.tipo_residuo || "Resíduo"}
          </p>
          <p className="text-xs text-gray-400">Pedido #{entrega.id_entrega}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          tipo === "pendente"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {tipo === "pendente" ? "Pendente" : "Em curso"}
        </span>
      </div>

      {/* Informações */}
      <div className="space-y-2 text-sm text-gray-600 mb-4">

        {/* Utilizador */}
        <div className="flex items-center gap-2">
          <User size={16} className="text-green-500" />
          <span>{entrega.nome_usuario || "Utilizador"}</span>
        </div>

        {/* Localização */}
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-green-500" />
          <span>{entrega.endereco_completo || "Localização não definida"}</span>
        </div>

        {/* Peso */}
        <div className="flex items-center gap-2">
          <Weight size={16} className="text-green-500" />
          <span>{entrega.peso_total || "?"} kg</span>
        </div>

        {/* Data */}
        {entrega.data_hora && (
          <p className="text-xs text-gray-400">
            {new Date(entrega.data_hora).toLocaleDateString("pt-AO", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
            })}
          </p>
        )}
      </div>

      {/* Botão de ação */}
      {tipo === "pendente" ? (
        <button
          onClick={onAceitar}
          disabled={carregando}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-xl font-medium transition flex items-center justify-center gap-2"
        >
          <Truck size={16} />
          {carregando ? "A aceitar..." : "Aceitar Pedido"}
        </button>
      ) : (
        <button
          onClick={onRecolher}
          disabled={carregando}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2 rounded-xl font-medium transition flex items-center justify-center gap-2"
        >
          <CheckCircle size={16} />
          {carregando ? "A confirmar..." : "Confirmar Recolha"}
        </button>
      )}
    </div>
  );
}