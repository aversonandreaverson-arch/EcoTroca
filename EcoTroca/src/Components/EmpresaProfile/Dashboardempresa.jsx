
//  Painel principal da empresa recicladora.
//  Contém 3 modais encadeados:
//    Modal 1 — Novo Pedido de Resíduo (com conversão de unidades)
//    Modal 2 — Recolhas (progresso do limiar + acordos + recolhas)
//    Modal 3 — Agendar Recolha (data/hora/coletadores)

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, Package, CheckCircle, XCircle, Clock,
  TrendingUp, Users, Megaphone, Plus, ArrowRight,
  Leaf, BarChart3, CalendarCheck, Truck, X,
  FileText, Wrench, Wine,
  ThumbsDown, Smile, ThumbsUp, Star,
  ImagePlus, AlertCircle, UserCheck, ToggleLeft, ToggleRight, Pencil,
  Scale, Hash, Target, Info, ChevronDown, ChevronUp,
  Bell, Package2
} from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import {
  getEntregasEmpresa,      // entregas associadas à empresa autenticada
  getEventosEmpresa,       // eventos criados pela empresa
  getPerfilEmpresa,        // dados do perfil da empresa
  getColetadoresEmpresa,   // equipa de coletadores (independentes + dependentes)
  getFeed,                 // feed geral — filtrado para pedidos da empresa
  criarPublicacao,         // publica novo pedido de resíduo no feed
  getResiduos,             // tipos de resíduo com qualidade e preços
  getConversoes,           // conversões padrão por tipo (garrafa=0,03kg, saco=2kg...)
  getAcordosPendentes,     // acordos aceites ainda sem recolha + info do limiar
  getRecolhasEmpresa,      // recolhas já criadas pela empresa
  criarRecolha,            // cria nova recolha e notifica utilizadores
  actualizarStatusRecolha, // muda o status de uma recolha (em_curso, concluida...)
} from '../../api.js';

// ── Ícones Lucide por tipo de resíduo ─────────────────────────
// Usados na grelha de selecção do modal — um ícone por tipo
const ICONE_TIPO = {
  Plastico: <Recycle  size={20} className="mx-auto mb-1 text-green-600"  />,
  Papel:    <FileText size={20} className="mx-auto mb-1 text-yellow-600" />,
  Metal:    <Wrench   size={20} className="mx-auto mb-1 text-gray-600"   />,
  Vidro:    <Wine     size={20} className="mx-auto mb-1 text-blue-500"   />,
};

// ── Labels legíveis por tipo ──────────────────────────────────
// Converte o nome interno da BD para texto visível ao utilizador
const LABEL_TIPO = {
  Plastico: 'Plástico',
  Papel:    'Papel',
  Metal:    'Metal',
  Vidro:    'Vidro',
};

// ── Ícone e label por nível de qualidade ─────────────────────
// Cada qualidade tem ícone colorido para facilitar a identificação
const QUALIDADE_CONFIG = {
  ruim:      { icone: <ThumbsDown size={14} className="text-red-500"    />, label: 'Ruim'      },
  moderada:  { icone: <Smile      size={14} className="text-yellow-500" />, label: 'Moderada'  },
  boa:       { icone: <ThumbsUp   size={14} className="text-green-500"  />, label: 'Boa'       },
  excelente: { icone: <Star       size={14} className="text-orange-400" />, label: 'Excelente' },
};

// ── Cores dos badges por tipo de resíduo ─────────────────────
// Aplicadas nos cartões de pedidos no feed
const COR_RESIDUO = {
  'Plástico PET': 'bg-blue-100 text-blue-700',
  'Papel':        'bg-yellow-100 text-yellow-700',
  'Alumínio':     'bg-gray-100 text-gray-700',
  'Ferro':        'bg-orange-100 text-orange-700',
  'Cobre':        'bg-amber-100 text-amber-700',
};

// ── Configuração visual por status de recolha ─────────────────
// Cada status tem label legível e cor de badge
const STATUS_CONFIG = {
  agendada:  { label: 'Agendada',  cor: 'bg-blue-100 text-blue-700'     },
  em_curso:  { label: 'Em Curso',  cor: 'bg-yellow-100 text-yellow-700'  },
  concluida: { label: 'Concluída', cor: 'bg-green-100 text-green-700'    },
  cancelada: { label: 'Cancelada', cor: 'bg-red-100 text-red-700'        },
};

// ── Estado inicial vazio do formulário do pedido ─────────────
// Reutilizado para limpar o modal ao abrir
const FORM_VAZIO = {
  tipo_publicacao:       'pedido_residuo', // fixo — empresa só publica pedidos de resíduo
  titulo:                '',              // título obrigatório do pedido
  descricao:             '',              // descrição opcional
  id_residuo:            '',              // id do resíduo escolhido (tipo + qualidade)
  valor_proposto:        '',              // valor em Kz/kg — validado contra preco_min/preco_max
  imagem:                '',              // base64 da foto (máx 5MB)
  observacoes:           '',              // observações opcionais
  // ── Conversão de unidades ────────────────────────────────
  nome_unidade:          '',              // ex: garrafa, saco, peça
  kg_por_unidade:        '',              // ex: 0.03 — 1 garrafa = 0,03 kg
  // ── Mínimo por pessoa ────────────────────────────────────
  minimo_por_pessoa_kg:  '',              // mínimo em kg que cada pessoa deve trazer
  // ── Total para agendar recolha ───────────────────────────
  minimo_para_agendar:   '',              // total em kg acumulado para desbloquear o agendamento
  // ── Coletador dependente ─────────────────────────────────
  com_coletador:         false,           // toggle — indica se a empresa envia coletador
  id_coletadores:        [],              // array de ids dos coletadores dependentes escolhidos
};

