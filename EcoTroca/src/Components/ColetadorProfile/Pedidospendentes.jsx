import React, { useState, useEffect } from "react";
import { MapPin, User, CheckCircle, Truck, Map, ArrowLeft, AlertCircle, Package } from "lucide-react";
import Header from "./Header.jsx";
import { getEntregasPendentes, aceitarEntrega, recolherEntrega } from "../../api.js";
import Mapa from "./Mapa.jsx";

//  Lista entregas pendentes (para aceitar) e aceites (para confirmar recolha).
//  Quando clica "Ver Rota", obtém a localizacao do coletador via GPS
//  e abre o mapa com a rota até ao utilizador.

export default function PedidosPendentes() {
  const [entregas,              setEntregas]              = useState([]);
  const [carregando,            setCarregando]            = useState(true);
  const [erro,                  setErro]                  = useState("");
  const [acaoEmCurso,           setAcaoEmCurso]           = useState(null);
  const [localizacaoColetador,  setLocalizacaoColetador]  = useState(null);
  const [entregaSelecionadaMapa,setEntregaSelecionadaMapa]= useState(null);
  const [carregandoMapa,        setCarregandoMapa]        = useState(false);
  const [erroLocalizacao,       setErroLocalizacao]       = useState("");

  useEffect(() => { carregar(); }, []);

  // Carrega todas as entregas pendentes e aceites pelo coletador
  const carregar = async () => {
    try {
      setErro("");
      const dados = await getEntregasPendentes();
      setEntregas(dados || []);
    } catch (err) {
      setErro(err.message || "Erro ao carregar pedidos");
    } finally {
      setCarregando(false);
    }
  };

  // Aceita uma entrega pendente — coletador fica responsavel pela recolha
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

  // Confirma que a recolha foi feita — entrega passa para "coletada"
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

  // Obtem a localizacao GPS do coletador via API do browser
  const obterLocalizacao = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalizacao nao suportada neste navegador"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, nome: "A tua localizacao" }),
        (err) => reject(new Error({
          1: "Permissao de localizacao negada",
          2: "Localizacao nao disponivel",
          3: "Pedido expirou",
        }[err.code] || "Erro ao obter localizacao"))
      );
    });

  // Clica "Ver Rota" — obtém GPS e abre o ecra do mapa
  const abrirMapa = async (entrega) => {
    setCarregandoMapa(true);
    setErroLocalizacao("");
    try {
      const loc = await obterLocalizacao();
      setLocalizacaoColetador(loc);
      setEntregaSelecionadaMapa(entrega);
    } catch (err) {
      setErroLocalizacao(err.message);
    } finally {
      setCarregandoMapa(false);
    }
  };

  // Filtra por status
  const pendentes = entregas.filter(e => e.status === "pendente");
  const aceites   = entregas.filter(e => e.status === "aceita");

  // ── Ecra do mapa — substitui a lista quando uma entrega esta seleccionada ──
  if (entregaSelecionadaMapa && localizacaoColetador) {
    // Coordenadas do destino — usa as da entrega ou fallback para Luanda centro
    const latDestino = parseFloat(entregaSelecionadaMapa.latitude  || -8.8383);
    const lngDestino = parseFloat(entregaSelecionadaMapa.longitude || 13.2344);

    return (
      <div className="min-h-screen bg-green-100 pt-24 pb-12 p-6">
        <Header />

        {/* Botao voltar */}
        <button
          onClick={() => { setEntregaSelecionadaMapa(null); setLocalizacaoColetador(null); }}
          className="mb-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium flex items-center gap-2 transition">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Rota para o Utilizador</h1>
          <p className="text-gray-600 mt-1 text-sm">
            {entregaSelecionadaMapa.tipo_residuo || "Residuo"} — {entregaSelecionadaMapa.nome_usuario}
          </p>
        </div>

        {/* Mapa com a rota */}
        {/* origem = localizacao GPS do coletador */}
        {/* destino = coordenadas do utilizador (ou fallback Luanda) */}
        <Mapa
          origem={{
            lat:  localizacaoColetador.lat,
            lng:  localizacaoColetador.lng,
            nome: "A tua localizacao",
          }}
          destino={{
            lat:  latDestino,
            lng:  lngDestino,
            nome: entregaSelecionadaMapa.nome_usuario || "Utilizador",
          }}
          altura={380}
        />

        {/* Info da entrega abaixo do mapa */}
        <div className="mt-4 bg-white rounded-2xl p-5 border border-green-100 space-y-3">
          <div className="flex items-center gap-2">
            <User size={15} className="text-green-600 shrink-0" />
            <span className="text-gray-700 font-medium">{entregaSelecionadaMapa.nome_usuario}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-green-600 shrink-0" />
            <span className="text-gray-600 text-sm">{entregaSelecionadaMapa.endereco_domicilio || "Endereco nao disponivel"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Package size={15} className="text-green-600 shrink-0" />
            <span className="text-gray-600 text-sm">{entregaSelecionadaMapa.tipo_residuo || "Residuo"} — {entregaSelecionadaMapa.peso_total || "?"} kg</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Lista de pedidos ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12 p-6">
      <Header />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Pedidos de Coleta</h1>
        <p className="text-gray-600 mt-1">Aceita pedidos e marca-os como recolhidos.</p>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle size={18} /> {erro}
        </div>
      )}
      {erroLocalizacao && (
        <div className="bg-orange-100 border border-orange-300 text-orange-700 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle size={18} /> {erroLocalizacao}
        </div>
      )}

      {carregando ? (
        <p className="text-gray-500 text-center py-8">A carregar pedidos...</p>
      ) : (
        <div className="space-y-8">

          {/* Pendentes — coletador ainda nao aceitou */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">{pendentes.length}</span>
              Aguardando Aceitacao
            </h2>
            {pendentes.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-green-100">
                Sem pedidos pendentes no momento.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {pendentes.map(e => (
                  <CartaoPedido key={e.id_entrega} entrega={e} tipo="pendente"
                    onAceitar={() => handleAceitar(e.id_entrega)}
                    onMapa={() => abrirMapa(e)}
                    carregando={acaoEmCurso === e.id_entrega}
                    carregandoMapa={carregandoMapa} />
                ))}
              </div>
            )}
          </section>

          {/* Aceites — coletador ja aceitou, aguarda confirmacao da recolha */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-400 text-blue-900 text-xs font-bold px-2 py-1 rounded-full">{aceites.length}</span>
              Em Andamento (aceites por ti)
            </h2>
            {aceites.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-green-100">
                Sem coletas em andamento.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {aceites.map(e => (
                  <CartaoPedido key={e.id_entrega} entrega={e} tipo="aceita"
                    onRecolher={() => handleRecolher(e.id_entrega)}
                    onMapa={() => abrirMapa(e)}
                    carregando={acaoEmCurso === e.id_entrega}
                    carregandoMapa={carregandoMapa} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// ── Card de cada pedido ──────────────────────────────────────
function CartaoPedido({ entrega, tipo, onAceitar, onRecolher, onMapa, carregando, carregandoMapa }) {
  if (!entrega) return null;
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-bold text-green-700 text-lg">{entrega.tipo_residuo || "Residuo"}</p>
          <p className="text-xs text-gray-400">Pedido #{entrega.id_entrega}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          tipo === "pendente" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
        }`}>
          {tipo === "pendente" ? "Pendente" : "Em curso"}
        </span>
      </div>
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <User size={15} className="text-green-500 shrink-0" />
          <span className="truncate">{entrega.nome_usuario || "Utilizador"}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-green-500 shrink-0" />
          <span className="truncate text-xs">{entrega.endereco_domicilio || "Localizacao nao definida"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Package size={15} className="text-green-500 shrink-0" />
          <span>{entrega.peso_total || "?"} kg</span>
        </div>
      </div>

      {/* Botao Ver Rota — abre o mapa com GPS */}
      <button onClick={onMapa} disabled={carregandoMapa}
        className="w-full mb-2 bg-blue-100 hover:bg-blue-200 disabled:opacity-60 text-blue-700 py-2 rounded-xl font-medium transition flex items-center justify-center gap-2 text-sm">
        <Map size={14} />
        {carregandoMapa ? "A obter localizacao..." : "Ver Rota no Mapa"}
      </button>

      {/* Botao de accao — aceitar ou confirmar recolha */}
      {tipo === "pendente" ? (
        <button onClick={onAceitar} disabled={carregando}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-xl font-medium transition flex items-center justify-center gap-2">
          <Truck size={16} />
          {carregando ? "A aceitar..." : "Aceitar Pedido"}
        </button>
      ) : (
        <button onClick={onRecolher} disabled={carregando}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2 rounded-xl font-medium transition flex items-center justify-center gap-2">
          <CheckCircle size={16} />
          {carregando ? "A confirmar..." : "Confirmar Recolha"}
        </button>
      )}
    </div>
  );
}