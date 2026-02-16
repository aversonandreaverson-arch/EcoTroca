import React, { useState } from "react";

export default function Editar() {

  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [bairro, setBairro] = useState("");

  const guardarPerfil = () => {
    console.log({
      nome,
      dataNascimento,
      provincia,
      municipio,
      bairro
    });

    alert("Perfil atualizado!");
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-green-700">
        Editar Perfil
      </h2>

      <input
        type="text"
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      <input
        type="date"
        value={dataNascimento}
        onChange={(e) => setDataNascimento(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      <input
        type="text"
        placeholder="Província"
        value={provincia}
        onChange={(e) => setProvincia(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      <input
        type="text"
        placeholder="Município"
        value={municipio}
        onChange={(e) => setMunicipio(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      <input
        type="text"
        placeholder="Bairro"
        value={bairro}
        onChange={(e) => setBairro(e.target.value)}
        className="w-full border p-2 rounded mb-6"
      />

      <button
        onClick={guardarPerfil}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Guardar Alterações
      </button>
    </div>
  );
}
