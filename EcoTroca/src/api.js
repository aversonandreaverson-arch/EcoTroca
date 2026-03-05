// ============================================================
// api.js — Ficheiro central de comunicação com o backend
// Todos os pedidos ao servidor passam por aqui
// Backend corre em: http://localhost:3000
// ============================================================

const BASE_URL = 'http://localhost:3000/api';

const pedido = async (endpoint, opcoes = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opcoes.headers,
  };
  const resposta = await fetch(`${BASE_URL}${endpoint}`, { ...opcoes, headers });
  if (resposta.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/Login';
    return;
  }
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || 'Erro no servidor');
  return dados;
};

// ============================================================
// AUTENTICAÇÃO
// ============================================================

export const login = async (emailOuTelefone, senha) => {
  const dados = await pedido('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailOuTelefone, senha }),
  });
  localStorage.setItem('token', dados.token);
  localStorage.setItem('usuario', JSON.stringify({ nome: dados.nome, tipo: dados.tipo_usuario }));
  return dados;
};

export const registar = async (dadosFormulario) => {
  const dados = await pedido('/auth/registar', {
    method: 'POST',
    body: JSON.stringify(dadosFormulario),
  });
  localStorage.setItem('token', dados.token);
  return dados;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/Login';
};

export const estaAutenticado    = () => !!localStorage.getItem('token');
export const getUtilizadorLocal = () => {
  const dados = localStorage.getItem('usuario');
  return dados ? JSON.parse(dados) : null;
};

// ============================================================
// UTILIZADOR
// ============================================================

export const getPerfil        = () => pedido('/usuarios/perfil');
export const actualizarPerfil = (dados) => pedido('/usuarios/perfil', { method: 'PUT', body: JSON.stringify(dados) });
export const getPontuacao     = () => pedido('/usuarios/pontuacao');
export const recuperarSenha   = (emailOuTelefone) => pedido('/auth/recuperar-senha', { method: 'POST', body: JSON.stringify({ emailOuTelefone }) });
export const redefinirSenha   = (token, novaSenha) => pedido(`/auth/redefinir-senha/${token}`, { method: 'POST', body: JSON.stringify({ senha: novaSenha }) });

// ============================================================
// CARTEIRA
// ============================================================

export const getCarteira = () => pedido('/usuarios/carteira');

// ============================================================
// ENTREGAS — utilizador comum
// ============================================================

