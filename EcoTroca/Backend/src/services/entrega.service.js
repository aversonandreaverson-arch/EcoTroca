import pool from '../config/database.js';

// ─────────────────────────────────────────────
// Pontos: sempre gerados automaticamente
// Fórmula: peso_kg * 10 por cada resíduo
// ─────────────────────────────────────────────
const calcularPontos = (residuos) => {
  let pontos = 0;
  for (const residuo of residuos) {
    pontos += (residuo.peso_kg || 0) * 10;
  }
  return Math.round(pontos);
};

// ─────────────────────────────────────────────
// Valor em dinheiro: peso_kg * valor_por_kg
// valor_por_kg vem da tabela Residuo
// ─────────────────────────────────────────────
const calcularValor = (residuos) => {
  let total = 0;
  for (const residuo of residuos) {
    total += (residuo.peso_kg || 0) * (residuo.valor_por_kg || 0);
  }
  return parseFloat(total.toFixed(2));
};

// ─────────────────────────────────────────────
// Atualiza nível de gamificação do utilizador
// ─────────────────────────────────────────────
const atualizarNivel = async (id_usuario, pontos_novos) => {
  const [rows] = await pool.query(
    'SELECT pontos_totais FROM RecompensaUsuario WHERE id_usuario = ?',
    [id_usuario]
  );

  const pontos_totais = (rows[0]?.pontos_totais || 0) + pontos_novos;

  let nivel = 'iniciante';
  if (pontos_totais >= 1000) nivel = 'ouro';
  else if (pontos_totais >= 500) nivel = 'prata';
  else if (pontos_totais >= 100) nivel = 'bronze';

  await pool.query(
    'UPDATE RecompensaUsuario SET pontos_totais = ?, nivel = ? WHERE id_usuario = ?',
    [pontos_totais, nivel, id_usuario]
  );
  await pool.query(
    'UPDATE PontuacaoUsuario SET pontos_total = pontos_total + ? WHERE id_usuario = ?',
    [pontos_novos, id_usuario]
  );

  return { pontos_totais, nivel };
};

// ─────────────────────────────────────────────
// Função principal — chamada quando a entrega
// é confirmada como recolhida
//
// tipo_recompensa:
//   'dinheiro' → utilizador recebe 70% em dinheiro (sacável)
//               coletador recebe 30% em dinheiro (sacável)
//   'saldo'    → utilizador recebe 100% em saldo (só na app)
//               coletador não recebe valor monetário
//
// Pontos → sempre gerados automaticamente para o utilizador
// ─────────────────────────────────────────────
const atribuirRecompensa = async (id_usuario, id_entrega, tipo_recompensa, id_coletador = null) => {

  // Busca resíduos da entrega com valor_por_kg da tabela Residuo
  const [residuos] = await pool.query(
    `SELECT er.peso_kg, r.valor_por_kg
     FROM Entrega_Residuo er
     JOIN Residuo r ON er.id_residuo = r.id_residuo
     WHERE er.id_entrega = ?`,
    [id_entrega]
  );

  const pontos = calcularPontos(residuos);
  const valor_total = calcularValor(residuos);

  // ── 1. Pontos automáticos para o utilizador (sempre) ──
  const { nivel } = await atualizarNivel(id_usuario, pontos);

  await pool.query(
    'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
    [id_usuario, '🌱 Pontos ganhos!', `Ganhaste ${pontos} pontos pela entrega #${id_entrega}!`]
  );

  // ── 2. Recompensa monetária conforme escolha do utilizador ──
  if (tipo_recompensa === 'dinheiro') {
    const valor_usuario   = parseFloat((valor_total * 0.70).toFixed(2)); // 70%
    const valor_coletador = parseFloat((valor_total * 0.30).toFixed(2)); // 30%

    // Credita dinheiro ao utilizador (sacável)
    await pool.query(
      'UPDATE Carteira SET dinheiro = dinheiro + ? WHERE id_usuario = ?',
      [valor_usuario, id_usuario]
    );

    await pool.query(
      'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
      [id_usuario, '💰 Dinheiro recebido!', `Recebeste ${valor_usuario} Kz pela entrega #${id_entrega}!`]
    );

    // Credita comissão ao coletador (30%) — só se houver coletador
    if (id_coletador) {
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

        await pool.query(
          'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
          [coletadorInfo[0].id_usuario, '💵 Comissão recebida!', `Recebeste ${valor_coletador} Kz de comissão pela entrega #${id_entrega}!`]
        );
      }

      // Regista pontos do coletador
      await pool.query(
        'INSERT INTO RecompensaColetador (id_coletador, id_entrega, pontos_recebidos, descricao) VALUES (?, ?, ?, ?)',
        [id_coletador, id_entrega, pontos, `Comissão de ${valor_coletador} Kz + ${pontos} pontos — entrega #${id_entrega}`]
      );
    }

  } else if (tipo_recompensa === 'saldo') {
    // Saldo — não pode sacar, só usa na plataforma
    await pool.query(
      'UPDATE Carteira SET saldo = saldo + ? WHERE id_usuario = ?',
      [valor_total, id_usuario]
    );

    await pool.query(
      'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
      [id_usuario, '💳 Saldo adicionado!', `Recebeste ${valor_total} Kz em saldo pela entrega #${id_entrega}!`]
    );

    // Coletador recebe só pontos (sem comissão monetária quando utilizador escolhe saldo)
    if (id_coletador) {
      await pool.query(
        'INSERT INTO RecompensaColetador (id_coletador, id_entrega, pontos_recebidos, descricao) VALUES (?, ?, ?, ?)',
        [id_coletador, id_entrega, pontos, `${pontos} pontos — entrega #${id_entrega}`]
      );
    }
  }

  return { pontos, valor_total, nivel };
};

export { atribuirRecompensa };