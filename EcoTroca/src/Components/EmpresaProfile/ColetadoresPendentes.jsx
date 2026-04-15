//  Card que aparece no DashboardEmpresa quando ha coletadores
//  que disseram trabalhar para esta empresa e aguardam confirmacao.
//
//  A empresa pode:
//    - Confirmar -> coletador fica activo + notificado com boas-vindas
//    - Recusar   -> coletador recebe notificacao de recusa
 
import { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, MapPin, Phone, Check, X, AlertCircle } from 'lucide-react';
 
// Funcoes da API para confirmar e recusar coletadores
const BASE_URL = 'http://localhost:3000/api';
const pedido = async (endpoint, opcoes = {}) => {
  const token = localStorage.getItem('token');
  const resposta = await fetch(`${BASE_URL}${endpoint}`, {
    ...opcoes,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opcoes.headers },
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || 'Erro no servidor');
  return dados;
};
 
const getColetadoresPendentes = () => pedido('/coletadores/pendentes');
const confirmarColetador = (id) => pedido(`/coletadores/${id}/confirmar`, { method: 'POST' });
const recusarColetador   = (id, motivo) => pedido(`/coletadores/${id}/recusar`, {
  method: 'POST',
  body: JSON.stringify({ motivo }),
});
 
export default function ColetadoresPendentes() {
  // Lista de coletadores que aguardam confirmacao desta empresa
  const [pendentes,   setPendentes]   = useState([]);
  const [carregando,  setCarregando]  = useState(true);
  // id do coletador em processamento — para loading no botao correcto
  const [processando, setProcessando] = useState(null);
  // Mensagem de sucesso ou erro
  const [feedback,    setFeedback]    = useState(null);
 
  useEffect(() => { carregar(); }, []);
 
  const carregar = async () => {
    try {
      setCarregando(true);
      const dados = await getColetadoresPendentes();
      setPendentes(dados || []);
    } catch (err) {
      console.error('Erro ao carregar coletadores pendentes:', err);
    } finally {
      setCarregando(false);
    }
  };
 
  // Empresa confirma que o coletador faz parte da sua equipa
  // -> conta do coletador fica activa + coletador e notificado
  const handleConfirmar = async (id_coletador, nome) => {
    try {
      setProcessando(id_coletador);
      await confirmarColetador(id_coletador);
      // Remove da lista localmente sem recarregar tudo
      setPendentes(prev => prev.filter(c => c.id_coletador !== id_coletador));
      setFeedback({ tipo: 'sucesso', mensagem: `${nome} foi confirmado e ja pode entrar na plataforma!` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ tipo: 'erro', mensagem: err.message });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setProcessando(null);
    }
  };
 
  // Empresa recusa o coletador
  // -> coletador recebe notificacao de recusa
  const handleRecusar = async (id_coletador, nome) => {
    const motivo = window.prompt(`Motivo da recusa para ${nome} (opcional):`);
    if (motivo === null) return; // cancelou o prompt
    try {
      setProcessando(id_coletador);
      await recusarColetador(id_coletador, motivo);
      setPendentes(prev => prev.filter(c => c.id_coletador !== id_coletador));
      setFeedback({ tipo: 'info', mensagem: `Pedido de ${nome} foi recusado.` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ tipo: 'erro', mensagem: err.message });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setProcessando(null);
    }
  };
 
  // Nao mostra nada se nao houver pendentes e nao estiver a carregar
  if (!carregando && pendentes.length === 0) return null;
 
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-yellow-200 p-6 mb-6">
 
      {/* Cabecalho com badge de contagem */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-yellow-700 font-bold text-base flex items-center gap-2">
          <Clock size={18} className="text-yellow-500" />
          Coletadores a Confirmar
          {/* Badge com numero de pendentes */}
          {pendentes.length > 0 && (
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendentes.length}
            </span>
          )}
        </h3>
      </div>
 
      {/* Feedback de sucesso/erro */}
      {feedback && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
          feedback.tipo === 'sucesso' ? 'bg-green-50 text-green-700 border border-green-200' :
          feedback.tipo === 'erro'    ? 'bg-red-50 text-red-700 border border-red-200'       :
                                        'bg-gray-50 text-gray-700 border border-gray-200'
        }`}>
          <AlertCircle size={14} /> {feedback.mensagem}
        </div>
      )}
 
      {/* Loading */}
      {carregando ? (
        <p className="text-gray-400 text-sm text-center py-4">A carregar...</p>
      ) : (
        <div className="space-y-3">
          {pendentes.map(c => (
            <div key={c.id_coletador}
              className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-start justify-between gap-4">
 
              {/* Info do coletador */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Avatar com inicial do nome */}
                <div className="w-10 h-10 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {c.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-gray-800 font-semibold text-sm">{c.nome}</p>
                  {/* Telefone */}
                  {c.telefone && (
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                      <Phone size={10} /> {c.telefone}
                    </p>
                  )}
                  {/* Localizacao */}
                  {(c.municipio || c.provincia) && (
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                      <MapPin size={10} />
                      {[c.municipio, c.provincia].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {/* Data de registo */}
                  <p className="text-gray-300 text-xs mt-1">
                    Registado em {new Date(c.criado_em).toLocaleDateString('pt-AO', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </p>
                  {/* Mensagem explicativa */}
                  <p className="text-yellow-600 text-xs mt-1 font-medium">
                    Este coletador diz trabalhar para a tua empresa. Confirmas?
                  </p>
                </div>
              </div>
 
              {/* Botoes Confirmar / Recusar */}
              <div className="flex flex-col gap-2 shrink-0">
                {/* Confirmar — activa a conta do coletador */}
                <button
                  onClick={() => handleConfirmar(c.id_coletador, c.nome)}
                  disabled={processando === c.id_coletador}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl transition">
                  <Check size={13} />
                  {processando === c.id_coletador ? 'A processar...' : 'Confirmar'}
                </button>
                {/* Recusar — coletador recebe notificacao */}
                <button
                  onClick={() => handleRecusar(c.id_coletador, c.nome)}
                  disabled={processando === c.id_coletador}
                  className="flex items-center gap-1.5 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 text-xs font-semibold px-3 py-2 rounded-xl border border-red-200 transition">
                  <X size={13} /> Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
 