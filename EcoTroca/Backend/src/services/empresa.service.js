
//  Serviço responsável pela lógica de negócio da empresa.

//  REGRAS DE PAGAMENTO:
//    valor_total       = peso_real × valor_por_kg do resíduo
//    comissao_ecotroca = valor_total × 10% + 50 Kz (taxa fixa)
//    valor_liquido     = valor_total - comissao_ecotroca

//    COM coletador:
//      utilizador  = valor_liquido × 70%
//      coletador   = valor_liquido × 30%

//    SEM coletador:
//      utilizador  = valor_liquido × 100%

//  TIPO DE RECOMPENSA (escolhido pelo utilizador na entrega):
//    'dinheiro' → credita em carteira.dinheiro (sacável)
//    'saldo'    → credita em carteira.saldo (só na plataforma)
//    'pontos'   → credita em pontuacaousuario.total_pontos


import pool from '../config/database.js';

// ── processarPagamento 
// Chamado quando a empresa aceita uma entrega e regista o peso real.
// peso_real → peso efectivo pesado pela empresa no momento da recepção.
// 
export const processarPagamento = async (id_entrega, id_empresa, peso_real) => {

  // Valida o peso real — obrigatório e positivo
  if (!peso_real || parseFloat(peso_real) <= 0)
    throw new Error('O peso real é obrigatório e deve ser positivo.');

  const peso = parseFloat(peso_real);

  // Busca o valor por kg do resíduo desta entrega
  // Usa o preco_min como valor base se valor_por_kg não estiver definido
  const [residuos] = await pool.query(
    `SELECT r.valor_por_kg, r.preco_min, r.preco_max
     FROM entrega_residuo er
     JOIN residuo r ON er.id_residuo = r.id_residuo
     WHERE er.id_entrega = ?
     LIMIT 1`,
    [id_entrega]
  );

  if (residuos.length === 0)
    throw new Error('Não foram encontrados resíduos associados a esta entrega.');

  // Usa valor_por_kg se disponível, senão usa preco_min como referência
  const valor_por_kg = parseFloat(residuos[0].valor_por_kg || residuos[0].preco_min || 0);

  if (valor_por_kg <= 0)
    throw new Error('Valor por kg não definido para este resíduo.');

  // ── Cálculo do valor total com o peso real 
  const valor_total       = peso * valor_por_kg;              // valor bruto total
  const taxa_fixa         = 50;                               // taxa fixa da EcoTroca em Kz
  const comissao_ecotroca = (valor_total * 0.10) + taxa_fixa; // 10% + 50 Kz
  const valor_liquido     = valor_total - comissao_ecotroca;  // o que sobra para distribuir

  // Busca dados da entrega: utilizador, coletador e tipo de recompensa
  const [entregas] = await pool.query(
    `SELECT id_usuario, id_coletador, tipo_recompensa
     FROM entrega WHERE id_entrega = ?`,
    [id_entrega]
  );

  if (entregas.length === 0) throw new Error('Entrega não encontrada.');

  const { id_usuario, id_coletador, tipo_recompensa } = entregas[0];

  // ── Calcula quanto vai para cada parte 
  let valor_utilizador = 0;
  let valor_coletador  = 0;

  if (id_coletador) {
    // COM coletador: utilizador 70%, coletador 30% do valor líquido
    valor_utilizador = parseFloat((valor_liquido * 0.70).toFixed(2));
    valor_coletador  = parseFloat((valor_liquido * 0.30).toFixed(2));
  } else {
    // SEM coletador: utilizador recebe 100% do valor líquido
    valor_utilizador = parseFloat(valor_liquido.toFixed(2));
    valor_coletador  = 0;
  }

  // ── Actualiza o peso real e o valor na entrega 
  await pool.query(
    `UPDATE entrega SET
       peso_total       = ?,
       valor_total      = ?,
       valor_utilizador = ?,
       valor_coletador  = ?,
       comissao_ecotroca = ?,
       status           = 'aceita'
     WHERE id_entrega = ?`,
    [peso, valor_total, valor_utilizador, valor_coletador,
     parseFloat(comissao_ecotroca.toFixed(2)), id_entrega]
  );

  // ── Credita na carteira do utilizador 
  if (tipo_recompensa === 'dinheiro') {
    // Dinheiro sacável — vai para carteira.dinheiro
    await pool.query(
      'UPDATE carteira SET dinheiro = dinheiro + ? WHERE id_usuario = ?',
      [valor_utilizador, id_usuario]
    );
  } else if (tipo_recompensa === 'saldo') {
    // Saldo na plataforma — vai para carteira.saldo
    await pool.query(
      'UPDATE carteira SET saldo = saldo + ? WHERE id_usuario = ?',
      [valor_utilizador, id_usuario]
    );
  } else {
    // Pontos — converte Kz em pontos (1 Kz = 1 ponto por simplicidade)
    const pontos = Math.floor(valor_utilizador);
    await pool.query(
      `UPDATE pontuacaousuario
       SET total_pontos = total_pontos + ?, total_entregas = total_entregas + 1
       WHERE id_usuario = ?`,
      [pontos, id_usuario]
    );
  }

  // Notifica o utilizador com o valor recebido
  const tipoMoeda = tipo_recompensa === 'pontos' ? 'pontos' : 'Kz';
  const valorExibir = tipo_recompensa === 'pontos'
    ? Math.floor(valor_utilizador)
    : valor_utilizador.toFixed(0);

  await pool.query(
    `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
     VALUES (?, 'Pagamento recebido', ?, 'sistema')`,
    [id_usuario,
     `Recebeste ${valorExibir} ${tipoMoeda} pela entrega de ${peso} kg de resíduos. Obrigado pela tua contribuição!`]
  );

  // ── Credita comissão do coletador se houver 
  if (id_coletador && valor_coletador > 0) {
    // Vai buscar o id_usuario do coletador para creditar na carteira dele
    const [coletadorInfo] = await pool.query(
      'SELECT id_usuario FROM coletador WHERE id_coletador = ?',
      [id_coletador]
    );

    if (coletadorInfo.length > 0) {
      // Coletador sempre recebe em dinheiro sacável
      await pool.query(
        'UPDATE carteira SET dinheiro = dinheiro + ? WHERE id_usuario = ?',
        [valor_coletador, coletadorInfo[0].id_usuario]
      );

      // Notifica o coletador da comissão recebida
      await pool.query(
        `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
         VALUES (?, 'Comissão recebida', ?, 'sistema')`,
        [coletadorInfo[0].id_usuario,
         `Recebeste ${valor_coletador.toFixed(0)} Kz de comissão pela recolha da entrega #${id_entrega}.`]
      );
    }
  }

  // Devolve o resumo do pagamento para mostrar no frontend
  return {
    valor_total:      parseFloat(valor_total.toFixed(2)),
    comissao_ecotroca: parseFloat(comissao_ecotroca.toFixed(2)),
    valor_liquido:    parseFloat(valor_liquido.toFixed(2)),
    valor_utilizador,
    valor_coletador,
    peso_real:        peso,
  };
};

