// ============================================================
//  NovoResiduo.jsx — Formulário para publicar um novo resíduo
//  Guardar em: src/Components/UserProfile/NovoResiduo.jsx
//
//  Aqui sigo o fluxo definido:
//  1. Utilizador selecciona o tipo de resíduo
//  2. Selecciona a qualidade — o sistema mostra o intervalo de preço
//  3. Indica o peso aproximado
//  4. O sistema mostra a estimativa de valor
//  5. Escolhe a forma de recompensa (dinheiro ou saldo)
//  6. Indica o endereço e publica
//
//  Regra 6  → O peso informado é aproximado — o real é pesado pelo coletador
//  Regra 7  → A publicação expira em 7 dias sem interesse
//  Regra 13 → Declaração incorreta de peso resulta em penalização
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { criarEntrega, getResiduos } from "../../api.js";
import Header from "./Header";

export default function NovoResiduo() {
  const navigate = useNavigate();

  // Aqui guardo todos os resíduos vindos da base de dados
  const [todosResiduos, setTodosResiduos] = useState([]);

  // Aqui guardo os tipos únicos para o primeiro select (Plástico, Papel, Metal, Vidro)
  const [tiposUnicos, setTiposUnicos] = useState([]);

  // Aqui guardo as qualidades disponíveis para o tipo seleccionado
  const [qualidadesDisponiveis, setQualidadesDisponiveis] = useState([]);

  // Dados do formulário
  const [tipoSelecionado,      setTipoSelecionado]      = useState('');
  const [idResiduo,            setIdResiduo]            = useState('');

  const [recompensa,           setRecompensa]           = useState('dinheiro');
  const [tipoEntrega,          setTipoEntrega]          = useState('domicilio');
  const [endereco,             setEndereco]             = useState('');
  const [referencia,           setReferencia]           = useState('');
  const [observacoes,          setObservacoes]          = useState('');

  // Estado de carregamento e erro
  const [erro,       setErro]       = useState('');
  const [carregando, setCarregando] = useState(false);

  // Quando a página abre, vou buscar todos os resíduos ao servidor
  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await getResiduos();
        setTodosResiduos(dados);

        // Aqui extraio os tipos únicos para o primeiro select
        const tipos = [...new Set(dados.map(r => r.tipo))];
        setTiposUnicos(tipos);
      } catch (err) {
        console.error('Erro ao carregar resíduos:', err);
      }
    };
    carregar();
  }, []);

  // Quando o utilizador muda o tipo, actualizo as qualidades disponíveis
  const handleTipo = (tipo) => {
    setTipoSelecionado(tipo);
    setIdResiduo(''); // limpo a qualidade seleccionada
    // Aqui filtro os resíduos do tipo seleccionado para mostrar as qualidades
    const qualidades = todosResiduos.filter(r => r.tipo === tipo);
    setQualidadesDisponiveis(qualidades);
  };



  // Aqui devolvo o label de qualidade em português
  const labelQualidade = (q) => {
    const mapa = {
      ruim:      '😕 Ruim',
      moderada:  '🙂 Moderada',
      boa:       '😊 Boa',
      excelente: '🌟 Excelente',
    };
    return mapa[q] || q;
  };

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

      // Envio os dados no formato que o backend espera
      await criarEntrega({
        tipo_entrega:       tipoEntrega,
        endereco_domicilio: endereco.trim(),
        id_ponto:           null,
        tipo_recompensa:    recompensa,
        observacoes:        observacoes || null,
        residuos: [{
          id_residuo: parseInt(idResiduo),
          peso_kg:    0, // o coletador pesa o real na confirmação
          quantidade: 1,
        }],
      });

      navigate('/Dashboard');

    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-700 pt-24 p-6">
      <Header />

      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-6">

        <h2 className="text-2xl font-bold mb-1 text-green-700">Publicar Resíduo</h2>
        <p className="text-gray-400 text-xs mb-6">
          A publicação expira em 7 dias se não houver interesse.
        </p>

        {/* ── Passo 1 — Tipo de resíduo ── */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Tipo de Resíduo <span className="text-red-500">*</span>
          </label>
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
                {tipo === 'Plastico' ? '🧴 Plástico' :
                 tipo === 'Papel'    ? '📦 Papel'    :
                 tipo === 'Metal'    ? '🔩 Metal'    :
                 tipo === 'Vidro'    ? '🍶 Vidro'    : tipo}
              </div>
            ))}
          </div>
        </div>

        {/* ── Passo 2 — Qualidade — aparece após seleccionar o tipo ── */}
        {tipoSelecionado && qualidadesDisponiveis.length > 0 && (
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Qualidade <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {qualidadesDisponiveis.map(r => (
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
                    <span className="text-sm font-medium text-gray-700">
                      {labelQualidade(r.qualidade)}
                    </span>
                    {/* Aqui mostro o intervalo de preço por kg */}
                    {r.preco_min && r.preco_max && (
                      <span className="text-xs text-green-600 font-medium">
                        {r.preco_min} – {r.preco_max} Kz/kg
                      </span>
                    )}
                  </div>
                  {r.descricao && (
                    <p className="text-xs text-gray-400 mt-0.5">{r.descricao}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tipo de entrega ── */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Como preferes entregar?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div
              onClick={() => setTipoEntrega('domicilio')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center text-sm ${
                tipoEntrega === 'domicilio'
                  ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                  : 'hover:bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              🏠 Em casa
              <p className="text-xs text-gray-400 mt-1">O coletador vem até mim</p>
            </div>
            <div
              onClick={() => setTipoEntrega('ponto_recolha')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center text-sm ${
                tipoEntrega === 'ponto_recolha'
                  ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                  : 'hover:bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              📍 Ponto de recolha
              <p className="text-xs text-gray-400 mt-1">Levo eu ao ponto</p>
            </div>
          </div>
        </div>

        {/* ── Endereço ── */}
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

        {/* ── Referência ── */}
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

        {/* ── Forma de recompensa ── */}
        <div className="mb-5">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Forma de Recompensa
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div
              onClick={() => setRecompensa('dinheiro')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center ${
                recompensa === 'dinheiro'
                  ? 'border-green-500 bg-green-50'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <p className="font-medium text-sm text-gray-700">💰 Dinheiro</p>
              <p className="text-xs text-gray-400">Recebo em dinheiro</p>
            </div>
            <div
              onClick={() => setRecompensa('saldo')}
              className={`border rounded-xl p-3 cursor-pointer transition text-center ${
                recompensa === 'saldo'
                  ? 'border-green-500 bg-green-50'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <p className="font-medium text-sm text-gray-700">💳 Saldo</p>
              <p className="text-xs text-gray-400">Recebo na carteira EcoTroca</p>
            </div>
          </div>
        </div>

        {/* ── Observações ── */}
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

        {/* Erro */}
        {erro && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            {erro}
          </p>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/Dashboard')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl transition flex-1 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handlePublicar}
            disabled={carregando}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl transition flex-1 text-sm font-medium"
          >
            {carregando ? 'A publicar...' : 'Publicar Resíduo'}
          </button>
        </div>

      </div>
    </div>
  );
}