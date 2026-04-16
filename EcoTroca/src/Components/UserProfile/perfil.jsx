//  Sistema de níveis:
//    Nível 1 — EcoIniciante  (0–99 pts)
//    Nível 2 — EcoAmigo      (100–299 pts)
//    Nível 3 — EcoDefensor   (300–599 pts)
//    Nível 4 — EcoMestre     (600–999 pts)
//    Nível 5 — EcoLenda      (1000+ pts)

import { useState, useEffect } from "react";
import { Edit, Settings, Star, MapPin, ArrowLeft, Phone, Mail, Recycle, Package } from "lucide-react";
import Header from "./Header";
import { useNavigate, useParams } from "react-router-dom";
import { getPerfil, getPontuacao, getPerfilPublico } from "../../api.js";

// Configuracao dos niveis — cor e icone por nivel
const NIVEIS = [
  { nome: "EcoIniciante", cor: "bg-gray-500",   limite: 100,  base: 0    },
  { nome: "EcoAmigo",     cor: "bg-green-500",  limite: 300,  base: 100  },
  { nome: "EcoDefensor",  cor: "bg-blue-500",   limite: 600,  base: 300  },
  { nome: "EcoMestre",    cor: "bg-purple-500", limite: 1000, base: 600  },
  { nome: "EcoLenda",     cor: "bg-orange-500", limite: 1500, base: 1000 },
];

export default function Perfil() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const modoPublico = !!id;

  const [perfil,     setPerfil]     = useState(null);
  const [pontuacao,  setPontuacao]  = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        if (modoPublico) {
          const dados = await getPerfilPublico('utilizador', id);
          setPerfil(dados.perfil);
          setPontuacao({ pontuacao: {
            total_pontos:   dados.perfil.total_pontos   || 0,
            total_entregas: dados.perfil.total_entregas || 0,
          }});
        } else {
          const [p, pts] = await Promise.all([getPerfil(), getPontuacao()]);
          setPerfil(p);
          setPontuacao(pts);
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
        <p className="text-red-500 mb-4">{erro || 'Erro ao carregar perfil.'}</p>
        {modoPublico && (
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-600 mx-auto">
            <ArrowLeft size={16} /> Voltar
          </button>
        )}
      </div>
    </div>
  );

  // Calculos do nivel
  const totalPontos = pontuacao?.pontuacao?.total_pontos   || 0;
  const totalTrocas = pontuacao?.pontuacao?.total_entregas || 0;

  const nivelIdx  = totalPontos < 100  ? 0 :
                    totalPontos < 300  ? 1 :
                    totalPontos < 600  ? 2 :
                    totalPontos < 1000 ? 3 : 4;

  const nivelCfg  = NIVEIS[nivelIdx];
  const progresso = Math.min(100, Math.round(
    ((totalPontos - nivelCfg.base) / (nivelCfg.limite - nivelCfg.base)) * 100
  ));
  const proxNivel = NIVEIS[Math.min(nivelIdx + 1, 4)].nome;

  return (
    <div className="min-h-screen bg-green-100 pt-24 pb-12">
      <Header />

      <div className="max-w-lg mx-auto px-4">

        {/* Botao voltar — so no modo publico */}
        {modoPublico && (
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-700 text-sm mb-4 transition hover:text-green-900">
            <ArrowLeft size={16} /> Voltar
          </button>
        )}

        {/* Banner do perfil */}
        <div className="bg-green-700 text-white rounded-2xl p-6 mb-4 shadow-lg relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 right-20 w-24 h-24 bg-white/5 rounded-full" />

          <div className="relative flex items-start gap-4">
            {/* Avatar com inicial */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold shrink-0 border-2 border-white/30">
              {perfil.nome?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{perfil.nome}</h2>

              {/* Badge de nivel */}
              <div className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-semibold ${nivelCfg.cor} bg-opacity-80`}>
                <Star size={11} className="fill-white" />
                {nivelCfg.nome} — Nível {nivelIdx + 1}
              </div>

              {/* Localizacao */}
              {perfil.provincia && (
                <p className="text-white/70 text-xs mt-2 flex items-center gap-1">
                  <MapPin size={11} />
                  {perfil.municipio ? `${perfil.municipio}, ` : ''}{perfil.provincia}
                </p>
              )}
            </div>

            {/* Botoes editar — so no modo privado */}
            {!modoPublico && (
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => navigate("/Editar")}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl transition text-xs font-medium">
                  <Edit size={13} /> Editar
                </button>
                <button onClick={() => navigate("/definicoes")}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition text-xs font-medium">
                  <Settings size={13} /> Definicoes
                </button>
              </div>
            )}
          </div>

          {/* Barra de progresso do nivel */}
          <div className="relative mt-4">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>{totalPontos} pontos</span>
              <span>{progresso}% para {proxNivel}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${progresso}%` }} />
            </div>
          </div>
        </div>

        {/* Cards de estatisticas */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center border border-green-100">
            <p className="text-2xl font-bold text-green-700">{totalPontos}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1">
              <Star size={10} className="text-yellow-500" /> Pontos
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center border border-green-100">
            <p className="text-2xl font-bold text-green-700">{totalTrocas}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1">
              <Recycle size={10} className="text-green-500" /> Entregas
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center border border-green-100">
            <p className="text-2xl font-bold text-green-700">{nivelIdx + 1}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1">
              <Package size={10} className="text-blue-500" /> Nivel
            </p>
          </div>
        </div>

        {/* Contactos — so no modo privado */}
        {!modoPublico && (perfil.email || perfil.telefone) && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100 mb-4">
            <h3 className="text-green-800 font-semibold text-sm mb-3">Contactos</h3>
            <div className="space-y-2">
              {perfil.email && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Mail size={14} className="text-green-500 shrink-0" />
                  <span>{perfil.email}</span>
                </div>
              )}
              {perfil.telefone && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Phone size={14} className="text-green-500 shrink-0" />
                  <span>{perfil.telefone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data de registo — so no modo publico */}
        {modoPublico && perfil.data_criacao && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
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