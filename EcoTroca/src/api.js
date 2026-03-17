// ============================================================
//  api.js — Ficheiro central de comunicação com o backend
//  Todas as chamadas ao servidor passam por aqui.
//  Guardar em: src/api.js
// ============================================================

const BASE_URL = 'http://localhost:3000/api';

// ── Função base para todas as chamadas ───────────────────────
// Adiciona o token JWT automaticamente em cada pedido.
// Se o servidor devolver 401 (token expirado/inválido),
// limpa o localStorage e redireciona para o login.
const pedido = async (endpoint, opcoes = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opcoes.headers,
  };
  const resposta = await fetch(`${BASE_URL}${endpoint}`, { ...opcoes, headers });

  // Token expirado ou inválido — força novo login
  if (resposta.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/Login';
    return;
  }

  const dados = await resposta.json();

  // Erro do servidor — lança para o componente tratar com try/catch
  if (!resposta.ok) throw new Error(dados.erro || 'Erro no servidor');
  return dados;
};

// ============================================================
//  AUTENTICAÇÃO
// ============================================================

// Faz login, guarda o token e os dados do utilizador no localStorage.
// Guarda: nome, tipo, tipo_usuario e id — todos usados nos componentes.
export const login = async (emailOuTelefone, senha) => {
  const dados = await pedido('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailOuTelefone, senha }),
  });
  // Guarda o token para autenticar pedidos futuros
  localStorage.setItem('token', dados.token);
  // Guarda os dados do utilizador para uso nos componentes sem chamar o servidor
  // id e tipo_usuario são necessários para verificar permissões e autoria
  localStorage.setItem('usuario', JSON.stringify({
    id:           dados.id_usuario,
    nome:         dados.nome,
    tipo:         dados.tipo_usuario,
    tipo_usuario: dados.tipo_usuario, // alias — alguns componentes usam tipo, outros tipo_usuario
  }));
  return dados;
};

// Regista um novo utilizador e entra directamente na plataforma.
// O backend devolve token JWT — conta activa imediatamente (ativo=1).
// Se tiver email, recebe mensagem de boas-vindas em segundo plano.
export const registar = async (dadosFormulario) => {
  const dados = await pedido('/auth/registar', {
    method: 'POST',
    body: JSON.stringify(dadosFormulario),
  });
  // Guarda token e dados — utilizador entra directamente após o registo
  localStorage.setItem('token', dados.token);
  localStorage.setItem('usuario', JSON.stringify({
    id:           dados.id_usuario,
    nome:         dados.nome,
    tipo:         dados.tipo_usuario,
    tipo_usuario: dados.tipo_usuario,
  }));
  return dados;
};

// Reenvia o email de confirmação — usado quando o link de 24h expirou
// O utilizador fornece o email e recebe um novo link
export const reenviarConfirmacao = (email) =>
  pedido('/auth/reenviarConfirmacao', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

// Remove sessão local e redireciona para o login
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/Login';
};

// Verifica se existe token guardado — não valida no servidor
export const estaAutenticado = () => !!localStorage.getItem('token');

// Devolve os dados do utilizador guardados localmente após o login.
// Contém: id, nome, tipo, tipo_usuario
// Usado nos componentes para verificar autoria de publicações e permissões
export const getUtilizadorLocal = () => {
  const dados = localStorage.getItem('usuario');
  return dados ? JSON.parse(dados) : null;
};

// ============================================================
//  UTILIZADOR
// ============================================================

// Perfil completo do utilizador autenticado
export const getPerfil = () => pedido('/usuarios/perfil');

// Actualiza nome, provincia, municipio, bairro, data_nascimento
// Não toca no telefone nem email para evitar conflitos de UNIQUE KEY
export const actualizarPerfil = (dados) =>
  pedido('/usuarios/perfil', { method: 'PUT', body: JSON.stringify(dados) });

// Pontuação total e nível de recompensa do utilizador
export const getPontuacao = () => pedido('/usuarios/pontuacao');

// Envia email/telefone para receber link de recuperação de senha
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
//  CARTEIRA
// ============================================================

// Saldo em dinheiro e saldo EcoTroca do utilizador
export const getCarteira = () => pedido('/usuarios/carteira');

