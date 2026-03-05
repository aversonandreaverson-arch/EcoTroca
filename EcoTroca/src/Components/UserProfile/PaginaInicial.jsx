import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Recycle, Package, Users, ChevronRight } from 'lucide-react';
import Header from './Header';
import { getFeed } from '../../api.js';

export default function PaginaInicial() {
  const navigate = useNavigate();
  const [search,       setSearch]       = useState('');
  const [pedidos,      setPedidos]      = useState([]);
  const [coletadores,  setColetadores]  = useState([]);
  const [utilizadores, setUtilizadores] = useState([]);
  const [atividades,   setAtividades]   = useState([]);
  const [carregando,   setCarregando]   = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        setCarregando(true);
        const feed = await getFeed();
        setPedidos(feed.filter(p => p.tipo_publicacao === 'pedido_residuo'));
        setAtividades(feed.slice(0, 5));
        setColetadores(feed.filter(p => p.tipo_autor === 'coletor').reduce((acc, p) => {
          if (!acc.find(c => c.id_autor === p.id_autor)) acc.push(p);
          return acc;
        }, []));
        setUtilizadores(feed.filter(p => p.tipo_publicacao === 'oferta_residuo').reduce((acc, p) => {
          if (!acc.find(u => u.id_autor === p.id_autor)) acc.push(p);
          return acc;
        }, []));
      } catch (err) {
        console.error('Erro ao carregar página inicial:', err);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const filtrar = (lista) => {
    if (!search.trim()) return lista;
    const termo = search.toLowerCase();
    return lista.filter(p =>
      p.nome_autor?.toLowerCase().includes(termo) ||
      p.titulo?.toLowerCase().includes(termo) ||
      p.provincia?.toLowerCase().includes(termo) ||
      p.tipo_residuo?.toLowerCase().includes(termo)
    );
  };

  const verPerfil = (tipo, id) => navigate(`/Perfil/${tipo}/${id}`);

  return (
    <div id="PaginaInicial" className="pt-24 p-6 bg-green-100 min-h-screen">
      <Header />

      {/* Título */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-800">Página Inicial</h1>
        <p className="text-green-600">Veja o que está a acontecer agora no Ecotroca-Angola</p>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative mb-10">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar empresas, resíduos ou coletadores..."
          className="w-full pl-12 pr-10 py-3 rounded-xl border border-green-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        {search && (
          <X className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 cursor-pointer" onClick={() => setSearch('')} />
        )}
      </div>

      {carregando ? (
        <p className="text-green-700 text-center py-20">A carregar...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Coluna principal ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Pedidos de Empresas */}
            <section>
              <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                <Package size={20} className="text-green-600" /> Pedidos de Empresas
              </h2>
              {filtrar(pedidos).length === 0 ? (
                <p className="text-green-600 text-sm">Nenhum pedido de empresa disponível.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtrar(pedidos).map((p) => (
                    <div key={p.id_publicacao} className="bg-white rounded-2xl p-4 shadow-sm border border-green-100">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Pedido
                      </span>
                      <h3 className="font-bold text-gray-800 mt-2 mb-1">{p.titulo}</h3>
                      {p.descricao && (
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">{p.descricao}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {p.tipo_residuo && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Recycle size={11} /> {p.tipo_residuo}
                          </span>
                        )}
                        {p.provincia && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={11} /> {p.provincia}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => verPerfil(p.tipo_autor || 'empresa', p.id_autor)}
                        className="flex items-center gap-1 text-green-600 text-xs font-medium hover:underline"
                      >
                        {p.nome_autor} <ChevronRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Coletadores em Ação */}
            <section>
              <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                <Recycle size={20} className="text-green-600" /> Coletadores em Ação
              </h2>
              {filtrar(coletadores).length === 0 ? (
                <p className="text-green-600 text-sm">Nenhum coletador activo de momento.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtrar(coletadores).map((p) => (
                    <div key={p.id_autor} className="bg-white rounded-2xl p-4 shadow-sm border border-green-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                          {p.nome_autor?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <button
                            onClick={() => verPerfil('coletor', p.id_autor)}
                            className="font-semibold text-gray-800 hover:text-green-600 hover:underline text-sm flex items-center gap-1"
                          >
                            {p.nome_autor} <ChevronRight size={12} />
                          </button>
                          {p.provincia && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={10} /> {p.provincia}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Utilizadores Ativos */}
            <section>
              <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                <Users size={20} className="text-green-600" /> Utilizadores Ativos
              </h2>
              {filtrar(utilizadores).length === 0 ? (
                <p className="text-green-600 text-sm">Nenhum utilizador activo de momento.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtrar(utilizadores).map((p) => (
                    <div key={p.id_autor} className="bg-white rounded-2xl p-4 shadow-sm border border-green-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                          {p.nome_autor?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <button
                            onClick={() => verPerfil('comum', p.id_autor)}
                            className="font-semibold text-gray-800 hover:text-green-600 hover:underline text-sm flex items-center gap-1"
                          >
                            {p.nome_autor} <ChevronRight size={12} />
                          </button>
                          {p.provincia && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={10} /> {p.provincia}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── Coluna direita: Atividades recentes ── */}
          <div className="bg-green-700 p-6 rounded-2xl shadow-sm h-fit">
            <h2 className="text-xl font-semibold text-white mb-4">Atividades Recentes</h2>
            {atividades.length === 0 ? (
              <p className="text-green-300 text-sm">Nenhuma actividade recente.</p>
            ) : (
              <ul className="space-y-4">
                {atividades.map((p) => (
                  <li key={p.id_publicacao} className="border-b border-green-600 pb-3 last:border-0">
                    <button
                      onClick={() => verPerfil(p.tipo_autor || 'comum', p.id_autor)}
                      className="text-green-200 text-sm font-medium hover:underline"
                    >
                      {p.nome_autor}
                    </button>
                    <p className="text-white text-xs mt-0.5 line-clamp-2">{p.titulo}</p>
                    <p className="text-green-400 text-xs mt-0.5">
                      {new Date(p.criado_em).toLocaleDateString('pt-AO')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      )}
    </div>
  );
}