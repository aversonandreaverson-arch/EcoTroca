// ============================================================
//  PerfilEmpresa.jsx
//  Página de perfil da empresa recicladora
//  Mostra: dados da empresa, horário, resíduos aceites, carteira
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Phone, Mail, MapPin, Clock, Recycle, Wallet, Globe } from 'lucide-react';
import Header from './Header.jsx';
import { getPerfilEmpresa, getCarteira } from '../../api.js';

export default function PerfilEmpresa() {
  const navigate = useNavigate();

  // Estado dos dados
  const [perfil, setPerfil]     = useState(null);
  const [carteira, setCarteira] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]         = useState('');

  // Carrega o perfil e a carteira ao abrir a página
  useEffect(() => {
    const carregar = async () => {
      try {
        const [dadosPerfil, dadosCarteira] = await Promise.all([
          getPerfilEmpresa(),
          getCarteira(),
        ]);
        setPerfil(dadosPerfil);
        setCarteira(dadosCarteira);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  if (carregando) return (
    <div className="min-h-screen bg-green-700 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-white text-lg">A carregar perfil...</p>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen bg-green-700 pt-24 flex items-center justify-center">
      <Header />
      <div className="bg-white p-6 rounded-xl text-center">
        <p className="text-red-600 mb-4">{erro}</p>
        <button onClick={() => navigate('/Login')} className="bg-green-600 text-white px-4 py-2 rounded-lg">
          Fazer Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-700 pt-24 p-6">
      <Header />

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Card principal — avatar e nome */}
        <div className="bg-white rounded-2xl shadow-md p-8 text-center">

          {/* Avatar da empresa */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {perfil?.foto_perfil ? (
              <img
                src={perfil.foto_perfil}
                alt="logo"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Building2 size={40} className="text-green-600" />
            )}
          </div>

          {/* Nome e badge */}
          <h2 className="text-2xl font-bold text-gray-800">{perfil?.nome}</h2>
          <span className="inline-block bg-green-100 text-green-700 text-sm font-medium px-4 py-1 rounded-full mt-2">
            🏭 Empresa Recicladora
          </span>

          {/* Descrição da empresa */}
          {perfil?.descricao && (
            <p className="text-gray-500 text-sm mt-4 leading-relaxed">
              {perfil.descricao}
            </p>
          )}
        </div>

        {/* Carteira */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
            <Wallet size={20} /> Carteira
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-700">
                {carteira?.dinheiro?.toFixed(2) || '0.00'} Kz
              </p>
              <p className="text-xs text-gray-500 mt-1">💵 Dinheiro (sacável)</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {carteira?.saldo?.toFixed(2) || '0.00'} Kz
              </p>
              <p className="text-xs text-gray-500 mt-1">💳 Saldo (só na app)</p>
            </div>
          </div>
        </div>

        {/* Informações de contacto */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4">Contactos</h3>
          <div className="space-y-3 text-gray-600">

            {/* Telefone */}
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-green-500" />
              <span>{perfil?.telefone || 'Não definido'}</span>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-green-500" />
              <span>{perfil?.email || 'Não definido'}</span>
            </div>

            {/* Localização */}
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-green-500" />
              <span>
                {[perfil?.endereco, perfil?.bairro, perfil?.municipio, perfil?.provincia]
                  .filter(Boolean).join(', ') || 'Localização não definida'}
              </span>
            </div>

            {/* Website — só mostra se existir */}
            {perfil?.site && (
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-green-500" />
                <a
                  href={perfil.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline"
                >
                  {perfil.site}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Horário de funcionamento */}
        {(perfil?.horario_abertura || perfil?.horario_fechamento) && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
              <Clock size={20} /> Horário de Funcionamento
            </h3>
            <div className="flex items-center gap-4 text-gray-700">
              <div className="bg-green-50 rounded-xl px-4 py-3 text-center flex-1">
                <p className="text-xs text-gray-500 mb-1">Abertura</p>
                <p className="text-xl font-bold text-green-700">
                  {perfil.horario_abertura || '--:--'}
                </p>
              </div>
              <span className="text-gray-400 text-xl">→</span>
              <div className="bg-red-50 rounded-xl px-4 py-3 text-center flex-1">
                <p className="text-xs text-gray-500 mb-1">Fechamento</p>
                <p className="text-xl font-bold text-red-600">
                  {perfil.horario_fechamento || '--:--'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resíduos aceites pela empresa */}
        {perfil?.residuos_aceites && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
              <Recycle size={20} /> Resíduos Aceites
            </h3>
            {/* Mostra cada resíduo como badge */}
            <div className="flex flex-wrap gap-2">
              {perfil.residuos_aceites.split(',').map((r, i) => (
                <span
                  key={i}
                  className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full"
                >
                  ♻️ {r.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/EditarEmpresa')}
            className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
          >
            Editar Perfil
          </button>
          <button
            onClick={() => navigate('/DashboardEmpresa')}
            className="bg-white hover:bg-gray-50 text-green-700 border border-green-300 py-3 rounded-xl font-medium transition"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}