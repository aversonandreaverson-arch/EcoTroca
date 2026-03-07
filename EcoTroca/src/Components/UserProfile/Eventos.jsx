
import { useState, useEffect } from "react";
import { CalendarDays, MapPin, Building2 } from "lucide-react";
import Header from "./Header";
import { getEventos } from "../../api.js";

export default function Eventos() {
  // Lista de eventos vindos do backend
  const [eventos,    setEventos]    = useState([]);
  // Controla o indicador de carregamento
  const [carregando, setCarregando] = useState(true);
  // Mensagem de erro caso a chamada à API falhe
  const [erro,       setErro]       = useState('');

  // Carrego os eventos ao montar o componente
  useEffect(() => {
    const carregar = async () => {
      try {
        setEventos(await getEventos()); // GET /api/eventos
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  return (
    // Fundo verde claro, ocupa toda a largura disponível (sem max-w)
    <div id="Eventos" className="min-h-screen bg-green-100 pt-24 p-6">
      <Header />

      {/* Container sem max-w para ocupar toda a largura disponível */}
      <div className="px-2 pb-12">

        {/* Cabeçalho da página */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-green-800">Eventos Sustentáveis</h2>
          <p className="text-green-600 text-sm mt-1">Participa e ajuda o meio ambiente.</p>
        </div>

        {/* Estado de carregamento */}
        {carregando && (
          <p className="text-green-700 text-center py-12">A carregar eventos...</p>
        )}

        {/* Mensagem de erro se a API falhar */}
        {erro && (
          <p className="text-red-500 text-center py-6">{erro}</p>
        )}

        {/* Estado vazio — sem eventos activos */}
        {!carregando && !erro && eventos.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-green-100">
            <p className="text-gray-400">Nenhum evento activo de momento.</p>
          </div>
        )}

        {/* Grelha de cartões de eventos — 1 coluna mobile, 2 colunas desktop */}
        <div className="grid md:grid-cols-2 gap-6">
          {eventos.map((evento) => (
            <div
              key={evento.id_evento}
              className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden hover:shadow-md transition duration-300"
            >
              {/* Imagem do evento — placeholder verde se não houver imagem */}
              {evento.imagem ? (
                <img
                  src={evento.imagem}
                  alt={evento.titulo}
                  className="w-full h-48 object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }} // Esconde se não carregar
                />
              ) : (
                // Placeholder com ícone de calendário quando não há imagem
                <div className="w-full h-48 bg-green-50 flex items-center justify-center">
                  <CalendarDays size={48} className="text-green-200" />
                </div>
              )}

              <div className="p-5">

                {/* Badge do tipo de evento — ex: Reciclagem, Limpeza, etc. */}
                {evento.tipo && (
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-lg mb-2">
                    {evento.tipo}
                  </span>
                )}

                {/* Título do evento */}
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  {evento.titulo}
                </h3>

                {/* Descrição resumida — máximo 2 linhas */}
                {evento.descricao && (
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">{evento.descricao}</p>
                )}

                {/* Detalhes: data, local, empresa organizadora */}
                <div className="space-y-2 text-gray-500 text-sm mb-4">

                  {/* Intervalo de datas do evento */}
                  {evento.data_inicio && (
                    <div className="flex items-center gap-2">
                      <CalendarDays size={15} className="text-green-600 shrink-0" />
                      <span>
                        {new Date(evento.data_inicio).toLocaleDateString('pt-AO', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                        {/* Mostra data_fim só se for diferente da data_inicio */}
                        {evento.data_fim && evento.data_fim !== evento.data_inicio && (
                          <> → {new Date(evento.data_fim).toLocaleDateString('pt-AO', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}</>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Localização: local + município + província */}
                  {(evento.local || evento.provincia) && (
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-green-600 shrink-0" />
                      <span>
                        {/* Junta apenas os campos que existem, separados por vírgula */}
                        {[evento.local, evento.municipio, evento.provincia]
                          .filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Empresa que criou o evento */}
                  {evento.nome_empresa && (
                    <div className="flex items-center gap-2">
                      <Building2 size={15} className="text-green-600 shrink-0" />
                      <span>{evento.nome_empresa}</span>
                    </div>
                  )}

                </div>

                {/* Botão de participação */}
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