export const getMinhasEntregas = () => pedido('/entregas');
export const getEntrega        = (id) => pedido(`/entregas/${id}`);
export const criarEntrega      = (dados) => pedido('/entregas', { method: 'POST', body: JSON.stringify(dados) });
export const editarEntrega     = (id, dados) => pedido(`/entregas/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
export const cancelarEntrega   = (id) => pedido(`/entregas/${id}/cancelar`, { method: 'PATCH' });

// ============================================================
// COLETADOR
// ============================================================

export const getEntregasPendentes      = () => pedido('/coletador/entregas/pendentes');
export const getMinhasColetasColetador = () => pedido('/coletador/entregas/minhas');
export const aceitarEntrega            = (id) => pedido(`/coletador/entregas/${id}/aceitar`, { method: 'PATCH' });
export const recolherEntrega           = (id) => pedido(`/coletador/entregas/${id}/recolher`, { method: 'PATCH' });

// ============================================================
// EMPRESA
// ============================================================

export const getPerfilEmpresa          = () => pedido('/empresas/perfil');
export const atualizarEmpresa          = (dados) => pedido('/empresas/perfil', { method: 'PUT', body: JSON.stringify(dados) });
export const getEntregasEmpresa        = () => pedido('/empresas/minhas/entregas');
export const aceitarEntregaEmpresa     = (id) => pedido(`/empresas/minhas/entregas/${id}/aceitar`, { method: 'POST' });
export const rejeitarEntregaEmpresa    = (id, motivo, pede_foto, pede_limpeza) => pedido(`/empresas/minhas/entregas/${id}/rejeitar`, { method: 'POST', body: JSON.stringify({ motivo, pede_foto, pede_limpeza }) });
export const getColetadoresEmpresa     = () => pedido('/empresas/minhas/coletadores');
export const adicionarColetadorEmpresa = (id_coletador, telefone) => pedido('/empresas/minhas/coletadores', { method: 'POST', body: JSON.stringify({ id_coletador, telefone }) });
export const removerColetadorEmpresa   = (id) => pedido(`/empresas/minhas/coletadores/${id}`, { method: 'DELETE' });
export const getEventosEmpresa         = () => pedido('/empresas/minhas/eventos');
export const criarEventoEmpresa        = (dados) => pedido('/empresas/minhas/eventos', { method: 'POST', body: JSON.stringify(dados) });

// ============================================================
// EVENTOS
// ============================================================

export const getEventos   = () => pedido('/eventos');
export const getEvento    = (id) => pedido(`/eventos/${id}`);
export const editarEvento = (id, dados) => pedido(`/eventos/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
export const apagarEvento = (id) => pedido(`/eventos/${id}`, { method: 'DELETE' });

// ============================================================
// CHAT
// ============================================================

export const getMensagens   = (idEntrega) => pedido(`/chat/${idEntrega}/mensagens`);
export const enviarMensagem = (idEntrega, mensagem) => pedido(`/chat/${idEntrega}/mensagens`, { method: 'POST', body: JSON.stringify({ mensagem }) });

// ============================================================
// NOTIFICAÇÕES
// ============================================================

export const getNotificacoes       = () => pedido('/notificacoes');
export const marcarNotificacaoLida = (id) => pedido(`/notificacoes/${id}/ler`, { method: 'PATCH' });

// ============================================================
// RESÍDUOS
// ============================================================

export const getResiduos = () => pedido('/residuos');

// ============================================================
// FEED — publicações
// ============================================================

export const getFeed          = () => pedido('/feed');
export const getPublicacoes   = () => pedido('/feed');
export const criarPublicacao  = (dados) => pedido('/feed', { method: 'POST', body: JSON.stringify(dados) });
export const apagarPublicacao = (id) => pedido(`/feed/${id}`, { method: 'DELETE' });

// ============================================================
// PERFIL PÚBLICO
// ============================================================

export const getPerfilPublico = (id) => pedido(`/perfilpublico/${id}`);

// ============================================================
// EMPRESAS — listagem pública
// ============================================================

export const getEmpresas = () => pedido('/empresas');
export const getEmpresa  = (id) => pedido(`/empresas/${id}`);

// ============================================================
// ADMIN
// ============================================================

export const getEstatisticas      = () => pedido('/admin/stats');
export const getUtilizadores      = () => pedido('/admin/usuarios');
export const getTodasEntregas     = () => pedido('/admin/entregas');
export const getDashboardAdmin    = () => pedido('/admin/dashboard');
export const getAdminUtilizadores = () => pedido('/admin/utilizadores');

export const aplicarAdvertencia  = (id, tipo, motivo) => pedido(`/admin/utilizadores/${id}/advertencia`, { method: 'PATCH', body: JSON.stringify({ tipo, motivo }) });
export const suspenderUtilizador = (id, tipo, motivo) => pedido(`/admin/utilizadores/${id}/suspender`, { method: 'PATCH', body: JSON.stringify({ tipo, motivo }) });
export const bloquearUtilizador  = (id, tipo, motivo) => pedido(`/admin/utilizadores/${id}/bloquear`, { method: 'PATCH', body: JSON.stringify({ tipo, motivo }) });
export const reativarUtilizador  = (id, tipo) => pedido(`/admin/utilizadores/${id}/reativar`, { method: 'PATCH', body: JSON.stringify({ tipo }) });

export const getAdminEducacao = () => pedido('/educacao');
export const criarEducacao    = (dados) => pedido('/admin/educacao', { method: 'POST', body: JSON.stringify(dados) });
export const editarEducacao   = (id, dados) => pedido(`/admin/educacao/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
export const apagarEducacao   = (id) => pedido(`/admin/educacao/${id}`, { method: 'DELETE' });

export const getRelatoriosAdmin = (periodo = 'mes') => pedido(`/admin/relatorios?periodo=${periodo}`);