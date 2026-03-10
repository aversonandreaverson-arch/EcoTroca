import React, { useState, useEffect } from 'react';
import { Calendar, Plus, MapPin, Clock, X, Pencil, Trash2 } from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import { getEventosEmpresa, criarEventoEmpresa } from '../../api.js';

const TIPO_CONFIG = {
  recolha:  { cor: 'bg-green-100 text-green-700'   },
  campanha: { cor: 'bg-blue-100 text-blue-700'     },
  formacao: { cor: 'bg-purple-100 text-purple-700' },
  outro:    { cor: 'bg-gray-100 text-gray-700'     },
};

const FORM_VAZIO = {
  titulo: '', descricao: '', data_inicio: '', data_fim: '',
  local: '', provincia: '', municipio: '', tipo: 'recolha',
};

export default function EventosEmpresa() {

  const [eventos,    setEventos]    = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');
  const [sucesso,    setSucesso]    = useState('');
  const [modal,      setModal]      = useState(null);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [form,    setForm]    = useState(FORM_VAZIO);
  const [gravando, setGravando] = useState(false);
  const [apagando, setApagando] = useState(null);

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

  const atualizar = (campo) => (e) =>
    setForm(prev => ({ ...prev, [campo]: e.target.value }));

  const abrirCriar = () => {
    setForm(FORM_VAZIO); setEventoEditando(null); setErro(''); setModal('criar');
  };

  const abrirEditar = (ev) => {
    setForm({
      titulo:      ev.titulo      || '',
      descricao:   ev.descricao   || '',
      data_inicio: ev.data_inicio ? ev.data_inicio.slice(0, 16) : '',
      data_fim:    ev.data_fim    ? ev.data_fim.slice(0, 16)    : '',
      local:       ev.local       || '',
      provincia:   ev.provincia   || '',
      municipio:   ev.municipio   || '',
      tipo:        ev.tipo        || 'recolha',
    });
    setEventoEditando(ev); setErro(''); setModal('editar');
  };

  const fecharModal = () => {
    setModal(null); setEventoEditando(null); setForm(FORM_VAZIO); setErro('');
  };

  const handleCriar = async () => {
    setErro('');
    if (!form.titulo.trim()) return setErro('O título é obrigatório.');
    if (!form.data_inicio)   return setErro('A data de início é obrigatória.');
    if (!form.local.trim())  return setErro('O local é obrigatório.');
    try {
      setGravando(true);
      await criarEventoEmpresa(form);
      setSucesso('Evento criado com sucesso!');
      fecharModal();
      await carregar();
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setGravando(false);
    }
  };

  const handleEditar = async () => {
    setErro('');
    if (!form.titulo.trim()) return setErro('O título é obrigatório.');
    if (!form.data_inicio)   return setErro('A data de início é obrigatória.');
    if (!form.local.trim())  return setErro('O local é obrigatório.');
    try {
      setGravando(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/eventos/${eventoEditando.id_evento}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro || 'Erro ao editar evento.');
      setSucesso('Evento atualizado com sucesso!');
      fecharModal();
      await carregar();
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setGravando(false);
    }
  };

  const handleApagar = async (id) => {
    if (!window.confirm('Tens a certeza que queres eliminar este evento?')) return;
    try {
      setApagando(id);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/eventos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro || 'Erro ao eliminar evento.');
      setSucesso('Evento eliminado com sucesso.');
      await carregar();
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setApagando(null);
    }
  };

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <HeaderEmpresa />

      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-800">Eventos</h1>
          <p className="text-gray-500 mt-1">Cria e gere eventos visíveis para utilizadores e coletadores.</p>
        </div>
        <button
          onClick={abrirCriar}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition"
        >
          <Plus size={18} /> Novo Evento
        </button>
      </div>

      {erro && !modal && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-4">{erro}</div>
      )}
      {sucesso && (
        <div className="bg-green-100 border border-green-300 text-green-700 rounded-xl p-4 mb-4">{sucesso}</div>
      )}

      {carregando ? (
        <p className="text-green-700 text-center">A carregar eventos...</p>
      ) : eventos.length === 0 ? (
        <div className="bg-white border border-green-100 rounded-2xl p-10 text-center shadow-sm">
          <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-600">Ainda não criaste nenhum evento.</p>
          <p className="text-sm text-gray-400 mt-1">Clica em "Novo Evento" para começar.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventos.map(ev => {
            const config = TIPO_CONFIG[ev.tipo] || TIPO_CONFIG.outro;
            return (
              <div key={ev.id_evento} className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
                <div className="flex justify-between items-start mb-3">
                  <p className="font-bold text-gray-800 text-lg flex-1">{ev.titulo}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ml-2 ${config.cor}`}>{ev.tipo}</span>
                </div>
                {ev.descricao && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{ev.descricao}</p>
                )}
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-green-500" />
                    <span>{new Date(ev.data_inicio).toLocaleDateString('pt-AO', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-green-500" />
                    <span>{ev.local}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    ev.status === 'ativo'     ? 'bg-green-100 text-green-700' :
                    ev.status === 'concluido' ? 'bg-gray-100 text-gray-600'  :
                                               'bg-red-100 text-red-700'
                  }`}>
                    {ev.status === 'ativo' ? 'Ativo' : ev.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                  </span>
                </div>
                {ev.status === 'ativo' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => abrirEditar(ev)}
                      className="flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-xl text-sm font-medium transition"
                    >
                      <Pencil size={14} /> Editar
                    </button>
                    <button
                      onClick={() => handleApagar(ev.id_evento)}
                      disabled={apagando === ev.id_evento}
                      className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 py-2 rounded-xl text-sm font-medium transition"
                    >
                      <Trash2 size={14} />
                      {apagando === ev.id_evento ? 'A eliminar...' : 'Eliminar'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg my-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-green-700">
                {modal === 'editar' ? 'Editar Evento' : 'Novo Evento'}
              </h3>
              <button onClick={fecharModal}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.titulo} onChange={atualizar('titulo')}
                  placeholder="Ex: Dia de Reciclagem em Luanda"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={form.tipo} onChange={atualizar('tipo')}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                  <option value="recolha">Recolha</option>
                  <option value="campanha">Campanha</option>
                  <option value="formacao">Formação</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={form.descricao} onChange={atualizar('descricao')} rows={3}
                  placeholder="Descreve o evento..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data início <span className="text-red-500">*</span></label>
                  <input type="datetime-local" value={form.data_inicio} onChange={atualizar('data_inicio')}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data fim</label>
                  <input type="datetime-local" value={form.data_fim} onChange={atualizar('data_fim')}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local <span className="text-red-500">*</span></label>
                <input type="text" value={form.local} onChange={atualizar('local')}
                  placeholder="Ex: Rua da Missão, nº 45"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Província</label>
                  <input type="text" value={form.provincia} onChange={atualizar('provincia')}
                    placeholder="Ex: Luanda"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Município</label>
                  <input type="text" value={form.municipio} onChange={atualizar('municipio')}
                    placeholder="Ex: Belas"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              </div>
            </div>
            {erro && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mt-4">{erro}</p>
            )}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={fecharModal}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition">
                Cancelar
              </button>
              <button onClick={modal === 'editar' ? handleEditar : handleCriar} disabled={gravando}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition">
                {gravando ? 'A guardar...' : modal === 'editar' ? 'Guardar Alterações' : 'Criar Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}