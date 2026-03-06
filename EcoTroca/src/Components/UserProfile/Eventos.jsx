import { useState, useEffect } from "react";
import { CalendarDays, MapPin, Building2 } from "lucide-react";
import Header from "./Header";
import { getEventos } from "../../api.js";

export default function Eventos() {
  const [eventos,    setEventos]    = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        setEventos(await getEventos());
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  return (
    <div id="Eventos" className="min-h-screen bg-green-100 pt-24 p-6">
      <Header />

      <div className="max-w-4xl mx-auto px-2 pb-12">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-green-800">Eventos Sustentáveis</h2>
          <p className="text-green-600 text-sm mt-1">Participa e ajuda o meio ambiente.</p>
        </div>

        {carregando && (
          <p className="text-green-700 text-center py-12">A carregar eventos...</p>
        )}

        {erro && (
          <p className="text-red-500 text-center py-6">{erro}</p>
        )}

        {!carregando && !erro && eventos.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-green-100">
            <p className="text-gray-400">Nenhum evento activo de momento.</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {eventos.map((evento) => (
            <div
              key={evento.id_evento}
              className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden hover:shadow-md transition duration-300"
            >
              {/* Imagem */}
              {evento.imagem ? (
                <img
                  src={evento.imagem}
                  alt={evento.titulo}
                  className="w-full h-48 object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-48 bg-green-50 flex items-center justify-center">
                  <CalendarDays size={48} className="text-green-200" />
                </div>
              )}

              <div className="p-5">

                {/* Tipo do evento */}
                {evento.tipo && (
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-lg mb-2">
                    {evento.tipo}
                  </span>
                )}

                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  {evento.titulo}
                </h3>

                {evento.descricao && (
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">{evento.descricao}</p>
                )}

                <div className="space-y-2 text-gray-500 text-sm mb-4">

                  {/* Data */}
                  {evento.data_inicio && (
                    <div className="flex items-center gap-2">
                      <CalendarDays size={15} className="text-green-600 shrink-0" />
                      <span>
                        {new Date(evento.data_inicio).toLocaleDateString('pt-AO', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                        {evento.data_fim && evento.data_fim !== evento.data_inicio && (
                          <> → {new Date(evento.data_fim).toLocaleDateString('pt-AO', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}</>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Local */}
                  {(evento.local || evento.provincia) && (
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-green-600 shrink-0" />
                      <span>
                        {[evento.local, evento.municipio, evento.provincia]
                          .filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Empresa organizadora */}
                  {evento.nome_empresa && (
                    <div className="flex items-center gap-2">
                      <Building2 size={15} className="text-green-600 shrink-0" />
                      <span>{evento.nome_empresa}</span>
                    </div>
                  )}

                </div>

                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-xl transition text-sm">
                  Participar
                </button>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}