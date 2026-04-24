import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Trophy, Recycle, Building2, Users, TrendingUp, Medal, Award } from "lucide-react";
import { getUtilizadorLocal } from "../../api.js";
import HeaderUtilizador from "./Header";
import HeaderEmpresa    from "../EmpresaProfile/HeaderEmpresa.jsx";
import HeaderColetador  from "../ColetadorProfile/Header.jsx";

function Estrelas({ media, total }) {
  const cheias = Math.floor(parseFloat(media));
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(n => (
          <Star key={n} size={12}
            className={n <= cheias ? "text-green-500 fill-green-500" : "text-gray-200"} />
        ))}
      </div>
      <span className="text-xs text-gray-500">{parseFloat(media).toFixed(1)} ({total})</span>
    </div>
  );
}

function PosicaoIcon({ i }) {
  if (i === 0) return <Trophy size={20} className="text-green-600" />;
  if (i === 1) return <Award  size={20} className="text-green-500" />;
  if (i === 2) return <Medal  size={20} className="text-green-400" />;
  return <span className="text-gray-500 font-bold text-sm w-5 text-center">{i + 1}</span>;
}

export default function Rankings() {
  const navigate   = useNavigate();
  const utilizador = getUtilizadorLocal();
  const tipo       = utilizador?.tipo || utilizador?.tipo_usuario || 'comum';

  const Header = tipo === 'empresa' ? HeaderEmpresa
               : tipo === 'coletor' ? HeaderColetador
               : HeaderUtilizador;

  const [dados,      setDados]      = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');
  const [aba,        setAba]        = useState('utilizadores');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/ranking', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { setDados(d); setCarregando(false); })
      .catch(err => { setErro(err.message); setCarregando(false); });
  }, []);

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12 p-6">
      <Header />

      <div className="max-w-2xl mx-auto">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={28} className="text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-green-800">Rankings EcoTroca</h1>
            <p className="text-green-600 text-sm">Os mais activos da plataforma</p>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-sm">
          {[
            { val: 'utilizadores', label: 'Utilizadores', icone: <Users    size={14} /> },
            { val: 'coletadores',  label: 'Coletadores',  icone: <Recycle  size={14} /> },
            { val: 'empresas',     label: 'Empresas',     icone: <Building2 size={14} /> },
          ].map(a => (
            <button key={a.val} onClick={() => setAba(a.val)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition ${
                aba === a.val
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-600 hover:bg-green-50'
              }`}>
              {a.icone} {a.label}
            </button>
          ))}
        </div>

        {carregando && <p className="text-center text-green-700 py-12">A carregar rankings...</p>}
        {erro && <p className="text-center text-red-500 py-6">{erro}</p>}

        {/* Utilizadores */}
        {!carregando && aba === 'utilizadores' && (
          <div className="space-y-3">
            {(dados?.utilizadores || []).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Trophy size={40} className="mx-auto mb-3 text-green-200" />
                <p className="text-gray-400">Ainda não há dados suficientes para o ranking.</p>
              </div>
            ) : (dados?.utilizadores || []).map((u, i) => (
              <div key={u.id_usuario}
                className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 border border-green-100">
                <div className="w-8 flex items-center justify-center shrink-0">
                  <PosicaoIcon i={i} />
                </div>
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold shrink-0">
                  {u.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{u.nome}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                      {u.nivel || 'EcoIniciante'}
                    </span>
                    {u.provincia && <span className="text-xs text-gray-400">{u.provincia}</span>}
                  </div>
                  {u.total_avaliacoes > 0 && (
                    <div className="mt-1">
                      <Estrelas media={u.media_avaliacoes} total={u.total_avaliacoes} />
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <Star size={14} className="text-green-500" />
                    <span className="font-bold text-green-700">{u.pontos}</span>
                  </div>
                  <p className="text-xs text-gray-400">{u.total_entregas} entregas</p>
                  {u.total_medalhas > 0 && (
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <Medal size={12} className="text-green-500" />
                      <span className="text-xs text-green-600">{u.total_medalhas}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Coletadores */}
        {!carregando && aba === 'coletadores' && (
          <div className="space-y-3">
            {(dados?.coletadores || []).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Recycle size={40} className="mx-auto mb-3 text-green-200" />
                <p className="text-gray-400">Ainda não há dados suficientes.</p>
              </div>
            ) : (dados?.coletadores || []).map((c, i) => (
              <div key={c.id_usuario}
                className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 border border-green-100">
                <div className="w-8 flex items-center justify-center shrink-0">
                  <PosicaoIcon i={i} />
                </div>
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold shrink-0">
                  {c.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{c.nome}</p>
                  {c.provincia && <p className="text-xs text-gray-400">{c.provincia}</p>}
                  {c.total_avaliacoes > 0 && (
                    <div className="mt-1">
                      <Estrelas media={c.media_avaliacoes} total={c.total_avaliacoes} />
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <Recycle size={14} className="text-green-500" />
                    <span className="font-bold text-green-700">{c.total_entregas}</span>
                  </div>
                  <p className="text-xs text-gray-400">recolhas</p>
                  {c.total_medalhas > 0 && (
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <Medal size={12} className="text-green-500" />
                      <span className="text-xs text-green-600">{c.total_medalhas}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empresas */}
        {!carregando && aba === 'empresas' && (
          <div className="space-y-3">
            {(dados?.empresas || []).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Building2 size={40} className="mx-auto mb-3 text-green-200" />
                <p className="text-gray-400">Ainda não há dados suficientes.</p>
              </div>
            ) : (dados?.empresas || []).map((e, i) => (
              <div key={e.id_empresa}
                className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 border border-green-100">
                <div className="w-8 flex items-center justify-center shrink-0">
                  <PosicaoIcon i={i} />
                </div>
                <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center text-white font-bold shrink-0">
                  {e.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{e.nome}</p>
                  {e.provincia && <p className="text-xs text-gray-400">{e.provincia}</p>}
                  {e.total_avaliacoes > 0 && (
                    <div className="mt-1">
                      <Estrelas media={e.media_avaliacoes} total={e.total_avaliacoes} />
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="font-bold text-green-700">{parseFloat(e.total_kg || 0).toFixed(0)} kg</span>
                  </div>
                  <p className="text-xs text-gray-400">{e.total_entregas} entregas</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}