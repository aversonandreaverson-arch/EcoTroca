// ============================================================
//  EducacaoBase.jsx — Componente base reutilizável
//  Usado por: EmpresaProfile, ColetadorProfile, UserProfile
//  Recebe o Header correcto via prop
//
//  Uso:
//    import EducacaoBase from '../EducacaoBase'
//    import Header from './Header'
//    export default function Educacao() {
//      return <EducacaoBase Header={Header} />
//    }
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, X, BookOpen, Tag, Users,
  Calendar, ChevronDown, ChevronUp
} from 'lucide-react';

// ── Categorias disponíveis ──
const CATEGORIAS = [
  { valor: 'todos',                label: 'Todos'                   },
  { valor: 'separacao_residuos',   label: 'Separação de Resíduos'   },
  { valor: 'como_usar_plataforma', label: 'Como Usar a Plataforma'  },
  { valor: 'requisitos_empresas',  label: 'Requisitos das Empresas' },
  { valor: 'legislacao',           label: 'Legislação'              },
  { valor: 'saude_seguranca',      label: 'Saúde e Segurança'       },
  { valor: 'boas_praticas',        label: 'Boas Práticas'           },
];

const COR_CATEGORIA = {
  separacao_residuos:   'bg-green-100 text-green-700',
  como_usar_plataforma: 'bg-blue-100 text-blue-700',
  requisitos_empresas:  'bg-orange-100 text-orange-700',
  legislacao:           'bg-red-100 text-red-700',
  saude_seguranca:      'bg-yellow-100 text-yellow-700',
  boas_praticas:        'bg-purple-100 text-purple-700',
};

const PUBLICO_LABEL = {
  todos:      'Todos',
  utilizador: 'Utilizadores',
  coletor:    'Coletadores',
  empresa:    'Empresas',
};