// ============================================================
//  ENTREGAS — utilizador comum
// ============================================================

// Lista todas as entregas do utilizador autenticado
export const getMinhasEntregas = () => pedido('/entregas');

// Detalhe de uma entrega específica
export const getEntrega = (id) => pedido(`/entregas/${id}`);

// Cria nova entrega e publica automaticamente no feed
export const criarEntrega = (dados) =>
  pedido('/entregas', { method: 'POST', body: JSON.stringify(dados) });

// Edita uma entrega pendente — não permitido após aceite
export const editarEntrega = (id, dados) =>
  pedido(`/entregas/${id}`, { method: 'PUT', body: JSON.stringify(dados) });

// Cancela a entrega e remove a publicação correspondente do feed
export const cancelarEntrega = (id) =>
  pedido(`/entregas/${id}/cancelar`, { method: 'PATCH' });

// ============================================================
//  COLETADOR
// ============================================================

// Entregas pendentes disponíveis para o coletador aceitar
export const getEntregasPendentes = () => pedido('/coletador/entregas/pendentes');

// Entregas que o coletador já aceitou
export const getMinhasColetasColetador = () => pedido('/coletador/entregas/minhas');

// Coletador aceita uma entrega pendente
export const aceitarEntrega = (id) =>
  pedido(`/coletador/entregas/${id}/aceitar`, { method: 'PATCH' });

// Coletador confirma que foi recolher o resíduo
export const recolherEntrega = (id) =>
  pedido(`/coletador/entregas/${id}/recolher`, { method: 'PATCH' });

// ============================================================
//  EMPRESA
// ============================================================

// Perfil da empresa autenticada
export const getPerfilEmpresa = () => pedido('/empresas/perfil');

// Actualiza os dados do perfil da empresa
export const atualizarEmpresa = (dados) =>
  pedido('/empresas/perfil', { method: 'PUT', body: JSON.stringify(dados) });

// Entregas associadas à empresa
export const getEntregasEmpresa = () => pedido('/empresas/minhas/entregas');

// Empresa aceita uma entrega de resíduo
export const aceitarEntregaEmpresa = (id) =>
  pedido(`/empresas/minhas/entregas/${id}/aceitar`, { method: 'POST' });

// Empresa rejeita uma entrega com motivo opcional
export const rejeitarEntregaEmpresa = (id, motivo, pede_foto, pede_limpeza) =>
  pedido(`/empresas/minhas/entregas/${id}/rejeitar`, {
    method: 'POST',
    body: JSON.stringify({ motivo, pede_foto, pede_limpeza }),
  });

// Coletadores associados à empresa
export const getColetadoresEmpresa = () => pedido('/empresas/minhas/coletadores');

// Adiciona um coletador à empresa pelo id ou telefone
export const adicionarColetadorEmpresa = (id_coletador, telefone) =>
  pedido('/empresas/minhas/coletadores', {
    method: 'POST',
    body: JSON.stringify({ id_coletador, telefone }),
  });

// Remove um coletador da empresa
export const removerColetadorEmpresa = (id) =>
  pedido(`/empresas/minhas/coletadores/${id}`, { method: 'DELETE' });

// Eventos criados pela empresa
export const getEventosEmpresa = () => pedido('/empresas/minhas/eventos');

// Cria novo evento para a empresa
export const criarEventoEmpresa = (dados) =>
  pedido('/empresas/minhas/eventos', { method: 'POST', body: JSON.stringify(dados) });

// ============================================================
//  EVENTOS
// ============================================================

// Todos os eventos activos da plataforma
export const getEventos = () => pedido('/eventos');

// Detalhe de um evento específico
export const getEvento = (id) => pedido(`/eventos/${id}`);

// Edita um evento existente
export const editarEvento = (id, dados) =>
  pedido(`/eventos/${id}`, { method: 'PUT', body: JSON.stringify(dados) });

// Apaga um evento
export const apagarEvento = (id) =>
  pedido(`/eventos/${id}`, { method: 'DELETE' });

// ============================================================
//  CHAT
// ============================================================

// Mensagens do chat de uma entrega
export const getMensagens = (idEntrega) => pedido(`/chat/${idEntrega}/mensagens`);

