
//  Funciona para DOIS tipos de coletador:
//
//  INDEPENDENTE:
//    - Ve entregas pendentes de utilizadores
//    - Pode aceitar pedidos por conta propria
//    - Recebe comissao de 30% do valor
//
//  DEPENDENTE:
//    - Trabalha para uma empresa especifica
//    - Ve as recolhas designadas pela empresa
//    - Nao recebe dinheiro — e pago pela empresa fora da plataforma
//    - Nao pode aceitar pedidos por conta propria

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck, CheckCircle, Clock, Star, TrendingUp,
  Building2, Bell, MapPin, CalendarCheck, Package
} from "lucide-react";
import Header from "./Header.jsx";
import { getPerfil, getEntregasPendentes, getNotificacoes } from "../../api.js";

export default function DashboardColetador() {
  const navigate = useNavigate();

  // Dados do perfil e estado geral
  const [perfil,     setPerfil]     = useState(null);
  const [entregas,   setEntregas]   = useState([]);
  const [notifs,     setNotifs]     = useState([]); // notificacoes de recolhas designadas
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState("");

  // Tipo do coletador — vem do perfil
  // 'dependente' = trabalha para uma empresa
  // 'independente' = trabalha por conta propria
  const [tipoColetador, setTipoColetador] = useState("independente");
  const [nomeEmpresa,   setNomeEmpresa]   = useState("");

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      // Carrega perfil e entregas em paralelo
      const [dadosPerfil, dadosEntregas, dadosNotifs] = await Promise.all([
        getPerfil(),
        getEntregasPendentes(),
        getNotificacoes(),
      ]);

      setPerfil(dadosPerfil);
      setEntregas(dadosEntregas || []);

      // Filtra apenas notificacoes de recolhas designadas pela empresa
      // Estas sao as ordens que a empresa enviou ao coletador
      const recolhasDesignadas = (dadosNotifs || []).filter(n =>
        n.titulo === 'Nova recolha designada' && !n.lida
      );
      setNotifs(recolhasDesignadas);

      // Determina o tipo do coletador a partir dos dados do perfil
      if (dadosPerfil?.tipo_coletador === 'dependente') {
        setTipoColetador('dependente');
        setNomeEmpresa(dadosPerfil.nome_empresa || 'a tua empresa');
      }

    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center pt-24">
      <Header />
      <p className="text-gray-500 text-lg">A carregar...</p>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center pt-24">
      <Header />
      <div className="bg-white p-6 rounded-xl text-center">
        <p className="text-red-600 mb-4">{erro}</p>
        <button onClick={() => navigate("/Login")}
          className="bg-green-600 text-white px-4 py-2 rounded-lg">
          Fazer Login
        </button>
      </div>
    </div>
  );

  // Calcula estatisticas a partir das entregas
  const concluidas = entregas.filter(e => e.status === "coletada");
  const emCurso    = entregas.filter(e => e.status === "aceita");
  const aguardando = entregas.filter(e => e.status === "pendente");

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <Header />

      {/* Banner do perfil — cor diferente por tipo */}
      <div className={`text-white rounded-2xl p-6 shadow-lg mb-6 ${
        tipoColetador === 'dependente' ? 'bg-purple-700' : 'bg-green-700'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Ola, {perfil?.nome || "Coletador"}!
            </h2>
            <p className="opacity-80 text-sm">
              {tipoColetador === 'dependente'
                ? `Coletador Dependente — ${nomeEmpresa}`
                : 'Coletador Independente — EcoTroca Angola'
              }
            </p>
            {perfil?.municipio && (
              <p className="text-sm mt-1 opacity-70 flex items-center gap-1">
                <MapPin size={12} /> {perfil.municipio}, {perfil.provincia}
              </p>
            )}
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <Truck size={28} className="mx-auto mb-1" />
            <p className="text-xs font-medium">
              {tipoColetador === 'dependente' ? 'Dependente' : 'Independente'}
            </p>
          </div>
        </div>

        {/* Aviso especifico para coletador dependente */}
        {tipoColetador === 'dependente' && (
          <div className="mt-4 bg-white/20 rounded-xl p-3">
            <p className="text-xs font-medium flex items-center gap-2">
              <Building2 size={14} />
              As tuas recolhas sao designadas por {nomeEmpresa}. Aguarda as ordens no sino de notificacoes.
            </p>
          </div>
        )}
      </div>

      {/* Notificacoes de recolhas designadas — so para coletador dependente */}
      {tipoColetador === 'dependente' && notifs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5 mb-6">
          <h3 className="text-purple-700 font-bold text-base mb-4 flex items-center gap-2">
            <Bell size={18} className="text-purple-500" />
            Recolhas Designadas pela Empresa
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {notifs.length}
            </span>
          </h3>
          <div className="space-y-3">
            {notifs.map(n => (
              <div key={n.id_notificacao}
                className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <p className="text-purple-800 font-semibold text-sm mb-1">{n.titulo}</p>
                <p className="text-gray-600 text-xs leading-relaxed">{n.mensagem}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(n.data).toLocaleDateString('pt-AO', {
                    day: '2-digit', month: 'short',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards de estatisticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        {/* Pendentes — so relevante para independente */}
        {tipoColetador === 'independente' && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-500 text-sm font-medium">Pendentes</h3>
              <Clock size={18} className="text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{aguardando.length}</p>
            <p className="text-xs text-gray-400 mt-1">a aguardar</p>
          </div>
        )}

        {/* Recolhas designadas — so para dependente */}
        {tipoColetador === 'dependente' && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-500 text-sm font-medium">Designadas</h3>
              <CalendarCheck size={18} className="text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{notifs.length}</p>
            <p className="text-xs text-gray-400 mt-1">pela empresa</p>
          </div>
        )}

        {/* Em curso */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Em curso</h3>
            <Truck size={18} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{emCurso.length}</p>
          <p className="text-xs text-gray-400 mt-1">em andamento</p>
        </div>

        {/* Concluidas */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Concluidas</h3>
            <CheckCircle size={18} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{concluidas.length}</p>
          <p className="text-xs text-gray-400 mt-1">recolhas feitas</p>
        </div>

        {/* Pontos — so para independente que recebe recompensa */}
        {tipoColetador === 'independente' && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-500 text-sm font-medium">Meus Pontos</h3>
              <Star size={18} className="text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {concluidas.reduce((acc, e) => acc + (e.pontos_recebidos || 10), 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">pontos ganhos</p>
          </div>
        )}
      </div>

      {/* Lista de pedidos pendentes — so para coletador independente */}
      {tipoColetador === 'independente' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-green-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
              <Clock size={18} className="text-yellow-500" /> Pedidos Pendentes
            </h3>
            <button onClick={() => navigate("/PedidosPendentes")}
              className="text-sm text-green-600 hover:underline">
              Ver todos →
            </button>
          </div>
          {aguardando.length === 0 ? (
            <p className="text-gray-400 text-center py-4 text-sm">
              Sem pedidos pendentes no momento.
            </p>
          ) : (
            <ul className="space-y-3">
              {aguardando.slice(0, 3).map(e => (
                <li key={e.id_entrega}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {e.tipo_residuo || "Residuo"} — {e.peso_total || "?"} kg
                    </p>
                    <p className="text-xs text-gray-400">
                      {e.endereco_domicilio || e.nome_usuario}
                    </p>
                  </div>
                  <button onClick={() => navigate("/PedidosPendentes")}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition">
                    Ver
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Mensagem para coletador dependente sem recolhas */}
      {tipoColetador === 'dependente' && notifs.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-purple-100">
          <CalendarCheck size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">Sem recolhas designadas de momento.</p>
          <p className="text-gray-400 text-sm mt-1">
            A empresa {nomeEmpresa} vai notificar-te quando houver uma recolha para fazeres.
          </p>
        </div>
      )}

      {/* Actividade recente */}
      {entregas.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 border border-green-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-600" /> Actividade Recente
          </h3>
          <ul className="space-y-3">
            {entregas.slice(0, 4).map(e => (
              <li key={e.id_entrega}
                className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Entrega #{e.id_entrega} — {e.tipo_residuo || e.tipos_residuos || "Residuo"}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  e.status === "coletada" ? "bg-green-100 text-green-700"  :
                  e.status === "aceita"   ? "bg-blue-100 text-blue-700"    :
                                            "bg-yellow-100 text-yellow-700"
                }`}>
                  {e.status === "coletada" ? "Concluida" :
                   e.status === "aceita"   ? "Em curso"  : "Pendente"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}