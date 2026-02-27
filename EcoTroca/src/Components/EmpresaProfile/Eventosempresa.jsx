// ============================================================
//  EventosEmpresa.jsx
//  Página de gestão de eventos da empresa
//  Só empresas e admins podem criar eventos
// ============================================================

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, MapPin, Clock, X } from 'lucide-react';
import Header from './Header.jsx';
import { getEventosEmpresa, criarEventoEmpresa } from '../../api.js';

// Cores por tipo de evento
const TIPO_CONFIG = {
  recolha:   { cor: 'bg-green-100 text-green-700',  emoji: '♻️' },
  campanha:  { cor: 'bg-blue-100 text-blue-700',    emoji: '📢' },
  formacao:  { cor: 'bg-purple-100 text-purple-700',emoji: '📚' },
  outro:     { cor: 'bg-gray-100 text-gray-700',    emoji: '📌' },
};

export default function EventosEmpresa() {

  const [eventos, setEventos]     = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]           = useState('');
  const [sucesso, setSucesso]     = useState('');

  // Controla se o formulário de criação está visível
  const [mostrarForm, setMostrarForm] = useState(false);
  const [criando, setCriando]     = useState(false);

  // Estado do formulário de novo evento
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    local: '',
    provincia: '',
    municipio: '',
    tipo: 'recolha',
  });

  // Carrega os eventos da empresa
  const carregar = async () => {
    try {
      const dados = await getEventosEmpresa();
      setEventos(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  // Atualiza um campo do formulário sem perder os outros
  const atualizar = (campo) => (e) =>
    setForm(prev => ({ ...prev, [campo]: e.target.value }));

  // Submete o novo evento ao backend
  const handleCriarEvento = async () => {
    setErro('');

    // Validações básicas
    if (!form.titulo.trim())   return setErro('O título é obrigatório.');
    if (!form.data_inicio)     return setErro('A data de início é obrigatória.');
    if (!form.local.trim())    return setErro('O local é obrigatório.');

    try {
      setCriando(true);
      await criarEventoEmpresa(form);
      setSucesso('Evento criado com sucesso!');
      setMostrarForm(false);

      // Limpa o formulário
      setForm({
        titulo: '', descricao: '', data_inicio: '', data_fim: '',
        local: '', provincia: '', municipio: '', tipo: 'recolha',
      });

      await carregar(); // recarrega a lista
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCriando(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-700 pt-24 p-6">
      <Header />

      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Eventos</h1>
          <p className="text-gray-300 mt-1">
            Cria eventos visíveis para utilizadores e coletadores.
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-white text-green-700 font-semibold px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-green-50 transition"
        >
          <Plus size={18} /> Novo Evento
        </button>
      </div>

      {/* Mensagens de feedback */}
      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-4">{erro}</div>
      )}
      {sucesso && (
        <div className="bg-green-100 border border-green-300 text-green-700 rounded-xl p-4 mb-4">
          ✅ {sucesso}
        </div>
      )}

      {/* Lista de eventos */}
      {carregando ? (
        <p className="text-white text-center">A carregar eventos...</p>
      ) : eventos.length === 0 ? (
        <div className="bg-white/10 rounded-2xl p-10 text-center text-white">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Ainda não criaste nenhum evento.</p>
          <p className="text-sm text-gray-300 mt-1">
            Clica em "Novo Evento" para começar.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventos.map(ev => {
            const config = TIPO_CONFIG[ev.tipo] || TIPO_CONFIG.outro;
            return (
              <div key={ev.id_evento} className="bg-white rounded-2xl shadow-md p-5">

                {/* Tipo e título */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg">{ev.titulo}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ml-2 ${config.cor}`}>
                    {config.emoji} {ev.tipo}
                  </span>
                </div>

                {/* Descrição */}
                {ev.descricao && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{ev.descricao}</p>
                )}

                {/* Detalhes */}
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-green-500" />
                    <span>
                      {new Date(ev.data_inicio).toLocaleDateString('pt-AO', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-green-500" />
                    <span>{ev.local}</span>
                  </div>
                  {ev.municipio && (
                    <p className="text-xs text-gray-400 pl-5">
                      {ev.municipio}, {ev.provincia}
                    </p>
                  )}
                </div>

                {/* Status do evento */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    ev.status === 'ativo'     ? 'bg-green-100 text-green-700' :
                    ev.status === 'concluido' ? 'bg-gray-100 text-gray-600'  :
                                               'bg-red-100 text-red-700'
                  }`}>
                    {ev.status === 'ativo' ? '🟢 Ativo' :
                     ev.status === 'concluido' ? '✅ Concluído' : '❌ Cancelado'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de criação de evento */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg my-4">

            {/* Cabeçalho do modal */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-green-700">Novo Evento</h3>
              <button onClick={() => setMostrarForm(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Campos do formulário */}
            <div className="space-y-4">

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={atualizar('titulo')}
                  placeholder="Ex: Dia de Reciclagem em Luanda"
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Tipo de evento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={atualizar('tipo')}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="recolha">♻️ Recolha</option>
                  <option value="campanha">📢 Campanha</option>
                  <option value="formacao">📚 Formação</option>
                  <option value="outro">📌 Outro</option>
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={atualizar('descricao')}
                  rows={3}
                  placeholder="Descreve o evento..."
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data início <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.data_inicio}
                    onChange={atualizar('data_inicio')}
                    className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data fim</label>
                  <input
                    type="datetime-local"
                    value={form.data_fim}
                    onChange={atualizar('data_fim')}
                    className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Local */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.local}
                  onChange={atualizar('local')}
                  placeholder="Ex: Rua da Missão, nº 45"
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Província e Município */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Província</label>
                  <input
                    type="text"
                    value={form.provincia}
                    onChange={atualizar('provincia')}
                    placeholder="Ex: Luanda"
                    className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Município</label>
                  <input
                    type="text"
                    value={form.municipio}
                    onChange={atualizar('municipio')}
                    placeholder="Ex: Belas"
                    className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Erro dentro do modal */}
            {erro && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                {erro}
              </p>
            )}

            {/* Botões */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => { setMostrarForm(false); setErro(''); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarEvento}
                disabled={criando}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition"
              >
                {criando ? 'A criar...' : 'Criar Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}