// ── rejeitarEntrega 
// Empresa rejeita uma entrega pendente.
// Regista o motivo na tabela rejeicao.
// Notifica o utilizador com o motivo e pedidos de correcção.
// 
export const rejeitarEntrega = async (id_entrega, id_empresa, motivo, pede_foto, pede_limpeza) => {

  // Verifica que a entrega existe e está pendente
  const [entregas] = await pool.query(
    `SELECT id_usuario, status FROM entrega WHERE id_entrega = ?`,
    [id_entrega]
  );

  if (entregas.length === 0) throw new Error('Entrega não encontrada.');
  if (entregas[0].status !== 'pendente')
    throw new Error('Só é possível rejeitar entregas pendentes.');

  const { id_usuario } = entregas[0];

  // Regista a rejeição na tabela rejeicao para histórico
  await pool.query(
    `INSERT INTO rejeicao (id_entrega, id_empresa, motivo, pede_foto, pede_limpeza)
     VALUES (?, ?, ?, ?, ?)`,
    [id_entrega, id_empresa, motivo, pede_foto ? 1 : 0, pede_limpeza ? 1 : 0]
  );

  // Monta mensagem explicativa para o utilizador
  let mensagem = `A tua entrega #${id_entrega} foi rejeitada. Motivo: ${motivo}.`;
  if (pede_foto)    mensagem += ' A empresa pede que envies fotos dos resíduos.';
  if (pede_limpeza) mensagem += ' A empresa pede que os resíduos sejam limpos antes da próxima tentativa.';

  // Notifica o utilizador sobre a rejeição
  await pool.query(
    `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
     VALUES (?, 'Entrega rejeitada', ?, 'sistema')`,
    [id_usuario, mensagem]
  );

  return { mensagem: 'Entrega rejeitada com sucesso.' };
};

// ── criarEvento 
// Só empresas e admins podem criar eventos.
// 
export const criarEvento = async (dados, id_empresa, id_usuario_adm) => {
  const { titulo, descricao, data_inicio, data_fim, local, provincia, municipio, tipo } = dados;

  if (!titulo)      throw new Error('O título do evento é obrigatório.');
  if (!data_inicio) throw new Error('A data de início é obrigatória.');

  const [result] = await pool.query(
    `INSERT INTO evento
       (id_empresa, id_usuario_adm, titulo, descricao,
        data_inicio, data_fim, local, provincia, municipio, tipo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id_empresa || null, id_usuario_adm || null,
     titulo, descricao || null, data_inicio, data_fim || null,
     local || null, provincia || null, municipio || null, tipo || 'recolha']
  );

  return { mensagem: 'Evento criado com sucesso!', id_evento: result.insertId };
};