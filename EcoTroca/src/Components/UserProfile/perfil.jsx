import { useState, useEffect } from "react";
import { Edit, Settings, Star, RefreshCw } from "lucide-react";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import { getPerfil, getPontuacao } from "../../api.js";

export default function Perfil() {
  const navigate = useNavigate();

  const [perfil,     setPerfil]     = useState(null);
  const [pontuacao,  setPontuacao]  = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        const [p, pts] = await Promise.all([getPerfil(), getPontuacao()]);
        setPerfil(p);
        setPontuacao(pts);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  if (carregando) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-green-700">A carregar perfil...</p>
    </div>
  );

  if (erro || !perfil) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-red-500">{erro || 'Erro ao carregar perfil.'}</p>
    </div>
  );

  // Calcula nível e progresso com base nos pontos
  const totalPontos   = pontuacao?.pontuacao?.total_pontos || 0;
  const nivel         = totalPontos < 100 ? 1 :
                        totalPontos < 300 ? 2 :
                        totalPontos < 600 ? 3 :
                        totalPontos < 1000 ? 4 : 5;
  const nomeNivel     = ['EcoIniciante', 'EcoAmigo', 'EcoDefensor', 'EcoMestre', 'EcoLenda'][nivel - 1];
  const limiteNivel   = [100, 300, 600, 1000, 1500][nivel - 1];
  const baseNivel     = [0, 100, 300, 600, 1000][nivel - 1];
  const progresso     = Math.min(100, Math.round(((totalPontos - baseNivel) / (limiteNivel - baseNivel)) * 100));
  const totalTrocas   = pontuacao?.pontuacao?.total_entregas || 0;

  const inicial = perfil.nome?.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12">
      <Header />

      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-6">

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">

            {/* Avatar com inicial */}
            <div className="w-24 h-24 rounded-full bg-green-600 flex items-center justify-center text-white text-4xl font-bold shrink-0 border-4 border-green-200">
              {inicial}
            </div>

            <div className="flex-1 w-full">

              {/* Nome, nível e botões */}
              <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-green-800">{perfil.nome}</h2>
                  <p className="text-green-600 font-medium text-sm flex items-center gap-1 mt-0.5">
                    <Star size={13} className="fill-green-500 text-green-500" />
                    {nomeNivel} — Nível {nivel}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate("/Editar")}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition text-sm"
                  >
                    <Edit size={14} /> Editar
                  </button>
                  <button
                    onClick={() => navigate("/definicoes")}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition text-sm"
                  >
                    <Settings size={14} /> Definições
                  </button>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="flex gap-6 mb-4">
                <div>
                  <p className="text-xl font-bold text-green-700">{totalPontos}</p>
                  <p className="text-xs text-gray-500">Pontos</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-700">{totalTrocas}</p>
                  <p className="text-xs text-gray-500">Entregas</p>
                </div>
                {perfil.provincia && (
                  <div>
                    <p className="text-sm font-semibold text-green-700">{perfil.provincia}</p>
                    <p className="text-xs text-gray-500">Província</p>
                  </div>
                )}
              </div>

              {/* Barra de progresso */}
              <div className="w-full bg-green-100 rounded-full h-3 mb-1">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <RefreshCw size={10} /> {progresso}% para o nível {nivel + 1}
              </p>

            </div>
          </div>

          {/* Info extra */}
          {(perfil.email || perfil.telefone) && (
            <div className="mt-5 pt-4 border-t border-green-50 flex flex-wrap gap-4 text-sm text-gray-500">
              {perfil.email    && <span>✉️ {perfil.email}</span>}
              {perfil.telefone && <span>📱 {perfil.telefone}</span>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}