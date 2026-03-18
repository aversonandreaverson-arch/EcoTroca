
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// GET /api/residuos 
// Devolve todos os resíduos activos com:
// - qualidade e intervalos de preço (preco_min, preco_max)
// - conversão de unidades (nome_unidade e kg_por_unidade)
//
// O JOIN com conversao_residuo permite ao frontend:
// 1. Mostrar "1 garrafa = 0,03 kg" ao lado de cada qualidade
// 2. Converter unidades para kg automaticamente
// 3. Sugerir o nome da unidade (garrafa, saco, peça) no modal
//
// LEFT JOIN — se não houver conversão para um resíduo, devolve null
// em vez de omitir o resíduo (garante compatibilidade futura)
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        r.id_residuo,
        r.tipo,
        r.subtipo,
        r.qualidade,
        r.descricao,
        r.valor_por_kg,
        r.preco_min,
        r.preco_max,
        cr.nome_unidade,    -- ex: garrafa, saco, peça
        cr.kg_por_unidade   -- ex: 0.0300 = 1 garrafa = 0,03 kg
      FROM residuo r
      LEFT JOIN conversao_residuo cr ON cr.id_residuo = r.id_residuo
      ORDER BY
        r.tipo ASC,
        FIELD(r.qualidade, 'ruim', 'moderada', 'boa', 'excelente') ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao carregar resíduos:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ── GET /api/residuos/conversoes 
// Devolve todas as conversões disponíveis agrupadas por tipo.
// Usado pelo modal para sugerir a conversão padrão quando
// a empresa escolhe o tipo de resíduo.
//
// Exemplo de resposta:
// [
//   { tipo: 'Plastico', nome_unidade: 'garrafa', kg_por_unidade: 0.03 },
//   { tipo: 'Papel',    nome_unidade: 'saco',    kg_por_unidade: 2.00 },
// ]
router.get('/conversoes', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT
        r.tipo,
        cr.nome_unidade,
        cr.kg_por_unidade
      FROM conversao_residuo cr
      INNER JOIN residuo r ON r.id_residuo = cr.id_residuo
      GROUP BY r.tipo, cr.nome_unidade, cr.kg_por_unidade
      ORDER BY r.tipo ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao carregar conversões:', err);
    res.status(500).json({ erro: err.message });
  }
});

export default router;