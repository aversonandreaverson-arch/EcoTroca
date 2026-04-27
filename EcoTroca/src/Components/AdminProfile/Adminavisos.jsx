import { useState, useEffect } from 'react';
import { Bell, Plus, Pencil, Trash2, X, Save, AlertCircle, Search, AlertTriangle } from 'lucide-react';
import Header from './Header.jsx';

const TOKEN = () => localStorage.getItem('token');
const api = (path, opts = {}) =>
  fetch(`http://localhost:3000${path}`, {
    headers: { Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' },
    ...opts
  }).then(r => r.json());

const FORM_VAZIO = { titulo: '', descricao: '', provincia: '' };

export default function AdminAvisos() {
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
      const dados = await api('/api/feed');
      const arr = Array.isArray(dados) ? dados : (dados?.publicacoes || []);
      setLista(arr.filter(p => p.tipo_publicacao === 'aviso'));
    } catch (err) { setErro(err.message); }
    finally { setCarregando(false); }
  };

  const abrirCriar  = () => { setEdicao(null); setForm(FORM_VAZIO); setErroForm(''); setModal(true); };
  const abrirEditar = (a) => {
    setEdicao(a);
    setForm({ titulo: a.titulo || '', descricao: a.descricao || '', provincia: a.provincia || '' });
    setErroForm(''); setModal(true);
  };
  const fechar = () => { setModal(false); setEdicao(null); setForm(FORM_VAZIO); setErroForm(''); };
  const campo  = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const guardar = async () => {
    if (!form.titulo.trim()) { setErroForm('O título é obrigatório.'); return; }
    if (!form.descricao.trim()) { setErroForm('O conteúdo do aviso é obrigatório.'); return; }
    try {
      setSalvando(true); setErroForm('');
      if (edicao) {
        await api(`/api/feed/${edicao.id_publicacao}`, { method: 'PUT', body: JSON.stringify({ ...form, tipo_publicacao: 'aviso' }) });
      } else {
        await api('/api/feed', { method: 'POST', body: JSON.stringify({ ...form, tipo_publicacao: 'aviso' }) });
      }
      fechar(); await carregar();
    } catch (err) { setErroForm(err.message); }
    finally { setSalvando(false); }
  };

  const apagar = async (a) => {
    if (!window.confirm(`Apagar o aviso "${a.titulo}"?`)) return;
    try { await api(`/api/feed/${a.id_publicacao}`, { method: 'DELETE' }); await carregar(); }
    catch (err) { alert(err.message); }
  };

  const listaFiltrada = lista.filter(a =>
    !pesquisa || a.titulo?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  if (carregando) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header /><p className="text-white text-lg">A carregar avisos...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pt-24 p-6">
      <Header />

      <div className="bg-white/10 text-white rounded-2xl p-6 mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3"><Bell size={24} /> Gestão de Avisos</h2>
          <p className="opacity-70 text-sm mt-1">{lista.length} aviso(s) activo(s) na plataforma</p>
        </div>
        <button onClick={abrirCriar} className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-medium px-5 py-3 rounded-xl transition">
          <Plus size={18} /> Novo Aviso
        </button>
      </div>

      {lista.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">Tens <strong>{lista.length}</strong> aviso(s) activo(s). Os avisos aparecem na sidebar de todos os utilizadores.</p>
        </div>
      )}

      {erro && <p className="text-red-400 mb-4">{erro}</p>}

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-3.5 text-white/40" />
        <input type="text" placeholder="Pesquisar avisos..." value={pesquisa}
          onChange={e => setPesquisa(e.target.value)}
          className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-white/40" />
      </div>

      <div className="space-y-3">
        {listaFiltrada.length === 0 && <p className="text-white/50 text-center py-12">Nenhum aviso encontrado.</p>}
        {listaFiltrada.map(a => (
          <div key={a.id_publicacao} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-4 items-start">
              <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                <Bell size={24} className="text-red-300" />
              </div>
              <div>
                <p className="text-white font-semibold text-base mb-1">{a.titulo}</p>
                {a.descricao && <p className="text-white/60 text-sm mb-2 line-clamp-3">{a.descricao}</p>}
                <div className="flex gap-2 text-xs text-white/40">
                  <span>{new Date(a.criado_em).toLocaleDateString('pt-AO')}</span>
                  {a.provincia && <span>· {a.provincia}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => abrirEditar(a)} className="flex items-center gap-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 text-xs px-3 py-2 rounded-lg transition">
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => apagar(a)} className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs px-3 py-2 rounded-lg transition">
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
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-400" />
                {edicao ? 'Editar Aviso' : 'Novo Aviso'}
              </h3>
              <button onClick={fechar} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
              <p className="text-red-300 text-xs">⚠️ Os avisos aparecem em destaque na sidebar de todos os utilizadores, empresas e coletadores. Usa apenas para informações importantes.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm block mb-1">Título do aviso <span className="text-red-400">*</span></label>
                <input type="text" value={form.titulo} onChange={e => campo('titulo', e.target.value)}
                  placeholder="Ex: Manutenção programada — 25 de Abril"
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40" />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-1">Conteúdo do aviso <span className="text-red-400">*</span></label>
                <textarea value={form.descricao} onChange={e => campo('descricao', e.target.value)}
                  placeholder="Descreve o aviso em detalhe. O que aconteceu? O que os utilizadores devem fazer?" rows={4}
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 resize-none" />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-1">Província (opcional — deixa vazio para todo o país)</label>
                <input type="text" value={form.provincia} onChange={e => campo('provincia', e.target.value)}
                  placeholder="Ex: Luanda (ou deixa vazio para todas as províncias)"
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40" />
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
                className="flex items-center gap-2 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-xl text-sm transition">
                <Save size={16} /> {salvando ? 'A publicar...' : 'Publicar Aviso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}