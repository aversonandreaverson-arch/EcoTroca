// ============================================================
// api.js — Ficheiro central de comunicação com o backend
// Todos os pedidos ao servidor passam por aqui
// Backend corre em: http://localhost:3000
// ============================================================

const BASE_URL = 'http://localhost:3000/api';

// ---------------------------------------------------------
// Função auxiliar: faz o fetch com token JWT automaticamente
// Uso interno - não precisas chamar diretamente
// ---------------------------------------------------------
const pedido = async (endpoint, opcoes = {}) => {
  // Busca o token guardado no login
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    // Se existe token, adicionar no cabeçalho
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opcoes.headers,
  };

  const resposta = await fetch(`${BASE_URL}${endpoint}`, {
    ...opcoes,
    headers,
  });

  // Se o token expirar (401), fazer logout automático
  if (resposta.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/Login';
    return;
  }

  const dados = await resposta.json();

  // Se o servidor devolveu erro, lançar uma exceção
  if (!resposta.ok) {
    throw new Error(dados.erro || 'Erro no servidor');
  }

  return dados;
};

// ============================================================
// AUTENTICAÇÃO
// ============================================================

// Login — devolve { token, tipo_usuario, nome }
export const login = async (emailOuTelefone, senha) => {
  const dados = await pedido('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailOuTelefone, senha }),
  });

  // Guarda o token e dados do utilizador para uso futuro
  localStorage.setItem('token', dados.token);
  localStorage.setItem('usuario', JSON.stringify({
    nome: dados.nome,
    tipo: dados.tipo_usuario,
  }));

  return dados;
};

// Registo — devolve { token, id_usuario }
export const registar = async (dadosFormulario) => {
  const dados = await pedido('/auth/registar', {
    method: 'POST',
    body: JSON.stringify(dadosFormulario),
  });

  localStorage.setItem('token', dados.token);
  return dados;
};

// Logout — limpa tudo e redireciona para o login
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/Login';
};

// Verifica se o utilizador está autenticado
export const estaAutenticado = () => {
  return !!localStorage.getItem('token');
};

// Devolve os dados básicos do utilizador guardados localmente
export const getUtilizadorLocal = () => {
  const dados = localStorage.getItem('usuario');
  return dados ? JSON.parse(dados) : null;
};

// ============================================================
// UTILIZADOR
// ============================================================

// Ver perfil completo do utilizador autenticado
export const getPerfil = () => pedido('/usuarios/perfil');

// Actualizar perfil
export const actualizarPerfil = (dados) =>
  pedido('/usuarios/perfil', {
    method: 'PUT',
    body: JSON.stringify(dados),
  });

// Ver pontuação e nível do utilizador
export const getPontuacao = () => pedido('/usuarios/pontuacao');

// Recuperação de senha — envia email/telefone
export const recuperarSenha = (emailOuTelefone) =>
  pedido('/auth/recuperar-senha', {
    method: 'POST',
    body: JSON.stringify({ emailOuTelefone }),
  });

// Redefinir senha com token
export const redefinirSenha = (token, novaSenha) =>
  pedido(`/auth/redefinir-senha/${token}`, {
    method: 'POST',
    body: JSON.stringify({ senha: novaSenha }),
  });

// ============================================================
// ENTREGAS (Resíduos)
// ============================================================

// Listar todas as entregas do utilizador autenticado
export const getMinhasEntregas = () => pedido('/entregas');

// Ver detalhes de uma entrega
export const getEntrega = (id) => pedido(`/entregas/${id}`);

// Criar nova entrega (publicar resíduo)
export const criarEntrega = (dados) =>
  pedido('/entregas', {
    method: 'POST',
    body: JSON.stringify(dados),
  });

// Cancelar entrega
export const cancelarEntrega = (id) =>
  pedido(`/entregas/${id}/cancelar`, {
    method: 'PATCH',
  });

// ============================================================
// COLETADOR
// ============================================================

// Ver entregas pendentes (só para coletadores)
export const getEntregasPendentes = () =>
  pedido('/coletador/entregas/pendentes');

// Aceitar uma entrega
export const aceitarEntrega = (id) =>
  pedido(`/coletador/entregas/${id}/aceitar`, {
    method: 'PATCH',
  });

// Marcar entrega como recolhida
export const recolherEntrega = (id) =>
  pedido(`/coletador/entregas/${id}/recolher`, {
    method: 'PATCH',
  });

// ============================================================
// CHAT
// ============================================================

// Ver mensagens de uma entrega
export const getMensagens = (idEntrega) =>
  pedido(`/chat/${idEntrega}/mensagens`);

// Enviar mensagem
export const enviarMensagem = (idEntrega, mensagem) =>
  pedido(`/chat/${idEntrega}/mensagens`, {
    method: 'POST',
    body: JSON.stringify({ mensagem }),
  });

// ============================================================
// NOTIFICAÇÕES
// ============================================================

// Listar notificações do utilizador
export const getNotificacoes = () => pedido('/notificacoes');

// Marcar notificação como lida
export const marcarNotificacaoLida = (id) =>
  pedido(`/notificacoes/${id}/ler`, {
    method: 'PATCH',
  });

// ============================================================
// EMPRESAS
// ============================================================

// Listar todas as empresas recicladoras
export const getEmpresas = () => pedido('/empresas');

// Ver detalhes de uma empresa
export const getEmpresa = (id) => pedido(`/empresas/${id}`);

// ============================================================
// ADMIN
// ============================================================

// Estatísticas gerais (só para admins)
export const getEstatisticas = () => pedido('/admin/stats');

// Listar todos os utilizadores (só para admins)
export const getUtilizadores = () => pedido('/admin/usuarios');

// Listar todas as entregas (só para admins)
export const getTodasEntregas = () => pedido('/admin/entregas');
