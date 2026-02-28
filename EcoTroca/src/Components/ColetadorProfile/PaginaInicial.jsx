// ============================================================
//  PaginaInicial.jsx — Coletador
//  Página inicial do coletador com pedidos pendentes,
//  mini carteira e notificações recentes
// ============================================================

import React, { useState, useEffect } from 'react';
import { Search, X, Truck, Clock, MapPin, Package, Banknote, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from './Header';
import { getEntregasPendentes, getNotificacoes, getCarteira } from "../../api.js";

// ─── Cartão de pedido pendente ───────────────────────────────
function CartaoPedido({ entrega, onVer }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-green-700 text-lg capitalize">
            {entrega.tipos_residuos || "Resíduo"}
          </p>
          <p className="text-xs text-gray-400">Pedido #{entrega.id_entrega}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          entrega.tipo_recompensa === "dinheiro"
            ? "bg-green-100 text-green-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {entrega.tipo_recompensa === "dinheiro" ? "Dinheiro" : "Saldo"}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-green-500" />
          <span>{entrega.endereco_domicilio || "Localização não definida"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Package size={14} className="text-green-500" />
          <span>
            {entrega.peso_total
              ? `${parseFloat(entrega.peso_total).toFixed(1)} kg`
              : "Peso não definido"}
          </span>
        </div>
        {entrega.valor_total && (
          <div className="flex items-center gap-2">
            <Banknote size={14} className="text-green-500" />
            <span className="font-medium text-green-700">
              Valor total: {parseFloat(entrega.valor_total).toFixed(2)} Kz
              <span className="text-gray-500 font-normal">
                {" "}(tua parte: {(parseFloat(entrega.valor_total) * 0.27).toFixed(2)} Kz)
              </span>
            </span>
          </div>
        )}
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

// ─── Atividades recentes ──────────────────────────────────────
function Atividades({ notificacoes }) {
  if (!notificacoes || notificacoes.length === 0) {
    return <p className="text-gray-300 text-sm text-center mt-6">Sem atividades recentes.</p>;
  }
  return (
    <ul className="space-y-3 mt-2">
      {notificacoes.slice(0, 6).map((n, i) => (
        <li key={n.id_notificacao || i} className="bg-green-700/50 rounded-xl p-3">
          <p className="text-white text-sm font-medium">{n.titulo}</p>
          <p className="text-green-300 text-xs mt-1">{n.mensagem}</p>
          {n.criado_em && (
            <p className="text-green-400 text-xs mt-1">
              {new Date(n.criado_em).toLocaleDateString("pt-AO", {
                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
              })}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─── Página Principal ─────────────────────────────────────────
export default function PaginaInicial() {
  const navigate = useNavigate();
  const [search, setSearch]           = useState('');
  const [pendentes, setPendentes]     = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [carteira, setCarteira]       = useState(null);
  const [carregando, setCarregando]   = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [entregas, notifs, dadosCarteira] = await Promise.all([
          getEntregasPendentes(),
          getNotificacoes(),
          getCarteira(),
        ]);
        setPendentes(entregas);
        setNotificacoes(notifs);
        setCarteira(dadosCarteira);
      } catch (err) {
        console.error(err);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const pedidosFiltrados = pendentes.filter(e => {
    const termo = search.toLowerCase();
    return (
      (e.tipos_residuos   || "").toLowerCase().includes(termo) ||
      (e.endereco_domicilio || "").toLowerCase().includes(termo) ||
      (e.nome_usuario     || "").toLowerCase().includes(termo)
    );
  });

  return (
    <div className="pt-24 p-6 bg-green-700 min-h-screen">
      <Header />

      {/* Cabeçalho */}
      <div className="mb-6 flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Página Inicial</h1>
          <p className="text-gray-300">Pedidos disponíveis para recolha</p>
        </div>

        {/* Mini carteira — parseFloat converte string do MySQL para número */}
        {carteira && (
          <div className="bg-white/10 rounded-2xl px-5 py-3 text-white text-sm flex gap-4">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Banknote size={16} className="text-green-300" />
              </div>
              <p className="font-bold text-lg">
                {parseFloat(carteira.dinheiro || 0).toFixed(2)} Kz
              </p>
              <p className="text-xs text-green-300">Dinheiro</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <CreditCard size={16} className="text-green-300" />
              </div>
              <p className="font-bold text-lg">
                {parseFloat(carteira.saldo || 0).toFixed(2)} Kz
              </p>
              <p className="text-xs text-green-300">Saldo</p>
            </div>
          </div>
        )}
      </div>

      {/* Barra de pesquisa */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por resíduo, localização ou utilizador..."
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

        {/* Pedidos pendentes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Clock size={20} className="text-yellow-400" />
              Pedidos Disponíveis
            </h2>
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
                {search ? "Nenhum pedido encontrado." : "Sem pedidos pendentes no momento."}
              </p>
              <p className="text-sm text-gray-300 mt-1">
                Novos pedidos aparecem aqui assim que forem criados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pedidosFiltrados.map((entrega) => (
                <CartaoPedido
                  key={entrega.id_entrega}
                  entrega={entrega}
                  onVer={() => navigate("/PedidosPendentes")}
                />
              ))}
            </div>
          )}
        </div>

        {/* Notificações / Atividades recentes */}
        <div className="bg-green-800 p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-semibold text-gray-200 mb-2">Atividades Recentes</h2>
          {carregando ? (
            <p className="text-gray-300 text-sm mt-4">A carregar...</p>
          ) : (
            <Atividades notificacoes={notificacoes} />
          )}
        </div>
      </div>
    </div>
  );
}