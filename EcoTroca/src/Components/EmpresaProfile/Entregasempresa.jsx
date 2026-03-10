import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Package, User, MapPin, Clock } from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import { getEntregasEmpresa, aceitarEntregaEmpresa, rejeitarEntregaEmpresa } from '../../api.js';

export default function EntregasEmpresa() {

  const [entregas,    setEntregas]    = useState([]);
  const [filtro,      setFiltro]      = useState('pendente');
  const [carregando,  setCarregando]  = useState(true);
  const [erro,        setErro]        = useState('');
  const [modalRejeitar, setModalRejeitar] = useState(null);
  const [motivo,      setMotivo]      = useState('');
  const [pedeFoto,    setPedeFoto]    = useState(false);
  const [pedeLimpeza, setPedeLimpeza] = useState(false);
  const [acaoEmCurso, setAcaoEmCurso] = useState(null);

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

  useEffect(() => { carregar(); }, []);

  const entregasFiltradas = filtro === 'todos'
    ? entregas
    : entregas.filter(e => e.status === filtro);

  const handleAceitar = async (id) => {
    try {
      setAcaoEmCurso(id);
      await aceitarEntregaEmpresa(id);
      await carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setAcaoEmCurso(null);
    }
  };

  const handleRejeitar = async () => {
    if (!motivo.trim()) { setErro('O motivo da rejeição é obrigatório.'); return; }
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

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <HeaderEmpresa />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-800">Gestão de Entregas</h1>
        <p className="text-gray-500 mt-1">Aceita ou rejeita os resíduos recebidos.</p>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6">{erro}</div>
      )}

      <div className="flex gap-2 flex-wrap mb-6">
        {[
          { val: 'pendente',  label: 'Pendentes'  },
          { val: 'coletada',  label: 'Aceites'    },
          { val: 'cancelada', label: 'Rejeitadas' },
          { val: 'todos',     label: 'Todos'      },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setFiltro(val)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filtro === val
                ? 'bg-green-600 text-white shadow'
                : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-green-700 text-center">A carregar entregas...</p>
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
                  <p className="font-bold text-green-700 text-lg">{e.tipos_residuos || 'Resíduo'}</p>
                  <p className="text-xs text-gray-400">Entrega #{e.id_entrega}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  e.status === 'pendente'  ? 'bg-yellow-100 text-yellow-700' :
                  e.status === 'coletada'  ? 'bg-green-100 text-green-700'  :
                                             'bg-red-100 text-red-700'
                }`}>
                  {e.status === 'pendente' ? 'Pendente' : e.status === 'coletada' ? 'Aceite' : 'Rejeitada'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-green-500" />
                  <span>{e.nome_usuario}</span>
                  {e.telefone_usuario && <span className="text-gray-400">· {e.telefone_usuario}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-green-500" />
                  <span>{e.endereco_domicilio || 'Ponto de recolha'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-green-500" />
                  <span>{e.peso_total || '?'} kg</span>
                  {e.valor_total && (
                    <span className="font-medium text-green-600 ml-2">
                      · {parseFloat(e.valor_total).toFixed(2)} Kz
                    </span>
                  )}
                </div>
                {e.data_hora && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-green-500" />
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
              </div>

              {e.status === 'pendente' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAceitar(e.id_entrega)}
                    disabled={acaoEmCurso === e.id_entrega}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={14} />
                    {acaoEmCurso === e.id_entrega ? 'A processar...' : 'Aceitar'}
                  </button>
                  <button
                    onClick={() => setModalRejeitar(e.id_entrega)}
                    disabled={acaoEmCurso === e.id_entrega}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1"
                  >
                    <XCircle size={14} /> Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalRejeitar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-red-600 mb-4">Rejeitar Entrega #{modalRejeitar}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo da rejeição <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ex: Resíduos misturados com lixo orgânico, plástico sujo..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <div className="space-y-2 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pedeFoto} onChange={e => setPedeFoto(e.target.checked)} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-gray-700">📸 Pedir fotos dos resíduos ao utilizador</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pedeLimpeza} onChange={e => setPedeLimpeza(e.target.checked)} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-gray-700">🧹 Pedir limpeza/organização antes da recolha</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setModalRejeitar(null); setMotivo(''); setPedeFoto(false); setPedeLimpeza(false); setErro(''); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejeitar}
                disabled={acaoEmCurso === modalRejeitar}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2 rounded-xl font-medium transition"
              >
                {acaoEmCurso === modalRejeitar ? 'A rejeitar...' : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}