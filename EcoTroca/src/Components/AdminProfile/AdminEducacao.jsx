
//  O que esta página faz:
//  Permito ao admin ver, criar, editar e apagar os conteúdos
//  educativos que aparecem para os utilizadores, coletadores
//  e empresas na secção de Educação da plataforma.
//
//  Cada conteúdo tem:
//  - Título e descrição curta
//  - Conteúdo principal (texto longo)
//  - Categoria (separação de resíduos, legislação, etc.)
//  - Público-alvo (todos, utilizador, coletor ou empresa)
//  - Imagem opcional (URL)
// ============================================================

import { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Pencil, Trash2,
  X, Save, AlertCircle, Search
} from 'lucide-react';
import Header from './Header.jsx';
import {
  getAdminEducacao,
  criarEducacao,
  editarEducacao,
  apagarEducacao
} from '../../api.js';

// ── Opções de categoria — igual ao ENUM da base de dados ──
const CATEGORIAS = [
  { valor: 'separacao_residuos',   label: 'Separação de Resíduos'   },
  { valor: 'como_usar_plataforma', label: 'Como Usar a Plataforma'  },
  { valor: 'requisitos_empresas',  label: 'Requisitos para Empresas' },
  { valor: 'legislacao',           label: 'Legislação'               },
  { valor: 'saude_seguranca',      label: 'Saúde e Segurança'        },
  { valor: 'boas_praticas',        label: 'Boas Práticas'            },
];

// ── Opções de público-alvo — igual ao ENUM da base de dados ──
const PUBLICOS = [
  { valor: 'todos',       label: 'Todos'        },
  { valor: 'utilizador',  label: 'Utilizadores' },
  { valor: 'coletor',     label: 'Coletadores'  },
  { valor: 'empresa',     label: 'Empresas'     },
];

// ── Formulário vazio — usado ao criar ou limpar o formulário ──
const FORMULARIO_VAZIO = {
  titulo:      '',
  descricao:   '',
  conteudo:    '',
  categoria:   'boas_praticas',
  publico_alvo: 'todos',
  imagem:      '',
};