export default function DashboardEmpresa() {
  // Hook de navegação para redirecionar entre páginas
  const navigate = useNavigate();

  // ── Estado dos dados carregados da API ───────────────────
  const [perfil,       setPerfil]       = useState(null);  // perfil da empresa
  const [entregas,     setEntregas]     = useState([]);     // histórico de entregas
  const [eventos,      setEventos]      = useState([]);     // eventos da empresa
  const [coletadores,  setColetadores]  = useState([]);     // equipa de coletadores
  const [pedidos,      setPedidos]      = useState([]);     // pedidos de resíduo no feed
  const [carregando,   setCarregando]   = useState(true);   // controla o spinner inicial
  const [erro,         setErro]         = useState('');     // erro geral da página

  // ── Estado do Modal 1: Novo Pedido ───────────────────────
  const [modalPedido,  setModalPedido]  = useState(false);      // visibilidade do modal
  const [formulario,   setFormulario]   = useState(FORM_VAZIO); // dados do formulário
  const [publicando,   setPublicando]   = useState(false);      // estado de submissão
  const [erroForm,     setErroForm]     = useState('');         // erro de validação

  // ── Estado do selector de resíduo (dentro do Modal 1) ───
  const [todosResiduos,         setTodosResiduos]         = useState([]); // lista completa da BD
  const [conversoesPorTipo,     setConversoesPorTipo]     = useState({}); // { Plastico: { nome_unidade, kg_por_unidade } }
  const [tiposUnicos,           setTiposUnicos]           = useState([]); // ex: ['Plastico', 'Papel', ...]
  const [tipoSelecionado,       setTipoSelecionado]       = useState(''); // tipo escolhido na grelha
  const [qualidadesDisponiveis, setQualidadesDisponiveis] = useState([]); // qualidades do tipo escolhido

  // ── Estado do Modal 2: Recolhas ───────────────────────────
  const [modalRecolhas,      setModalRecolhas]      = useState(false); // visibilidade do modal
  const [acordos,            setAcordos]            = useState([]);    // acordos pendentes de recolha
  const [recolhas,           setRecolhas]           = useState([]);    // recolhas já criadas
  const [totalAcordos,       setTotalAcordos]       = useState(0);     // kg acumulados até agora
  const [limiar,             setLimiar]             = useState(0);     // kg mínimos para agendar
  const [atingiuLimiar,      setAtingiuLimiar]      = useState(false); // true = botão agendar activo
  const [sugestao,           setSugestao]           = useState('');    // mensagem de sugestão do backend
  const [recolhaExpandida,   setRecolhaExpandida]   = useState(null);  // id da recolha com detalhes visíveis
  const [carregandoRecolhas, setCarregandoRecolhas] = useState(false); // spinner dentro do modal

  // ── Estado do Modal 3: Agendar Recolha ───────────────────
  const [modalAgendar,   setModalAgendar]   = useState(false); // visibilidade do modal
  const [dataRecolha,    setDataRecolha]    = useState('');    // data escolhida (YYYY-MM-DD)
  const [horaRecolha,    setHoraRecolha]    = useState('');    // hora escolhida (HH:MM)
  const [idsColetadores, setIdsColetadores] = useState([]);    // coletadores seleccionados
  const [idsEntregas,    setIdsEntregas]    = useState([]);    // acordos incluídos na recolha
  const [agendando,      setAgendando]      = useState(false); // estado de submissão
  const [erroAgendar,    setErroAgendar]    = useState('');    // erro de validação

  // ── Upload de imagem ──────────────────────────────────────
  const [imagemPreview, setImagemPreview] = useState(''); // URL base64 para pré-visualização
  const [erroImagem,    setErroImagem]    = useState(''); // erro de validação do ficheiro
  const inputFicheiroRef = useRef(null);                  // ref para activar o input file escondido

  // ── Derivados calculados a partir do estado ───────────────

  // Só coletadores dependentes podem ser enviados para recolha
  const coletadoresDependentes = coletadores.filter(c => c.tipo === 'dependente');

  // Resíduo seleccionado — para mostrar intervalo de preço e conversão
  const residuoSeleccionado = qualidadesDisponiveis.find(
    r => String(r.id_residuo) === String(formulario.id_residuo)
  );

  // ── Cálculo: equivalente em unidades do mínimo por pessoa ─
  // Ex: empresa define 20 kg mínimo por pessoa
  //     conversão: 1 garrafa = 0,03 kg
  //     resultado: 20 ÷ 0,03 = 667 garrafas (arredondado para cima)
  // Mostrado ao utilizador para quem não tem balança
  const minimoUnidades = (() => {
    const kg  = parseFloat(formulario.minimo_por_pessoa_kg);
    const kpu = parseFloat(formulario.kg_por_unidade);
    if (!kg || !kpu || kg <= 0 || kpu <= 0) return null; // null = não mostrar
    return Math.ceil(kg / kpu); // arredonda para cima — melhor ter a mais
  })();

  // ── Cálculo: equivalente em unidades do total para agendar ─
  // Ex: empresa define 500 kg total para agendar
  //     resultado: 500 ÷ 0,03 = 16.667 garrafas no total de todas as pessoas
  const totalUnidades = (() => {
    const kg  = parseFloat(formulario.minimo_para_agendar);
    const kpu = parseFloat(formulario.kg_por_unidade);
    if (!kg || !kpu || kg <= 0 || kpu <= 0) return null;
    return Math.ceil(kg / kpu);
  })();

  // ── Cálculo: estimativa do valor que o utilizador vai receber ─
  // Ex: mínimo por pessoa = 20 kg, valor = 320 Kz/kg → 6.400 Kz
  // Mostrado para dar ao utilizador uma ideia do que vai ganhar
  const estimativaTotal = (() => {
    const kg  = parseFloat(formulario.minimo_por_pessoa_kg);
    const val = parseFloat(formulario.valor_proposto);
    if (!kg || !val || kg <= 0 || val <= 0) return null;
    return kg * val;
  })();

  // ── Carrega todos os dados ao montar o componente ─────────
  // Promise.all faz todas as chamadas em simultâneo para reduzir o tempo de espera
  useEffect(() => {
    const carregar = async () => {
      try {
        const [
          dadosPerfil, dadosEntregas, dadosEventos,
          dadosColetadores, dadosFeed, dadosResiduos, dadosConversoes
        ] = await Promise.all([
          getPerfilEmpresa(),       // perfil da empresa autenticada
          getEntregasEmpresa(),     // histórico de entregas
          getEventosEmpresa(),      // eventos da empresa
          getColetadoresEmpresa(),  // equipa de coletadores
          getFeed(),                // feed geral para filtrar pedidos da empresa
          getResiduos(),            // tipos de resíduo com qualidade, preços e conversão
          getConversoes(),          // conversões padrão agrupadas por tipo
        ]);

        setPerfil(dadosPerfil);
        setEntregas(dadosEntregas);
        setEventos(dadosEventos);
        setColetadores(dadosColetadores);
        setTodosResiduos(dadosResiduos);

        // Extrai os tipos únicos para a grelha de selecção do modal
        setTiposUnicos([...new Set(dadosResiduos.map(r => r.tipo))]);

        // Filtra o feed — só pedidos de resíduo publicados por empresas
        setPedidos(dadosFeed.filter(p =>
          p.tipo_publicacao === 'pedido_residuo' && p.tipo_autor === 'empresa'
        ));

        // Organiza as conversões por tipo para acesso rápido no handleTipo
        // Ex: { Plastico: { nome_unidade: 'garrafa', kg_por_unidade: 0.03 } }
        const conv = {};
        dadosConversoes.forEach(c => { conv[c.tipo] = c; });
        setConversoesPorTipo(conv);

      } catch (err) {
        setErro(err.message); // mostra erro no topo da página
      } finally {
        setCarregando(false); // remove o spinner independentemente do resultado
      }
    };
    carregar();
  }, []); // array vazio = só executa ao montar o componente

  // ── Estatísticas calculadas a partir das entregas ─────────

  // Entregas sem decisão ainda
  const pendentes = entregas.filter(e => e.status === 'pendente').length;

  // Entregas já recolhidas e pagas
  const aceites = entregas.filter(e => e.status === 'coletada').length;

  // Entregas que a empresa recusou
  const rejeitadas = entregas.filter(e => e.status === 'cancelada').length;

  // Total de kg processados nas entregas aceites
  const totalKg = entregas
    .filter(e => e.status === 'coletada')
    .reduce((acc, e) => acc + (parseFloat(e.peso_total) || 0), 0);

  // Total pago em Kz nas entregas aceites
  const totalKz = entregas
    .filter(e => e.status === 'coletada')
    .reduce((acc, e) => acc + (parseFloat(e.valor_total) || 0), 0);

  // Taxa de aceitação em % — evita divisão por zero
  const totalDecididas = aceites + rejeitadas;
  const taxaAceite = totalDecididas > 0
    ? Math.round((aceites / totalDecididas) * 100)
    : 0;

  // ── handleTipo: ao escolher o tipo de resíduo ────────────
  // Actualiza o tipo seleccionado, pré-preenche a conversão padrão
  // e carrega as qualidades disponíveis para esse tipo
  const handleTipo = (tipo) => {
    setTipoSelecionado(tipo);

    // Vai buscar a conversão padrão para este tipo da BD
    const conv = conversoesPorTipo[tipo];

    setFormulario(prev => ({
      ...prev,
      id_residuo:     '',  // limpa a qualidade — tem de escolher de novo
      valor_proposto: '',  // limpa o valor — depende da qualidade
      // Pré-preenche com a conversão padrão da BD
      // A empresa pode ajustar se os seus valores forem diferentes
      nome_unidade:   conv?.nome_unidade   || '',
      kg_por_unidade: conv?.kg_por_unidade || '',
    }));

    // Filtra só as qualidades que pertencem ao tipo escolhido
    setQualidadesDisponiveis(todosResiduos.filter(r => r.tipo === tipo));
  };

  // ── handleQualidade: ao escolher a qualidade ─────────────
  // Guarda o id_residuo e limpa o valor para forçar nova validação
  const handleQualidade = (id_residuo) => {
    setFormulario(prev => ({ ...prev, id_residuo, valor_proposto: '' }));
  };

  // ── handleCampo: actualiza qualquer campo do formulário ──
  // Função genérica para evitar repetição em cada input
  const handleCampo = (campo, valor) =>
    setFormulario(prev => ({ ...prev, [campo]: valor }));

  // ── handleToggleColetador: liga/desliga o toggle ──────────
  // Ao desactivar, limpa a lista de coletadores seleccionados
  const handleToggleColetador = () => {
    setFormulario(prev => ({
      ...prev,
      com_coletador:  !prev.com_coletador, // inverte o estado actual
      id_coletadores: [],                   // limpa a selecção ao desactivar
    }));
  };

  // ── handleToggleColetadorItem: selecção múltipla ─────────
  // Clica para adicionar; clica novamente para remover
  const handleToggleColetadorItem = (id) => {
    setFormulario(prev => {
      const jaEsta = prev.id_coletadores.includes(id);
      return {
        ...prev,
        id_coletadores: jaEsta
          ? prev.id_coletadores.filter(c => c !== id) // remove se já estava
          : [...prev.id_coletadores, id],              // adiciona se não estava
      };
    });
  };

  // ── handleImagem: processa o ficheiro e converte para base64 ─
  const handleImagem = (e) => {
    const ficheiro = e.target.files[0];
    if (!ficheiro) return; // utilizador cancelou a selecção

    // Valida o tamanho — base64 de 5MB ocupa ~7MB, dentro do limite do servidor
    if (ficheiro.size > 5 * 1024 * 1024) {
      setErroImagem('A imagem não pode ter mais de 5MB.');
      return;
    }

    // Valida que é realmente uma imagem
    if (!ficheiro.type.startsWith('image/')) {
      setErroImagem('Selecciona um ficheiro de imagem válido.');
      return;
    }

    setErroImagem(''); // limpa erro anterior

    // Converte para base64 — necessário para guardar na BD como LONGTEXT
    const leitor = new FileReader();
    leitor.onload = (ev) => {
      setFormulario(prev => ({ ...prev, imagem: ev.target.result })); // base64 para a API
      setImagemPreview(ev.target.result);                              // base64 para o preview
    };
    leitor.readAsDataURL(ficheiro);
  };

  // ── removerImagem: limpa a imagem seleccionada ───────────
  const removerImagem = () => {
    setFormulario(prev => ({ ...prev, imagem: '' })); // limpa base64 do formulário
    setImagemPreview('');                              // limpa o preview
    setErroImagem('');                                 // limpa erros
    // Reseta o input para permitir seleccionar o mesmo ficheiro novamente
    if (inputFicheiroRef.current) inputFicheiroRef.current.value = '';
  };

  // ── abrirModalPedido: abre o Modal 1 limpo ───────────────
  const abrirModalPedido = () => {
    setFormulario(FORM_VAZIO);    // limpa todos os campos
    setTipoSelecionado('');       // limpa o tipo seleccionado
    setQualidadesDisponiveis([]); // limpa as qualidades disponíveis
    setImagemPreview('');         // limpa o preview da imagem
    setErroImagem('');            // limpa erros de imagem
    setErroForm('');              // limpa erros do formulário
    setModalPedido(true);         // abre o modal
  };

  // ── handlePublicarPedido: valida e publica o pedido ──────
  const handlePublicarPedido = async () => {

    // Validação 1: tipo e qualidade são obrigatórios
    if (!formulario.id_residuo) {
      setErroForm('Selecciona o tipo e a qualidade do resíduo.'); return;
    }

    // Validação 2: título obrigatório
    if (!formulario.titulo.trim()) {
      setErroForm('O título é obrigatório.'); return;
    }

    // Validação 3: valor obrigatório e positivo
    if (!formulario.valor_proposto || parseFloat(formulario.valor_proposto) <= 0) {
      setErroForm('O valor é obrigatório.'); return;
    }

    // Validação 4: valor dentro do intervalo da qualidade escolhida
    if (residuoSeleccionado) {
      const v = parseFloat(formulario.valor_proposto);
      if (v < parseFloat(residuoSeleccionado.preco_min) || v > parseFloat(residuoSeleccionado.preco_max)) {
        setErroForm(`O valor deve estar entre ${residuoSeleccionado.preco_min} e ${residuoSeleccionado.preco_max} Kz/kg.`); return;
      }
    }

    // Validação 5: mínimo por pessoa obrigatório
    if (!formulario.minimo_por_pessoa_kg || parseFloat(formulario.minimo_por_pessoa_kg) <= 0) {
      setErroForm('Define o mínimo de kg que cada pessoa deve trazer.'); return;
    }

    // Validação 6: total para agendar obrigatório
    if (!formulario.minimo_para_agendar || parseFloat(formulario.minimo_para_agendar) <= 0) {
      setErroForm('Define o total mínimo para agendar a recolha.'); return;
    }

    // Validação 7: mínimo por pessoa não pode ser maior que o total para agendar
    // Seria impossível atingir o total se uma só pessoa já excede o limite
    if (parseFloat(formulario.minimo_por_pessoa_kg) > parseFloat(formulario.minimo_para_agendar)) {
      setErroForm('O mínimo por pessoa não pode ser maior que o total para agendar.'); return;
    }

    // Validação 8: se activou coletador, tem de escolher pelo menos um
    if (formulario.com_coletador && formulario.id_coletadores.length === 0) {
      setErroForm('Selecciona pelo menos um coletador.'); return;
    }

    try {
      setPublicando(true); // bloqueia o botão durante o pedido ao servidor
      setErroForm('');     // limpa erros anteriores

      // Envia o formulário ao backend — tipo_autor fica 'empresa' pelo JWT
      await criarPublicacao(formulario);

      setModalPedido(false);     // fecha o modal
      setFormulario(FORM_VAZIO); // limpa o formulário para a próxima vez

      // Recarrega o feed para mostrar o novo pedido imediatamente
      const feed = await getFeed();
      setPedidos(feed.filter(p =>
        p.tipo_publicacao === 'pedido_residuo' && p.tipo_autor === 'empresa'
      ));
    } catch (err) {
      setErroForm(err.message); // mostra o erro devolvido pelo servidor
    } finally {
      setPublicando(false); // liberta o botão sempre, mesmo com erro
    }
  };

  // ── abrirModalRecolhas: abre o Modal 2 e carrega dados ───
  // Carrega acordos pendentes e recolhas já criadas ao abrir
  const abrirModalRecolhas = async () => {
    setModalRecolhas(true);
    setCarregandoRecolhas(true); // mostra spinner dentro do modal
    try {
      const [dadosAcordos, dadosRecolhas] = await Promise.all([
        getAcordosPendentes(), // acordos aceites + info do limiar
        getRecolhasEmpresa(),  // recolhas já criadas
      ]);

      setAcordos(dadosAcordos.acordos        || []); // lista de acordos pendentes
      setTotalAcordos(dadosAcordos.total     || 0);  // total acumulado em kg
      setLimiar(dadosAcordos.limiar_recolha  || 0);  // mínimo para agendar
      setAtingiuLimiar(dadosAcordos.atingiu_limiar || false); // desbloqueia o botão
      setSugestao(dadosAcordos.sugestao      || ''); // mensagem do backend
      setRecolhas(dadosRecolhas);                     // lista de recolhas criadas
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregandoRecolhas(false); // remove o spinner
    }
  };

  // ── abrirModalAgendar: abre o Modal 3 dentro do Modal 2 ──
  // Pré-selecciona todos os acordos pendentes para poupar tempo
  const abrirModalAgendar = () => {
    setDataRecolha('');                              // limpa a data
    setHoraRecolha('');                              // limpa a hora
    setIdsColetadores([]);                           // limpa a selecção de coletadores
    setIdsEntregas(acordos.map(a => a.id_entrega)); // pré-selecciona todos os acordos
    setErroAgendar('');                              // limpa erros anteriores
    setModalAgendar(true);                           // abre o modal
  };

  // ── handleAgendar: valida e confirma o agendamento ───────
  const handleAgendar = async () => {

    // Validação 1: data e hora são obrigatórias
    if (!dataRecolha || !horaRecolha) {
      setErroAgendar('Define a data e hora da recolha.'); return;
    }

    // Validação 2: pelo menos um coletador
    if (idsColetadores.length === 0) {
      setErroAgendar('Selecciona pelo menos um coletador.'); return;
    }

    // Validação 3: pelo menos uma entrega/acordo
    if (idsEntregas.length === 0) {
      setErroAgendar('Selecciona pelo menos uma entrega.'); return;
    }

    try {
      setAgendando(true);
      setErroAgendar('');

      // Combina data e hora no formato ISO para o backend
      // Ex: "2025-03-20" + "09:00" → "2025-03-20T09:00"
      await criarRecolha({
        data_recolha:    `${dataRecolha}T${horaRecolha}`,
        ids_coletadores: idsColetadores, // array de ids dos coletadores
        ids_entregas:    idsEntregas,    // array de ids das entregas/acordos
      });

      setModalAgendar(false); // fecha o Modal 3

      // Recarrega os dados do Modal 2 para reflectir o novo agendamento
      const [dadosAcordos, dadosRecolhas] = await Promise.all([
        getAcordosPendentes(),
        getRecolhasEmpresa(),
      ]);
      setAcordos(dadosAcordos.acordos || []);
      setTotalAcordos(dadosAcordos.total || 0);
      setAtingiuLimiar(dadosAcordos.atingiu_limiar || false);
      setRecolhas(dadosRecolhas);
    } catch (err) {
      setErroAgendar(err.message);
    } finally {
      setAgendando(false); // liberta o botão sempre
    }
  };

  // ── handleStatusRecolha: muda o status de uma recolha ────
  // Pede confirmação antes de mudar — mais cuidado no cancelamento
  const handleStatusRecolha = async (id, status) => {
    // Mensagens de confirmação diferentes por tipo de mudança
    const msgs = {
      em_curso:  'Marcar esta recolha como em curso?',
      concluida: 'Confirmar que esta recolha foi concluída?',
      cancelada: 'Cancelar esta recolha? Os utilizadores serão notificados.',
    };

    if (!window.confirm(msgs[status])) return; // utilizador cancelou

    try {
      await actualizarStatusRecolha(id, status); // actualiza no backend + notifica utilizadores
      const dadosRecolhas = await getRecolhasEmpresa(); // recarrega para reflectir a mudança
      setRecolhas(dadosRecolhas);
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Ecrã de carregamento inicial ─────────────────────────
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
            {/* Ícone + nome e tipo da conta */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Recycle size={22} /></div>
              <div>
                <h2 className="text-2xl font-bold">{perfil?.nome || 'Empresa'}</h2>
                <p className="text-white/70 text-sm">Empresa Recicladora — EcoTroca Angola</p>
              </div>
            </div>
            {/* Localização, resíduos aceites e estado operacional */}
            <div className="flex items-center gap-4 mt-3 text-sm text-white/80 flex-wrap">
              {perfil?.provincia && <span>📍 {perfil.municipio ? `${perfil.municipio}, ` : ''}{perfil.provincia}</span>}
              {perfil?.residuos_aceites && <span>♻️ Aceita: {perfil.residuos_aceites}</span>}
              {/* Ponto verde pulsante indica que a empresa está operacional */}
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" /> Operacional</span>
            </div>
          </div>
          {/* Horário — só aparece se estiver preenchido no perfil */}
          {perfil?.horario_abertura && (
            <div className="bg-white/20 rounded-xl px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-white/70 text-xs mb-1">Horário</p>
              <p className="font-bold text-lg">{perfil.horario_abertura} – {perfil.horario_fechamento}</p>
            </div>
          )}
        </div>
      </div>

      {/* Erro geral — só aparece se a API falhar ao carregar */}
      {erro && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6 text-sm">{erro}</div>}

      {/* ── KPIs linha 1: entregas ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">

        {/* Pendentes — entregas sem decisão */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Pendentes</span><div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center"><Clock size={18} className="text-yellow-500" /></div></div>
          <p className="text-3xl font-bold text-yellow-600">{pendentes}</p>
          <p className="text-xs text-gray-400 mt-1">a aguardar decisão</p>
        </div>

        {/* Aceites — entregas processadas */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Aceites</span><div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center"><CheckCircle size={18} className="text-green-500" /></div></div>
          <p className="text-3xl font-bold text-green-600">{aceites}</p>
          <p className="text-xs text-gray-400 mt-1">entregas processadas</p>
        </div>

        {/* Rejeitadas — entregas recusadas */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Rejeitadas</span><div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center"><XCircle size={18} className="text-red-500" /></div></div>
          <p className="text-3xl font-bold text-red-600">{rejeitadas}</p>
          <p className="text-xs text-gray-400 mt-1">resíduos recusados</p>
        </div>

        {/* Total recolhido em kg */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Total Recolhido</span><div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center"><TrendingUp size={18} className="text-blue-500" /></div></div>
          <p className="text-3xl font-bold text-blue-600">{totalKg.toFixed(1)} kg</p>
          <p className="text-xs text-gray-400 mt-1">resíduos processados</p>
        </div>
      </div>

      {/* ── KPIs linha 2: desempenho ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        {/* Taxa de aceitação com barra de progresso */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Taxa Aceitação</span><div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center"><BarChart3 size={18} className="text-green-600" /></div></div>
          <p className="text-3xl font-bold text-green-700">{taxaAceite}%</p>
          {/* Barra que cresce proporcionalmente à taxa */}
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${taxaAceite}%` }} /></div>
        </div>

        {/* Volume pago — abreviado com 'k' acima de 1000 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Volume Pago</span><div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center"><Leaf size={18} className="text-purple-500" /></div></div>
          <p className="text-3xl font-bold text-purple-600">{totalKz >= 1000 ? `${(totalKz / 1000).toFixed(1)}k` : totalKz.toFixed(0)}</p>
          <p className="text-xs text-gray-400 mt-1">Kz em entregas aceites</p>
        </div>

        {/* Coletadores — clicável para ir à página de coletadores */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100 cursor-pointer hover:border-green-300 transition" onClick={() => navigate('/ColetadoresEmpresa')}>
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Coletadores</span><div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center"><Users size={18} className="text-orange-500" /></div></div>
          <p className="text-3xl font-bold text-orange-600">{coletadores.length}</p>
          <p className="text-xs text-gray-400 mt-1">na minha equipa</p>
        </div>

        {/* Pedidos Activos — clicável para abrir o Modal 2 de recolhas */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100 cursor-pointer hover:border-green-300 transition" onClick={abrirModalRecolhas}>
          <div className="flex justify-between items-center mb-3"><span className="text-gray-500 text-sm font-medium">Pedidos Activos</span><div className="w-9 h-9 bg-cyan-50 rounded-xl flex items-center justify-center"><Megaphone size={18} className="text-cyan-500" /></div></div>
          <p className="text-3xl font-bold text-cyan-600">{pedidos.length}</p>
          <p className="text-xs text-gray-400 mt-1">ver recolhas →</p>
        </div>
      </div>

      {/* ── Últimas Entregas + Equipa ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Últimas entregas — 2 colunas em desktop */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2"><Package size={18} /> Últimas Entregas</h3>
            <button onClick={() => navigate('/EntregasEmpresa')} className="text-green-600 text-sm flex items-center gap-1 hover:text-green-800 transition">Ver todas <ArrowRight size={14} /></button>
          </div>
          {entregas.length === 0 ? (
            <div className="text-center py-10"><Truck size={36} className="mx-auto mb-3 text-gray-200" /><p className="text-gray-400 text-sm">Sem entregas registadas.</p></div>
          ) : (
            <div className="space-y-3">
              {/* Só as 5 mais recentes para não sobrecarregar o dashboard */}
              {entregas.slice(0, 5).map(e => (
                <div key={e.id_entrega} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition">
                  <div className="flex items-center gap-3">
                    {/* Ícone colorido conforme o status da entrega */}
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
                    {/* Badge de status com cor correspondente */}
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

        {/* Equipa de coletadores — 1 coluna em desktop */}
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
                  {/* Avatar com inicial do nome */}
                  <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{c.nome?.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0"><p className="text-gray-800 text-sm font-medium truncate">{c.nome}</p><p className="text-gray-400 text-xs">{c.telefone}</p></div>
                  {/* Ponto verde = activo, cinzento = inactivo */}
                  <div className={`ml-auto w-2 h-2 rounded-full shrink-0 ${c.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              ))}
              {coletadores.length > 5 && <p className="text-green-600 text-xs text-center pt-1">+{coletadores.length - 5} coletadores</p>}
            </div>
          )}
        </div>
      </div>

      {/* ── Pedidos + Eventos ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pedidos de resíduo */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-green-800 flex items-center gap-2"><Megaphone size={18} /> Pedidos de Resíduo</h3>
            {/* Botão que abre o Modal 1 de novo pedido */}
            <button onClick={abrirModalPedido} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"><Plus size={13} /> Novo Pedido</button>
          </div>
          {pedidos.length === 0 ? (
            <div className="text-center py-10"><Recycle size={36} className="mx-auto mb-3 text-gray-200" /><p className="text-gray-400 text-sm mb-3">Ainda não publicaste nenhum pedido.</p><button onClick={abrirModalPedido} className="text-green-600 text-xs border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition">+ Publicar primeiro pedido</button></div>
          ) : (
            <div className="space-y-3">
              {/* Só os 4 mais recentes */}
              {pedidos.slice(0, 4).map(p => {
                // Verifica se já há acordos — bloqueia o eliminar
                const temAcordos = parseFloat(p.total_acumulado || 0) > 0;
                return (
                  <div key={p.id_publicacao} className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                    {/* Linha principal: ícone + info + data */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0"><Recycle size={15} className="text-purple-600" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-800 text-sm font-medium truncate">{p.titulo}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {p.tipo_residuo && <span className={`text-xs px-2 py-0.5 rounded-lg ${COR_RESIDUO[p.tipo_residuo] || 'bg-gray-100 text-gray-600'}`}>{p.tipo_residuo}</span>}
                          {p.valor_proposto && <span className="text-green-600 text-xs font-medium">{parseFloat(p.valor_proposto).toFixed(0)} Kz/kg</span>}
                          {/* Progresso da meta */}
                          {p.minimo_para_agendar && (
                            <span className="text-purple-600 text-xs">
                              {parseFloat(p.total_acumulado || 0).toFixed(0)}/{parseFloat(p.minimo_para_agendar).toFixed(0)} kg
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{new Date(p.criado_em).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    {/* Botões de gestão */}
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-purple-100">
                      {/* Editar — sempre disponível */}
                      <button
                        onClick={() => { abrirModalPedido(); }}
                        className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs transition">
                        <Pencil size={12} /> Editar
                      </button>
                      {/* Eliminar — bloqueado se há acordos */}
                      {temAcordos ? (
                        <span title="Já existem acordos activos" className="flex items-center gap-1 text-gray-300 text-xs cursor-not-allowed">
                          <Trash2 size={12} /> Eliminar
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            if (!window.confirm('Remover este pedido?')) return;
                            try {
                              const { apagarPublicacao: ap } = await import('../../api.js');
                              await ap(p.id_publicacao);
                              const feed = await getFeed();
                              setPedidos(feed.filter(x => x.tipo_publicacao === 'pedido_residuo' && x.tipo_autor === 'empresa'));
                            } catch (err) { alert(err.message); }
                          }}
                          className="flex items-center gap-1 text-red-400 hover:text-red-600 text-xs transition">
                          <Trash2 size={12} /> Eliminar
                        </button>
                      )}
                      {/* Indicador de acordos activos */}
                      {temAcordos && (
                        <span className="ml-auto text-yellow-600 text-xs flex items-center gap-1">
                          <AlertCircle size={11} /> {parseFloat(p.total_acumulado).toFixed(0)} kg em acordos
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Link para abrir o Modal 2 de recolhas */}
              {pedidos.length > 4 && <button onClick={abrirModalRecolhas} className="w-full text-green-600 text-xs text-center py-2 hover:text-green-800 transition">Ver recolhas ({pedidos.length}) →</button>}
            </div>
          )}
        </div>

        {/* Próximos eventos */}
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
                  {/* Mini calendário visual */}
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
          MODAL 1: Novo Pedido de Resíduo
          Fluxo de 11 passos:
          1. Tipo de resíduo (grelha com ícones)
          2. Qualidade (com intervalo de preço)
          3. Título (obrigatório)
          4. Descrição (opcional)
          5. Valor Kz/kg (validado contra intervalo)
          6. Conversão de unidades (sugerida automaticamente)
          7. Mínimo por pessoa em kg (com equivalente em unidades)
          8. Total para agendar em kg (com estimativa de pessoas)
          9. Foto (opcional)
          10. Observações (opcional)
          11. Toggle coletador dependente (sem data/hora)
      ════════════════════════════════════════════════════ */}
      {modalPedido && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[92vh] overflow-y-auto">

            {/* Cabeçalho do modal */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2"><Megaphone size={20} /> Novo Pedido de Resíduo</h3>
              <button onClick={() => setModalPedido(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="space-y-5">

              {/* ── Passo 1: Tipo de resíduo ── */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-2">Tipo de Resíduo <span className="text-red-500">*</span></label>
                {/* Grelha de 2 colunas com ícone Lucide + label */}
                <div className="grid grid-cols-2 gap-2">
                  {tiposUnicos.map(tipo => (
                    <div key={tipo} onClick={() => handleTipo(tipo)}
                      className={`border rounded-xl p-3 cursor-pointer transition text-center text-sm font-medium ${tipoSelecionado === tipo ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                      {/* Ícone correspondente ao tipo, com fallback para Recycle */}
                      {ICONE_TIPO[tipo] || <Recycle size={20} className="mx-auto mb-1 text-gray-400" />}
                      {LABEL_TIPO[tipo] || tipo}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Passo 2: Qualidade — só aparece após escolher o tipo ── */}
              {tipoSelecionado && qualidadesDisponiveis.length > 0 && (
                <div>
                  <label className="text-gray-700 text-sm font-semibold block mb-2">Qualidade <span className="text-red-500">*</span></label>
                  <div className="space-y-2">
                    {qualidadesDisponiveis.map(r => {
                      const cfg = QUALIDADE_CONFIG[r.qualidade] || { icone: null, label: r.qualidade };
                      return (
                        <div key={r.id_residuo} onClick={() => handleQualidade(r.id_residuo)}
                          className={`border rounded-xl p-3 cursor-pointer transition ${String(formulario.id_residuo) === String(r.id_residuo) ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">{cfg.icone} {cfg.label}</span>
                            {/* Intervalo de preço — mostrado só aqui, uma única vez */}
                            {r.preco_min && r.preco_max && (
                              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">{r.preco_min} – {r.preco_max} Kz</span>
                            )}
                          </div>
                          {r.descricao && <p className="text-xs text-gray-400 mt-0.5">{r.descricao}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Passo 3: Título ── */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-1">Título <span className="text-red-500">*</span></label>
                <input type="text" value={formulario.titulo} onChange={e => handleCampo('titulo', e.target.value)}
                  placeholder="Ex: Procuramos papel boa qualidade — Luanda"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>

              {/* ── Passo 4: Descrição opcional ── */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-1">Descrição <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea value={formulario.descricao} onChange={e => handleCampo('descricao', e.target.value)}
                  placeholder="Condições do resíduo, forma de entrega, urgência..."
                  rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
              </div>

              {/* ── Passo 5: Valor por kg ── */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-1">Valor (Kz/kg) <span className="text-red-500">*</span></label>
                <input type="number" min="1" value={formulario.valor_proposto} onChange={e => handleCampo('valor_proposto', e.target.value)}
                  // Placeholder dinâmico com o intervalo da qualidade escolhida
                  placeholder={residuoSeleccionado ? `Entre ${residuoSeleccionado.preco_min} e ${residuoSeleccionado.preco_max}` : 'Ex: 300'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                {residuoSeleccionado && (
                  <p className="text-green-600 text-xs mt-1">Intervalo: {residuoSeleccionado.preco_min} – {residuoSeleccionado.preco_max} Kz/kg</p>
                )}
              </div>

              {/* ── Passo 6: Conversão de unidades ── */}
              {/* Só aparece após escolher o tipo — pré-preenchido com valores da BD */}
              {tipoSelecionado && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={15} className="text-blue-600 shrink-0" />
                    <p className="text-blue-800 text-sm font-semibold">Conversão de unidades</p>
                  </div>
                  {/* Explicação simples — acessível para qualquer pessoa */}
                  <p className="text-blue-600 text-xs mb-3">
                    Algumas pessoas não têm balança em casa. Ao definires quantas {formulario.nome_unidade || 'unidades'} equivalem a 1 kg,
                    o sistema converte automaticamente para que toda a gente consiga participar.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Nome da unidade — ex: garrafa, saco, peça */}
                    <div>
                      <label className="text-blue-700 text-xs font-medium block mb-1">Nome da unidade</label>
                      <input type="text" value={formulario.nome_unidade} onChange={e => handleCampo('nome_unidade', e.target.value)}
                        placeholder="Ex: garrafa, saco, peça"
                        className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                    </div>
                    {/* Peso por unidade — ex: 1 garrafa = 0,03 kg */}
                    <div>
                      <label className="text-blue-700 text-xs font-medium block mb-1">1 {formulario.nome_unidade || 'unidade'} pesa</label>
                      <div className="relative">
                        <input type="number" min="0.001" step="0.001" value={formulario.kg_por_unidade} onChange={e => handleCampo('kg_por_unidade', e.target.value)}
                          placeholder="Ex: 0.03"
                          className="w-full border border-blue-200 rounded-xl px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                        <span className="absolute right-3 top-2 text-blue-400 text-xs">kg</span>
                      </div>
                    </div>
                  </div>
                  {/* Preview de como vai aparecer para os utilizadores */}
                  {formulario.nome_unidade && formulario.kg_por_unidade && (
                    <div className="mt-3 bg-white rounded-xl p-3 border border-blue-200">
                      <p className="text-blue-700 text-xs font-medium">Como vai aparecer para os utilizadores:</p>
                      <p className="text-gray-700 text-sm mt-1">"1 {formulario.nome_unidade} = {formulario.kg_por_unidade} kg"</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Passo 7: Mínimo por pessoa ── */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={15} className="text-green-600 shrink-0" />
                  <label className="text-gray-700 text-sm font-semibold">
                    Quanto deve cada pessoa trazer no mínimo? <span className="text-red-500">*</span>
                  </label>
                </div>
                {/* Explicação clara para qualquer nível de literacia */}
                <p className="text-gray-400 text-xs mb-3">
                  Só as pessoas que tiverem esta quantidade ou mais podem responder ao teu pedido.
                </p>
                <div className="relative">
                  <input type="number" min="1" step="0.1" value={formulario.minimo_por_pessoa_kg}
                    onChange={e => handleCampo('minimo_por_pessoa_kg', e.target.value)}
                    placeholder="Ex: 20"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" />
                  <span className="absolute right-4 top-3 text-gray-400 text-sm">kg</span>
                </div>
                {/* Equivalente em unidades — só aparece se a conversão estiver definida */}
                {minimoUnidades !== null && formulario.nome_unidade && (
                  <div className="mt-2 flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-200">
                    <Scale size={13} className="text-green-600 shrink-0" />
                    <p className="text-gray-600 text-xs">
                      Quem não tiver balança: precisam de pelo menos{' '}
                      <strong className="text-green-700">{minimoUnidades} {formulario.nome_unidade}s</strong>
                    </p>
                  </div>
                )}
                {/* Estimativa do valor que a pessoa vai receber */}
                {estimativaTotal !== null && (
                  <div className="mt-2 flex items-center gap-2 bg-green-50 rounded-xl p-3 border border-green-200">
                    <Leaf size={13} className="text-green-600 shrink-0" />
                    <p className="text-gray-600 text-xs">
                      Quem trouxer o mínimo pode receber até{' '}
                      <strong className="text-green-700">
                        {estimativaTotal >= 1000 ? `${(estimativaTotal / 1000).toFixed(1)}k` : estimativaTotal.toFixed(0)} Kz
                      </strong>
                    </p>
                  </div>
                )}
              </div>

              {/* ── Passo 8: Total para agendar recolha ── */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={15} className="text-green-600 shrink-0" />
                  <label className="text-gray-700 text-sm font-semibold">
                    Quantos kg no total para ir buscar? <span className="text-red-500">*</span>
                  </label>
                </div>
                {/* Explicação do mecanismo de limiar */}
                <p className="text-gray-400 text-xs mb-3">
                  O sistema vai somar o lixo de todas as pessoas que aceitarem.
                  Quando chegar a este valor, avisamos-te para marcares o dia de recolha.
                </p>
                <div className="relative">
                  <input type="number" min="1" step="0.1" value={formulario.minimo_para_agendar}
                    onChange={e => handleCampo('minimo_para_agendar', e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" />
                  <span className="absolute right-4 top-3 text-gray-400 text-sm">kg</span>
                </div>
                {/* Equivalente em unidades do total para agendar */}
                {totalUnidades !== null && formulario.nome_unidade && (
                  <div className="mt-2 flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-200">
                    <Scale size={13} className="text-green-600 shrink-0" />
                    <p className="text-gray-600 text-xs">
                      Equivale a aproximadamente{' '}
                      <strong className="text-green-700">{totalUnidades.toLocaleString()} {formulario.nome_unidade}s</strong>{' '}
                      no total de todas as pessoas
                    </p>
                  </div>
                )}
                {/* Estimativa de quantas pessoas são necessárias */}
                {formulario.minimo_para_agendar && formulario.minimo_por_pessoa_kg &&
                  parseFloat(formulario.minimo_por_pessoa_kg) > 0 && (
                  <div className="mt-2 flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-200">
                    <Users size={13} className="text-green-600 shrink-0" />
                    <p className="text-gray-600 text-xs">
                      Precisas de pelo menos{' '}
                      <strong className="text-green-700">
                        {Math.ceil(parseFloat(formulario.minimo_para_agendar) / parseFloat(formulario.minimo_por_pessoa_kg))} pessoas
                      </strong>{' '}
                      para atingir o total
                    </p>
                  </div>
                )}
              </div>

              {/* ── Passo 9: Foto opcional ── */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-1">Foto <span className="text-gray-400 font-normal">(opcional)</span></label>
                {/* Preview com botão X para remover */}
                {imagemPreview ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-green-200">
                    <img src={imagemPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={removerImagem} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition"><X size={14} /></button>
                  </div>
                ) : (
                  // Área de upload — clique abre o seletor de ficheiros
                  <div onClick={() => inputFicheiroRef.current?.click()} className="w-full h-32 border-2 border-dashed border-green-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition">
                    <ImagePlus size={28} className="text-green-300 mb-2" />
                    <p className="text-gray-400 text-xs">Clica para adicionar uma foto</p>
                    <p className="text-gray-300 text-xs mt-0.5">PNG, JPG ou WEBP · Máx. 5MB</p>
                  </div>
                )}
                {/* Input file escondido — activado pelo clique na área acima */}
                <input ref={inputFicheiroRef} type="file" accept="image/*" onChange={handleImagem} className="hidden" />
                {erroImagem && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {erroImagem}</p>}
              </div>

              {/* ── Passo 10: Observações opcionais ── */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-1">Observações <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea value={formulario.observacoes} onChange={e => handleCampo('observacoes', e.target.value)}
                  placeholder="Estado esperado do resíduo, embalagem, outros detalhes..."
                  rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
              </div>

              {/* ── Passo 11: Toggle — coletador dependente ── */}
              {/* Sem data/hora — o agendamento é feito depois no Modal 2 */}
              <div className={`border rounded-xl p-4 transition ${formulario.com_coletador ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                {/* Linha clicável do toggle */}
                <div className="flex items-center justify-between cursor-pointer" onClick={handleToggleColetador}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${formulario.com_coletador ? 'bg-green-600' : 'bg-gray-100'}`}>
                      <UserCheck size={18} className={formulario.com_coletador ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className="text-gray-800 text-sm font-semibold">Vou enviar coletador a buscar</p>
                      <p className="text-gray-400 text-xs">A data de recolha é marcada depois, quando atingires o total</p>
                    </div>
                  </div>
                  {/* Ícone de toggle on/off */}
                  {formulario.com_coletador ? <ToggleRight size={28} className="text-green-600 shrink-0" /> : <ToggleLeft size={28} className="text-gray-300 shrink-0" />}
                </div>

                {/* Lista de coletadores — só aparece quando o toggle está activo */}
                {formulario.com_coletador && (
                  <div className="mt-4">
                    {/* Aviso quando não há coletadores dependentes */}
                    {coletadoresDependentes.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                        <p className="text-yellow-700 text-xs font-medium">Não tens coletadores dependentes na equipa.</p>
                        <button onClick={() => { setModalPedido(false); navigate('/ColetadoresEmpresa'); }} className="text-yellow-700 text-xs underline mt-1">Adicionar coletador dependente</button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 text-xs font-medium mb-2">Escolhe quem vai buscar <span className="text-gray-400">(podes escolher mais de um)</span></p>
                        {/* Selecção múltipla de coletadores dependentes */}
                        <div className="space-y-2">
                          {coletadoresDependentes.map(c => {
                            const sel = formulario.id_coletadores.includes(c.id_coletador);
                            return (
                              <div key={c.id_coletador} onClick={() => handleToggleColetadorItem(c.id_coletador)}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${sel ? 'border-green-500 bg-white' : 'border-gray-200 hover:bg-white'}`}>
                                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{c.nome?.charAt(0).toUpperCase()}</div>
                                <div className="min-w-0 flex-1"><p className="text-gray-800 text-sm font-medium truncate">{c.nome}</p><p className="text-gray-400 text-xs">{c.telefone}</p></div>
                                {/* Checkbox circular — verde quando seleccionado */}
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

              {/* Mensagem de erro do formulário */}
              {erroForm && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle size={14} /> {erroForm}
                </p>
              )}
            </div>

            {/* Botões Cancelar + Publicar */}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalPedido(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-sm">Cancelar</button>
              <button onClick={handlePublicarPedido} disabled={publicando} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                {publicando ? 'A publicar...' : <><Megaphone size={16} /> Publicar Pedido</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL 2: Recolhas
          Mostra o progresso em relação ao limiar,
          a lista de acordos pendentes e as recolhas já criadas.
          O botão "Agendar Recolha" só fica activo quando
          o limiar de kg acumulados é atingido.
      ════════════════════════════════════════════════════ */}
      {modalRecolhas && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[92vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2"><Package2 size={20} /> Recolhas</h3>
              <button onClick={() => setModalRecolhas(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            {/* Spinner enquanto carrega os dados do modal */}
            {carregandoRecolhas ? (
              <div className="text-center py-12">
                <Recycle size={32} className="mx-auto mb-3 text-green-400 animate-spin" />
                <p className="text-gray-400 text-sm">A carregar...</p>
              </div>
            ) : (
              <div className="space-y-5">

                {/* ── Barra de progresso do limiar ── */}
                {/* Fundo verde claro quando atingiu, branco quando ainda não */}
                <div className={`rounded-xl p-4 border ${atingiuLimiar ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target size={16} className={atingiuLimiar ? 'text-green-600' : 'text-gray-400'} />
                      <p className="text-gray-800 text-sm font-semibold">
                        {atingiuLimiar ? 'Podes agendar a recolha!' : 'Total acumulado'}
                      </p>
                    </div>
                    {/* Percentagem — limita a 100% mesmo se ultrapassar */}
                    <span className={`text-lg font-bold ${atingiuLimiar ? 'text-green-700' : 'text-gray-600'}`}>
                      {limiar > 0 ? Math.min(Math.round((totalAcordos / limiar) * 100), 100) : 0}%
                    </span>
                  </div>
                  {/* Barra de progresso — largura proporcional ao progresso */}
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full transition-all duration-500 ${atingiuLimiar ? 'bg-green-500' : 'bg-green-400'}`}
                      style={{ width: `${limiar > 0 ? Math.min((totalAcordos / limiar) * 100, 100) : 0}%` }} />
                  </div>
                  <p className="text-gray-500 text-xs">{totalAcordos} de {limiar} kg acumulados</p>
                  {/* Mensagem de sugestão do backend quando atinge o limiar */}
                  {sugestao && <p className="text-green-700 text-xs mt-1 flex items-center gap-1"><Bell size={11} /> {sugestao}</p>}
                  {/* Quantos kg faltam — só quando ainda não atingiu */}
                  {!atingiuLimiar && limiar > 0 && (
                    <p className="text-gray-400 text-xs mt-1">Faltam {limiar - totalAcordos} kg para agendar.</p>
                  )}
                </div>

                {/* Botão de agendar — desactivado enquanto não atinge o limiar */}
                <button onClick={abrirModalAgendar} disabled={!atingiuLimiar}
                  className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-sm transition ${
                    atingiuLimiar ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}>
                  <CalendarCheck size={16} />
                  {/* Texto do botão muda conforme o estado */}
                  {atingiuLimiar ? 'Agendar Recolha' : `Aguarda mais ${limiar - totalAcordos} kg`}
                </button>

                {/* ── Lista de acordos pendentes ── */}
                {acordos.length > 0 && (
                  <div>
                    <p className="text-gray-700 text-sm font-semibold mb-2 flex items-center gap-2">
                      <Package size={15} className="text-green-600" /> Acordos por Recolher
                      {/* Badge com o total de acordos */}
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{acordos.length}</span>
                    </p>
                    <div className="space-y-2">
                      {acordos.map(a => (
                        <div key={a.id_entrega} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center shrink-0"><CheckCircle size={13} className="text-green-600" /></div>
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-800 text-sm font-medium">{a.nome_usuario}</p>
                            <p className="text-gray-400 text-xs">{a.tipos_residuos}</p>
                            {a.endereco_domicilio && <p className="text-gray-400 text-xs">📍 {a.endereco_domicilio}</p>}
                          </div>
                          {a.peso_total && <span className="text-green-600 text-xs font-medium shrink-0">{a.peso_total} kg</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Lista de recolhas agendadas ── */}
                {recolhas.length > 0 && (
                  <div>
                    <p className="text-gray-700 text-sm font-semibold mb-2 flex items-center gap-2">
                      <CalendarCheck size={15} className="text-green-600" /> Recolhas Agendadas
                    </p>
                    <div className="space-y-2">
                      {recolhas.map(r => {
                        const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.agendada;
                        const expandida = recolhaExpandida === r.id_recolha; // controla expand/colapso
                        return (
                          <div key={r.id_recolha} className="border border-gray-200 rounded-xl overflow-hidden">
                            {/* Linha principal — clicável para expandir */}
                            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition"
                              onClick={() => setRecolhaExpandida(expandida ? null : r.id_recolha)}>
                              <div className="flex items-center gap-3">
                                {/* Mini calendário visual */}
                                <div className="w-10 h-10 bg-green-600 text-white rounded-xl flex flex-col items-center justify-center shrink-0">
                                  <span className="text-xs leading-none">{new Date(r.data_recolha).toLocaleDateString('pt-AO', { month: 'short' }).toUpperCase()}</span>
                                  <span className="text-sm font-bold leading-none">{new Date(r.data_recolha).getDate()}</span>
                                </div>
                                <div>
                                  <p className="text-gray-800 text-sm font-medium">{new Date(r.data_recolha).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</p>
                                  <p className="text-gray-400 text-xs">{r.total_entregas} entregas · {r.coletadores}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${cfg.cor}`}>{cfg.label}</span>
                                {expandida ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                              </div>
                            </div>

                            {/* Detalhes expandidos — observações e botões de acção */}
                            {expandida && (
                              <div className="border-t border-gray-100 p-3 bg-gray-50 space-y-2">
                                {r.observacoes && <p className="text-gray-500 text-xs">{r.observacoes}</p>}
                                <div className="flex gap-2 flex-wrap">
                                  {/* Botões conforme o status actual */}
                                  {r.status === 'agendada' && (
                                    <>
                                      {/* Iniciar = coletador já saiu para recolher */}
                                      <button onClick={() => handleStatusRecolha(r.id_recolha, 'em_curso')}
                                        className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
                                        <Truck size={12} /> Iniciar Recolha
                                      </button>
                                      {/* Cancelar = recolha não vai acontecer */}
                                      <button onClick={() => handleStatusRecolha(r.id_recolha, 'cancelada')}
                                        className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition">
                                        <XCircle size={12} /> Cancelar
                                      </button>
                                    </>
                                  )}
                                  {/* Em curso → pode marcar como concluída */}
                                  {r.status === 'em_curso' && (
                                    <button onClick={() => handleStatusRecolha(r.id_recolha, 'concluida')}
                                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
                                      <CheckCircle size={12} /> Marcar como Concluída
                                    </button>
                                  )}
                                  {/* Concluída e cancelada não têm botões de acção */}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Estado vazio — quando não há acordos nem recolhas */}
                {acordos.length === 0 && recolhas.length === 0 && (
                  <div className="text-center py-8">
                    <Package2 size={36} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 text-sm">Ainda não há acordos nem recolhas.</p>
                    <p className="text-gray-300 text-xs mt-1">Publica um pedido de resíduo para começar.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL 3: Agendar Recolha
          Abre por cima do Modal 2 (z-index maior).
          A empresa define:
          - Data e hora da recolha
          - Coletadores dependentes (selecção múltipla)
          - Acordos incluídos (pode desseleccionar individualmente)
          Ao confirmar, todos os utilizadores são notificados
          na plataforma e por email.
      ════════════════════════════════════════════════════ */}
      {modalAgendar && (
        <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-60 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2"><CalendarCheck size={20} /> Agendar Recolha</h3>
              <button onClick={() => setModalAgendar(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="space-y-5">

              {/* ── Data e hora — ambos obrigatórios ── */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-2">Quando vais buscar? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Dia</p>
                    {/* Data mínima = hoje (não pode agendar no passado) */}
                    <input type="date" value={dataRecolha} onChange={e => setDataRecolha(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Hora</p>
                    <input type="time" value={horaRecolha} onChange={e => setHoraRecolha(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  </div>
                </div>
              </div>

              {/* ── Coletadores dependentes — selecção múltipla ── */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-2">Quem vai buscar? <span className="text-red-500">*</span></label>
                {coletadoresDependentes.length === 0 ? (
                  // Aviso quando não há coletadores dependentes
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                    <p className="text-yellow-700 text-xs">Não tens coletadores dependentes.</p>
                    <button onClick={() => { setModalAgendar(false); setModalRecolhas(false); navigate('/ColetadoresEmpresa'); }} className="text-yellow-700 text-xs underline mt-1">Adicionar coletador</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {coletadoresDependentes.map(c => {
                      const sel = idsColetadores.includes(c.id_coletador);
                      return (
                        <div key={c.id_coletador}
                          // Toggle inline — adiciona ou remove da lista
                          onClick={() => setIdsColetadores(prev => sel ? prev.filter(x => x !== c.id_coletador) : [...prev, c.id_coletador])}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${sel ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{c.nome?.charAt(0).toUpperCase()}</div>
                          <div className="min-w-0 flex-1"><p className="text-gray-800 text-sm font-medium truncate">{c.nome}</p><p className="text-gray-400 text-xs">{c.telefone}</p></div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                            {sel && <CheckCircle size={12} className="text-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Acordos incluídos — empresa pode excluir individualmente ── */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-2">
                  Quem está incluído nesta recolha?
                  {/* Contador: seleccionados vs total */}
                  <span className="text-gray-400 font-normal ml-1">({idsEntregas.length} de {acordos.length})</span>
                </label>
                {/* Lista com scroll quando há muitos acordos */}
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {acordos.map(a => {
                    const sel = idsEntregas.includes(a.id_entrega);
                    return (
                      <div key={a.id_entrega}
                        onClick={() => setIdsEntregas(prev => sel ? prev.filter(x => x !== a.id_entrega) : [...prev, a.id_entrega])}
                        // Excluídos ficam desbotados (opacity-60)
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${sel ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-800 text-sm font-medium">{a.nome_usuario}</p>
                          <p className="text-gray-400 text-xs">{a.tipos_residuos}{a.peso_total ? ` · ${a.peso_total} kg` : ''}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                          {sel && <CheckCircle size={12} className="text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Aviso de notificação ── */}
              {/* Só aparece quando data, hora e acordos estão definidos */}
              {idsEntregas.length > 0 && dataRecolha && horaRecolha && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                  <Bell size={14} className="text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-blue-700 text-xs">
                    {/* Mostra quantas pessoas vão ser notificadas e a data/hora */}
                    <strong>{idsEntregas.length} pessoas</strong> vão receber uma notificação na plataforma e por email a informar que a recolha está marcada para{' '}
                    <strong>
                      {new Date(`${dataRecolha}T${horaRecolha}`).toLocaleString('pt-AO', {
                        day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
                      })}
                    </strong>.
                  </p>
                </div>
              )}

              {/* Erro de validação do modal */}
              {erroAgendar && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle size={14} /> {erroAgendar}
                </p>
              )}
            </div>

            {/* Botões Voltar (fecha Modal 3) + Confirmar */}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModalAgendar(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-sm">Voltar</button>
              <button onClick={handleAgendar} disabled={agendando} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                {agendando ? 'A agendar...' : <><CalendarCheck size={16} /> Confirmar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}