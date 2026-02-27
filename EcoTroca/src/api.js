// ============================================================
// api.js — Ficheiro central de comunicação com o backend
// Todos os pedidos ao servidor passam por aqui
// Backend corre em: http://localhost:3000
// ============================================================

const BASE_URL = 'http://localhost:3000/api';

// ─────────────────────────────────────────────────────────────
// Função auxiliar: faz o fetch com token JWT automaticamente
// Uso interno — não precisas chamar diretamente
// ─────────────────────────────────────────────────────────────
const pedido = async (endpoint, opcoes = {}) => {
  // Busca o token guardado no login
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    // Se existe token, adiciona no cabeçalho Authorization
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opcoes.headers,
  };

  const resposta = await fetch(`${BASE_URL}${endpoint}`, {
    ...opcoes,
    headers,
  });

  // Se o token expirar (401), faz logout automático
  if (resposta.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/Login';
    return;
  }

  const dados = await resposta.json();

  // Se o servidor devolveu erro, lança uma exceção
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
export const estaAutenticado = () => !!localStorage.getItem('token');

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

// Atualizar perfil
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
// CARTEIRA — dinheiro (sacável) e saldo (só na app)
// ============================================================

// Ver carteira do utilizador autenticado (utilizador, coletador ou empresa)
export const getCarteira = () => pedido('/usuarios/carteira');

// ============================================================
// ENTREGAS (Utilizador comum)
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
// EMPRESA
// ============================================================

// Busca o perfil da empresa autenticada
export const getPerfilEmpresa = () => pedido('/empresas/perfil');

// Atualiza os dados da empresa
export const atualizarEmpresa = (id, dados) =>
  pedido(`/empresas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });

// Lista as entregas destinadas à empresa autenticada
export const getEntregasEmpresa = () => pedido('/empresas/minhas/entregas');

// Aceita uma entrega — processa pagamento ao utilizador (Regra 16)
export const aceitarEntregaEmpresa = (idEntrega) =>
  pedido(`/empresas/minhas/entregas/${idEntrega}/aceitar`, { method: 'POST' });

// Rejeita uma entrega com motivo obrigatório (Regra 17)
export const rejeitarEntregaEmpresa = (idEntrega, motivo, pede_foto, pede_limpeza) =>
  pedido(`/empresas/minhas/entregas/${idEntrega}/rejeitar`, {
    method: 'POST',
    body: JSON.stringify({ motivo, pede_foto, pede_limpeza }),
  });

// Lista coletadores dependentes da empresa
export const getColetadoresEmpresa = () => pedido('/empresas/minhas/coletadores');

// Adiciona um coletador independente à empresa
export const adicionarColetadorEmpresa = (id_coletador) =>
  pedido('/empresas/minhas/coletadores', {
    method: 'POST',
    body: JSON.stringify({ id_coletador }),
  });

// Remove coletador da empresa (volta a ser independente)
export const removerColetadorEmpresa = (idColetador) =>
  pedido(`/empresas/minhas/coletadores/${idColetador}`, { method: 'DELETE' });

// Lista eventos criados pela empresa autenticada
export const getEventosEmpresa = () => pedido('/empresas/minhas/eventos');

// Cria novo evento (só empresa e admin podem criar)
export const criarEventoEmpresa = (dados) =>
  pedido('/empresas/minhas/eventos', {
    method: 'POST',
    body: JSON.stringify(dados),
  });

// ============================================================
// EVENTOS — visíveis para todos os utilizadores
// ============================================================

// Lista todos os eventos ativos (para utilizadores e coletadores verem)
export const getEventos = () => pedido('/eventos');

// Ver detalhes de um evento
export const getEvento = (id) => pedido(`/eventos/${id}`);

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
  pedido(`/notificacoes/${id}/ler`, { method: 'PATCH' });

// ============================================================
// RESÍDUOS
// ============================================================

// Lista todos os tipos de resíduos com valor por kg
export const getResiduos = () => pedido('/residuos');

// ============================================================
// EMPRESAS — listagem pública
// ============================================================

// Listar todas as empresas ativas
export const getEmpresas = () => pedido('/empresas');

// Ver detalhes de uma empresa específica
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