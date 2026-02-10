import React, { useState } from "react";
import logo from "../assets/Ecotroca-logo-2.0.png";
import { Link, useParams } from "react-router-dom";

const RedefinirSenha = () => {
  const { token } = useParams(); // token enviado no email/SMS
  console.log ("token123:", token)
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const handleRedefinir = () => {
    if (!senha || !confirmarSenha) {
      alert("Preencha todos os campos.");
      return;
    }
    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem.");
      return;
    }
    // Aqui vai enviar para o back-end a nova senha junto com o token
    alert("Senha redefinida com sucesso!");
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-green-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="flex items-center justify-center gap-2">
                <img className="w-35" src={logo} alt="logo-EcoTroca" />
            </div>
          </div>
{/*           <h1 className="text-2xl font-bold text-green-900">EcoTroca</h1>
 */}          
{/*  <p className="text-sm text-gray-600 mt-1">Conectando pessoas pela sustentabilidade</p>
 */}        </div>

        {/* Texto */}
        <h2 className="text-xl font-semibold text-center text-green-900 mb-4">Redefinir senha</h2>
        <p className="text-sm text-center text-gray-600 mb-6">
          Digite a nova senha abaixo e confirme para redefinir sua senha.
        </p>

        {/* Campos */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col">
            <label className="text-green-700 mb-1 text-sm">Nova Senha</label>
            <input
              type="password"
              placeholder="Digite a senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-green-700 mb-1 text-sm">Confirmar Nova Senha</label>
            <input
              type="password"
              placeholder="Confirme a senha "
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Botão */}
        <button
          onClick={handleRedefinir}
          className="w-full mt-6 bg-green-800 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
        >
          Redefinir senha
        </button>

        {/* Voltar */}
        <p className="text-sm text-center mt-4 text-gray-600">
          Lembrou da senha?{" "}
          <Link to="/Login" className="font-semibold text-green-800 hover:underline">
            Voltar para o login
          </Link>
          
        </p>
      </div>
    </div>
  );
};

export default RedefinirSenha;