// Envia nova mensagem no chat de uma entrega
export const enviarMensagem = (idEntrega, mensagem) =>
  pedido(`/chat/${idEntrega}/mensagens`, {
    method: 'POST',
    body: JSON.stringify({ mensagem }),
  });

// ============================================================
//  NOTIFICAÇÕES
// ============================================================

// Todas as notificações do utilizador autenticado
export const getNotificacoes = () => pedido('/notificacoes');

// Marca uma notificação como lida — remove o ponto verde do badge
export const marcarNotificacaoLida = (id) =>
  pedido(`/notificacoes/${id}/ler`, { method: 'PATCH' });

// Cria notificação para outro utilizador — usado quando empresa envia proposta.
// Também muda o status da publicação para 'em_negociacao' se vier id_publicacao.
export const criarNotificacao = (dados) =>
  pedido('/notificacoes/criar', { method: 'POST', body: JSON.stringify(dados) });

// Aceita proposta de empresa — publicação fica 'fechada' e empresa é notificada
export const aceitarProposta = (id) =>
  pedido(`/notificacoes/${id}/aceitar`, { method: 'POST' });

// Recusa proposta de empresa — publicação volta 'disponivel' e empresa é notificada
export const recusarProposta = (id) =>
  pedido(`/notificacoes/${id}/recusar`, { method: 'POST' });

// ============================================================
//  RESÍDUOS
// ============================================================

// Todos os tipos de resíduos activos com qualidade e intervalos de preço
export const getResiduos = () => pedido('/residuos');

// ============================================================
//  PUBLICAÇÕES — feed da Página Inicial
// ============================================================

// Todas as publicações activas do feed
export const getFeed = () => pedido('/feed');

// Cria nova publicação no feed
export const criarPublicacao = (dados) =>
  pedido('/feed', { method: 'POST', body: JSON.stringify(dados) });

// Edita publicação existente — só o autor pode editar.
// Campos editáveis: titulo, descricao, id_residuo, quantidade_kg, valor_proposto, provincia, imagem
export const editarPublicacao = (id, dados) =>
  pedido(`/feed/${id}`, { method: 'PUT', body: JSON.stringify(dados) });

// Apaga publicação — backend verifica autoria e aplica penalização se necessário
export const apagarPublicacao = (id) =>
  pedido(`/feed/${id}`, { method: 'DELETE' });

// ============================================================
//  PERFIL PÚBLICO
// ============================================================

// Perfil público de um utilizador ou empresa pelo tipo e id
export const getPerfilPublico = (tipo, id) => pedido(`/perfilpublico/${tipo}/${id}`);

// ============================================================
//  EMPRESAS — listagem pública
// ============================================================

// Todas as empresas activas — usado na sidebar da Página Inicial
export const getEmpresas = () => pedido('/empresas');

// Detalhe de uma empresa específica
export const getEmpresa = (id) => pedido(`/empresas/${id}`);

// ============================================================
//  ADMIN
// ============================================================

// Estatísticas gerais da plataforma — rota correcta: /admin/estatisticas
export const getEstatisticas = () => pedido('/admin/estatisticas');

// Dados completos para o dashboard do admin (numa só chamada)
export const getDashboardAdmin = () => pedido('/admin/dashboard');

// Lista todos os utilizadores — rota correcta: /admin/utilizadores
export const getUtilizadores = () => pedido('/admin/utilizadores');

// Alias usado pelo AdminUtilizadores.jsx
export const getAdminUtilizadores = () => pedido('/admin/utilizadores');

// Todas as entregas da plataforma
export const getTodasEntregas = () => pedido('/admin/entregas');

// Aplica advertência manual a utilizador, coletador ou empresa
export const aplicarAdvertencia = (id, tipo, motivo) =>
  pedido(`/admin/utilizadores/${id}/advertencia`, {
    method: 'PATCH',
    body: JSON.stringify({ tipo, motivo }),
  });

// Suspende conta temporariamente (7 dias)
export const suspenderUtilizador = (id, tipo, motivo) =>
  pedido(`/admin/utilizadores/${id}/suspender`, {
    method: 'PATCH',
    body: JSON.stringify({ tipo, motivo }),
  });

