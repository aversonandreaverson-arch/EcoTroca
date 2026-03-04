
//  O que esta página faz:
//  Quando alguém clica em "Ver perfil →" numa publicação do feed,
//  é redirecionado para esta página com o tipo e ID do autor.
//  Mostro os dados públicos do perfil e as suas publicações.
//
//  Rota: /Perfil/:tipo/:id
//  Exemplo: /Perfil/utilizador/5
//           /Perfil/empresa/3
//           /Perfil/coletor/8
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Building2, Recycle, MapPin,
  Phone, Calendar, ArrowLeft, Weight, Banknote
} from 'lucide-react';
import { getPerfilPublico } from '../../api.js';

export default function PerfilPublico() {

  // useParams → lê o :tipo e o :id da URL automaticamente
  // Exemplo: /Perfil/empresa/3 → tipo='empresa', id='3'
  const { tipo, id } = useParams();

  const navigate = useNavigate();

  // perfil → dados do utilizador vindos da API
  const [perfil, setPerfil] = useState(null);

  // publicacoes → lista de publicações do utilizador no feed
  const [publicacoes, setPublicacoes] = useState([]);

  // carregando → true enquanto os dados não chegaram
  const [carregando, setCarregando] = useState(true);

  // erro → mensagem de erro se a API falhar
  const [erro, setErro] = useState('');

  // Carrego os dados ao abrir a página ou quando o tipo/id mudar
  useEffect(() => {
    carregarPerfil();
  }, [tipo, id]); // [tipo, id] → executa sempre que estes valores mudam

  const carregarPerfil = async () => {
    try {
      setCarregando(true);
      // GET /api/perfil-publico/:tipo/:id
      const dados = await getPerfilPublico(tipo, id);
      setPerfil(dados.perfil);
      setPublicacoes(dados.publicacoes || []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // ── Calcula a idade a partir da data de nascimento ──
  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return null;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    // Subtrai o ano de nascimento do ano actual
    let idade = hoje.getFullYear() - nasc.getFullYear();
    // Ajusta se o aniversário ainda não passou este ano
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  // ── Ecrã de carregamento ──
  if (carregando) return (
    <div className="min-h-screen bg-linear-to-b from-green-950 to-green-900 flex items-center justify-center">
      <p className="text-white text-lg">A carregar perfil...</p>
    </div>
  );

  // ── Ecrã de erro ──
  if (erro || !perfil) return (
    <div className="min-h-screen bg-linear-to-b from-green-950 to-green-900 flex flex-col items-center justify-center gap-4">
      <p className="text-red-400">{erro || 'Perfil não encontrado.'}</p>
      <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white text-sm flex items-center gap-2">
        <ArrowLeft size={16} /> Voltar
      </button>
    </div>
  );

  const idade = calcularIdade(perfil.data_nascimento);

  return (
    <div className="min-h-screen bg-linear-to-b from-green-950 to-green-900 pb-12">

      {/* ── Botão voltar ── */}
      <div className="max-w-2xl mx-auto px-4 pt-6 mb-4">
        <button
          onClick={() => navigate(-1)}
          // navigate(-1) → volta à página anterior (como o botão "Recuar" do browser)
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition"
        >
          <ArrowLeft size={16} /> Voltar ao feed
        </button>
      </div>

      {/* ── Cartão de perfil ── */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white/10 rounded-2xl p-6 mb-6">

          {/* Avatar e nome */}
          <div className="flex items-start gap-4 mb-5">

            {/* Avatar com inicial do nome */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 ${
              tipo === 'empresa'  ? 'bg-purple-400/30 text-purple-200' :
              tipo === 'coletor' ? 'bg-green-400/30 text-green-200'   :
                                   'bg-blue-400/30 text-blue-200'
            }`}>
              {perfil.nome?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              {/* Nome do utilizador/empresa */}
              <h1 className="text-white text-xl font-bold">{perfil.nome}</h1>

              {/* Badge do tipo */}
              <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium mt-1 ${
                tipo === 'empresa'  ? 'bg-purple-400/20 text-purple-300' :
                tipo === 'coletor' ? 'bg-green-400/20 text-green-300'   :
                                     'bg-blue-400/20 text-blue-300'
              }`}>
                {tipo === 'empresa'  ? '🏭 Empresa Recicladora' :
                 tipo === 'coletor' ? '♻️ Coletador'           :
                                      '👤 Utilizador'}
              </span>
            </div>
          </div>

          {/* ── Dados públicos do perfil ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Idade — só para utilizadores e coletadores */}
            {idade && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <User size={14} className="shrink-0" />
                <span>{idade} anos</span>
              </div>
            )}

            {/* Província */}
            {perfil.provincia && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <MapPin size={14} className="shrink-0" />
                <span>{perfil.provincia}{perfil.municipio ? `, ${perfil.municipio}` : ''}</span>
              </div>
            )}

            {/* Telefone */}
            {perfil.telefone && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Phone size={14} className="shrink-0" />
                <span>{perfil.telefone}</span>
              </div>
            )}

            {/* Data de registo */}
            {perfil.data_criacao && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Calendar size={14} className="shrink-0" />
                <span>Membro desde {new Date(perfil.data_criacao).toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}</span>
              </div>
            )}

            {/* Tipo de coletador — só para coletadores */}
            {tipo === 'coletor' && perfil.tipo && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Recycle size={14} className="shrink-0" />
                <span>{perfil.tipo === 'independente' ? 'Coletador Independente' : 'Coletador de Empresa'}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Publicações do utilizador no feed ── */}
        <h2 className="text-white font-semibold text-lg mb-4">
          Publicações de resíduos ({publicacoes.length})
        </h2>

        {publicacoes.length === 0 ? (
          <p className="text-white/40 text-center py-8">
            Ainda não há publicações.
          </p>
        ) : (
          <div className="space-y-4">
            {publicacoes.map((p) => (
              <div key={p.id_publicacao} className="bg-white/5 border border-white/10 rounded-2xl p-4">

                {/* Badge do tipo de publicação */}
                <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium mb-2 ${
                  p.tipo_publicacao === 'oferta_residuo'
                    ? 'bg-green-400/20 text-green-300'
                    : 'bg-purple-400/20 text-purple-300'
                }`}>
                  {p.tipo_publicacao === 'oferta_residuo' ? '♻️ Oferta' : '🏭 Pedido'}
                </span>

                {/* Título da publicação */}
                <p className="text-white font-medium text-sm mb-1">{p.titulo}</p>

                {/* Descrição — se existir */}
                {p.descricao && (
                  <p className="text-white/50 text-xs mb-2">{p.descricao}</p>
                )}

                {/* Detalhes — peso, valor, localização */}
                <div className="flex flex-wrap gap-3 mt-2">
                  {p.tipo_residuo && (
                    <span className="flex items-center gap-1 text-white/60 text-xs">
                      <Recycle size={11} /> {p.tipo_residuo}
                    </span>
                  )}
                  {p.quantidade_kg && (
                    <span className="flex items-center gap-1 text-white/60 text-xs">
                      <Weight size={11} /> {p.quantidade_kg} kg
                    </span>
                  )}
                  {p.valor_proposto && (
                    <span className="flex items-center gap-1 text-green-300 text-xs">
                      <Banknote size={11} /> {parseFloat(p.valor_proposto).toFixed(0)} Kz
                    </span>
                  )}
                  {p.provincia && (
                    <span className="flex items-center gap-1 text-white/50 text-xs">
                      <MapPin size={11} /> {p.provincia}
                    </span>
                  )}
                </div>

                {/* Data da publicação */}
                <p className="text-white/30 text-xs mt-2">
                  {new Date(p.criado_em).toLocaleDateString('pt-AO')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}