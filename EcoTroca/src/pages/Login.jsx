
//  Quando o utilizador vem de /ConfirmarEmail com ?confirmado=1
//  mostra um banner verde de confirmação de email no topo.
//  O parâmetro é limpo da URL logo após ser lido.


import { useState, useEffect } from 'react';
import logo from '../assets/Ecotroca-logo-2.0.png';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../api.js';

const Login = () => {
  const navigate = useNavigate();

  // Lê os query params da URL — usado para detectar ?confirmado=1
  const [params] = useSearchParams();

  // Campos do formulário
  const [email,      setEmail]      = useState('');
  const [senha,      setSenha]      = useState('');

  // Estado de erro e carregamento
  const [erro,       setErro]       = useState('');
  const [carregando, setCarregando] = useState(false);

  // Verdadeiro quando o utilizador vem da página ConfirmarEmail com sucesso
  // Usado para mostrar o banner de "Email confirmado com sucesso!"
  const emailConfirmado = params.get('confirmado') === '1';

  // ── Limpa o ?confirmado=1 da URL ─────────────────────────
  // Remove o parâmetro visualmente sem recarregar a página.
  // Assim o banner não reaparece se o utilizador actualizar a página.
  useEffect(() => {
    if (emailConfirmado) {
      const url = new URL(window.location.href);
      url.searchParams.delete('confirmado');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // ── Submete o login ───────────────────────────────────────
  // Valida campos, chama o backend e redireciona conforme o tipo
  const handleLogin = async () => {

    // Validação mínima antes de chamar o servidor
    if (!email || !senha) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setErro('');          // limpa erros anteriores
      setCarregando(true);  // desactiva o botão enquanto espera

      // POST /api/auth/login — devolve { token, tipo_usuario, nome, id_usuario }
      const dados = await login(email, senha);

      // Redireciona cada tipo de utilizador para o seu dashboard
      if      (dados.tipo_usuario === 'admin')   navigate('/AdminDashboard');
      else if (dados.tipo_usuario === 'empresa') navigate('/DashboardEmpresa');
      else if (dados.tipo_usuario === 'coletor') navigate('/ColetadorDashboard');
      else                                       navigate('/PaginaInicial');

    } catch (err) {
      // Mostra a mensagem de erro devolvida pelo servidor
      // Pode ser: "conta não confirmada", "senha incorreta", "não encontrado"
      setErro(err.message);
    } finally {
      setCarregando(false); // liberta o botão sempre, mesmo em caso de erro
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-green-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">

        {/* Logo e tagline da plataforma */}
        <div className="text-center mb-6">
          <img className="w-35 mx-auto" src={logo} alt="EcoTroca" />
          <p className="text-sm text-gray-600 mt-1">Conectando pessoas pela sustentabilidade</p>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-center text-green-900 mb-6">
          Bem-vindo de volta
        </h2>

        {/* ── Banner de confirmação de email ───────────────
            Aparece apenas quando o utilizador vem de
            /ConfirmarEmail com ?confirmado=1 na URL.
            Desaparece automaticamente na próxima visita
            porque o parâmetro é removido do URL acima. */}
        {emailConfirmado && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
            {/* Ícone de visto */}
            <svg
              className="w-5 h-5 text-green-600 mt-0.5 shrink-0"
              fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-green-800 font-semibold text-sm">Email confirmado com sucesso!</p>
              <p className="text-green-700 text-xs mt-0.5">A tua conta está activa. Já podes fazer login.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">

          {/* Campo de email ou telefone */}
          <div className="flex flex-col">
            <label className="text-green-700 mb-1 text-sm">E-mail ou Telefone</label>
            <input
              type="text"
              placeholder="Email ou número de telefone"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Permite submeter com a tecla Enter
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {/* Campo de senha */}
          <div className="flex flex-col">
            <label className="text-green-700 mb-1 text-sm">Senha</label>
            <input
              type="password"
              placeholder="A tua senha"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {/* Mensagem de erro — inclui o aviso de conta por confirmar
              quando o utilizador tenta entrar sem ter confirmado o email */}
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

        {/* Botão de login — desactivado durante o pedido ao servidor */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={carregando}
          className="w-full mt-6 bg-green-800 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

        {/* Link para criar conta nova */}
        <p className="text-sm text-center mt-4 text-gray-600">
          Ainda não tem conta?{' '}
          <Link to="/Cadastro" className="font-semibold text-green-800 hover:underline">
            Criar Conta
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;