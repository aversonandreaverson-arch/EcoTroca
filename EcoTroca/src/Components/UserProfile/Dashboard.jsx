
//  SEPARACAO DE ENTREGAS:
//    - "Meus Residuos"       -> entregas sem id_publicacao (criadas pelo utilizador)
//    - "Pedidos em curso"    -> entregas com id_publicacao (participacoes em pedidos de empresa)
//
//  Dados reais:
//    - getPerfil()          -> GET /api/usuarios/perfil
//    - getPontuacao()       -> GET /api/usuarios/pontuacao
//    - getMinhasEntregas()  -> GET /api/entregas

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, PlusCircle, Pencil, Trash2,
  Package, Recycle, Star, Banknote, LogOut, Building2, CheckCircle, Clock, CreditCard
} from "lucide-react";
import Header from "./Header";
import { getPerfil, getPontuacao, getMinhasEntregas, cancelarEntrega, logout, getCarteira } from "../../api.js";

export default function Dashboard() {
  const navigate = useNavigate();

  const [usuario,    setUsuario]    = useState(null);
  const [pontuacao,  setPontuacao]  = useState(null);
  const [entregas,   setEntregas]   = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState("");
  const [carteira,   setCarteira]   = useState(null);

  useEffect(() => { carregar(); }, []);

  // Carrega perfil, pontuacao e entregas em paralelo
  const carregar = async () => {
    try {
      setCarregando(true);
      const [perfil, pts, minhasEntregas, dadosCarteira] = await Promise.all([
        getPerfil(),
        getPontuacao(),
        getMinhasEntregas(),
        getCarteira(),
      ]);
      setUsuario(perfil);
      setPontuacao(pts);
      setEntregas(minhasEntregas);
      setCarteira(dadosCarteira);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // Cancela entrega pendente e remove a publicacao do feed
  const handleCancelar = async (id) => {
    if (!window.confirm("Tens a certeza que queres excluir este residuo?")) return;
    try {
      await cancelarEntrega(id);
      await carregar();
    } catch (err) {
      alert(err.message);
    }
  };

  const labelQualidade = (q) => ({
    ruim: "Ruim", moderada: "Moderada", boa: "Boa", excelente: "Excelente"
  }[q] || q);

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

  // Estatisticas
  const nivel       = pontuacao?.recompensa?.nivel       || "iniciante";
  const totalPontos = pontuacao?.pontuacao?.pontos_total || 0;

  // SEPARACAO: residuos proprios vs participacoes em pedidos de empresa
  // id_publicacao preenchido = participacao num pedido de empresa
  // id_publicacao null       = residuo publicado pelo proprio utilizador
  const meusResiduos  = entregas.filter(e => e.status !== "cancelada" && !e.id_publicacao);
  const participacoes = entregas.filter(e => e.status !== "cancelada" && e.id_publicacao);

  const totalRecolhidas = entregas.filter(e => e.status === "coletada").length;
  // Calcula dinheiro ganho em todas as entregas coletadas com valor preenchido
  // tipo_recompensa pode ser dinheiro, saldo ou pontos
  // Dinheiro sacavel — entregas com tipo_recompensa = 'dinheiro'
  const totalDinheiro = entregas
    .filter(e => e.status === "coletada" && e.tipo_recompensa === "dinheiro" && parseFloat(e.valor_utilizador || 0) > 0)
    .reduce((acc, e) => acc + parseFloat(e.valor_utilizador || 0), 0);

  // Saldo na plataforma — entregas com tipo_recompensa = 'saldo'
  // Usa carteira.saldo do backend que e a fonte de verdade
  const totalSaldo = parseFloat(carteira?.saldo || 0);

  const calcularProgresso = () => {
    const p = totalPontos;
    if (p >= 1000) return 100;
    if (p >= 500)  return Math.round(((p - 500) / 500) * 100);
    if (p >= 100)  return Math.round(((p - 100) / 400) * 100);
    return Math.round((p / 100) * 100);
  };
  const progresso = calcularProgresso();

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <Header />

      <div className="px-2">

        {/* Card de nivel e progresso */}
        <div className="bg-green-700 text-white rounded-2xl p-6 mb-6 shadow">
          <div className="flex items-start justify-between mb-1">
            <p className="text-green-300 text-sm capitalize">EcoAmigo - Nivel {nivel}</p>
            <button onClick={logout}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs transition"
              title="Terminar sessao">
              <LogOut size={14} /> Sair
            </button>
          </div>
          <h2 className="text-2xl font-bold mb-3">{usuario?.nome || "Utilizador"}</h2>
          <div className="w-full bg-green-600 rounded-full h-2 mb-1">
            <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
          </div>
          <p className="text-green-300 text-xs">{progresso}% para o proximo nivel</p>
        </div>

        {/* Estatisticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Residuos publicados</p>
              <Package size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{meusResiduos.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Recolhas concluidas</p>
              <Recycle size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalRecolhidas}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Pontos acumulados</p>
              <Star size={20} className="text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-orange-400">{totalPontos}</p>
          </div>
        </div>

        {/* Cards financeiros — dinheiro e saldo separados */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Dinheiro ganho</p>
              <Banknote size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-700">{totalDinheiro.toFixed(0)} Kz</p>
            <p className="text-xs text-gray-400 mt-1">Sacavel</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">Saldo na plataforma</p>
              <CreditCard size={20} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalSaldo.toFixed(0)} Kz</p>
            <p className="text-xs text-gray-400 mt-1">So na app</p>
          </div>
        </div>

        {/* SECCAO 1: Meus Residuos - publicados pelo proprio utilizador */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Meus Residuos</h2>
          <button onClick={() => navigate("/NovoResiduo")}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            <PlusCircle size={16} /> Publicar Novo Residuo
          </button>
        </div>

        {meusResiduos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center mb-8">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">Ainda nao publicaste nenhum residuo.</p>
            <button onClick={() => navigate("/NovoResiduo")}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-sm transition">
              Publicar primeiro residuo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {meusResiduos.map(e => {
              const tipo = e.tipos_residuos?.split(",")[0]?.trim() || "Residuo";
              return (
                <div key={e.id_entrega} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                  {e.imagem ? (
                    <img src={e.imagem} alt={tipo} className="w-full h-32 object-cover"
                      onError={(ev) => { ev.target.style.display = "none"; }} />
                  ) : (
                    <div className="bg-green-50 flex items-center justify-center h-32">
                      <Package size={52} className="text-green-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        e.status === "pendente" ? "bg-green-100 text-green-700"   :
                        e.status === "aceita"   ? "bg-yellow-100 text-yellow-700" :
                        e.status === "coletada" ? "bg-blue-100 text-blue-700"     :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {e.status === "pendente" ? "Disponivel"  :
                         e.status === "aceita"   ? "Em processo" :
                         e.status === "coletada" ? "Concluido"   : e.status}
                      </span>
                      {e.peso_total && parseFloat(e.peso_total) > 0 && (
                        <span className="text-gray-400 text-xs">{parseFloat(e.peso_total).toFixed(1)} kg</span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-800 text-base mb-0.5">{tipo}</h3>
                    {e.qualidade && <p className="text-xs text-green-600 font-medium mb-0.5">{labelQualidade(e.qualidade)}</p>}
                    {e.descricao_qualidade && <p className="text-xs text-gray-400 mb-2 line-clamp-1">{e.descricao_qualidade}</p>}
                    {e.preco_min && e.preco_max && <p className="text-xs text-gray-500 mb-3">{e.preco_min} - {e.preco_max} Kz/kg</p>}
                    <div className="flex items-center gap-2 mb-1">
                      <Banknote size={14} className="text-green-600" />
                      <span className="text-sm text-gray-700">
                        {e.valor_utilizador ? `${parseFloat(e.valor_utilizador).toFixed(0)} Kz` : "A aguardar pesagem"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={13} className="text-gray-300" />
                      <span className="text-xs text-gray-400">
                        {e.data_hora ? new Date(e.data_hora).toLocaleDateString("pt-AO") : ""}
                      </span>
                    </div>
                    {e.status === "pendente" && (
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/EditarResiduo/${e.id_entrega}`)}
                          className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition">
                          <Pencil size={13} /> Editar
                        </button>
                        <button onClick={() => handleCancelar(e.id_entrega)}
                          className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition">
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

        {/* SECCAO 2: Pedidos em que participo - entregas ligadas a pedidos de empresa */}
        {/* So aparece se o utilizador tiver participado em pelo menos um pedido */}
        {participacoes.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Pedidos em Curso</h2>
              <span className="text-gray-400 text-xs">{participacoes.length} pedido{participacoes.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {participacoes.map(e => (
                <div key={e.id_entrega} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-purple-100">
                  {/* Cabecalho roxo para distinguir dos residuos proprios */}
                  <div className="bg-purple-50 flex items-center justify-center h-20 gap-2">
                    <Building2 size={28} className="text-purple-400" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      {/* Badge de status */}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                        e.status === "pendente" ? "bg-yellow-100 text-yellow-700" :
                        e.status === "aceita"   ? "bg-green-100 text-green-700"   :
                        e.status === "coletada" ? "bg-blue-100 text-blue-700"     :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {e.status === "pendente" && <Clock size={10} />}
                        {e.status === "aceita"   && <CheckCircle size={10} />}
                        {e.status === "pendente" ? "A aguardar empresa" :
                         e.status === "aceita"   ? "Empresa aceitou"   :
                         e.status === "coletada" ? "Concluido"         : e.status}
                      </span>
                    </div>

                    {/* Titulo do pedido - mostra o tipo de residuo se disponivel */}
                    <h3 className="font-bold text-gray-800 text-sm mb-1">
                      Participacao em pedido de empresa
                    </h3>
                    <p className="text-gray-400 text-xs mb-3">
                      Entrega #{e.id_entrega} - {new Date(e.data_hora).toLocaleDateString("pt-AO")}
                    </p>

                    {/* Valor a receber apos conclusao */}
                    <div className="flex items-center gap-2 mb-3">
                      <Banknote size={14} className="text-green-600" />
                      <span className="text-sm text-gray-700">
                        {e.valor_utilizador ? `${parseFloat(e.valor_utilizador).toFixed(0)} Kz` : "A aguardar pesagem"}
                      </span>
                    </div>

                    {/* Botao cancelar - so para pendentes */}
                    {e.status === "pendente" && (
                      <button onClick={() => handleCancelar(e.id_entrega)}
                        className="w-full flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 py-2 rounded-lg text-sm font-medium transition border border-red-200">
                        <Trash2 size={13} /> Cancelar Participacao
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Actividade recente */}
        {entregas.filter(e => e.status !== "cancelada").length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-600" />
              Atividade Recente
            </h3>
            <ul className="space-y-3">
              {entregas.filter(e => e.status !== "cancelada").slice(0, 3).map(e => (
                <li key={e.id_entrega} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {e.id_publicacao
                      ? `Pedido empresa #${e.id_publicacao}`
                      : `Residuo #${e.id_entrega} - ${e.tipos_residuos || "Residuo"}`}
                  </span>
                  <span className={`font-medium ${
                    e.status === "coletada" ? "text-green-600"  :
                    e.status === "aceita"   ? "text-yellow-600" : "text-blue-600"
                  }`}>
                    {e.status === "coletada" ? "Concluida" :
                     e.status === "aceita"   ? "Em processo" : "Em andamento"}
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