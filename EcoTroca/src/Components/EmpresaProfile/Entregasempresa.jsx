import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  CheckCircle, XCircle, Package, User, MapPin,
  Clock, Scale, AlertCircle, X, Leaf, CalendarCheck,
  Truck, Users, Map, Star
} from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import {
  getEntregasEmpresa,
  aceitarEntregaEmpresa,
  rejeitarEntregaEmpresa,
  proporDataRecolha,
  getColetadoresEmpresa,
  criarAvaliacao,
  getAvaliacoesEntrega,
} from '../../api.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const iconeVermelho = new L.Icon({
  iconUrl:       'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:      [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export default function EntregasEmpresa() {

  const [entregas,    setEntregas]    = useState([]);
  const [filtro,      setFiltro]      = useState('pendente');
  const [carregando,  setCarregando]  = useState(true);
  const [erro,        setErro]        = useState('');
  const [coletadores, setColetadores] = useState([]);

  const [modalMapa,      setModalMapa]      = useState(null);
  const [modalAceitar,   setModalAceitar]   = useState(null);
  const [pesoReal,       setPesoReal]       = useState('');
  const [erroAceitar,    setErroAceitar]    = useState('');
  const [modalRejeitar,  setModalRejeitar]  = useState(null);
  const [motivo,         setMotivo]         = useState('');
  const [erroRejeitar,   setErroRejeitar]   = useState('');
  const [modalData,      setModalData]      = useState(null);
  const [dataRecolha,    setDataRecolha]    = useState('');
  const [obsEmpresa,     setObsEmpresa]     = useState('');
  const [erroData,       setErroData]       = useState('');
  const [propondo,       setPropondo]       = useState(false);
  const [coletadoresSel, setColetadoresSel] = useState([]);
  const [acaoEmCurso,    setAcaoEmCurso]    = useState(null);

  // Modal avaliação
  const [modalAvaliacao, setModalAvaliacao] = useState(null); // { entrega, alvo: 'utilizador'|'coletador' }
  const [notaAvaliacao,  setNotaAvaliacao]  = useState(0);
  const [comentario,     setComentario]     = useState('');
  const [enviandoAval,   setEnviandoAval]   = useState(false);
  const [erroAval,       setErroAval]       = useState('');
  const [jaAvaliou,      setJaAvaliou]      = useState({}); // { id_entrega: [tipos] }

  useEffect(() => {
    carregarTudo();
    getColetadoresEmpresa()
      .then(dados => setColetadores((dados || []).filter(c => c.tipo === 'dependente')))
      .catch(console.error);
  }, []);

  const carregarTudo = async () => {
    try {
      setErro('');
      const dados = await getEntregasEmpresa();
      setEntregas(dados);

      // Verifica quais entregas concluidas ja foram avaliadas
      const concluidas = dados.filter(e => e.status === 'coletada');
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

  const carregar = async () => {
    try {
      setErro('');
      const dados = await getEntregasEmpresa();
      setEntregas(dados);
    } catch (err) { setErro(err.message); }
    finally { setCarregando(false); }
  };

  const entregasFiltradas = filtro === 'todos' ? entregas : entregas.filter(e => e.status === filtro);

  const calcularEstimativa = (peso, valorKg) => {
    const p = parseFloat(peso), vkg = parseFloat(valorKg);
    if (!p || !vkg || p <= 0 || vkg <= 0) return null;
    const valorTotal = p * vkg;
    return {
      valorTotal:      valorTotal.toFixed(0),
      valorUtilizador: Math.max(0, (valorTotal * 0.70) - 50).toFixed(0),
      valorColetador:  (valorTotal * 0.30).toFixed(0),
      comissao:        ((valorTotal * 0.10) + 50).toFixed(0),
    };
  };

  const entregaAceitar = entregas.find(e => e.id_entrega === modalAceitar);
  const estimativa = entregaAceitar
    ? calcularEstimativa(pesoReal, entregaAceitar.valor_por_kg || entregaAceitar.preco_min)
    : null;

  const abrirModalAceitar = (id) => { setModalAceitar(id); setPesoReal(''); setErroAceitar(''); };
  const abrirModalData    = (id) => { setModalData(id); setDataRecolha(''); setObsEmpresa(''); setErroData(''); setColetadoresSel([]); };
  const toggleColetador   = (id) => setColetadoresSel(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

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

      // id_avaliado depende do alvo
      const id_avaliado = alvo === 'utilizador'
        ? entrega.id_usuario
        : entrega.id_coletador_usuario; // id_usuario do coletador

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

  const handleAceitar = async () => {
    if (!pesoReal || parseFloat(pesoReal) <= 0) { setErroAceitar('Introduz o peso real dos residuos em kg.'); return; }
    try {
      setAcaoEmCurso(modalAceitar); setErroAceitar('');
      await aceitarEntregaEmpresa(modalAceitar, parseFloat(pesoReal));
      setModalAceitar(null); setPesoReal('');
      await carregar();
    } catch (err) { setErroAceitar(err.message); }
    finally { setAcaoEmCurso(null); }
  };

  const handleRejeitar = async () => {
    if (!motivo.trim()) { setErroRejeitar('O motivo da rejeicao e obrigatorio.'); return; }
    try {
      setAcaoEmCurso(modalRejeitar); setErroRejeitar('');
      await rejeitarEntregaEmpresa(modalRejeitar, motivo, false, false);
      setModalRejeitar(null); setMotivo(''); setErroRejeitar('');
      await carregar();
    } catch (err) { setErro(err.message); }
    finally { setAcaoEmCurso(null); }
  };

  const handleProporData = async () => {
    if (!dataRecolha) { setErroData('Selecciona a data e hora da recolha.'); return; }
    if (new Date(dataRecolha) <= new Date()) { setErroData('A data tem de ser no futuro.'); return; }
    try {
      setPropondo(true); setErroData('');
      await proporDataRecolha(modalData, { data_recolha: dataRecolha, observacoes: obsEmpresa || null, id_coletadores: coletadoresSel });
      setModalData(null); setDataRecolha(''); setObsEmpresa(''); setColetadoresSel([]);
      await carregar();
    } catch (err) { setErroData(err.message); }
    finally { setPropondo(false); }
  };

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12 px-6">
      <HeaderEmpresa />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-800">Gestao de Entregas</h1>
        <p className="text-gray-500 mt-1">Aceita ou rejeita os residuos recebidos dos utilizadores.</p>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle size={16} /> {erro}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[
          { val: 'pendente',        label: 'Pendentes'         },
          { val: 'aceita',          label: 'Aceites'           },
          { val: 'aguarda_pesagem', label: 'Aguarda Pesagem'   },
          { val: 'coletada',        label: 'Trocas Concluídas' },
          { val: 'cancelada',       label: 'Rejeitadas'        },
          { val: 'todos',           label: 'Todos'             },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setFiltro(val)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filtro === val ? 'bg-green-600 text-white shadow' : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-green-700 text-center py-12">A carregar entregas...</p>
      ) : entregasFiltradas.length === 0 ? (
        <div className="bg-white border border-green-100 rounded-2xl p-8 text-center shadow-sm">
          <Package size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">Nenhuma entrega encontrada.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {entregasFiltradas.map(e => (
            <div key={e.id_entrega} className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">

              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-green-700 text-lg">{e.tipos_residuos || 'Residuo'}</p>
                  <p className="text-xs text-gray-400">Entrega #{e.id_entrega}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  e.status === 'pendente'        ? 'bg-yellow-100 text-yellow-700' :
                  e.status === 'aceita'          ? 'bg-blue-100 text-blue-700'     :
                  e.status === 'aguarda_pesagem' ? 'bg-orange-100 text-orange-700' :
                  e.status === 'coletada'        ? 'bg-green-100 text-green-700'   :
                                                   'bg-red-100 text-red-700'
                }`}>
                  {e.status === 'pendente'        ? 'Pendente'          :
                   e.status === 'aceita'          ? 'Aceite'            :
                   e.status === 'aguarda_pesagem' ? 'Aguarda Pesagem'   :
                   e.status === 'coletada'        ? 'Troca Concluída'   : 'Rejeitada'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-green-500 shrink-0" />
                  <span>{e.nome_usuario}</span>
                </div>
                <button onClick={() => setModalMapa(e)}
                  className="flex items-center gap-2 w-full text-left hover:bg-green-50 rounded-lg px-1 py-0.5 transition group">
                  <MapPin size={14} className="text-green-500 shrink-0 group-hover:text-green-700" />
                  <span className="text-green-700 underline underline-offset-2 text-sm group-hover:text-green-900">
                    {e.endereco_domicilio || 'Ver localização no mapa'}
                  </span>
                  <Map size={12} className="text-green-400 ml-auto shrink-0" />
                </button>
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-green-500 shrink-0" />
                  <span>{e.peso_total ? `${e.peso_total} kg` : 'Peso a registar'}</span>
                  {e.valor_total && <span className="font-medium text-green-600 ml-2">· {parseFloat(e.valor_total).toFixed(0)} Kz</span>}
                </div>
                {e.data_hora && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-green-500 shrink-0" />
                    <span className="text-xs text-gray-400">
                      {new Date(e.data_hora).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {e.observacoes && <p className="text-xs italic text-gray-500 bg-gray-50 p-2 rounded-lg">"{e.observacoes}"</p>}
                {e.nome_coletadores && (
                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-green-500 shrink-0" />
                    <span className="text-xs text-gray-500">Coletador: {e.nome_coletadores}</span>
                  </div>
                )}
                {e.valor_utilizador && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mt-2">
                    <p className="text-green-700 text-xs font-medium">Pagamento processado</p>
                    <p className="text-green-800 text-sm font-bold">{parseFloat(e.valor_utilizador).toFixed(0)} Kz para utilizador</p>
                    {e.valor_coletador && parseFloat(e.valor_coletador) > 0 && (
                      <p className="text-green-600 text-xs">{parseFloat(e.valor_coletador).toFixed(0)} Kz para coletador</p>
                    )}
                  </div>
                )}
              </div>

              {/* Botões de avaliação — só para entregas concluídas */}
              {e.status === 'coletada' && (
                <div className="space-y-2 mb-3">
                  {/* Avaliar utilizador */}
                  {!(jaAvaliou[e.id_entrega] || []).includes('utilizador') ? (
                    <button onClick={() => abrirAvaliacao(e, 'utilizador')}
                      className="w-full flex items-center justify-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-xl text-sm font-medium transition">
                      <Star size={13} /> Avaliar utilizador
                    </button>
                  ) : (
                    <p className="text-center text-green-600 text-xs flex items-center justify-center gap-1">
                      <CheckCircle size={12} /> Utilizador avaliado
                    </p>
                  )}

                  {/* Avaliar coletador — só se houver coletador */}
                  {e.nome_coletadores && (
                    !(jaAvaliou[e.id_entrega] || []).includes('coletor') ? (
                      <button onClick={() => abrirAvaliacao(e, 'coletor')}
                        className="w-full flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl text-sm font-medium transition">
                        <Star size={13} /> Avaliar coletador
                      </button>
                    ) : (
                      <p className="text-center text-green-600 text-xs flex items-center justify-center gap-1">
                        <CheckCircle size={12} /> Coletador avaliado
                      </p>
                    )
                  )}
                </div>
              )}

              {/* Marcar data */}
              {e.status === 'pendente' && (
                <div className="mt-2 mb-3">
                  {e.data_recolha_proposta ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex items-center gap-2">
                      <CalendarCheck size={14} className="text-blue-600 shrink-0" />
                      <div>
                        <p className="text-blue-700 text-xs font-medium">Recolha marcada</p>
                        <p className="text-blue-600 text-xs">
                          {new Date(e.data_recolha_proposta).toLocaleString('pt-AO', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button onClick={() => abrirModalData(e.id_entrega)} className="ml-auto text-blue-500 text-xs underline shrink-0">Alterar</button>
                    </div>
                  ) : (
                    <button onClick={() => abrirModalData(e.id_entrega)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
                      <CalendarCheck size={14} /> Marcar Data de Recolha
                    </button>
                  )}
                </div>
              )}

              {/* Aviso quando tipo coletador e coletador ainda não confirmou */}
              {e.status === 'aceita' && e.tipo_entrega === 'coletador' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
                  <Truck size={14} className="text-yellow-600 shrink-0" />
                  <div>
                    <p className="text-yellow-700 text-xs font-medium">A aguardar coletador</p>
                    <p className="text-yellow-600 text-xs">O coletador ainda não confirmou a recolha. O pagamento será processado após a confirmação.</p>
                  </div>
                </div>
              )}

              {/* Aceitar e Rejeitar */}
              {e.status === 'pendente' && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Botão aceitar — bloqueado se tipo coletador (empresa marca data mas não pesa ainda) */}
                  {e.tipo_entrega === 'coletador' ? (
                    e.data_recolha_proposta ? (
                      <div className="bg-gray-100 text-gray-400 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 cursor-not-allowed" title="O coletador irá confirmar a recolha">
                        <Truck size={14} /> Aguarda coletador
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-400 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 cursor-not-allowed">
                        <CheckCircle size={14} /> Marcar data 1°
                      </div>
                    )
                  ) : (
                    e.data_recolha_proposta ? (
                      <button onClick={() => abrirModalAceitar(e.id_entrega)}
                        disabled={acaoEmCurso === e.id_entrega}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
                        <CheckCircle size={14} /> Aceitar
                      </button>
                    ) : (
                      <div className="bg-gray-100 text-gray-400 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 cursor-not-allowed">
                        <CheckCircle size={14} /> Marcar data 1°
                      </div>
                    )
                  )}
                  <button onClick={() => setModalRejeitar(e.id_entrega)}
                    disabled={acaoEmCurso === e.id_entrega}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
                    <XCircle size={14} /> Rejeitar
                  </button>
                </div>
              )}

              {/* Botão registar peso — aparece quando coletador confirmou entrega */}
              {e.status === 'aguarda_pesagem' && (
                <div className="mt-2">
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mb-2 flex items-center gap-2">
                    <Scale size={14} className="text-orange-600 shrink-0" />
                    <p className="text-orange-700 text-xs font-medium">Resíduos entregues pelo coletador — pesa e confirma para processar o pagamento</p>
                  </div>
                  <button onClick={() => abrirModalAceitar(e.id_entrega)}
                    disabled={acaoEmCurso === e.id_entrega}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1">
                    <Scale size={14} /> Registar Peso e Pagar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL AVALIAÇÃO */}
      {modalAvaliacao && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <Star size={20} /> Avaliar {modalAvaliacao.alvo === 'utilizador' ? 'Utilizador' : 'Coletador'}
              </h3>
              <button onClick={() => setModalAvaliacao(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              <p className="text-green-800 text-sm font-medium">
                {modalAvaliacao.alvo === 'utilizador' ? modalAvaliacao.entrega.nome_usuario : modalAvaliacao.entrega.nome_coletadores}
              </p>
              <p className="text-green-600 text-xs mt-0.5">Entrega #{modalAvaliacao.entrega.id_entrega}</p>
            </div>

            {/* Estrelas */}
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

            {/* Comentário */}
            <div className="mb-4">
              <label className="text-gray-600 text-sm block mb-1">Comentário (opcional)</label>
              <textarea value={comentario} onChange={e => setComentario(e.target.value)}
                placeholder="Os resíduos estavam conforme publicado? A pessoa foi pontual?"
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

      {/* MODAL MAPA */}
      {modalMapa && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <MapPin size={20} /> Localizacao da Entrega #{modalMapa.id_entrega}
              </h3>
              <button onClick={() => setModalMapa(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center gap-3">
              <User size={16} className="text-green-600 shrink-0" />
              <div>
                <p className="text-gray-800 text-sm font-medium">{modalMapa.nome_usuario}</p>
                {modalMapa.endereco_domicilio && <p className="text-gray-500 text-xs mt-0.5">{modalMapa.endereco_domicilio}</p>}
              </div>
            </div>
            {modalMapa.latitude && modalMapa.longitude ? (
              <>
                <div className="rounded-xl overflow-hidden border border-gray-200 mb-3" style={{ height: '280px' }}>
                  <MapContainer center={[parseFloat(modalMapa.latitude), parseFloat(modalMapa.longitude)]} zoom={16} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    <Marker position={[parseFloat(modalMapa.latitude), parseFloat(modalMapa.longitude)]} icon={iconeVermelho}>
                      <Popup><strong>{modalMapa.nome_usuario}</strong><br />{modalMapa.endereco_domicilio || 'Localizacao do utilizador'}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${modalMapa.latitude},${modalMapa.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium transition mb-3">
                  <Map size={16} /> Abrir rota no Google Maps
                </a>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-center">
                <MapPin size={32} className="mx-auto mb-2 text-yellow-400" />
                <p className="text-yellow-700 text-sm font-medium">Sem localizacao GPS</p>
                <p className="text-yellow-600 text-xs mt-1">Usa o endereco textual para navegar.</p>
                {modalMapa.endereco_domicilio && (
                  <a href={`https://www.google.com/maps/search/${encodeURIComponent(modalMapa.endereco_domicilio + ', Angola')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition">
                    <Map size={13} /> Pesquisar no Google Maps
                  </a>
                )}
              </div>
            )}
            <button onClick={() => setModalMapa(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition">Fechar</button>
          </div>
        </div>
      )}

      {/* MODAL PROPOR DATA */}
      {modalData && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2"><CalendarCheck size={20} /> Marcar Data de Recolha</h3>
              <button onClick={() => setModalData(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold block mb-1">Data e hora <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={dataRecolha} onChange={e => setDataRecolha(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold block mb-1">Nota (opcional)</label>
              <textarea value={obsEmpresa} onChange={e => setObsEmpresa(e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
            </div>
            {coletadores.length > 0 && (
              <div className="mb-4">
                <label className="text-gray-700 text-sm font-semibold block mb-2 flex items-center gap-2">
                  <Users size={15} className="text-green-600" /> Designar coletador(es) (opcional)
                </label>
                <div className="space-y-2">
                  {coletadores.map(c => {
                    const sel = coletadoresSel.includes(c.id_coletador);
                    return (
                      <div key={c.id_coletador} onClick={() => toggleColetador(c.id_coletador)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${sel ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{c.nome?.charAt(0).toUpperCase()}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-800 text-sm font-medium truncate">{c.nome}</p>
                          {c.telefone && <p className="text-gray-400 text-xs">{c.telefone}</p>}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                          {sel && <CheckCircle size={12} className="text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {erroData && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2"><AlertCircle size={14} /> {erroData}</p>}
            <div className="flex gap-3">
              <button onClick={() => setModalData(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-sm">Cancelar</button>
              <button onClick={handleProporData} disabled={propondo}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                <CalendarCheck size={16} /> {propondo ? 'A enviar...' : 'Confirmar Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACEITAR */}
      {modalAceitar && entregaAceitar && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-green-800 font-bold text-lg flex items-center gap-2"><Scale size={20} /> Registar Peso Real</h3>
              <button onClick={() => setModalAceitar(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              <p className="text-green-800 font-medium text-sm">{entregaAceitar.tipos_residuos || 'Residuo'}</p>
              <p className="text-green-600 text-xs mt-0.5">Entrega #{entregaAceitar.id_entrega} · {entregaAceitar.nome_usuario}</p>
            </div>
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold block mb-1">Peso real <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="number" min="0.1" step="0.1" value={pesoReal} onChange={e => setPesoReal(e.target.value)} placeholder="Ex: 12.5"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                <span className="absolute right-4 top-3 text-gray-400 text-sm">kg</span>
              </div>
            </div>
            {estimativa && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-2">
                <p className="text-gray-700 text-xs font-semibold flex items-center gap-1"><Leaf size={12} className="text-green-600" /> Resumo do pagamento</p>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Valor total</span><span className="font-medium text-gray-700">{estimativa.valorTotal} Kz</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Utilizador (70% - 50 Kz)</span><span className="font-bold text-green-700">{estimativa.valorUtilizador} Kz</span></div>
                {entregaAceitar.id_coletador && <div className="flex justify-between text-xs"><span className="text-gray-500">Coletador (30%)</span><span className="font-medium text-blue-600">{estimativa.valorColetador} Kz</span></div>}
                <div className="flex justify-between text-xs border-t border-gray-200 pt-2"><span className="text-gray-400">Comissao EcoTroca (10% + 50 Kz)</span><span className="text-gray-500">{estimativa.comissao} Kz</span></div>
              </div>
            )}
            {erroAceitar && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2"><AlertCircle size={14} /> {erroAceitar}</p>}
            <div className="flex gap-3">
              <button onClick={() => setModalAceitar(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition text-sm">Cancelar</button>
              <button onClick={handleAceitar} disabled={acaoEmCurso === modalAceitar}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                <CheckCircle size={16} /> {acaoEmCurso === modalAceitar ? 'A processar...' : 'Confirmar e Pagar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REJEITAR */}
      {modalRejeitar && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-red-600 mb-4">Rejeitar Entrega #{modalRejeitar}</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo <span className="text-red-500">*</span></label>
              <p className="text-gray-400 text-xs mb-2">O utilizador vai receber esta mensagem.</p>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            {erroRejeitar && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2"><AlertCircle size={14} /> {erroRejeitar}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setModalRejeitar(null); setMotivo(''); setErro(''); setErroRejeitar(''); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-medium transition">Cancelar</button>
              <button onClick={handleRejeitar} disabled={acaoEmCurso === modalRejeitar}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2 rounded-xl font-medium transition">
                {acaoEmCurso === modalRejeitar ? 'A rejeitar...' : 'Confirmar Rejeicao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}