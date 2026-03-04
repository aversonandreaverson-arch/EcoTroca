
// BASE_URL → endereço base do servidor — todos os pedidos começam aqui
const BASE_URL = 'http://localhost:3000/api';

// ─────────────────────────────────────────────────────────────
// pedido() — função interna que uso em todas as chamadas à API
// Adiciona automaticamente o token JWT ao cabeçalho de cada pedido
// Não exporto esta função — só as funções específicas abaixo
// ─────────────────────────────────────────────────────────────
const pedido = async (endpoint, opcoes = {}) => {
  // Vou buscar o token guardado no localStorage após o login
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    // Se tiver token, adiciona-o ao cabeçalho Authorization
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opcoes.headers,
  };

  // Faz o pedido HTTP ao servidor com o endpoint e as opções fornecidas
  const resposta = await fetch(`${BASE_URL}${endpoint}`, {
    ...opcoes,
    headers,
  });

  // Se o servidor devolver 401 (não autorizado), o token expirou
  // Limpo os dados locais e redireciono para o Login
  if (resposta.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/Login';
    return;
  }

  // Converto a resposta para JSON
  const dados = await resposta.json();

  // Se a resposta não foi bem sucedida, lanço um erro com a mensagem do servidor
  if (!resposta.ok) {
    throw new Error(dados.erro || 'Erro no servidor');
  }

  return dados;
};

// ============================================================
// AUTENTICAÇÃO
// ============================================================

// login() — autentica o utilizador e guarda o token no localStorage
export const login = async (emailOuTelefone, senha) => {
  const dados = await pedido('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailOuTelefone, senha }),
  });
  // Guardo o token para usar nas próximas chamadas
  localStorage.setItem('token', dados.token);
  // Guardo o nome e tipo para usar no frontend sem ir à API
  localStorage.setItem('usuario', JSON.stringify({
    nome: dados.nome,
    tipo: dados.tipo_usuario,
  }));
  return dados;
};

// registar() — cria uma nova conta e guarda o token automaticamente
export const registar = async (dadosFormulario) => {
  const dados = await pedido('/auth/registar', {
    method: 'POST',
    body: JSON.stringify(dadosFormulario),
  });
  localStorage.setItem('token', dados.token);
  return dados;
};

// logout() — limpa os dados locais e redireciona para o Login
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/Login';
};

// estaAutenticado() — verifica se há token guardado
// Devolve true se autenticado, false se não
export const estaAutenticado = () => !!localStorage.getItem('token');

// getUtilizadorLocal() — devolve os dados do utilizador guardados localmente
// Uso isto para saber o nome e tipo sem ir ao servidor
export const getUtilizadorLocal = () => {
  const dados = localStorage.getItem('usuario');
  return dados ? JSON.parse(dados) : null;
};

// ============================================================
// UTILIZADOR
// ============================================================

// Vai buscar os dados completos do perfil do utilizador autenticado
export const getPerfil = () => pedido('/usuarios/perfil');

// Actualiza os dados do perfil do utilizador autenticado
export const actualizarPerfil = (dados) =>
  pedido('/usuarios/perfil', {
    method: 'PUT',
    body: JSON.stringify(dados),
  });

// Vai buscar a pontuação acumulada do utilizador
export const getPontuacao = () => pedido('/usuarios/pontuacao');

// Envia pedido de recuperação de senha para o email/telefone
export const recuperarSenha = (emailOuTelefone) =>
  pedido('/auth/recuperar-senha', {
    method: 'POST',
    body: JSON.stringify({ emailOuTelefone }),
  });

// Redefine a senha usando o token recebido por email
export const redefinirSenha = (token, novaSenha) =>
  pedido(`/auth/redefinir-senha/${token}`, {
    method: 'POST',
    body: JSON.stringify({ senha: novaSenha }),
  });

// ============================================================
// CARTEIRA
// ============================================================

