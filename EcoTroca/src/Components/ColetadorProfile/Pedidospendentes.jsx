import React, { useState, useEffect } from "react";
import { MapPin, Weight, User, CheckCircle, Truck, Map, ArrowLeft, AlertCircle } from "lucide-react";
import Header from "./Header.jsx";
import { getEntregasPendentes, aceitarEntrega, recolherEntrega } from "../../api.js";
import Mapa from "./Mapa.jsx";

export default function PedidosPendentes() {
  const [entregas, setEntregas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [acaoEmCurso, setAcaoEmCurso] = useState(null);
  const [localizacaoColetador, setLocalizacaoColetador] = useState(null);
  const [entregaSelecionadaMapa, setEntregaSelecionadaMapa] = useState(null);
  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState("");

  const carregar = async () => {
    try {
      setErro("");
      const dados = await getEntregasPendentes();
      setEntregas(dados || []);
    } catch (err) {
      console.error("Erro ao carregar entregas:", err);
      setErro(err.message || "Erro ao carregar pedidos");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleAceitar = async (id) => {
    try {
      setAcaoEmCurso(id);
      await aceitarEntrega(id);
      await carregar();
    } catch (err) {
      setErro(err.message || "Erro ao aceitar pedido");
    } finally {
      setAcaoEmCurso(null);
    }
  };

  const handleRecolher = async (id) => {
    try {
      setAcaoEmCurso(id);
      await recolherEntrega(id);
      await carregar();
    } catch (err) {
      setErro(err.message || "Erro ao confirmar recolha");
    } finally {
      setAcaoEmCurso(null);
    }
  };

  const obterLocalizacao = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não suportada neste navegador"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            nome: "Sua localização",
          });
        },
        (error) => {
          const mensagens = {
            1: "Permissão de localização negada",
            2: "Localização não disponível",
            3: "Pedido expirou",
          };
          reject(new Error(mensagens[error.code] || "Erro ao obter localização"));
        }
      );
    });
  };

  const abrirMapa = async (entrega) => {
    setCarregandoMapa(true);
    setErroLocalizacao("");
    
    try {
      const loc = await obterLocalizacao();
      setLocalizacaoColetador(loc);
      setEntregaSelecionadaMapa(entrega);
    } catch (err) {
      console.error("Erro de localização:", err);
      setErroLocalizacao(err.message);
    } finally {
      setCarregandoMapa(false);
    }
  };

  const pendentes = (entregas || []).filter(e => e.status === "pendente");
  const aceites = (entregas || []).filter(e => e.status === "aceita");

  // Tela do Mapa
  if (entregaSelecionadaMapa && localizacaoColetador) {
    return (
      <div className="min-h-screen bg-green-100 pt-24 p-6">
        <Header />
        
        <button
          onClick={() => {
            setEntregaSelecionadaMapa(null);
            setLocalizacaoColetador(null);
          }}
          className="mb-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center gap-2 transition"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Rota para o Utilizador</h1>
          <p className="text-gray-600 mt-1">
            {entregaSelecionadaMapa.tipo_residuo} • {entregaSelecionadaMapa.nome_usuario}
          </p>
        </div>

        <Mapa
          origin={[localizacaoColetador.lat, localizacaoColetador.lng]}
          destination={[
            parseFloat(entregaSelecionadaMapa.latitude || -8.8383),
            parseFloat(entregaSelecionadaMapa.longitude || 13.2344)
          ]}
        />

        {/* Info da entrega */}
        <div className="mt-6 bg-white rounded-2xl p-6 border border-green-100 space-y-3">
          <div className="flex items-center gap-2">
            <User size={16} className="text-green-600" />
            <span className="text-gray-700"><strong>{entregaSelecionadaMapa.nome_usuario}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-green-600" />
            <span className="text-gray-700 text-sm">{entregaSelecionadaMapa.endereco_completo || "Endereço não disponível"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Weight size={16} className="text-green-600" />
            <span className="text-gray-700">{entregaSelecionadaMapa.peso_total || "?"} kg</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <Header />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Pedidos de Coleta</h1>
        <p className="text-gray-600 mt-1">Aceita pedidos e marca-os como recolhidos.</p>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {erro}
        </div>
      )}

      {erroLocalizacao && (
        <div className="bg-orange-100 border border-orange-300 text-orange-700 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {erroLocalizacao}
        </div>
      )}

      {carregando ? (
        <p className="text-gray-500 text-center py-8">A carregar pedidos...</p>
      ) : (
        <div className="space-y-8">

          {/* ===== PEDIDOS PENDENTES ===== */}
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
                    onMapa={() => abrirMapa(entrega)}
                    carregando={acaoEmCurso === entrega.id_entrega}
                    carregandoMapa={carregandoMapa}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ===== PEDIDOS ACEITES ===== */}
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
                    onMapa={() => abrirMapa(entrega)}
                    carregando={acaoEmCurso === entrega.id_entrega}
                    carregandoMapa={carregandoMapa}
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

function CartaoPedido({ entrega, tipo, onAceitar, onRecolher, onMapa, carregando, carregandoMapa }) {
  if (!entrega) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100 hover:shadow-lg transition">

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

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <User size={16} className="text-green-500 shrink-0" />
          <span className="truncate">{entrega.nome_usuario || "Utilizador"}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-green-500 shrink-0" />
          <span className="truncate text-xs">{entrega.endereco_completo || "Localização não definida"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Weight size={16} className="text-green-500 shrink-0" />
          <span>{entrega.peso_total || "?"} kg</span>
        </div>
      </div>

      {/* Botão Ver Mapa */}
      <button
        onClick={onMapa}
        disabled={carregandoMapa}
        className="w-full mb-2 bg-blue-100 hover:bg-blue-200 disabled:opacity-60 text-blue-700 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm"
      >
        <Map size={14} />
        {carregandoMapa ? "A obter localização..." : "Ver Rota no Mapa"}
      </button>

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