// Bloqueia conta permanentemente
export const bloquearUtilizador = (id, tipo, motivo) =>
  pedido(`/admin/utilizadores/${id}/bloquear`, {
    method: 'PATCH',
    body: JSON.stringify({ tipo, motivo }),
  });

// Reactiva conta suspensa ou bloqueada
export const reativarUtilizador = (id, tipo) =>
  pedido(`/admin/utilizadores/${id}/reativar`, {
    method: 'PATCH',
    body: JSON.stringify({ tipo }),
  });

// Conteúdo educativo da plataforma
export const getAdminEducacao = () => pedido('/educacao');

// Cria novo conteúdo educativo
export const criarEducacao = (dados) =>
  pedido('/admin/educacao', { method: 'POST', body: JSON.stringify(dados) });

// Edita conteúdo educativo existente
export const editarEducacao = (id, dados) =>
  pedido(`/admin/educacao/${id}`, { method: 'PUT', body: JSON.stringify(dados) });

// Apaga conteúdo educativo (soft delete no servidor)
export const apagarEducacao = (id) =>
  pedido(`/admin/educacao/${id}`, { method: 'DELETE' });

// Relatórios financeiros por período: hoje | semana | mes | total
export const getRelatoriosAdmin = (periodo = 'mes') =>
  pedido(`/admin/relatorios?periodo=${periodo}`);

// ============================================================
//  RECOLHAS AGENDADAS
// ============================================================

// Lista todas as recolhas agendadas da empresa com coletadores e entregas
export const getRecolhasEmpresa = () => pedido('/empresas/minhas/recolhas');

// Acordos aceites ainda não associados a nenhuma recolha
// Devolve também se o limiar foi atingido
export const getAcordosPendentes = () => pedido('/empresas/minhas/acordos-pendentes');

// Cria uma nova recolha agendada com coletadores e entregas seleccionadas
// id_coletadores: array de ids, id_entregas: array de ids
export const criarRecolha = (dados) =>
  pedido('/empresas/minhas/recolhas', { method: 'POST', body: JSON.stringify(dados) });

// Actualiza o status de uma recolha: agendada → em_curso → concluida
export const actualizarStatusRecolha = (id, status) =>
  pedido(`/empresas/minhas/recolhas/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// Verifica se a empresa atingiu o limiar de acordos pendentes
export const verificarLimiar = () => pedido('/empresas/minhas/limiar');

// Actualiza o limiar de recolha da empresa
export const actualizarLimiar = (limiar_recolha) =>
  pedido('/empresas/minhas/limiar', { method: 'PUT', body: JSON.stringify({ limiar_recolha }) });

// ============================================================
//  RECOLHAS AGENDADAS
// ============================================================

// Lista todas as recolhas agendadas da empresa
export const getRecolhasEmpresa = () =>
  pedido('/empresas/minhas/recolhas');

// Detalhe de uma recolha — coletadores + entregas associadas
export const getRecolha = (id) =>
  pedido(`/empresas/minhas/recolhas/${id}`);

// Cria uma nova recolha agendada com coletadores e entregas
// ids_coletadores: array de ids, ids_entregas: array de ids
// Notifica automaticamente todos os utilizadores envolvidos
export const criarRecolha = (dados) =>
  pedido('/empresas/minhas/recolhas', {
    method: 'POST',
    body: JSON.stringify(dados),
  });

// Actualiza o status de uma recolha: agendada | em_curso | concluida | cancelada
// Quando concluída ou cancelada, notifica os utilizadores
export const actualizarStatusRecolha = (id, status) =>
  pedido(`/empresas/minhas/recolhas/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// Lista entregas com acordo mas ainda sem recolha agendada
// Também devolve { atingiu_limiar, sugestao } para alertar a empresa
export const getAcordosPendentes = () =>
  pedido('/empresas/minhas/acordos-pendentes');

// Actualiza o limiar de acordos que dispara a sugestão de recolha em lote
export const actualizarLimiar = (limiar_recolha) =>
  pedido('/empresas/minhas/limiar', {
    method: 'PUT',
    body: JSON.stringify({ limiar_recolha }),
  });