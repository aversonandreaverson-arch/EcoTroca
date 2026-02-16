import React from "react";
import { useNavigate } from "react-router-dom"; // ✅ IMPORTANTE
import { Trophy, Repeat, Star, TrendingUp, PlusCircle, Package, DollarSign } from "lucide-react";
import Header from "./Header"; 

export default function Dashboard() { 
  const navigate = useNavigate(); // ✅ Hook de navegação

  const usuario = { 
    nome: "Áverson",
    nivel: "EcoAmigo - Nível 3",
    pontos: 240, 
    totalTrocas: 12,
    ranking: 12,
    saldo: 12500, 
    progressoNivel: 60,
    residuos: [
      { nome: "Plástico PET", empresa: "EcoRecicla", status: "Aguardando troca" },
      { nome: "Papelão", empresa: "GreenCompany", status: "Em processo" },
      { nome: "Vidro", empresa: "Recicladora Azul", status: "Concluído" },
    ]   
  }; 

  return  ( 
    <div id="Dashboard" className="min-h-screen bg-green-700 pt-24 p-6"> 
      
      {/* Header principal */}
      <div className="bg-linear-to-r from-green-700 to-green-500 text-white rounded-2xl p-6 shadow-lg mb-8">
        <Header/>
        <h2 className="text-3xl font-bold mb-2">
          Bem-vindo, {usuario.nome}
        </h2>
        <p className="opacity-90">{usuario.nivel}</p>

        {/* Barra de progresso */}
        <div className="mt-4">
          <div className="w-full bg-green-300 rounded-full h-3">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${usuario.progressoNivel}%` }}
            ></div>
          </div>
          <p className="text-sm mt-2">
            {usuario.progressoNivel}% para o próximo nível
          </p>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">

        {/* Pontos */}
        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Pontos</h3>
            <Star className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-700">
            {usuario.pontos}
          </p>
        </div>

        {/* Trocas */}
        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Trocas</h3>
            <Repeat className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-700">
            {usuario.totalTrocas}
          </p>
        </div>

        {/* Ranking */}
        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Ranking</h3>
            <Trophy className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-700">
            #{usuario.ranking}
          </p>
        </div>

        {/* Saldo */}
        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">Saldo</h3>
            <DollarSign className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-700">
            {usuario.saldo.toLocaleString()} Kz
          </p>
        </div>

      </div>

      {/* Resíduos */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
            <Package className="text-green-600" />
            Meus Resíduos 
          </h3>

          {/*  BOTÃO de redirecionamento pag novoresiduo */}
          <button
            onClick={() => navigate("/NovoResiduo")}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm transition"
          >
            <PlusCircle size={16} />
            Publicar Novo Resíduo
          </button>
        </div>

        <ul className="space-y-3 text-gray-700">
          {usuario.residuos.map((res, i) => (
            <li
              key={i}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <div>
                <p className="font-medium">{res.nome}</p>
                <p className="text-xs text-gray-500">Para: {res.empresa}</p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  res.status === "Concluído"
                    ? "bg-green-100 text-green-700"
                    : res.status === "Em processo"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {res.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Atividade recente */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-600" />
          Atividade Recente
        </h3>

        <ul className="space-y-3 text-gray-600 text-sm">
          <li className="flex justify-between">
            <span>Troca realizada com João</span>
            <span className="text-green-600 font-medium">+20 pts</span>
          </li>
          <li className="flex justify-between">
            <span>Item reciclado</span>
            <span className="text-green-600 font-medium">+10 pts</span>
          </li>
          <li className="flex justify-between">
            <span>Nova troca iniciada</span>
            <span className="text-blue-600 font-medium">Em andamento</span>
          </li>
        </ul>
      </div>

    </div>
  );
}
