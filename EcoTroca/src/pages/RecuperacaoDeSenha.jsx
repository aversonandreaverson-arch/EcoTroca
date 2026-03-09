
import { useState }      from "react";
import { Link }          from "react-router-dom";
import { recuperarSenha } from "../../api.js";
import logo              from "../assets/Ecotroca-logo-2.0.png";

export default function RecuperacaoDeSenha() {
  const [emailOuTelefone, setEmailOuTelefone] = useState('');
  const [carregando,      setCarregando]      = useState(false);
  const [sucesso,         setSucesso]         = useState(false);
  const [erro,            setErro]            = useState('');

  // Submete o pedido ao backend — backend envia email + SMS
  const handleRecuperar = async () => {
    if (!emailOuTelefone.trim()) {
      setErro('Introduz o teu email ou telefone.');
      return;
    }

    try {
      setErro('');
      setCarregando(true);
      await recuperarSenha(emailOuTelefone.trim());
      // Mostramos sempre sucesso para não revelar se a conta existe
      setSucesso(true);
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
          <p className="text-sm text-gray-600 mt-1">Conectando pessoas pela sustentabilidade</p>
        </div>

        <h2 className="text-xl font-semibold text-center text-green-900 mb-4">Recuperar senha</h2>

        {/* Ecrã de sucesso — aparece após envio */}
        {sucesso ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
              <p className="text-green-700 font-medium mb-1">📬 Instruções enviadas!</p>
              <p className="text-sm text-gray-600">
                Se existir uma conta com esses dados, receberás um email e um SMS
                com o link para redefinir a senha. Verifica também a pasta de spam.
              </p>
            </div>
            <Link
              to="/Login"
              className="text-sm font-semibold text-green-800 hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-center text-gray-600 mb-6">
              Informe o teu e-mail ou número de telefone e enviaremos instruções para redefinir a senha.
            </p>

            {/* Campo de email ou telefone */}
            <div className="flex flex-col mb-4">
              <label className="text-green-700 mb-1 text-sm">E-mail ou Telefone</label>
              <input
                type="text"
                placeholder="seu@email.com ou 9xx xxx xxx"
                value={emailOuTelefone}
                onChange={(e) => setEmailOuTelefone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRecuperar()}
                className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                {erro}
              </p>
            )}

            {/* Botão de envio */}
            <button
              onClick={handleRecuperar}
              disabled={carregando}
              className="w-full bg-green-800 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition"
            >
              {carregando ? 'A enviar...' : 'Enviar link de recuperação'}
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