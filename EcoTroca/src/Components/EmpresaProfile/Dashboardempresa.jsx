// ============================================================
//  DashboardEmpresa.jsx
//  Guardar em: src/Components/EmpresaProfile/DashboardEmpresa.jsx
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, Package, CheckCircle, XCircle, Clock,
  TrendingUp, Users, Megaphone, Plus, ArrowRight,
  Leaf, BarChart3, CalendarCheck, Truck, X,
  FileText, Wrench, Wine,
  ThumbsDown, Smile, ThumbsUp, Star,
  ImagePlus, AlertCircle, UserCheck, ToggleLeft, ToggleRight,
  Scale, Hash, Target
} from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import {
  getEntregasEmpresa,
  getEventosEmpresa,
  getPerfilEmpresa,
  getColetadoresEmpresa,
  getFeed,
  criarPublicacao,
  getResiduos,
} from '../../api.js';

const ICONE_TIPO = {
  Plastico: <Recycle  size={20} className="mx-auto mb-1 text-green-600"  />,
  Papel:    <FileText size={20} className="mx-auto mb-1 text-yellow-600" />,
  Metal:    <Wrench   size={20} className="mx-auto mb-1 text-gray-600"   />,
  Vidro:    <Wine     size={20} className="mx-auto mb-1 text-blue-500"   />,
};

const LABEL_TIPO = {
  Plastico: 'Plástico',
  Papel:    'Papel',
  Metal:    'Metal',
  Vidro:    'Vidro',
};

const QUALIDADE_CONFIG = {
  ruim:      { icone: <ThumbsDown size={14} className="text-red-500"    />, label: 'Ruim'      },
  moderada:  { icone: <Smile      size={14} className="text-yellow-500" />, label: 'Moderada'  },
  boa:       { icone: <ThumbsUp   size={14} className="text-green-500"  />, label: 'Boa'       },
  excelente: { icone: <Star       size={14} className="text-orange-400" />, label: 'Excelente' },
};

const COR_RESIDUO = {
  'Plástico PET': 'bg-blue-100 text-blue-700',
  'Papel':        'bg-yellow-100 text-yellow-700',
  'Alumínio':     'bg-gray-100 text-gray-700',
  'Ferro':        'bg-orange-100 text-orange-700',
  'Cobre':        'bg-amber-100 text-amber-700',
};

const FORM_VAZIO = {
  tipo_publicacao:      'pedido_residuo',
  titulo:               '',
  descricao:            '',
  id_residuo:           '',
  quantidade_unidades:  '', // unidades (garrafas, sacos, etc.)
  quantidade_kg:        '', // kg — opcional se souber o peso
  minimo_para_agendar:  '', // limiar — quantidade mínima acumulada para agendar recolha
  minimo_tipo:          'kg', // 'kg' ou 'unidades' — unidade do limiar
  valor_proposto:       '',
  imagem:               '',
  observacoes:          '',
  com_coletador:        false,
  id_coletadores:       [], // selecção múltipla de coletadores dependentes
};

