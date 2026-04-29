
//  O que esta página faz:
//  Mostro ao admin todos os dados financeiros da plataforma.
//  Cada transacção concluída gera uma comissão de 10% para a
//  plataforma. Aqui o admin pode ver quanto a plataforma ganhou,
//  filtrar por período e ver o detalhe de cada transacção
//  conforme exige a Regra 15 (transparência de dados).
//
//  Regra 15 — cada transacção deve conter:
//  data, hora, utilizador, coletador, empresa,
//  tipo de resíduo, quantidade, valor pago, comissão
// ============================================================

import { useState, useEffect } from 'react';
import {
  Banknote, TrendingUp, Recycle,
  Calendar, Search, Filter, FileText, Users
} from 'lucide-react';
import Header from './Header.jsx';
import { getRelatoriosAdmin } from '../../api.js';

// ── Opções de período de filtragem ──
const PERIODOS = [
  { valor: 'hoje',    label: 'Hoje'        },
  { valor: 'semana',  label: 'Esta Semana' },
  { valor: 'mes',     label: 'Este Mês'    },
  { valor: 'total',   label: 'Todo o Período' },
];

export default function AdminRelatorios() {

  // dados → objecto com resumo financeiro e lista de transacções
  const [dados, setDados] = useState(null);

  // periodo → período actualmente seleccionado para filtrar
  const [periodo, setPeriodo] = useState('mes');

  // carregando → true enquanto os dados não chegaram da API
  const [carregando, setCarregando] = useState(true);

  // erro → mensagem de erro se a API falhar
  const [erro, setErro] = useState('');

  // pesquisa → texto para filtrar a tabela localmente
  const [pesquisa, setPesquisa] = useState('');

  // Sempre que o período muda, vou buscar novos dados à API
  useEffect(() => {
    carregarDados();
  }, [periodo]); // [periodo] → executa sempre que "periodo" muda

  // Vai buscar os dados financeiros filtrados pelo período escolhido
  const carregarDados = async () => {
    try {
      setCarregando(true);
      // GET /api/admin/relatorios?periodo=mes
      const resultado = await getRelatoriosAdmin(periodo);
      setDados(resultado);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // ── Filtragem local da tabela de transacções ──
  const transacoesFiltradas = (dados?.transacoes || []).filter(t => {
    if (!pesquisa) return true;
    const termo = pesquisa.toLowerCase();
    // Filtro por nome do utilizador, empresa, coletador ou tipo de resíduo
    return (
      t.utilizador?.toLowerCase().includes(termo) ||
      t.empresa?.toLowerCase().includes(termo) ||
      t.coletador?.toLowerCase().includes(termo) ||
      t.residuo?.toLowerCase().includes(termo)
    );
  });

  // ── Função para exportar PDF ──
  const exportarPDF = async () => {
    if (!dados?.transacoes?.length) return;

    // Importa jsPDF e autoTable dinamicamente
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const periodoLabel = PERIODOS.find(p => p.valor === periodo)?.label || periodo;
    const dataGeracao  = new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' });

    // ── Cabeçalho ──
    doc.setFillColor(22, 163, 74); // verde
    doc.rect(0, 0, 297, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('EcoTroca Angola — Relatório Financeiro', 14, 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${periodoLabel}   |   Gerado em: ${dataGeracao}`, 14, 20);

    // ── Resumo financeiro ──
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Financeiro', 14, 32);

    const resumoData = [
      ['Total Transaccionado', `${parseFloat(dados.resumo?.total_transaccionado || 0).toFixed(2)} Kz`],
      ['Comissões EcoTroca (10%)', `${parseFloat(dados.resumo?.total_comissoes || 0).toFixed(2)} Kz`],
      ['Pago aos Utilizadores', `${parseFloat(dados.resumo?.total_utilizadores || 0).toFixed(2)} Kz`],
      ['Pago aos Coletadores', `${parseFloat(dados.resumo?.total_coletadores || 0).toFixed(2)} Kz`],
      ['Total de Kg Recolhidos', `${parseFloat(dados.resumo?.total_kg || 0).toFixed(1)} kg`],
      ['Total de Entregas', `${dados.resumo?.total_entregas || 0}`],
    ];

    autoTable(doc, {
      startY: 35,
      body: resumoData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [22, 101, 52] },
        1: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
      tableWidth: 120,
    });

    // ── Tabela de transacções ──
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Detalhe de Transacções (${transacoesFiltradas.length})`, 14, finalY);

    const colunas = ['Data', 'Utilizador', 'Coletador', 'Empresa', 'Resíduo', 'Peso (kg)', 'Valor (Kz)', 'Comissão (Kz)'];
    const linhas  = transacoesFiltradas.map(t => [
      new Date(t.criado_em).toLocaleDateString('pt-AO'),
      t.utilizador || '—',
      t.coletador  || '—',
      t.empresa    || '—',
      t.residuo    || '—',
      parseFloat(t.peso        || 0).toFixed(2),
      parseFloat(t.valor_total || 0).toFixed(2),
      parseFloat(t.comissao    || 0).toFixed(2),
    ]);

    // Linha de totais
    const totalValor    = transacoesFiltradas.reduce((a, t) => a + parseFloat(t.valor_total || 0), 0).toFixed(2);
    const totalComissao = transacoesFiltradas.reduce((a, t) => a + parseFloat(t.comissao    || 0), 0).toFixed(2);
    linhas.push(['TOTAL', '', '', '', '', '', totalValor, totalComissao]);

    autoTable(doc, {
      startY: finalY + 3,
      head: [colunas],
      body: linhas,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right', textColor: [22, 101, 52] },
        7: { halign: 'right', textColor: [202, 138, 4], fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        // Última linha (totais) a negrito
        if (data.row.index === linhas.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 253, 244];
        }
      },
      margin: { left: 14, right: 14 },
    });

    // ── Rodapé ──
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`EcoTroca Angola — Relatório gerado automaticamente — Página ${i} de ${pageCount}`, 14, 205);
    }

    doc.save(`relatorio_ecotroca_${periodo}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };



  // ── Ecrã de carregamento ──
  if (carregando) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-white text-lg">A carregar relatórios...</p>
    </div>
  );

  // ── Ecrã de erro ──
  if (erro) return (
    <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-red-400">{erro}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pt-24 p-6">
      <Header />

      {/* Cabeçalho da página */}
      <div className="bg-white/10 text-white rounded-2xl p-6 shadow-lg mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Banknote size={24} /> Relatórios de Comissões
          </h2>
          <p className="opacity-70 text-sm mt-1">
            Transparência financeira da plataforma — Regra 15
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportarPDF}
            disabled={!dados?.transacoes?.length}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-40 text-white font-medium px-5 py-3 rounded-xl transition text-sm"
          >
            <FileText size={16} /> Exportar PDF
          </button>

        </div>
      </div>

      {/* ── Filtro por período ── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {PERIODOS.map(p => (
          <button
            key={p.valor}
            onClick={() => setPeriodo(p.valor)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              periodo === p.valor
                ? 'bg-white text-gray-900'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Calendar size={14} />
            {p.label}
          </button>
        ))}
      </div>

      {/* ══ SECÇÃO 1 — Cartões de resumo financeiro ══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        {/* Total transaccionado — soma de todos os valor_total das entregas concluídas */}
        <CartaoResumo
          icon={<TrendingUp size={22} className="text-green-400" />}
          label="Total Transaccionado"
          valor={`${parseFloat(dados?.resumo?.total_transaccionado || 0).toFixed(2)} Kz`}
          cor="green"
          descricao="Valor total pago pelas empresas"
        />

        {/* Total de comissões — 10% de cada transacção */}
        <CartaoResumo
          icon={<Banknote size={22} className="text-yellow-400" />}
          label="Comissões da Plataforma"
          valor={`${parseFloat(dados?.resumo?.total_comissoes || 0).toFixed(2)} Kz`}
          cor="yellow"
          descricao="10% de cada transacção concluída"
        />

        {/* Total de kg recolhidos no período */}
        <CartaoResumo
          icon={<Recycle size={22} className="text-blue-400" />}
          label="Kg Recolhidos"
          valor={`${parseFloat(dados?.resumo?.total_kg || 0).toFixed(1)} kg`}
          cor="blue"
          descricao={`${dados?.resumo?.total_entregas || 0} entregas concluídas`}
        />
      </div>

      {/* Cards adicionais — pago a utilizadores e coletadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <CartaoResumo
          icon={<Users size={22} className="text-green-400" />}
          label="Pago aos Utilizadores"
          valor={`${parseFloat(dados?.resumo?.total_utilizadores || 0).toFixed(2)} Kz`}
          cor="green"
          descricao="70% do valor líquido de cada entrega"
        />
        <CartaoResumo
          icon={<Recycle size={22} className="text-blue-400" />}
          label="Pago aos Coletadores"
          valor={`${parseFloat(dados?.resumo?.total_coletadores || 0).toFixed(2)} Kz`}
          cor="blue"
          descricao="30% do valor líquido quando há coletador"
        />
      </div>

      {/* ══ SECÇÃO 2 — Top empresas por volume ══ */}
      {dados?.por_empresa?.length > 0 && (
        <div className="mb-8">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Filter size={18} /> Volume por Empresa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dados.por_empresa.map((e, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-4">
                {/* Nome da empresa */}
                <p className="text-white font-semibold text-sm mb-2">{e.empresa}</p>
                <div className="flex justify-between text-xs text-white/60">
                  <span>{e.total_entregas} entregas</span>
                  <span>{parseFloat(e.total_kg || 0).toFixed(1)} kg</span>
                </div>
                {/* Valor total e comissão gerada por esta empresa */}
                <div className="flex justify-between mt-2">
                  <span className="text-white/70 text-xs">Comissão gerada</span>
                  <span className="text-yellow-300 text-sm font-bold">
                    {parseFloat(e.comissao || 0).toFixed(2)} Kz
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ SECÇÃO 3 — Tabela detalhada de transacções (Regra 15) ══ */}
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Search size={18} /> Detalhe de Transacções
      </h3>

      {/* Barra de pesquisa para filtrar a tabela */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-3.5 text-white/40" />
        <input
          type="text"
          placeholder="Filtrar por utilizador, empresa, coletador ou resíduo..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/40"
        />
      </div>

      {/* Tabela de transacções */}
      <div className="bg-white/10 rounded-2xl overflow-hidden overflow-x-auto">
        {!transacoesFiltradas.length ? (
          <p className="text-white/50 text-center py-12">
            Nenhuma transacção encontrada para este período.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[900px]">

            {/* Cabeçalho da tabela — campos exigidos pela Regra 15 */}
            <thead>
              <tr className="text-white/50 border-b border-white/10 text-left text-xs">
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Utilizador</th>
                <th className="px-4 py-3">Coletador</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Resíduo</th>
                <th className="px-4 py-3 text-right">Peso</th>
                <th className="px-4 py-3 text-right">Valor Pago</th>
                <th className="px-4 py-3 text-right">Comissão (10%)</th>
              </tr>
            </thead>

            <tbody>
              {transacoesFiltradas.map((t, i) => (
                <tr
                  key={i}
                  className="border-b border-white/5 hover:bg-white/5 transition text-white/80"
                >
                  {/* Data e hora separadas para facilitar a leitura */}
                  <td className="px-4 py-3">
                    <p className="text-white/80 text-xs">
                      {new Date(t.criado_em).toLocaleDateString('pt-AO')}
                    </p>
                    <p className="text-white/40 text-xs">
                      {new Date(t.criado_em).toLocaleTimeString('pt-AO')}
                    </p>
                  </td>

                  {/* Nome do utilizador que fez a entrega */}
                  <td className="px-4 py-3 text-xs">{t.utilizador || '—'}</td>

                  {/* Nome do coletador que recolheu */}
                  <td className="px-4 py-3 text-xs">{t.coletador || '—'}</td>

                  {/* Nome da empresa que recebeu */}
                  <td className="px-4 py-3 text-xs">{t.empresa || '—'}</td>

                  {/* Tipo de resíduo entregue */}
                  <td className="px-4 py-3 text-xs">{t.residuo || '—'}</td>

                  {/* Peso em kg */}
                  <td className="px-4 py-3 text-right text-xs">
                    {parseFloat(t.peso || 0).toFixed(2)} kg
                  </td>

                  {/* Valor total pago pela empresa */}
                  <td className="px-4 py-3 text-right text-xs text-green-300">
                    {parseFloat(t.valor_total || 0).toFixed(2)} Kz
                  </td>

                  {/* Comissão de 10% — calculada no backend */}
                  <td className="px-4 py-3 text-right text-xs text-yellow-300 font-semibold">
                    {parseFloat(t.comissao || 0).toFixed(2)} Kz
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Rodapé com os totais da lista filtrada */}
            <tfoot>
              <tr className="border-t border-white/20 text-white font-semibold text-xs">
                <td className="px-4 py-3" colSpan={6}>
                  Total ({transacoesFiltradas.length} transacções)
                </td>
                <td className="px-4 py-3 text-right text-green-300">
                  {transacoesFiltradas
                    .reduce((acc, t) => acc + parseFloat(t.valor_total || 0), 0)
                    .toFixed(2)} Kz
                </td>
                <td className="px-4 py-3 text-right text-yellow-300">
                  {transacoesFiltradas
                    .reduce((acc, t) => acc + parseFloat(t.comissao || 0), 0)
                    .toFixed(2)} Kz
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

// ── CartaoResumo ─────────────────────────────────────────────
// Cartão de resumo financeiro com ícone, valor e descrição
function CartaoResumo({ icon, label, valor, cor, descricao }) {
  const cores = {
    green:  'border-green-400/30',
    yellow: 'border-yellow-400/30',
    blue:   'border-blue-400/30',
  };
  return (
    <div className={`bg-white/10 rounded-2xl p-5 border ${cores[cor] || 'border-white/20'}`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <p className="text-white/60 text-sm">{label}</p>
      </div>
      {/* Valor principal em destaque */}
      <p className="text-white font-bold text-2xl mb-1">{valor}</p>
      {/* Descrição secundária */}
      <p className="text-white/40 text-xs">{descricao}</p>
    </div>
  );
}