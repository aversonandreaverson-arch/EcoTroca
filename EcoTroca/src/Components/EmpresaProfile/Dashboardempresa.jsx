// ============================================================
//  DashboardEmpresa.jsx
//  Guardar em: src/Components/EmpresaProfile/DashboardEmpresa.jsx
//  Dashboard principal da empresa recicladora no EcoTroca
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, Package, CheckCircle, XCircle, Clock,
  TrendingUp, Users, Megaphone, Plus, ArrowRight,
  Leaf, BarChart3, CalendarCheck, Truck, X,
  FileText, Wrench, Wine, Home, MapPin,
  ThumbsDown, Smile, ThumbsUp, Star,
  ImagePlus, AlertCircle
} from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import {
  getEntregasEmpresa,    // entregas associadas a esta empresa
  getEventosEmpresa,     // eventos criados por esta empresa
  getPerfilEmpresa,      // dados do perfil da empresa
  getColetadoresEmpresa, // coletadores da equipa
  getFeed,               // feed geral para filtrar pedidos da empresa
  criarPublicacao,       // cria uma publicação no feed (pedido_residuo)
  getResiduos,           // lista tipos de resíduo com qualidade, preco_min e preco_max
} from '../../api.js';

// ── Ícones por tipo de resíduo — igual ao NovoResiduo.jsx ────
const ICONE_TIPO = {
  Plastico: <Recycle  size={20} className="mx-auto mb-1 text-green-600"  />,
  Papel:    <FileText size={20} className="mx-auto mb-1 text-yellow-600" />,
  Metal:    <Wrench   size={20} className="mx-auto mb-1 text-gray-600"   />,
  Vidro:    <Wine     size={20} className="mx-auto mb-1 text-blue-500"   />,
};

// ── Labels legíveis por tipo de resíduo ──────────────────────
const LABEL_TIPO = {
  Plastico: 'Plástico',
  Papel:    'Papel',
  Metal:    'Metal',
  Vidro:    'Vidro',
};

// ── Ícone e label por qualidade — igual ao NovoResiduo.jsx ───
const QUALIDADE_CONFIG = {
  ruim:      { icone: <ThumbsDown size={14} className="text-red-500"    />, label: 'Ruim'      },
  moderada:  { icone: <Smile      size={14} className="text-yellow-500" />, label: 'Moderada'  },
  boa:       { icone: <ThumbsUp   size={14} className="text-green-500"  />, label: 'Boa'       },
  excelente: { icone: <Star       size={14} className="text-orange-400" />, label: 'Excelente' },
};

// ── Cores por tipo de resíduo para os badges da lista ────────
const COR_RESIDUO = {
  'Plástico PET': 'bg-blue-100 text-blue-700',
  'Papel':        'bg-yellow-100 text-yellow-700',
  'Alumínio':     'bg-gray-100 text-gray-700',
  'Ferro':        'bg-orange-100 text-orange-700',
  'Cobre':        'bg-amber-100 text-amber-700',
};

// ── Formulário inicial vazio para novo pedido de resíduo ─────
const FORM_VAZIO = {
  tipo_publicacao: 'pedido_residuo', // fixo — empresa publica pedido de resíduo
  titulo:          '',
  descricao:       '',
  id_residuo:      '',               // id do resíduo seleccionado (tipo + qualidade)
  quantidade_kg:   '',
  valor_proposto:  '',               // validado contra preco_min/preco_max da tabela Residuo
  provincia:       '',
  imagem:          '',               // base64 da foto do resíduo
};

