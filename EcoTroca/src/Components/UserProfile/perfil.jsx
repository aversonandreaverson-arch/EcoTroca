
//  Sistema de níveis:
//    Nível 1 — EcoIniciante  (0–99 pts)
//    Nível 2 — EcoAmigo      (100–299 pts)
//    Nível 3 — EcoDefensor   (300–599 pts)
//    Nível 4 — EcoMestre     (600–999 pts)
//    Nível 5 — EcoLenda      (1000+ pts)

import { useState, useEffect } from "react";
import { Edit, Settings, Star, RefreshCw } from "lucide-react";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import { getPerfil, getPontuacao } from "../../api.js";

export default function Perfil() {
  const navigate = useNavigate();

  // Dados do perfil vindos do backend (nome, email, telefone, provincia, etc.)
  const [perfil,     setPerfil]     = useState(null);
  // Dados de pontuação e entregas do utilizador
  const [pontuacao,  setPontuacao]  = useState(null);
  // Controla o indicador de carregamento
  const [carregando, setCarregando] = useState(true);
  // Mensagem de erro caso a chamada à API falhe
  const [erro,       setErro]       = useState('');

  // Carrego perfil e pontuação em paralelo ao montar o componente
  useEffect(() => {
    const carregar = async () => {
      try {
        // Ambas as chamadas em paralelo para ser mais rápido
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

  // Ecrã de carregamento enquanto os dados chegam
  if (carregando) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-green-700">A carregar perfil...</p>
    </div>
  );

  // Ecrã de erro se algo correu mal
  if (erro || !perfil) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <Header />
      <p className="text-red-500">{erro || 'Erro ao carregar perfil.'}</p>
    </div>
  );

  // ── Cálculo do nível com base nos pontos totais ───────────────
  const totalPontos = pontuacao?.pontuacao?.total_pontos || 0;

  // Determino o nível actual (1 a 5) com base nos pontos
  const nivel = totalPontos < 100  ? 1 :
                totalPontos < 300  ? 2 :
                totalPontos < 600  ? 3 :
                totalPontos < 1000 ? 4 : 5;

  // Nome do nível correspondente ao índice (nivel - 1)
  const nomeNivel = ['EcoIniciante', 'EcoAmigo', 'EcoDefensor', 'EcoMestre', 'EcoLenda'][nivel - 1];

  // Pontos necessários para chegar ao próximo nível
  const limiteNivel = [100, 300, 600, 1000, 1500][nivel - 1];

  // Pontos base do nível actual (onde começa)
  const baseNivel = [0, 100, 300, 600, 1000][nivel - 1];

  // Percentagem de progresso dentro do nível actual
  const progresso = Math.min(100, Math.round(((totalPontos - baseNivel) / (limiteNivel - baseNivel)) * 100));

  // Total de entregas realizadas pelo utilizador
  const totalTrocas = pontuacao?.pontuacao?.total_entregas || 0;

  // Inicial do nome para o avatar circular
  const inicial = perfil.nome?.charAt(0).toUpperCase();

  return (
    // Fundo verde claro, ocupa toda a largura disponível (sem max-w)
    <div className="min-h-screen bg-green-100 pt-24 pb-12">
      <Header />

      {/* Container sem max-w para ocupar toda a largura disponível */}
      <div className="px-4">
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-6">

          {/* Layout: avatar à esquerda, info à direita (coluna no mobile) */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">

            {/* Avatar circular com a inicial do nome */}
            <div className="w-24 h-24 rounded-full bg-green-600 flex items-center justify-center text-white text-4xl font-bold shrink-0 border-4 border-green-200">
              {inicial}
            </div>

            <div className="flex-1 w-full">

              {/* Nome, nível e botões de acção */}
              <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
                <div>
                  {/* Nome completo do utilizador */}
                  <h2 className="text-2xl font-bold text-green-800">{perfil.nome}</h2>
                  {/* Nível com ícone de estrela */}
                  <p className="text-green-600 font-medium text-sm flex items-center gap-1 mt-0.5">
                    <Star size={13} className="fill-green-500 text-green-500" />
                    {nomeNivel} — Nível {nivel}
                  </p>
                </div>

                {/* Botões Editar perfil e Definições */}
                <div className="flex gap-2">
                  {/* Navega para o formulário de edição de perfil */}
                  <button
                    onClick={() => navigate("/Editar")}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition text-sm"
                  >
                    <Edit size={14} /> Editar
                  </button>
                  {/* Navega para as definições da conta */}
                  <button
                    onClick={() => navigate("/definicoes")}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition text-sm"
                  >
                    <Settings size={14} /> Definições
                  </button>
                </div>
              </div>

              {/* Estatísticas: pontos totais e número de entregas */}
              <div className="flex gap-6 mb-4">
                <div>
                  <p className="text-xl font-bold text-green-700">{totalPontos}</p>
                  <p className="text-xs text-gray-500">Pontos</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-700">{totalTrocas}</p>
                  <p className="text-xs text-gray-500">Entregas</p>
                </div>
                {/* Província — só aparece se estiver preenchida no perfil */}
                {perfil.provincia && (
                  <div>
                    <p className="text-sm font-semibold text-green-700">{perfil.provincia}</p>
                    <p className="text-xs text-gray-500">Província</p>
                  </div>
                )}
              </div>

              {/* Barra de progresso para o próximo nível */}
              <div className="w-full bg-green-100 rounded-full h-3 mb-1">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              {/* Percentagem e indicação do próximo nível */}
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <RefreshCw size={10} /> {progresso}% para o nível {nivel + 1}
              </p>

            </div>
          </div>

          {/* Contactos — só aparece se email ou telefone estiverem preenchidos */}
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