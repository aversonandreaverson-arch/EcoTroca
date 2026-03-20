// ============================================================
//  PerfilEmpresa.jsx
//  Guardar em: src/Components/EmpresaProfile/PerfilEmpresa.jsx
//
//  Comportamento por tipo de utilizador autenticado:
//    - empresa (própria)  → Editar Perfil + Dashboard
//    - comum              → Criar Oferta para esta Empresa
//    - coletor / admin    → sem botões de acção
//
//  Rota pública:  /PerfilEmpresa/:id  (utilizador comum vê outra empresa)
//  Rota privada:  /PerfilEmpresa      (empresa vê o próprio perfil)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2, Phone, Mail, MapPin, Clock,
  Recycle, Globe, TrendingUp, Package, CheckCircle, Plus
} from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import { getPerfilEmpresa, getEntregasEmpresa, getEmpresaPorId, getUtilizadorLocal } from '../../api.js';

export default function PerfilEmpresa() {
  const navigate    = useNavigate();
  const { id }      = useParams();          // presente quando é perfil público de outra empresa
  const utilizador  = getUtilizadorLocal(); // utilizador autenticado

  const [perfil,     setPerfil]     = useState(null);
  const [entregas,   setEntregas]   = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  // É o próprio perfil da empresa autenticada?
  const ehProprioPerfilEmpresa = utilizador?.tipo_usuario === 'empresa' && !id;

  // Utilizador comum a ver perfil de outra empresa → pode criar oferta
  const podeCreiarOferta =
    utilizador?.tipo_usuario === 'comum' && id;

  // ID da empresa a carregar — ou o da URL ou o da empresa autenticada
  const idEmpresaAlvo = id || null;

  useEffect(() => {
    const carregar = async () => {
      try {
        if (ehProprioPerfilEmpresa) {
          // Empresa a ver o seu próprio perfil
          const [dadosPerfil, dadosEntregas] = await Promise.all([
            getPerfilEmpresa(),
            getEntregasEmpresa(),
          ]);
          setPerfil(dadosPerfil);
          setEntregas(dadosEntregas);
        } else if (idEmpresaAlvo) {
          // Utilizador comum a ver perfil público de outra empresa
          const dadosPerfil = await getEmpresaPorId(idEmpresaAlvo);
          setPerfil(dadosPerfil);
          // Entregas não são visíveis publicamente
        }
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [id]);

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
        <button onClick={() => navigate(-1)} className="bg-green-600 text-white px-4 py-2 rounded-lg">
          Voltar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <HeaderEmpresa />

      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Avatar + nome ── */}
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

        {/* ── KPIs — só visíveis para a própria empresa ── */}
        {ehProprioPerfilEmpresa && (
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
        )}

        {/* ── Contactos ── */}
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
                <a href={perfil.site} target="_blank" rel="noopener noreferrer"
                  className="text-green-600 hover:underline">
                  {perfil.site}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── Horário ── */}
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

        {/* ── Resíduos aceites ── */}
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

        {/* ── Botões de acção ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Própria empresa — Editar + Dashboard */}
          {ehProprioPerfilEmpresa && (
            <>
              <button
                onClick={() => navigate('/EditarEmpresa')}
                className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition">
                Editar Perfil
              </button>
              <button
                onClick={() => navigate('/DashboardEmpresa')}
                className="bg-white hover:bg-gray-50 text-green-700 border border-green-200 py-3 rounded-xl font-medium transition">
                Dashboard
              </button>
            </>
          )}

          {/* Utilizador comum a ver perfil de empresa — Criar Oferta */}
          {podeCreiarOferta && (
            <button
              onClick={() => navigate(`/NovoResiduo?empresa=${id}`)}
              className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
              <Plus size={18} /> Criar Oferta para esta Empresa
            </button>
          )}

        </div>
      </div>
    </div>
  );
}