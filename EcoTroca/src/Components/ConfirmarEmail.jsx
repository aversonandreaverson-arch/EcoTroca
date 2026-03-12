
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import logo from '../assets/Ecotroca-logo-2.0.png';

// URL base da API — usa variável de ambiente ou fallback local
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ConfirmarEmail() {
  // Lê o token do segmento dinâmico da URL: /ConfirmarEmail/:token
  const { token }  = useParams();
  const navigate   = useNavigate();

  // Estado do processo: 'a_verificar' | 'sucesso' | 'erro'
  const [estado,   setEstado]   = useState('a_verificar');
  const [mensagem, setMensagem] = useState('');

  // Contador regressivo de 5 segundos exibido no estado de sucesso
  const [contador, setContador] = useState(5);

  //  Chama o backend ao montar
  // Só corre uma vez — o token não muda
  useEffect(() => {
    const confirmar = async () => {
      try {
        // Chama GET /api/auth/confirmarEmail/:token
        // O nome da rota usa camelCase para ser consistente com o projecto
        const res  = await fetch(`${API}/auth/confirmarEmail/${token}`);
        const data = await res.json();

        // Se o servidor devolveu erro (token inválido/expirado) lança excepção
        if (!res.ok) throw new Error(data.erro || 'Erro ao confirmar email.');

        setEstado('sucesso');
        setMensagem(data.mensagem);
      } catch (err) {
        setEstado('erro');
        setMensagem(err.message);
      }
    };

    confirmar();
  }, [token]);

  // ── Contagem regressiva após sucesso 
  // Arranca quando o estado muda para 'sucesso'
  // Redireciona para Login com ?confirmado=1 ao chegar a zero
  useEffect(() => {
    if (estado !== 'sucesso') return;

    const intervalo = setInterval(() => {
      setContador(prev => {
        if (prev <= 1) {
          clearInterval(intervalo);
          navigate('/Login?confirmado=1');
        }
        return prev - 1;
      });
    }, 1000);

    // Limpa o intervalo se o componente for desmontado antes do fim
    return () => clearInterval(intervalo);
  }, [estado, navigate]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-green-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">

        {/* Logo da plataforma */}
        <img src={logo} alt="EcoTroca" className="h-10 mx-auto mb-6" />

        {/* ── A verificar ──────────────────────────────── */}
        {estado === 'a_verificar' && (
          <div>
            {/* Spinner animado enquanto aguarda resposta do servidor */}
            <div className="w-14 h-14 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <p className="text-gray-600">A verificar o teu email...</p>
          </div>
        )}

        {/* ── Sucesso ──────────────────────────────────── */}
        {estado === 'sucesso' && (
          <div>
            {/* Ícone de visto verde */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-800 mb-2">Email confirmado!</h2>
            <p className="text-gray-600 text-sm mb-6">{mensagem}</p>
            {/* Contador regressivo — o utilizador sabe que vai ser redirecionado */}
            <p className="text-gray-400 text-sm mb-4">
              A redirecionar em{' '}
              <span className="font-bold text-green-700">{contador}s</span>...
            </p>
            {/* Botão para quem não quer esperar os 5 segundos */}
            <Link
              to="/Login?confirmado=1"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Ir para o Login
            </Link>
          </div>
        )}

        {/* ── Erro ─────────────────────────────────────── */}
        {estado === 'erro' && (
          <div>
            {/* Ícone de X vermelho */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Link inválido</h2>
            <p className="text-gray-600 text-sm mb-6">{mensagem}</p>
            <Link
              to="/Login"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Ir para o Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}