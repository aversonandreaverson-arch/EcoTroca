
import React, { useState } from "react";
import logo from "../assets/Ecotroca-logo-2.0.png";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api.js"; // Função central de login do api.js

const Login = () => {
  const navigate = useNavigate();

  // Campos do formulário
  const [email,      setEmail]      = useState("");
  const [senha,      setSenha]      = useState("");

  // Estado de erro e carregamento
  const [erro,       setErro]       = useState("");
  const [carregando, setCarregando] = useState(false);

  // Submete o login ao backend e redireciona conforme o tipo de conta
  const handleLogin = async () => {

    // Validação básica antes de enviar ao servidor
    if (!email || !senha) {
      setErro("Por favor, preencha todos os campos!");
      return;
    }

    try {
      setErro("");         // Limpa erros anteriores
      setCarregando(true); // Bloqueia o botão enquanto espera resposta

      // Chama o backend — POST /api/auth/login
      const dados = await login(email, senha);

      // Redireciona cada tipo de utilizador para a sua página inicial
      // Cada tipo tem um dashboard diferente na aplicação
      if (dados.tipo_usuario === "admin") {
        navigate("/AdminDashboard");     // Painel de administração
      } else if (dados.tipo_usuario === "empresa") {
        navigate("/DashboardEmpresa");   // Dashboard da empresa recicladora
      } else if (dados.tipo_usuario === "coletor") {
        navigate("/ColetadorDashboard"); // Dashboard do coletador
      } else {
        navigate("/PaginaInicial");      // Feed do utilizador comum
      }

    } catch (err) {
      // Mostra o erro devolvido pelo servidor (ex: "Senha incorreta")
      setErro(err.message);
    } finally {
      setCarregando(false); // Liberta o botão sempre, mesmo com erro
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-green-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">

        {/* Logo da plataforma */}
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

          {/* Campo de email ou telefone */}
          <div className="flex flex-col">
            <label className="text-green-700 mb-1 text-sm">E-mail ou Telefone</label>
            <input
              type="text"
              placeholder="Digite o seu email ou número de telefone"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* Campo de senha */}
          <div className="flex flex-col">
            <label className="text-green-700 mb-1 text-sm">Senha</label>
            <input
              type="password"
              placeholder="Digite a sua senha"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* Mensagem de erro do servidor */}
          {erro && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {erro}
            </p>
          )}

          {/* Link para recuperação de senha */}
          <div className="text-right">
            <Link to="/RecuperacaoDeSenha" className="text-sm text-green-800 hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        {/* Botão de login — fica "Entrando..." enquanto espera o servidor */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={carregando}
          className="w-full mt-6 bg-green-800 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        {/* Link para registo de nova conta */}
        <p className="text-sm text-center mt-4 text-gray-600">
          Ainda não tem conta?{" "}
          <Link to="/Cadastro" className="font-semibold text-green-800 hover:underline">
            Criar Conta
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;