
//  FLUXO COMPLETO DE TROCA:
//    1. Utilizador publica oferta → empresa clica "Fazer Troca" na PaginaInicial
//    2. Utilizador aceita a proposta → entrega criada com status 'pendente'
//    3. Empresa ve a entrega aqui → marca a data de recolha
//    4. Utilizador aparece com os residuos no dia marcado
//    5. Empresa pesa os residuos → clica "Aceitar" → introduz peso real
//    6. Sistema calcula e processa o pagamento automaticamente
//    7. Entrega passa para status 'coletada' → aparece como "Troca Concluida"
//
//  CALCULO DO PAGAMENTO (comissao EcoTroca):
//    valor_total       = peso_real x valor_por_kg
//    valor_utilizador  = valor_total x 70% - 50 Kz (taxa fixa da plataforma)
//    valor_coletador   = valor_total x 30% (so se usou coletador independente)
//    comissao_ecotroca = valor_total x 10% + 50 Kz

import React, { useState, useEffect } from 'react';

// Icones da biblioteca lucide-react usados nos cards e modais
import {
  CheckCircle, // botao aceitar e confirmacao de pagamento
  XCircle,     // botao rejeitar
  Package,     // icone de residuo e estado vazio
  User,        // icone do nome do utilizador
  MapPin,      // icone do endereco
  Clock,       // icone da data e hora
  Scale,       // icone do modal de pesagem
  AlertCircle, // icone de erro
  X,           // botao fechar modal
  Leaf,        // icone do resumo de pagamento
  CalendarCheck // icone do botao marcar data
} from 'lucide-react';

// Header especifico da empresa — barra de navegacao superior
import HeaderEmpresa from './HeaderEmpresa.jsx';

// Funcoes de comunicacao com o backend via API REST
import {
  getEntregasEmpresa,    // GET /api/empresas/minhas/entregas — lista todas as entregas
  aceitarEntregaEmpresa, // POST /api/empresas/minhas/entregas/:id/aceitar — processa pagamento
  rejeitarEntregaEmpresa,// POST /api/empresas/minhas/entregas/:id/rejeitar — rejeita com motivo
  proporDataRecolha      // POST /api/empresas/minhas/entregas/:id/propor-data — notifica utilizador
} from '../../api.js';

