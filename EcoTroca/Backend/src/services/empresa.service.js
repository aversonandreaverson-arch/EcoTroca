//  Servico responsavel pela logica de negocio da empresa.

//  REGRAS DE PAGAMENTO:
//    valor_total       = peso_real x valor_por_kg do residuo
//    comissao_ecotroca = valor_total x 10% + 50 Kz (taxa fixa)
//    valor_liquido     = valor_total - comissao_ecotroca
//
//    COM coletador:
//      utilizador  = valor_liquido x 70%
//      coletador   = valor_liquido x 30%
//
//    SEM coletador:
//      utilizador  = valor_liquido x 100%
//
//  TIPO DE RECOMPENSA (escolhido pelo utilizador na entrega):
//    'dinheiro' -> credita em carteira.dinheiro (sacavel)
//    'saldo'    -> credita em carteira.saldo (so na plataforma)
//    'pontos'   -> credita em pontuacaousuario.pontos_total

import pool from '../config/database.js';

// ── processarPagamento ────────────────────────────────────────
// Chamado quando a empresa aceita uma entrega e regista o peso real.
// peso_real -> peso efectivo pesado pela empresa no momento da recepcao.
export const processarPagamento = async (id_entrega, id_empresa, peso_real) => {

  // Valida o peso real — obrigatorio e positivo
  if (!peso_real || parseFloat(peso_real) <= 0)
    throw new Error('O peso real e obrigatorio e deve ser positivo.');

  const peso = parseFloat(peso_real);

  // Busca o valor por kg do residuo desta entrega
  // Usa o preco_min como valor base se valor_por_kg nao estiver definido
  const [residuos] = await pool.query(
    `SELECT r.valor_por_kg, r.preco_min, r.preco_max
     FROM entrega_residuo er
     JOIN residuo r ON er.id_residuo = r.id_residuo
     WHERE er.id_entrega = ?
     LIMIT 1`,
    [id_entrega]
  );

  // Se nao ha residuos associados, usa um valor por defeito da tabela configuracao
  // Permite que entregas sem residuo especifico (participacoes em pedidos) sejam pagas
  let valor_por_kg = 0;

  if (residuos.length > 0) {
    valor_por_kg = parseFloat(residuos[0].valor_por_kg || residuos[0].preco_min || 0);
  }

  // Se ainda nao temos valor, busca o valor_proposto da publicacao associada
  if (valor_por_kg <= 0) {
    const [pubRows] = await pool.query(
      `SELECT p.valor_proposto
       FROM entrega e
       JOIN publicacao p ON p.id_publicacao = e.id_publicacao
       WHERE e.id_entrega = ? AND p.valor_proposto IS NOT NULL`,
      [id_entrega]
    );
    if (pubRows.length > 0) {
      valor_por_kg = parseFloat(pubRows[0].valor_proposto || 0);
    }
  }

  if (valor_por_kg <= 0)
    throw new Error('Valor por kg nao definido para este residuo. Verifica a configuracao do pedido.');

  // ── Calculo do valor total com o peso real ────────────────
  const valor_total       = peso * valor_por_kg;               // valor bruto total
  const taxa_fixa         = 50;                                // taxa fixa da EcoTroca em Kz
  const comissao_ecotroca = (valor_total * 0.10) + taxa_fixa;  // 10% + 50 Kz
  const valor_liquido     = valor_total - comissao_ecotroca;   // o que sobra para distribuir

  // Busca dados da entrega: utilizador, coletador e tipo de recompensa
  const [entregas] = await pool.query(
    `SELECT id_usuario, id_coletador, tipo_recompensa
     FROM entrega WHERE id_entrega = ?`,
    [id_entrega]
  );

  if (entregas.length === 0) throw new Error('Entrega nao encontrada.');

  const { id_usuario, id_coletador, tipo_recompensa } = entregas[0];

  // ── Calcula quanto vai para cada parte ────────────────────
  let valor_utilizador = 0;
  let valor_coletador  = 0;

  if (id_coletador) {
    // COM coletador: utilizador 70%, coletador 30% do valor liquido
    valor_utilizador = parseFloat((valor_liquido * 0.70).toFixed(2));
    valor_coletador  = parseFloat((valor_liquido * 0.30).toFixed(2));
  } else {
    // SEM coletador: utilizador recebe 100% do valor liquido
    valor_utilizador = parseFloat(valor_liquido.toFixed(2));
    valor_coletador  = 0;
  }

  // ── Actualiza o peso real e o valor na entrega ────────────
  // STATUS FINAL: 'coletada' — significa troca concluida e paga
  // (anteriormente estava 'aceita' por engano — corrigido)
  await pool.query(
    `UPDATE entrega SET
       peso_total        = ?,
       valor_total       = ?,
       valor_utilizador  = ?,
       valor_coletador   = ?,
       comissao_ecotroca = ?,
       status            = 'coletada'
     WHERE id_entrega = ?`,
    [peso, valor_total, valor_utilizador, valor_coletador,
     parseFloat(comissao_ecotroca.toFixed(2)), id_entrega]
  );

  // ── Credita na carteira do utilizador ─────────────────────
  if (tipo_recompensa === 'dinheiro') {
    // Dinheiro sacavel — vai para carteira.dinheiro
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
  } else if (tipo_recompensa === 'pontos') {
    // Pontos — multiplica por 2 (bónus por abdicar do dinheiro)
    const pontos = Math.floor(peso * 10 * 2);
    await pool.query(
      `UPDATE pontuacaousuario
       SET pontos_total = pontos_total + ?
       WHERE id_usuario = ?`,
      [pontos, id_usuario]
    );
  }

  // ── Pontos automáticos — atribuídos em TODAS as entregas ──
  // Independentemente da recompensa escolhida, o utilizador ganha pontos
  // Dinheiro → pontos base (×1)
  // Saldo    → pontos base × 1.5 (bónus por ficar na plataforma)
  // Pontos   → já tratado acima com ×2
  if (tipo_recompensa !== 'pontos') {
    const multiplicador = tipo_recompensa === 'saldo' ? 1.5 : 1;
    const pontosAuto    = Math.floor(peso * 10 * multiplicador);

    // Actualiza pontuacaousuario
    await pool.query(
      `UPDATE pontuacaousuario
       SET pontos_total = pontos_total + ?
       WHERE id_usuario = ?`,
      [pontosAuto, id_usuario]
    );

    // Actualiza recompensausuario — calcula o nivel automaticamente
    const totalPontos_r = await pool.query(
      'SELECT pontos_total FROM pontuacaousuario WHERE id_usuario = ?',
      [id_usuario]
    );
    const totalPts = totalPontos_r[0][0]?.pontos_total || 0;
    const nivel = totalPts < 500   ? 'EcoIniciante' :
                  totalPts < 1500  ? 'EcoAmigo'     :
                  totalPts < 4000  ? 'EcoDefensor'  :
                  totalPts < 10000 ? 'EcoMestre'    : 'EcoLenda';

    await pool.query(
      `UPDATE recompensausuario SET pontos_totais = ?, nivel = ? WHERE id_usuario = ?`,
      [totalPts, nivel, id_usuario]
    );
  } else {
    // Para quem escolheu pontos, também actualiza o nível
    const totalPontos_r = await pool.query(
      'SELECT pontos_total FROM pontuacaousuario WHERE id_usuario = ?',
      [id_usuario]
    );
    const totalPts = totalPontos_r[0][0]?.pontos_total || 0;
    const nivel = totalPts < 500   ? 'EcoIniciante' :
                  totalPts < 1500  ? 'EcoAmigo'     :
                  totalPts < 4000  ? 'EcoDefensor'  :
                  totalPts < 10000 ? 'EcoMestre'    : 'EcoLenda';

    await pool.query(
      `UPDATE recompensausuario SET pontos_totais = ?, nivel = ? WHERE id_usuario = ?`,
      [totalPts, nivel, id_usuario]
    );
  }

  // Notifica o utilizador com o valor recebido
  const tipoMoeda  = tipo_recompensa === 'pontos' ? 'pontos' : 'Kz';
  const valorExibir = tipo_recompensa === 'pontos'
    ? Math.floor(valor_utilizador)
    : valor_utilizador.toFixed(0);

  await pool.query(
    `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
     VALUES (?, 'Pagamento recebido', ?, 'sistema')`,
    [id_usuario,
     `Recebeste ${valorExibir} ${tipoMoeda} pela entrega de ${peso} kg de residuos. Obrigado pela tua contribuicao!`]
  );

  // ── Credita comissao do coletador se houver ───────────────
  if (id_coletador && valor_coletador > 0) {
    const [coletadorInfo] = await pool.query(
      'SELECT id_usuario FROM coletador WHERE id_coletador = ?',
      [id_coletador]
    );
    if (coletadorInfo.length > 0) {
      // Coletador sempre recebe em dinheiro sacavel
      await pool.query(
        'UPDATE carteira SET dinheiro = dinheiro + ? WHERE id_usuario = ?',
        [valor_coletador, coletadorInfo[0].id_usuario]
      );
      await pool.query(
        `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
         VALUES (?, 'Comissao recebida', ?, 'sistema')`,
        [coletadorInfo[0].id_usuario,
         `Recebeste ${valor_coletador.toFixed(0)} Kz de comissao pela recolha da entrega #${id_entrega}.`]
      );
    }
  }

  // Devolve o resumo do pagamento para mostrar no frontend
  return {
    valor_total:       parseFloat(valor_total.toFixed(2)),
    comissao_ecotroca: parseFloat(comissao_ecotroca.toFixed(2)),
    valor_liquido:     parseFloat(valor_liquido.toFixed(2)),
    valor_utilizador,
    valor_coletador,
    peso_real: peso,
  };
};

