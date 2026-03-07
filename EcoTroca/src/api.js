// ============================================================
//  api.js — Ficheiro central de comunicação com o backend

const BASE_URL = 'http://localhost:3000/api';

// Função base para todas as chamadas ao backend
// Adiciona o token JWT automaticamente e trata erros de autenticação
const pedido = async (endpoint, opcoes = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opcoes.headers,
  };
  const resposta = await fetch(`${BASE_URL}${endpoint}`, { ...opcoes, headers });

  // Se o token expirou ou é inválido, limpo o localStorage e redireciono para o login
  if (resposta.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/Login';
    return;
  }

  const dados = await resposta.json();

  // Se o servidor devolveu um erro, lanço-o para o componente tratar
  if (!resposta.ok) throw new Error(dados.erro || 'Erro no servidor');
  return dados;
};

// ============================================================
// AUTENTICAÇÃO
// ============================================================

// Faz login e guarda o token e dados do utilizador no localStorage
export const login = async (emailOuTelefone, senha) => {
  const dados = await pedido('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailOuTelefone, senha }),
  });
  localStorage.setItem('token', dados.token);
  localStorage.setItem('usuario', JSON.stringify({ nome: dados.nome, tipo: dados.tipo_usuario }));
  return dados;
};

// Regista um novo utilizador e guarda o token no localStorage
export const registar = async (dadosFormulario) => {
  const dados = await pedido('/auth/registar', {
    method: 'POST',
    body: JSON.stringify(dadosFormulario),
  });
  localStorage.setItem('token', dados.token);
  return dados;
};

// Remove o token e redireciona para o login
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/Login';
};

// Verifica se existe token no localStorage — não valida no servidor
export const estaAutenticado = () => !!localStorage.getItem('token');

// Devolve os dados básicos do utilizador guardados localmente após o login
export const getUtilizadorLocal = () => {
  const dados = localStorage.getItem('usuario');
  return dados ? JSON.parse(dados) : null;
};

// ============================================================
// UTILIZADOR
// ============================================================

// Vai buscar o perfil completo do utilizador autenticado
export const getPerfil = () => pedido('/usuarios/perfil');

// Actualiza nome, provincia, municipio, bairro e data_nascimento
// Não toca no telefone nem no email para evitar conflitos de UNIQUE KEY
export const actualizarPerfil = (dados) => pedido('/usuarios/perfil', { method: 'PUT', body: JSON.stringify(dados) });

// Devolve pontuação total e nível de recompensa do utilizador
export const getPontuacao = () => pedido('/usuarios/pontuacao');

// Envia email/telefone para recuperar senha
export const recuperarSenha = (emailOuTelefone) => pedido('/auth/recuperar-senha', { method: 'POST', body: JSON.stringify({ emailOuTelefone }) });

// Redefine a senha usando o token enviado por email
export const redefinirSenha = (token, novaSenha) => pedido(`/auth/redefinir-senha/${token}`, { method: 'POST', body: JSON.stringify({ senha: novaSenha }) });

// ============================================================
// CARTEIRA
// ============================================================

// Devolve o saldo em dinheiro e saldo EcoTroca do utilizador
export const getCarteira = () => pedido('/usuarios/carteira');

// ============================================================
// ENTREGAS — utilizador comum
// ============================================================

// Lista todas as entregas do utilizador autenticado
export const getMinhasEntregas = () => pedido('/entregas');

// Devolve o detalhe de uma entrega específica
export const getEntrega = (id) => pedido(`/entregas/${id}`);

// Cria uma nova entrega e automaticamente uma publicação no feed
export const criarEntrega = (dados) => pedido('/entregas', { method: 'POST', body: JSON.stringify(dados) });

// Edita uma entrega pendente — não é permitido editar após aceite
export const editarEntrega = (id, dados) => pedido(`/entregas/${id}`, { method: 'PUT', body: JSON.stringify(dados) });

// Cancela a entrega E remove a publicação correspondente do feed
export const cancelarEntrega = (id) => pedido(`/entregas/${id}/cancelar`, { method: 'PATCH' });

