import React from "react";
import { BookOpen, Tag } from "lucide-react";
import Header from "./Header";

export default function Educacao() {
  // MOCK DATA (substituir pelo backend depois)
  const artigos = [
    {
      titulo: "Como reciclar plástico",
      descricao: "Aprenda passo a passo como reciclar plástico em casa e contribuir para um mundo mais limpo.",
      categoria: "Reciclagem",
      nivel: "Iniciante",
      imagem: "https://images.unsplash.com/photo-1581091870621-4b3fcd6e68b1?auto=format&fit=crop&w=800&q=80" // Exemplo
    },
    {
      titulo: "Importância da sustentabilidade",
      descricao: "Entenda por que práticas sustentáveis são essenciais para o futuro do planeta.",
      categoria: "Sustentabilidade",
      nivel: "Intermediário",
      imagem: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80" // Exemplo
    }
  ];

  return (
    
    <div id="Educacao" className="min-h-screen bg-green-700  pt-24 p-6">
        <Header/>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">
          Educação Ambiental 
        </h2>
        <p className="text-gray-300 mt-2">
          Explore artigos educativos para aprender sobre sustentabilidade e reciclagem.
        </p>
      </div>

      {/* Lista de artigos */}
      <div className="grid md:grid-cols-2 gap-6">
        {artigos.map((artigo, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition duration-300"
          >
            {/* Imagem */}
            {artigo.imagem && (
              <img
                src={artigo.imagem}
                alt={artigo.titulo}
                className="w-full h-48 object-cover rounded-t-2xl"
              />
            )}

            <div className="p-6">
              {/* Categoria */}
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-3">
                <Tag size={14} />
                {artigo.categoria}
              </span>

              {/* Título */}
              <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <BookOpen size={18} className="text-green-600" />
                {artigo.titulo}
              </h3>

              {/* Descrição */}
              <p className="text-gray-600 text-sm mb-4">
                {artigo.descricao}
              </p>

              {/* Nível do artigo */}
              <p className="text-gray-500 text-xs mb-4">
                Nível: <span className="font-medium">{artigo.nivel}</span>
              </p>

              {/* Botão */}
              <button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-xl transition">
                Ler mais
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
