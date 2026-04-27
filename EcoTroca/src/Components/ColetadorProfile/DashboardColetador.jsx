
//  Funciona para DOIS tipos de coletador:
//
//  INDEPENDENTE:
//    - Ve entregas pendentes de utilizadores
//    - Pode aceitar pedidos por conta propria
//    - Recebe comissao de 30% do valor
//
//  DEPENDENTE:
//    - Trabalha para uma empresa especifica
//    - Ve as recolhas designadas pela empresa
//    - Nao recebe dinheiro — e pago pela empresa fora da plataforma
//    - Nao pode aceitar pedidos por conta propria
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck, CheckCircle, Clock, Star, TrendingUp,
  Building2, Bell, MapPin, CalendarCheck, Package, X, AlertCircle
} from "lucide-react";
import Header from "./Header.jsx";
import { getPerfil, getEntregasPendentes, getNotificacoes, criarAvaliacao, getAvaliacoesEntrega, getMedalhasMinhas } from "../../api.js";

export default function DashboardColetador() {
  const navigate = useNavigate();

  // Dados do perfil e estado geral
  const [perfil,     setPerfil]     = useState(null);
  const [entregas,   setEntregas]   = useState([]);
  const [notifs,     setNotifs]     = useState([]); // notificacoes de recolhas designadas
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState("");

  // Tipo do coletador — vem do perfil
  // 'dependente' = trabalha para uma empresa
  // 'independente' = trabalha por conta propria
  const [tipoColetador, setTipoColetador] = useState("independente");
  const [nomeEmpresa,   setNomeEmpresa]   = useState("");
  const [medalhas,      setMedalhas]      = useState([]);

  // Modal avaliação
  const [modalAvaliacao, setModalAvaliacao] = useState(null);
  const [notaAvaliacao,  setNotaAvaliacao]  = useState(0);
  const [comentario,     setComentario]     = useState('');
  const [enviandoAval,   setEnviandoAval]   = useState(false);
  const [erroAval,       setErroAval]       = useState('');
  const [jaAvaliou,      setJaAvaliou]      = useState({});

  useEffect(() => {
    carregar();
    actualizarLocalizacao();
  }, []);

  // Actualiza a localização GPS do coletador automaticamente
  const actualizarLocalizacao = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const token = localStorage.getItem('token');
          await fetch('http://localhost:3000/api/coletador/localizacao', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              latitude:  pos.coords.latitude,
              longitude: pos.coords.longitude,
            })
          });
        } catch (err) {
          console.error('Erro ao actualizar localização:', err);
        }
      },
      (err) => console.warn('Geolocalização não disponível:', err.message)
    );
  };

  const carregar = async () => {
    try {
      // Carrega perfil e entregas em paralelo
      const [dadosPerfil, dadosEntregas, dadosNotifs, minhasMedalhas] = await Promise.all([
        getPerfil(),
        getEntregasPendentes(),
        getNotificacoes(),
        getMedalhasMinhas(),
      ]);
      setMedalhas(minhasMedalhas || []);

      setPerfil(dadosPerfil);
      setEntregas(dadosEntregas || []);

      // Filtra apenas notificacoes de recolhas designadas pela empresa
      // Estas sao as ordens que a empresa enviou ao coletador
      const recolhasDesignadas = (dadosNotifs || []).filter(n =>
        n.titulo === 'Nova recolha designada' && !n.lida
      );
      setNotifs(recolhasDesignadas);

      // Determina o tipo do coletador a partir dos dados do perfil
      // O backend agora devolve tipo_coletador e nome_empresa para coletadores
      if (dadosPerfil?.tipo_coletador === 'dependente') {
        setTipoColetador('dependente');
        setNomeEmpresa(dadosPerfil.nome_empresa || 'a tua empresa');
      } else {
        setTipoColetador('independente');
      }

      // Verifica quais entregas concluidas ja foram avaliadas
      const concluidas = (dadosEntregas || []).filter(e => e.status === 'coletada');
      const avalMap = {};
      await Promise.all(concluidas.map(async e => {
        try {
          const r = await getAvaliacoesEntrega(e.id_entrega);
          avalMap[e.id_entrega] = r.ja_avaliou || [];
        } catch { avalMap[e.id_entrega] = []; }
      }));
      setJaAvaliou(avalMap);

    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center pt-24">
      <Header />
      <p className="text-gray-500 text-lg">A carregar...</p>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center pt-24">
      <Header />
      <div className="bg-white p-6 rounded-xl text-center">
        <p className="text-red-600 mb-4">{erro}</p>
        <button onClick={() => navigate("/Login")}
          className="bg-green-600 text-white px-4 py-2 rounded-lg">
          Fazer Login
        </button>
      </div>
    </div>
  );

  // Calcula estatisticas a partir das entregas
  const concluidas = entregas.filter(e => e.status === "coletada");
  const emCurso    = entregas.filter(e => e.status === "aceita");
  const aguardando = entregas.filter(e => e.status === "pendente");

  // Abre modal de avaliação
  const abrirAvaliacao = (entrega, alvo) => {
    setModalAvaliacao({ entrega, alvo });
    setNotaAvaliacao(0);
    setComentario('');
    setErroAval('');
  };

  // Envia avaliação
  const handleAvaliar = async () => {
    if (notaAvaliacao === 0) { setErroAval('Selecciona uma nota de 1 a 5 estrelas.'); return; }
    try {
      setEnviandoAval(true); setErroAval('');
      const { entrega, alvo } = modalAvaliacao;

      // id_avaliado: se for empresa usa id_empresa_usuario, senão usa id_usuario
      const id_avaliado = alvo === 'empresa'
        ? entrega.id_empresa_usuario || entrega.id_empresa
        : entrega.id_usuario;

      await criarAvaliacao({
        id_entrega:    entrega.id_entrega,
        id_avaliado,
        tipo_avaliado: alvo,
        nota:          notaAvaliacao,
        comentario:    comentario || null,
      });

      setJaAvaliou(prev => ({
        ...prev,
        [entrega.id_entrega]: [...(prev[entrega.id_entrega] || []), alvo]
      }));
      setModalAvaliacao(null);
    } catch (err) {
      setErroAval(err.message);
    } finally {
      setEnviandoAval(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <Header />

      {/* Banner do perfil — cor diferente por tipo */}
      <div className={`text-white rounded-2xl p-6 shadow-lg mb-6 ${
        tipoColetador === 'dependente' ? 'bg-purple-700' : 'bg-green-700'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Ola, {perfil?.nome || "Coletador"}!
            </h2>
            <p className="opacity-80 text-sm">
              {tipoColetador === 'dependente'
                ? `Coletador da empresa ${nomeEmpresa}`
                : 'Coletador Independente — EcoTroca Angola'
              }
            </p>
            {perfil?.municipio && (
              <p className="text-sm mt-1 opacity-70 flex items-center gap-1">
                <MapPin size={12} /> {perfil.municipio}, {perfil.provincia}
              </p>
            )}
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <Truck size={28} className="mx-auto mb-1" />
            <p className="text-xs font-medium">
              {tipoColetador === 'dependente' ? 'Dependente' : 'Independente'}
            </p>
          </div>
        </div>

        {/* Aviso especifico para coletador dependente */}
        {tipoColetador === 'dependente' && (
          <div className="mt-4 bg-white/20 rounded-xl p-3">
            <p className="text-xs font-medium flex items-center gap-2">
              <Building2 size={14} />
              As tuas recolhas sao designadas por {nomeEmpresa}. Aguarda as ordens no sino de notificacoes.
            </p>
          </div>
        )}
      </div>

      {/* Notificacoes de recolhas designadas — so para coletador dependente */}
      {tipoColetador === 'dependente' && notifs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5 mb-6">
          <h3 className="text-purple-700 font-bold text-base mb-4 flex items-center gap-2">
            <Bell size={18} className="text-purple-500" />
            Recolhas Designadas pela Empresa
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {notifs.length}
            </span>
          </h3>
          <div className="space-y-3">
            {notifs.map(n => (
              <div key={n.id_notificacao}
                className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <p className="text-purple-800 font-semibold text-sm mb-1">{n.titulo}</p>
                <p className="text-gray-600 text-xs leading-relaxed">{n.mensagem}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(n.data).toLocaleDateString('pt-AO', {
                    day: '2-digit', month: 'short',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards de estatisticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        {/* Pendentes — so relevante para independente */}
        {tipoColetador === 'independente' && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-500 text-sm font-medium">Pendentes</h3>
              <Clock size={18} className="text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{aguardando.length}</p>
            <p className="text-xs text-gray-400 mt-1">a aguardar</p>
          </div>
        )}

        {/* Recolhas designadas — so para dependente */}
        {tipoColetador === 'dependente' && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-500 text-sm font-medium">Designadas</h3>
              <CalendarCheck size={18} className="text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{notifs.length}</p>
            <p className="text-xs text-gray-400 mt-1">pela empresa</p>
          </div>
        )}

        {/* Em curso */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Em curso</h3>
            <Truck size={18} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{emCurso.length}</p>
          <p className="text-xs text-gray-400 mt-1">em andamento</p>
        </div>

        {/* Concluidas */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Concluidas</h3>
            <CheckCircle size={18} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{concluidas.length}</p>
          <p className="text-xs text-gray-400 mt-1">recolhas feitas</p>
        </div>

        {/* Pontos — so para independente que recebe recompensa */}
        {tipoColetador === 'independente' && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-500 text-sm font-medium">Meus Pontos</h3>
              <Star size={18} className="text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {concluidas.reduce((acc, e) => acc + (e.pontos_recebidos || 10), 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">pontos ganhos</p>
          </div>
        )}
      </div>

      {/* Lista de pedidos pendentes — so para coletador independente */}
      {tipoColetador === 'independente' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-green-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
              <Clock size={18} className="text-yellow-500" /> Pedidos Pendentes
            </h3>
            <button onClick={() => navigate("/PedidosPendentes")}
              className="text-sm text-green-600 hover:underline">
              Ver todos →
            </button>
          </div>
          {aguardando.length === 0 ? (
            <p className="text-gray-400 text-center py-4 text-sm">
              Sem pedidos pendentes no momento.
            </p>
          ) : (
            <ul className="space-y-3">
              {aguardando.slice(0, 3).map(e => (
                <li key={e.id_entrega}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {e.tipo_residuo || "Residuo"} — {e.peso_total || "?"} kg
                    </p>
                    <p className="text-xs text-gray-400">
                      {e.endereco_domicilio || e.nome_usuario}
                    </p>
                  </div>
                  <button onClick={() => navigate("/PedidosPendentes")}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition">
                    Ver
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Mensagem para coletador dependente sem recolhas */}
      {tipoColetador === 'dependente' && notifs.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-purple-100">
          <CalendarCheck size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">Sem recolhas designadas de momento.</p>
          <p className="text-gray-400 text-sm mt-1">
            A empresa {nomeEmpresa} vai notificar-te quando houver uma recolha para fazeres.
          </p>
        </div>
      )}

      {/* Medalhas */}
      {medalhas.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-orange-100">
          <h3 className="text-green-800 font-bold text-base mb-3">🏅 As minhas Medalhas</h3>
          <div className="grid grid-cols-2 gap-3">
            {medalhas.map((m, i) => {
              const ICONES = { primeira_avaliacao: "🌱", "5_estrelas_10x": "⭐", "5_estrelas_50x": "🏆", media_5_estrelas: "💎" };
              return (
                <div key={i} className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-2xl">{ICONES[m.tipo] || "🏅"}</span>
                  <div>
                    <p className="text-gray-800 text-xs font-semibold">{m.nome}</p>
                    <p className="text-gray-400 text-xs">{m.descricao}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actividade recente */}
      {entregas.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 border border-green-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-600" /> Actividade Recente
          </h3>
          <ul className="space-y-3">
            {entregas.slice(0, 4).map(e => (
              <li key={e.id_entrega}
                className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Entrega #{e.id_entrega} — {e.tipo_residuo || e.tipos_residuos || "Residuo"}
                </span>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    e.status === "coletada" ? "bg-green-100 text-green-700"  :
                    e.status === "aceita"   ? "bg-blue-100 text-blue-700"    :
                                              "bg-yellow-100 text-yellow-700"
                  }`}>
                    {e.status === "coletada" ? "Concluida" :
                     e.status === "aceita"   ? "Em curso"  : "Pendente"}
                  </span>
                  {e.status === "coletada" && !(jaAvaliou[e.id_entrega] || []).includes('utilizador') && (
                    <button onClick={() => abrirAvaliacao(e, 'utilizador')}
                      className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-lg transition flex items-center gap-1">
                      <Star size={10} /> Avaliar utilizador
                    </button>
                  )}
                  {e.status === "coletada" && !(jaAvaliou[e.id_entrega] || []).includes('empresa') && (
                    <button onClick={() => abrirAvaliacao(e, 'empresa')}
                      className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded-lg transition flex items-center gap-1">
                      <Star size={10} /> Avaliar empresa
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* MODAL AVALIAÇÃO */}
      {modalAvaliacao && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <Star size={20} /> Avaliar {modalAvaliacao.alvo === 'empresa' ? 'Empresa' : 'Utilizador'}
              </h3>
              <button onClick={() => setModalAvaliacao(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              <p className="text-green-800 text-sm font-medium">Entrega #{modalAvaliacao.entrega.id_entrega}</p>
              <p className="text-green-600 text-xs mt-0.5">
                {modalAvaliacao.alvo === 'empresa'
                  ? (modalAvaliacao.entrega.nome_empresa || 'Empresa')
                  : (modalAvaliacao.entrega.nome_usuario || 'Utilizador')}
              </p>
            </div>

            <div className="mb-4">
              <label className="text-gray-700 text-sm font-medium block mb-2">
                Como foi a experiência? <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setNotaAvaliacao(n)} className="transition transform hover:scale-110">
                    <Star size={36} className={n <= notaAvaliacao ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
              {notaAvaliacao > 0 && (
                <p className="text-center text-sm mt-2 text-gray-600">
                  {notaAvaliacao === 1 ? 'Muito má' : notaAvaliacao === 2 ? 'Má' : notaAvaliacao === 3 ? 'Razoável' : notaAvaliacao === 4 ? 'Boa' : 'Excelente'}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="text-gray-600 text-sm block mb-1">Comentário (opcional)</label>
              <textarea value={comentario} onChange={e => setComentario(e.target.value)}
                placeholder="Como foi o pagamento, a pontualidade, o tratamento?"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
            </div>

            {erroAval && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertCircle size={14} /> {erroAval}
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setModalAvaliacao(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition">
                Cancelar
              </button>
              <button onClick={handleAvaliar} disabled={enviandoAval}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                <Star size={16} /> {enviandoAval ? 'A enviar...' : 'Enviar Avaliação'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}