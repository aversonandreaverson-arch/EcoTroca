// ============================================================
//  empresa.service.js
//  Serviço responsável pela lógica de negócio da empresa:
//    - Pagamento ao utilizador e coletador (Regra 16)
//    - Rejeição de resíduos (Regra 17)
//    - Criação e gestão de eventos
// ============================================================

import pool from '../config/database.js';

// ──────────────────────────────────────────────────────────────
// PAGAMENTO — Regra 16
// A empresa é responsável pelo pagamento ao utilizador e coletador
//
// Fluxo:
//   1. Empresa aceita a entrega
//   2. Sistema calcula o valor total dos resíduos
//   3. Plataforma retém 10% de comissão
//   4. Se coletador envolvido: utilizador 70%, coletador 30%
//   5. Se sem coletador: utilizador recebe 100%
// ──────────────────────────────────────────────────────────────
export const processarPagamento = async (id_entrega, id_empresa) => {

  // Busca os resíduos da entrega com o valor por kg de cada um
  const [residuos] = await pool.query(
    `SELECT er.peso_kg, r.valor_por_kg
     FROM Entrega_Residuo er
     JOIN Residuo r ON er.id_residuo = r.id_residuo
     WHERE er.id_entrega = ?`,
    [id_entrega]
  );

  // Calcula o valor total bruto (soma de peso × valor_por_kg)
  const valor_bruto = residuos.reduce(
    (acc, r) => acc + (r.peso_kg || 0) * (r.valor_por_kg || 0), 0
  );

  // Plataforma retém 10% de comissão
  const comissao_plataforma = parseFloat((valor_bruto * 0.10).toFixed(2));
  const valor_liquido        = parseFloat((valor_bruto * 0.90).toFixed(2));

  // Busca os dados da entrega: id do utilizador, coletador e tipo de recompensa
  const [entregas] = await pool.query(
    `SELECT id_usuario, id_coletador, tipo_recompensa
     FROM Entrega WHERE id_entrega = ?`,
    [id_entrega]
  );

  if (entregas.length === 0) throw new Error('Entrega não encontrada.');

  const { id_usuario, id_coletador, tipo_recompensa } = entregas[0];

  // ── Distribui o valor conforme o tipo de recompensa escolhido ──
  if (tipo_recompensa === 'dinheiro') {

    if (id_coletador) {
      // Com coletador: 70% utilizador + 30% coletador
      const valor_usuario   = parseFloat((valor_liquido * 0.70).toFixed(2));
      const valor_coletador = parseFloat((valor_liquido * 0.30).toFixed(2));

      // Credita dinheiro sacável ao utilizador
      await pool.query(
        'UPDATE Carteira SET dinheiro = dinheiro + ? WHERE id_usuario = ?',
        [valor_usuario, id_usuario]
      );

      // Busca o id_usuario do coletador para creditar na carteira dele
      const [coletadorInfo] = await pool.query(
        'SELECT id_usuario FROM Coletador WHERE id_coletador = ?',
        [id_coletador]
      );

      if (coletadorInfo.length > 0) {
        await pool.query(
          'UPDATE Carteira SET dinheiro = dinheiro + ? WHERE id_usuario = ?',
          [valor_coletador, coletadorInfo[0].id_usuario]
        );

        // Notifica o coletador
        await pool.query(
          'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
          [coletadorInfo[0].id_usuario, '💵 Comissão recebida!',
           `Recebeste ${valor_coletador} Kz de comissão pela entrega #${id_entrega}.`]
        );
      }

      // Notifica o utilizador
      await pool.query(
        'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
        [id_usuario, '💰 Pagamento recebido!',
         `Recebeste ${valor_usuario} Kz pela entrega #${id_entrega}.`]
      );

    } else {
      // Sem coletador: utilizador recebe 100% do valor líquido
      await pool.query(
        'UPDATE Carteira SET dinheiro = dinheiro + ? WHERE id_usuario = ?',
        [valor_liquido, id_usuario]
      );

      await pool.query(
        'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
        [id_usuario, '💰 Pagamento recebido!',
         `Recebeste ${valor_liquido} Kz pela entrega #${id_entrega}.`]
      );
    }

  } else if (tipo_recompensa === 'saldo') {
    // Saldo — não pode sacar, só usa na plataforma
    await pool.query(
      'UPDATE Carteira SET saldo = saldo + ? WHERE id_usuario = ?',
      [valor_liquido, id_usuario]
    );

    await pool.query(
      'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
      [id_usuario, '💳 Saldo adicionado!',
       `Recebeste ${valor_liquido} Kz em saldo pela entrega #${id_entrega}.`]
    );
  }

  // Marca a entrega como concluída
  await pool.query(
    `UPDATE Entrega SET status = 'coletada' WHERE id_entrega = ?`,
    [id_entrega]
  );

  return { valor_bruto, comissao_plataforma, valor_liquido };
};

// ──────────────────────────────────────────────────────────────
// REJEIÇÃO DE RESÍDUOS — Regra 17
// Empresa pode rejeitar resíduos danificados, sujos ou suspeitos
// Pode pedir fotos, limpeza ou organização antes de aceitar
// ──────────────────────────────────────────────────────────────
export const rejeitarEntrega = async (id_entrega, id_empresa, motivo, pede_foto, pede_limpeza) => {

  // Verifica se a entrega existe e está pendente
  const [entregas] = await pool.query(
    `SELECT id_usuario, status FROM Entrega WHERE id_entrega = ?`,
    [id_entrega]
  );

  if (entregas.length === 0) throw new Error('Entrega não encontrada.');
  if (entregas[0].status !== 'pendente') throw new Error('Só é possível rejeitar entregas pendentes.');

  const { id_usuario } = entregas[0];

  // Regista a rejeição na tabela Rejeicao
  await pool.query(
    `INSERT INTO Rejeicao (id_entrega, id_empresa, motivo, pede_foto, pede_limpeza)
     VALUES (?, ?, ?, ?, ?)`,
    [id_entrega, id_empresa, motivo, pede_foto || false, pede_limpeza || false]
  );

  // Monta a mensagem de notificação para o utilizador
  let mensagem = `A tua entrega #${id_entrega} foi rejeitada. Motivo: ${motivo}.`;
  if (pede_foto)    mensagem += ' A empresa pede fotos dos resíduos.';
  if (pede_limpeza) mensagem += ' A empresa pede que os resíduos sejam limpos antes da recolha.';

  // Notifica o utilizador sobre a rejeição
  await pool.query(
    'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
    [id_usuario, '❌ Entrega rejeitada', mensagem]
  );

  return { mensagem: 'Entrega rejeitada com sucesso.' };
};

// ──────────────────────────────────────────────────────────────
// CRIAR EVENTO
// Só empresas e admins podem criar eventos (Regra da sessão)
// ──────────────────────────────────────────────────────────────
export const criarEvento = async (dados, id_empresa, id_usuario_adm) => {
  const { titulo, descricao, data_inicio, data_fim, local, provincia, municipio, tipo } = dados;

  if (!titulo)      throw new Error('O título do evento é obrigatório.');
  if (!data_inicio) throw new Error('A data de início é obrigatória.');

  // Insere o evento na base de dados
  const [result] = await pool.query(
    `INSERT INTO Evento
       (id_empresa, id_usuario_adm, titulo, descricao, data_inicio, data_fim, local, provincia, municipio, tipo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id_empresa || null, id_usuario_adm || null,
     titulo, descricao, data_inicio, data_fim, local, provincia, municipio, tipo || 'recolha']
  );

  return { mensagem: 'Evento criado com sucesso!', id_evento: result.insertId };
};