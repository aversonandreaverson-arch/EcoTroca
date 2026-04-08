import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Package, User, MapPin,
  Clock, Scale, AlertCircle, X, Leaf, CalendarCheck
} from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import {
  getEntregasEmpresa,
  aceitarEntregaEmpresa,
  rejeitarEntregaEmpresa,
  proporDataRecolha
} from '../../api.js';

export default function EntregasEmpresa() {

  const [entregas,    setEntregas]    = useState([]);
  const [filtro,      setFiltro]      = useState('pendente');
  const [carregando,  setCarregando]  = useState(true);
  const [erro,        setErro]        = useState('');

  // Modal aceitar
  const [modalAceitar,  setModalAceitar]  = useState(null);
  const [pesoReal,      setPesoReal]      = useState('');
  const [erroAceitar,   setErroAceitar]   = useState('');

  // Modal rejeitar
  const [modalRejeitar, setModalRejeitar] = useState(null);
  const [motivo,        setMotivo]        = useState('');
  const [pedeFoto,      setPedeFoto]      = useState(false);
  const [pedeLimpeza,   setPedeLimpeza]   = useState(false);

  // Modal propor data
  const [modalData,   setModalData]   = useState(null);
  const [dataRecolha, setDataRecolha] = useState('');
  const [obsEmpresa,  setObsEmpresa]  = useState('');
  const [erroData,    setErroData]    = useState('');
  const [propondo,    setPropondo]    = useState(false);

  const [acaoEmCurso, setAcaoEmCurso] = useState(null);

  useEffect(() => { carregar(); }, []);

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

  const entregasFiltradas = filtro === 'todos'
    ? entregas
    : entregas.filter(e => e.status === filtro);

  const calcularEstimativa = (peso, valorKg) => {
    const p   = parseFloat(peso);
    const vkg = parseFloat(valorKg);
    if (!p || !vkg || p <= 0 || vkg <= 0) return null;
    const valorTotal      = p * vkg;
    const valorUtilizador = (valorTotal * 0.70) - 50;
    const valorColetador  = valorTotal * 0.30;
    const comissao        = (valorTotal * 0.10) + 50;
    return {
      valorTotal:      valorTotal.toFixed(0),
      valorUtilizador: Math.max(0, valorUtilizador).toFixed(0),
      valorColetador:  valorColetador.toFixed(0),
      comissao:        comissao.toFixed(0),
    };
  };

  const entregaAceitar = entregas.find(e => e.id_entrega === modalAceitar);
  const estimativa = entregaAceitar
    ? calcularEstimativa(pesoReal, entregaAceitar.valor_por_kg || entregaAceitar.preco_min)
    : null;

  const abrirModalAceitar = (idEntrega) => {
    setModalAceitar(idEntrega);
    setPesoReal('');
    setErroAceitar('');
  };

  const handleAceitar = async () => {
    if (!pesoReal || parseFloat(pesoReal) <= 0) {
      setErroAceitar('Introduz o peso real dos residuos em kg.'); return;
    }
    try {
      setAcaoEmCurso(modalAceitar);
      setErroAceitar('');
      await aceitarEntregaEmpresa(modalAceitar, parseFloat(pesoReal));
      setModalAceitar(null);
      setPesoReal('');
      await carregar();
    } catch (err) {
      setErroAceitar(err.message);
    } finally {
      setAcaoEmCurso(null);
    }
  };

  const handleRejeitar = async () => {
    if (!motivo.trim()) { setErro('O motivo da rejeicao e obrigatorio.'); return; }
    try {
      setAcaoEmCurso(modalRejeitar);
      await rejeitarEntregaEmpresa(modalRejeitar, motivo, pedeFoto, pedeLimpeza);
      setModalRejeitar(null);
      setMotivo('');
      setPedeFoto(false);
      setPedeLimpeza(false);
      await carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setAcaoEmCurso(null);
    }
  };

  // Empresa propoe data de recolha — utilizador e notificado automaticamente
  const handleProporData = async () => {
    if (!dataRecolha) { setErroData('Selecciona a data e hora da recolha.'); return; }
    if (new Date(dataRecolha) <= new Date()) { setErroData('A data tem de ser no futuro.'); return; }
    try {
      setPropondo(true);
      setErroData('');
      await proporDataRecolha(modalData, { data_recolha: dataRecolha, observacoes: obsEmpresa || null });
      setModalData(null);
      setDataRecolha('');
      setObsEmpresa('');
      await carregar();
    } catch (err) {
      setErroData(err.message);
    } finally {
      setPropondo(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12 px-6">
      <HeaderEmpresa />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-800">Gestao de Entregas</h1>
        <p className="text-gray-500 mt-1">Aceita ou rejeita os residuos recebidos dos utilizadores.</p>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle size={16} /> {erro}
        </div>
      )}

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

              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-green-700 text-lg">{e.tipos_residuos || 'Residuo'}</p>
                  <p className="text-xs text-gray-400">Entrega #{e.id_entrega}</p>
                </div>
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

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-green-500 shrink-0" />
                  <span>{e.nome_usuario}</span>
                  {e.telefone_usuario && <span className="text-gray-400">· {e.telefone_usuario}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-green-500 shrink-0" />
                  <span>{e.endereco_domicilio || 'Ponto de recolha'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-green-500 shrink-0" />
                  <span>{e.peso_total ? `${e.peso_total} kg` : 'Peso a registar'}</span>
                  {e.valor_total && (
                    <span className="font-medium text-green-600 ml-2">
                      · {parseFloat(e.valor_total).toFixed(0)} Kz
                    </span>
                  )}
                </div>
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
                {e.observacoes && (
                  <p className="text-xs italic text-gray-500 bg-gray-50 p-2 rounded-lg">"{e.observacoes}"</p>
                )}
                {e.valor_utilizador && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mt-2">
                    <p className="text-green-700 text-xs font-medium">Pagamento processado</p>
                    <p className="text-green-800 text-sm font-bold">{parseFloat(e.valor_utilizador).toFixed(0)} Kz para utilizador</p>
                    {e.valor_coletador && parseFloat(e.valor_coletador) > 0 && (
                      <p className="text-green-600 text-xs">{parseFloat(e.valor_coletador).toFixed(0)} Kz para coletador</p>
                    )}
                  </div>
                )}
              </div>

              {/* Botao Marcar Data para entregas aceites */}
              {e.status === 'aceita' && (
                <div className="mt-2 mb-3">
                  {e.data_recolha_proposta ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex items-center gap-2">
                      <CalendarCheck size={14} className="text-blue-600 shrink-0" />
                      <div>
                        <p className="text-blue-700 text-xs font-medium">Recolha marcada</p>
                        <p className="text-blue-600 text-xs">
                          {new Date(e.data_recolha_proposta).toLocaleString('pt-AO', {
                            weekday: 'short', day: '2-digit', month: 'short',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => { setModalData(e.id_entrega); setDataRecolha(''); setObsEmpresa(''); setErroData(''); }}
                        className="ml-auto text-blue-500 text-xs underline shrink-0">
                        Alterar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setModalData(e.id_entrega); setDataRecolha(''); setObsEmpresa(''); setErroData(''); }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
                      <CalendarCheck size={14} /> Marcar Data de Recolha
                    </button>
                  )}
                </div>
              )}

              {/* Botoes aceitar/rejeitar para pendentes */}
              {e.status === 'pendente' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => abrirModalAceitar(e.id_entrega)}
                    disabled={acaoEmCurso === e.id_entrega}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
                    <CheckCircle size={14} /> Aceitar
                  </button>
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

      {/* MODAL PROPOR DATA */}
      {modalData && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <CalendarCheck size={20} /> Marcar Data de Recolha
              </h3>
              <button onClick={() => setModalData(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              O utilizador sera notificado automaticamente com a data que marcares.
            </p>
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold block mb-1">
                Data e hora da recolha <span className="text-red-500">*</span>
              </label>
              <input type="datetime-local" value={dataRecolha}
                onChange={e => setDataRecolha(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold block mb-1">
                Nota para o utilizador (opcional)
              </label>
              <textarea value={obsEmpresa} onChange={e => setObsEmpresa(e.target.value)}
                placeholder="Ex: Traz os residuos ensacados. Vem ao portao principal."
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
            </div>
            {erroData && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertCircle size={14} /> {erroData}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setModalData(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-sm">
                Cancelar
              </button>
              <button onClick={handleProporData} disabled={propondo}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                <CalendarCheck size={16} />
                {propondo ? 'A enviar...' : 'Confirmar Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACEITAR */}
      {modalAceitar && entregaAceitar && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <Scale size={20} /> Registar Peso Real
              </h3>
              <button onClick={() => setModalAceitar(null)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              <p className="text-green-800 font-medium text-sm">{entregaAceitar.tipos_residuos || 'Residuo'}</p>
              <p className="text-green-600 text-xs mt-0.5">Entrega #{entregaAceitar.id_entrega} · {entregaAceitar.nome_usuario}</p>
            </div>
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold block mb-1">
                Peso real dos residuos <span className="text-red-500">*</span>
              </label>
              <p className="text-gray-400 text-xs mb-2">
                Pesa os residuos e introduz o valor exacto para calcular o pagamento.
              </p>
              <div className="relative">
                <input type="number" min="0.1" step="0.1" value={pesoReal}
                  onChange={e => setPesoReal(e.target.value)} placeholder="Ex: 12.5"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                <span className="absolute right-4 top-3 text-gray-400 text-sm">kg</span>
              </div>
            </div>
            {estimativa && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-2">
                <p className="text-gray-700 text-xs font-semibold flex items-center gap-1">
                  <Leaf size={12} className="text-green-600" /> Resumo do pagamento
                </p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Valor total ({pesoReal} kg)</span>
                  <span className="font-medium text-gray-700">{estimativa.valorTotal} Kz</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Utilizador recebe (70% - 50 Kz)</span>
                  <span className="font-bold text-green-700">{estimativa.valorUtilizador} Kz</span>
                </div>
                {entregaAceitar.id_coletador && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Coletador recebe (30%)</span>
                    <span className="font-medium text-blue-600">{estimativa.valorColetador} Kz</span>
                  </div>
                )}
                <div className="flex justify-between text-xs border-t border-gray-200 pt-2">
                  <span className="text-gray-400">Comissao EcoTroca (10% + 50 Kz)</span>
                  <span className="text-gray-500">{estimativa.comissao} Kz</span>
                </div>
              </div>
            )}
            {erroAceitar && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertCircle size={14} /> {erroAceitar}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setModalAceitar(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-sm">
                Cancelar
              </button>
              <button onClick={handleAceitar} disabled={acaoEmCurso === modalAceitar}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                <CheckCircle size={16} />
                {acaoEmCurso === modalAceitar ? 'A processar...' : 'Confirmar e Pagar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REJEITAR */}
      {modalRejeitar && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              Rejeitar Entrega #{modalRejeitar}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo da rejeicao <span className="text-red-500">*</span>
              </label>
              <p className="text-gray-400 text-xs mb-2">O utilizador vai receber esta mensagem.</p>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
                placeholder="Ex: Residuos misturados com lixo organico, plastico sujo..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <div className="space-y-2 mb-6">
              <p className="text-gray-600 text-xs font-medium mb-1">O que pedes ao utilizador antes de tentar novamente:</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pedeFoto} onChange={e => setPedeFoto(e.target.checked)} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-gray-700">Pedir fotos dos residuos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pedeLimpeza} onChange={e => setPedeLimpeza(e.target.checked)} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-gray-700">Pedir limpeza ou organizacao antes da recolha</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setModalRejeitar(null); setMotivo(''); setPedeFoto(false); setPedeLimpeza(false); setErro(''); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-medium transition">
                Cancelar
              </button>
              <button onClick={handleRejeitar} disabled={acaoEmCurso === modalRejeitar}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2 rounded-xl font-medium transition">
                {acaoEmCurso === modalRejeitar ? 'A rejeitar...' : 'Confirmar Rejeicao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}