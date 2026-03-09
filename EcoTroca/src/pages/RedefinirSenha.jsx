// ============================================================
//  RedefinirSenha.jsx — Página de redefinição de senha
//  Guardar em: src/Components/RedefinirSenha.jsx
//
//  URL esperada: /RedefinirSenha/:token
//  O token vem no link enviado por email/SMS pelo backend
//
//  Fluxo:
//    1. Utilizador chega aqui pelo link do email/SMS
//    2. Introduz a nova senha e confirma
//    3. Chama POST /api/auth/redefinir-senha/:token via api.js
//    4. Backend valida o token, verifica expiração, guarda hash bcrypt
//    5. Redireciona para o login após sucesso
// ============================================================

import { useState }       from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { redefinirSenha } from "../api.js";
import logo               from "../assets/Ecotroca-logo-2.0.png";

export default function RedefinirSenha() {
  // Token que veio no URL — ex: /RedefinirSenha/abc123def456...
  const { token }   = useParams();
  const navigate    = useNavigate();

  const [senha,          setSenha]          = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando,     setCarregando]     = useState(false);
  const [sucesso,        setSucesso]        = useState(false);
  const [erro,           setErro]           = useState('');

  // Submete a nova senha ao backend com o token da URL
  const handleRedefinir = async () => {
    if (!senha || !confirmarSenha) {
      setErro('Preenche todos os campos.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    try {
      setErro('');
      setCarregando(true);
      // Envia o token (da URL) + nova senha ao backend
      await redefinirSenha(token, senha);
      setSucesso(true);
      // Redireciona para o login após 2 segundos
      setTimeout(() => navigate('/Login'), 2000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-green-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img className="w-35" src={logo} alt="logo-EcoTroca" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-center text-green-900 mb-4">Redefinir senha</h2>

        {/* Ecrã de sucesso — aparece após redefinição */}
        {sucesso ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
              <p className="text-green-700 font-medium mb-1">✅ Senha redefinida!</p>
              <p className="text-sm text-gray-600">
                A tua senha foi alterada com sucesso. Serás redirecionado para o login.
              </p>
            </div>
            <Link to="/Login" className="text-sm font-semibold text-green-800 hover:underline">
              Ir para o login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-center text-gray-600 mb-6">
              Digita a nova senha e confirma para redefinir o acesso à tua conta.
            </p>

            <div className="flex flex-col space-y-4">
              {/* Campo nova senha */}
              <div className="flex flex-col">
                <label className="text-green-700 mb-1 text-sm">Nova Senha</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Campo confirmar senha */}
              <div className="flex flex-col">
                <label className="text-green-700 mb-1 text-sm">Confirmar Nova Senha</label>
                <input
                  type="password"
                  placeholder="Repete a nova senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRedefinir()}
                  className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                {erro}
              </p>
            )}

            {/* Botão de redefinição */}
            <button
              onClick={handleRedefinir}
              disabled={carregando}
              className="w-full mt-6 bg-green-800 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition"
            >
              {carregando ? 'A redefinir...' : 'Redefinir senha'}
            </button>

            {/* Voltar ao login */}
            <p className="text-sm text-center mt-4 text-gray-600">
              Lembrou da senha?{' '}
              <Link to="/Login" className="font-semibold text-green-800 hover:underline">
                Voltar para o login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}