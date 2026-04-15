
//  REGRA 7 — Validade da Publicacao
//  Cada publicacao expira apos 7 dias se nao houver interesse
//  de coletor ou empresa.
//
//  Este job corre automaticamente todos os dias as 08:00:
//    1. Dia 6 → envia notificacao de aviso ao utilizador
//    2. Dia 7 → muda status para 'expirada' + notifica utilizador
//
//  Como funciona o node-cron:
//    cron.schedule('0 8 * * *', fn) significa:
//    minuto=0, hora=8, qualquer dia, qualquer mes, qualquer dia da semana
//    ou seja: todos os dias as 08:00

import cron from 'node-cron';
import pool from '../config/database.js';

export const iniciarJobExpiracoes = () => {

  // Corre todos os dias as 08:00 da manha
  cron.schedule('0 8 * * *', async () => {
    console.log(`[JOB] ${new Date().toISOString()} — A verificar publicacoes a expirar...`);

    try {

      // ── 1. AVISO 24H ANTES ───────────────────────────────
      // Busca publicacoes com exactamente 6 dias de vida
      // que ainda estao disponiveis (sem interesse de nenhuma empresa)
      // e que ainda nao receberam o aviso de expiracao
      const [aExpirarAmanha] = await pool.query(
        `SELECT p.id_publicacao, p.titulo, p.id_usuario, u.nome
         FROM publicacao p
         INNER JOIN usuario u ON u.id_usuario = p.id_usuario
         WHERE p.eliminado = 0
           AND p.status = 'disponivel'
           AND p.criado_em <= NOW() - INTERVAL 6 DAY
           AND p.criado_em >  NOW() - INTERVAL 7 DAY
           AND p.aviso_expiracao_enviado = 0`
      );

      for (const pub of aExpirarAmanha) {
        // Envia notificacao de aviso ao utilizador
        await pool.query(
          `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
           VALUES (?, 'A tua publicacao expira em 24 horas', ?, 'sistema')`,
          [
            pub.id_usuario,
            `A tua publicacao "${pub.titulo}" expira amanha por falta de interesse. Se ainda tens os residuos, considera renovar a publicacao.`,
          ]
        );

        // Marca que o aviso ja foi enviado para nao enviar de novo amanha
        await pool.query(
          'UPDATE publicacao SET aviso_expiracao_enviado = 1 WHERE id_publicacao = ?',
          [pub.id_publicacao]
        );

        console.log(`[JOB] Aviso de expiracao enviado para publicacao #${pub.id_publicacao} (${pub.titulo})`);
      }

      console.log(`[JOB] ${aExpirarAmanha.length} avisos de expiracao enviados.`);

      // ── 2. EXPIRAR PUBLICACOES COM 7 DIAS ────────────────
      // Busca publicacoes com 7 ou mais dias de vida
      // que ainda estao disponiveis (sem interesse)
      const [aExpirar] = await pool.query(
        `SELECT p.id_publicacao, p.titulo, p.id_usuario
         FROM publicacao p
         WHERE p.eliminado = 0
           AND p.status = 'disponivel'
           AND p.criado_em <= NOW() - INTERVAL 7 DAY`
      );

      for (const pub of aExpirar) {
        // Muda o status para expirada
        await pool.query(
          "UPDATE publicacao SET status = 'expirada' WHERE id_publicacao = ?",
          [pub.id_publicacao]
        );

        // Notifica o utilizador que a publicacao expirou
        await pool.query(
          `INSERT INTO notificacao (id_usuario, titulo, mensagem, tipo)
           VALUES (?, 'Publicacao expirada', ?, 'sistema')`,
          [
            pub.id_usuario,
            `A tua publicacao "${pub.titulo}" expirou apos 7 dias sem interesse. Podes criar uma nova publicacao a qualquer momento.`,
          ]
        );

        console.log(`[JOB] Publicacao #${pub.id_publicacao} (${pub.titulo}) expirada.`);
      }

      console.log(`[JOB] ${aExpirar.length} publicacoes expiradas.`);

    } catch (err) {
      console.error('[JOB] Erro ao processar expiracao de publicacoes:', err.message);
    }
  });

  console.log('[JOB] Job de expiracao de publicacoes iniciado — corre todos os dias as 08:00.');
};