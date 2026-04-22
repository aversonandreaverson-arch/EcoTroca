import { useState, useEffect } from "react";
import { CalendarDays, Tag, Newspaper } from "lucide-react";
import Header from "./Header";
import { getFeed } from "../../api.js";

export default function Noticias() {
  const [noticias,   setNoticias]   = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');
  const [aberta,     setAberta]     = useState(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await getFeed();
        // getFeed pode devolver array simples ou { publicacoes, propostasEnviadas }
        // extraimos sempre o array antes de filtrar
        const feed = Array.isArray(dados) ? dados : (dados?.publicacoes || []);
        setNoticias(feed.filter(p => p.tipo_publicacao === 'noticia'));
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  return (
    <div id="Noticias" className="min-h-screen bg-green-100 pt-24 p-6">
      <Header />

      <div className="px-2 pb-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-green-800">Últimas Notícias</h2>
          <p className="text-green-600 text-sm mt-1">Fica actualizado sobre sustentabilidade e inovação.</p>
        </div>

        {carregando && <p className="text-green-700 text-center py-12">A carregar notícias...</p>}
        {erro && <p className="text-red-500 text-center py-6">{erro}</p>}

        {!carregando && !erro && noticias.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-green-100">
            <Newspaper size={48} className="mx-auto mb-3 text-green-200" />
            <p className="text-gray-400">Nenhuma notícia disponível de momento.</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {noticias.map((noticia) => (
            <div key={noticia.id_publicacao}
              className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition duration-300">
              {noticia.imagem ? (
                <img src={noticia.imagem} alt={noticia.titulo}
                  className="w-full h-48 object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="w-full h-48 bg-green-50 flex items-center justify-center">
                  <Newspaper size={48} className="text-green-200" />
                </div>
              )}
              <div className="p-5">
                <span className="inline-flex items-center gap-1 bg-cyan-100 text-cyan-700 text-xs font-medium px-3 py-1 rounded-full mb-3">
                  <Tag size={11} /> Notícia
                </span>
                <h3 className="text-base font-semibold text-green-800 mb-2">{noticia.titulo}</h3>
                {noticia.descricao && (
                  <p className="text-gray-500 text-xs mb-3 line-clamp-3">{noticia.descricao}</p>
                )}
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
                  <CalendarDays size={12} />
                  {new Date(noticia.criado_em).toLocaleDateString('pt-AO', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
                <button onClick={() => setAberta(noticia)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-xl transition">
                  Ler mais
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {aberta && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {aberta.imagem && (
              <img src={aberta.imagem} alt={aberta.titulo}
                className="w-full h-48 object-cover rounded-t-2xl"
                onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <div className="p-6">
              <h2 className="text-xl font-bold text-green-800 mb-2">{aberta.titulo}</h2>
              <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                <CalendarDays size={11} />
                {new Date(aberta.criado_em).toLocaleDateString('pt-AO', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
                {aberta.nome_autor && <span className="ml-2">· {aberta.nome_autor}</span>}
              </p>
              {aberta.descricao && (
                <p className="text-gray-600 text-sm leading-relaxed mb-3">{aberta.descricao}</p>
              )}
              <button onClick={() => setAberta(null)}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}