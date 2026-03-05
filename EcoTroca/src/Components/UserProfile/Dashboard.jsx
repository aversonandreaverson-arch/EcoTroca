// ============================================================
//  Dashboard.jsx — Painel do utilizador comum
//  Guardar em: src/Components/UserProfile/Dashboard.jsx
//
//  Aqui mostro as estatísticas e os resíduos publicados.
//  Uso apenas ícones do Lucide — sem emojis nos cards.
//  Os cards de resíduo mostram tipo, qualidade, descrição e preço.
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, PlusCircle, Pencil, Trash2,
  Package, Recycle, Star, Banknote, TrendingDown
} from "lucide-react";
import Header from "./Header";
import { getPerfil, getPontuacao, getMinhasEntregas, cancelarEntrega } from "../../api.js";

export default function Dashboard() {
  const navigate = useNavigate();

  // Aqui guardo os dados vindos do servidor
  const [usuario,    setUsuario]    = useState(null);
  const [pontuacao,  setPontuacao]  = useState(null);
  const [entregas,   setEntregas]   = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      setCarregando(true);
      const [perfil, pts, minhasEntregas] = await Promise.all([
        getPerfil(),
        getPontuacao(),
        getMinhasEntregas(),
      ]);
      setUsuario(perfil);
      setPontuacao(pts);
      setEntregas(minhasEntregas);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // Aqui cancelo uma entrega e recarrego a lista
  const handleCancelar = async (id) => {
    if (!window.confirm('Tens a certeza que queres excluir este resíduo?')) return;
    try {
      await cancelarEntrega(id);
      await carregar();
    } catch (err) {
      alert(err.message);
    }
  };

  // Aqui devolvo o label de qualidade em português
  const labelQualidade = (q) => {
    const mapa = {
      ruim:      'Ruim',
      moderada:  'Moderada',
      boa:       'Boa',
      excelente: 'Excelente',
    };
    return mapa[q] || q;
  };

  if (carregando) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-gray-500">A carregar...</p>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-red-500">{erro}</p>
    </div>
  );

  const nivel          = pontuacao?.recompensa?.nivel       || 'iniciante';
  const totalPontos    = pontuacao?.pontuacao?.pontos_total || 0;
  const totalPublicados = entregas.filter(e => e.status !== 'cancelada').length;
  const totalColetadas  = entregas.filter(e => e.status === 'coletada').length;
  const totalDinheiro   = entregas
    .filter(e => e.status === 'coletada' && e.tipo_recompensa === 'dinheiro')
    .reduce((acc, e) => acc + parseFloat(e.valor_utilizador || 0), 0);

  // Aqui calculo o progresso para o próximo nível
  const calcularProgresso = () => {
    const pontos = totalPontos;
    if (pontos >= 1000) return 100;
    if (pontos >= 500)  return Math.round(((pontos - 500) / 500) * 100);
    if (pontos >= 100)  return Math.round(((pontos - 100) / 400) * 100);
    return Math.round((pontos / 100) * 100);
  };
  const progresso = calcularProgresso();

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <Header />

      <div className="max-w-5xl mx-auto">

        {/* ── Nome e nível do utilizador — igual ao exemplo ── */}
        <div className="bg-green-700 text-white rounded-2xl p-6 mb-6 shadow">
          <p className="text-green-300 text-sm capitalize mb-1">
            EcoAmigo — Nível {nivel}
          </p>
          <h2 className="text-2xl font-bold mb-3">
            {usuario?.nome || 'Utilizador'}
          </h2>
          {/* Barra de progresso */}
          <div className="w-full bg-green-600 rounded-full h-2 mb-1">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="text-green-300 text-xs">{progresso}% para o próximo nível</p>
        </div>

        {/* ── Cards de estatísticas — só ícones Lucide ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Resíduos publicados</p>
              <Package size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalPublicados}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Coletas realizadas</p>
              <Recycle size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalColetadas}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Pontos acumulados</p>
              <Star size={20} className="text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-orange-400">{totalPontos}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Dinheiro ganho</p>
              <Banknote size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalDinheiro.toFixed(0)} Kz</p>
          </div>

        </div>

        {/* ── Cabeçalho da secção de resíduos ── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Meus Resíduos</h2>
          <button
            onClick={() => navigate('/NovoResiduo')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            <PlusCircle size={16} /> Publicar Novo Resíduo
          </button>
        </div>

        {/* ── Grelha de cartões de resíduos ── */}
        {entregas.filter(e => e.status !== 'cancelada').length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">Ainda não publicaste nenhum resíduo.</p>
            <button
              onClick={() => navigate('/NovoResiduo')}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-sm transition"
            >
              Publicar primeiro resíduo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {entregas
              .filter(e => e.status !== 'cancelada')
              .map(e => {
                const tipo = e.tipos_residuos?.split(',')[0]?.trim() || 'Resíduo';

                return (
                  <div key={e.id_entrega} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">

                    {/* Área do ícone — fundo verde claro */}
                    <div className="bg-green-50 flex items-center justify-center h-32">
                      <Package size={52} className="text-green-300" />
                    </div>

                    <div className="p-4">

                      {/* Badge de status e peso real se existir */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          e.status === 'pendente' ? 'bg-green-100 text-green-700'   :
                          e.status === 'aceita'   ? 'bg-yellow-100 text-yellow-700' :
                          e.status === 'coletada' ? 'bg-blue-100 text-blue-700'     :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {e.status === 'pendente' ? 'Disponível'  :
                           e.status === 'aceita'   ? 'Em processo' :
                           e.status === 'coletada' ? 'Concluído'   : e.status}
                        </span>
                        {e.peso_total && parseFloat(e.peso_total) > 0 && (
                          <span className="text-gray-400 text-xs">
                            {parseFloat(e.peso_total).toFixed(1)} kg
                          </span>
                        )}
                      </div>

                      {/* Tipo do resíduo */}
                      <h3 className="font-bold text-gray-800 text-base mb-0.5">{tipo}</h3>

                      {/* Qualidade — vem do campo qualidade da Entrega_Residuo */}
                      {e.qualidade && (
                        <p className="text-xs text-green-600 font-medium mb-0.5">
                          {labelQualidade(e.qualidade)}
                        </p>
                      )}

                      {/* Descrição da qualidade */}
                      {e.descricao_qualidade && (
                        <p className="text-xs text-gray-400 mb-2 line-clamp-1">
                          {e.descricao_qualidade}
                        </p>
                      )}

                      {/* Intervalo de preço esperado */}
                      {e.preco_min && e.preco_max && (
                        <p className="text-xs text-gray-500 mb-3">
                          {e.preco_min} – {e.preco_max} Kz/kg
                        </p>
                      )}

                      {/* Recompensa — dinheiro ou saldo */}
                      <div className="flex items-center gap-2 mb-1">
                        <Banknote size={14} className="text-green-600" />
                        <span className="text-sm text-gray-700">
                          {e.valor_utilizador
                            ? `${parseFloat(e.valor_utilizador).toFixed(0)} Kz`
                            : 'A aguardar pesagem'}
                        </span>
                      </div>

                      {/* Data */}
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={13} className="text-gray-300" />
                        <span className="text-xs text-gray-400">
                          {e.data_hora
                            ? new Date(e.data_hora).toLocaleDateString('pt-AO')
                            : ''}
                        </span>
                      </div>

                      {/* Botões Editar e Excluir — só para pendentes */}
                      {e.status === 'pendente' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/EditarResiduo/${e.id_entrega}`)}
                            className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition"
                          >
                            <Pencil size={13} /> Editar
                          </button>
                          <button
                            onClick={() => handleCancelar(e.id_entrega)}
                            className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition"
                          >
                            <Trash2 size={13} /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ── Actividade recente ── */}
        {entregas.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-600" />
              Atividade Recente
            </h3>
            <ul className="space-y-3">
              {entregas.slice(0, 3).map(e => (
                <li key={e.id_entrega} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    Entrega #{e.id_entrega} — {e.tipos_residuos || 'Resíduo'}
                  </span>
                  <span className={`font-medium ${
                    e.status === 'coletada' ? 'text-green-600'  :
                    e.status === 'aceita'   ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {e.status === 'coletada' ? 'Concluída ✓' :
                     e.status === 'aceita'   ? 'Em processo' : 'Em andamento'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}