// Vai buscar o saldo e histórico da carteira do utilizador
export const getCarteira = () => pedido('/usuarios/carteira');

// ============================================================
// ENTREGAS — utilizador comum
// ============================================================

// Vai buscar todas as entregas do utilizador autenticado
export const getMinhasEntregas = () => pedido('/entregas');

// Vai buscar os detalhes de uma entrega específica pelo ID
export const getEntrega = (id) => pedido(`/entregas/${id}`);

// Cria uma nova entrega com os dados do formulário
export const criarEntrega = (dados) =>
  pedido('/entregas', {
    method: 'POST',
    body: JSON.stringify(dados),
  });

// Cancela uma entrega que ainda está pendente
export const cancelarEntrega = (id) =>
  pedido(`/entregas/${id}/cancelar`, { method: 'PATCH' });

// ============================================================
// COLETADOR
// ============================================================

// Vai buscar todas as entregas pendentes disponíveis para recolha
export const getEntregasPendentes = () =>
  pedido('/coletador/entregas/pendentes');

// Vai buscar o histórico de coletas do coletador autenticado
export const getMinhasColetasColetador = () =>
  pedido('/coletador/entregas/minhas');

// Aceita uma entrega pendente — o coletador compromete-se a recolher
export const aceitarEntrega = (id) =>
  pedido(`/coletador/entregas/${id}/aceitar`, { method: 'PATCH' });

// Marca a entrega como recolhida — entrega concluída pelo coletador
export const recolherEntrega = (id) =>
  pedido(`/coletador/entregas/${id}/recolher`, { method: 'PATCH' });

// ============================================================
// EMPRESA
// ============================================================

// Vai buscar o perfil da empresa autenticada usando o token JWT
export const getPerfilEmpresa = () => pedido('/empresas/perfil');

// Actualiza os dados da empresa — não precisa de ID, usa o token
export const atualizarEmpresa = (dados) =>
  pedido('/empresas/perfil', {
    method: 'PUT',
    body: JSON.stringify(dados),
  });

// Vai buscar todas as entregas destinadas à empresa autenticada
export const getEntregasEmpresa = () => pedido('/empresas/minhas/entregas');

// Aceita uma entrega e processa o pagamento (Regra 16)
export const aceitarEntregaEmpresa = (idEntrega) =>
  pedido(`/empresas/minhas/entregas/${idEntrega}/aceitar`, { method: 'POST' });

// Rejeita uma entrega com motivo obrigatório (Regra 17)
export const rejeitarEntregaEmpresa = (idEntrega, motivo, pede_foto, pede_limpeza) =>
  pedido(`/empresas/minhas/entregas/${idEntrega}/rejeitar`, {
    method: 'POST',
    body: JSON.stringify({ motivo, pede_foto, pede_limpeza }),
  });

// Vai buscar os coletadores associados à empresa autenticada
export const getColetadoresEmpresa = () => pedido('/empresas/minhas/coletadores');

// Adiciona um coletador à empresa por ID ou por telefone
export const adicionarColetadorEmpresa = (id_coletador, telefone) =>
  pedido('/empresas/minhas/coletadores', {
    method: 'POST',
    body: JSON.stringify({ id_coletador, telefone }),
  });

// Remove um coletador da empresa pelo seu ID
export const removerColetadorEmpresa = (idColetador) =>
  pedido(`/empresas/minhas/coletadores/${idColetador}`, { method: 'DELETE' });

// Vai buscar os eventos criados pela empresa autenticada
export const getEventosEmpresa = () => pedido('/empresas/minhas/eventos');

// Cria um novo evento — só empresas e admin podem criar eventos
export const criarEventoEmpresa = (dados) =>
  pedido('/empresas/minhas/eventos', {
    method: 'POST',
    body: JSON.stringify(dados),
  });

// ============================================================
// EVENTOS — visíveis para todos os utilizadores autenticados
// ============================================================

// Vai buscar todos os eventos publicados na plataforma
export const getEventos = () => pedido('/eventos');

