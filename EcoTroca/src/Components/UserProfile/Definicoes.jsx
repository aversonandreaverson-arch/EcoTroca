import React, { useState } from "react";
// Importamos o React e o hook useState para trabalhar com estados

export default function Definicoes() {

  // Estados para guardar os dados da conta do utilizador
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [notificacoes, setNotificacoes] = useState(false);
  // Notificações começa como false (desativado)

  // Função chamada quando clicamos no botão "Guardar Alterações"
  const guardarConta = () => {

    // Aqui mostramos os dados no console (apenas para teste)
    // Depois isso pode ser enviado para o backend
    console.log({
      nome,
      email,
      telefone,
      senhaAtual,
      novaSenha,
      notificacoes
    });

    // Mensagem simples para confirmar que funcionou
    alert("Alterações guardadas!");
  };

  return (
    // Container principal das definições
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto">

      {/* Título da página */}
      <h2 className="text-2xl font-bold mb-6 text-green-700">
        Definições da Conta
      </h2>

      {/* Campo Nome */}
      <div className="mb-4">
        <label className="block mb-1">Nome</label>
        <input
          type="text"
          value={nome} // Valor ligado ao estado
          onChange={(e) => setNome(e.target.value)}
          // Atualiza o estado quando o utilizador escreve
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Campo Email */}
      <div className="mb-4">
        <label className="block mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Campo Telefone */}
      <div className="mb-4">
        <label className="block mb-1">Telefone</label>
        <input
          type="text"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Campo Senha Atual */}
      <div className="mb-4">
        <label className="block mb-1">Senha Atual</label>
        <input
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Campo Nova Senha */}
      <div className="mb-4">
        <label className="block mb-1">Nova Senha</label>
        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Opção de Notificações */}
      <div className="flex items-center gap-2 mb-6">
        <input
          type="checkbox"
          checked={notificacoes} 
          // Checkbox ligado ao estado
          onChange={(e) => setNotificacoes(e.target.checked)}
          // Atualiza com true ou false
        />
        <label>Ativar notificações</label>
      </div>

      {/* Botão para guardar as alterações */}
      <button
        onClick={guardarConta}
        // Quando clicado, chama a função guardarConta
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Guardar Alterações
      </button>
    </div>
  );
}
