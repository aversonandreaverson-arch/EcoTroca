
//  O que esta página faz:
//  Mostra todos os utilizadores, coletadores e empresas
//  registados na plataforma. O admin pode:
//  - Filtrar por tipo (todos, utilizador, coletador, empresa)
//  - Pesquisar por nome ou email
//  - Ver estado de cada conta (activa, suspensa, bloqueada)
//  - Aplicar advertência (Regra 13 e empresa)
//  - Suspender conta por 1 semana (Regra 13 — 2ª ocorrência)
//  - Bloquear permanentemente (Regra 14 — coletador que desviou)
//  - Reactivar conta suspensa ou bloqueada
// ============================================================

import { useState, useEffect } from 'react';
import {
  Users, Search, AlertTriangle, Ban,
  CheckCircle, Clock, Shield, RefreshCw
} from 'lucide-react';
import Header from './Header.jsx';
import {
  getAdminUtilizadores,
  aplicarAdvertencia,
  suspenderUtilizador,
  bloquearUtilizador,
  reativarUtilizador
} from '../../api.js';

export default function AdminUtilizadores() {

  // lista → todos os utilizadores vindos da API
  const [lista, setLista] = useState([]);

  // filtroTipo → filtra por tipo de utilizador
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // pesquisa → texto digitado na barra de pesquisa
  const [pesquisa, setPesquisa] = useState('');

  // carregando → true enquanto os dados ainda não chegaram
  const [carregando, setCarregando] = useState(true);

  // erro → mensagem de erro se a API falhar
  const [erro, setErro] = useState('');

  // modalAberto → guarda o utilizador cujo modal de acção está aberto
  // null = nenhum modal aberto
  const [modalAberto, setModalAberto] = useState(null);

  // motivoAcao → texto que o admin escreve para justificar a acção
  const [motivoAcao, setMotivoAcao] = useState('');

  // acaoEmCurso → evita cliques duplos enquanto espera a API
  const [acaoEmCurso, setAcaoEmCurso] = useState(false);

  // ── Carrega a lista ao abrir a página ──
  useEffect(() => {
    carregarLista();
  }, []);

  // Função que vai buscar todos os utilizadores à API
  const carregarLista = async () => {
    try {
      setCarregando(true);
      // GET /api/admin/utilizadores — devolve todos os tipos
      const dados = await getAdminUtilizadores();
      setLista(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // ── Filtragem local (não precisa de ir ao servidor) ──
  // Primeiro filtra por tipo, depois pela pesquisa de texto
  const listaFiltrada = lista
    .filter(u => filtroTipo === 'todos' || u.tipo_usuario === filtroTipo)
    .filter(u => {
      // Se não há texto de pesquisa, mostra todos
      if (!pesquisa) return true;
      const termo = pesquisa.toLowerCase();
      // Verifica se o nome ou email contém o texto pesquisado
      return (
        u.nome?.toLowerCase().includes(termo) ||
        u.email?.toLowerCase().includes(termo) ||
        u.telefone?.includes(termo)
      );
    });

  // ── Acções do admin ──

  // Aplica uma advertência ao utilizador (Regra 13 — 1ª ocorrência)
  const handleAdvertencia = async (u) => {
    if (!motivoAcao.trim()) {
      alert('Escreve o motivo da advertência.');
      return;
    }
    try {
      setAcaoEmCurso(true);
      // PATCH /api/admin/utilizadores/:id/advertencia
      await aplicarAdvertencia(u.id_usuario, u.tipo_usuario, motivoAcao);
      setModalAberto(null);
      setMotivoAcao('');
      // Recarrega a lista para mostrar o estado actualizado
      await carregarLista();
    } catch (err) {
      alert(err.message);
    } finally {
      setAcaoEmCurso(false);
    }
  };

  // Suspende a conta por 1 semana (Regra 13 — 2ª ocorrência)
  const handleSuspender = async (u) => {
    if (!motivoAcao.trim()) {
      alert('Escreve o motivo da suspensão.');
      return;
    }
    try {
      setAcaoEmCurso(true);
      // PATCH /api/admin/utilizadores/:id/suspender
      await suspenderUtilizador(u.id_usuario, u.tipo_usuario, motivoAcao);
      setModalAberto(null);
      setMotivoAcao('');
      await carregarLista();
    } catch (err) {
      alert(err.message);
    } finally {
      setAcaoEmCurso(false);
    }
  };

  // Bloqueia permanentemente (Regra 14 — desvio do coletador)
  const handleBloquear = async (u) => {
    if (!motivoAcao.trim()) {
      alert('Escreve o motivo do bloqueio.');
      return;
    }
    // Confirmação extra antes de bloquear permanentemente
    if (!window.confirm(`Tens a certeza que queres bloquear permanentemente ${u.nome}?`)) return;
    try {
      setAcaoEmCurso(true);
      // PATCH /api/admin/utilizadores/:id/bloquear
      await bloquearUtilizador(u.id_usuario, u.tipo_usuario, motivoAcao);
      setModalAberto(null);
      setMotivoAcao('');
      await carregarLista();
    } catch (err) {
      alert(err.message);
    } finally {
      setAcaoEmCurso(false);
    }
  };

  // Reactiva uma conta suspensa ou bloqueada
  const handleReativar = async (u) => {
    if (!window.confirm(`Reactivar a conta de ${u.nome}?`)) return;
    try {
      setAcaoEmCurso(true);
      // PATCH /api/admin/utilizadores/:id/reativar
      await reativarUtilizador(u.id_usuario, u.tipo_usuario);
      await carregarLista();
    } catch (err) {
      alert(err.message);
    } finally {
      setAcaoEmCurso(false);
    }
  };

  // ── Ecrã de carregamento ──
  if (carregando) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-white text-lg">A carregar utilizadores...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pt-24 p-6">
      <Header />

      {/* Cabeçalho da página */}
      <div className="bg-white/10 text-white rounded-2xl p-6 shadow-lg mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Users size={24} /> Gestão de Utilizadores
        </h2>
        <p className="opacity-70 text-sm mt-1">
          {lista.length} contas registadas na plataforma
        </p>
      </div>

      {/* ── Barra de pesquisa e filtros ── */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">

        {/* Campo de pesquisa por nome, email ou telefone */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-white/40" />
          <input
            type="text"
            placeholder="Pesquisar por nome, email ou telefone..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-white/40"
          />
        </div>

        {/* Filtro por tipo de utilizador */}
        <div className="flex gap-2 flex-wrap">
          {/* Cada botão filtra por um tipo diferente */}
          {[
            { valor: 'todos',     label: 'Todos'      },
            { valor: 'comum',     label: 'Utilizadores' },
            { valor: 'coletor',   label: 'Coletadores'  },
            { valor: 'empresa',   label: 'Empresas'     },
          ].map(f => (
            <button
              key={f.valor}
              onClick={() => setFiltroTipo(f.valor)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filtroTipo === f.valor
                  ? 'bg-white text-gray-900'         // activo → fundo branco
                  : 'bg-white/10 text-white/70 hover:bg-white/20' // inactivo
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista de utilizadores ── */}
      <div className="space-y-3">

        {/* Se não há resultados após filtrar */}
        {listaFiltrada.length === 0 && (
          <p className="text-white/50 text-center py-12">
            Nenhum utilizador encontrado.
          </p>
        )}

        {/* Uma linha por utilizador */}
        {listaFiltrada.map((u) => (
          <div
            key={u.id_usuario}
            className="bg-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* ── Informações do utilizador ── */}
            <div className="flex items-start gap-4">

              {/* Avatar com inicial do nome */}
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg shrink-0">
                {u.nome?.charAt(0).toUpperCase()}
              </div>

              <div>
                {/* Nome e tipo */}
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold">{u.nome}</p>
                  <BadgeTipo tipo={u.tipo_usuario} />
                  {/* Mostra o estado da conta se não for normal */}
                  <BadgeEstadoConta u={u} />
                </div>

                {/* Email e telefone */}
                <p className="text-white/50 text-sm">{u.email}</p>
                <p className="text-white/50 text-sm">{u.telefone}</p>

                {/* Advertências acumuladas */}
                {u.advertencias > 0 && (
                  <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {u.advertencias} advertência(s)
                  </p>
                )}

                {/* Data de fim de suspensão */}
                {u.suspenso_ate && new Date(u.suspenso_ate) > new Date() && (
                  <p className="text-orange-400 text-xs mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    Suspenso até {new Date(u.suspenso_ate).toLocaleDateString('pt-AO')}
                  </p>
                )}
              </div>
            </div>

            {/* ── Botões de acção ── */}
            <div className="flex gap-2 flex-wrap justify-end">

              {/* Se a conta estiver bloqueada ou suspensa, mostra só Reactivar */}
              {(u.bloqueado_permanente || (u.suspenso_ate && new Date(u.suspenso_ate) > new Date())) ? (
                <button
                  onClick={() => handleReativar(u)}
                  className="flex items-center gap-1 bg-green-500/20 hover:bg-green-500/40 text-green-300 text-xs px-3 py-2 rounded-lg transition"
                >
                  <RefreshCw size={14} /> Reactivar
                </button>
              ) : (
                <>
                  {/* Advertência — 1ª penalização */}
                  <button
                    onClick={() => { setModalAberto({ ...u, acao: 'advertencia' }); setMotivoAcao(''); }}
                    className="flex items-center gap-1 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 text-xs px-3 py-2 rounded-lg transition"
                  >
                    <AlertTriangle size={14} /> Advertir
                  </button>

                  {/* Suspensão — 1 semana */}
                  <button
                    onClick={() => { setModalAberto({ ...u, acao: 'suspender' }); setMotivoAcao(''); }}
                    className="flex items-center gap-1 bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 text-xs px-3 py-2 rounded-lg transition"
                  >
                    <Clock size={14} /> Suspender
                  </button>

                  {/* Bloqueio permanente */}
                  <button
                    onClick={() => { setModalAberto({ ...u, acao: 'bloquear' }); setMotivoAcao(''); }}
                    className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs px-3 py-2 rounded-lg transition"
                  >
                    <Ban size={14} /> Bloquear
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal de confirmação de acção ── */}
      {/* Aparece quando o admin clica num botão de acção */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">

            {/* Título do modal conforme a acção */}
            <h3 className="text-white font-bold text-lg mb-2">
              {modalAberto.acao === 'advertencia' && '⚠️ Aplicar Advertência'}
              {modalAberto.acao === 'suspender'   && '⏸️ Suspender por 1 Semana'}
              {modalAberto.acao === 'bloquear'    && '🚫 Bloquear Permanentemente'}
            </h3>

            {/* Nome do utilizador afectado */}
            <p className="text-white/60 text-sm mb-4">
              Utilizador: <span className="text-white font-medium">{modalAberto.nome}</span>
            </p>

            {/* Campo de motivo — obrigatório */}
            <label className="text-white/70 text-sm block mb-2">
              Motivo (obrigatório)
            </label>
            <textarea
              value={motivoAcao}
              onChange={(e) => setMotivoAcao(e.target.value)}
              placeholder="Descreve o motivo desta acção..."
              rows={3}
              className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl p-3 text-sm focus:outline-none focus:border-white/40 resize-none mb-4"
            />

            {/* Botões de confirmar e cancelar */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setModalAberto(null); setMotivoAcao(''); }}
                className="px-4 py-2 text-white/60 hover:text-white text-sm transition"
              >
                Cancelar
              </button>
              <button
                disabled={acaoEmCurso || !motivoAcao.trim()}
                onClick={() => {
                  // Chama a função correcta conforme a acção escolhida
                  if (modalAberto.acao === 'advertencia') handleAdvertencia(modalAberto);
                  if (modalAberto.acao === 'suspender')   handleSuspender(modalAberto);
                  if (modalAberto.acao === 'bloquear')    handleBloquear(modalAberto);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
                  modalAberto.acao === 'advertencia' ? 'bg-yellow-500 text-black' :
                  modalAberto.acao === 'suspender'   ? 'bg-orange-500 text-white' :
                                                       'bg-red-600 text-white'
                }`}
              >
                {acaoEmCurso ? 'A processar...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BadgeTipo ────────────────────────────────────────────────
// Etiqueta colorida que mostra o tipo de utilizador
function BadgeTipo({ tipo }) {
  const mapa = {
    comum:    { cor: 'bg-blue-400/20 text-blue-300',   label: 'Utilizador' },
    coletor:  { cor: 'bg-green-400/20 text-green-300', label: 'Coletador'  },
    empresa:  { cor: 'bg-purple-400/20 text-purple-300', label: 'Empresa'  },
    admin:    { cor: 'bg-gray-400/20 text-gray-300',   label: 'Admin'      },
  };
  const { cor, label } = mapa[tipo] || { cor: 'bg-white/10 text-white/50', label: tipo };
  return <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${cor}`}>{label}</span>;
}

// ── BadgeEstadoConta ─────────────────────────────────────────
// Mostra o estado da conta — só aparece se não for normal
function BadgeEstadoConta({ u }) {
  // Conta bloqueada permanentemente
  if (u.bloqueado_permanente) {
    return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-300">Bloqueada</span>;
  }
  // Conta suspensa (verifica se a data de suspensão ainda não passou)
  if (u.suspenso_ate && new Date(u.suspenso_ate) > new Date()) {
    return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-300">Suspensa</span>;
  }
  // Conta desactivada pelo admin (campo ativo = 0)
  if (!u.ativo) {
    return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-500/20 text-gray-400">Inactiva</span>;
  }
  // Conta normal — não mostra nada
  return null;
}