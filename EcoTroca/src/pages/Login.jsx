import React, { useState } from "react";
import logo from "../assets/Ecotroca-logo-2.0.png";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleLogin = () => {
    // Simulação simples: se campos não estiverem vazios, "logar"
    if (email && senha) {
      // Aqui você poderia salvar algo no localStorage se quiser persistência
      alert(`Bem-vindo, ${email}!`);
      navigate("/UserProfile"); // redireciona para a página de perfil
    } else {
      alert("Por favor, preencha todos os campos!");
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-green-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2">
            <img className="w-35" src={logo} alt="logo-EcoTroca" />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Conectando pessoas pela sustentabilidade
          </p>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-center text-green-900 mb-6">
          Bem-vindo de volta
        </h2>

        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-green-700 mb-1 text-sm">
              E-mail ou Telefone
            </label>
            <input
              type="text"
              placeholder="Digite o seu email ou o número de telefone"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-green-700 mb-1 text-sm">
              Senha
            </label>
            <input
              type="password"
              placeholder="Digite a sua senha"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <div className="text-right">
            <Link
              to="/RecuperacaodeSenha"
              className="text-sm text-green-800 hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full mt-6 bg-green-800 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
        >
          Entrar
        </button>

        <p className="text-sm text-center mt-4 text-gray-600">
          Ainda não tem conta?{" "}
          <Link
            to="/Cadastro"
            className="font-semibold text-green-800 hover:underline"
          >
            Criar Conta
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
