
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, CheckCircle, XCircle, Clock, TrendingUp, Calendar } from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import { getEntregasEmpresa, getEventosEmpresa, getPerfilEmpresa } from '../../api.js';

export default function DashboardEmpresa() {
  const navigate = useNavigate();

  const [perfil,     setPerfil]     = useState(null);
  const [entregas,   setEntregas]   = useState([]);
  const [eventos,    setEventos]    = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        const [dadosPerfil, dadosEntregas, dadosEventos] = await Promise.all([
          getPerfilEmpresa(),
          getEntregasEmpresa(),
          getEventosEmpresa(),
        ]);
        setPerfil(dadosPerfil);
        setEntregas(dadosEntregas);
        setEventos(dadosEventos);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const pendentes  = entregas.filter(e => e.status === 'pendente').length;
  const aceites    = entregas.filter(e => e.status === 'coletada').length;
  const rejeitadas = entregas.filter(e => e.status === 'cancelada').length;
  const totalKg    = entregas
    .filter(e => e.status === 'coletada')
    .reduce((acc, e) => acc + (parseFloat(e.peso_total) || 0), 0);

  if (carregando) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <HeaderEmpresa />
      <p className="text-green-700 text-lg">A carregar...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <HeaderEmpresa />

      {/* Cabeçalho de boas-vindas */}
      <div className="bg-green-600 text-white rounded-2xl p-6 shadow-lg mb-8">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-1">
              Olá, {perfil?.nome || 'Empresa'}! 🏭
            </h2>
            <p className="opacity-80">Painel da Empresa Recicladora — EcoTroca Angola</p>
            <p className="text-sm mt-1 opacity-70">
              📍 {perfil?.municipio}, {perfil?.provincia}
            </p>
          </div>
          {perfil?.horario_abertura && (
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <p className="text-xs opacity-70">Horário</p>
              <p className="font-bold">
                {perfil.horario_abertura} – {perfil.horario_fechamento}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <p className="text-red-500 text-center mb-6 bg-red-50 border border-red-200 rounded-xl p-3">
          {erro}
        </p>
      )}

      {/* Cartões de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Pendentes</h3>
            <Clock className="text-yellow-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-yellow-600">{pendentes}</p>
          <p className="text-xs text-gray-400 mt-1">a aguardar decisão</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Aceites</h3>
            <CheckCircle className="text-green-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-green-600">{aceites}</p>
          <p className="text-xs text-gray-400 mt-1">entregas processadas</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Rejeitadas</h3>
            <XCircle className="text-red-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-red-600">{rejeitadas}</p>
          <p className="text-xs text-gray-400 mt-1">resíduos recusados</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Total Recolhido</h3>
            <TrendingUp className="text-blue-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-blue-600">{totalKg.toFixed(1)} kg</p>
          <p className="text-xs text-gray-400 mt-1">resíduos processados</p>
        </div>
      </div>

      {/* Conteúdo em duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Entregas pendentes */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
              <Package size={20} /> Entregas Pendentes
            </h3>
            <button
              onClick={() => navigate('/EntregasEmpresa')}
              className="text-sm text-green-600 hover:underline"
            >
              Ver todas →
            </button>
          </div>

          {entregas.filter(e => e.status === 'pendente').length === 0 ? (
            <p className="text-gray-400 text-center py-6 text-sm">
              Sem entregas pendentes.
            </p>
          ) : (
            <ul className="space-y-3">
              {entregas
                .filter(e => e.status === 'pendente')
                .slice(0, 4)
                .map(e => (
                  <li key={e.id_entrega} className="flex justify-between items-center bg-green-50 p-3 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {e.tipos_residuos || 'Resíduo'} — {e.peso_total || '?'} kg
                      </p>
                      <p className="text-xs text-gray-500">{e.nome_usuario}</p>
                    </div>
                    <button
                      onClick={() => navigate('/EntregasEmpresa')}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition"
                    >
                      Decidir
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Eventos criados pela empresa */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
              <Calendar size={20} /> Meus Eventos
            </h3>
            <button
              onClick={() => navigate('/EventosEmpresa')}
              className="text-sm text-green-600 hover:underline"
            >
              Gerir →
            </button>
          </div>

          {eventos.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm mb-3">Ainda não criaste nenhum evento.</p>
              <button
                onClick={() => navigate('/EventosEmpresa')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm transition"
              >
                + Criar Evento
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {eventos.slice(0, 4).map(ev => (
                <li key={ev.id_evento} className="flex justify-between items-center bg-green-50 p-3 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{ev.titulo}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(ev.data_inicio).toLocaleDateString('pt-AO', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {ev.tipo}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Acesso rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[
          { label: 'Página Inicial', path: '/PaginaInicialEmpresa', icon: '🌍' },
          { label: 'Perfil',         path: '/PerfilEmpresa',        icon: '🏭' },
          { label: 'Entregas',       path: '/EntregasEmpresa',      icon: '📦' },
          { label: 'Eventos',        path: '/EventosEmpresa',       icon: '📅' },
        ].map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="bg-white rounded-2xl shadow-sm border border-green-100 p-5 text-center hover:shadow-md hover:border-green-300 transition"
          >
            <p className="text-3xl mb-2">{item.icon}</p>
            <p className="text-sm font-medium text-green-700">{item.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}