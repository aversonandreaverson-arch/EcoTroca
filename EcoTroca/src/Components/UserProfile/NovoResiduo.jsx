// ============================================================
//  NovoResiduo.jsx — Formulário de publicação/edição de resíduo
//  Guardar em: src/Components/UserProfile/NovoResiduo.jsx
//
//  Funciona em dois modos:
//    - Criação  → URL: /NovoResiduo
//    - Edição   → URL: /EditarResiduo/:id
//
//  Passo a passo do formulário:
//    1. Tipo de resíduo (Plástico, Papel, Metal, Vidro)
//    2. Qualidade (Ruim, Moderada, Boa, Excelente) com intervalo de preço
//    3. Tipo de entrega (domicílio ou ponto de recolha)
//    4. Endereço obrigatório + referência opcional
//    5. Forma de recompensa (dinheiro ou saldo EcoTroca)
//    6. Upload de foto do resíduo (opcional)
//    7. Observações opcionais
//
//  Ao submeter:
//    - Criação → POST /api/entregas (cria Entrega + Publicacao automaticamente)
//    - Edição  → PATCH /api/entregas/:id
//
//  Upload de imagem:
//    - Ficheiro convertido para base64 antes de enviar
//    - Preview da imagem antes de publicar
//    - Limite de 5MB no frontend
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Recycle, FileText, Wrench, Wine,        // Ícones dos tipos de resíduo
  Home, MapPin,                            // Ícones do tipo de entrega
  Banknote, CreditCard,                   // Ícones de recompensa
  ThumbsDown, Smile, ThumbsUp, Star,      // Ícones de qualidade
  ImagePlus, X, AlertCircle               // Ícones de upload e erro
} from "lucide-react";
import { criarEntrega, editarEntrega, getEntrega, getResiduos } from "../../api.js";
import Header from "./Header";

// ── Mapeamento de ícones por tipo de resíduo ─────────────────
// Substitui os emojis por componentes Lucide
const ICONE_TIPO = {
  Plastico: <Recycle size={20} className="mx-auto mb-1 text-green-600" />,
  Papel:    <FileText size={20} className="mx-auto mb-1 text-yellow-600" />,
  Metal:    <Wrench size={20} className="mx-auto mb-1 text-gray-600" />,
  Vidro:    <Wine size={20} className="mx-auto mb-1 text-blue-500" />,
};

// ── Label legível por tipo de resíduo ────────────────────────
const LABEL_TIPO = {
  Plastico: 'Plástico',
  Papel:    'Papel',
  Metal:    'Metal',
  Vidro:    'Vidro',
};

// ── Ícone e label por qualidade ──────────────────────────────
// Substitui os emojis por ícones Lucide com cor adequada
const QUALIDADE_CONFIG = {
  ruim:      { icone: <ThumbsDown size={14} className="text-red-500"    />, label: 'Ruim'      },
  moderada:  { icone: <Smile      size={14} className="text-yellow-500" />, label: 'Moderada'  },
  boa:       { icone: <ThumbsUp   size={14} className="text-green-500"  />, label: 'Boa'       },
  excelente: { icone: <Star       size={14} className="text-orange-400" />, label: 'Excelente' },
};

