import React, { useState } from "react"; 
// Importamos o React e o useState para usar estados no componente

export default function Editar() {

  // Criamos estados para guardar os dados do formulário
  // Cada useState guarda um valor e uma função para alterá-lo
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [bairro, setBairro] = useState("");

  // Função chamada quando clicamos no botão "Guardar Alterações"
  const guardarPerfil = () => {

    // Aqui apenas mostramos os dados no console
    // Mais tarde isso pode ser enviado para o backend
    console.log({
      nome,
      dataNascimento,
      provincia,
      municipio,
      bairro
    });

    // Mostra um alerta simples para confirmar a ação
    alert("Perfil atualizado!");
  };

  return (
    // Container principal do formulário
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto">

      {/* Título da página */}
      <h2 className="text-2xl font-bold mb-6 text-green-700">
        Editar Perfil
      </h2>

      {/* Campo Nome */}
      <input
        type="text"
        placeholder="Nome"
        value={nome} // O valor vem do estado
        onChange={(e) => setNome(e.target.value)} 
        // Atualiza o estado sempre que o utilizador escreve
        className="w-full border p-2 rounded mb-4"
      />

      {/* Campo Data de Nascimento */}
      <input
        type="date"
        value={dataNascimento}
        onChange={(e) => setDataNascimento(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      {/* Campo Província */}
      <input
        type="text"
        placeholder="Província"
        value={provincia}
        onChange={(e) => setProvincia(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      {/* Campo Município */}
      <input
        type="text"
        placeholder="Município"
        value={municipio}
        onChange={(e) => setMunicipio(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      {/* Campo Bairro */}
      <input
        type="text"
        placeholder="Bairro"
        value={bairro}
        onChange={(e) => setBairro(e.target.value)}
        className="w-full border p-2 rounded mb-6"
      />

      {/* Botão para guardar os dados */}
      <button
        onClick={guardarPerfil} // Chama a função ao clicar
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Guardar Alterações
      </button>
    </div>
  );
}
