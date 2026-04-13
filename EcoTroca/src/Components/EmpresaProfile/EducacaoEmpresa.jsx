import { useState, useEffect } from 'react';
import { Plus, Trash2, X, BookOpen } from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa';
import {
  getFeed, criarPublicacao, apagarPublicacao, getUtilizadorLocal
} from '../../api.js';

const FORM_VAZIO = { tipo_publicacao: 'educacao', titulo: '', descricao: '', provincia: '', imagem: '' };

export default function EducacaoEmpresa() {
  const utilizador = getUtilizadorLocal();

  const [publicacoes, setPublicacoes] = useState([]);
  const [carregando,  setCarregando]  = useState(true);
  const [erro,        setErro]        = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [formulario,  setFormulario]  = useState(FORM_VAZIO);
  const [publicando,  setPublicando]  = useState(false);
  const [erroForm,    setErroForm]    = useState('');

  const carregar = async () => {
    try {
      setCarregando(true);
      const dados = await getFeed();
      // getFeed pode devolver array simples ou { publicacoes, propostasEnviadas }
      // extraimos sempre o array antes de filtrar
      const feed = Array.isArray(dados) ? dados : (dados?.publicacoes || []);
      setPublicacoes(feed.filter(p => p.tipo_publicacao === 'educacao'));
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleCampo = (campo, valor) =>
    setFormulario(prev => ({ ...prev, [campo]: valor }));

  const handlePublicar = async () => {
    if (!formulario.titulo.trim()) { setErroForm('O título é obrigatório.'); return; }
    try {
      setPublicando(true); setErroForm('');
      await criarPublicacao(formulario);
      setModalAberto(false);
      setFormulario(FORM_VAZIO);
      await carregar();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setPublicando(false);
    }
  };

  const handleApagar = async (id) => {
    if (!window.confirm('Remover esta publicação?')) return;
    try { await apagarPublicacao(id); await carregar(); }
    catch (err) { alert(err.message); }
  };

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12 px-6">
      <HeaderEmpresa />

      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-800 flex items-center gap-2">
            <BookOpen size={28} /> Educação
          </h1>
          <p className="text-gray-500 mt-1">Conteúdos educativos publicados na plataforma.</p>
        </div>
        <button
          onClick={() => { setFormulario(FORM_VAZIO); setErroForm(''); setModalAberto(true); }}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition"
        >
          <Plus size={18} /> Nova Publicação
        </button>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6">{erro}</div>
      )}

      {carregando ? (
        <p className="text-green-700 text-center py-12">A carregar...</p>
      ) : publicacoes.length === 0 ? (
        <div className="bg-white border border-green-100 rounded-2xl p-12 text-center shadow-sm">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">Nenhum conteúdo educativo ainda.</p>
          <p className="text-gray-400 text-sm mt-1">Clica em "Nova Publicação" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicacoes.map(p => (
            <div key={p.id_publicacao} className="bg-white border border-yellow-100 rounded-2xl overflow-hidden shadow-sm">
              {p.imagem && (
                <img src={p.imagem} alt={p.titulo} className="w-full h-40 object-cover"
                  onError={e => { e.target.style.display = 'none'; }} />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-lg">
                    Educação
                  </span>
                  <span className="text-gray-400 text-xs">
                    {new Date(p.criado_em).toLocaleDateString('pt-AO')}
                  </span>
                </div>
                <h3 className="text-gray-800 font-semibold text-sm mb-1">{p.titulo}</h3>
                {p.descricao && (
                  <p className="text-gray-500 text-xs line-clamp-3 mb-3">{p.descricao}</p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-400 text-xs">{p.nome_autor}</span>
                  {(utilizador?.tipo === 'admin' || utilizador?.id === p.id_autor) && (
                    <button
                      onClick={() => handleApagar(p.id_publicacao)}
                      className="text-red-400 hover:text-red-500 text-xs flex items-center gap-1 transition"
                    >
                      <Trash2 size={12} /> Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg">Nova Publicação de Educação</h3>
              <button onClick={() => setModalAberto(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm block mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input type="text" value={formulario.titulo}
                  onChange={e => handleCampo('titulo', e.target.value)}
                  placeholder="Ex: Como separar resíduos correctamente"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-gray-600 text-sm block mb-1">Conteúdo</label>
                <textarea value={formulario.descricao}
                  onChange={e => handleCampo('descricao', e.target.value)}
                  placeholder="Escreve o conteúdo educativo..." rows={5}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
              </div>
              <div>
                <label className="text-gray-600 text-sm block mb-1">Província (opcional)</label>
                <input type="text" value={formulario.provincia}
                  onChange={e => handleCampo('provincia', e.target.value)}
                  placeholder="Ex: Luanda"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              {erroForm && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{erroForm}</p>
              )}
            </div>
            <button onClick={handlePublicar} disabled={publicando}
              className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">
              {publicando ? 'A publicar...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}