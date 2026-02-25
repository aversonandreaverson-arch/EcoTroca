import pool from '../config/database.js';

const calcularPontos = (residuos) => {
  let pontos = 0;
  for (const residuo of residuos) {
    pontos += residuo.peso_kg * 10;
  }
  return Math.round(pontos);
};

const atribuirPontos = async (id_usuario, id_entrega) => {
  const [residuos] = await pool.query(
    'SELECT * FROM Entrega_Residuo WHERE id_entrega = ?',
    [id_entrega]
  );

  const pontos = calcularPontos(residuos);

  // Actualiza pontuação
  await pool.query(
    'UPDATE PontuacaoUsuario SET pontos_total = pontos_total + ? WHERE id_usuario = ?',
    [pontos, id_usuario]
  );

  // Actualiza recompensa e nível
  const [recompensa] = await pool.query(
    'SELECT * FROM RecompensaUsuario WHERE id_usuario = ?',
    [id_usuario]
  );

  const pontos_totais = recompensa[0].pontos_totais + pontos;
  let nivel = 'iniciante';

  if (pontos_totais >= 1000) nivel = 'ouro';
  else if (pontos_totais >= 500) nivel = 'prata';
  else if (pontos_totais >= 100) nivel = 'bronze';

  await pool.query(
    'UPDATE RecompensaUsuario SET pontos_totais = ?, nivel = ? WHERE id_usuario = ?',
    [pontos_totais, nivel, id_usuario]
  );

  // Cria notificação
  await pool.query(
    'INSERT INTO Notificacao (id_usuario, titulo, mensagem) VALUES (?, ?, ?)',
    [id_usuario, 'Pontos ganhos!', `Ganhaste ${pontos} pontos pela entrega #${id_entrega}!`]
  );

  return pontos;
};

export { atribuirPontos };