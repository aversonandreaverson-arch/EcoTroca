import React, { useState } from "react";

export default function Definicoes() {

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [notificacoes, setNotificacoes] = useState(false);

  const guardarConta = () => {
    console.log({
      nome,
      email,
      telefone,
      senhaAtual,
      novaSenha,
      notificacoes
    });

    alert("Alterações guardadas!");
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-green-700">
        Definições da Conta
      </h2>

      {/* Nome */}
      <div className="mb-4">
        <label className="block mb-1">Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Telefone */}
      <div className="mb-4">
        <label className="block mb-1">Telefone</label>
        <input
          type="text"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Palavra-passe */}
      <div className="mb-4">
        <label className="block mb-1">Senha Atual</label>
        <input
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Nova Senha</label>
        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Notificações */}
      <div className="flex items-center gap-2 mb-6">
        <input
          type="checkbox"
          checked={notificacoes}
          onChange={(e) => setNotificacoes(e.target.checked)}
        />
        <label>Ativar notificações</label>
      </div>

      <button
        onClick={guardarConta}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Guardar Alterações
      </button>
    </div>
  );
}