export default function DashboardEmpresa() {
  const navigate = useNavigate();

  // ── Estado dos dados carregados da API ───────────────────
  const [perfil,      setPerfil]      = useState(null);
  const [entregas,    setEntregas]    = useState([]);
  const [eventos,     setEventos]     = useState([]);
  const [coletadores, setColetadores] = useState([]);
  const [pedidos,     setPedidos]     = useState([]); // pedidos_residuo da empresa no feed
  const [carregando,  setCarregando]  = useState(true);
  const [erro,        setErro]        = useState('');

  // ── Estado do modal de novo pedido ───────────────────────
  const [modalAberto, setModalAberto] = useState(false);
  const [formulario,  setFormulario]  = useState(FORM_VAZIO);
  const [publicando,  setPublicando]  = useState(false);
  const [erroForm,    setErroForm]    = useState('');

  // ── Estado do selector de resíduo (igual ao NovoResiduo) ─
  const [todosResiduos,         setTodosResiduos]         = useState([]); // lista completa da BD
  const [tiposUnicos,           setTiposUnicos]           = useState([]); // ex: ['Plastico','Papel']
  const [tipoSelecionado,       setTipoSelecionado]       = useState(''); // ex: 'Plastico'
  const [qualidadesDisponiveis, setQualidadesDisponiveis] = useState([]); // qualidades do tipo escolhido

  // ── Estado do upload de imagem ────────────────────────────
  const [imagemPreview,  setImagemPreview]  = useState(''); // URL local para pré-visualização
  const [erroImagem,     setErroImagem]     = useState(''); // erro de validação do ficheiro
  const inputFicheiroRef = useRef(null);                     // ref para o input file escondido

  // ── Resíduo seleccionado para mostrar preços de referência ─
  const residuoSeleccionado = qualidadesDisponiveis.find(
    r => String(r.id_residuo) === String(formulario.id_residuo)
  );

  // ── Carrega todos os dados ao montar o componente ─────────
  useEffect(() => {
    const carregar = async () => {
      try {
        // Todas as chamadas em simultâneo para reduzir tempo de espera
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

        // Guardar lista completa de resíduos e extrair tipos únicos
        setTodosResiduos(dadosResiduos);
        setTiposUnicos([...new Set(dadosResiduos.map(r => r.tipo))]);

        // Filtrar do feed só os pedidos de resíduo publicados por empresas
        setPedidos(
          dadosFeed.filter(p => p.tipo_publicacao === 'pedido_residuo' && p.tipo_autor === 'empresa')
        );
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  // ── Estatísticas calculadas das entregas ──────────────────
  const pendentes  = entregas.filter(e => e.status === 'pendente').length;
  const aceites    = entregas.filter(e => e.status === 'coletada').length;
  const rejeitadas = entregas.filter(e => e.status === 'cancelada').length;

  // Total de kg processados — só conta entregas já coletadas
  const totalKg = entregas
    .filter(e => e.status === 'coletada')
    .reduce((acc, e) => acc + (parseFloat(e.peso_total) || 0), 0);

  // Total em Kz pago nas entregas aceites
  const totalKz = entregas
    .filter(e => e.status === 'coletada')
    .reduce((acc, e) => acc + (parseFloat(e.valor_total) || 0), 0);

  // Taxa de aceitação em % — evita divisão por zero
  const totalDecididas = aceites + rejeitadas;
  const taxaAceite = totalDecididas > 0
    ? Math.round((aceites / totalDecididas) * 100)
    : 0;

  // ── Ao seleccionar o tipo, actualiza as qualidades disponíveis ─
  // Igual ao handleTipo do NovoResiduo.jsx
  const handleTipo = (tipo) => {
    setTipoSelecionado(tipo);
    setFormulario(prev => ({ ...prev, id_residuo: '', valor_proposto: '' })); // limpa qualidade e valor
    setQualidadesDisponiveis(todosResiduos.filter(r => r.tipo === tipo));
  };

  // ── Ao seleccionar a qualidade, guarda o id_residuo ──────
  const handleQualidade = (id_residuo) => {
    setFormulario(prev => ({ ...prev, id_residuo, valor_proposto: '' })); // limpa valor ao mudar qualidade
  };

  // ── Actualiza qualquer campo do formulário ────────────────
  const handleCampo = (campo, valor) =>
    setFormulario(prev => ({ ...prev, [campo]: valor }));

  // ── Processa o ficheiro de imagem — igual ao NovoResiduo ─
  const handleImagem = (e) => {
    const ficheiro = e.target.files[0];
    if (!ficheiro) return;

    // Valida tamanho máximo de 5MB
    if (ficheiro.size > 5 * 1024 * 1024) {
      setErroImagem('A imagem não pode ter mais de 5MB.');
      return;
    }

    // Valida que é uma imagem
    if (!ficheiro.type.startsWith('image/')) {
      setErroImagem('Selecciona um ficheiro de imagem válido.');
      return;
    }

    setErroImagem('');

    // Converte para base64 para enviar ao backend e criar preview
    const leitor = new FileReader();
    leitor.onload = (ev) => {
      setFormulario(prev => ({ ...prev, imagem: ev.target.result })); // base64 para a API
      setImagemPreview(ev.target.result);                              // base64 para o preview
    };
    leitor.readAsDataURL(ficheiro);
  };

  // ── Remove a imagem seleccionada ─────────────────────────
  const removerImagem = () => {
    setFormulario(prev => ({ ...prev, imagem: '' }));
    setImagemPreview('');
    setErroImagem('');
    // Reseta o input para permitir seleccionar o mesmo ficheiro
    if (inputFicheiroRef.current) inputFicheiroRef.current.value = '';
  };

  // ── Abre o modal limpando todo o estado anterior ──────────
  const abrirModal = () => {
    setFormulario(FORM_VAZIO);
    setTipoSelecionado('');
    setQualidadesDisponiveis([]);
    setImagemPreview('');
    setErroImagem('');
    setErroForm('');
    setModalAberto(true);
  };

  // ── Publica o pedido de resíduo no feed ───────────────────
  const handlePublicarPedido = async () => {
    // Validação 1: título obrigatório
    if (!formulario.titulo.trim()) {
      setErroForm('O título é obrigatório.');
      return;
    }
    // Validação 2: tipo e qualidade do resíduo obrigatórios
    if (!formulario.id_residuo) {
      setErroForm('Selecciona o tipo e a qualidade do resíduo.');
      return;
    }
    // Validação 3: valor dentro do intervalo da tabela Residuo
    if (formulario.valor_proposto && residuoSeleccionado) {
      const v    = parseFloat(formulario.valor_proposto);
      const vMin = parseFloat(residuoSeleccionado.preco_min);
      const vMax = parseFloat(residuoSeleccionado.preco_max);
      if (v < vMin || v > vMax) {
        setErroForm(`O valor deve estar entre ${vMin} e ${vMax} Kz/kg para este resíduo.`);
        return;
      }
    }

    try {
      setPublicando(true);
      setErroForm('');
      // Envia para o backend — tipo_autor fica 'empresa' pelo token JWT
      await criarPublicacao(formulario);
      setModalAberto(false);
      setFormulario(FORM_VAZIO);
      // Recarrega o feed para mostrar o novo pedido
      const feed = await getFeed();
      setPedidos(feed.filter(p => p.tipo_publicacao === 'pedido_residuo' && p.tipo_autor === 'empresa'));
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setPublicando(false);
    }
  };

  // ── Ecrã de carregamento ──────────────────────────────────
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

      {/* ── Banner de boas-vindas ─────────────────────────── */}
      <div className="bg-green-600 text-white rounded-2xl p-6 shadow-lg mb-8 relative overflow-hidden">
        {/* Círculos decorativos de fundo */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 right-24 w-28 h-28 bg-white/5 rounded-full" />

        <div className="relative flex justify-between items-start flex-wrap gap-4">
          <div>
            {/* Ícone de reciclagem + nome da empresa */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Recycle size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{perfil?.nome || 'Empresa'}</h2>
                <p className="text-white/70 text-sm">Empresa Recicladora — EcoTroca Angola</p>
              </div>
            </div>

            {/* Localização, resíduos aceites e indicador operacional */}
            <div className="flex items-center gap-4 mt-3 text-sm text-white/80 flex-wrap">
              {perfil?.provincia && (
                <span>📍 {perfil.municipio ? `${perfil.municipio}, ` : ''}{perfil.provincia}</span>
              )}
              {perfil?.residuos_aceites && (
                <span>♻️ Aceita: {perfil.residuos_aceites}</span>
              )}
              {/* Ponto verde pulsante = operacional */}
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                Operacional
              </span>
            </div>
          </div>

          {/* Horário de funcionamento — só aparece se estiver preenchido */}
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

      {/* ── Erro geral ───────────────────────────────────── */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6 text-sm">
          {erro}
        </div>
      )}

      {/* ── KPIs linha 1 ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">

        {/* Pendentes a aguardar decisão */}
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

        {/* Entregas aceites e processadas */}
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

        {/* Entregas rejeitadas */}
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

        {/* Total recolhido em kg */}
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

      {/* ── KPIs linha 2 ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        {/* Taxa de aceitação com barra de progresso */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 text-sm font-medium">Taxa Aceitação</span>
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <BarChart3 size={18} className="text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-700">{taxaAceite}%</p>
          {/* Barra visual que cresce com a taxa */}
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${taxaAceite}%` }} />
          </div>
        </div>

        {/* Volume total pago — mostra em 'k' se >= 1000 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 text-sm font-medium">Volume Pago</span>
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Leaf size={18} className="text-purple-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {totalKz >= 1000 ? `${(totalKz / 1000).toFixed(1)}k` : totalKz.toFixed(0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Kz em entregas aceites</p>
        </div>

        {/* Coletadores na equipa — clicável */}
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

        {/* Pedidos activos no feed — clicável */}
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

      {/* ── Conteúdo: entregas + coletadores ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Últimas entregas — 2 colunas */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <Package size={18} /> Últimas Entregas
            </h3>
            <button onClick={() => navigate('/EntregasEmpresa')} className="text-green-600 text-sm flex items-center gap-1 hover:text-green-800 transition">
              Ver todas <ArrowRight size={14} />
            </button>
          </div>

          {/* Estado vazio */}
          {entregas.length === 0 ? (
            <div className="text-center py-10">
              <Truck size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">Sem entregas registadas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mostra as 5 últimas entregas */}
              {entregas.slice(0, 5).map(e => (
                <div key={e.id_entrega} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition">
                  <div className="flex items-center gap-3">
                    {/* Ícone colorido por status */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      e.status === 'coletada'  ? 'bg-green-100'  :
                      e.status === 'pendente'  ? 'bg-yellow-100' :
                      e.status === 'cancelada' ? 'bg-red-100'    : 'bg-gray-100'
                    }`}>
                      {e.status === 'coletada'  && <CheckCircle size={14} className="text-green-600"  />}
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
                    {/* Badge de status */}
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                      e.status === 'coletada'  ? 'bg-green-100 text-green-700'   :
                      e.status === 'pendente'  ? 'bg-yellow-100 text-yellow-700' :
                      e.status === 'cancelada' ? 'bg-red-100 text-red-700'       : 'bg-gray-100 text-gray-600'
                    }`}>
                      {e.status === 'coletada'  ? 'Aceite'    :
                       e.status === 'pendente'  ? 'Pendente'  :
                       e.status === 'cancelada' ? 'Rejeitada' : e.status}
                    </span>
                    {/* Valor pago se disponível */}
                    {e.valor_total && (
                      <p className="text-gray-400 text-xs mt-0.5">{parseFloat(e.valor_total).toFixed(0)} Kz</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Equipa de coletadores — 1 coluna */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <Users size={18} /> Minha Equipa
            </h3>
            <button onClick={() => navigate('/ColetadoresEmpresa')} className="text-green-600 text-sm flex items-center gap-1 hover:text-green-800 transition">
              Gerir <ArrowRight size={14} />
            </button>
          </div>

          {coletadores.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm mb-3">Sem coletadores.</p>
              <button onClick={() => navigate('/ColetadoresEmpresa')} className="text-green-600 text-xs border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition">
                + Adicionar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {coletadores.slice(0, 5).map(c => (
                <div key={c.id_coletador} className="flex items-center gap-3">
                  {/* Avatar com inicial */}
                  <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {c.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-800 text-sm font-medium truncate">{c.nome}</p>
                    <p className="text-gray-400 text-xs">{c.telefone}</p>
                  </div>
                  {/* Ponto verde = activo */}
                  <div className={`ml-auto w-2 h-2 rounded-full shrink-0 ${c.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              ))}
              {coletadores.length > 5 && (
                <p className="text-green-600 text-xs text-center pt-1">+{coletadores.length - 5} coletadores</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Pedidos de resíduo + Eventos ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pedidos de resíduo publicados pela empresa */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <Megaphone size={18} /> Pedidos de Resíduo
            </h3>
            {/* Abre o modal com formulário limpo */}
            <button onClick={abrirModal} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
              <Plus size={13} /> Novo Pedido
            </button>
          </div>

          {pedidos.length === 0 ? (
            <div className="text-center py-10">
              <Recycle size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm mb-3">Ainda não publicaste nenhum pedido.</p>
              <button onClick={abrirModal} className="text-green-600 text-xs border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition">
                + Publicar primeiro pedido
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mostra os 4 pedidos mais recentes */}
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
                      {p.provincia && <span className="text-gray-400 text-xs">📍 {p.provincia}</span>}
                      {p.valor_proposto && (
                        <span className="text-green-600 text-xs font-medium">
                          {parseFloat(p.valor_proposto).toFixed(0)} Kz/kg
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(p.criado_em).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
              {pedidos.length > 4 && (
                <button onClick={() => navigate('/PaginaInicialEmpresa')} className="w-full text-green-600 text-xs text-center py-2 hover:text-green-800 transition">
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
            <button onClick={() => navigate('/EventosEmpresa')} className="text-green-600 text-sm flex items-center gap-1 hover:text-green-800 transition">
              Gerir <ArrowRight size={14} />
            </button>
          </div>

          {eventos.length === 0 ? (
            <div className="text-center py-10">
              <CalendarCheck size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm mb-3">Ainda não criaste nenhum evento.</p>
              <button onClick={() => navigate('/EventosEmpresa')} className="text-green-600 text-xs border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition">
                + Criar Evento
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {eventos.slice(0, 4).map(ev => (
                <div key={ev.id_evento} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  {/* Calendário visual com mês + dia */}
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-medium leading-none">
                      {new Date(ev.data_inicio).toLocaleDateString('pt-AO', { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="text-lg font-bold leading-none">{new Date(ev.data_inicio).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800 text-sm font-medium truncate">{ev.titulo}</p>
                    {ev.local && <p className="text-gray-400 text-xs">📍 {ev.local}</p>}
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">{ev.tipo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          MODAL: Novo Pedido de Resíduo
          Segue a lógica do NovoResiduo.jsx:
          Passo 1 → Tipo de resíduo
          Passo 2 → Qualidade (com intervalo de preço)
          Passo 3 → Título e descrição
          Passo 4 → Quantidade e valor (validado contra preco_min/preco_max)
          Passo 5 → Província
          Passo 6 → Foto do resíduo (upload base64, máx 5MB)
          Passo 7 → Observações opcionais
      ════════════════════════════════════════════════════ */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[92vh] overflow-y-auto">

            {/* Cabeçalho do modal */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <Megaphone size={20} /> Novo Pedido de Resíduo
              </h3>
              <button onClick={() => setModalAberto(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-5">

              {/* ── Passo 1: Tipo de resíduo ── */}
              <div>
                <label className="text-gray-600 text-sm font-medium block mb-2">
                  Tipo de Resíduo <span className="text-red-500">*</span>
                </label>
                {/* Grelha de 2 colunas com ícone Lucide + label — igual ao NovoResiduo */}
                <div className="grid grid-cols-2 gap-2">
                  {tiposUnicos.map(tipo => (
                    <div
                      key={tipo}
                      onClick={() => handleTipo(tipo)}
                      className={`border rounded-xl p-3 cursor-pointer transition text-center text-sm font-medium ${
                        tipoSelecionado === tipo
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {/* Ícone Lucide do tipo — com fallback para Recycle */}
                      {ICONE_TIPO[tipo] || <Recycle size={20} className="mx-auto mb-1 text-gray-400" />}
                      {LABEL_TIPO[tipo] || tipo}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Passo 2: Qualidade — aparece após seleccionar tipo ── */}
              {tipoSelecionado && qualidadesDisponiveis.length > 0 && (
                <div>
                  <label className="text-gray-600 text-sm font-medium block mb-2">
                    Qualidade <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {qualidadesDisponiveis.map(r => {
                      // Ícone e label da qualidade — igual ao NovoResiduo
                      const cfg = QUALIDADE_CONFIG[r.qualidade] || { icone: null, label: r.qualidade };
                      return (
                        <div
                          key={r.id_residuo}
                          onClick={() => handleQualidade(r.id_residuo)}
                          className={`border rounded-xl p-3 cursor-pointer transition ${
                            String(formulario.id_residuo) === String(r.id_residuo)
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            {/* Ícone + label da qualidade */}
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                              {cfg.icone} {cfg.label}
                            </span>
                            {/* Intervalo de preço de referência — vem da tabela Residuo */}
                            {r.preco_min && r.preco_max && (
                              <span className="text-xs text-green-600 font-medium">
                                {r.preco_min} – {r.preco_max} Kz/kg
                              </span>
                            )}
                          </div>
                          {/* Descrição da qualidade vinda da BD */}
                          {r.descricao && (
                            <p className="text-xs text-gray-400 mt-0.5">{r.descricao}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Passo 3: Título e descrição ── */}
              <div>
                <label className="text-gray-600 text-sm font-medium block mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formulario.titulo}
                  onChange={e => handleCampo('titulo', e.target.value)}
                  placeholder="Ex: Procuramos plástico PET limpo — Luanda"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="text-gray-600 text-sm font-medium block mb-1">Descrição (opcional)</label>
                <textarea
                  value={formulario.descricao}
                  onChange={e => handleCampo('descricao', e.target.value)}
                  placeholder="Condições do resíduo, forma de entrega, urgência..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>

              {/* ── Passo 4: Quantidade e valor ── */}
              <div className="grid grid-cols-2 gap-3">
                {/* Quantidade em kg que a empresa precisa */}
                <div>
                  <label className="text-gray-600 text-sm font-medium block mb-1">Quantidade (kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={formulario.quantidade_kg}
                    onChange={e => handleCampo('quantidade_kg', e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                {/* Valor que a empresa propõe pagar — placeholder dinâmico com o intervalo */}
                <div>
                  <label className="text-gray-600 text-sm font-medium block mb-1">Valor (Kz/kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={formulario.valor_proposto}
                    onChange={e => handleCampo('valor_proposto', e.target.value)}
                    placeholder={
                      residuoSeleccionado
                        ? `${residuoSeleccionado.preco_min}–${residuoSeleccionado.preco_max}`
                        : 'Ex: 200'
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  {/* Referência de preço abaixo do campo — igual ao NovoResiduo */}
                  {residuoSeleccionado && (
                    <p className="text-xs text-green-600 mt-1">
                      💡 Ref: {residuoSeleccionado.preco_min}–{residuoSeleccionado.preco_max} Kz/kg
                    </p>
                  )}
                </div>
              </div>

              {/* ── Passo 5: Província ── */}
              <div>
                <label className="text-gray-600 text-sm font-medium block mb-1">Província</label>
                <input
                  type="text"
                  value={formulario.provincia}
                  onChange={e => handleCampo('provincia', e.target.value)}
                  placeholder="Ex: Luanda"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* ── Passo 6: Foto do resíduo — upload base64 igual ao NovoResiduo ── */}
              <div>
                <label className="text-gray-600 text-sm font-medium block mb-1">
                  Foto do Resíduo (opcional)
                </label>

                {/* Preview da imagem após seleccionar */}
                {imagemPreview ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-green-200">
                    <img src={imagemPreview} alt="Preview do resíduo" className="w-full h-full object-cover" />
                    {/* Botão X para remover a imagem */}
                    <button
                      onClick={removerImagem}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  // Área de upload — clique abre o seletor de ficheiros
                  <div
                    onClick={() => inputFicheiroRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-green-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition"
                  >
                    <ImagePlus size={28} className="text-green-300 mb-2" />
                    <p className="text-gray-400 text-xs">Clica para adicionar uma foto</p>
                    <p className="text-gray-300 text-xs mt-0.5">PNG, JPG ou WEBP · Máx. 5MB</p>
                  </div>
                )}

                {/* Input file escondido — activado pelo clique na área de upload */}
                <input
                  ref={inputFicheiroRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagem}
                  className="hidden"
                />

                {/* Erro de validação do ficheiro */}
                {erroImagem && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {erroImagem}
                  </p>
                )}
              </div>

              {/* ── Passo 7: Observações opcionais ── */}
              <div>
                <label className="text-gray-600 text-sm font-medium block mb-1">Observações (opcional)</label>
                <textarea
                  value={formulario.descricao}
                  onChange={e => handleCampo('descricao', e.target.value)}
                  placeholder="Estado esperado do resíduo, embalagem, outros detalhes..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>

              {/* Mensagem de erro do formulário */}
              {erroForm && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle size={14} /> {erroForm}
                </p>
              )}
            </div>

            {/* Botões Cancelar + Publicar */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handlePublicarPedido}
                disabled={publicando}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm"
              >
                {publicando ? 'A publicar...' : <><Megaphone size={16} /> Publicar Pedido</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}