// ============================================================
// COLETADOR
// ============================================================

// Lista todas as entregas pendentes disponíveis para o coletador aceitar
export const getEntregasPendentes = () => pedido('/coletador/entregas/pendentes');

// Lista as entregas que o coletador já aceitou
export const getMinhasColetasColetador = () => pedido('/coletador/entregas/minhas');

// Coletador aceita uma entrega pendente
export const aceitarEntrega = (id) => pedido(`/coletador/entregas/${id}/aceitar`, { method: 'PATCH' });

// Coletador confirma que foi recolher o resíduo
export const recolherEntrega = (id) => pedido(`/coletador/entregas/${id}/recolher`, { method: 'PATCH' });

// ============================================================
// EMPRESA
// ============================================================

// Vai buscar o perfil da empresa autenticada
export const getPerfilEmpresa = () => pedido('/empresas/perfil');

// Actualiza os dados do perfil da empresa
export const atualizarEmpresa = (dados) => pedido('/empresas/perfil', { method: 'PUT', body: JSON.stringify(dados) });

// Lista as entregas associadas à empresa
export const getEntregasEmpresa = () => pedido('/empresas/minhas/entregas');

// Empresa aceita uma entrega de resíduo
export const aceitarEntregaEmpresa = (id) => pedido(`/empresas/minhas/entregas/${id}/aceitar`, { method: 'POST' });

// Empresa rejeita uma entrega com motivo opcional
export const rejeitarEntregaEmpresa = (id, motivo, pede_foto, pede_limpeza) =>
  pedido(`/empresas/minhas/entregas/${id}/rejeitar`, {
    method: 'POST',
    body: JSON.stringify({ motivo, pede_foto, pede_limpeza }),
  });

// Lista os coletadores associados à empresa
export const getColetadoresEmpresa = () => pedido('/empresas/minhas/coletadores');

// Adiciona um coletador à empresa pelo id ou telefone
export const adicionarColetadorEmpresa = (id_coletador, telefone) =>
  pedido('/empresas/minhas/coletadores', { method: 'POST', body: JSON.stringify({ id_coletador, telefone }) });

// Remove um coletador da empresa
export const removerColetadorEmpresa = (id) => pedido(`/empresas/minhas/coletadores/${id}`, { method: 'DELETE' });

// Lista os eventos criados pela empresa
export const getEventosEmpresa = () => pedido('/empresas/minhas/eventos');

// Cria um novo evento para a empresa
export const criarEventoEmpresa = (dados) => pedido('/empresas/minhas/eventos', { method: 'POST', body: JSON.stringify(dados) });

// ============================================================
// EVENTOS
// ============================================================

// Lista todos os eventos activos da plataforma
export const getEventos = () => pedido('/eventos');

// Devolve o detalhe de um evento específico
export const getEvento = (id) => pedido(`/eventos/${id}`);

// Edita um evento existente
export const editarEvento = (id, dados) => pedido(`/eventos/${id}`, { method: 'PUT', body: JSON.stringify(dados) });

// Apaga um evento
export const apagarEvento = (id) => pedido(`/eventos/${id}`, { method: 'DELETE' });

// ============================================================
// CHAT
// ============================================================

// Lista todas as mensagens do chat de uma entrega
export const getMensagens = (idEntrega) => pedido(`/chat/${idEntrega}/mensagens`);

// Envia uma nova mensagem no chat de uma entrega
export const enviarMensagem = (idEntrega, mensagem) =>
  pedido(`/chat/${idEntrega}/mensagens`, { method: 'POST', body: JSON.stringify({ mensagem }) });

// ============================================================
// NOTIFICAÇÕES
// ============================================================

// Lista todas as notificações do utilizador autenticado
export const getNotificacoes = () => pedido('/notificacoes');

// Marca uma notificação como lida — remove o ponto verde e não conta no badge
export const marcarNotificacaoLida = (id) => pedido(`/notificacoes/${id}/ler`, { method: 'PATCH' });

