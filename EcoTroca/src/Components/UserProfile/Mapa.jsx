import React from 'react'

export default function Mapa() {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-green-800 mb-4">Mapa 🗺️</h3>
      <div className="h-64 bg-gray-200 flex items-center justify-center rounded-lg">
        {/* FUTURO: Google Maps ou Mapbox */}
        <p className="text-gray-600">Mapa em breve...</p>
      </div>
    </div>
  );
}