export default function DashboardEmpresa() {
  const navigate = useNavigate();

  const [perfil,      setPerfil]      = useState(null);
  const [entregas,    setEntregas]    = useState([]);
  const [eventos,     setEventos]     = useState([]);
  const [coletadores, setColetadores] = useState([]);
  const [pedidos,     setPedidos]     = useState([]);
  const [carregando,  setCarregando]  = useState(true);
  const [erro,        setErro]        = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [formulario,  setFormulario]  = useState(FORM_VAZIO);
  const [publicando,  setPublicando]  = useState(false);
  const [erroForm,    setErroForm]    = useState('');

  const [todosResiduos,         setTodosResiduos]         = useState([]);
  const [tiposUnicos,           setTiposUnicos]           = useState([]);
  const [tipoSelecionado,       setTipoSelecionado]       = useState('');
  const [qualidadesDisponiveis, setQualidadesDisponiveis] = useState([]);

  // Só coletadores dependentes podem ser enviados para recolha
  const coletadoresDependentes = coletadores.filter(c => c.tipo === 'dependente');

  const [imagemPreview,  setImagemPreview]  = useState('');
  const [erroImagem,     setErroImagem]     = useState('');
  const inputFicheiroRef = useRef(null);

  const residuoSeleccionado = qualidadesDisponiveis.find(
    r => String(r.id_residuo) === String(formulario.id_residuo)
  );

  // Estimativa total — só calcula se tiver kg e valor
  const estimativaTotal = (() => {
    const kg  = parseFloat(formulario.quantidade_kg);
    const val = parseFloat(formulario.valor_proposto);
    if (!kg || !val || kg <= 0 || val <= 0) return null;
    return kg * val;
  })();

  useEffect(() => {
    const carregar = async () => {
      try {
        const [dadosPerfil, dadosEntregas, dadosEventos, dadosColetadores, dadosFeed, dadosResiduos] =
          await Promise.all([
            getPerfilEmpresa(),
            getEntregasEmpresa(),
            getEventosEmpresa(),
            getColetadoresEmpresa(),
            getFeed(),
            getResiduos(),
          ]);
        setPerfil(dadosPerfil);
        setEntregas(dadosEntregas);
        setEventos(dadosEventos);
        setColetadores(dadosColetadores);
        setTodosResiduos(dadosResiduos);
        setTiposUnicos([...new Set(dadosResiduos.map(r => r.tipo))]);
        setPedidos(dadosFeed.filter(p => p.tipo_publicacao === 'pedido_residuo' && p.tipo_autor === 'empresa'));
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const pendentes      = entregas.filter(e => e.status === 'pendente').length;
  const aceites        = entregas.filter(e => e.status === 'coletada').length;
  const rejeitadas     = entregas.filter(e => e.status === 'cancelada').length;
  const totalKg        = entregas.filter(e => e.status === 'coletada').reduce((acc, e) => acc + (parseFloat(e.peso_total) || 0), 0);
  const totalKz        = entregas.filter(e => e.status === 'coletada').reduce((acc, e) => acc + (parseFloat(e.valor_total) || 0), 0);
  const totalDecididas = aceites + rejeitadas;
  const taxaAceite     = totalDecididas > 0 ? Math.round((aceites / totalDecididas) * 100) : 0;

  const handleTipo = (tipo) => {
    setTipoSelecionado(tipo);
    setFormulario(prev => ({ ...prev, id_residuo: '', valor_proposto: '' }));
    setQualidadesDisponiveis(todosResiduos.filter(r => r.tipo === tipo));
  };

  const handleQualidade = (id_residuo) => {
    setFormulario(prev => ({ ...prev, id_residuo, valor_proposto: '' }));
  };

  const handleCampo = (campo, valor) =>
    setFormulario(prev => ({ ...prev, [campo]: valor }));

  const handleToggleColetador = () => {
    setFormulario(prev => ({
      ...prev,
      com_coletador:  !prev.com_coletador,
      id_coletadores: [],
    }));
  };

  // Selecção múltipla de coletadores — clica para adicionar/remover
  const handleToggleColetadorItem = (id) => {
    setFormulario(prev => {
      const jaEsta = prev.id_coletadores.includes(id);
      return {
        ...prev,
        id_coletadores: jaEsta
          ? prev.id_coletadores.filter(c => c !== id)
          : [...prev.id_coletadores, id],
      };
    });
  };

  const handleImagem = (e) => {
    const ficheiro = e.target.files[0];
    if (!ficheiro) return;
    if (ficheiro.size > 5 * 1024 * 1024) { setErroImagem('A imagem não pode ter mais de 5MB.'); return; }
    if (!ficheiro.type.startsWith('image/')) { setErroImagem('Selecciona um ficheiro de imagem válido.'); return; }
    setErroImagem('');
    const leitor = new FileReader();
    leitor.onload = (ev) => {
      setFormulario(prev => ({ ...prev, imagem: ev.target.result }));
      setImagemPreview(ev.target.result);
    };
    leitor.readAsDataURL(ficheiro);
  };

  const removerImagem = () => {
    setFormulario(prev => ({ ...prev, imagem: '' }));
    setImagemPreview('');
    setErroImagem('');
    if (inputFicheiroRef.current) inputFicheiroRef.current.value = '';
  };

  const abrirModal = () => {
    setFormulario(FORM_VAZIO);
    setTipoSelecionado('');
    setQualidadesDisponiveis([]);
    setImagemPreview('');
    setErroImagem('');
    setErroForm('');
    setModalAberto(true);
  };

  const handlePublicarPedido = async () => {
    if (!formulario.id_residuo) { setErroForm('Selecciona o tipo e a qualidade do resíduo.'); return; }
    if (!formulario.titulo.trim()) { setErroForm('O título é obrigatório.'); return; }

    const temUnidades = formulario.quantidade_unidades && parseFloat(formulario.quantidade_unidades) > 0;
    const temKg       = formulario.quantidade_kg       && parseFloat(formulario.quantidade_kg) > 0;
    if (!temUnidades && !temKg) { setErroForm('Indica pelo menos a quantidade (unidades) ou o peso (kg).'); return; }

    if (!formulario.valor_proposto || parseFloat(formulario.valor_proposto) <= 0) {
      setErroForm('O valor é obrigatório.'); return;
    }
    if (residuoSeleccionado) {
      const v = parseFloat(formulario.valor_proposto);
      if (v < parseFloat(residuoSeleccionado.preco_min) || v > parseFloat(residuoSeleccionado.preco_max)) {
        setErroForm(`O valor deve estar entre ${residuoSeleccionado.preco_min} e ${residuoSeleccionado.preco_max} Kz/kg.`); return;
      }
    }
    // Mínimo para agendar obrigatório
    if (!formulario.minimo_para_agendar || parseFloat(formulario.minimo_para_agendar) <= 0) {
      setErroForm('Define o mínimo necessário para agendar a recolha.'); return;
    }
    if (formulario.com_coletador && formulario.id_coletadores.length === 0) {
      setErroForm('Selecciona pelo menos um coletador.'); return;
    }

    try {
      setPublicando(true);
      setErroForm('');
      await criarPublicacao(formulario);
      setModalAberto(false);
      setFormulario(FORM_VAZIO);
      const feed = await getFeed();
      setPedidos(feed.filter(p => p.tipo_publicacao === 'pedido_residuo' && p.tipo_autor === 'empresa'));
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setPublicando(false);
    }
  };

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

      {/* Banner */}
      <div className="bg-green-600 text-white rounded-2xl p-6 shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 right-24 w-28 h-28 bg-white/5 rounded-full" />
        <div className="relative flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Recycle size={22} /></div>
              <div>
                <h2 className="text-2xl font-bold">{perfil?.nome || 'Empresa'}</h2>
                <p className="text-white/70 text-sm">Empresa Recicladora — EcoTroca Angola</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-white/80 flex-wrap">
              {perfil?.provincia && <span>📍 {perfil.municipio ? `${perfil.municipio}, ` : ''}{perfil.provincia}</span>}
              {perfil?.residuos_aceites && <span>♻️ Aceita: {perfil.residuos_aceites}</span>}
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" /> Operacional</span>
            </div>
          </div>
          {perfil?.horario_abertura && (
            <div className="bg-white/20 rounded-xl px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-white/70 text-xs mb-1">Horário</p>
              <p className="font-bold text-lg">{perfil.horario_abertura} – {perfil.horario_fechamento}</p>
            </div>
          )}
        </div>
      </div>

      {erro && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6 text-sm">{erro}</div>}

      {/* KPIs linha 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Pendentes</span><div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center"><Clock size={18} className="text-yellow-500" /></div></div>
          <p className="text-3xl font-bold text-yellow-600">{pendentes}</p>
          <p className="text-xs text-gray-400 mt-1">a aguardar decisão</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Aceites</span><div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center"><CheckCircle size={18} className="text-green-500" /></div></div>
          <p className="text-3xl font-bold text-green-600">{aceites}</p>
          <p className="text-xs text-gray-400 mt-1">entregas processadas</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Rejeitadas</span><div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center"><XCircle size={18} className="text-red-500" /></div></div>
          <p className="text-3xl font-bold text-red-600">{rejeitadas}</p>
          <p className="text-xs text-gray-400 mt-1">resíduos recusados</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Total Recolhido</span><div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center"><TrendingUp size={18} className="text-blue-500" /></div></div>
          <p className="text-3xl font-bold text-blue-600">{totalKg.toFixed(1)} kg</p>
          <p className="text-xs text-gray-400 mt-1">resíduos processados</p>
        </div>
      </div>

      {/* KPIs linha 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Taxa Aceitação</span><div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center"><BarChart3 size={18} className="text-green-600" /></div></div>
          <p className="text-3xl font-bold text-green-700">{taxaAceite}%</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${taxaAceite}%` }} /></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Volume Pago</span><div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center"><Leaf size={18} className="text-purple-500" /></div></div>
          <p className="text-3xl font-bold text-purple-600">{totalKz >= 1000 ? `${(totalKz / 1000).toFixed(1)}k` : totalKz.toFixed(0)}</p>
          <p className="text-xs text-gray-400 mt-1">Kz em entregas aceites</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100 cursor-pointer hover:border-green-300 transition" onClick={() => navigate('/ColetadoresEmpresa')}>
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Coletadores</span><div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center"><Users size={18} className="text-orange-500" /></div></div>
          <p className="text-3xl font-bold text-orange-600">{coletadores.length}</p>
          <p className="text-xs text-gray-400 mt-1">na minha equipa</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100 cursor-pointer hover:border-green-300 transition" onClick={() => navigate('/PaginaInicialEmpresa')}>
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Pedidos Activos</span><div className="w-9 h-9 bg-cyan-50 rounded-xl flex items-center justify-center"><Megaphone size={18} className="text-cyan-500" /></div></div>
          <p className="text-3xl font-bold text-cyan-600">{pedidos.length}</p>
          <p className="text-xs text-gray-400 mt-1">pedidos de resíduo</p>
        </div>
      </div>

      {/* Entregas + Equipa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2"><Package size={18} /> Últimas Entregas</h3>
            <button onClick={() => navigate('/EntregasEmpresa')} className="text-green-600 text-sm flex items-center gap-1 hover:text-green-800 transition">Ver todas <ArrowRight size={14} /></button>
          </div>
          {entregas.length === 0 ? (
            <div className="text-center py-10"><Truck size={36} className="mx-auto mb-3 text-gray-200" /><p className="text-gray-400 text-sm">Sem entregas registadas.</p></div>
          ) : (
            <div className="space-y-3">
              {entregas.slice(0, 5).map(e => (
                <div key={e.id_entrega} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${e.status === 'coletada' ? 'bg-green-100' : e.status === 'pendente' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                      {e.status === 'coletada'  && <CheckCircle size={14} className="text-green-600"  />}
                      {e.status === 'pendente'  && <Clock       size={14} className="text-yellow-600" />}
                      {e.status === 'cancelada' && <XCircle     size={14} className="text-red-600"    />}
                    </div>
                    <div>
                      <p className="text-gray-800 text-sm font-medium">{e.tipos_residuos || 'Resíduo'} — {e.peso_total || '?'} kg</p>
                      <p className="text-gray-400 text-xs">{e.nome_usuario}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${e.status === 'coletada' ? 'bg-green-100 text-green-700' : e.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {e.status === 'coletada' ? 'Aceite' : e.status === 'pendente' ? 'Pendente' : 'Rejeitada'}
                    </span>
                    {e.valor_total && <p className="text-gray-400 text-xs mt-0.5">{parseFloat(e.valor_total).toFixed(0)} Kz</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2"><Users size={18} /> Minha Equipa</h3>
            <button onClick={() => navigate('/ColetadoresEmpresa')} className="text-green-600 text-sm flex items-center gap-1 hover:text-green-800 transition">Gerir <ArrowRight size={14} /></button>
          </div>
          {coletadores.length === 0 ? (
            <div className="text-center py-8"><Users size={32} className="mx-auto mb-3 text-gray-200" /><p className="text-gray-400 text-sm mb-3">Sem coletadores.</p><button onClick={() => navigate('/ColetadoresEmpresa')} className="text-green-600 text-xs border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition">+ Adicionar</button></div>
          ) : (
            <div className="space-y-3">
              {coletadores.slice(0, 5).map(c => (
                <div key={c.id_coletador} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{c.nome?.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0"><p className="text-gray-800 text-sm font-medium truncate">{c.nome}</p><p className="text-gray-400 text-xs">{c.telefone}</p></div>
                  <div className={`ml-auto w-2 h-2 rounded-full shrink-0 ${c.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              ))}
              {coletadores.length > 5 && <p className="text-green-600 text-xs text-center pt-1">+{coletadores.length - 5} coletadores</p>}
            </div>
          )}
        </div>
      </div>

      {/* Pedidos + Eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2"><Megaphone size={18} /> Pedidos de Resíduo</h3>
            <button onClick={abrirModal} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"><Plus size={13} /> Novo Pedido</button>
          </div>
          {pedidos.length === 0 ? (
            <div className="text-center py-10"><Recycle size={36} className="mx-auto mb-3 text-gray-200" /><p className="text-gray-400 text-sm mb-3">Ainda não publicaste nenhum pedido.</p><button onClick={abrirModal} className="text-green-600 text-xs border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition">+ Publicar primeiro pedido</button></div>
          ) : (
            <div className="space-y-3">
              {pedidos.slice(0, 4).map(p => (
                <div key={p.id_publicacao} className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0"><Recycle size={15} className="text-purple-600" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800 text-sm font-medium truncate">{p.titulo}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {p.tipo_residuo && <span className={`text-xs px-2 py-0.5 rounded-lg ${COR_RESIDUO[p.tipo_residuo] || 'bg-gray-100 text-gray-600'}`}>{p.tipo_residuo}</span>}
                      {p.valor_proposto && <span className="text-green-600 text-xs font-medium">{parseFloat(p.valor_proposto).toFixed(0)} Kz/kg</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{new Date(p.criado_em).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}</span>
                </div>
              ))}
              {pedidos.length > 4 && <button onClick={() => navigate('/PaginaInicialEmpresa')} className="w-full text-green-600 text-xs text-center py-2 hover:text-green-800 transition">Ver todos ({pedidos.length}) →</button>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2"><CalendarCheck size={18} /> Próximos Eventos</h3>
            <button onClick={() => navigate('/EventosEmpresa')} className="text-green-600 text-sm flex items-center gap-1 hover:text-green-800 transition">Gerir <ArrowRight size={14} /></button>
          </div>
          {eventos.length === 0 ? (
            <div className="text-center py-10"><CalendarCheck size={36} className="mx-auto mb-3 text-gray-200" /><p className="text-gray-400 text-sm mb-3">Ainda não criaste nenhum evento.</p><button onClick={() => navigate('/EventosEmpresa')} className="text-green-600 text-xs border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition">+ Criar Evento</button></div>
          ) : (
            <div className="space-y-3">
              {eventos.slice(0, 4).map(ev => (
                <div key={ev.id_evento} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-medium leading-none">{new Date(ev.data_inicio).toLocaleDateString('pt-AO', { month: 'short' }).toUpperCase()}</span>
                    <span className="text-lg font-bold leading-none">{new Date(ev.data_inicio).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1"><p className="text-gray-800 text-sm font-medium truncate">{ev.titulo}</p>{ev.local && <p className="text-gray-400 text-xs">📍 {ev.local}</p>}</div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">{ev.tipo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          MODAL: Novo Pedido de Resíduo
      ════════════════════════════════════════════════════ */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[92vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <Megaphone size={20} /> Novo Pedido de Resíduo
              </h3>
              <button onClick={() => setModalAberto(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-5">

              {/* 1. Tipo */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-2">
                  Tipo de Resíduo <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {tiposUnicos.map(tipo => (
                    <div key={tipo} onClick={() => handleTipo(tipo)}
                      className={`border rounded-xl p-3 cursor-pointer transition text-center text-sm font-medium ${
                        tipoSelecionado === tipo ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {ICONE_TIPO[tipo] || <Recycle size={20} className="mx-auto mb-1 text-gray-400" />}
                      {LABEL_TIPO[tipo] || tipo}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Qualidade */}
              {tipoSelecionado && qualidadesDisponiveis.length > 0 && (
                <div>
                  <label className="text-gray-700 text-sm font-semibold block mb-2">
                    Qualidade <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {qualidadesDisponiveis.map(r => {
                      const cfg = QUALIDADE_CONFIG[r.qualidade] || { icone: null, label: r.qualidade };
                      return (
                        <div key={r.id_residuo} onClick={() => handleQualidade(r.id_residuo)}
                          className={`border rounded-xl p-3 cursor-pointer transition ${
                            String(formulario.id_residuo) === String(r.id_residuo) ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">{cfg.icone} {cfg.label}</span>
                            {r.preco_min && r.preco_max && (
                              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">
                                {r.preco_min} – {r.preco_max} Kz
                              </span>
                            )}
                          </div>
                          {r.descricao && <p className="text-xs text-gray-400 mt-0.5">{r.descricao}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Título */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input type="text" value={formulario.titulo} onChange={e => handleCampo('titulo', e.target.value)}
                  placeholder="Ex: Procuramos papel boa qualidade — Luanda"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* 4. Descrição */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-1">
                  Descrição <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea value={formulario.descricao} onChange={e => handleCampo('descricao', e.target.value)}
                  placeholder="Condições do resíduo, forma de entrega, urgência..."
                  rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>

              {/* 5. Quantidade + Peso */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-1">
                  Quantidade <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">(preenche pelo menos um)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400"><Hash size={15} /></div>
                    <input type="number" min="1" value={formulario.quantidade_unidades}
                      onChange={e => handleCampo('quantidade_unidades', e.target.value)}
                      placeholder="Ex: 50"
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-14 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <span className="absolute right-3 top-3 text-gray-400 text-xs">unid.</span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400"><Scale size={15} /></div>
                    <input type="number" min="0.1" step="0.1" value={formulario.quantidade_kg}
                      onChange={e => handleCampo('quantidade_kg', e.target.value)}
                      placeholder="Ex: 10"
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <span className="absolute right-3 top-3 text-gray-400 text-xs">kg</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-1">
                  <Scale size={11} /> Se souberes o peso, indica os kg — ajuda a calcular o valor total
                </p>
              </div>

              {/* 6. Valor */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-1">
                  Valor (Kz/kg) <span className="text-red-500">*</span>
                </label>
                <input type="number" min="1" value={formulario.valor_proposto}
                  onChange={e => handleCampo('valor_proposto', e.target.value)}
                  placeholder={residuoSeleccionado ? `Entre ${residuoSeleccionado.preco_min} e ${residuoSeleccionado.preco_max}` : 'Ex: 300'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                {residuoSeleccionado && (
                  <p className="text-green-600 text-xs mt-1">
                    Intervalo para esta qualidade: {residuoSeleccionado.preco_min} – {residuoSeleccionado.preco_max} Kz/kg
                  </p>
                )}
              </div>

              {/* Estimativa total */}
              {estimativaTotal !== null && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-medium">Estimativa total</p>
                    <p className="text-green-600 text-xs">{formulario.quantidade_kg} kg × {formulario.valor_proposto} Kz/kg</p>
                  </div>
                  <span className="text-green-800 font-bold text-lg">
                    {estimativaTotal >= 1000 ? `${(estimativaTotal / 1000).toFixed(1)}k` : estimativaTotal.toFixed(0)} Kz
                  </span>
                </div>
              )}

              {/* 7. Mínimo para agendar recolha */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-green-600" />
                  <label className="text-gray-700 text-sm font-semibold">
                    Mínimo para agendar recolha <span className="text-red-500">*</span>
                  </label>
                </div>
                <p className="text-gray-400 text-xs mb-3">
                  Quando os acordos atingirem este valor, serás notificado para agendar a data e hora da recolha.
                </p>
                <div className="flex gap-2">
                  <input type="number" min="1" value={formulario.minimo_para_agendar}
                    onChange={e => handleCampo('minimo_para_agendar', e.target.value)}
                    placeholder="Ex: 500"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                  />
                  {/* Selector da unidade do limiar */}
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
                    <button
                      onClick={() => handleCampo('minimo_tipo', 'kg')}
                      className={`px-3 py-2 text-xs font-medium transition ${formulario.minimo_tipo === 'kg' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      kg
                    </button>
                    <button
                      onClick={() => handleCampo('minimo_tipo', 'unidades')}
                      className={`px-3 py-2 text-xs font-medium transition ${formulario.minimo_tipo === 'unidades' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      unid.
                    </button>
                  </div>
                </div>
                {formulario.minimo_para_agendar && (
                  <p className="text-green-600 text-xs mt-2">
                    A recolha será agendada quando atingires {formulario.minimo_para_agendar} {formulario.minimo_tipo === 'kg' ? 'kg' : 'unidades'} em acordos.
                  </p>
                )}
              </div>

              {/* 8. Foto */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-1">
                  Foto <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                {imagemPreview ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-green-200">
                    <img src={imagemPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={removerImagem} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition"><X size={14} /></button>
                  </div>
                ) : (
                  <div onClick={() => inputFicheiroRef.current?.click()} className="w-full h-32 border-2 border-dashed border-green-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition">
                    <ImagePlus size={28} className="text-green-300 mb-2" />
                    <p className="text-gray-400 text-xs">Clica para adicionar uma foto</p>
                    <p className="text-gray-300 text-xs mt-0.5">PNG, JPG ou WEBP · Máx. 5MB</p>
                  </div>
                )}
                <input ref={inputFicheiroRef} type="file" accept="image/*" onChange={handleImagem} className="hidden" />
                {erroImagem && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {erroImagem}</p>}
              </div>

              {/* 9. Observações */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-1">
                  Observações <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea value={formulario.observacoes} onChange={e => handleCampo('observacoes', e.target.value)}
                  placeholder="Estado esperado do resíduo, embalagem, outros detalhes..."
                  rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>

              {/* 10. Toggle coletador — sem data/hora (agendamento é feito depois) */}
              <div className={`border rounded-xl p-4 transition ${formulario.com_coletador ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between cursor-pointer" onClick={handleToggleColetador}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${formulario.com_coletador ? 'bg-green-600' : 'bg-gray-100'}`}>
                      <UserCheck size={18} className={formulario.com_coletador ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className="text-gray-800 text-sm font-semibold">Enviar coletador da equipa</p>
                      <p className="text-gray-400 text-xs">A data e hora são definidas depois, quando o mínimo for atingido</p>
                    </div>
                  </div>
                  {formulario.com_coletador
                    ? <ToggleRight size={28} className="text-green-600 shrink-0" />
                    : <ToggleLeft  size={28} className="text-gray-300 shrink-0"  />
                  }
                </div>

                {formulario.com_coletador && (
                  <div className="mt-4">
                    {coletadoresDependentes.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                        <p className="text-yellow-700 text-xs font-medium">Não tens coletadores dependentes na equipa.</p>
                        <button onClick={() => { setModalAberto(false); navigate('/ColetadoresEmpresa'); }} className="text-yellow-700 text-xs underline mt-1">
                          Adicionar coletador dependente
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 text-xs font-medium mb-2">
                          Escolhe os coletadores <span className="text-gray-400">(podes escolher mais de um)</span>
                        </p>
                        <div className="space-y-2">
                          {coletadoresDependentes.map(c => {
                            const sel = formulario.id_coletadores.includes(c.id_coletador);
                            return (
                              <div key={c.id_coletador} onClick={() => handleToggleColetadorItem(c.id_coletador)}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${sel ? 'border-green-500 bg-white' : 'border-gray-200 hover:bg-white'}`}
                              >
                                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                                  {c.nome?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-gray-800 text-sm font-medium truncate">{c.nome}</p>
                                  <p className="text-gray-400 text-xs">{c.telefone}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                                  {sel && <CheckCircle size={12} className="text-white" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {erroForm && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle size={14} /> {erroForm}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalAberto(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-sm">
                Cancelar
              </button>
              <button onClick={handlePublicarPedido} disabled={publicando} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                {publicando ? 'A publicar...' : <><Megaphone size={16} /> Publicar Pedido</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}