
//  FLUXO:
//    1. Entrega chega com status 'pendente'
//    2. Empresa pode:
//       a) ACEITAR → abre modal para registar peso real
//          → sistema calcula pagamentos e credita nas carteiras
//       b) REJEITAR → abre modal com motivo + opções de correcção

import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Package, User, MapPin,
  Clock, Scale, AlertCircle, X, Leaf
} from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import {
  getEntregasEmpresa,
  aceitarEntregaEmpresa,
  rejeitarEntregaEmpresa
} from '../../api.js';

export default function EntregasEmpresa() {

  // ── Estados da lista de entregas ──────────────────────────
  const [entregas,    setEntregas]    = useState([]);  // todas as entregas da empresa
  const [filtro,      setFiltro]      = useState('pendente'); // filtro activo
  const [carregando,  setCarregando]  = useState(true); // loading inicial
  const [erro,        setErro]        = useState('');   // erro global

  // ── Estados do modal de ACEITAR ───────────────────────────
  const [modalAceitar,  setModalAceitar]  = useState(null);  // id da entrega a aceitar (null = fechado)
  const [pesoReal,      setPesoReal]      = useState('');    // peso real em kg registado pela empresa
  const [erroAceitar,   setErroAceitar]   = useState('');    // erro dentro do modal aceitar

  // ── Estados do modal de REJEITAR ─────────────────────────
  const [modalRejeitar, setModalRejeitar] = useState(null);  // id da entrega a rejeitar (null = fechado)
  const [motivo,        setMotivo]        = useState('');    // motivo obrigatório da rejeição
  const [pedeFoto,      setPedeFoto]      = useState(false); // pede fotos ao utilizador
  const [pedeLimpeza,   setPedeLimpeza]   = useState(false); // pede limpeza antes da recolha

  // ── Estado de acção em curso ──────────────────────────────
  const [acaoEmCurso, setAcaoEmCurso] = useState(null); // id da entrega a ser processada (loading)

  // ── Carrega as entregas ao montar o componente ────────────
  useEffect(() => { carregar(); }, []);

  // Vai buscar todas as entregas desta empresa via GET /api/empresas/minhas/entregas
  const carregar = async () => {
    try {
      setErro('');
      const dados = await getEntregasEmpresa();
      setEntregas(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // ── Filtra entregas consoante o filtro activo 
  const entregasFiltradas = filtro === 'todos'
    ? entregas
    : entregas.filter(e => e.status === filtro);

  // ── Calcula a estimativa de pagamento em tempo real 
  // Usado no modal de aceitar para mostrar preview antes de confirmar
  const calcularEstimativa = (peso, valorKg) => {
    const p   = parseFloat(peso);      // peso real em kg
    const vkg = parseFloat(valorKg);   // valor por kg do resíduo
    if (!p || !vkg || p <= 0 || vkg <= 0) return null;

    const valorTotal      = p * vkg;                    // valor bruto total
    const valorUtilizador = (valorTotal * 0.70) - 50;  // utilizador recebe 70% - 50 Kz taxa
    const valorColetador  = valorTotal * 0.30;          // coletador recebe 30%
    const comissao        = (valorTotal * 0.10) + 50;  // EcoTroca fica 10% + 50 Kz

    return {
      valorTotal:      valorTotal.toFixed(0),
      valorUtilizador: Math.max(0, valorUtilizador).toFixed(0), // nunca negativo
      valorColetador:  valorColetador.toFixed(0),
      comissao:        comissao.toFixed(0),
    };
  };

  // ── Encontra a entrega actual no modal de aceitar 
  const entregaAceitar = entregas.find(e => e.id_entrega === modalAceitar);

  // Calcula estimativa em tempo real baseada no peso inserido
  const estimativa = entregaAceitar
    ? calcularEstimativa(pesoReal, entregaAceitar.valor_por_kg || entregaAceitar.preco_min)
    : null;

  // ── Abre o modal de aceitar para uma entrega específica ───
  const abrirModalAceitar = (idEntrega) => {
    setModalAceitar(idEntrega); // guarda o id da entrega
    setPesoReal('');            // limpa peso anterior
    setErroAceitar('');         // limpa erros
  };

  // ── Confirma aceitação com o peso real 
  // Chama POST /api/empresas/minhas/entregas/:id/aceitar com o peso
  const handleAceitar = async () => {
    // Valida que o peso foi introduzido e é positivo
    if (!pesoReal || parseFloat(pesoReal) <= 0) {
      setErroAceitar('Introduz o peso real dos resíduos em kg.'); return;
    }

    try {
      setAcaoEmCurso(modalAceitar); // activa loading no botão
      setErroAceitar('');

      // Envia o peso real para o backend processar os pagamentos
      await aceitarEntregaEmpresa(modalAceitar, parseFloat(pesoReal));

      setModalAceitar(null); // fecha o modal
      setPesoReal('');       // limpa o peso
      await carregar();      // recarrega a lista
    } catch (err) {
      setErroAceitar(err.message); // mostra erro dentro do modal
    } finally {
      setAcaoEmCurso(null); // desactiva loading
    }
  };

  // ── Confirma rejeição com motivo 
  // Chama POST /api/empresas/minhas/entregas/:id/rejeitar
  const handleRejeitar = async () => {
    // Motivo é obrigatório para que o utilizador saiba o que corrigir
    if (!motivo.trim()) { setErro('O motivo da rejeição é obrigatório.'); return; }

    try {
      setAcaoEmCurso(modalRejeitar);
      // Envia motivo e opções de correcção para o backend
      await rejeitarEntregaEmpresa(modalRejeitar, motivo, pedeFoto, pedeLimpeza);

      // Fecha e reseta o modal
      setModalRejeitar(null);
      setMotivo('');
      setPedeFoto(false);
      setPedeLimpeza(false);
      await carregar(); // recarrega a lista
    } catch (err) {
      setErro(err.message);
    } finally {
      setAcaoEmCurso(null);
    }
  };

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12 px-6">
      <HeaderEmpresa />

      {/* ── Cabeçalho ── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-800">Gestão de Entregas</h1>
        <p className="text-gray-500 mt-1">Aceita ou rejeita os resíduos recebidos dos utilizadores.</p>
      </div>

      {/* ── Erro global ── */}
      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle size={16} /> {erro}
        </div>
      )}

      {/* ── Filtros de status ── */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[
          { val: 'pendente',  label: 'Pendentes'  },
          { val: 'aceita',    label: 'Aceites'    },
          { val: 'cancelada', label: 'Rejeitadas' },
          { val: 'todos',     label: 'Todos'      },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setFiltro(val)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filtro === val
                ? 'bg-green-600 text-white shadow'
                : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Lista de entregas ── */}
      {carregando ? (
        <p className="text-green-700 text-center py-12">A carregar entregas...</p>
      ) : entregasFiltradas.length === 0 ? (
        <div className="bg-white border border-green-100 rounded-2xl p-8 text-center shadow-sm">
          <Package size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">Nenhuma entrega encontrada.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {entregasFiltradas.map(e => (
            <div key={e.id_entrega} className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">

              {/* Topo: tipo de resíduo + badge de status */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-green-700 text-lg">{e.tipos_residuos || 'Resíduo'}</p>
                  <p className="text-xs text-gray-400">Entrega #{e.id_entrega}</p>
                </div>
                {/* Badge de status com cor diferente por estado */}
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  e.status === 'pendente'  ? 'bg-yellow-100 text-yellow-700' :
                  e.status === 'aceita'    ? 'bg-green-100 text-green-700'   :
                  e.status === 'coletada'  ? 'bg-blue-100 text-blue-700'     :
                                             'bg-red-100 text-red-700'
                }`}>
                  {e.status === 'pendente'  ? 'Pendente'  :
                   e.status === 'aceita'    ? 'Aceite'    :
                   e.status === 'coletada'  ? 'Recolhida' : 'Rejeitada'}
                </span>
              </div>

              {/* Detalhes da entrega */}
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {/* Nome e telefone do utilizador */}
                <div className="flex items-center gap-2">
                  <User size={14} className="text-green-500 shrink-0" />
                  <span>{e.nome_usuario}</span>
                  {e.telefone_usuario && <span className="text-gray-400">· {e.telefone_usuario}</span>}
                </div>
                {/* Morada ou ponto de recolha */}
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-green-500 shrink-0" />
                  <span>{e.endereco_domicilio || 'Ponto de recolha'}</span>
                </div>
                {/* Peso estimado e valor */}
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-green-500 shrink-0" />
                  <span>{e.peso_total ? `${e.peso_total} kg` : 'Peso a registar'}</span>
                  {/* Valor total só aparece após aceitação com peso registado */}
                  {e.valor_total && (
                    <span className="font-medium text-green-600 ml-2">
                      · {parseFloat(e.valor_total).toFixed(0)} Kz
                    </span>
                  )}
                </div>
                {/* Data e hora da entrega */}
                {e.data_hora && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-green-500 shrink-0" />
                    <span className="text-xs text-gray-400">
                      {new Date(e.data_hora).toLocaleDateString('pt-AO', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {/* Observações do utilizador */}
                {e.observacoes && (
                  <p className="text-xs italic text-gray-500 bg-gray-50 p-2 rounded-lg">"{e.observacoes}"</p>
                )}
                {/* Valor pago ao utilizador — só após aceitação */}
                {e.valor_utilizador && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mt-2">
                    <p className="text-green-700 text-xs font-medium">Pagamento processado</p>
                    <p className="text-green-800 text-sm font-bold">{parseFloat(e.valor_utilizador).toFixed(0)} Kz → utilizador</p>
                    {e.valor_coletador && parseFloat(e.valor_coletador) > 0 && (
                      <p className="text-green-600 text-xs">{parseFloat(e.valor_coletador).toFixed(0)} Kz → coletador</p>
                    )}
                  </div>
                )}
              </div>

              {/* Botões — só aparecem para entregas pendentes */}
              {e.status === 'pendente' && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Aceitar — abre modal para registar peso real */}
                  <button
                    onClick={() => abrirModalAceitar(e.id_entrega)}
                    disabled={acaoEmCurso === e.id_entrega}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
                    <CheckCircle size={14} /> Aceitar
                  </button>
                  {/* Rejeitar — abre modal com motivo */}
                  <button
                    onClick={() => setModalRejeitar(e.id_entrega)}
                    disabled={acaoEmCurso === e.id_entrega}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
                    <XCircle size={14} /> Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL ACEITAR
          Empresa regista o peso real dos resíduos.
          O sistema calcula e mostra o pagamento antes de confirmar.
      ════════════════════════════════════════════════════ */}
      {modalAceitar && entregaAceitar && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">

            {/* Cabeçalho do modal */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <Scale size={20} /> Registar Peso Real
              </h3>
              <button onClick={() => setModalAceitar(null)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Resumo da entrega */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              <p className="text-green-800 font-medium text-sm">{entregaAceitar.tipos_residuos || 'Resíduo'}</p>
              <p className="text-green-600 text-xs mt-0.5">Entrega #{entregaAceitar.id_entrega} · {entregaAceitar.nome_usuario}</p>
            </div>

            {/* Campo de peso real */}
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold block mb-1">
                Peso real dos resíduos <span className="text-red-500">*</span>
              </label>
              <p className="text-gray-400 text-xs mb-2">
                Pesa os resíduos e introduz o valor exacto. Este peso é usado para calcular o pagamento ao utilizador.
              </p>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={pesoReal}
                  onChange={e => setPesoReal(e.target.value)}
                  placeholder="Ex: 12.5"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <span className="absolute right-4 top-3 text-gray-400 text-sm">kg</span>
              </div>
            </div>

            {/* Preview do pagamento em tempo real */}
            {estimativa && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-2">
                <p className="text-gray-700 text-xs font-semibold flex items-center gap-1">
                  <Leaf size={12} className="text-green-600" /> Resumo do pagamento
                </p>
                {/* Valor total bruto */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Valor total ({pesoReal} kg)</span>
                  <span className="font-medium text-gray-700">{estimativa.valorTotal} Kz</span>
                </div>
                {/* O que o utilizador recebe */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Utilizador recebe (70% - 50 Kz)</span>
                  <span className="font-bold text-green-700">{estimativa.valorUtilizador} Kz</span>
                </div>
                {/* Comissão do coletador — só se houver coletador */}
                {entregaAceitar.id_coletador && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Coletador recebe (30%)</span>
                    <span className="font-medium text-blue-600">{estimativa.valorColetador} Kz</span>
                  </div>
                )}
                {/* Comissão da EcoTroca */}
                <div className="flex justify-between text-xs border-t border-gray-200 pt-2">
                  <span className="text-gray-400">Comissão EcoTroca (10% + 50 Kz)</span>
                  <span className="text-gray-500">{estimativa.comissao} Kz</span>
                </div>
              </div>
            )}

            {/* Erro dentro do modal */}
            {erroAceitar && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertCircle size={14} /> {erroAceitar}
              </p>
            )}

            {/* Botões de acção */}
            <div className="flex gap-3">
              <button
                onClick={() => setModalAceitar(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-sm">
                Cancelar
              </button>
              <button
                onClick={handleAceitar}
                disabled={acaoEmCurso === modalAceitar}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                <CheckCircle size={16} />
                {acaoEmCurso === modalAceitar ? 'A processar...' : 'Confirmar e Pagar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL REJEITAR
          Empresa indica motivo da rejeição.
          Pode pedir fotos ou limpeza antes de nova tentativa.
      ════════════════════════════════════════════════════ */}
      {modalRejeitar && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-xl p-6 w-full max-w-md">

            <h3 className="text-xl font-bold text-red-600 mb-4">
              Rejeitar Entrega #{modalRejeitar}
            </h3>

            {/* Motivo obrigatório */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo da rejeição <span className="text-red-500">*</span>
              </label>
              <p className="text-gray-400 text-xs mb-2">
                O utilizador vai receber esta mensagem para saber o que corrigir.
              </p>
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ex: Resíduos misturados com lixo orgânico, plástico sujo..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            {/* Opções de correcção */}
            <div className="space-y-2 mb-6">
              <p className="text-gray-600 text-xs font-medium mb-1">O que pedes ao utilizador antes de tentar novamente:</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pedeFoto}
                  onChange={e => setPedeFoto(e.target.checked)}
                  className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-gray-700">Pedir fotos dos resíduos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pedeLimpeza}
                  onChange={e => setPedeLimpeza(e.target.checked)}
                  className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-gray-700">Pedir limpeza ou organização antes da recolha</span>
              </label>
            </div>

            {/* Botões de acção */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setModalRejeitar(null);
                  setMotivo('');
                  setPedeFoto(false);
                  setPedeLimpeza(false);
                  setErro('');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-medium transition">
                Cancelar
              </button>
              <button
                onClick={handleRejeitar}
                disabled={acaoEmCurso === modalRejeitar}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2 rounded-xl font-medium transition">
                {acaoEmCurso === modalRejeitar ? 'A rejeitar...' : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}