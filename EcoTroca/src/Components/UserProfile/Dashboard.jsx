import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Repeat, Star, TrendingUp, PlusCircle, Package, DollarSign, LogOut } from "lucide-react";
import Header from "./Header";
import { getPerfil, getPontuacao, getMinhasEntregas, logout } from "../../api.js";

export default function Dashboard() {
  const navigate = useNavigate();

  // Estados para guardar os dados vindos do backend
  const [usuario, setUsuario] = useState(null);
  const [pontuacao, setPontuacao] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Carrega os dados ao entrar na página
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Faz os 3 pedidos ao mesmo tempo para ser mais rápido
        const [perfil, pts, minhasEntregas] = await Promise.all([
          getPerfil(),           // GET /api/usuarios/perfil
          getPontuacao(),        // GET /api/usuarios/pontuacao
          getMinhasEntregas(),   // GET /api/entregas
        ]);

        setUsuario(perfil);
        setPontuacao(pts);
        setEntregas(minhasEntregas);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []); // [] significa: corre apenas uma vez ao montar o componente

  // Calcula a percentagem de progresso para o próximo nível
  const calcularProgresso = () => {
    if (!pontuacao) return 0;
    const pontos = pontuacao.recompensa?.pontos_totais || 0;
    if (pontos >= 1000) return 100;
    if (pontos >= 500) return Math.round(((pontos - 500) / 500) * 100);
    if (pontos >= 100) return Math.round(((pontos - 100) / 400) * 100);
    return Math.round((pontos / 100) * 100);
  };

  // Enquanto carrega, mostra um spinner
  if (carregando) {
    return (
      <div className="min-h-screen bg-green-700 flex items-center justify-center pt-24">
        <Header />
        <p className="text-white text-lg">A carregar...</p>
      </div>
    );
  }

  // Se houve erro (ex: token expirado)
  if (erro) {
    return (
      <div className="min-h-screen bg-green-700 flex items-center justify-center pt-24">
        <Header />
        <div className="bg-white p-6 rounded-xl text-center">
          <p className="text-red-600 mb-4">{erro}</p>
          <button onClick={() => navigate("/Login")} className="bg-green-600 text-white px-4 py-2 rounded-lg">
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  const progressoNivel = calcularProgresso();
  const nivel = pontuacao?.recompensa?.nivel || "iniciante";
  const totalPontos = pontuacao?.pontuacao?.pontos_total || 0;
  const totalTrocas = entregas.filter(e => e.status === "coletada").length;

  return (
    <div id="Dashboard" className="min-h-screen bg-green-700 pt-24 p-6">

      {/* Cabeçalho com boas-vindas */}
      <div className="bg-linear-to-r from-green-700 to-green-500 text-white rounded-2xl p-6 shadow-lg mb-8">
        <Header />

        <div className="flex justify-between items-start">
          <div>
            {/* Nome vindo do backend */}
            <h2 className="text-3xl font-bold mb-2">
              Bem-vindo, {usuario?.nome || "Utilizador"}
            </h2>
            <p className="opacity-90 capitalize">EcoAmigo — Nível {nivel}</p>
          </div>

          {/* Botão de logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm transition"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>

        {/* Barra de progresso do nível */}
        <div className="mt-4">
          <div className="w-full bg-green-300 rounded-full h-3">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressoNivel}%` }}
            />
          </div>
          <p className="text-sm mt-2">{progressoNivel}% para o próximo nível</p>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">

        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Pontos</h3>
            <Star className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-700">{totalPontos}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Trocas</h3>
            <Repeat className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-700">{totalTrocas}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Nível</h3>
            <Trophy className="text-green-600" />
          </div>
          <p className="text-xl font-bold text-green-700 capitalize">{nivel}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Medalhas</h3>
            <DollarSign className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-700">
            {pontuacao?.recompensa?.medalhas || 0}
          </p>
        </div>

      </div>

      {/* Lista de resíduos (entregas) vindos do backend */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
            <Package className="text-green-600" />
            Meus Resíduos
          </h3>
          <button
            onClick={() => navigate("/NovoResiduo")}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm transition"
          >
            <PlusCircle size={16} />
            Publicar Novo Resíduo
          </button>
        </div>

        {entregas.length === 0 ? (
          <p className="text-gray-500 text-center py-6">
            Ainda não tens resíduos publicados.
          </p>
        ) : (
          <ul className="space-y-3 text-gray-700">
            {entregas.map((entrega) => (
              <li
                key={entrega.id_entrega}
                className="flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition"
              >
                <div>
                  <p className="font-medium">{entrega.tipo_residuo || "Resíduo"}</p>
                  <p className="text-xs text-gray-500">
                    {entrega.data_hora
                      ? new Date(entrega.data_hora).toLocaleDateString("pt-AO")
                      : ""}
                  </p>
                </div>

                {/* Estado com cor diferente conforme o status */}
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    entrega.status === "coletada"
                      ? "bg-green-100 text-green-700"
                      : entrega.status === "aceita"
                      ? "bg-yellow-100 text-yellow-700"
                      : entrega.status === "cancelada"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {entrega.status === "coletada"
                    ? "Concluído"
                    : entrega.status === "aceita"
                    ? "Em processo"
                    : entrega.status === "cancelada"
                    ? "Cancelada"
                    : "Aguardando"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Atividade recente — mostra as últimas 3 entregas */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-600" />
          Atividade Recente
        </h3>

        {entregas.length === 0 ? (
          <p className="text-gray-500 text-sm">Sem atividade recente.</p>
        ) : (
          <ul className="space-y-3 text-gray-600 text-sm">
            {entregas.slice(0, 3).map((entrega) => (
              <li key={entrega.id_entrega} className="flex justify-between">
                <span>
                  Entrega #{entrega.id_entrega} — {entrega.tipo_residuo || "Resíduo"}
                </span>
                <span
                  className={
                    entrega.status === "coletada"
                      ? "text-green-600 font-medium"
                      : "text-blue-600 font-medium"
                  }
                >
                  {entrega.status === "coletada" ? "Concluída ✓" : "Em andamento"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}