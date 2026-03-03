
// useState  → guarda dados que podem mudar (ex: as estatísticas)
// useEffect → executa código quando a página abre (ex: ir buscar dados à API)
import { useState, useEffect } from 'react';

// useNavigate → permite navegar para outras páginas ao clicar num cartão
import { useNavigate } from 'react-router-dom';

// Ícones da biblioteca Lucide — cada um é um ícone SVG já pronto
import {
  Users,        // ícone de pessoa / grupo de pessoas
  Building2,    // ícone de edifício (empresas)
  Recycle,      // ícone de reciclagem
  Package,      // ícone de caixa (entregas)
  TrendingUp,   // ícone de gráfico a subir (total transaccionado)
  CheckCircle,  // ícone de visto (concluído)
  Clock,        // ícone de relógio (pendente / últimas entregas)
  XCircle,      // ícone de X (cancelado)
  Banknote,     // ícone de nota de dinheiro (financeiro)
  AlertCircle   // ícone de alerta (erro)
} from 'lucide-react';

// Header → barra de navegação do admin no topo da página
import Header from './Header.jsx';

// pedido → função do api.js que faz chamadas ao backend (GET, POST, etc.)
import { pedido } from '../../api.js';

// ── Componente principal ─────────────────────────────────────
export default function DashboardAdmin() {

  // useNavigate devolve uma função que usamos para mudar de página
  const navigate = useNavigate();

  // stats → guarda os dados que vêm da API (null enquanto não chegam)
  const [stats, setStats] = useState(null);

  // carregando → true enquanto os dados ainda não chegaram da API
  const [carregando, setCarregando] = useState(true);

  // erro → guarda a mensagem de erro se algo correr mal
  const [erro, setErro] = useState('');

  // useEffect com [] → executa só uma vez, quando a página abre
  useEffect(() => {

    // Função assíncrona para ir buscar os dados ao backend
    const carregar = async () => {
      try {
        // Faz GET /api/admin/dashboard e guarda a resposta em "dados"
        const dados = await pedido('/admin/dashboard');

        // Guarda os dados recebidos no estado "stats"
        setStats(dados);

      } catch (err) {
        // Se houve erro (ex: sem internet, servidor em baixo), guarda a mensagem
        setErro(err.message);

      } finally {
        // Seja sucesso ou erro, marca que o carregamento terminou
        setCarregando(false);
      }
    };

    // Chama a função que acabámos de definir
    carregar();

  }, []); // [] significa: executa só uma vez quando o componente monta

  // ── Ecrã de carregamento ────────────────────────────────────
  // Enquanto os dados não chegam, mostra uma mensagem simples
  if (carregando) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      {/* Header aparece mesmo durante o carregamento */}
      <Header />
      <p className="text-white text-lg">A carregar...</p>
    </div>
  );

  // ── Ecrã de erro ────────────────────────────────────────────
  // Se houve um erro ao carregar, mostra a mensagem de erro
  if (erro) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header />
      <div className="bg-red-50 text-red-700 rounded-2xl p-6 flex items-center gap-3">
        <AlertCircle size={20} />
        <p>{erro}</p>
      </div>
    </div>
  );

  // ── Ecrã principal (quando os dados chegaram com sucesso) ───
  return (
    <div className="min-h-screen bg-gray-900 pt-24 p-6">

      {/* Barra de navegação fixa no topo */}
      <Header />

      {/* ── Cabeçalho de boas-vindas ── */}
      <div className="bg-white/10 text-white rounded-2xl p-6 shadow-lg mb-8">
        <h2 className="text-3xl font-bold mb-1">Painel de Administração</h2>
        <p className="opacity-70 text-sm">EcoTroca Angola — visão geral da plataforma</p>
      </div>

      {/* ══════════════════════════════════════════════
          SECÇÃO 1 — Utilizadores registados
          Mostra quantos utilizadores, empresas e
          coletadores existem na plataforma
      ══════════════════════════════════════════════ */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Users size={18} /> Utilizadores Registados
      </h3>

      {/* Grid de 2 colunas no mobile, 4 no desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        {/* Total de utilizadores comuns — ao clicar vai para a lista */}
        <CartaoStat
          icon={<Users size={22} className="text-blue-400" />}
          label="Total de Utilizadores"
          valor={stats?.utilizadores?.total ?? 0}
          // ?? 0 → se o valor for null ou undefined, mostra 0
          cor="blue"
          onClick={() => navigate('/AdminUtilizadores')}
        />

        {/* Total de empresas registadas */}
        <CartaoStat
          icon={<Building2 size={22} className="text-purple-400" />}
          label="Empresas"
          valor={stats?.empresas?.total ?? 0}
          cor="purple"
          onClick={() => navigate('/AdminEmpresas')}
        />

        {/* Total de coletadores registados */}
        <CartaoStat
          icon={<Recycle size={22} className="text-green-400" />}
          label="Coletadores"
          valor={stats?.coletadores?.total ?? 0}
          cor="green"
          onClick={() => navigate('/AdminColetadores')}
        />

        {/* Utilizadores comuns (sem coletadores nem empresas) */}
        <CartaoStat
          icon={<Users size={22} className="text-yellow-400" />}
          label="Utilizadores Comuns"
          valor={stats?.utilizadores?.comuns ?? 0}
          cor="yellow"
          onClick={() => navigate('/AdminUtilizadores')}
        />
      </div>

      {/* ══════════════════════════════════════════════
          SECÇÃO 2 — Entregas
          Mostra o total de entregas e quantas estão
          em cada estado (pendente, concluída, cancelada)
      ══════════════════════════════════════════════ */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Package size={18} /> Entregas
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        {/* Total de todas as entregas */}
        <CartaoStat
          icon={<Package size={22} className="text-white/70" />}
          label="Total de Entregas"
          valor={stats?.entregas?.total ?? 0}
          cor="white"
          onClick={() => navigate('/AdminEntregas')}
        />

        {/* Entregas ainda à espera de ser processadas */}
        <CartaoStat
          icon={<Clock size={22} className="text-yellow-400" />}
          label="Pendentes"
          valor={stats?.entregas?.pendentes ?? 0}
          cor="yellow"
          onClick={() => navigate('/AdminEntregas')}
        />

        {/* Entregas já concluídas com sucesso */}
        <CartaoStat
          icon={<CheckCircle size={22} className="text-green-400" />}
          label="Concluídas"
          valor={stats?.entregas?.concluidas ?? 0}
          cor="green"
          onClick={() => navigate('/AdminEntregas')}
        />

        {/* Entregas canceladas ou rejeitadas */}
        <CartaoStat
          icon={<XCircle size={22} className="text-red-400" />}
          label="Canceladas"
          valor={stats?.entregas?.canceladas ?? 0}
          cor="red"
          onClick={() => navigate('/AdminEntregas')}
        />
      </div>

      {/* ══════════════════════════════════════════════
          SECÇÃO 3 — Financeiro
          Mostra o dinheiro total que passou pela
          plataforma, as comissões ganhas (10%) e
          o total de quilogramas recolhidos
      ══════════════════════════════════════════════ */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Banknote size={18} /> Financeiro
      </h3>

      {/* Grid de 1 coluna no mobile, 3 no desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        {/* Total de dinheiro transaccionado em todas as entregas */}
        <CartaoStat
          icon={<TrendingUp size={22} className="text-green-400" />}
          label="Total Transaccionado"
          // parseFloat converte string para número antes de usar toFixed(2)
          valor={`${parseFloat(stats?.financeiro?.total_transaccionado || 0).toFixed(2)} Kz`}
          cor="green"
          grande // prop que torna o número mais pequeno para caber o valor em Kz
        />

        {/* Comissões que a plataforma ficou (10% de cada transacção) */}
        <CartaoStat
          icon={<Banknote size={22} className="text-yellow-400" />}
          label="Comissões da Plataforma (10%)"
          valor={`${parseFloat(stats?.financeiro?.total_comissoes || 0).toFixed(2)} Kz`}
          cor="yellow"
          grande
          onClick={() => navigate('/AdminRelatorios')}
        />

        {/* Total de quilogramas de resíduos recolhidos em todas as entregas */}
        <CartaoStat
          icon={<Recycle size={22} className="text-blue-400" />}
          label="Total de Kg Recolhidos"
          // toFixed(1) → mostra 1 casa decimal, ex: 12.5 kg
          valor={`${parseFloat(stats?.financeiro?.total_kg || 0).toFixed(1)} kg`}
          cor="blue"
          grande
        />
      </div>

      {/* ══════════════════════════════════════════════
          SECÇÃO 4 — Últimas entregas
          Tabela com as 10 entregas mais recentes
          de toda a plataforma
      ══════════════════════════════════════════════ */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Clock size={18} /> Últimas Entregas na Plataforma
      </h3>

      <div className="bg-white/10 rounded-2xl overflow-hidden">

        {/* Se não há entregas, mostra mensagem vazia */}
        {!stats?.entregas_recentes?.length ? (
          <p className="text-white/50 text-center py-8">
            Ainda não há entregas registadas.
          </p>
        ) : (
          // Se há entregas, mostra a tabela
          <table className="w-full text-sm">

            {/* Cabeçalho da tabela */}
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

            {/* Corpo da tabela — uma linha por entrega */}
            <tbody>
              {stats.entregas_recentes.map((e, i) => (
                // Cada linha tem um key único para o React saber qual é qual
                <tr
                  key={i}
                  className="border-b border-white/5 hover:bg-white/5 transition text-white/80"
                >
                  {/* Nome do utilizador que fez a entrega */}
                  <td className="px-4 py-3">{e.utilizador}</td>

                  {/* Nome da empresa que recebeu */}
                  <td className="px-4 py-3">{e.empresa}</td>

                  {/* Tipo de resíduo entregue */}
                  <td className="px-4 py-3">{e.residuo}</td>

                  {/* Peso em kg — se não tiver peso, mostra travessão */}
                  <td className="px-4 py-3">
                    {e.peso ? `${e.peso} kg` : '—'}
                  </td>

                  {/* Badge colorido com o estado da entrega */}
                  <td className="px-4 py-3">
                    <BadgeEstado estado={e.status} />
                  </td>

                  {/* Data formatada para o padrão angolano (dd/mm/aaaa) */}
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

// ============================================================
//  CartaoStat — Componente reutilizável para cada cartão
//
//  Recebe:
//  - icon  → o ícone a mostrar (componente Lucide)
//  - label → o texto descritivo (ex: "Total de Entregas")
//  - valor → o número ou texto a mostrar em grande
//  - cor   → a cor da borda (blue, green, yellow, red, purple, white)
//  - grande → se true, o número fica ligeiramente mais pequeno
//  - onClick → função chamada quando o cartão é clicado
// ============================================================
function CartaoStat({ icon, label, valor, cor, grande, onClick }) {

  // Mapa de cores — cada cor tem uma classe de borda normal e ao passar o rato
  const cores = {
    blue:   'border-blue-400/30 hover:border-blue-400/60',
    purple: 'border-purple-400/30 hover:border-purple-400/60',
    green:  'border-green-400/30 hover:border-green-400/60',
    yellow: 'border-yellow-400/30 hover:border-yellow-400/60',
    red:    'border-red-400/30 hover:border-red-400/60',
    white:  'border-white/20 hover:border-white/40',
  };

  return (
    <div
      onClick={onClick} // ao clicar, chama a função passada (ex: navigate)
      className={`
        bg-white/10 rounded-2xl p-5 border
        ${cores[cor] || cores.white}
        transition
        ${onClick ? 'cursor-pointer' : ''}
      `}
      // cursor-pointer só aparece se o cartão tiver um onClick
    >
      {/* Linha com o ícone e o label */}
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <p className="text-white/60 text-sm">{label}</p>
      </div>

      {/* O valor principal — maior se for normal, menor se for "grande" */}
      <p className={`text-white font-bold ${grande ? 'text-2xl' : 'text-3xl'}`}>
        {valor}
      </p>
    </div>
  );
}

// ============================================================
//  BadgeEstado — Componente para mostrar o estado da entrega
//
//  Cada estado tem uma cor diferente para ser fácil de
//  identificar visualmente:
//  - pendente  → amarelo
//  - aceite    → azul
//  - coletada  → verde (entrega concluída)
//  - cancelada → vermelho
//  - rejeitada → vermelho
// ============================================================
function BadgeEstado({ estado }) {

  // Mapa que liga cada estado a uma cor e a um texto em português
  const mapa = {
    pendente:  { cor: 'bg-yellow-400/20 text-yellow-300', label: 'Pendente'  },
    aceite:    { cor: 'bg-blue-400/20   text-blue-300',   label: 'Aceite'    },
    coletada:  { cor: 'bg-green-400/20  text-green-300',  label: 'Concluída' },
    cancelada: { cor: 'bg-red-400/20    text-red-300',    label: 'Cancelada' },
    rejeitada: { cor: 'bg-red-400/20    text-red-300',    label: 'Rejeitada' },
  };

  // Se o estado não existir no mapa, usa um estilo neutro
  const { cor, label } = mapa[estado] || {
    cor: 'bg-white/10 text-white/50',
    label: estado
  };

  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${cor}`}>
      {label}
    </span>
  );
}