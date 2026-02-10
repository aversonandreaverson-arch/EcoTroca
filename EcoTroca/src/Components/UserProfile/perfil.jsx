import React from "react";

export default function Profile() {
  return (
    <section className="bg-white shadow-md rounded-lg p-6 m-6 flex items-center">
      <img
        src="https://via.placeholder.com/80"
        alt="Avatar"
        className="rounded-full mr-6"
      />
      <div>
        <h2 className="text-xl font-bold">Áverson Wambembe</h2>
        <p className="text-gray-600">EcoAmigo - Nível 3</p>
        <div className="flex mt-2 space-x-4 text-gray-700">
          <span>Total Trocas: 12</span>
          <span>Recompensas: 240 pts</span>
        </div>
      </div>
    </section>
  );
}
