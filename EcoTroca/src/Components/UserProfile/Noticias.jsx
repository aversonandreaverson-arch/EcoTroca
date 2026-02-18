import React from "react";
import { CalendarDays, Tag } from "lucide-react";
import Header from "./Header";

// Componente Notícias
export default function Noticias() {

  // Lista de notícias para exibir
  const noticias = [
    {
      titulo: "Reciclagem cresce em Angola",
      descricao:
        "O número de iniciativas sustentáveis aumentou significativamente nos últimos anos.",
      data: "05 Fevereiro 2026",
      categoria: "Sustentabilidade",
      imagem: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9"
    },
    {
      titulo: "Novas empresas apostam no verde",
      descricao:
        "Startups angolanas estão investindo em soluções ecológicas e economia circular.",
      data: "02 Fevereiro 2026",
      categoria: "Empresas",
      imagem: "https://images.unsplash.com/photo-1492724441997-5dc865305da7"
    }
  ];

  return (
    // Container principal da página
    <div id="Noticias" className="min-h-screen bg-green-700 pt-24 p-6">
      
      {/* Header separado */}
      <div className="mb-12">
        <Header />
      </div>

      {/* Conteúdo */}
      <div className="px-6 pb-12">

        {/* Título da seção */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white">
            Últimas Notícias 
          </h2>
          <p className="text-gray-300 mt-2">
            Fique atualizado sobre sustentabilidade e inovação.
          </p>
        </div>

        {/* Grid de notícias */}
        <div className="grid md:grid-cols-2 gap-8">
          {noticias.map((noticia, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition duration-300"
            >

              {/* Imagem da notícia */}
              <img
                src={noticia.imagem}
                alt={noticia.titulo}
                className="w-full h-48 object-cover"
              />

              <div className="p-6">

                {/* Categoria da notícia */}
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
                  <Tag size={14} />
                  {noticia.categoria}
                </span>

                {/* Título da notícia */}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {noticia.titulo}
                </h3>

                {/* Descrição da notícia */}
                <p className="text-gray-600 text-sm mb-4">
                  {noticia.descricao}
                </p>

                {/* Data da notícia */}
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                  <CalendarDays size={14} />
                  <span>{noticia.data}</span>
                </div>

                {/* Botão para ler mais */}
                <button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-xl transition">
                  Ler mais
                </button>

              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
