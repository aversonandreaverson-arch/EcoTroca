import React from "react";
import { CalendarDays, MapPin, Users } from "lucide-react"; // Ícones do lucide-react
import Header from "./Header"; // Navbar/Header separado

export default function Eventos() {
  // Criamos uma lista de eventos para mostrar na tela
  const eventos = [
    {
      titulo: "Limpeza da Praia",
      data: "10 Março 2026",
      local: "Praia da Ilha",
      participantes: 32,
      status: "Aberto",
      imagem: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
    },
    {
      titulo: "Campanha de Reciclagem",
      data: "22 Março 2026",
      local: "Viana",
      participantes: 18,
      status: "Aberto",
      imagem: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b"
    }
  ];

  return (
    // Container principal da página
    <div id="Eventos" className="min-h-screen bg-green-700 pt-24 p-6">

      {/* Chamamos o Header separado */}
      <div className="mb-12">
        <Header />
      </div>

      <div className="px-6 pb-12">

        {/* Título da seção */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white">
            Eventos Sustentáveis 
          </h2>
          <p className="text-gray-300 mt-2">
            Participe e ganhe pontos ajudando o meio ambiente.
          </p>
        </div>

        {/* Lista de cards de eventos */}
        <div className="grid md:grid-cols-2 gap-8">
          {eventos.map((evento, index) => (
            <div
              key={index} // Sempre colocar key quando usamos map
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition duration-300"
            >

              {/* Imagem do evento */}
              <img
                src={evento.imagem}
                alt={evento.titulo} // Alt é importante para acessibilidade
                className="w-full h-48 object-cover"
              />

              <div className="p-6">

                {/* Título do evento */}
                <h3 className="text-xl font-semibold text-green-700 mb-4">
                  {evento.titulo}
                </h3>

                {/* Informações do evento */}
                <div className="space-y-3 text-gray-600 text-sm mb-6">

                  {/* Data do evento */}
                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-green-600" />
                    <span>{evento.data}</span>
                  </div>

                  {/* Local do evento */}
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-green-600" />
                    <span>{evento.local}</span>
                  </div>

                  {/* Número de participantes */}
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-green-600" />
                    <span>{evento.participantes} participantes</span>
                  </div>

                </div>

                {/* Botão para participar */}
                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-xl transition">
                  Participar
                </button>

              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
