import React, { useState, useEffect } from 'react';
import { Search, X, Truck, Clock, MapPin, Package } from "lucide-react";
import Header from './Header';
import { getEntregasPendentes, getNotificacoes } from "../../api.js";

// ─── Cartão de pedido pendente ───────────────────────────────────────────────
function CartaoPedidoPendente({ entrega, onVer }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-green-700 text-lg capitalize">
            {entrega.tipo_residuo || "Resíduo"}
          </p>
          <p className="text-xs text-gray-400">Pedido #{entrega.id_entrega}</p>
        </div>
        <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
          Pendente
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-green-500" />
          <span>{entrega.endereco_completo || entrega.municipio || "Localização não definida"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Package size={14} className="text-green-500" />
          <span>{entrega.peso_total || "?"} kg</span>
        </div>
      </div>

      <button
        onClick={onVer}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
      >
        <Truck size={14} />
        Ver e Aceitar
      </button>
    </div>
  );
}

// ─── Painel de notificações/atividades do coletador ──────────────────────────
function ActividadesColetador({ notificacoes }) {
  if (!notificacoes || notificacoes.length === 0) {
    return (
      <p className="text-gray-300 text-sm text-center mt-6">
        Sem atividades recentes.
      </p>
    );
  }

  return (
    <ul className="space-y-3 mt-2">
      {notificacoes.slice(0, 6).map((n, i) => (
        <li key={n.id_notificacao || i} className="bg-green-700/50 rounded-xl p-3">
          <p className="text-white text-sm">{n.mensagem}</p>
          {n.data_hora && (
            <p className="text-green-300 text-xs mt-1">
              {new Date(n.data_hora).toLocaleDateString("pt-AO", {
                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
              })}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────
export default function PaginaInicialColetador() {
  const [search, setSearch] = useState('');
  const [pendentes, setPendentes] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [entregasPendentes, notifs] = await Promise.all([
          getEntregasPendentes(),   // GET /api/coletador/entregas/pendentes
          getNotificacoes(),        // GET /api/notificacoes
        ]);
        setPendentes(entregasPendentes);
        setNotificacoes(notifs);
      } catch (err) {
        console.error(err);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  // Filtra pedidos pelo texto de pesquisa
  const pedidosFiltrados = pendentes.filter(e => {
    const termo = search.toLowerCase();
    return (
      (e.tipo_residuo || "").toLowerCase().includes(termo) ||
      (e.endereco_completo || "").toLowerCase().includes(termo) ||
      (e.municipio || "").toLowerCase().includes(termo)
    );
  }).filter(e => e.status === "pendente");

  return (
    <div id="PaginaInicialColetador" className="pt-24 p-6 bg-green-700 min-h-screen">
      <Header />

      {/* Título */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Página Inicial</h1>
        <p className="text-gray-300">Pedidos disponíveis para recolha em Luanda</p>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative mb-10">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por tipo de resíduo ou localização..."
          className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {search && (
          <X
            className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 cursor-pointer"
            onClick={() => setSearch('')}
          />
        )}
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Coluna esquerda — pedidos disponíveis para aceitar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Clock size={20} className="text-yellow-400" />
              Pedidos Disponíveis
            </h2>
            {/* Contador */}
            {!carregando && (
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                {pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {carregando ? (
            <p className="text-white">A carregar pedidos...</p>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="bg-white/10 rounded-2xl p-8 text-center text-white">
              <Truck size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">
                {search ? "Nenhum pedido encontrado para essa pesquisa." : "Sem pedidos pendentes no momento."}
              </p>
              <p className="text-sm text-gray-300 mt-1">
                Volta mais tarde — novos pedidos aparecem aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pedidosFiltrados.map((entrega) => (
                <CartaoPedidoPendente
                  key={entrega.id_entrega}
                  entrega={entrega}
                  onVer={() => window.location.href = "/PedidosPendentes"}
                />
              ))}
            </div>
          )}
        </div>

        {/* Coluna direita — notificações/atividade recente */}
        <div className="bg-green-800 p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-semibold text-gray-200 mb-2">
            Atividades Recentes
          </h2>
          {carregando ? (
            <p className="text-gray-300 text-sm mt-4">A carregar...</p>
          ) : (
            <ActividadesColetador notificacoes={notificacoes} />
          )}
        </div>

      </div>
    </div>
  );
}