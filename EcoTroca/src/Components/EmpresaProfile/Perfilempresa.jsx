import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Phone, Mail, MapPin, Clock,
  Recycle, Globe, TrendingUp, Package, CheckCircle
} from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import { getPerfilEmpresa, getEntregasEmpresa } from '../../api.js';

export default function PerfilEmpresa() {
  const navigate = useNavigate();

  const [perfil,     setPerfil]     = useState(null);
  const [entregas,   setEntregas]   = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        const [dadosPerfil, dadosEntregas] = await Promise.all([
          getPerfilEmpresa(),
          getEntregasEmpresa(),
        ]);
        setPerfil(dadosPerfil);
        setEntregas(dadosEntregas);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const entregasAceites = entregas.filter(e => e.status === 'coletada');
  const totalPago       = entregasAceites.reduce((acc, e) => acc + parseFloat(e.valor_total || 0), 0);
  const totalKg         = entregasAceites.reduce((acc, e) => acc + parseFloat(e.peso_total  || 0), 0);

  if (carregando) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <HeaderEmpresa />
      <p className="text-green-700 text-lg">A carregar perfil...</p>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <HeaderEmpresa />
      <div className="bg-white p-6 rounded-xl text-center shadow-sm">
        <p className="text-red-600 mb-4">{erro}</p>
        <button onClick={() => navigate('/Login')} className="bg-green-600 text-white px-4 py-2 rounded-lg">
          Fazer Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <HeaderEmpresa />

      <div className="max-w-2xl mx-auto space-y-6">

        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {perfil?.foto_perfil ? (
              <img src={perfil.foto_perfil} alt="logo" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Building2 size={40} className="text-green-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{perfil?.nome}</h2>
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm font-medium px-4 py-1 rounded-full mt-2">
            <Building2 size={14} /> Empresa Recicladora
          </span>
          {perfil?.descricao && (
            <p className="text-gray-500 text-sm mt-4 leading-relaxed">{perfil.descricao}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 text-center">
            <div className="flex justify-center mb-2"><CheckCircle size={22} className="text-green-600" /></div>
            <p className="text-2xl font-bold text-green-700">{entregasAceites.length}</p>
            <p className="text-xs text-gray-500 mt-1">Entregas aceites</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 text-center">
            <div className="flex justify-center mb-2"><Package size={22} className="text-blue-600" /></div>
            <p className="text-2xl font-bold text-blue-700">{totalKg.toFixed(1)} kg</p>
            <p className="text-xs text-gray-500 mt-1">Resíduos recolhidos</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 text-center">
            <div className="flex justify-center mb-2"><TrendingUp size={22} className="text-orange-500" /></div>
            <p className="text-xl font-bold text-orange-600">{totalPago.toFixed(0)} Kz</p>
            <p className="text-xs text-gray-500 mt-1">Total pago</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4">Contactos</h3>
          <div className="space-y-3 text-gray-600">
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-green-500" />
              <span>{perfil?.telefone || 'Não definido'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-green-500" />
              <span>{perfil?.email || 'Não definido'}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-green-500" />
              <span>
                {[perfil?.endereco, perfil?.bairro, perfil?.municipio, perfil?.provincia]
                  .filter(Boolean).join(', ') || 'Localização não definida'}
              </span>
            </div>
            {perfil?.site && (
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-green-500" />
                <a href={perfil.site} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                  {perfil.site}
                </a>
              </div>
            )}
          </div>
        </div>

        {(perfil?.horario_abertura || perfil?.horario_fechamento) && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
            <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
              <Clock size={20} /> Horário de Funcionamento
            </h3>
            <div className="flex items-center gap-4 text-gray-700">
              <div className="bg-green-50 rounded-xl px-4 py-3 text-center flex-1">
                <p className="text-xs text-gray-500 mb-1">Abertura</p>
                <p className="text-xl font-bold text-green-700">{perfil.horario_abertura || '--:--'}</p>
              </div>
              <span className="text-gray-400 text-xl">→</span>
              <div className="bg-red-50 rounded-xl px-4 py-3 text-center flex-1">
                <p className="text-xs text-gray-500 mb-1">Fechamento</p>
                <p className="text-xl font-bold text-red-600">{perfil.horario_fechamento || '--:--'}</p>
              </div>
            </div>
          </div>
        )}

        {perfil?.residuos_aceites && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
            <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
              <Recycle size={20} /> Resíduos Aceites
            </h3>
            <div className="flex flex-wrap gap-2">
              {perfil.residuos_aceites.split(',').map((r, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                  <Recycle size={12} /> {r.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/EditarEmpresa')}
            className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
          >
            Editar Perfil
          </button>
          <button
            onClick={() => navigate('/DashboardEmpresa')}
            className="bg-white hover:bg-gray-50 text-green-700 border border-green-200 py-3 rounded-xl font-medium transition"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}