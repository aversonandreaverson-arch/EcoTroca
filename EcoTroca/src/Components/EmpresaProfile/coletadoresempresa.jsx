import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Phone, X } from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import {
  getColetadoresEmpresa,
  adicionarColetadorEmpresa,
  removerColetadorEmpresa
} from '../../api.js';

export default function ColetadoresEmpresa() {

  const [coletadores, setColetadores] = useState([]);
  const [carregando,  setCarregando]  = useState(true);
  const [erro,        setErro]        = useState('');
  const [sucesso,     setSucesso]     = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [idColetador,  setIdColetador]  = useState('');
  const [adicionando,  setAdicionando]  = useState(false);
  const [removendo,    setRemovendo]    = useState(null);

  const carregar = async () => {
    try {
      setErro('');
      const dados = await getColetadoresEmpresa();
      setColetadores(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleAdicionar = async () => {
    setErro('');
    if (!idColetador || isNaN(idColetador))
      return setErro('Introduz um ID de coletador válido.');
    try {
      setAdicionando(true);
      await adicionarColetadorEmpresa(parseInt(idColetador));
      setSucesso('Coletador adicionado com sucesso!');
      setMostrarModal(false);
      setIdColetador('');
      await carregar();
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setAdicionando(false);
    }
  };

  const handleRemover = async (idColetadorRemover) => {
    if (!window.confirm('Tens a certeza que queres remover este coletador da empresa?')) return;
    try {
      setRemovendo(idColetadorRemover);
      await removerColetadorEmpresa(idColetadorRemover);
      setSucesso('Coletador removido. Voltou a ser coletador independente.');
      await carregar();
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <HeaderEmpresa />

      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-800">Coletadores da Empresa</h1>
          <p className="text-gray-500 mt-1">Gere os coletadores que trabalham para a tua empresa.</p>
        </div>
        <button
          onClick={() => { setMostrarModal(true); setErro(''); }}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition"
        >
          <Plus size={18} /> Adicionar Coletador
        </button>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-4">{erro}</div>
      )}
      {sucesso && (
        <div className="bg-green-100 border border-green-300 text-green-700 rounded-xl p-4 mb-4">✅ {sucesso}</div>
      )}

      <div className="bg-white border border-green-100 rounded-2xl p-4 mb-6 text-sm shadow-sm">
        <p className="font-medium text-green-800 mb-1">ℹ️ O que são coletadores dependentes?</p>
        <p className="text-gray-500">
          São coletadores que trabalham exclusivamente para a tua empresa.
          Só veem e aceitam pedidos destinados à tua empresa.
          Para adicionar um coletador, precisas do ID de registo dele na plataforma.
        </p>
      </div>

      {carregando ? (
        <p className="text-green-700 text-center">A carregar coletadores...</p>
      ) : coletadores.length === 0 ? (
        <div className="bg-white border border-green-100 rounded-2xl p-10 text-center shadow-sm">
          <Truck size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-600">Nenhum coletador dependente ainda.</p>
          <p className="text-sm text-gray-400 mt-1">Clica em "Adicionar Coletador" para ligar um coletador à empresa.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coletadores.map(c => (
            <div key={c.id_coletador} className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Truck size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{c.nome}</p>
                    <p className="text-xs text-gray-400">ID #{c.id_coletador}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  c.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {c.ativo ? '🟢 Ativo' : '🔴 Inativo'}
                </span>
              </div>

              <div className="space-y-1 text-sm text-gray-600 mb-4">
                {c.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-green-500" />
                    <span>{c.telefone}</span>
                  </div>
                )}
                {c.email && <p className="text-xs text-gray-400 pl-5">{c.email}</p>}
              </div>

              <button
                onClick={() => handleRemover(c.id_coletador)}
                disabled={removendo === c.id_coletador}
                className="w-full bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1"
              >
                <Trash2 size={14} />
                {removendo === c.id_coletador ? 'A remover...' : 'Remover da Empresa'}
              </button>
            </div>
          ))}
        </div>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-green-700">Adicionar Coletador</h3>
              <button onClick={() => { setMostrarModal(false); setErro(''); }}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Introduz o ID do coletador que queres adicionar à empresa.
              O coletador deve estar já registado na plataforma EcoTroca.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID do Coletador <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={idColetador}
                onChange={e => setIdColetador(e.target.value)}
                placeholder="Ex: 12"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            {erro && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mt-3">{erro}</p>
            )}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => { setMostrarModal(false); setErro(''); setIdColetador(''); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdicionar}
                disabled={adicionando}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition"
              >
                {adicionando ? 'A adicionar...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}