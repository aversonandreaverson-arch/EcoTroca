
//  FLUXO:
//    1. Tipo de resíduo (Plástico, Papel, Metal, Vidro)
//    2. Qualidade com intervalo de preço
//    3. Tipo de entrega (domicílio ou ponto de recolha)
//    4. Endereço obrigatório + referência opcional
//    5. Forma de recompensa (dinheiro, saldo ou pontos)
//    6. Upload de foto (opcional)
//    7. Observações (opcional)

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Recycle, FileText, Wrench, Wine,
  Home, MapPin, Banknote, CreditCard, Star as StarIcon,
  ThumbsDown, Smile, ThumbsUp, Star,
  ImagePlus, X, AlertCircle, Building2
} from "lucide-react";
import { criarEntrega, editarEntrega, getEntrega, getResiduos, getEmpresaPorId } from "../../api.js";
import Header from "./Header";

// ── Ícones por tipo de resíduo ───────────────────────────────
const ICONE_TIPO = {
  Plastico: <Recycle  size={20} className="mx-auto mb-1 text-green-600"  />,
  Papel:    <FileText size={20} className="mx-auto mb-1 text-yellow-600" />,
  Metal:    <Wrench   size={20} className="mx-auto mb-1 text-gray-600"   />,
  Vidro:    <Wine     size={20} className="mx-auto mb-1 text-blue-500"   />,
};

// ── Labels legíveis por tipo ──────────────────────────────────
const LABEL_TIPO = {
  Plastico: 'Plástico',
  Papel:    'Papel',
  Metal:    'Metal',
  Vidro:    'Vidro',
};

// ── Ícone e label por qualidade ──────────────────────────────
const QUALIDADE_CONFIG = {
  ruim:      { icone: <ThumbsDown size={14} className="text-red-500"    />, label: 'Ruim'      },
  moderada:  { icone: <Smile      size={14} className="text-yellow-500" />, label: 'Moderada'  },
  boa:       { icone: <ThumbsUp   size={14} className="text-green-500"  />, label: 'Boa'       },
  excelente: { icone: <Star       size={14} className="text-orange-400" />, label: 'Excelente' },
};