export default function EntregasEmpresa() {

  // ── Lista de entregas e estado geral ─────────────────────
  const [entregas,   setEntregas]   = useState([]); // todas as entregas da empresa vindas do backend
  const [filtro,     setFiltro]     = useState('pendente'); // filtro activo na barra de botoes
  const [carregando, setCarregando] = useState(true); // true enquanto os dados ainda estao a chegar
  const [erro,       setErro]       = useState(''); // erro global mostrado no topo da pagina

  // ── Estados do modal de ACEITAR ───────────────────────────
  // O modal de aceitar abre quando a empresa recebeu os residuos e quer registar o peso real
  const [modalAceitar, setModalAceitar] = useState(null); // id da entrega a aceitar (null = modal fechado)
  const [pesoReal,     setPesoReal]     = useState('');   // peso em kg introduzido pela empresa na balanca
  const [erroAceitar,  setErroAceitar]  = useState('');   // mensagem de erro dentro do modal de aceitar

  // ── Estados do modal de REJEITAR ─────────────────────────
  // O modal de rejeitar abre quando a empresa nao quer ou nao pode aceitar os residuos
  const [modalRejeitar, setModalRejeitar] = useState(null);  // id da entrega a rejeitar (null = fechado)
  const [motivo,        setMotivo]        = useState('');    // motivo obrigatorio da rejeicao
  const [pedeFoto,      setPedeFoto]      = useState(false); // checkbox: pede fotos ao utilizador
  const [pedeLimpeza,   setPedeLimpeza]   = useState(false); // checkbox: pede limpeza antes de nova tentativa
  const [erroRejeitar,  setErroRejeitar]  = useState('');    // mensagem de erro dentro do modal de rejeitar

  // ── Estados do modal de PROPOR DATA ──────────────────────
  // O modal de data abre quando a empresa quer informar o utilizador de quando deve aparecer
  const [modalData,   setModalData]   = useState(null);  // id da entrega a marcar data (null = fechado)
  const [dataRecolha, setDataRecolha] = useState('');    // data e hora escolhida pela empresa (datetime-local)
  const [obsEmpresa,  setObsEmpresa]  = useState('');    // nota opcional para o utilizador (ex: traz ensacado)
  const [erroData,    setErroData]    = useState('');    // mensagem de erro dentro do modal de data
  const [propondo,    setPropondo]    = useState(false); // true enquanto o pedido de data esta a ser enviado

  // ── Estado de accao em curso ──────────────────────────────
  // Guarda o id da entrega que esta a ser processada para mostrar loading no botao correcto
  // Evita que a empresa clique duas vezes ou em duas entregas ao mesmo tempo
  const [acaoEmCurso, setAcaoEmCurso] = useState(null);

  // ── Carrega as entregas ao montar o componente ────────────
  // useEffect com array vazio [] significa que so corre uma vez — quando a pagina abre
  useEffect(() => { carregar(); }, []);

  // Vai buscar todas as entregas desta empresa via GET /api/empresas/minhas/entregas
  // Inclui nome do utilizador, tipos de residuos, peso, valor e status
  const carregar = async () => {
    try {
      setErro(''); // limpa erro anterior antes de tentar carregar
      const dados = await getEntregasEmpresa(); // chamada ao backend
      setEntregas(dados); // guarda a lista de entregas no estado
    } catch (err) {
      setErro(err.message); // mostra o erro se a chamada falhar
    } finally {
      setCarregando(false); // desactiva o loading independentemente do resultado
    }
  };

  // ── Filtragem das entregas por status ─────────────────────
  // Se o filtro for 'todos', mostra tudo; caso contrario filtra por status exacto
  const entregasFiltradas = filtro === 'todos'
    ? entregas
    : entregas.filter(e => e.status === filtro);

  // ── Calcula estimativa de pagamento em tempo real ─────────
  // Chamada sempre que o peso muda no modal de aceitar
  // Devolve null se o peso ou o valor por kg forem invalidos
  const calcularEstimativa = (peso, valorKg) => {
    const p   = parseFloat(peso);   // converte string do input para numero
    const vkg = parseFloat(valorKg); // valor por kg do tipo de residuo
    if (!p || !vkg || p <= 0 || vkg <= 0) return null; // valores invalidos — sem estimativa

    const valorTotal      = p * vkg;                   // valor bruto: peso x valor por kg
    const valorUtilizador = (valorTotal * 0.70) - 50;  // utilizador recebe 70% menos taxa fixa de 50 Kz
    const valorColetador  = valorTotal * 0.30;          // coletador recebe 30% (so se houver coletador)
    const comissao        = (valorTotal * 0.10) + 50;  // EcoTroca fica com 10% mais 50 Kz de taxa fixa

    return {
      valorTotal:      valorTotal.toFixed(0),                    // arredonda para inteiro em Kz
      valorUtilizador: Math.max(0, valorUtilizador).toFixed(0), // nunca negativo (protege valores muito baixos)
      valorColetador:  valorColetador.toFixed(0),
      comissao:        comissao.toFixed(0),
    };
  };

  // Encontra a entrega que esta aberta no modal de aceitar para mostrar os detalhes
  const entregaAceitar = entregas.find(e => e.id_entrega === modalAceitar);

  // Calcula a estimativa em tempo real sempre que o peso ou a entrega mudam
  // Usa valor_por_kg se disponivel, senao usa preco_min como aproximacao
  const estimativa = entregaAceitar
    ? calcularEstimativa(pesoReal, entregaAceitar.valor_por_kg || entregaAceitar.preco_min)
    : null;

  // Abre o modal de aceitar para uma entrega especifica e limpa os campos anteriores
  const abrirModalAceitar = (idEntrega) => {
    setModalAceitar(idEntrega); // define qual entrega esta a ser aceite
    setPesoReal('');            // limpa o peso de uma utilizacao anterior
    setErroAceitar('');         // limpa erros de uma utilizacao anterior
  };

  // ── Confirma aceitacao com o peso real pesado pela empresa ─
  // Chama POST /api/empresas/minhas/entregas/:id/aceitar com o peso
  // O backend calcula o pagamento e credita nas carteiras automaticamente
  const handleAceitar = async () => {
    // Valida que o peso foi introduzido e e um numero positivo
    if (!pesoReal || parseFloat(pesoReal) <= 0) {
      setErroAceitar('Introduz o peso real dos residuos em kg.'); // mostra erro no modal
      return; // nao prossegue sem peso valido
    }
    try {
      setAcaoEmCurso(modalAceitar); // activa loading no botao desta entrega
      setErroAceitar('');           // limpa erro anterior

      // Envia o peso real ao backend — o servidor calcula tudo e actualiza a entrega
      await aceitarEntregaEmpresa(modalAceitar, parseFloat(pesoReal));

      setModalAceitar(null); // fecha o modal apos sucesso
      setPesoReal('');       // limpa o campo de peso
      await carregar();      // recarrega a lista para mostrar o novo status
    } catch (err) {
      setErroAceitar(err.message); // mostra o erro devolvido pelo servidor dentro do modal
    } finally {
      setAcaoEmCurso(null); // desactiva o loading independentemente do resultado
    }
  };

  // ── Confirma rejeicao com motivo obrigatorio ──────────────
  // Chama POST /api/empresas/minhas/entregas/:id/rejeitar
  // O backend notifica o utilizador com o motivo e as opcoes de correccao
  const handleRejeitar = async () => {
    // Motivo obrigatorio — sem ele o utilizador nao sabe o que precisa de corrigir
    if (!motivo.trim()) {
      setErroRejeitar('O motivo da rejeicao e obrigatorio. O utilizador vai receber esta mensagem.');
      return; // nao prossegue sem motivo
    }
    try {
      setAcaoEmCurso(modalRejeitar); // activa loading no botao desta entrega
      setErroRejeitar('');           // limpa erro anterior

      // Envia motivo e opcoes de correccao (fotos e/ou limpeza) ao backend
      await rejeitarEntregaEmpresa(modalRejeitar, motivo, pedeFoto, pedeLimpeza);

      // Fecha e reseta todos os campos do modal apos sucesso
      setModalRejeitar(null);
      setMotivo('');
      setPedeFoto(false);
      setPedeLimpeza(false);
      setErroRejeitar('');
      await carregar(); // recarrega a lista para reflectir o novo status
    } catch (err) {
      setErro(err.message); // erro grave — mostra no topo da pagina
    } finally {
      setAcaoEmCurso(null); // desactiva o loading
    }
  };

  // ── Propoe data de recolha ao utilizador ──────────────────
  // Chama POST /api/empresas/minhas/entregas/:id/propor-data
  // O backend notifica automaticamente o utilizador com a data formatada em portugues
  const handleProporData = async () => {
    // Valida que uma data foi seleccionada
    if (!dataRecolha) {
      setErroData('Selecciona a data e hora da recolha.');
      return;
    }
    // Valida que a data e no futuro — nao faz sentido marcar no passado
    if (new Date(dataRecolha) <= new Date()) {
      setErroData('A data tem de ser no futuro.');
      return;
    }
    try {
      setPropondo(true); // activa loading no botao confirmar data
      setErroData('');   // limpa erro anterior

      // Envia a data e a nota opcional ao backend
      // O backend guarda no campo data_recolha_proposta e notifica o utilizador
      await proporDataRecolha(modalData, { data_recolha: dataRecolha, observacoes: obsEmpresa || null });

      // Fecha e reseta o modal apos sucesso
      setModalData(null);
      setDataRecolha('');
      setObsEmpresa('');
      await carregar(); // recarrega para mostrar a data proposta no card
    } catch (err) {
      setErroData(err.message); // mostra erro dentro do modal
    } finally {
      setPropondo(false); // desactiva o loading
    }
  };

  // ── RENDER ────────────────────────────────────────────────
  return (
    // Fundo verde claro consistente com o resto da aplicacao
    <div className="min-h-screen bg-green-100 pt-24 pb-12 px-6">

      {/* Header da empresa com navegacao e notificacoes */}
      <HeaderEmpresa />

      {/* Titulo e subtitulo da pagina */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-800">Gestao de Entregas</h1>
        <p className="text-gray-500 mt-1">Aceita ou rejeita os residuos recebidos dos utilizadores.</p>
      </div>

      {/* Erro global — so aparece se houver um erro na chamada ao backend */}
      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle size={16} /> {erro}
        </div>
      )}

      {/* Barra de filtros de status */}
      {/* Cada botao filtra a lista por status — o activo fica verde */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[
          { val: 'pendente',  label: 'Pendentes'         }, // entregas aguardando accao da empresa
          { val: 'aceita',    label: 'Aceites'           }, // entregas aceites mas ainda nao pagas
          { val: 'coletada',  label: 'Trocas Concluidas' }, // trocas ja pagas e encerradas
          { val: 'cancelada', label: 'Rejeitadas'        }, // entregas rejeitadas pela empresa
          { val: 'todos',     label: 'Todos'             }, // todas as entregas sem filtro
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setFiltro(val)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filtro === val
                ? 'bg-green-600 text-white shadow'   // estilo do filtro activo
                : 'bg-white text-green-700 border border-green-200 hover:bg-green-50' // inactivo
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Estado de carregamento — mostra texto enquanto os dados chegam do backend */}
      {carregando ? (
        <p className="text-green-700 text-center py-12">A carregar entregas...</p>

      // Estado vazio — nao ha entregas para o filtro activo
      ) : entregasFiltradas.length === 0 ? (
        <div className="bg-white border border-green-100 rounded-2xl p-8 text-center shadow-sm">
          <Package size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">Nenhuma entrega encontrada.</p>
        </div>

      // Lista de cards de entregas — uma grelha de 2 colunas no desktop
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {entregasFiltradas.map(e => (

            // Card individual de cada entrega
            <div key={e.id_entrega} className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">

              {/* Cabecalho do card: tipo de residuo + badge de status */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  {/* Nome do tipo de residuo (ex: Plastico, Vidro) */}
                  <p className="font-bold text-green-700 text-lg">{e.tipos_residuos || 'Residuo'}</p>
                  {/* Numero identificador da entrega */}
                  <p className="text-xs text-gray-400">Entrega #{e.id_entrega}</p>
                </div>

                {/* Badge de status com cor diferente por estado */}
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  e.status === 'pendente'  ? 'bg-yellow-100 text-yellow-700' : // amarelo = aguarda accao
                  e.status === 'aceita'    ? 'bg-green-100 text-green-700'   : // verde = aceite
                  e.status === 'coletada'  ? 'bg-blue-100 text-blue-700'     : // azul = concluida
                                             'bg-red-100 text-red-700'         // vermelho = rejeitada
                }`}>
                  {/* Label legivel em portugues para cada status */}
                  {e.status === 'pendente'  ? 'Pendente'        :
                   e.status === 'aceita'    ? 'Aceite'          :
                   e.status === 'coletada'  ? 'Troca Concluida' : 'Rejeitada'}
                </span>
              </div>

              {/* Detalhes da entrega: utilizador, endereco, peso e data */}
              <div className="space-y-2 text-sm text-gray-600 mb-4">

                {/* Nome e telefone do utilizador que fez a oferta */}
                <div className="flex items-center gap-2">
                  <User size={14} className="text-green-500 shrink-0" />
                  <span>{e.nome_usuario}</span>
                  {/* Telefone so aparece se estiver preenchido no perfil */}
                  {e.telefone_usuario && <span className="text-gray-400">· {e.telefone_usuario}</span>}
                </div>

                {/* Endereco de entrega ou indicacao de ponto de recolha */}
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-green-500 shrink-0" />
                  <span>{e.endereco_domicilio || 'Ponto de recolha'}</span>
                </div>

                {/* Peso registado e valor total — peso aparece apos pesagem, valor apos pagamento */}
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-green-500 shrink-0" />
                  <span>{e.peso_total ? `${e.peso_total} kg` : 'Peso a registar'}</span>
                  {/* Valor total em Kz — so aparece apos a empresa aceitar e pagar */}
                  {e.valor_total && (
                    <span className="font-medium text-green-600 ml-2">
                      · {parseFloat(e.valor_total).toFixed(0)} Kz
                    </span>
                  )}
                </div>

                {/* Data e hora de criacao da entrega */}
                {e.data_hora && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-green-500 shrink-0" />
                    <span className="text-xs text-gray-400">
                      {new Date(e.data_hora).toLocaleDateString('pt-AO', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {/* Observacoes do utilizador — nota que o utilizador deixou ao publicar */}
                {e.observacoes && (
                  <p className="text-xs italic text-gray-500 bg-gray-50 p-2 rounded-lg">"{e.observacoes}"</p>
                )}

                {/* Resumo de pagamento — so aparece depois de a troca estar concluida */}
                {e.valor_utilizador && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mt-2">
                    <p className="text-green-700 text-xs font-medium">Pagamento processado</p>
                    {/* Valor creditado na carteira do utilizador */}
                    <p className="text-green-800 text-sm font-bold">{parseFloat(e.valor_utilizador).toFixed(0)} Kz para utilizador</p>
                    {/* Valor do coletador — so aparece se a entrega usou coletador independente */}
                    {e.valor_coletador && parseFloat(e.valor_coletador) > 0 && (
                      <p className="text-green-600 text-xs">{parseFloat(e.valor_coletador).toFixed(0)} Kz para coletador</p>
                    )}
                  </div>
                )}
              </div>

              {/* Botao Marcar Data — so para entregas com status pendente */}
              {/* A empresa marca a data para informar o utilizador de quando deve aparecer */}
              {/* Apos aceitar com o peso real, o pagamento ja foi feito — nao ha mais accoes */}
              {e.status === 'pendente' && (
                <div className="mt-2 mb-3">

                  {/* Se ja existe uma data proposta, mostra-a com opcao de alterar */}
                  {e.data_recolha_proposta ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex items-center gap-2">
                      <CalendarCheck size={14} className="text-blue-600 shrink-0" />
                      <div>
                        <p className="text-blue-700 text-xs font-medium">Recolha marcada</p>
                        {/* Mostra a data formatada em portugues angolano */}
                        <p className="text-blue-600 text-xs">
                          {new Date(e.data_recolha_proposta).toLocaleString('pt-AO', {
                            weekday: 'short', day: '2-digit', month: 'short',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {/* Botao para abrir o modal e alterar a data ja proposta */}
                      <button
                        onClick={() => { setModalData(e.id_entrega); setDataRecolha(''); setObsEmpresa(''); setErroData(''); }}
                        className="ml-auto text-blue-500 text-xs underline shrink-0">
                        Alterar
                      </button>
                    </div>

                  ) : (
                    // Se ainda nao ha data, mostra o botao para marcar
                    <button
                      onClick={() => { setModalData(e.id_entrega); setDataRecolha(''); setObsEmpresa(''); setErroData(''); }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
                      <CalendarCheck size={14} /> Marcar Data de Recolha
                    </button>
                  )}
                </div>
              )}

              {/* Botoes Aceitar e Rejeitar — so para entregas pendentes */}
              {/* Aceitar: empresa recebeu os residuos e vai registar o peso real para calcular pagamento */}
              {/* Rejeitar: empresa nao pode ou nao quer aceitar — tem de dar um motivo obrigatorio */}
              {e.status === 'pendente' && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Botao Aceitar — abre modal de pesagem */}
                  <button
                    onClick={() => abrirModalAceitar(e.id_entrega)}
                    disabled={acaoEmCurso === e.id_entrega} // desactivado se esta a processar
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
                    <CheckCircle size={14} /> Aceitar
                  </button>
                  {/* Botao Rejeitar — abre modal com campo de motivo obrigatorio */}
                  <button
                    onClick={() => setModalRejeitar(e.id_entrega)}
                    disabled={acaoEmCurso === e.id_entrega} // desactivado se esta a processar
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
                    <XCircle size={14} /> Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL PROPOR DATA DE RECOLHA
          Empresa escolhe a data e hora para o utilizador aparecer
          O utilizador recebe notificacao automaticamente com a data formatada
          Nao e necessaria confirmacao do utilizador — a empresa decide
      ════════════════════════════════════════════════════ */}
      {/* So renderiza se modalData tiver um id de entrega */}
      {modalData && (
        // Overlay escuro sobre toda a pagina — fecha ao clicar fora nao e necessario aqui
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          {/* Contentor do modal — sobe do fundo no mobile, centrado no desktop */}
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">

            {/* Cabecalho do modal com titulo e botao fechar */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <CalendarCheck size={20} /> Marcar Data de Recolha
              </h3>
              {/* Botao X para fechar o modal sem guardar */}
              <button onClick={() => setModalData(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            {/* Explicacao do que acontece quando a data for confirmada */}
            <p className="text-gray-500 text-sm mb-4">
              O utilizador sera notificado automaticamente com a data que marcares.
            </p>

            {/* Campo de data e hora — tipo datetime-local do HTML */}
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold block mb-1">
                Data e hora da recolha <span className="text-red-500">*</span>
              </label>
              {/* Input datetime-local — min evita seleccionar datas no passado */}
              <input type="datetime-local" value={dataRecolha}
                onChange={e => setDataRecolha(e.target.value)}
                min={new Date().toISOString().slice(0, 16)} // minimo = agora
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>

            {/* Campo de nota opcional para o utilizador */}
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold block mb-1">
                Nota para o utilizador (opcional)
              </label>
              {/* Exemplos: "traz ensacado", "vem ao portao lateral" */}
              <textarea value={obsEmpresa} onChange={e => setObsEmpresa(e.target.value)}
                placeholder="Ex: Traz os residuos ensacados. Vem ao portao principal."
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
            </div>

            {/* Erro de validacao — so aparece se a data nao for valida */}
            {erroData && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertCircle size={14} /> {erroData}
              </p>
            )}

            {/* Botoes de accao do modal de data */}
            <div className="flex gap-3">
              {/* Cancelar — fecha o modal sem guardar nada */}
              <button onClick={() => setModalData(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-sm">
                Cancelar
              </button>
              {/* Confirmar — envia a data ao backend e notifica o utilizador */}
              <button onClick={handleProporData} disabled={propondo}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                <CalendarCheck size={16} />
                {propondo ? 'A enviar...' : 'Confirmar Data'} {/* texto muda durante o envio */}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL ACEITAR — REGISTAR PESO REAL
          Abre quando a empresa recebeu fisicamente os residuos
          Empresa pesa na balanca e introduz o valor exacto
          O backend calcula o pagamento automaticamente com esse peso
          A estimativa de pagamento actualiza em tempo real enquanto digita
      ════════════════════════════════════════════════════ */}
      {/* So renderiza se houver uma entrega a aceitar E se a entrega for encontrada na lista */}
      {modalAceitar && entregaAceitar && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">

            {/* Cabecalho com titulo e botao fechar */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <Scale size={20} /> Registar Peso Real
              </h3>
              <button onClick={() => setModalAceitar(null)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Resumo da entrega que esta a ser aceite */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              {/* Tipo de residuo da entrega */}
              <p className="text-green-800 font-medium text-sm">{entregaAceitar.tipos_residuos || 'Residuo'}</p>
              {/* Numero da entrega e nome do utilizador */}
              <p className="text-green-600 text-xs mt-0.5">Entrega #{entregaAceitar.id_entrega} · {entregaAceitar.nome_usuario}</p>
            </div>

            {/* Campo de peso real — a empresa pesa os residuos e introduz aqui */}
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold block mb-1">
                Peso real dos residuos <span className="text-red-500">*</span>
              </label>
              {/* Explicacao do proposito do campo */}
              <p className="text-gray-400 text-xs mb-2">
                Pesa os residuos e introduz o valor exacto para calcular o pagamento.
              </p>
              {/* Input numerico com unidade "kg" sobreposta a direita */}
              <div className="relative">
                <input type="number" min="0.1" step="0.1" value={pesoReal}
                  onChange={e => setPesoReal(e.target.value)} placeholder="Ex: 12.5"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                <span className="absolute right-4 top-3 text-gray-400 text-sm">kg</span> {/* unidade */}
              </div>
            </div>

            {/* Preview do pagamento — so aparece quando o peso e valido */}
            {/* Actualiza em tempo real enquanto a empresa digita o peso */}
            {estimativa && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-2">
                <p className="text-gray-700 text-xs font-semibold flex items-center gap-1">
                  <Leaf size={12} className="text-green-600" /> Resumo do pagamento
                </p>
                {/* Linha 1: valor bruto total antes de comissoes */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Valor total ({pesoReal} kg)</span>
                  <span className="font-medium text-gray-700">{estimativa.valorTotal} Kz</span>
                </div>
                {/* Linha 2: o que o utilizador vai receber na carteira */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Utilizador recebe (70% - 50 Kz)</span>
                  <span className="font-bold text-green-700">{estimativa.valorUtilizador} Kz</span>
                </div>
                {/* Linha 3: comissao do coletador — so se houver coletador nesta entrega */}
                {entregaAceitar.id_coletador && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Coletador recebe (30%)</span>
                    <span className="font-medium text-blue-600">{estimativa.valorColetador} Kz</span>
                  </div>
                )}
                {/* Linha 4 (separada): comissao que fica na plataforma EcoTroca */}
                <div className="flex justify-between text-xs border-t border-gray-200 pt-2">
                  <span className="text-gray-400">Comissao EcoTroca (10% + 50 Kz)</span>
                  <span className="text-gray-500">{estimativa.comissao} Kz</span>
                </div>
              </div>
            )}

            {/* Erro dentro do modal — so aparece se o peso for invalido */}
            {erroAceitar && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertCircle size={14} /> {erroAceitar}
              </p>
            )}

            {/* Botoes de accao do modal de aceitar */}
            <div className="flex gap-3">
              {/* Cancelar — fecha o modal sem processar o pagamento */}
              <button onClick={() => setModalAceitar(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-sm">
                Cancelar
              </button>
              {/* Confirmar e Pagar — envia o peso ao backend e processa o pagamento */}
              {/* Desactivado enquanto o pedido anterior ainda esta em curso */}
              <button onClick={handleAceitar} disabled={acaoEmCurso === modalAceitar}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                <CheckCircle size={16} />
                {acaoEmCurso === modalAceitar ? 'A processar...' : 'Confirmar e Pagar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MODAL REJEITAR
          Abre quando a empresa nao pode ou nao quer aceitar os residuos
          O motivo e OBRIGATORIO — o utilizador vai receber esta mensagem
          A empresa pode pedir fotos e/ou limpeza antes de nova tentativa
      ════════════════════════════════════════════════════ */}
      {/* So renderiza se houver uma entrega a rejeitar */}
      {modalRejeitar && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-xl p-6 w-full max-w-md">

            {/* Titulo do modal com o numero da entrega */}
            <h3 className="text-xl font-bold text-red-600 mb-4">
              Rejeitar Entrega #{modalRejeitar}
            </h3>

            {/* Campo de motivo — OBRIGATORIO */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo da rejeicao <span className="text-red-500">*</span>
              </label>
              {/* Aviso de que o utilizador vai receber esta mensagem */}
              <p className="text-gray-400 text-xs mb-2">O utilizador vai receber esta mensagem.</p>
              {/* Textarea para o motivo — rows=3 para dar espaco suficiente */}
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
                placeholder="Ex: Residuos misturados com lixo organico, plastico sujo..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>

            {/* Opcoes de correccao — o que a empresa pede ao utilizador antes de tentar de novo */}
            <div className="space-y-2 mb-6">
              <p className="text-gray-600 text-xs font-medium mb-1">O que pedes ao utilizador antes de tentar novamente:</p>
              {/* Checkbox: pedir fotos dos residuos */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pedeFoto} onChange={e => setPedeFoto(e.target.checked)} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-gray-700">Pedir fotos dos residuos</span>
              </label>
              {/* Checkbox: pedir limpeza ou organizacao */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pedeLimpeza} onChange={e => setPedeLimpeza(e.target.checked)} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-gray-700">Pedir limpeza ou organizacao antes da recolha</span>
              </label>
            </div>

            {/* Erro de validacao — aparece quando tenta rejeitar sem motivo */}
            {erroRejeitar && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertCircle size={14} /> {erroRejeitar}
              </p>
            )}

            {/* Botoes de accao do modal de rejeitar */}
            <div className="grid grid-cols-2 gap-3">
              {/* Cancelar — fecha o modal e limpa todos os campos */}
              <button
                onClick={() => {
                  setModalRejeitar(null);  // fecha o modal
                  setMotivo('');           // limpa o motivo
                  setPedeFoto(false);      // desmarca a checkbox de fotos
                  setPedeLimpeza(false);   // desmarca a checkbox de limpeza
                  setErro('');             // limpa erro global
                  setErroRejeitar('');     // limpa erro do modal
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-medium transition">
                Cancelar
              </button>
              {/* Confirmar Rejeicao — so funciona se o motivo estiver preenchido */}
              <button onClick={handleRejeitar} disabled={acaoEmCurso === modalRejeitar}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2 rounded-xl font-medium transition">
                {acaoEmCurso === modalRejeitar ? 'A rejeitar...' : 'Confirmar Rejeicao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}