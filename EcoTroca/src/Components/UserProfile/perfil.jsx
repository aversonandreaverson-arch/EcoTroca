import React from "react";
import { Edit, Settings } from "lucide-react"; // ícones para os botões
import Header from "./Header"; // componente do cabeçalho da página
import { useNavigate } from "react-router-dom"; // hook para navegar entre páginas sem recarregar

export default function Perfil() {
  const navigate = useNavigate(); // permite navegar programaticamente

  // Dados do usuário (normalmente viriam de um back-end)
  const usuario = {
    nome: "Áverson Wambembe",
    nivel: "EcoAmigo - Nível 3",
    pontos: 240,
    totalTrocas: 12,
    avatar: "https://via.placeholder.com/80", // imagem do avatar
    progressoNivel: 60 // porcentagem de progresso para o próximo nível
  };

  return (
    // Container principal do perfil
    <section
      id="Perfil" // id para navegação por scroll ou link
      className="bg-white shadow-lg rounded-2xl p-6 m-6 flex flex-col md:flex-row items-center md:items-start gap-6 pt-24"
    >
      {/* Header da página */}
      <Header />

      {/* Avatar do usuário */}
      <img
        src={usuario.avatar} // imagem do usuário
        alt="Avatar"
        className="rounded-full w-24 h-24 md:w-32 md:h-32 border-4 border-green-600"
      />

      {/* Informações do usuário */}
      <div className="flex-1 w-full">
        {/* Nome e nível do usuário */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {usuario.nome} {/* nome do usuário */}
            </h2>
            <p className="text-green-700 font-medium">
              {usuario.nivel} {/* nível do usuário */}
            </p>
          </div>

          {/* Botões Editar e Definições */}
          <div className="flex gap-3">
            {/* BOTÃO EDITAR */}
            <button
              onClick={() => navigate("/Editar")} // vai para a página de edição
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition text-sm"
            >
              <Edit size={16} /> {/* ícone do lápis */}
              Editar
            </button>

            {/* BOTÃO DEFINIÇÕES */}
            <button
              onClick={() => navigate("/definicoes")} // vai para a página de configurações
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl transition text-sm"
            >
              <Settings size={16} /> {/* ícone de engrenagem */}
              Definições
            </button>
          </div>
        </div>

        {/* Estatísticas: Pontos e Trocas */}
        <div className="flex gap-6 text-gray-700 mb-4">
          <div>
            <p className="text-lg font-bold text-green-700">{usuario.pontos}</p>
            <p className="text-sm">Pontos</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-700">{usuario.totalTrocas}</p>
            <p className="text-sm">Trocas</p>
          </div>
        </div>

        {/* Barra de progresso para o próximo nível */}
        <div className="w-full bg-green-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${usuario.progressoNivel}%` }} // largura proporcional ao progresso
          ></div>
        </div>

        {/* Texto mostrando a porcentagem de progresso */}
        <p className="text-xs text-gray-500 mt-1">
          {usuario.progressoNivel}% para o próximo nível
        </p>
      </div>
    </section>
  );
}
