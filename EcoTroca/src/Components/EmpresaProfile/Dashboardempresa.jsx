// ============================================================
//  DashboardEmpresa.jsx
//  Guardar em: src/Components/EmpresaProfile/DashboardEmpresa.jsx
//  Dashboard principal da empresa recicladora no EcoTroca
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, Package, CheckCircle, XCircle, Clock,
  TrendingUp, Users, Megaphone, Plus, ArrowRight,
  Leaf, BarChart3, CalendarCheck, Truck
} from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import {
  getEntregasEmpresa,
  getEventosEmpresa,
  getPerfilEmpresa,
  getColetadoresEmpresa,
  getFeed,
  criarPublicacao,
} from '../../api.js';

// ── Tipos de resíduo com cor associada para os badges ──
const COR_RESIDUO = {
  'Plástico PET': 'bg-blue-100 text-blue-700',
  'Papel':        'bg-yellow-100 text-yellow-700',
  'Alumínio':     'bg-gray-100 text-gray-700',
  'Ferro':        'bg-orange-100 text-orange-700',
  'Cobre':        'bg-amber-100 text-amber-700',
};

// ── Formulário vazio para pedido de resíduo ──
const FORM_VAZIO = {
  tipo_publicacao: 'pedido_residuo',
  titulo: '',
  descricao: '',
  id_residuo: '',
  quantidade_kg: '',
  valor_proposto: '',
  provincia: '',
};