export default function NovoResiduo() {
  const navigate   = useNavigate();

  // Leio o id da URL — se existir estou em modo edição
  const { id }     = useParams();
  const modoEdicao = !!id;

  // ── Lista completa de resíduos vindos da BD ───────────────
  const [todosResiduos,        setTodosResiduos]        = useState([]);
  // Tipos únicos para o primeiro selector (Plástico, Papel, Metal, Vidro)
  const [tiposUnicos,          setTiposUnicos]          = useState([]);
  // Qualidades disponíveis para o tipo seleccionado
  const [qualidadesDisponiveis,setQualidadesDisponiveis]= useState([]);

  // ── Campos do formulário ─────────────────────────────────
  const [tipoSelecionado, setTipoSelecionado] = useState('');   // Ex: 'Plastico'
  const [idResiduo,       setIdResiduo]       = useState('');   // id_residuo da qualidade
  const [recompensa,      setRecompensa]      = useState('dinheiro');
  const [tipoEntrega,     setTipoEntrega]     = useState('domicilio');
  const [endereco,        setEndereco]        = useState('');
  const [referencia,      setReferencia]      = useState('');
  const [observacoes,     setObservacoes]     = useState('');

  // ── Upload de imagem ─────────────────────────────────────
  const [imagemBase64, setImagemBase64] = useState('');   // Base64 para enviar ao backend
  const [imagemPreview,setImagemPreview]= useState('');   // URL local para pré-visualização
  const [erroImagem,   setErroImagem]   = useState('');   // Mensagem de erro de upload
  const inputFicheiroRef = useRef(null);                   // Ref para o input file escondido

  // ── Estado geral ─────────────────────────────────────────
  const [erro,       setErro]       = useState('');
  const [carregando, setCarregando] = useState(false);

  // ── Carrego resíduos ao montar e pré-preencho se edição ──
  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await getResiduos(); // GET /api/residuos
        setTodosResiduos(dados);

        // Extraio os tipos únicos para os botões do passo 1
        const tipos = [...new Set(dados.map(r => r.tipo))];
        setTiposUnicos(tipos);

        // Se estiver em modo edição pré-preencho o formulário
        if (modoEdicao) {
          const entrega = await getEntrega(id); // GET /api/entregas/:id
          setTipoEntrega(entrega.tipo_entrega      || 'domicilio');
          setEndereco(entrega.endereco_domicilio   || '');
          setRecompensa(entrega.tipo_recompensa    || 'dinheiro');
          setObservacoes(entrega.observacoes       || '');

          // Pré-selecciono o tipo e a qualidade do resíduo existente
          if (entrega.tipo_residuo) {
            setTipoSelecionado(entrega.tipo_residuo);
            const qualidades = dados.filter(r => r.tipo === entrega.tipo_residuo);
            setQualidadesDisponiveis(qualidades);
            if (entrega.id_residuo) setIdResiduo(entrega.id_residuo);
          }

          // Pré-visualizo a imagem existente se houver
          if (entrega.imagem) setImagemPreview(entrega.imagem);
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
      }
    };
    carregar();
  }, []);

  // ── Ao seleccionar tipo actualizo as qualidades disponíveis ─
  const handleTipo = (tipo) => {
    setTipoSelecionado(tipo);
    setIdResiduo(''); // Limpo a qualidade anterior ao mudar de tipo
    // Filtro os resíduos deste tipo para mostrar as qualidades
    setQualidadesDisponiveis(todosResiduos.filter(r => r.tipo === tipo));
  };

  // ── Processo o ficheiro de imagem seleccionado ───────────
  // Converte para base64 para enviar ao backend e cria URL de preview
  const handleImagem = (e) => {
    const ficheiro = e.target.files[0];
    if (!ficheiro) return;

    // Valido o tamanho — máximo 5MB
    if (ficheiro.size > 5 * 1024 * 1024) {
      setErroImagem('A imagem não pode ter mais de 5MB.');
      return;
    }

    // Valido o tipo de ficheiro — só imagens
    if (!ficheiro.type.startsWith('image/')) {
      setErroImagem('Selecciona um ficheiro de imagem válido.');
      return;
    }

    setErroImagem('');

    // Converto para base64 para enviar ao backend
    const leitor = new FileReader();
    leitor.onload = (ev) => {
      setImagemBase64(ev.target.result);   // Base64 completo para a API
      setImagemPreview(ev.target.result);  // Mesmo base64 para o preview
    };
    leitor.readAsDataURL(ficheiro);
  };

  // ── Remove a imagem seleccionada ─────────────────────────
  const removerImagem = () => {
    setImagemBase64('');
    setImagemPreview('');
    setErroImagem('');
    // Reseto o input para permitir seleccionar o mesmo ficheiro novamente
    if (inputFicheiroRef.current) inputFicheiroRef.current.value = '';
  };

  // ── Submete o formulário ao backend ──────────────────────
  // Valida os campos obrigatórios antes de enviar
  const handlePublicar = async () => {
    if (!idResiduo) {
      setErro('Selecciona o tipo e a qualidade do resíduo.');
      return;
    }
    if (!endereco.trim()) {
      setErro('O endereço é obrigatório.');
      return;
    }

    try {
      setErro('');
      setCarregando(true);

      // Dados a enviar ao backend
      const dados = {
        tipo_entrega:       tipoEntrega,
        endereco_domicilio: endereco.trim(),
        id_ponto:           null,
        tipo_recompensa:    recompensa,
        observacoes:        observacoes || null,
        imagem:             imagemBase64 || null, // Base64 ou null se não houver imagem
        residuos: [{
          id_residuo: parseInt(idResiduo),
          peso_kg:    0,
          quantidade: 1,
        }],
      };

      // Decido se crio ou edito com base no modo
      if (modoEdicao) {
        await editarEntrega(id, dados); // PATCH /api/entregas/:id
      } else {
        await criarEntrega(dados);      // POST /api/entregas
      }

      navigate('/Dashboard'); // Redireciono para o painel após guardar
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    // Fundo verde escuro como no DashboardEmpresa
    <div className="min-h-screen bg-green-700 pt-24 p-6">
      <Header />

      {/* Card central do formulário */}
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-6">

        {/* Título muda consoante o modo */}
        <h2 className="text-2xl font-bold mb-1 text-green-700">
          {modoEdicao ? 'Editar Resíduo' : 'Publicar Resíduo'}
        </h2>
        <p className="text-gray-400 text-xs mb-6">
          A publicação expira em 7 dias se não houver interesse.
        </p>

        {/* ── Passo 1: Tipo de resíduo ── */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Tipo de Resíduo <span className="text-red-500">*</span>
          </label>
          {/* Grelha de 2 colunas com ícone Lucide + label */}
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
                {/* Ícone Lucide correspondente ao tipo */}
                {ICONE_TIPO[tipo] || <Recycle size={20} className="mx-auto mb-1 text-gray-400" />}
                {LABEL_TIPO[tipo] || tipo}
              </div>
            ))}
          </div>
        </div>

        {/* ── Passo 2: Qualidade — aparece após seleccionar tipo ── */}
        {tipoSelecionado && qualidadesDisponiveis.length > 0 && (
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Qualidade <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {qualidadesDisponiveis.map(r => {
                // Leio o ícone e label da qualidade do mapeamento
                const cfg = QUALIDADE_CONFIG[r.qualidade] || { icone: null, label: r.qualidade };
                return (
                  <div
                    key={r.id_residuo}
                    onClick={() => setIdResiduo(r.id_residuo)}
                    className={`border rounded-xl p-3 cursor-pointer transition ${
                      idResiduo == r.id_residuo
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      {/* Ícone + label da qualidade */}
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        {cfg.icone} {cfg.label}
                      </span>
                      {/* Intervalo de preço esperado por kg */}
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

        {/* ── Passo 3: Tipo de entrega ── */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Como preferes entregar?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Opção domicílio — coletador vem a casa */}
            <div
              onClick={() => setTipoEntrega('domicilio')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center text-sm ${
                tipoEntrega === 'domicilio'
                  ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                  : 'hover:bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {/* Ícone de casa */}
              <Home size={18} className="mx-auto mb-1 text-green-600" />
              Em casa
              <p className="text-xs text-gray-400 mt-1">O coletador vem até mim</p>
            </div>
            {/* Opção ponto de recolha — utilizador leva o resíduo */}
            <div
              onClick={() => setTipoEntrega('ponto_recolha')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center text-sm ${
                tipoEntrega === 'ponto_recolha'
                  ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                  : 'hover:bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {/* Ícone de pin de localização */}
              <MapPin size={18} className="mx-auto mb-1 text-green-600" />
              Ponto de recolha
              <p className="text-xs text-gray-400 mt-1">Levo eu ao ponto</p>
            </div>
          </div>
        </div>

        {/* ── Passo 4: Endereço obrigatório ── */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Endereço <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Rua da Missão, Nº 45, Ingombota"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
        </div>

        {/* ── Referência opcional ── */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Referência (opcional)
          </label>
          <input
            type="text"
            placeholder="Ex: Perto do mercado, portão azul"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
        </div>

        {/* ── Passo 5: Forma de recompensa ── */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Forma de Recompensa
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Recompensa em dinheiro físico */}
            <div
              onClick={() => setRecompensa('dinheiro')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center ${
                recompensa === 'dinheiro'
                  ? 'border-green-500 bg-green-50'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              {/* Ícone de nota */}
              <Banknote size={18} className="mx-auto mb-1 text-green-600" />
              <p className="font-medium text-sm text-gray-700">Dinheiro</p>
              <p className="text-xs text-gray-400">Recebo em dinheiro</p>
            </div>
            {/* Recompensa em saldo na plataforma */}
            <div
              onClick={() => setRecompensa('saldo')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center ${
                recompensa === 'saldo'
                  ? 'border-green-500 bg-green-50'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              {/* Ícone de cartão */}
              <CreditCard size={18} className="mx-auto mb-1 text-blue-500" />
              <p className="font-medium text-sm text-gray-700">Saldo</p>
              <p className="text-xs text-gray-400">Recebo na carteira EcoTroca</p>
            </div>
          </div>
        </div>

        {/* ── Passo 6: Upload de foto do resíduo ── */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Foto do Resíduo (opcional)
          </label>

          {/* Preview da imagem — aparece após seleccionar ficheiro */}
          {imagemPreview ? (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-green-200">
              <img
                src={imagemPreview}
                alt="Preview do resíduo"
                className="w-full h-full object-cover"
              />
              {/* Botão X para remover a imagem seleccionada */}
              <button
                onClick={removerImagem}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            // Área de upload — clica para abrir o seletor de ficheiros
            <div
              onClick={() => inputFicheiroRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-green-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition"
            >
              {/* Ícone de adicionar imagem */}
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
        <div className="mb-5">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Observações (opcional)
          </label>
          <textarea
            placeholder="Estado do resíduo, limpeza, embalagem..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
            rows={3}
          />
        </div>

        {/* Mensagem de erro geral do formulário */}
        {erro && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle size={14} /> {erro}
          </p>
        )}

        {/* Botões Cancelar e Publicar/Guardar */}
        <div className="flex gap-3">
          {/* Cancelar — volta ao Dashboard sem guardar */}
          <button
            onClick={() => navigate('/Dashboard')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl transition flex-1 text-sm font-medium"
          >
            Cancelar
          </button>
          {/* Submeter — desactivado durante o carregamento */}
          <button
            onClick={handlePublicar}
            disabled={carregando}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl transition flex-1 text-sm font-medium"
          >
            {carregando ? 'A guardar...' : modoEdicao ? 'Guardar Alterações' : 'Publicar Resíduo'}
          </button>
        </div>

      </div>
    </div>
  );
}