
import React, { useState, useEffect } from "react";
import { Truck, Phone, Mail, MapPin, Star, Wallet, Banknote, CreditCard, ArrowLeft } from "lucide-react";
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
          // Modo público — carrega dados do outro coletador
          const dados = await getPerfilPublico('coletor', id);
          setPerfil(dados.perfil);
          setStats({
            concluidas: dados.perfil.total_coletas || 0,
            pontos:     dados.perfil.total_pontos  || 0,
          });
        } else {
          // Modo privado — carrega dados do próprio coletador
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
      <p className="text-green-700 text-lg">A carregar perfil...</p>
    </div>
  );

  if (erro || !perfil) return (
    <div className="min-h-screen bg-green-100 pt-24 flex items-center justify-center">
      <Header />
      <div className="text-center">
        <p className="text-red-500 mb-4">{erro || 'Perfil não encontrado.'}</p>
        {modoPublico && (
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-600 hover:text-green-800 mx-auto">
            <ArrowLeft size={16} /> Voltar
          </button>
        )}
      </div>
    </div>
  );

  const subtipo = perfil.tipo === 'dependente' ? 'Coletador de Empresa' : 'Coletador Independente';

  return (
    <div className="min-h-screen bg-green-100 pt-24 p-6">
      <Header />

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Botão voltar — só no modo público */}
        {modoPublico && (
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-700 hover:text-green-900 text-sm transition">
            <ArrowLeft size={16} /> Voltar
          </button>
        )}

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {perfil?.foto_perfil ? (
              <img src={perfil.foto_perfil} alt="foto" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Truck size={40} className="text-green-600" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-800">{perfil?.nome}</h2>
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm font-medium px-4 py-1 rounded-full mt-2">
            <Truck size={14} /> {subtipo}
          </span>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-700">{stats.concluidas}</p>
              <p className="text-xs text-gray-500">Coletas realizadas</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                <Star size={18} /> {stats.pontos}
              </p>
              <p className="text-xs text-gray-500">Pontos ganhos</p>
            </div>
          </div>
        </div>

        {/* Carteira — só no modo privado */}
        {!modoPublico && carteira && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
            <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
              <Wallet size={20} /> Carteira
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2"><Banknote size={22} className="text-green-600" /></div>
                <p className="text-2xl font-bold text-green-700">{parseFloat(carteira?.dinheiro || 0).toFixed(2)} Kz</p>
                <p className="text-xs text-gray-500 mt-1">Dinheiro (sacável)</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2"><CreditCard size={22} className="text-blue-600" /></div>
                <p className="text-2xl font-bold text-blue-700">{parseFloat(carteira?.saldo || 0).toFixed(2)} Kz</p>
                <p className="text-xs text-gray-500 mt-1">Saldo (só na app)</p>
              </div>
            </div>
          </div>
        )}

        {/* Informações */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4">Informações</h3>
          <div className="space-y-3 text-gray-600">
            {/* Telefone e email — só no modo privado */}
            {!modoPublico && (
              <>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-green-500" />
                  <span>{perfil?.telefone || 'Não definido'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-green-500" />
                  <span>{perfil?.email || 'Não definido'}</span>
                </div>
              </>
            )}
            {/* Localização — visível para todos */}
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-green-500" />
              <span>
                {[perfil?.municipio, perfil?.provincia].filter(Boolean).join(', ') || 'Localização não definida'}
              </span>
            </div>
            {/* Data de registo — só no modo público */}
            {modoPublico && perfil?.data_criacao && (
              <div className="text-sm text-gray-400">
                Membro desde {new Date(perfil.data_criacao).toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        {/* Botões — só no modo privado */}
        {!modoPublico && (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate('/EditarColetador')}
              className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition">
              Editar Perfil
            </button>
            <button onClick={() => navigate('/DefinicoesColetador')}
              className="bg-white hover:bg-gray-50 text-green-700 border border-green-200 py-3 rounded-xl font-medium transition">
              Definições
            </button>
          </div>
        )}

      </div>
    </div>
  );
}