export default function NovoResiduo() {
  const navigate      = useNavigate();
  const { id }        = useParams();        // id da entrega em modo edição
  const [searchParams] = useSearchParams(); // parâmetros da URL (?empresa=X&pub=Y)
  const modoEdicao    = !!id;              // true = editar entrega existente

  // ── Modo empresa — quando vem de um pedido ────────────────
  // Lê os parâmetros da URL: ?empresa=3&pub=12
  const idEmpresaUrl    = searchParams.get('empresa');    // id da empresa destino
  const idPublicacaoUrl = searchParams.get('pub');        // id do pedido da empresa
  const modoEmpresa     = !!idEmpresaUrl;                 // true = oferta directa à empresa

  // ── Estado da empresa destino ─────────────────────────────
  const [nomeEmpresa, setNomeEmpresa] = useState('');    // nome da empresa para o banner

  // ── Lista de resíduos da BD ───────────────────────────────
  const [todosResiduos,         setTodosResiduos]         = useState([]);
  const [tiposUnicos,           setTiposUnicos]           = useState([]);
  const [qualidadesDisponiveis, setQualidadesDisponiveis] = useState([]);

  // ── Campos do formulário ──────────────────────────────────
  const [tipoSelecionado, setTipoSelecionado] = useState('');        // ex: 'Plastico'
  const [idResiduo,       setIdResiduo]       = useState('');        // id do resíduo seleccionado
  const [recompensa,      setRecompensa]      = useState('dinheiro'); // dinheiro | saldo | pontos
  const [tipoEntrega,     setTipoEntrega]     = useState('domicilio'); // domicilio | ponto_recolha
  const [endereco,        setEndereco]        = useState('');
  const [referencia,      setReferencia]      = useState('');
  const [observacoes,     setObservacoes]     = useState('');

  // ── Upload de imagem ──────────────────────────────────────
  const [imagemBase64,   setImagemBase64]   = useState(''); // base64 para enviar ao backend
  const [imagemPreview,  setImagemPreview]  = useState(''); // URL local para preview
  const [erroImagem,     setErroImagem]     = useState(''); // erro de validação
  const inputFicheiroRef = useRef(null);                    // ref do input file oculto

  // ── Estado geral ──────────────────────────────────────────
  const [erro,       setErro]       = useState('');
  const [carregando, setCarregando] = useState(false);

  // ── Carregamento inicial ───────────────────────────────────
  useEffect(() => {
    const carregar = async () => {
      try {
        // Carrega todos os tipos de resíduos da BD
        const dados = await getResiduos();
        setTodosResiduos(dados);
        setTiposUnicos([...new Set(dados.map(r => r.tipo))]);

        // Se vier de um pedido de empresa, carrega o nome da empresa para o banner
        if (modoEmpresa && idEmpresaUrl) {
          try {
            const empresa = await getEmpresaPorId(idEmpresaUrl);
            setNomeEmpresa(empresa.nome || 'Empresa');
          } catch {
            setNomeEmpresa('Empresa');
          }
        }

        // Em modo edição, pré-preenche o formulário com os dados existentes
        if (modoEdicao) {
          const entrega = await getEntrega(id);
          setTipoEntrega(entrega.tipo_entrega    || 'domicilio');
          setEndereco(entrega.endereco_domicilio || '');
          setRecompensa(entrega.tipo_recompensa  || 'dinheiro');
          setObservacoes(entrega.observacoes     || '');

          // Restaura o tipo e qualidade do resíduo
          if (entrega.tipo_residuo) {
            setTipoSelecionado(entrega.tipo_residuo);
            const qualidades = dados.filter(r => r.tipo === entrega.tipo_residuo);
            setQualidadesDisponiveis(qualidades);
            if (entrega.id_residuo) setIdResiduo(entrega.id_residuo);
          }

          // Restaura a imagem se existir
          if (entrega.imagem) setImagemPreview(entrega.imagem);
        }
      } catch (err) {
        console.error('Erro ao carregar:', err);
      }
    };
    carregar();
  }, []);

  // ── Selecciona tipo e actualiza qualidades disponíveis ────
  const handleTipo = (tipo) => {
    setTipoSelecionado(tipo);
    setIdResiduo(''); // limpa qualidade anterior ao mudar tipo
    setQualidadesDisponiveis(todosResiduos.filter(r => r.tipo === tipo));
  };

  // ── Processa upload de imagem e converte para base64 ─────
  const handleImagem = (e) => {
    const ficheiro = e.target.files[0];
    if (!ficheiro) return;
    if (ficheiro.size > 5 * 1024 * 1024) { setErroImagem('A imagem não pode ter mais de 5MB.'); return; }
    if (!ficheiro.type.startsWith('image/')) { setErroImagem('Selecciona um ficheiro de imagem válido.'); return; }
    setErroImagem('');
    const leitor = new FileReader();
    leitor.onload = (ev) => {
      setImagemBase64(ev.target.result);  // base64 para enviar ao backend
      setImagemPreview(ev.target.result); // base64 para mostrar o preview
    };
    leitor.readAsDataURL(ficheiro);
  };

  // ── Remove imagem seleccionada ────────────────────────────
  const removerImagem = () => {
    setImagemBase64('');
    setImagemPreview('');
    setErroImagem('');
    if (inputFicheiroRef.current) inputFicheiroRef.current.value = '';
  };

  // ── Submete o formulário ──────────────────────────────────
  const handlePublicar = async () => {
    // Validações obrigatórias
    if (!idResiduo) { setErro('Selecciona o tipo e a qualidade do resíduo.'); return; }
    if (!endereco.trim()) { setErro('O endereço é obrigatório.'); return; }

    try {
      setErro('');
      setCarregando(true);

      // Dados base da entrega
      const dados = {
        tipo_entrega:       tipoEntrega,
        endereco_domicilio: endereco.trim(),
        id_ponto:           null,
        tipo_recompensa:    recompensa,
        observacoes:        observacoes || null,
        imagem:             imagemBase64 || null,
        residuos: [{
          id_residuo: parseInt(idResiduo),
          peso_kg:    0,    // peso estimado — o real é registado pela empresa ao aceitar
          quantidade: 1,
        }],
      };

      // Se for oferta directa a uma empresa, adiciona id_empresa e id_publicacao
      // Isto liga a entrega ao pedido específico da empresa no feed
      if (modoEmpresa && idEmpresaUrl) {
        dados.id_empresa    = parseInt(idEmpresaUrl);
        dados.id_publicacao = idPublicacaoUrl ? parseInt(idPublicacaoUrl) : null;
      }

      if (modoEdicao) {
        await editarEntrega(id, dados); // PUT /api/entregas/:id
      } else {
        await criarEntrega(dados);      // POST /api/entregas
      }

      navigate('/Dashboard'); // redireciona para o dashboard após guardar
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12 p-6">
      <Header />

      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-6">

        {/* Título muda consoante o modo */}
        <h2 className="text-2xl font-bold mb-1 text-green-700">
          {modoEdicao ? 'Editar Resíduo' : 'Publicar Resíduo'}
        </h2>
        <p className="text-gray-400 text-xs mb-4">
          A publicação expira em 7 dias se não houver interesse.
        </p>

        {/* ── Banner quando é oferta directa a uma empresa ── */}
        {modoEmpresa && nomeEmpresa && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
            <Building2 size={18} className="text-green-600 shrink-0" />
            <div>
              <p className="text-green-800 text-sm font-semibold">Oferta directa à empresa</p>
              <p className="text-green-600 text-xs">A enviar oferta para <strong>{nomeEmpresa}</strong></p>
            </div>
          </div>
        )}

        {/* ── Passo 1: Tipo de resíduo ── */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Tipo de Resíduo <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {tiposUnicos.map(tipo => (
              <div key={tipo} onClick={() => handleTipo(tipo)}
                className={`border rounded-xl p-3 cursor-pointer transition text-center text-sm font-medium ${
                  tipoSelecionado === tipo
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}>
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
                const cfg = QUALIDADE_CONFIG[r.qualidade] || { icone: null, label: r.qualidade };
                return (
                  <div key={r.id_residuo} onClick={() => setIdResiduo(r.id_residuo)}
                    className={`border rounded-xl p-3 cursor-pointer transition ${
                      idResiduo == r.id_residuo
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        {cfg.icone} {cfg.label}
                      </span>
                      {r.preco_min && r.preco_max && (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">
                          {r.preco_min} – {r.preco_max} Kz/kg
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

        {/* ── Passo 3: Tipo de entrega ── */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Como preferes entregar?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div onClick={() => setTipoEntrega('domicilio')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center text-sm ${
                tipoEntrega === 'domicilio'
                  ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                  : 'hover:bg-gray-50 text-gray-600 border-gray-200'
              }`}>
              <Home size={18} className="mx-auto mb-1 text-green-600" />
              Em casa
              <p className="text-xs text-gray-400 mt-1">O coletador vem até mim</p>
            </div>
            <div onClick={() => setTipoEntrega('ponto_recolha')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center text-sm ${
                tipoEntrega === 'ponto_recolha'
                  ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                  : 'hover:bg-gray-50 text-gray-600 border-gray-200'
              }`}>
              <MapPin size={18} className="mx-auto mb-1 text-green-600" />
              Ponto de recolha
              <p className="text-xs text-gray-400 mt-1">Levo eu ao ponto</p>
            </div>
          </div>
        </div>

        {/* ── Passo 4: Endereço obrigatório + referência ── */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Endereço <span className="text-red-500">*</span>
          </label>
          <input type="text" placeholder="Ex: Rua da Missão, Nº 45, Ingombota"
            value={endereco} onChange={(e) => setEndereco(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Referência (opcional)
          </label>
          <input type="text" placeholder="Ex: Perto do mercado, portão azul"
            value={referencia} onChange={(e) => setReferencia(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>

        {/* ── Passo 5: Forma de recompensa ── */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Forma de Recompensa
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Dinheiro sacável */}
            <div onClick={() => setRecompensa('dinheiro')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center ${
                recompensa === 'dinheiro' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50 border-gray-200'
              }`}>
              <Banknote size={18} className="mx-auto mb-1 text-green-600" />
              <p className="font-medium text-xs text-gray-700">Dinheiro</p>
              <p className="text-xs text-gray-400">Sacável</p>
            </div>
            {/* Saldo na plataforma */}
            <div onClick={() => setRecompensa('saldo')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center ${
                recompensa === 'saldo' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50 border-gray-200'
              }`}>
              <CreditCard size={18} className="mx-auto mb-1 text-blue-500" />
              <p className="font-medium text-xs text-gray-700">Saldo</p>
              <p className="text-xs text-gray-400">Na carteira</p>
            </div>
            {/* Pontos */}
            <div onClick={() => setRecompensa('pontos')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center ${
                recompensa === 'pontos' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50 border-gray-200'
              }`}>
              <StarIcon size={18} className="mx-auto mb-1 text-yellow-500" />
              <p className="font-medium text-xs text-gray-700">Pontos</p>
              <p className="text-xs text-gray-400">Nível e prémios</p>
            </div>
          </div>
        </div>

        {/* ── Passo 6: Upload de foto ── */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Foto do Resíduo (opcional)
          </label>
          {imagemPreview ? (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-green-200">
              <img src={imagemPreview} alt="Preview" className="w-full h-full object-cover" />
              <button onClick={removerImagem}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div onClick={() => inputFicheiroRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-green-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition">
              <ImagePlus size={28} className="text-green-300 mb-2" />
              <p className="text-gray-400 text-xs">Clica para adicionar uma foto</p>
              <p className="text-gray-300 text-xs mt-0.5">PNG, JPG ou WEBP · Máx. 5MB</p>
            </div>
          )}
          <input ref={inputFicheiroRef} type="file" accept="image/*" onChange={handleImagem} className="hidden" />
          {erroImagem && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {erroImagem}
            </p>
          )}
        </div>

        {/* ── Passo 7: Observações ── */}
        <div className="mb-5">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Observações (opcional)
          </label>
          <textarea placeholder="Estado do resíduo, limpeza, embalagem..."
            value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
            rows={3} />
        </div>

        {/* Erro geral */}
        {erro && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
            <AlertCircle size={14} /> {erro}
          </p>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <button onClick={() => navigate('/Dashboard')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition flex-1 text-sm font-medium">
            Cancelar
          </button>
          <button onClick={handlePublicar} disabled={carregando}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-3 rounded-xl transition flex-1 text-sm font-medium">
            {carregando
              ? 'A guardar...'
              : modoEdicao
                ? 'Guardar Alterações'
                : modoEmpresa
                  ? 'Enviar Oferta'    // texto diferente quando é oferta directa
                  : 'Publicar Resíduo'
            }
          </button>
        </div>

      </div>
    </div>
  );
}