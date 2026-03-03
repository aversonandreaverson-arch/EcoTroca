
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Building2, Recycle, Package,
  TrendingUp, CheckCircle, Clock, XCircle,
  Banknote, AlertCircle
} from 'lucide-react';
import Header from './Header.jsx';

// Importamos a função específica do api.js — não "pedido" que é interna
import { getDashboardAdmin } from '../../api.js';

export default function DashboardAdmin() {

  // useNavigate → função para mudar de página ao clicar num cartão
  const navigate = useNavigate();

  // stats → guarda os dados que vêm da API (null enquanto não chegam)
  const [stats, setStats] = useState(null);

  // carregando → true enquanto os dados ainda não chegaram da API
  const [carregando, setCarregando] = useState(true);

  // erro → guarda a mensagem de erro se algo correr mal
  const [erro, setErro] = useState('');

  // useEffect com [] → executa só uma vez quando a página abre
  useEffect(() => {
    const carregar = async () => {
      try {
        // Chama GET /api/admin/dashboard e guarda o resultado
        const dados = await getDashboardAdmin();
        setStats(dados);
      } catch (err) {
        // Se falhou, guarda a mensagem de erro para mostrar ao utilizador
        setErro(err.message);
      } finally {
        // Seja sucesso ou erro, o carregamento terminou
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  // ── Ecrã de carregamento ──
  if (carregando) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-white text-lg">A carregar...</p>
    </div>
  );

  // ── Ecrã de erro ──
  if (erro) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header />
      <div className="bg-red-50 text-red-700 rounded-2xl p-6 flex items-center gap-3">
        <AlertCircle size={20} />
        <p>{erro}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pt-24 p-6">
      <Header />

      {/* Cabeçalho de boas-vindas */}
      <div className="bg-white/10 text-white rounded-2xl p-6 shadow-lg mb-8">
        <h2 className="text-3xl font-bold mb-1">Painel de Administração</h2>
        <p className="opacity-70 text-sm">EcoTroca Angola — visão geral da plataforma</p>
      </div>

      {/* ══ SECÇÃO 1: Utilizadores ══ */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Users size={18} /> Utilizadores Registados
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        {/* ?? 0 → se o valor for null ou undefined, mostra 0 */}
        <CartaoStat icon={<Users size={22} className="text-blue-400" />}
          label="Total de Utilizadores" valor={stats?.utilizadores?.total ?? 0}
          cor="blue" onClick={() => navigate('/AdminUtilizadores')} />

        <CartaoStat icon={<Building2 size={22} className="text-purple-400" />}
          label="Empresas" valor={stats?.empresas?.total ?? 0}
          cor="purple" onClick={() => navigate('/AdminEmpresas')} />

        <CartaoStat icon={<Recycle size={22} className="text-green-400" />}
          label="Coletadores" valor={stats?.coletadores?.total ?? 0}
          cor="green" onClick={() => navigate('/AdminColetadores')} />

        <CartaoStat icon={<Users size={22} className="text-yellow-400" />}
          label="Utilizadores Comuns" valor={stats?.utilizadores?.comuns ?? 0}
          cor="yellow" onClick={() => navigate('/AdminUtilizadores')} />
      </div>

      {/* ══ SECÇÃO 2: Entregas ══ */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Package size={18} /> Entregas
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        <CartaoStat icon={<Package size={22} className="text-white/70" />}
          label="Total de Entregas" valor={stats?.entregas?.total ?? 0}
          cor="white" onClick={() => navigate('/AdminEntregas')} />

        <CartaoStat icon={<Clock size={22} className="text-yellow-400" />}
          label="Pendentes" valor={stats?.entregas?.pendentes ?? 0}
          cor="yellow" onClick={() => navigate('/AdminEntregas')} />

        <CartaoStat icon={<CheckCircle size={22} className="text-green-400" />}
          label="Concluídas" valor={stats?.entregas?.concluidas ?? 0}
          cor="green" onClick={() => navigate('/AdminEntregas')} />

        <CartaoStat icon={<XCircle size={22} className="text-red-400" />}
          label="Canceladas" valor={stats?.entregas?.canceladas ?? 0}
          cor="red" onClick={() => navigate('/AdminEntregas')} />
      </div>

      {/* ══ SECÇÃO 3: Financeiro ══ */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Banknote size={18} /> Financeiro
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        {/* parseFloat converte string para número antes do toFixed(2) */}
        <CartaoStat icon={<TrendingUp size={22} className="text-green-400" />}
          label="Total Transaccionado"
          valor={`${parseFloat(stats?.financeiro?.total_transaccionado || 0).toFixed(2)} Kz`}
          cor="green" grande />

        <CartaoStat icon={<Banknote size={22} className="text-yellow-400" />}
          label="Comissões da Plataforma (10%)"
          valor={`${parseFloat(stats?.financeiro?.total_comissoes || 0).toFixed(2)} Kz`}
          cor="yellow" grande onClick={() => navigate('/AdminRelatorios')} />

        <CartaoStat icon={<Recycle size={22} className="text-blue-400" />}
          label="Total de Kg Recolhidos"
          valor={`${parseFloat(stats?.financeiro?.total_kg || 0).toFixed(1)} kg`}
          cor="blue" grande />
      </div>

      {/* ══ SECÇÃO 4: Últimas Entregas ══ */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Clock size={18} /> Últimas Entregas na Plataforma
      </h3>
      <div className="bg-white/10 rounded-2xl overflow-hidden">

        {/* Se não há entregas mostra mensagem, senão mostra tabela */}
        {!stats?.entregas_recentes?.length ? (
          <p className="text-white/50 text-center py-8">
            Ainda não há entregas registadas.
          </p>
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
              {/* .map() → percorre cada entrega e cria uma linha na tabela */}
              {stats.entregas_recentes.map((e, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition text-white/80">
                  <td className="px-4 py-3">{e.utilizador}</td>
                  <td className="px-4 py-3">{e.empresa}</td>
                  <td className="px-4 py-3">{e.residuo}</td>
                  {/* Se não tem peso, mostra travessão */}
                  <td className="px-4 py-3">{e.peso ? `${e.peso} kg` : '—'}</td>
                  <td className="px-4 py-3"><BadgeEstado estado={e.status} /></td>
                  {/* toLocaleDateString converte a data para formato dd/mm/aaaa */}
                  <td className="px-4 py-3 text-white/50 text-xs">
                    {new Date(e.criado_em).toLocaleDateString('pt-AO')}
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

// ── CartaoStat ───────────────────────────────────────────────
// Cartão reutilizável que mostra um ícone, um label e um valor
// grande → torna o número ligeiramente menor para caber valores em Kz
function CartaoStat({ icon, label, valor, cor, grande, onClick }) {
  const cores = {
    blue:   'border-blue-400/30 hover:border-blue-400/60',
    purple: 'border-purple-400/30 hover:border-purple-400/60',
    green:  'border-green-400/30 hover:border-green-400/60',
    yellow: 'border-yellow-400/30 hover:border-yellow-400/60',
    red:    'border-red-400/30 hover:border-red-400/60',
    white:  'border-white/20 hover:border-white/40',
  };
  return (
    <div onClick={onClick}
      className={`bg-white/10 rounded-2xl p-5 border ${cores[cor] || cores.white} transition ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <p className="text-white/60 text-sm">{label}</p>
      </div>
      <p className={`text-white font-bold ${grande ? 'text-2xl' : 'text-3xl'}`}>{valor}</p>
    </div>
  );
}

// ── BadgeEstado ──────────────────────────────────────────────
// Etiqueta colorida que mostra o estado de cada entrega
// Cada estado tem uma cor diferente para ser fácil de identificar
function BadgeEstado({ estado }) {
  const mapa = {
    pendente:  { cor: 'bg-yellow-400/20 text-yellow-300', label: 'Pendente'  },
    aceite:    { cor: 'bg-blue-400/20   text-blue-300',   label: 'Aceite'    },
    coletada:  { cor: 'bg-green-400/20  text-green-300',  label: 'Concluída' },
    cancelada: { cor: 'bg-red-400/20    text-red-300',    label: 'Cancelada' },
    rejeitada: { cor: 'bg-red-400/20    text-red-300',    label: 'Rejeitada' },
  };
  // Se o estado não existir no mapa, usa estilo neutro
  const { cor, label } = mapa[estado] || { cor: 'bg-white/10 text-white/50', label: estado };
  return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${cor}`}>{label}</span>;
}