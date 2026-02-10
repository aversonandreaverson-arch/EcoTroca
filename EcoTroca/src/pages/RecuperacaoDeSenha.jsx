import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/Ecotroca-logo-2.0.png";


const RecuperacaoDeSenha = () => {
  const [emailOuTelefone, setEmailOuTelefone] = useState("");

  const handleRecuperar = () => {
    // Aqui você enviaria para o back-end um email/SMS com token
    if (!emailOuTelefone) {
      alert("Por favor, informe seu email ou telefone.");
      return;
    }
    alert(`Link de recuperação enviado para: ${emailOuTelefone}`);
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
 */}          <p className="text-sm text-gray-600 mt-1">Conectando pessoas pela sustentabilidade</p>
        </div>

        {/* Texto */}
        <h2 className="text-xl font-semibold text-center text-green-900 mb-4">Recuperar senha</h2>
        <p className="text-sm text-center text-gray-600 mb-6">
          Informe o seu e-mail ou número de telefone e enviaremos instruções para redefinir sua senha.
        </p>

        {/* Campo */}
        <div className="flex flex-col mb-4">
          <label className="text-green-700 mb-1 text-sm">E-mail ou Telefone</label>
          <input
            type="text"
            placeholder="seu@email.com"
            value={emailOuTelefone}
            onChange={(e) => setEmailOuTelefone(e.target.value)}
            className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Botão */}
        <button
          onClick={handleRecuperar}
          className="w-full bg-green-800 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
        >
          Enviar link de recuperação
        </button>

        {/* Voltar */}
        <p className="text-sm text-center mt-4 text-gray-600">
          Lembrou da senha?{" "}
          <Link to="/login" className="font-semibold text-green-800 hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RecuperacaoDeSenha;
