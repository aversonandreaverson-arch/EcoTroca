// ============================================================
//  NovoResiduo.jsx — Formulário para publicar um novo resíduo
//  Guardar em: src/Components/UserProfile/NovoResiduo.jsx
//
//  Aqui sigo as regras de negócio do EcoTroca:
//  Regra 5  → Só utilizadores comuns podem publicar resíduos
//  Regra 6  → O peso informado é aproximado — o real é pesado pelo coletador
//  Regra 7  → A publicação expira em 7 dias sem interesse
//  Regra 8  → O utilizador escolhe uma única forma de recompensa
//  Regra 13 → Declaração incorreta de peso resulta em penalização
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { criarEntrega, getResiduos } from "../../api.js";
import Header from "./Header";

// Aqui defino o peso mínimo — sem restrição, o coletador pesa o real
const PESO_MINIMO = 0.1; // kg — só para evitar zeros

export default function NovoResiduo() {
  const navigate = useNavigate();

  // Aqui guardo os tipos de resíduos vindos da base de dados
  const [residuosDisponiveis, setResiduosDisponiveis] = useState([]);

  // Dados do formulário
  const [idResiduo,   setIdResiduo]   = useState('');
  const [pesoAprox,   setPesoAprox]   = useState('');
  const [recompensa,  setRecompensa]  = useState('dinheiro');
  const [tipoEntrega, setTipoEntrega] = useState('domicilio');
  const [endereco,    setEndereco]    = useState('');
  const [referencia,  setReferencia]  = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Aqui guardo o estado de carregamento e erro
  const [erro,       setErro]       = useState('');
  const [carregando, setCarregando] = useState(false);

  // Quando a página abre, vou buscar os tipos de resíduos ao servidor
  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await getResiduos();
        setResiduosDisponiveis(dados);
      } catch (err) {
        console.error('Erro ao carregar resíduos:', err);
      }
    };
    carregar();
  }, []);

  // Aqui vou buscar o resíduo seleccionado para calcular a estimativa
  const residuoSelecionado = residuosDisponiveis.find(
    r => r.id_residuo == idResiduo
  );

  // Aqui calculo a estimativa de valor com base no peso aproximado
  // É só uma estimativa — o valor real é calculado após a pesagem pelo coletador
  const valorEstimado = residuoSelecionado && pesoAprox && parseFloat(pesoAprox) > 0
    ? (parseFloat(residuoSelecionado.valor_por_kg) * parseFloat(pesoAprox)).toFixed(2)
    : null;

  const handlePublicar = async () => {
    // Aqui valido os campos obrigatórios antes de enviar
    if (!idResiduo) {
      setErro('Selecciona o tipo de resíduo.');
      return;
    }
    if (!pesoAprox || parseFloat(pesoAprox) <= 0) {
      setErro('Indica um peso aproximado.');
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
      // O backend cria a Entrega e insere o resíduo na Entrega_Residuo
      await criarEntrega({
        tipo_entrega:        tipoEntrega,
        endereco_domicilio:  endereco.trim(),
        id_ponto:            null,
        tipo_recompensa:     recompensa,
        observacoes:         observacoes || null,
        // Envio o resíduo dentro de um array como o backend espera
        residuos: [{
          id_residuo: parseInt(idResiduo),
          // Aqui envio o peso aproximado — o coletador vai pesar o real
          peso_kg:    parseFloat(pesoAprox),
          quantidade: 1,
        }],
      });

      // Depois de publicar, volto ao Dashboard para ver a entrega criada
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

        <h2 className="text-2xl font-bold mb-2 text-green-700">
          Publicar Resíduo
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          A publicação expira em 7 dias se não houver interesse.
        </p>

        {/* ── Tipo de resíduo ── */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Tipo de Resíduo <span className="text-red-500">*</span>
          </label>
          <select
            value={idResiduo}
            onChange={(e) => setIdResiduo(e.target.value)}
            className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="">Seleccionar tipo...</option>
            {/* Aqui mostro os resíduos reais da base de dados com o preço por kg */}
            {residuosDisponiveis.map(r => (
              <option key={r.id_residuo} value={r.id_residuo}>
                {r.tipo} — {r.valor_por_kg} Kz/kg
              </option>
            ))}
          </select>
        </div>

        {/* ── Peso aproximado ── */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Peso Aproximado (kg) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            placeholder="Ex: 2.5"
            min="0.1"
            step="0.1"
            value={pesoAprox}
            onChange={(e) => setPesoAprox(e.target.value)}
            className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          {/* Aviso sobre a Regra 13 — peso incorreto resulta em penalização */}
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Atenção: Declarar um peso muito diferente do real pode resultar em penalização. (Regra 13)
          </p>
        </div>

        {/* ── Estimativa de valor — aparece quando há resíduo e peso preenchidos ── */}
        {valorEstimado && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 font-semibold text-sm">
              💰 Estimativa de recompensa: <span className="text-lg font-bold">{valorEstimado} Kz</span>
            </p>
            <p className="text-green-600 text-xs mt-1">
              Valor estimado com base em {pesoAprox} kg de {residuoSelecionado?.tipo} a {residuoSelecionado?.valor_por_kg} Kz/kg.
              O valor final é calculado após a pesagem real pelo coletador.
            </p>
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

        {/* ── Tipo de recompensa — Regra 8 ── */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Forma de Recompensa (Regra 8)
          </label>
          <div className="space-y-2">

            <div
              onClick={() => setRecompensa('dinheiro')}
              className={`border rounded-xl p-3 cursor-pointer transition ${
                recompensa === 'dinheiro'
                  ? 'border-green-500 bg-green-50'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <p className="font-medium text-sm text-gray-700">💰 Dinheiro</p>
              <p className="text-xs text-gray-400">Recebo dinheiro após a pesagem e confirmação</p>
            </div>

            <div
              onClick={() => setRecompensa('saldo')}
              className={`border rounded-xl p-3 cursor-pointer transition ${
                recompensa === 'saldo'
                  ? 'border-green-500 bg-green-50'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <p className="font-medium text-sm text-gray-700">💳 Saldo no sistema</p>
              <p className="text-xs text-gray-400">Recebo saldo na minha carteira EcoTroca</p>
            </div>
          </div>
        </div>

        {/* ── Observações ── */}
        <div className="mb-5">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Observações (opcional)
          </label>
          <textarea
            placeholder="Estado do resíduo, limpeza, embalagem, condições especiais..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
            rows={3}
          />
        </div>

        {/* Mensagem de erro */}
        {erro && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            {erro}
          </p>
        )}

        {/* Botões de acção */}
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