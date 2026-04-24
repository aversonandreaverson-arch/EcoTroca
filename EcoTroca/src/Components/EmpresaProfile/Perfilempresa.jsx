import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Phone, Mail, MapPin, Clock, Recycle, Globe,
  TrendingUp, Package, CheckCircle, Plus, ArrowLeft,
  Edit, Building2
} from 'lucide-react';
import HeaderEmpresa from './HeaderEmpresa.jsx';
import Header from '../UserProfile/Header.jsx';
import {
  getPerfilEmpresa, getEntregasEmpresa,
  getEmpresaPorId, getUtilizadorLocal
} from '../../api.js';

export default function PerfilEmpresa() {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const utilizador = getUtilizadorLocal();

  const [perfil,     setPerfil]     = useState(null);
  const [entregas,   setEntregas]   = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  // Verdadeiro se e a propria empresa a ver o seu perfil
  const ehProprioPerfilEmpresa =
    utilizador?.tipo === 'empresa' && !id;

  useEffect(() => {
    const carregar = async () => {
      try {
        if (ehProprioPerfilEmpresa) {
          const [dadosPerfil, dadosEntregas] = await Promise.all([
            getPerfilEmpresa(),
            getEntregasEmpresa(),
          ]);
          setPerfil(dadosPerfil);
          setEntregas(dadosEntregas);
        } else if (id) {
          const dadosPerfil = await getEmpresaPorId(id);
          setPerfil(dadosPerfil);
        }
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [id]);

  // KPIs calculados a partir das entregas
  const entregasAceites = entregas.filter(e => e.status === 'coletada');
  const totalPago = entregasAceites.reduce((acc, e) => acc + parseFloat(e.valor_total || 0), 0);
  const totalKg   = entregasAceites.reduce((acc, e) => acc + parseFloat(e.peso_total  || 0), 0);

  // Escolhe o header correcto consoante o tipo de utilizador
  const HeaderCorrect = utilizador?.tipo === 'empresa' ? HeaderEmpresa : Header;

  if (carregando) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <HeaderCorrect />
      <p className="text-green-700">A carregar perfil...</p>
    </div>
  );

  if (erro || !perfil) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <HeaderCorrect />
      <div className="bg-white p-6 rounded-xl text-center shadow-sm">
        <p className="text-red-600 mb-4">{erro || 'Erro ao carregar perfil.'}</p>
        <button onClick={() => navigate(-1)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg">
          Voltar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12">
      <HeaderCorrect />

      <div className="max-w-lg mx-auto px-4">

        {/* Botao voltar — so quando ve perfil de outra empresa */}
        {id && (
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-700 hover:text-green-900 text-sm mb-4 transition">
            <ArrowLeft size={16} /> Voltar
          </button>
        )}

        {/* Banner da empresa */}
        <div className="bg-purple-700 text-white rounded-2xl p-6 mb-4 shadow-lg relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 right-20 w-24 h-24 bg-white/5 rounded-full" />

          <div className="relative flex items-start gap-4">
            {/* Avatar com inicial ou foto */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border-2 border-white/30 overflow-hidden">
              {perfil.foto_perfil ? (
                <img src={perfil.foto_perfil} alt="logo"
                  className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {perfil.nome?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{perfil.nome}</h2>

              {/* Badge de empresa */}
              <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/20">
                <Building2 size={11} /> Empresa Recicladora
              </div>

              {/* Localizacao */}
              {(perfil.municipio || perfil.provincia) && (
                <p className="text-white/70 text-xs mt-2 flex items-center gap-1">
                  <MapPin size={11} />
                  {[perfil.municipio, perfil.provincia].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Botao editar — so para a propria empresa */}
            {ehProprioPerfilEmpresa && (
              <button onClick={() => navigate('/EditarEmpresa')}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl transition text-xs font-medium shrink-0">
                <Edit size={13} /> Editar
              </button>
            )}
          </div>

          {/* Descricao */}
          {perfil.descricao && (
            <p className="relative text-white/80 text-xs mt-4 leading-relaxed line-clamp-2">
              {perfil.descricao}
            </p>
          )}
        </div>

        {/* KPIs — so para a propria empresa */}
        {ehProprioPerfilEmpresa && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 text-center">
              <CheckCircle size={20} className="text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{entregasAceites.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Entregas</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 text-center">
              <Package size={20} className="text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-700">{totalKg.toFixed(0)} kg</p>
              <p className="text-xs text-gray-400 mt-0.5">Recolhidos</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 text-center">
              <TrendingUp size={20} className="text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-orange-600">{totalPago >= 1000 ? `${(totalPago/1000).toFixed(1)}k` : totalPago.toFixed(0)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Kz pagos</p>
            </div>
          </div>
        )}

        {/* Contactos */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5 mb-4">
          <h3 className="text-green-800 font-semibold text-sm mb-3">Contactos</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Phone size={14} className="text-green-500 shrink-0" />
              <span>{perfil.telefone || 'Nao definido'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Mail size={14} className="text-green-500 shrink-0" />
              <span>{perfil.email || 'Nao definido'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <MapPin size={14} className="text-green-500 shrink-0" />
              <span>
                {[perfil.endereco, perfil.bairro, perfil.municipio, perfil.provincia]
                  .filter(Boolean).join(', ') || 'Localizacao nao definida'}
              </span>
            </div>
            {perfil.site && (
              <div className="flex items-center gap-2 text-sm">
                <Globe size={14} className="text-green-500 shrink-0" />
                <a href={perfil.site} target="_blank" rel="noopener noreferrer"
                  className="text-green-600 hover:underline truncate">
                  {perfil.site}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Horario */}
        {(perfil.horario_abertura || perfil.horario_fechamento) && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5 mb-4">
            <h3 className="text-green-800 font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock size={15} /> Horario de Funcionamento
            </h3>
            <div className="flex items-center gap-3">
              <div className="bg-green-50 rounded-xl px-4 py-3 text-center flex-1">
                <p className="text-xs text-gray-400 mb-1">Abertura</p>
                <p className="text-xl font-bold text-green-700">
                  {perfil.horario_abertura || '--:--'}
                </p>
              </div>
              <span className="text-gray-300 text-xl">→</span>
              <div className="bg-red-50 rounded-xl px-4 py-3 text-center flex-1">
                <p className="text-xs text-gray-400 mb-1">Fechamento</p>
                <p className="text-xl font-bold text-red-500">
                  {perfil.horario_fechamento || '--:--'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Residuos aceites */}
        {perfil.residuos_aceites && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5 mb-4">
            <h3 className="text-green-800 font-semibold text-sm mb-3 flex items-center gap-2">
              <Recycle size={15} /> Residuos Aceites
            </h3>
            <div className="flex flex-wrap gap-2">
              {perfil.residuos_aceites.split(',').map((r, i) => (
                <span key={i}
                  className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                  <Recycle size={10} /> {r.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Avaliações — visíveis para todos */}
        <SecaoAvaliacoes idUtilizador={perfil?.id_usuario} />

        {/* Botoes de accao */}
        {ehProprioPerfilEmpresa && (
          <button onClick={() => navigate('/DashboardEmpresa')}
            className="w-full bg-white hover:bg-gray-50 text-green-700 border border-green-200 py-3 rounded-xl font-medium transition">
            Ir ao Dashboard
          </button>
        )}

        {/* Utilizador comum a ver perfil de empresa — pode criar oferta */}
        {utilizador?.tipo === 'comum' && id && (
          <button onClick={() => navigate(`/NovoResiduo?empresa=${id}`)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
            <Plus size={18} /> Criar Oferta para esta Empresa
          </button>
        )}
      </div>
    </div>
  );
}

function SecaoAvaliacoes({ idUtilizador }) {
  const [dados,      setDados]      = React.useState(null);
  const [carregando, setCarregando] = React.useState(true);

  React.useEffect(() => {
    if (!idUtilizador) return;
    import('../../api.js').then(({ getAvaliacoesUtilizador }) => {
      getAvaliacoesUtilizador(idUtilizador)
        .then(r => { setDados(r); setCarregando(false); })
        .catch(() => setCarregando(false));
    });
  }, [idUtilizador]);

  if (carregando || !dados || dados.total === 0) return null;

  const estrelas = parseFloat(dados.media || 0);
  const cheias   = Math.floor(estrelas);
  const meia     = estrelas - cheias >= 0.5;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-5 mb-4">
      <h3 className="text-green-800 font-semibold text-sm mb-3 flex items-center gap-2">
        <Star size={15} className="text-yellow-500" /> Avaliações
      </h3>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <span className="text-4xl font-bold text-yellow-500">{estrelas.toFixed(1)}</span>
        <div>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={18}
                className={n <= cheias ? "text-yellow-400 fill-yellow-400" :
                  (n === cheias + 1 && meia) ? "text-yellow-400 fill-yellow-200" :
                  "text-gray-200"} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{dados.total} avaliação{dados.total !== 1 ? "ões" : ""}</p>
        </div>
      </div>
      <div className="space-y-3">
        {dados.avaliacoes.slice(0, 3).map((a, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-700 text-xs font-medium">{a.nome_avaliador}</p>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={11}
                    className={n <= a.nota ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                ))}
              </div>
            </div>
            {a.comentario && <p className="text-gray-500 text-xs leading-relaxed">"{a.comentario}"</p>}
            <p className="text-gray-300 text-xs mt-1">
              {new Date(a.criado_em).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}