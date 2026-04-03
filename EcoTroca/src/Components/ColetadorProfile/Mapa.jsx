
//  Mapa interactivo com Leaflet + OpenStreetMap.
//  Mostra origem (verde), destino (vermelho) e rota entre eles.
//  Calcula distancia e tempo estimado.
//  Abre Google Maps ou OSM para navegacao real.
//
//  CORRECAO DO ECRA BRANCO:
//    - CSS importado directamente aqui (nao depende de main.jsx)
//    - Altura definida via style inline antes do mount
//    - invalidateSize() chamado apos mount para forccar re-render do mapa
//    - Cleanup completo no return do useEffect


import { useEffect, useRef } from "react";
import { Navigation, MapPin } from "lucide-react";

// Importa o CSS do Leaflet directamente — essencial para o mapa aparecer
// Sem isto o mapa fica branco mesmo que o JS funcione
import "leaflet/dist/leaflet.css";

export default function MapaRotas({
  origem,          // { lat, lng, nome? } — posicao do coletador ou utilizador
  destino,         // { lat, lng, nome? } — posicao da empresa ou utilizador
  altura = 380,    // altura em px do contentor do mapa
  aoClicarNavegar, // callback opcional quando clica "Iniciar Navegacao"
}) {
  const mapRef       = useRef(null); // referencia ao div HTML do mapa
  const mapaInst     = useRef(null); // instancia do mapa Leaflet
  const marcadores   = useRef([]);   // lista de marcadores para cleanup
  const linhas       = useRef([]);   // lista de linhas para cleanup

  useEffect(() => {
    // Nao inicializa se faltar o div, origem ou destino
    if (!mapRef.current || !origem || !destino) return;

    // Importa o Leaflet de forma dinamica para evitar erros de SSR
    // e garantir que o DOM esta pronto antes do import
    let L;
    let mounted = true;

    const inicializar = async () => {
      // Import dinamico — garante que o Leaflet so carrega no browser
      const leaflet = await import("leaflet");
      L = leaflet.default;

      if (!mounted) return; // componente desmontado entretanto

      // Corrige os icones default do Leaflet que ficam quebrados no Vite/webpack
      // O Leaflet tenta resolver URLs relativas que nao existem no bundle
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      // Destroi mapa anterior se existir (evita erro "Map container is already initialized")
      if (mapaInst.current) {
        mapaInst.current.remove();
        mapaInst.current = null;
      }

      // Cria o mapa centrado na origem
      const mapa = L.map(mapRef.current, {
        center:    [origem.lat, origem.lng],
        zoom:      13,
        zoomControl: true,
      });
      mapaInst.current = mapa;

      // Adiciona tiles do OpenStreetMap — gratuito e sem chave de API
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom:     19,
      }).addTo(mapa);

      // ── Marcador de origem — circulo verde ────────────────
      const mOrigem = L.circleMarker([origem.lat, origem.lng], {
        radius:      10,
        fillColor:   "#10b981", // verde
        color:       "#059669",
        weight:      3,
        opacity:     1,
        fillOpacity: 0.9,
      })
        .addTo(mapa)
        .bindPopup(`<strong>${origem.nome || "A tua localizacao"}</strong>`);

      // ── Marcador de destino — circulo vermelho ────────────
      const mDestino = L.circleMarker([destino.lat, destino.lng], {
        radius:      12,
        fillColor:   "#ef4444", // vermelho
        color:       "#dc2626",
        weight:      3,
        opacity:     1,
        fillOpacity: 0.9,
      })
        .addTo(mapa)
        .bindPopup(`<strong>${destino.nome || "Destino"}</strong>`);

      // ── Linha tracejada entre origem e destino ────────────
      const linha = L.polyline(
        [[origem.lat, origem.lng], [destino.lat, destino.lng]],
        { color: "#3b82f6", weight: 3, opacity: 0.8, dashArray: "8, 6" }
      ).addTo(mapa);

      // Guarda referencias para cleanup posterior
      marcadores.current = [mOrigem, mDestino];
      linhas.current     = [linha];

      // Ajusta o zoom para mostrar os dois marcadores com padding
      const grupo = L.featureGroup([mOrigem, mDestino]);
      mapa.fitBounds(grupo.getBounds(), { padding: [50, 50] });

      // CRUCIAL: forcca o Leaflet a recalcular o tamanho do contentor
      // Sem isto o mapa pode ficar parcialmente branco apos transitions CSS
      setTimeout(() => {
        if (mapaInst.current && mounted) {
          mapaInst.current.invalidateSize();
        }
      }, 100);
    };

    inicializar().catch(console.error);

    // Cleanup ao desmontar — evita memory leaks e erros de "already initialized"
    return () => {
      mounted = false;
      if (mapaInst.current) {
        mapaInst.current.remove();
        mapaInst.current = null;
      }
    };
  }, [origem?.lat, origem?.lng, destino?.lat, destino?.lng]);

  // ── Calcula distancia em linha recta (formula de Haversine) ──
  const calcularDistancia = () => {
    if (!origem || !destino) return "0";
    const R    = 6371; // raio da Terra em km
    const dLat = ((destino.lat - origem.lat) * Math.PI) / 180;
    const dLng = ((destino.lng - origem.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((origem.lat  * Math.PI) / 180) *
      Math.cos((destino.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  };

  // ── Calcula tempo estimado — assume 40 km/h em zona urbana ──
  const calcularTempo = () => {
    const km    = parseFloat(calcularDistancia());
    const mins  = Math.ceil((km / 40) * 60);
    if (mins < 1)  return "< 1 min";
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const distancia = calcularDistancia();
  const tempo     = calcularTempo();

  // Abre Google Maps com a rota no browser/app
  const abrirGoogleMaps = () => {
    if (!origem || !destino) return;
    window.open(
      `https://www.google.com/maps/dir/${origem.lat},${origem.lng}/${destino.lat},${destino.lng}`,
      "_blank"
    );
  };

  // Abre OpenStreetMap com a rota — alternativa gratuita
  const abrirOSM = () => {
    if (!origem || !destino) return;
    window.open(
      `https://www.openstreetmap.org/directions?engine=osrm_car&route=${origem.lat}%2C${origem.lng}%3B${destino.lat}%2C${destino.lng}`,
      "_blank"
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-green-100">

      {/* Contentor do mapa — altura definida via style inline para garantir que o Leaflet o ve */}
      {/* A altura tem de estar definida ANTES do mount para o Leaflet calcular correctamente */}
      <div
        ref={mapRef}
        style={{ height: `${altura}px`, width: "100%" }}
        className="relative z-0"
      />

      {/* Painel de informacoes abaixo do mapa */}
      <div className="p-5 space-y-4">

        {/* Distancia e tempo lado a lado */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 p-3 rounded-xl border border-green-100">
            <p className="text-xs text-gray-500 mb-1">Distancia</p>
            <p className="text-lg font-bold text-green-700">{distancia} km</p>
            <p className="text-xs text-gray-400">em linha recta</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
            <p className="text-xs text-gray-500 mb-1">Tempo estimado</p>
            <p className="text-lg font-bold text-blue-700">{tempo}</p>
            <p className="text-xs text-gray-400">a ~40 km/h</p>
          </div>
        </div>

        {/* Origem e destino */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-green-100 p-3 rounded-xl flex items-start gap-2">
            {/* Circulo verde = origem */}
            <div className="w-3 h-3 rounded-full bg-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-semibold text-xs">Saida</p>
              <p className="text-gray-600 text-xs truncate">{origem?.nome || "A tua localizacao"}</p>
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-xl flex items-start gap-2">
            {/* Circulo vermelho = destino */}
            <div className="w-3 h-3 rounded-full bg-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-semibold text-xs">Chegada</p>
              <p className="text-gray-600 text-xs truncate">{destino?.nome || "Destino"}</p>
            </div>
          </div>
        </div>

        {/* Botoes de navegacao externa */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={abrirGoogleMaps}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition text-sm">
            <Navigation size={15} /> Google Maps
          </button>
          <button onClick={abrirOSM}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium transition text-sm">
            <MapPin size={15} /> OpenStreetMap
          </button>
        </div>

        {/* Botao customizado opcional */}
        {aoClicarNavegar && (
          <button onClick={aoClicarNavegar}
            className="w-full bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-xl font-medium transition flex items-center justify-center gap-2">
            <Navigation size={16} /> Iniciar Navegacao
          </button>
        )}
      </div>
    </div>
  );
}