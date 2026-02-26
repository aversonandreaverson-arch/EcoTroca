import React, { useState, useEffect } from "react";
import { User, MapPin, Phone, Mail, Truck, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import { getPerfil } from "../../api.js";

export default function PerfilColetador() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    getPerfil()
      .then(setPerfil)
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) {
    return (
      <div className="min-h-screen bg-green-700 pt-24 flex items-center justify-center">
        <Header />
        <p className="text-white">A carregar perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-700 pt-24 p-6">
      <Header />

      <div className="max-w-2xl mx-auto">

        {/* Card principal do perfil */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-6 text-center">

          {/* Avatar */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {perfil?.foto_perfil ? (
              <img
                src={perfil.foto_perfil}
                alt="foto"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Truck size={40} className="text-green-600" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-800">{perfil?.nome}</h2>

          {/* Badge de coletador */}
          <span className="inline-block bg-green-100 text-green-700 text-sm font-medium px-4 py-1 rounded-full mt-2">
            🚛 Coletador Certificado
          </span>

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-700">—</p>
              <p className="text-xs text-gray-500">Coletas realizadas</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-700">—</p>
              <p className="text-xs text-gray-500">Ganhos totais (Kz)</p>
            </div>
          </div>
        </div>

        {/* Informações de contacto */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4">Informações</h3>

          <div className="space-y-3 text-gray-600">
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-green-500" />
              <span>{perfil?.telefone || "Não definido"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-green-500" />
              <span>{perfil?.email || "Não definido"}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-green-500" />
              <span>
                {[perfil?.bairro, perfil?.municipio, perfil?.provincia]
                  .filter(Boolean).join(", ") || "Localização não definida"}
              </span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/EditarColetador")}
            className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
          >
            Editar Perfil
          </button>
          <button
            onClick={() => navigate("/DefinicoesColetador")}
            className="bg-white hover:bg-gray-50 text-green-700 border border-green-300 py-3 rounded-xl font-medium transition"
          >
            Definições
          </button>
        </div>
      </div>
    </div>
  );
}