// ── rejeitarEntrega ───────────────────────────────────────────
// Empresa rejeita uma entrega pendente.
// Regista o motivo e notifica o utilizador.
export const rejeitarEntrega = async (id_entrega, id_empresa, motivo, pede_foto, pede_limpeza) => {

  const [entregas] = await pool.query(
    `SELECT id_usuario, status FROM entrega WHERE id_entrega = ?`,
    [id_entrega]
  );

  if (entregas.length === 0) throw new Error('Entrega nao encontrada.');
  if (entregas[0].status !== 'pendente')
    throw new Error('So e possivel rejeitar entregas pendentes.');

  const { id_usuario } = entregas[0];

  // Regista a rejeicao na tabela rejeicao para historico
  try {
    await pool.query(
      `INSERT INTO rejeicao (id_entrega, id_empresa, motivo, pede_foto, pede_limpeza)
       VALUES (?, ?, ?, ?, ?)`,
      [id_entrega, id_empresa, motivo, pede_foto ? 1 : 0, pede_limpeza ? 1 : 0]
    );
  } catch (err) {
    // Tabela rejeicao pode nao existir — ignora silenciosamente
    console.warn('Tabela rejeicao nao existe:', err.message);
  }

  // Monta mensagem para o utilizador
  let mensagem = `A tua entrega #${id_entrega} foi rejeitada. Motivo: ${motivo}.`;

  // Notifica o utilizador sobre a rejeicao
  await pool.query(
    `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
     VALUES (?, 'Entrega rejeitada', ?, 'sistema')`,
    [id_usuario, mensagem]
  );

  return { mensagem: 'Entrega rejeitada com sucesso.' };
};

// ── criarEvento ───────────────────────────────────────────────
export const criarEvento = async (dados, id_empresa, id_usuario_adm) => {
  const { titulo, descricao, data_inicio, data_fim, local, provincia, municipio, tipo } = dados;

  if (!titulo)      throw new Error('O titulo do evento e obrigatorio.');
  if (!data_inicio) throw new Error('A data de inicio e obrigatoria.');

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