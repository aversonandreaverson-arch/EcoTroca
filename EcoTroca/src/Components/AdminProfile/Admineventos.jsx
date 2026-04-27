import { useState, useEffect } from 'react';
import { Calendar, Plus, Pencil, Trash2, X, Save, AlertCircle, Search, MapPin, Clock } from 'lucide-react';
import Header from './Header.jsx';

const TOKEN = () => localStorage.getItem('token');
const api = (path, opts = {}) =>
  fetch(`http://localhost:3000${path}`, {
    headers: { Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' },
    ...opts
  }).then(r => r.json());

const FORM_VAZIO = {
  titulo: '', descricao: '', data_inicio: '', data_fim: '',
  local: '', provincia: '', municipio: '', tipo: 'recolha', imagem: ''
};

const TIPOS = [
  { valor: 'recolha',      label: 'Recolha de Resíduos' },
  { valor: 'sensibilizacao', label: 'Sensibilização'    },
  { valor: 'formacao',     label: 'Formação'            },
  { valor: 'outro',        label: 'Outro'               },
];

export default function AdminEventos() {
  const [lista,      setLista]      = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');
  const [modal,      setModal]      = useState(false);
  const [edicao,     setEdicao]     = useState(null);
  const [form,       setForm]       = useState(FORM_VAZIO);
  const [salvando,   setSalvando]   = useState(false);
  const [erroForm,   setErroForm]   = useState('');
  const [pesquisa,   setPesquisa]   = useState('');

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      setCarregando(true);
      const dados = await api('/api/eventos');
      setLista(Array.isArray(dados) ? dados : []);
    } catch (err) { setErro(err.message); }
    finally { setCarregando(false); }
  };

  const abrirCriar = () => { setEdicao(null); setForm(FORM_VAZIO); setErroForm(''); setModal(true); };
  const abrirEditar = (e) => {
    setEdicao(e);
    setForm({
      titulo: e.titulo || '', descricao: e.descricao || '',
      data_inicio: e.data_inicio ? e.data_inicio.slice(0, 16) : '',
      data_fim:    e.data_fim    ? e.data_fim.slice(0, 16)    : '',
      local: e.local || '', provincia: e.provincia || '',
      municipio: e.municipio || '', tipo: e.tipo || 'recolha', imagem: e.imagem || ''
    });
    setErroForm(''); setModal(true);
  };
  const fechar = () => { setModal(false); setEdicao(null); setForm(FORM_VAZIO); setErroForm(''); };
  const campo = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const guardar = async () => {
    if (!form.titulo.trim())    { setErroForm('O título é obrigatório.'); return; }
    if (!form.data_inicio)      { setErroForm('A data de início é obrigatória.'); return; }
    try {
      setSalvando(true); setErroForm('');
      if (edicao) {
        await api(`/api/eventos/${edicao.id_evento}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await api('/api/eventos', { method: 'POST', body: JSON.stringify(form) });
      }
      fechar(); await carregar();
    } catch (err) { setErroForm(err.message); }
    finally { setSalvando(false); }
  };

  const apagar = async (e) => {
    if (!window.confirm(`Apagar o evento "${e.titulo}"?`)) return;
    try {
      await api(`/api/eventos/${e.id_evento}`, { method: 'DELETE' });
      await carregar();
    } catch (err) { alert(err.message); }
  };

  const listaFiltrada = lista.filter(e =>
    !pesquisa || e.titulo?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  if (carregando) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header /><p className="text-white text-lg">A carregar eventos...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pt-24 p-6">
      <Header />

      <div className="bg-white/10 text-white rounded-2xl p-6 mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3"><Calendar size={24} /> Gestão de Eventos</h2>
          <p className="opacity-70 text-sm mt-1">{lista.length} evento(s) na plataforma</p>
        </div>
        <button onClick={abrirCriar} className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-medium px-5 py-3 rounded-xl transition">
          <Plus size={18} /> Novo Evento
        </button>
      </div>

      {erro && <p className="text-red-400 mb-4">{erro}</p>}

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-3.5 text-white/40" />
        <input type="text" placeholder="Pesquisar eventos..." value={pesquisa}
          onChange={e => setPesquisa(e.target.value)}
          className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-white/40" />
      </div>

      <div className="space-y-3">
        {listaFiltrada.length === 0 && <p className="text-white/50 text-center py-12">Nenhum evento encontrado.</p>}
        {listaFiltrada.map(e => (
          <div key={e.id_evento} className="bg-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-4 items-start">
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Calendar size={24} className="text-blue-300" />
              </div>
              <div>
                <p className="text-white font-semibold text-base mb-1">{e.titulo}</p>
                {e.descricao && <p className="text-white/60 text-sm mb-2 line-clamp-2">{e.descricao}</p>}
                <div className="flex gap-3 flex-wrap text-xs text-white/50">
                  {e.data_inicio && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {new Date(e.data_inicio).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {(e.local || e.provincia) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {[e.local, e.provincia].filter(Boolean).join(', ')}
                    </span>
                  )}
                  <span className="bg-blue-400/20 text-blue-300 px-2 py-0.5 rounded-lg">
                    {TIPOS.find(t => t.valor === e.tipo)?.label || e.tipo}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => abrirEditar(e)} className="flex items-center gap-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 text-xs px-3 py-2 rounded-lg transition">
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => apagar(e)} className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs px-3 py-2 rounded-lg transition">
                <Trash2 size={14} /> Apagar
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-lg">{edicao ? 'Editar Evento' : 'Novo Evento'}</h3>
              <button onClick={fechar} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm block mb-1">Título <span className="text-red-400">*</span></label>
                <input type="text" value={form.titulo} onChange={e => campo('titulo', e.target.value)}
                  placeholder="Nome do evento"
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40" />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-1">Descrição (opcional)</label>
                <textarea value={form.descricao} onChange={e => campo('descricao', e.target.value)}
                  placeholder="Detalhes do evento..." rows={3}
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 resize-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm block mb-1">Data de início <span className="text-red-400">*</span></label>
                  <input type="datetime-local" value={form.data_inicio} onChange={e => campo('data_inicio', e.target.value)}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40" />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Data de fim (opcional)</label>
                  <input type="datetime-local" value={form.data_fim} onChange={e => campo('data_fim', e.target.value)}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-white/70 text-sm block mb-1">Local</label>
                  <input type="text" value={form.local} onChange={e => campo('local', e.target.value)}
                    placeholder="Ex: Parque da Cidade"
                    className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40" />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Município</label>
                  <input type="text" value={form.municipio} onChange={e => campo('municipio', e.target.value)}
                    placeholder="Ex: Talatona"
                    className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40" />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Província</label>
                  <input type="text" value={form.provincia} onChange={e => campo('provincia', e.target.value)}
                    placeholder="Ex: Luanda"
                    className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40" />
                </div>
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-1">Tipo de evento</label>
                <select value={form.tipo} onChange={e => campo('tipo', e.target.value)}
                  className="w-full bg-gray-700 text-white border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none">
                  {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-1">URL da imagem (opcional)</label>
                <input type="text" value={form.imagem} onChange={e => campo('imagem', e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40" />
                {form.imagem && <img src={form.imagem} alt="preview" className="mt-2 w-full h-32 object-cover rounded-xl" onError={e => e.target.style.display='none'} />}
              </div>
              {erroForm && (
                <div className="flex items-center gap-2 bg-red-500/20 text-red-300 rounded-xl p-3 text-sm">
                  <AlertCircle size={16} /> {erroForm}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={fechar} className="px-4 py-2 text-white/60 hover:text-white text-sm transition">Cancelar</button>
              <button onClick={guardar} disabled={salvando}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-xl text-sm transition">
                <Save size={16} /> {salvando ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}