// Cria uma notificação para outro utilizador — usado quando empresa envia proposta
// Também muda o status da publicação para 'em_negociacao' se vier id_publicacao
export const criarNotificacao = (dados) => pedido('/notificacoes/criar', { method: 'POST', body: JSON.stringify(dados) });

// ============================================================
// RESÍDUOS
// ============================================================

// Lista todos os tipos de resíduos activos com qualidade e intervalos de preço
export const getResiduos = () => pedido('/residuos');

// ============================================================
// PUBLICAÇÕES — Página Inicial (feed)
// ============================================================

// Lista todas as publicações activas do feed para a Página Inicial
export const getFeed = () => pedido('/feed');

// Cria uma nova publicação no feed — usado pelo botão Publicar da Página Inicial
export const criarPublicacao = (dados) => pedido('/feed', { method: 'POST', body: JSON.stringify(dados) });

// Apaga uma publicação do feed — backend verifica status e aplica penalização se necessário
export const apagarPublicacao = (id) => pedido(`/feed/${id}`, { method: 'DELETE' });

// ============================================================
// PERFIL PÚBLICO
// ============================================================

// Devolve o perfil público de um utilizador ou empresa pelo tipo e id
export const getPerfilPublico = (tipo, id) => pedido(`/perfilpublico/${tipo}/${id}`);

// ============================================================
// EMPRESAS — listagem pública
// ============================================================

// Lista todas as empresas activas — usado na sidebar da Página Inicial
export const getEmpresas = () => pedido('/empresas');

// Devolve o detalhe de uma empresa específica
export const getEmpresa = (id) => pedido(`/empresas/${id}`);

// ============================================================
// ADMIN
// ============================================================

// Devolve estatísticas gerais da plataforma para o painel admin
export const getEstatisticas = () => pedido('/admin/stats');

// Lista todos os utilizadores registados na plataforma
export const getUtilizadores = () => pedido('/admin/usuarios');

// Lista todas as entregas da plataforma
export const getTodasEntregas = () => pedido('/admin/entregas');

// Devolve dados completos para o dashboard do admin
export const getDashboardAdmin = () => pedido('/admin/dashboard');

// Lista utilizadores com opções de gestão (advertências, suspensão, bloqueio)
export const getAdminUtilizadores = () => pedido('/admin/utilizadores');

// Aplica uma advertência manual a um utilizador ou empresa
export const aplicarAdvertencia = (id, tipo, motivo) =>
  pedido(`/admin/utilizadores/${id}/advertencia`, { method: 'PATCH', body: JSON.stringify({ tipo, motivo }) });

// Suspende um utilizador ou empresa temporariamente
export const suspenderUtilizador = (id, tipo, motivo) =>
  pedido(`/admin/utilizadores/${id}/suspender`, { method: 'PATCH', body: JSON.stringify({ tipo, motivo }) });

// Bloqueia permanentemente um utilizador ou empresa
export const bloquearUtilizador = (id, tipo, motivo) =>
  pedido(`/admin/utilizadores/${id}/bloquear`, { method: 'PATCH', body: JSON.stringify({ tipo, motivo }) });

// Reactiva uma conta suspensa ou bloqueada
export const reativarUtilizador = (id, tipo) =>
  pedido(`/admin/utilizadores/${id}/reativar`, { method: 'PATCH', body: JSON.stringify({ tipo }) });

// Lista o conteúdo educativo da plataforma
export const getAdminEducacao = () => pedido('/educacao');

// Cria um novo conteúdo educativo
export const criarEducacao = (dados) => pedido('/admin/educacao', { method: 'POST', body: JSON.stringify(dados) });

// Edita um conteúdo educativo existente
export const editarEducacao = (id, dados) => pedido(`/admin/educacao/${id}`, { method: 'PUT', body: JSON.stringify(dados) });

// Apaga um conteúdo educativo
export const apagarEducacao = (id) => pedido(`/admin/educacao/${id}`, { method: 'DELETE' });

// Devolve relatórios da plataforma por período (dia, semana, mes, ano)
export const getRelatoriosAdmin = (periodo = 'mes') => pedido(`/admin/relatorios?periodo=${periodo}`);