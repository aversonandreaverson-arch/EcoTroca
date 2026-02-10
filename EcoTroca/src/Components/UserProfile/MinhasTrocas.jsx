import React from "react";

export default function MyTrades({ items }) {
  return (
    <section className="m-6">
      <h2 className="text-xl font-bold mb-4">Minhas Trocas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white p-4 rounded shadow hover:shadow-md transition">
            <h3 className="font-semibold">{item.nome}</h3>
            <p>Status: <span className={item.status === "Concluída" ? "text-green-600" : "text-yellow-600"}>{item.status}</span></p>
            <button className="mt-2 px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800">Editar</button>
          </div>
        ))}
      </div>
    </section>
  );
}