export default function AdminEducacao() {

  // lista → todos os conteúdos vindos da API
  const [lista, setLista] = useState([]);

  // carregando → true enquanto os dados ainda não chegaram
  const [carregando, setCarregando] = useState(true);

  // erro → mensagem de erro se a API falhar
  const [erro, setErro] = useState('');

  // modalAberto → controla se o formulário de criar/editar está visível
  const [modalAberto, setModalAberto] = useState(false);

  // modoEdicao → guarda o conteúdo a editar (null = modo de criação)
  const [modoEdicao, setModoEdicao] = useState(null);

  // formulario → dados do formulário de criar/editar
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);

  // salvando → evita cliques duplos no botão guardar
  const [salvando, setSalvando] = useState(false);

  // erroFormulario → mensagem de erro dentro do formulário
  const [erroFormulario, setErroFormulario] = useState('');

  // pesquisa → texto da barra de pesquisa
  const [pesquisa, setPesquisa] = useState('');

  // filtroCategoria → filtra por categoria
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  // ── Carrego a lista ao abrir a página ──
  useEffect(() => {
    carregarLista();
  }, []);

  // Vai buscar todos os conteúdos à API
  const carregarLista = async () => {
    try {
      setCarregando(true);
      // GET /api/educacao — devolve todos os conteúdos não eliminados
      const dados = await getAdminEducacao();
      setLista(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // ── Filtragem local da lista ──
  const listaFiltrada = lista
    .filter(c => filtroCategoria === 'todas' || c.categoria === filtroCategoria)
    .filter(c => {
      if (!pesquisa) return true;
      const termo = pesquisa.toLowerCase();
      return (
        c.titulo?.toLowerCase().includes(termo) ||
        c.descricao?.toLowerCase().includes(termo)
      );
    });

  // ── Abre o formulário para criar novo conteúdo ──
  const abrirCriar = () => {
    setModoEdicao(null);               // null = modo criação
    setFormulario(FORMULARIO_VAZIO);   // limpa o formulário
    setErroFormulario('');
    setModalAberto(true);
  };

  // ── Abre o formulário para editar um conteúdo existente ──
  const abrirEditar = (conteudo) => {
    setModoEdicao(conteudo);           // guardo o conteúdo original
    // Preencho o formulário com os dados actuais do conteúdo
    setFormulario({
      titulo:       conteudo.titulo       || '',
      descricao:    conteudo.descricao    || '',
      conteudo:     conteudo.conteudo     || '',
      categoria:    conteudo.categoria    || 'boas_praticas',
      publico_alvo: conteudo.publico_alvo || 'todos',
      imagem:       conteudo.imagem       || '',
    });
    setErroFormulario('');
    setModalAberto(true);
  };

  // ── Fecha o modal e limpa o estado ──
  const fecharModal = () => {
    setModalAberto(false);
    setModoEdicao(null);
    setFormulario(FORMULARIO_VAZIO);
    setErroFormulario('');
  };

  // ── Actualiza um campo do formulário ao digitar ──
  const handleCampo = (campo, valor) => {
    // Uso o spread (...) para manter os outros campos inalterados
    setFormulario(prev => ({ ...prev, [campo]: valor }));
  };

  // ── Guarda o conteúdo (criar ou editar) ──
  const handleGuardar = async () => {
    // Valido os campos obrigatórios antes de enviar
    if (!formulario.titulo.trim()) {
      setErroFormulario('O título é obrigatório.');
      return;
    }
    if (!formulario.conteudo.trim()) {
      setErroFormulario('O conteúdo é obrigatório.');
      return;
    }

    try {
      setSalvando(true);
      setErroFormulario('');

      if (modoEdicao) {
        // Se estou em modo edição, actualizo o conteúdo existente
        // PUT /api/educacao/:id
        await editarEducacao(modoEdicao.id_educacao, formulario);
      } else {
        // Se estou em modo criação, crio um novo conteúdo
        // POST /api/educacao
        await criarEducacao(formulario);
      }

      // Fecho o modal e recarrego a lista para mostrar as alterações
      fecharModal();
      await carregarLista();

    } catch (err) {
      setErroFormulario(err.message);
    } finally {
      setSalvando(false);
    }
  };

  // ── Apaga (desactiva) um conteúdo ──
  const handleApagar = async (conteudo) => {
    // Peço confirmação antes de apagar
    if (!window.confirm(`Apagar o conteúdo "${conteudo.titulo}"?`)) return;
    try {
      // DELETE /api/educacao/:id — faz soft delete (eliminado = 1)
      await apagarEducacao(conteudo.id_educacao);
      // Recarrego a lista para remover o item apagado
      await carregarLista();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Ecrã de carregamento ──
  if (carregando) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-white text-lg">A carregar conteúdos...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pt-24 p-6">
      <Header />

      {/* Cabeçalho da página */}
      <div className="bg-white/10 text-white rounded-2xl p-6 shadow-lg mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <BookOpen size={24} /> Gestão de Educação
          </h2>
          <p className="opacity-70 text-sm mt-1">
            {lista.length} conteúdo(s) publicado(s) na plataforma
          </p>
        </div>

        {/* Botão para criar novo conteúdo */}
        <button
          onClick={abrirCriar}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-medium px-5 py-3 rounded-xl transition"
        >
          <Plus size={18} /> Novo Conteúdo
        </button>
      </div>

      {/* ── Barra de pesquisa e filtros ── */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">

        {/* Campo de pesquisa por título */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-white/40" />
          <input
            type="text"
            placeholder="Pesquisar por título ou descrição..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-white/40"
          />
        </div>

        {/* Filtro por categoria */}
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-white/40"
        >
          <option value="todas" className="bg-gray-800">Todas as categorias</option>
          {CATEGORIAS.map(c => (
            <option key={c.valor} value={c.valor} className="bg-gray-800">
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Lista de conteúdos ── */}
      <div className="space-y-3">

        {/* Mensagem quando não há resultados */}
        {listaFiltrada.length === 0 && (
          <p className="text-white/50 text-center py-12">
            Nenhum conteúdo encontrado.
          </p>
        )}

        {/* Um cartão por conteúdo */}
        {listaFiltrada.map((c) => (
          <div
            key={c.id_educacao}
            className="bg-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-4"
          >
            {/* Lado esquerdo — informações do conteúdo */}
            <div className="flex gap-4">

              {/* Imagem do conteúdo — se existir */}
              {c.imagem ? (
                <img
                  src={c.imagem}
                  alt={c.titulo}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                  // onError → esconde a imagem se o URL estiver inválido
                />
              ) : (
                // Placeholder quando não há imagem
                <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <BookOpen size={24} className="text-white/30" />
                </div>
              )}

              <div>
                {/* Título do conteúdo */}
                <p className="text-white font-semibold text-base mb-1">{c.titulo}</p>

                {/* Descrição curta — se existir */}
                {c.descricao && (
                  <p className="text-white/60 text-sm mb-2 line-clamp-2">
                    {c.descricao}
                  </p>
                )}

                {/* Badges de categoria e público-alvo */}
                <div className="flex gap-2 flex-wrap">
                  <BadgeCategoria categoria={c.categoria} />
                  <BadgePublico publico={c.publico_alvo} />
                </div>
              </div>
            </div>

            {/* Lado direito — botões de acção */}
            <div className="flex gap-2 shrink-0">

              {/* Botão editar */}
              <button
                onClick={() => abrirEditar(c)}
                className="flex items-center gap-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 text-xs px-3 py-2 rounded-lg transition"
              >
                <Pencil size={14} /> Editar
              </button>

              {/* Botão apagar */}
              <button
                onClick={() => handleApagar(c)}
                className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs px-3 py-2 rounded-lg transition"
              >
                <Trash2 size={14} /> Apagar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          MODAL — Formulário de criar / editar conteúdo
          Aparece quando clico em "Novo Conteúdo" ou "Editar"
      ══════════════════════════════════════════════ */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl">

            {/* Cabeçalho do modal */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-lg">
                {modoEdicao ? '✏️ Editar Conteúdo' : '➕ Novo Conteúdo'}
              </h3>
              {/* Botão fechar modal */}
              <button onClick={fecharModal} className="text-white/50 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            {/* Campos do formulário */}
            <div className="space-y-4">

              {/* Título */}
              <div>
                <label className="text-white/70 text-sm block mb-1">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formulario.titulo}
                  onChange={(e) => handleCampo('titulo', e.target.value)}
                  placeholder="Ex: Como separar plásticos em casa"
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Descrição curta */}
              <div>
                <label className="text-white/70 text-sm block mb-1">
                  Descrição curta (opcional)
                </label>
                <input
                  type="text"
                  value={formulario.descricao}
                  onChange={(e) => handleCampo('descricao', e.target.value)}
                  placeholder="Resumo do conteúdo em 1-2 frases"
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Conteúdo principal */}
              <div>
                <label className="text-white/70 text-sm block mb-1">
                  Conteúdo <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formulario.conteudo}
                  onChange={(e) => handleCampo('conteudo', e.target.value)}
                  placeholder="Escreve o conteúdo completo aqui..."
                  rows={6}
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 resize-none"
                />
              </div>

              {/* Categoria e Público-alvo — lado a lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Categoria */}
                <div>
                  <label className="text-white/70 text-sm block mb-1">Categoria</label>
                  <select
                    value={formulario.categoria}
                    onChange={(e) => handleCampo('categoria', e.target.value)}
                    className="w-full bg-gray-700 text-white border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40"
                  >
                    {CATEGORIAS.map(c => (
                      <option key={c.valor} value={c.valor}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Público-alvo */}
                <div>
                  <label className="text-white/70 text-sm block mb-1">Público-alvo</label>
                  <select
                    value={formulario.publico_alvo}
                    onChange={(e) => handleCampo('publico_alvo', e.target.value)}
                    className="w-full bg-gray-700 text-white border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40"
                  >
                    {PUBLICOS.map(p => (
                      <option key={p.valor} value={p.valor}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* URL da imagem */}
              <div>
                <label className="text-white/70 text-sm block mb-1">
                  URL da imagem (opcional)
                </label>
                <input
                  type="text"
                  value={formulario.imagem}
                  onChange={(e) => handleCampo('imagem', e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40"
                />
                {/* Pré-visualização da imagem se o URL estiver preenchido */}
                {formulario.imagem && (
                  <img
                    src={formulario.imagem}
                    alt="Pré-visualização"
                    className="mt-2 w-full h-32 object-cover rounded-xl"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
              </div>

              {/* Mensagem de erro do formulário */}
              {erroFormulario && (
                <div className="flex items-center gap-2 bg-red-500/20 text-red-300 rounded-xl p-3 text-sm">
                  <AlertCircle size={16} />
                  <p>{erroFormulario}</p>
                </div>
              )}
            </div>

            {/* Botões do modal */}
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={fecharModal}
                className="px-4 py-2 text-white/60 hover:text-white text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={salvando}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-xl text-sm transition"
              >
                <Save size={16} />
                {salvando ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BadgeCategoria ───────────────────────────────────────────
// Etiqueta colorida que mostra a categoria do conteúdo
function BadgeCategoria({ categoria }) {
  // Vou buscar o label legível a partir do valor do ENUM
  const cat = CATEGORIAS.find(c => c.valor === categoria);
  return (
    <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-400/20 text-blue-300">
      {cat?.label || categoria}
    </span>
  );
}

// ── BadgePublico ─────────────────────────────────────────────
// Etiqueta que mostra para quem o conteúdo é destinado
function BadgePublico({ publico }) {
  const mapa = {
    todos:      { cor: 'bg-green-400/20 text-green-300',   label: 'Todos'        },
    utilizador: { cor: 'bg-blue-400/20 text-blue-300',     label: 'Utilizadores' },
    coletor:    { cor: 'bg-yellow-400/20 text-yellow-300', label: 'Coletadores'  },
    empresa:    { cor: 'bg-purple-400/20 text-purple-300', label: 'Empresas'     },
  };
  const { cor, label } = mapa[publico] || { cor: 'bg-white/10 text-white/50', label: publico };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${cor}`}>
      {label}
    </span>
  );
}