// ── Cartão de artigo ──
function CartaoArtigo({ artigo, onClick }) {
  const cor = COR_CATEGORIA[artigo.categoria] || 'bg-gray-100 text-gray-700';
  const categoriaLabel = CATEGORIAS.find(c => c.valor === artigo.categoria)?.label || artigo.categoria;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
    >
      {artigo.imagem && (
        <img
          src={artigo.imagem}
          alt={artigo.titulo}
          className="w-full h-48 object-cover rounded-t-2xl"
        />
      )}

      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${cor}`}>
            <Tag size={12} /> {categoriaLabel}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-500">
            <Users size={10} /> {PUBLICO_LABEL[artigo.publico_alvo] || artigo.publico_alvo}
          </span>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <BookOpen size={18} className="text-green-600" />
          {artigo.titulo}
        </h3>

        {artigo.descricao && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {artigo.descricao}
          </p>
        )}

        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Calendar size={12} />
          {new Date(artigo.criado_em).toLocaleDateString('pt-AO', {
            day: '2-digit', month: 'short', year: 'numeric'
          })}
        </div>

        <button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-xl transition">
          Ler mais
        </button>
      </div>
    </div>
  );
}

// ── Modal de detalhe ──
function ModalArtigo({ artigo, onFechar }) {
  if (!artigo) return null;
  const cor = COR_CATEGORIA[artigo.categoria] || 'bg-gray-100 text-gray-700';
  const categoriaLabel = CATEGORIAS.find(c => c.valor === artigo.categoria)?.label || artigo.categoria;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-4">

        <div className="flex justify-between items-start p-6 border-b">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cor}`}>
                {categoriaLabel}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                <Users size={10} /> {PUBLICO_LABEL[artigo.publico_alvo] || artigo.publico_alvo}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{artigo.titulo}</h2>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Calendar size={11} />
              {new Date(artigo.criado_em).toLocaleDateString('pt-AO', {
                day: '2-digit', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 transition">
            <X size={22} />
          </button>
        </div>

        {artigo.imagem && (
          <img src={artigo.imagem} alt={artigo.titulo} className="w-full h-48 object-cover" />
        )}

        <div className="p-6">
          {artigo.descricao && (
            <p className="text-gray-600 font-medium mb-4 leading-relaxed">{artigo.descricao}</p>
          )}
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
            {artigo.conteudo}
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onFechar}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal exportado ──
export default function EducacaoBase({ Header }) {
  const [artigos, setArtigos]               = useState([]);
  const [carregando, setCarregando]         = useState(true);
  const [erro, setErro]                     = useState('');
  const [artigoAberto, setArtigoAberto]     = useState(null);
  const [pesquisa, setPesquisa]             = useState('');
  const [categoria, setCategoria]           = useState('todos');
  const [ordem, setOrdem]                   = useState('recente');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro('');
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (pesquisa.trim())       params.append('pesquisa', pesquisa.trim());
      if (categoria !== 'todos') params.append('categoria', categoria);
      params.append('ordem', ordem);

      const res = await fetch(
        `http://localhost:3000/api/educacao?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro || 'Erro ao carregar conteúdos.');
      setArtigos(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, [pesquisa, categoria, ordem]);

  // Debounce na pesquisa — só dispara 400ms depois de parar de escrever
  useEffect(() => {
    const timeout = setTimeout(carregar, pesquisa ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [carregar, pesquisa]);

  useEffect(() => { carregar(); }, [categoria, ordem]);

  return (
    <div id="Educacao" className="min-h-screen bg-green-700 pt-24 p-6">
      <Header />

      {/* Cabeçalho */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Educação Ambiental</h2>
        <p className="text-gray-300 mt-2">
          Explore artigos educativos para aprender sobre sustentabilidade e reciclagem.
        </p>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={pesquisa}
          onChange={e => setPesquisa(e.target.value)}
          placeholder="Pesquisar... ex: como separar plástico, legislação..."
          className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {pesquisa && (
          <X
            className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 cursor-pointer"
            onClick={() => setPesquisa('')}
          />
        )}
      </div>

      {/* Filtros e ordenação */}
      <div className="bg-white/10 rounded-2xl p-4 mb-6">

        {/* Toggle filtros — só no mobile */}
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center gap-2 text-white text-sm font-medium mb-3 md:hidden"
        >
          <Tag size={16} />
          Filtrar por categoria
          {mostrarFiltros ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Pills de categoria */}
        <div className={`flex flex-wrap gap-2 mb-3 ${mostrarFiltros ? 'flex' : 'hidden md:flex'}`}>
          {CATEGORIAS.map(cat => (
            <button
              key={cat.valor}
              onClick={() => setCategoria(cat.valor)}
              className={`text-sm px-3 py-1.5 rounded-full font-medium transition ${
                categoria === cat.valor
                  ? 'bg-white text-green-700'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Ordenação */}
        <div className="flex items-center gap-3">
          <span className="text-white text-sm">Ordenar:</span>
          {['recente', 'antigo'].map(o => (
            <button
              key={o}
              onClick={() => setOrdem(o)}
              className={`text-sm px-3 py-1.5 rounded-full font-medium transition ${
                ordem === o
                  ? 'bg-white text-green-700'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {o === 'recente' ? 'Mais recente' : 'Mais antigo'}
            </button>
          ))}
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-4">{erro}</div>
      )}

      {/* Resultados */}
      {carregando ? (
        <p className="text-white text-center">A carregar conteúdos...</p>
      ) : artigos.length === 0 ? (
        <div className="bg-white/10 rounded-2xl p-10 text-center text-white">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">
            {pesquisa
              ? `Nenhum resultado para "${pesquisa}".`
              : 'Ainda não há conteúdos disponíveis.'}
          </p>
          {pesquisa && (
            <p className="text-sm text-gray-300 mt-1">
              Tenta pesquisar com outras palavras ou remove os filtros.
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="text-gray-300 text-sm mb-4">
            {artigos.length} resultado{artigos.length !== 1 ? 's' : ''} encontrado{artigos.length !== 1 ? 's' : ''}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artigos.map(artigo => (
              <CartaoArtigo
                key={artigo.id_educacao}
                artigo={artigo}
                onClick={() => setArtigoAberto(artigo)}
              />
            ))}
          </div>
        </>
      )}

      <ModalArtigo artigo={artigoAberto} onFechar={() => setArtigoAberto(null)} />
    </div>
  );
}