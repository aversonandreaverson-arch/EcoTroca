import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Loader } from "lucide-react";

// Corrigir ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function MapaRotas({
  origem,      // { lat, lng, nome? }
  destino,     // { lat, lng, nome? }
  altura = 400, // altura do mapa em px
  zoom = 13,
  aoClicarNavegar // callback quando clica em "Iniciar Navegação"
}) {
  const mapRef = useRef(null);
  const mapaInstancia = useRef(null);
  const marcadorOrigem = useRef(null);
  const marcadorDestino = useRef(null);
  const linhaRota = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !origem || !destino) return;

    // Inicializar mapa
    if (!mapaInstancia.current) {
      mapaInstancia.current = L.map(mapRef.current).setView(
        [origem.lat, origem.lng],
        zoom
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapaInstancia.current);
    }

    const mapa = mapaInstancia.current;

    // Remover marcadores antigos
    if (marcadorOrigem.current) mapa.removeLayer(marcadorOrigem.current);
    if (marcadorDestino.current) mapa.removeLayer(marcadorDestino.current);
    if (linhaRota.current) mapa.removeLayer(linhaRota.current);

    // Adicionar marcador de origem (verde)
    marcadorOrigem.current = L.circleMarker([origem.lat, origem.lng], {
      radius: 8,
      fillColor: "#10b981", // verde
      color: "#059669",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    })
      .addTo(mapa)
      .bindPopup(`<strong>Sua localização</strong><br>${origem.nome || "Origem"}`);

    // Adicionar marcador de destino (vermelho)
    marcadorDestino.current = L.circleMarker([destino.lat, destino.lng], {
      radius: 10,
      fillColor: "#ef4444", // vermelho
      color: "#dc2626",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    })
      .addTo(mapa)
      .bindPopup(`<strong>Destino</strong><br>${destino.nome || "Destino"}`);

    // Desenhar linha entre origem e destino
    linhaRota.current = L.polyline(
      [[origem.lat, origem.lng], [destino.lat, destino.lng]],
      {
        color: "#3b82f6", // azul
        weight: 3,
        opacity: 0.7,
        dashArray: "5, 5",
      }
    ).addTo(mapa);

    // Focar na rota
    const group = L.featureGroup([marcadorOrigem.current, marcadorDestino.current]);
    mapa.fitBounds(group.getBounds(), { padding: [50, 50] });

    return () => {
      // Cleanup se necessário
    };
  }, [origem, destino, zoom]);

  const calcularDistancia = () => {
    if (!origem || !destino) return "0 km";
    const R = 6371; // raio da Terra em km
    const dLat = ((destino.lat - origem.lat) * Math.PI) / 180;
    const dLng = ((destino.lng - origem.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origem.lat * Math.PI) / 180) *
        Math.cos((destino.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const calcularTempo = () => {
    // Estimativa: ~40 km/h em zona urbana
    const distancia = parseFloat(calcularDistancia());
    const tempo = Math.ceil((distancia / 40) * 60); // em minutos
    if (tempo < 1) return "< 1 min";
    if (tempo < 60) return `${tempo} min`;
    const horas = Math.floor(tempo / 60);
    const minutos = tempo % 60;
    return `${horas}h ${minutos}m`;
  };

  const abrirGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/${origem.lat},${origem.lng}/${destino.lat},${destino.lng}`;
    window.open(url, "_blank");
  };

  const abrirOSMNavigation = () => {
    const url = `https://www.openstreetmap.org/directions?engine=osrm_car&route=${origem.lat}%2C${origem.lng}%3B${destino.lat}%2C${destino.lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-green-100">
      {/* Mapa */}
      <div
        ref={mapRef}
        style={{ height: `${altura}px`, width: "100%" }}
        className="relative z-0"
      />

      {/* Informações e Botões */}
      <div className="p-6 space-y-4">
        {/* Distância e Tempo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <p className="text-xs text-gray-500 mb-1">📍 Distância</p>
            <p className="text-lg font-bold text-green-700">{calcularDistancia()} km</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-xs text-gray-500 mb-1">⏱️ Tempo estimado</p>
            <p className="text-lg font-bold text-blue-700">{calcularTempo()}</p>
          </div>
        </div>

        {/* Localidades */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-green-100 p-3 rounded-lg">
            <p className="text-green-700 font-semibold">Saída</p>
            <p className="text-gray-600 text-xs truncate">{origem.nome || "Sua localização"}</p>
          </div>
          <div className="bg-red-100 p-3 rounded-lg">
            <p className="text-red-700 font-semibold">Chegada</p>
            <p className="text-gray-600 text-xs truncate">{destino.nome || "Destino"}</p>
          </div>
        </div>

        {/* Botões de Navegação */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={abrirGoogleMaps}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition text-sm"
            title="Abrir no Google Maps"
          >
            <Navigation size={16} />
            Google Maps
          </button>
          <button
            onClick={abrirOSMNavigation}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition text-sm"
            title="Abrir no OpenStreetMap"
          >
            <Navigation size={16} />
            OSM
          </button>
        </div>

        {/* Callback customizado */}
        {aoClicarNavegar && (
          <button
            onClick={aoClicarNavegar}
            className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <MapPin size={16} />
            Iniciar Navegação
          </button>
        )}
      </div>
    </div>
  );
}