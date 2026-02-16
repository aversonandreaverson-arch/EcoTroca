import React from "react";
import { Edit, Settings } from "lucide-react";
import Header from "./Header";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const navigate = useNavigate();

  const usuario = {
    nome: "Áverson Wambembe",
    nivel: "EcoAmigo - Nível 3",
    pontos: 240,
    totalTrocas: 12,
    avatar: "https://via.placeholder.com/80",
    progressoNivel: 60
  };

  return (
    <section
      id="Perfil"
      className="bg-white shadow-lg rounded-2xl p-6 m-6 flex flex-col md:flex-row items-center md:items-start gap-6 pt-24"
    >
      <Header />

      {/* Avatar */}
      <img
        src={usuario.avatar}
        alt="Avatar"
        className="rounded-full w-24 h-24 md:w-32 md:h-32 border-4 border-green-600"
      />

      {/* Informação do usuário */}
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {usuario.nome}
            </h2>
            <p className="text-green-700 font-medium">
              {usuario.nivel}
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3">

            {/* BOTÃO EDITAR */}
            <button
              onClick={() => navigate("/Editar")}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition text-sm"
            >
              <Edit size={16} />
              Editar
            </button>

            {/* BOTÃO DEFINIÇÕES */}
            <button
              onClick={() => navigate("/definicoes")}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl transition text-sm"
            >
              <Settings size={16} />
              Definições
            </button>

          </div>
        </div>

        {/* Estatísticas */}
        <div className="flex gap-6 text-gray-700 mb-4">
          <div>
            <p className="text-lg font-bold text-green-700">
              {usuario.pontos}
            </p>
            <p className="text-sm">Pontos</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-700">
              {usuario.totalTrocas}
            </p>
            <p className="text-sm">Trocas</p>
          </div>
        </div>

        {/* Barra progresso */}
        <div className="w-full bg-green-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${usuario.progressoNivel}%` }}
          ></div>
        </div>


        <p className="text-xs text-gray-500 mt-1">
          {usuario.progressoNivel}% para o próximo nível
        </p>
      </div>
    </section>
  );
}
