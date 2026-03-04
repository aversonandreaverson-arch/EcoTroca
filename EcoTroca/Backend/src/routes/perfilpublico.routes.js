
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import pool from '../config/database.js';

const router = Router();

// ── GET /api/perfil-publico/:tipo/:id ─────────────────────────
// Devolvo os dados públicos do perfil e as suas publicações no feed
// tipo → 'utilizador', 'empresa' ou 'coletor'
// id   → ID do registo na tabela correspondente
router.get('/:tipo/:id', auth, async (req, res) => {
  try {
    const { tipo, id } = req.params;
    let perfil = null;

    if (tipo === 'utilizador' || tipo === 'coletor') {
      // Vou buscar os dados públicos da tabela Usuario
      // Não exponho a senha nem o email completo por segurança
      const [rows] = await pool.query(`
        SELECT
          id_usuario, nome, provincia, municipio,
          telefone, data_nascimento, data_criacao,
          tipo_usuario
        FROM Usuario
        WHERE id_usuario = ? AND ativo = 1
      `, [id]);

      if (!rows.length) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
      perfil = rows[0];

      // Se for coletador, adiciono os dados extra da tabela Coletador
      if (tipo === 'coletor') {
        const [cRows] = await pool.query(
          'SELECT tipo, id_empresa FROM Coletador WHERE id_usuario = ?',
          [id]
        );
        if (cRows.length) perfil = { ...perfil, ...cRows[0] };
      }

    } else if (tipo === 'empresa') {
      // Vou buscar os dados públicos da empresa
      const [rows] = await pool.query(`
        SELECT
          id_empresa AS id_usuario, nome, provincia,
          municipio, telefone, data_criacao
        FROM EmpresaRecicladora
        WHERE id_empresa = ? AND ativo = 1
      `, [id]);

      if (!rows.length) return res.status(404).json({ erro: 'Empresa não encontrada.' });
      perfil = rows[0];

    } else {
      return res.status(400).json({ erro: 'Tipo de perfil inválido.' });
    }

    // Vou buscar as publicações do feed deste utilizador/empresa
    // Só mostro publicações de resíduos (ofertas e pedidos)
    const id_usuario = tipo === 'empresa' ? null : id;
    const id_para_query = tipo === 'empresa'
      ? await (async () => {
          // Para empresas, procuro pelo id_empresa na tabela Publicacao
          // através do id_usuario do dono da empresa
          const [u] = await pool.query(
            'SELECT id_usuario FROM EmpresaRecicladora WHERE id_empresa = ?', [id]
          );
          return u[0]?.id_usuario;
        })()
      : id;

    const [publicacoes] = await pool.query(`
      SELECT
        p.id_publicacao, p.tipo_publicacao, p.titulo,
        p.descricao, p.quantidade_kg, p.valor_proposto,
        p.provincia, p.criado_em,
        r.tipo AS tipo_residuo
      FROM Publicacao p
      LEFT JOIN Residuo r ON p.id_residuo = r.id_residuo
      WHERE p.id_usuario = ? AND p.eliminado = 0
        AND p.tipo_publicacao IN ('oferta_residuo', 'pedido_residuo')
      ORDER BY p.criado_em DESC
    `, [id_para_query]);

    res.json({ perfil, publicacoes });

  } catch (err) {
    console.error('Erro perfil público:', err);
    res.status(500).json({ erro: err.message });
  }
});

export default router;