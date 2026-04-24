import React, { useState, useEffect } from "react";
import {
  Truck, Phone, Mail, MapPin, Star,
  Wallet, Banknote, CreditCard, ArrowLeft, Edit, Settings
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "./Header.jsx";
import { getPerfil, getMinhasColetasColetador, getCarteira, getPerfilPublico } from "../../api.js";

export default function PerfilColetador() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const modoPublico = !!id;

  const [perfil,     setPerfil]     = useState(null);
  const [carteira,   setCarteira]   = useState(null);
  const [stats,      setStats]      = useState({ concluidas: 0, pontos: 0 });
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        if (modoPublico) {
          const dados = await getPerfilPublico('coletor', id);
          setPerfil(dados.perfil);
          setStats({
            concluidas: dados.perfil.total_coletas || 0,
            pontos:     dados.perfil.total_pontos  || 0,
          });
        } else {
          const [dadosPerfil, coletas, dadosCarteira] = await Promise.all([
            getPerfil(),
            getMinhasColetasColetador(),
            getCarteira(),
          ]);
          setPerfil(dadosPerfil);
          setCarteira(dadosCarteira);
          const concluidas = coletas.filter(e => e.status === "coletada");
          const pontos = concluidas.reduce((acc, e) => acc + (e.pontos_recebidos || 10), 0);
          setStats({ concluidas: concluidas.length, pontos });
        }
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [id]);

  if (carregando) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-green-700">A carregar perfil...</p>
    </div>
  );

  if (erro || !perfil) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <Header />
      <div className="text-center">
        <p className="text-red-500 mb-4">{erro || 'Perfil nao encontrado.'}</p>
        {modoPublico && (
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-600 mx-auto">
            <ArrowLeft size={16} /> Voltar
          </button>
        )}
      </div>
    </div>
  );

  // Subtipo do coletador
  // tipo_coletador vem do backend via GET /api/usuarios/perfil
  const tipoColetor = perfil.tipo_coletador || perfil.tipo || 'independente';
  const subtipo = tipoColetor === 'dependente'
    ? `Coletador da empresa ${perfil.nome_empresa || ''}`
    : 'Coletador Independente';

  // Carteira so para independente — dependente e pago fora da plataforma
  const mostrarCarteira = tipoColetor !== 'dependente';

  // Cor do banner — azul para coletador
  const corBanner = tipoColetor === 'dependente' ? 'bg-blue-700' : 'bg-teal-700';

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12">
      <Header />

      <div className="max-w-lg mx-auto px-4">

        {/* Botao voltar — so no modo publico */}
        {modoPublico && (
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-700 hover:text-green-900 text-sm mb-4 transition">
            <ArrowLeft size={16} /> Voltar
          </button>
        )}

        {/* Banner do coletador */}
        <div className={`${corBanner} text-white rounded-2xl p-6 mb-4 shadow-lg relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 right-20 w-24 h-24 bg-white/5 rounded-full" />

          <div className="relative flex items-start gap-4">
            {/* Avatar com inicial ou icone */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border-2 border-white/30 overflow-hidden">
              {perfil.foto_perfil ? (
                <img src={perfil.foto_perfil} alt="foto"
                  className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {perfil.nome?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{perfil.nome}</h2>

              {/* Badge de subtipo */}
              <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/20">
                <Truck size={11} /> {subtipo}
              </div>

              {/* Localizacao */}
              {(perfil.municipio || perfil.provincia) && (
                <p className="text-white/70 text-xs mt-2 flex items-center gap-1">
                  <MapPin size={11} />
                  {[perfil.municipio, perfil.provincia].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Botoes editar — so no modo privado */}
            {!modoPublico && (
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => navigate('/EditarColetador')}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl transition text-xs font-medium">
                  <Edit size={13} /> Editar
                </button>
                <button onClick={() => navigate('/DefinicoesColetador')}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition text-xs font-medium">
                  <Settings size={13} /> Definicoes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 text-center">
            <Truck size={20} className="text-teal-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-teal-700">{stats.concluidas}</p>
            <p className="text-xs text-gray-400 mt-0.5">Coletas feitas</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 text-center">
            <Star size={20} className="text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-600">{stats.pontos}</p>
            <p className="text-xs text-gray-400 mt-0.5">Pontos ganhos</p>
          </div>
        </div>

        {/* Carteira — so no modo privado e so para independente */}
        {!modoPublico && carteira && mostrarCarteira && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5 mb-4">
            <h3 className="text-green-800 font-semibold text-sm mb-3 flex items-center gap-2">
              <Wallet size={15} /> Carteira
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <Banknote size={20} className="text-green-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-green-700">
                  {parseFloat(carteira?.dinheiro || 0).toFixed(0)} Kz
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Dinheiro (sacavel)</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <CreditCard size={20} className="text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-blue-700">
                  {parseFloat(carteira?.saldo || 0).toFixed(0)} Kz
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Saldo (so na app)</p>
              </div>
            </div>
          </div>
        )}

        {/* Contactos — so no modo privado */}
        {!modoPublico && (perfil.email || perfil.telefone) && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5 mb-4">
            <h3 className="text-green-800 font-semibold text-sm mb-3">Contactos</h3>
            <div className="space-y-2.5">
              {perfil.telefone && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Phone size={14} className="text-green-500 shrink-0" />
                  <span>{perfil.telefone}</span>
                </div>
              )}
              {perfil.email && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Mail size={14} className="text-green-500 shrink-0" />
                  <span>{perfil.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Avaliações — visíveis no modo público */}
        {modoPublico && <SecaoAvaliacoes idUtilizador={id} />}

        {/* Data de registo — so no modo publico */}
        {modoPublico && perfil.data_criacao && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
            <p className="text-gray-400 text-sm">
              Membro desde {new Date(perfil.data_criacao).toLocaleDateString('pt-AO', {
                month: 'long', year: 'numeric'
              })}
            </p>
          </div>
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