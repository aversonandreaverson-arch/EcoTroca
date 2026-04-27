import { useState, useEffect } from 'react';
import { Newspaper, Plus, Pencil, Trash2, X, Save, AlertCircle, Search } from 'lucide-react';
import Header from './Header.jsx';

const TOKEN = () => localStorage.getItem('token');
const api = (path, opts = {}) =>
  fetch(`http://localhost:3000${path}`, {
    headers: { Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' },
    ...opts
  }).then(r => r.json());

const FORM_VAZIO = { titulo: '', descricao: '', provincia: '', imagem: '' };

export default function AdminNoticias() {
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
      const dados = await api('/api/feed?tipo=noticia');
      const arr = Array.isArray(dados) ? dados : (dados?.publicacoes || []);
      setLista(arr.filter(p => p.tipo_publicacao === 'noticia'));
    } catch (err) { setErro(err.message); }
    finally { setCarregando(false); }
  };

  const abrirCriar  = () => { setEdicao(null); setForm(FORM_VAZIO); setErroForm(''); setModal(true); };
  const abrirEditar = (n) => {
    setEdicao(n);
    setForm({ titulo: n.titulo || '', descricao: n.descricao || '', provincia: n.provincia || '', imagem: n.imagem || '' });
    setErroForm(''); setModal(true);
  };
  const fechar = () => { setModal(false); setEdicao(null); setForm(FORM_VAZIO); setErroForm(''); };
  const campo  = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const guardar = async () => {
    if (!form.titulo.trim()) { setErroForm('O título é obrigatório.'); return; }
    try {
      setSalvando(true); setErroForm('');
      if (edicao) {
        await api(`/api/feed/${edicao.id_publicacao}`, { method: 'PUT', body: JSON.stringify({ ...form, tipo_publicacao: 'noticia' }) });
      } else {
        await api('/api/feed', { method: 'POST', body: JSON.stringify({ ...form, tipo_publicacao: 'noticia' }) });
      }
      fechar(); await carregar();
    } catch (err) { setErroForm(err.message); }
    finally { setSalvando(false); }
  };

  const apagar = async (n) => {
    if (!window.confirm(`Apagar a notícia "${n.titulo}"?`)) return;
    try { await api(`/api/feed/${n.id_publicacao}`, { method: 'DELETE' }); await carregar(); }
    catch (err) { alert(err.message); }
  };

  const listaFiltrada = lista.filter(n =>
    !pesquisa || n.titulo?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  if (carregando) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header /><p className="text-white text-lg">A carregar notícias...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pt-24 p-6">
      <Header />

      <div className="bg-white/10 text-white rounded-2xl p-6 mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3"><Newspaper size={24} /> Gestão de Notícias</h2>
          <p className="opacity-70 text-sm mt-1">{lista.length} notícia(s) publicada(s)</p>
        </div>
        <button onClick={abrirCriar} className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-medium px-5 py-3 rounded-xl transition">
          <Plus size={18} /> Nova Notícia
        </button>
      </div>

      {erro && <p className="text-red-400 mb-4">{erro}</p>}

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-3.5 text-white/40" />
        <input type="text" placeholder="Pesquisar notícias..." value={pesquisa}
          onChange={e => setPesquisa(e.target.value)}
          className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-white/40" />
      </div>

      <div className="space-y-3">
        {listaFiltrada.length === 0 && <p className="text-white/50 text-center py-12">Nenhuma notícia encontrada.</p>}
        {listaFiltrada.map(n => (
          <div key={n.id_publicacao} className="bg-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-4 items-start">
              {n.imagem ? (
                <img src={n.imagem} alt={n.titulo} className="w-14 h-14 rounded-xl object-cover shrink-0" onError={e => e.target.style.display='none'} />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                  <Newspaper size={24} className="text-cyan-300" />
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-base mb-1">{n.titulo}</p>
                {n.descricao && <p className="text-white/60 text-sm mb-2 line-clamp-2">{n.descricao}</p>}
                <div className="flex gap-2 text-xs text-white/40">
                  <span>{new Date(n.criado_em).toLocaleDateString('pt-AO')}</span>
                  {n.provincia && <span>· {n.provincia}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => abrirEditar(n)} className="flex items-center gap-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 text-xs px-3 py-2 rounded-lg transition">
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => apagar(n)} className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs px-3 py-2 rounded-lg transition">
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
              <h3 className="text-white font-bold text-lg">{edicao ? 'Editar Notícia' : 'Nova Notícia'}</h3>
              <button onClick={fechar} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm block mb-1">Título <span className="text-red-400">*</span></label>
                <input type="text" value={form.titulo} onChange={e => campo('titulo', e.target.value)}
                  placeholder="Título da notícia"
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40" />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-1">Conteúdo / Descrição <span className="text-red-400">*</span></label>
                <textarea value={form.descricao} onChange={e => campo('descricao', e.target.value)}
                  placeholder="Escreve o conteúdo da notícia aqui..." rows={5}
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 resize-none" />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-1">Província (opcional)</label>
                <input type="text" value={form.provincia} onChange={e => campo('provincia', e.target.value)}
                  placeholder="Ex: Luanda"
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40" />
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