export default function DashboardEmpresa() {
  const navigate = useNavigate();

  // ── Estado dos dados ──
  const [perfil,      setPerfil]      = useState(null);
  const [entregas,    setEntregas]    = useState([]);
  const [eventos,     setEventos]     = useState([]);
  const [coletadores, setColetadores] = useState([]);
  const [pedidos,     setPedidos]     = useState([]); // pedidos de resíduo publicados pela empresa
  const [carregando,  setCarregando]  = useState(true);
  const [erro,        setErro]        = useState('');

  // ── Estado do modal de novo pedido de resíduo ──
  const [modalAberto, setModalAberto] = useState(false);
  const [formulario,  setFormulario]  = useState(FORM_VAZIO);
  const [publicando,  setPublicando]  = useState(false);
  const [erroForm,    setErroForm]    = useState('');

  // ── Carrega todos os dados em paralelo ao montar ──
  useEffect(() => {
    const carregar = async () => {
      try {
        const [dadosPerfil, dadosEntregas, dadosEventos, dadosColetadores, dadosFeed] =
          await Promise.all([
            getPerfilEmpresa(),
            getEntregasEmpresa(),
            getEventosEmpresa(),
            getColetadoresEmpresa(),
            getFeed(),
          ]);

        setPerfil(dadosPerfil);
        setEntregas(dadosEntregas);
        setEventos(dadosEventos);
        setColetadores(dadosColetadores);

        // Filtrar apenas pedidos de resíduo publicados por esta empresa
        const idEmpresa = dadosPerfil?.id_usuario;
        setPedidos(dadosFeed.filter(p =>
          p.tipo_publicacao === 'pedido_residuo' &&
          (p.tipo_autor === 'empresa' || p.id_autor === idEmpresa)
        ));
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  // ── Estatísticas calculadas das entregas ──
  const pendentes  = entregas.filter(e => e.status === 'pendente').length;
  const aceites    = entregas.filter(e => e.status === 'coletada').length;
  const rejeitadas = entregas.filter(e => e.status === 'cancelada').length;
  const totalKg    = entregas
    .filter(e => e.status === 'coletada')
    .reduce((acc, e) => acc + (parseFloat(e.peso_total) || 0), 0);
  const totalKz    = entregas
    .filter(e => e.status === 'coletada')
    .reduce((acc, e) => acc + (parseFloat(e.valor_total) || 0), 0);

  // ── Taxa de aceitação em percentagem ──
  const totalDecididas = aceites + rejeitadas;
  const taxaAceite = totalDecididas > 0
    ? Math.round((aceites / totalDecididas) * 100)
    : 0;

  // ── Actualiza campo do formulário ──
  const handleCampo = (campo, valor) =>
    setFormulario(prev => ({ ...prev, [campo]: valor }));

  // ── Publica um novo pedido de resíduo ──
  const handlePublicarPedido = async () => {
    // Validação mínima — título é obrigatório
    if (!formulario.titulo.trim()) {
      setErroForm('O título é obrigatório.');
      return;
    }
    try {
      setPublicando(true);
      setErroForm('');
      await criarPublicacao({ ...formulario, tipo_publicacao: 'pedido_residuo' });
      setModalAberto(false);
      setFormulario(FORM_VAZIO);
      // Recarrega o feed para mostrar o novo pedido
      const feed = await getFeed();
      const idEmpresa = perfil?.id_usuario;
      setPedidos(feed.filter(p =>
        p.tipo_publicacao === 'pedido_residuo' &&
        (p.tipo_autor === 'empresa' || p.id_autor === idEmpresa)
      ));
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setPublicando(false);
    }
  };

  // ── Ecrã de carregamento ──
  if (carregando) return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center">
      <HeaderEmpresa />
      <div className="text-center">
        <Recycle size={40} className="mx-auto mb-3 text-green-500 animate-spin" />
        <p className="text-green-700 font-medium">A carregar painel...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-16 px-6">
      <HeaderEmpresa />

      {/* ── Banner de boas-vindas ── */}
      <div className="bg-green-600 text-white rounded-2xl p-6 shadow-lg mb-8 relative overflow-hidden">
        {/* Círculos decorativos de fundo */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 right-24 w-28 h-28 bg-white/5 rounded-full" />

        <div className="relative flex justify-between items-start flex-wrap gap-4">
          <div>
            {/* Nome da empresa e subtítulo */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Recycle size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{perfil?.nome || 'Empresa'}</h2>
                <p className="text-white/70 text-sm">Empresa Recicladora — EcoTroca Angola</p>
              </div>
            </div>

            {/* Localização e estado operacional */}
            <div className="flex items-center gap-4 mt-3 text-sm text-white/80 flex-wrap">
              {perfil?.provincia && (
                <span>📍 {perfil.municipio || ''}{perfil.municipio ? ', ' : ''}{perfil.provincia}</span>
              )}
              {perfil?.residuos_aceites && (
                <span>♻️ Aceita: {perfil.residuos_aceites}</span>
              )}
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                Operacional
              </span>
            </div>
          </div>

          {/* Horário de funcionamento */}
          {perfil?.horario_abertura && (
            <div className="bg-white/20 rounded-xl px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-white/70 text-xs mb-1">Horário</p>
              <p className="font-bold text-lg">
                {perfil.horario_abertura} – {perfil.horario_fechamento}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Mensagem de erro geral ── */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6 text-sm">
          {erro}
        </div>
      )}

      {/* ── KPIs principais — linha 1 ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">

        {/* Pendentes */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 text-sm font-medium">Pendentes</span>
            <div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-yellow-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{pendentes}</p>
          <p className="text-xs text-gray-400 mt-1">a aguardar decisão</p>
        </div>

        {/* Aceites */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 text-sm font-medium">Aceites</span>
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{aceites}</p>
          <p className="text-xs text-gray-400 mt-1">entregas processadas</p>
        </div>

        {/* Rejeitadas */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 text-sm font-medium">Rejeitadas</span>
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <XCircle size={18} className="text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600">{rejeitadas}</p>
          <p className="text-xs text-gray-400 mt-1">resíduos recusados</p>
        </div>

        {/* Total Recolhido */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 text-sm font-medium">Total Recolhido</span>
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">{totalKg.toFixed(1)} kg</p>
          <p className="text-xs text-gray-400 mt-1">resíduos processados</p>
        </div>
      </div>

      {/* ── KPIs secundários — linha 2 ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        {/* Taxa de aceitação */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 text-sm font-medium">Taxa Aceitação</span>
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <BarChart3 size={18} className="text-green-600" />
            </div>
          </div>
          {/* Barra de progresso da taxa */}
          <p className="text-3xl font-bold text-green-700">{taxaAceite}%</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${taxaAceite}%` }}
            />
          </div>
        </div>

        {/* Volume financeiro */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 text-sm font-medium">Volume Pago</span>
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Leaf size={18} className="text-purple-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {totalKz >= 1000
              ? `${(totalKz / 1000).toFixed(1)}k`
              : totalKz.toFixed(0)
            }
          </p>
          <p className="text-xs text-gray-400 mt-1">Kz em entregas aceites</p>
        </div>

        {/* Coletadores activos */}
        <div
          className="bg-white rounded-2xl shadow-sm p-5 border border-green-100 cursor-pointer hover:border-green-300 transition"
          onClick={() => navigate('/ColetadoresEmpresa')}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 text-sm font-medium">Coletadores</span>
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-orange-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-600">{coletadores.length}</p>
          <p className="text-xs text-gray-400 mt-1">na minha equipa</p>
        </div>

        {/* Pedidos publicados */}
        <div
          className="bg-white rounded-2xl shadow-sm p-5 border border-green-100 cursor-pointer hover:border-green-300 transition"
          onClick={() => navigate('/PaginaInicialEmpresa')}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 text-sm font-medium">Pedidos Activos</span>
            <div className="w-9 h-9 bg-cyan-50 rounded-xl flex items-center justify-center">
              <Megaphone size={18} className="text-cyan-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-cyan-600">{pedidos.length}</p>
          <p className="text-xs text-gray-400 mt-1">pedidos de resíduo</p>
        </div>
      </div>

      {/* ── Conteúdo principal em 3 colunas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Últimas entregas — coluna larga */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <Package size={18} /> Últimas Entregas
            </h3>
            <button
              onClick={() => navigate('/EntregasEmpresa')}
              className="text-green-600 text-sm flex items-center gap-1 hover:text-green-800 transition"
            >
              Ver todas <ArrowRight size={14} />
            </button>
          </div>

          {entregas.length === 0 ? (
            <div className="text-center py-10">
              <Truck size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">Sem entregas registadas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mostra as 5 últimas entregas */}
              {entregas.slice(0, 5).map(e => (
                <div
                  key={e.id_entrega}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition"
                >
                  <div className="flex items-center gap-3">
                    {/* Ícone de estado */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      e.status === 'coletada'  ? 'bg-green-100' :
                      e.status === 'pendente'  ? 'bg-yellow-100' :
                      e.status === 'cancelada' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {e.status === 'coletada'  && <CheckCircle size={14} className="text-green-600" />}
                      {e.status === 'pendente'  && <Clock       size={14} className="text-yellow-600" />}
                      {e.status === 'cancelada' && <XCircle     size={14} className="text-red-600"    />}
                    </div>
                    <div>
                      <p className="text-gray-800 text-sm font-medium">
                        {e.tipos_residuos || 'Resíduo'} — {e.peso_total || '?'} kg
                      </p>
                      <p className="text-gray-400 text-xs">{e.nome_usuario}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {/* Badge de estado */}
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                      e.status === 'coletada'  ? 'bg-green-100 text-green-700'  :
                      e.status === 'pendente'  ? 'bg-yellow-100 text-yellow-700':
                      e.status === 'cancelada' ? 'bg-red-100 text-red-700'      : 'bg-gray-100 text-gray-600'
                    }`}>
                      {e.status === 'coletada'  ? 'Aceite'    :
                       e.status === 'pendente'  ? 'Pendente'  :
                       e.status === 'cancelada' ? 'Rejeitada' : e.status}
                    </span>
                    {e.valor_total && (
                      <p className="text-gray-400 text-xs mt-0.5">
                        {parseFloat(e.valor_total).toFixed(0)} Kz
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coletadores da equipa — coluna estreita */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <Users size={18} /> Minha Equipa
            </h3>
            <button
              onClick={() => navigate('/ColetadoresEmpresa')}
              className="text-green-600 text-sm flex items-center gap-1 hover:text-green-800 transition"
            >
              Gerir <ArrowRight size={14} />
            </button>
          </div>

          {coletadores.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm mb-3">Sem coletadores.</p>
              <button
                onClick={() => navigate('/ColetadoresEmpresa')}
                className="text-green-600 text-xs border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition"
              >
                + Adicionar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {coletadores.slice(0, 5).map(c => (
                <div key={c.id_coletador} className="flex items-center gap-3">
                  {/* Avatar inicial do nome */}
                  <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {c.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-800 text-sm font-medium truncate">{c.nome}</p>
                    <p className="text-gray-400 text-xs">{c.telefone}</p>
                  </div>
                  {/* Indicador de estado activo */}
                  <div className={`ml-auto w-2 h-2 rounded-full shrink-0 ${c.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              ))}
              {coletadores.length > 5 && (
                <p className="text-green-600 text-xs text-center pt-1">
                  +{coletadores.length - 5} coletadores
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Pedidos de resíduo publicados + Eventos — linha inferior ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pedidos de resíduo publicados pela empresa */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <Megaphone size={18} /> Pedidos de Resíduo
            </h3>
            <button
              onClick={() => { setFormulario(FORM_VAZIO); setErroForm(''); setModalAberto(true); }}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
            >
              <Plus size={13} /> Novo Pedido
            </button>
          </div>

          {pedidos.length === 0 ? (
            <div className="text-center py-10">
              <Recycle size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm mb-3">
                Ainda não publicaste nenhum pedido de resíduo.
              </p>
              <button
                onClick={() => { setFormulario(FORM_VAZIO); setErroForm(''); setModalAberto(true); }}
                className="text-green-600 text-xs border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition"
              >
                + Publicar primeiro pedido
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.slice(0, 4).map(p => (
                <div key={p.id_publicacao} className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Recycle size={15} className="text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800 text-sm font-medium truncate">{p.titulo}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {p.tipo_residuo && (
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${COR_RESIDUO[p.tipo_residuo] || 'bg-gray-100 text-gray-600'}`}>
                          {p.tipo_residuo}
                        </span>
                      )}
                      {p.provincia && (
                        <span className="text-gray-400 text-xs">📍 {p.provincia}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(p.criado_em).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
              {pedidos.length > 4 && (
                <button
                  onClick={() => navigate('/PaginaInicialEmpresa')}
                  className="w-full text-green-600 text-xs text-center py-2 hover:text-green-800 transition"
                >
                  Ver todos ({pedidos.length}) →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Próximos eventos */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <CalendarCheck size={18} /> Próximos Eventos
            </h3>
            <button
              onClick={() => navigate('/EventosEmpresa')}
              className="text-green-600 text-sm flex items-center gap-1 hover:text-green-800 transition"
            >
              Gerir <ArrowRight size={14} />
            </button>
          </div>

          {eventos.length === 0 ? (
            <div className="text-center py-10">
              <CalendarCheck size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm mb-3">Ainda não criaste nenhum evento.</p>
              <button
                onClick={() => navigate('/EventosEmpresa')}
                className="text-green-600 text-xs border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition"
              >
                + Criar Evento
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {eventos.slice(0, 4).map(ev => (
                <div key={ev.id_evento} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  {/* Data do evento em formato compacto */}
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-medium leading-none">
                      {new Date(ev.data_inicio).toLocaleDateString('pt-AO', { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {new Date(ev.data_inicio).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800 text-sm font-medium truncate">{ev.titulo}</p>
                    {ev.local && (
                      <p className="text-gray-400 text-xs">📍 {ev.local}</p>
                    )}
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
                    {ev.tipo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Novo Pedido de Resíduo ── */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <Megaphone size={20} /> Novo Pedido de Resíduo
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-4">

              {/* Título do pedido */}
              <div>
                <label className="text-gray-600 text-sm block mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formulario.titulo}
                  onChange={e => handleCampo('titulo', e.target.value)}
                  placeholder="Ex: Precisamos de plástico PET limpo"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="text-gray-600 text-sm block mb-1">Descrição (opcional)</label>
                <textarea
                  value={formulario.descricao}
                  onChange={e => handleCampo('descricao', e.target.value)}
                  placeholder="Condições do resíduo, forma de entrega, etc..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>

              {/* Quantidade e valor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 text-sm block mb-1">Quantidade (kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={formulario.quantidade_kg}
                    onChange={e => handleCampo('quantidade_kg', e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-sm block mb-1">Valor (Kz/kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={formulario.valor_proposto}
                    onChange={e => handleCampo('valor_proposto', e.target.value)}
                    placeholder="Ex: 200"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>

              {/* Província */}
              <div>
                <label className="text-gray-600 text-sm block mb-1">Província</label>
                <input
                  type="text"
                  value={formulario.provincia}
                  onChange={e => handleCampo('provincia', e.target.value)}
                  placeholder="Ex: Luanda"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Mensagem de erro do formulário */}
              {erroForm && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{erroForm}</p>
              )}
            </div>

            <button
              onClick={handlePublicarPedido}
              disabled={publicando}
              className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {publicando ? 'A publicar...' : <><Megaphone size={16} /> Publicar Pedido</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}