// Vai buscar os detalhes de um evento específico pelo ID
export const getEvento = (id) => pedido(`/eventos/${id}`);

// Edita um evento existente — só quem criou ou o admin pode editar
export const editarEvento = (id, dados) =>
  pedido(`/eventos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });

// Apaga (desactiva) um evento pelo ID
export const apagarEvento = (id) =>
  pedido(`/eventos/${id}`, { method: 'DELETE' });

// ============================================================
// CHAT
// ============================================================

// Vai buscar todas as mensagens de uma entrega específica
export const getMensagens = (idEntrega) =>
  pedido(`/chat/${idEntrega}/mensagens`);

// Envia uma nova mensagem no chat de uma entrega
export const enviarMensagem = (idEntrega, mensagem) =>
  pedido(`/chat/${idEntrega}/mensagens`, {
    method: 'POST',
    body: JSON.stringify({ mensagem }),
  });

// ============================================================
// NOTIFICAÇÕES
// ============================================================

// Vai buscar todas as notificações do utilizador autenticado
export const getNotificacoes = () => pedido('/notificacoes');

// Marca uma notificação como lida pelo seu ID
export const marcarNotificacaoLida = (id) =>
  pedido(`/notificacoes/${id}/ler`, { method: 'PATCH' });

// ============================================================
// RESÍDUOS
// ============================================================

// Vai buscar a lista de todos os tipos de resíduos disponíveis
export const getResiduos = () => pedido('/residuos');

// ============================================================
// EMPRESAS — listagem pública
// ============================================================

// Vai buscar a lista de todas as empresas recicladoras registadas
export const getEmpresas = () => pedido('/empresas');

// Vai buscar os detalhes de uma empresa específica pelo ID
export const getEmpresa = (id) => pedido(`/empresas/${id}`);

// ============================================================
// ADMIN
// ============================================================

// Vai buscar estatísticas gerais da plataforma (rota antiga)
export const getEstatisticas = () => pedido('/admin/stats');

// Vai buscar a lista de utilizadores (rota antiga)
export const getUtilizadores = () => pedido('/admin/usuarios');

// Vai buscar todas as entregas da plataforma (rota antiga)
export const getTodasEntregas = () => pedido('/admin/entregas');

// Vai buscar todas as estatísticas para o painel principal do admin
// Retorna: utilizadores, empresas, coletadores, entregas, financeiro, entregas_recentes
export const getDashboardAdmin = () => pedido('/admin/dashboard');

// Vai buscar todos os utilizadores, coletadores e empresas numa lista unificada
export const getAdminUtilizadores = () => pedido('/admin/utilizadores');

// Aplica advertência a um utilizador, coletador ou empresa (Regra 13)
// id → ID do utilizador | tipo → 'comum', 'coletor' ou 'empresa' | motivo → texto obrigatório
export const aplicarAdvertencia = (id, tipo, motivo) =>
  pedido(`/admin/utilizadores/${id}/advertencia`, {
    method: 'PATCH',
    body: JSON.stringify({ tipo, motivo }),
  });

// Suspende a conta por 1 semana (Regra 13 — 2ª ocorrência)
export const suspenderUtilizador = (id, tipo, motivo) =>
  pedido(`/admin/utilizadores/${id}/suspender`, {
    method: 'PATCH',
    body: JSON.stringify({ tipo, motivo }),
  });

// Bloqueia a conta permanentemente (Regra 14 — desvio do coletador / empresa não pagou)
export const bloquearUtilizador = (id, tipo, motivo) =>
  pedido(`/admin/utilizadores/${id}/bloquear`, {
    method: 'PATCH',
    body: JSON.stringify({ tipo, motivo }),
  });

// Reactiva uma conta suspensa ou bloqueada
export const reativarUtilizador = (id, tipo) =>
  pedido(`/admin/utilizadores/${id}/reativar`, {
    method: 'PATCH',
    body: JSON.stringify({ tipo }),
  });