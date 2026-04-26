import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Building2, Recycle, Package,
  TrendingUp, CheckCircle, Clock, XCircle,
  Banknote, AlertCircle, BarChart2, PieChart
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line,
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import Header from './Header.jsx';
import { getDashboardAdmin } from '../../api.js';

const VERDE = '#16a34a';
const VERDE_CL = '#4ade80';
const VERDE_ESC = '#14532d';
const VERDES = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', '#166534', '#15803d'];

export default function DashboardAdmin() {
  const navigate = useNavigate();

  const [stats,      setStats]      = useState(null);
  const [graficos,   setGraficos]   = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        const token = localStorage.getItem('token');

        // Carrega dashboard e gráficos em paralelo
        const [dados, dadosGraficos] = await Promise.all([
          getDashboardAdmin(),
          fetch('http://localhost:3000/api/admin/graficos', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()),
        ]);

        setStats(dados);
        setGraficos(dadosGraficos);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  if (carregando) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-white text-lg">A carregar...</p>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header />
      <div className="bg-red-50 text-red-700 rounded-2xl p-6 flex items-center gap-3">
        <AlertCircle size={20} /> <p>{erro}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pt-24 p-6">
      <Header />

      {/* Cabeçalho */}
      <div className="bg-white/10 text-white rounded-2xl p-6 shadow-lg mb-8">
        <h2 className="text-3xl font-bold mb-1">Painel de Administração</h2>
        <p className="opacity-70 text-sm">EcoTroca Angola — visão geral da plataforma</p>
      </div>

      {/* KPIs — Utilizadores */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Users size={18} /> Utilizadores Registados
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <CartaoStat icon={<Users size={22} className="text-green-400" />}
          label="Total na Plataforma" valor={stats?.utilizadores?.total ?? 0}
          cor="green" onClick={() => navigate('/AdminUtilizadores')} />
        <CartaoStat icon={<Users size={22} className="text-green-400" />}
          label="Cidadãos" valor={stats?.utilizadores?.comuns ?? 0}
          cor="green" onClick={() => navigate('/AdminUtilizadores')} />
        <CartaoStat icon={<Building2 size={22} className="text-green-400" />}
          label="Empresas" valor={stats?.empresas?.total ?? 0}
          cor="green" onClick={() => navigate('/AdminUtilizadores')} />
        <CartaoStat icon={<Recycle size={22} className="text-green-400" />}
          label="Coletadores" valor={stats?.coletadores?.total ?? 0}
          cor="green" onClick={() => navigate('/AdminUtilizadores')} />
      </div>

      {/* KPIs — Entregas */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Package size={18} /> Entregas
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <CartaoStat icon={<Package size={22} className="text-green-400" />}
          label="Total" valor={stats?.entregas?.total ?? 0}
          cor="green" />
        <CartaoStat icon={<Clock size={22} className="text-green-400" />}
          label="Pendentes" valor={stats?.entregas?.pendentes ?? 0}
          cor="green" />
        <CartaoStat icon={<CheckCircle size={22} className="text-green-400" />}
          label="Concluídas" valor={stats?.entregas?.concluidas ?? 0}
          cor="green" />
        <CartaoStat icon={<XCircle size={22} className="text-green-400" />}
          label="Canceladas" valor={stats?.entregas?.canceladas ?? 0}
          cor="green" />
      </div>

      {/* KPIs — Financeiro */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Banknote size={18} /> Financeiro
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <CartaoStat icon={<TrendingUp size={22} className="text-green-400" />}
          label="Total Transaccionado"
          valor={`${parseFloat(stats?.financeiro?.total_transaccionado || 0).toFixed(0)} Kz`}
          cor="green" grande />
        <CartaoStat icon={<Banknote size={22} className="text-green-400" />}
          label="Comissões (10%)"
          valor={`${parseFloat(stats?.financeiro?.total_comissoes || 0).toFixed(0)} Kz`}
          cor="green" grande onClick={() => navigate('/AdminRelatorios')} />
        <CartaoStat icon={<Recycle size={22} className="text-green-400" />}
          label="Total Kg Recolhidos"
          valor={`${parseFloat(stats?.financeiro?.total_kg || 0).toFixed(1)} kg`}
          cor="green" grande />
      </div>

      {/* ═══════════ GRÁFICOS ═══════════ */}

      {/* Linha separadora */}
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 size={20} className="text-green-400" />
        <h3 className="text-white font-semibold text-lg">Análise da Plataforma</h3>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Gráfico 1 — Entregas por dia */}
        <div className="bg-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-green-400" />
            <h4 className="text-white font-semibold text-sm">Entregas ao Longo do Tempo</h4>
          </div>
          <p className="text-white/40 text-xs mb-4">A plataforma está a ser usada?</p>
          {graficos?.entregas_semana?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={graficos.entregas_semana} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="dia" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                />
                <Bar dataKey="total" fill={VERDE} radius={[4, 4, 0, 0]} name="Entregas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <SemDados />
          )}
        </div>

        {/* Gráfico 2 — Receita por dia */}
        <div className="bg-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-green-400" />
            <h4 className="text-white font-semibold text-sm">Receita ao Longo do Tempo</h4>
          </div>
          <p className="text-white/40 text-xs mb-4">Estamos a ganhar dinheiro?</p>
          {graficos?.receita_semana?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={graficos.receita_semana} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="dia" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                  formatter={(v) => [`${parseFloat(v).toFixed(0)} Kz`]}
                />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <Line type="monotone" dataKey="receita"  stroke={VERDE}    strokeWidth={2} dot={false} name="Receita (Kz)" />
                <Line type="monotone" dataKey="comissao" stroke={VERDE_CL} strokeWidth={2} dot={false} name="Comissão (Kz)" strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <SemDados />
          )}
        </div>
      </div>

      {/* Gráfico 3 — Tipos de resíduos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={16} className="text-green-400" />
            <h4 className="text-white font-semibold text-sm">Tipos de Resíduos Reciclados</h4>
          </div>
          <p className="text-white/40 text-xs mb-4">O que as pessoas mais reciclam?</p>
          {graficos?.tipos_residuos?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie
                  data={graficos.tipos_residuos}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="valor"
                  nameKey="nome"
                  label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                >
                  {graficos.tipos_residuos.map((_, i) => (
                    <Cell key={i} fill={VERDES[i % VERDES.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                  formatter={(v, n) => [`${v} entregas`, n]}
                />
              </RechartsPie>
            </ResponsiveContainer>
          ) : (
            <SemDados />
          )}
        </div>

        {/* Estado das entregas */}
        <div className="bg-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-green-400" />
            <h4 className="text-white font-semibold text-sm">Estado das Entregas</h4>
          </div>
          <p className="text-white/40 text-xs mb-4">Há problemas operacionais?</p>
          {stats?.entregas?.total > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[
                  { estado: 'Pendentes',  total: stats.entregas.pendentes  || 0 },
                  { estado: 'Concluídas', total: stats.entregas.concluidas || 0 },
                  { estado: 'Canceladas', total: stats.entregas.canceladas || 0 },
                ]}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="estado" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Entregas">
                  {[VERDE, VERDE_CL, VERDE_ESC].map((cor, i) => (
                    <Cell key={i} fill={cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <SemDados />
          )}
        </div>
      </div>

      {/* Gráfico 5 — Crescimento da plataforma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-green-400" />
            <h4 className="text-white font-semibold text-sm">Crescimento da Plataforma</h4>
          </div>
          <p className="text-white/40 text-xs mb-4">Estamos a crescer ou a morrer?</p>
          {graficos?.crescimento?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={graficos.crescimento} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="dia" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <Line type="monotone" dataKey="utilizadores" stroke={VERDE}    strokeWidth={2} dot={false} name="Utilizadores" />
                <Line type="monotone" dataKey="empresas"     stroke={VERDE_CL} strokeWidth={2} dot={false} name="Empresas" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="coletadores"  stroke="#86efac"  strokeWidth={2} dot={false} name="Coletadores" strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <SemDados />
          )}
        </div>

        {/* Gráfico 6 — Top Empresas */}
        <div className="bg-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-green-400" />
            <h4 className="text-white font-semibold text-sm">Top Empresas por Volume</h4>
          </div>
          <p className="text-white/40 text-xs mb-4">Quem está a funcionar bem?</p>
          {graficos?.top_empresas?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={graficos.top_empresas}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis type="category" dataKey="nome" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} width={80} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }}
                  formatter={(v) => [`${parseFloat(v).toFixed(1)} kg`]}
                />
                <Bar dataKey="total_kg" fill={VERDE} radius={[0, 4, 4, 0]} name="Kg recolhidos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <SemDados />
          )}
        </div>
      </div>

      {/* Últimas Entregas */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Clock size={18} /> Últimas Entregas
      </h3>
      <div className="bg-white/10 rounded-2xl overflow-hidden mb-6">
        {!stats?.entregas_recentes?.length ? (
          <p className="text-white/50 text-center py-8">Ainda não há entregas registadas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/50 border-b border-white/10 text-left">
                <th className="px-4 py-3">Utilizador</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Resíduo</th>
                <th className="px-4 py-3">Peso</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {stats.entregas_recentes.map((e, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition text-white/80">
                  <td className="px-4 py-3">{e.utilizador}</td>
                  <td className="px-4 py-3">{e.empresa}</td>
                  <td className="px-4 py-3">{e.residuo || '—'}</td>
                  <td className="px-4 py-3">{e.peso ? `${e.peso} kg` : '—'}</td>
                  <td className="px-4 py-3"><BadgeEstado estado={e.status} /></td>
                  <td className="px-4 py-3 text-white/50 text-xs">
                    {e.criado_em ? new Date(e.criado_em).toLocaleDateString('pt-AO') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Componentes auxiliares ────────────────────────────────────
function CartaoStat({ icon, label, valor, grande, onClick }) {
  return (
    <div onClick={onClick}
      className={`bg-white/10 rounded-2xl p-5 border border-green-400/20 hover:border-green-400/50 transition ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <p className="text-white/60 text-sm">{label}</p>
      </div>
      <p className={`text-white font-bold ${grande ? 'text-2xl' : 'text-3xl'}`}>{valor}</p>
    </div>
  );
}

function BadgeEstado({ estado }) {
  const mapa = {
    pendente:  { cor: 'bg-green-400/20 text-green-300',  label: 'Pendente'  },
    aceita:    { cor: 'bg-green-600/20 text-green-400',  label: 'Aceite'    },
    coletada:  { cor: 'bg-green-800/20 text-green-200',  label: 'Concluída' },
    cancelada: { cor: 'bg-white/10     text-white/40',   label: 'Cancelada' },
    rejeitada: { cor: 'bg-white/10     text-white/40',   label: 'Rejeitada' },
  };
  const { cor, label } = mapa[estado] || { cor: 'bg-white/10 text-white/50', label: estado };
  return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${cor}`}>{label}</span>;
}

function SemDados() {
  return (
    <div className="h-44 flex items-center justify-center">
      <p className="text-white/30 text-sm">Ainda não há dados suficientes.</p>
    </div>
  );
}