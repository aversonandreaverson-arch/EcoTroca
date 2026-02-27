// ============================================================
// api.js — Ficheiro central de comunicação com o backend
// Todos os pedidos ao servidor passam por aqui
// Backend corre em: http://localhost:3000
// ============================================================

const BASE_URL = 'http://localhost:3000/api';

// ---------------------------------------------------------
// Função auxiliar: faz o fetch com token JWT automaticamente
// ---------------------------------------------------------
const pedido = async (endpoint, opcoes = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opcoes.headers,
  };

  const resposta = await fetch(`${BASE_URL}${endpoint}`, {
    ...opcoes,
    headers,
  });

  if (resposta.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/Login';
    return;
  }

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Erro no servidor');
  }

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
  localStorage.setItem('usuario', JSON.stringify({
    nome: dados.nome,
    tipo: dados.tipo_usuario,
  }));
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

export const estaAutenticado = () => !!localStorage.getItem('token');

export const getUtilizadorLocal = () => {
  const dados = localStorage.getItem('usuario');
  return dados ? JSON.parse(dados) : null;
};

// ============================================================
// UTILIZADOR
// ============================================================

export const getPerfil = () => pedido('/usuarios/perfil');

export const actualizarPerfil = (dados) =>
  pedido('/usuarios/perfil', {
    method: 'PUT',
    body: JSON.stringify(dados),
  });

export const getPontuacao = () => pedido('/usuarios/pontuacao');

export const recuperarSenha = (emailOuTelefone) =>
  pedido('/auth/recuperar-senha', {
    method: 'POST',
    body: JSON.stringify({ emailOuTelefone }),
  });

export const redefinirSenha = (token, novaSenha) =>
  pedido(`/auth/redefinir-senha/${token}`, {
    method: 'POST',
    body: JSON.stringify({ senha: novaSenha }),
  });

// ============================================================
// CARTEIRA — dinheiro (sacável) e saldo (só na app)
// ============================================================

// Ver carteira do utilizador autenticado (utilizador ou coletador)
export const getCarteira = () => pedido('/usuarios/carteira');

// ============================================================
// ENTREGAS (Utilizador comum)
// ============================================================

export const getMinhasEntregas = () => pedido('/entregas');

export const getEntrega = (id) => pedido(`/entregas/${id}`);

export const criarEntrega = (dados) =>
  pedido('/entregas', {
    method: 'POST',
    body: JSON.stringify(dados),
  });

export const cancelarEntrega = (id) =>
  pedido(`/entregas/${id}/cancelar`, { method: 'PATCH' });

// ============================================================
// COLETADOR
// ============================================================

// Entregas pendentes disponíveis para aceitar (só domicílio)
export const getEntregasPendentes = () =>
  pedido('/coletador/entregas/pendentes');

// Entregas aceites pelo coletador autenticado (histórico)
export const getMinhasColetasColetador = () =>
  pedido('/coletador/entregas/minhas');

// Aceitar uma entrega pendente
export const aceitarEntrega = (id) =>
  pedido(`/coletador/entregas/${id}/aceitar`, { method: 'PATCH' });

// Marcar entrega como recolhida (após confirmação do utilizador)
export const recolherEntrega = (id) =>
  pedido(`/coletador/entregas/${id}/recolher`, { method: 'PATCH' });

// ============================================================
// CHAT
// ============================================================

export const getMensagens = (idEntrega) =>
  pedido(`/chat/${idEntrega}/mensagens`);

export const enviarMensagem = (idEntrega, mensagem) =>
  pedido(`/chat/${idEntrega}/mensagens`, {
    method: 'POST',
    body: JSON.stringify({ mensagem }),
  });

// ============================================================
// NOTIFICAÇÕES
// ============================================================

export const getNotificacoes = () => pedido('/notificacoes');

export const marcarNotificacaoLida = (id) =>
  pedido(`/notificacoes/${id}/ler`, { method: 'PATCH' });

// ============================================================
// RESÍDUOS
// ============================================================

// Lista todos os tipos de resíduos com valor por kg
export const getResiduos = () => pedido('/residuos');

// ============================================================
// EMPRESAS
// ============================================================

export const getEmpresas = () => pedido('/empresas');

export const getEmpresa = (id) => pedido(`/empresas/${id}`);

// ============================================================
// ADMIN
// ============================================================

export const getEstatisticas = () => pedido('/admin/stats');

export const getUtilizadores = () => pedido('/admin/usuarios');

export const getTodasEntregas = () => pedido('/admin/entregas');